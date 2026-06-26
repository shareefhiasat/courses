import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Joyride from 'react-joyride';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@contexts/AuthContext';
import {
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  markNotificationUnread,
  deleteNotification
} from '@services/business/notificationService';
import { useLang } from '@contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { warn, error } from '@services/utils/logger.js';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  getNotificationIcon,
  getNotificationTypeOptions,
  getNotificationStatusOptions
} from '@constants/notificationTypes.jsx';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { formatDateTime } from '@utils/date';
import Input from './Input';
import Select from './Select';
import Badge from './Badge';
import ToggleSwitch from './ToggleSwitch';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { ABSENCE_TYPES } from '@constants/absenceTypes';
import PortalTooltip from './PortalTooltip/PortalTooltip';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { ActivityLogger } from '@services/other/activityLogger';
import useNotifications from '@hooks/useNotifications';
import useNotificationsFeed from '@hooks/useNotificationsFeed';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';

const CATEGORY_COLORS = {
  ASSESSMENT: '#3b82f6',
  COMMUNICATION: '#f59e0b',
  ANNOUNCEMENT: '#06b6d4',
  ATTENDANCE: '#f97316',
  WORKFLOW: '#8b5cf6',
  BEHAVIOR: '#ec4899',
  FILE: '#6366f1',
  QR: '#14b8a6',
  PARTICIPATION: '#22c55e',
  PENALTY: '#ef4444',
  RESOURCE: '#6366f1',
  ACADEMIC: '#3b82f6',
  SYSTEM: '#6b7280'
};

const getCategoryColor = (type) => CATEGORY_COLORS[type] || '#6b7280';

const getDateGroup = (timestamp) => {
  if (!timestamp) return 'Earlier';
  const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notifDate.getTime() === today.getTime()) return 'Today';
  if (notifDate.getTime() === yesterday.getTime()) return 'Yesterday';
  if (now - date < 7 * 86400000) return 'This Week';
  return 'Earlier';
};

const GROUP_LABELS = { Today: 'Today', Yesterday: 'Yesterday', 'This Week': 'This Week', Earlier: 'Earlier' };

const NotificationDrawer = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const tourSeenKey = `notifDrawerTourSeen_${lang}`;
  const tourSteps = useMemo(() => [
    { target: '[data-tour="notif-drawer-header"]', content: t('tour.notif_drawer_header'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-search"]', content: t('tour.notif_drawer_search'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-mark-all"]', content: t('tour.notif_drawer_mark_all'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-settings"]', content: t('tour.notif_drawer_settings'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-list"]', content: t('tour.notif_drawer_list'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-list"]', content: t('tour.notif_drawer_actions'), disableBeacon: true, placement: 'left' },
  ], [lang, t]);
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  useEffect(() => { if (isOpen) { try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {} } }, [isOpen, tourSeenKey]);
  const handleTourCallback = useCallback((data) => {
    const { status } = data || {};
    if (status === 'finished' || status === 'skipped') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────
  const navigate = useNavigate();
  const { data: lookupData } = useLookupTypes({
    types: ['penalty-types']
  });
  const {
    settings: notificationSettings,
    updateSetting,
    triggerNotification,
    checkSupport
  } = useNotifications();

  const {
    notifications,
    unreadCount,
    refresh
  } = useNotificationsFeed({ limit: 100, archived: false });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPenaltyType, setFilterPenaltyType] = useState('all');
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState('all');
  const [filterAbsenceType, setFilterAbsenceType] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const drawerRef = useRef(null);
  const { isRTL } = useLang();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!user || !isOpen) return;
    refresh();
  }, [user, isOpen, refresh]);

  useEffect(() => {
    if (!isOpen || !showAdvanced) return;
    (async () => {
      try {
        const [programsRes, subjectsRes, classesRes] = await Promise.all([
          getPrograms(), getSubjects(), getClasses()
        ]);
        if (programsRes.success) setPrograms(programsRes.data || []);
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
        if (classesRes.success) setClasses(classesRes.data || []);
      } catch {}
    })();
  }, [isOpen, showAdvanced]);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filterType === NOTIFICATION_STATUS.UNREAD) {
      filtered = filtered.filter(n => !n.isRead && !n.isArchived);
    } else if (filterType === NOTIFICATION_STATUS.READ) {
      filtered = filtered.filter(n => n.isRead && !n.isArchived);
    } else if (filterType === NOTIFICATION_STATUS.ARCHIVED) {
      filtered = filtered.filter(n => n.isArchived);
    } else if (!showArchived) {
      filtered = filtered.filter(n => !n.isArchived);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.type === filterCategory);
    }

    if (filterPenaltyType !== 'all' && filterCategory === RECORD_TYPES.PENALTY) {
      filtered = filtered.filter(n => n.metadata?.penaltyType === filterPenaltyType);
    }

    if (filterAttendanceStatus !== 'all' && filterCategory === RECORD_TYPES.ATTENDANCE) {
      filtered = filtered.filter(n => n.metadata?.attendanceStatus === filterAttendanceStatus);
    }

    if (filterAbsenceType !== 'all' && filterCategory === NOTIFICATION_TYPES.ATTENDANCE) {
      filtered = filtered.filter(n => n.metadata?.absenceType === filterAbsenceType);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        (n.title || '').toLowerCase().includes(term) ||
        (n.message || '').toLowerCase().includes(term)
      );
    }

    if (filterProgram !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        const subjectId = n.data?.subjectId || n.metadata?.subjectId;
        if (classId) {
          const classItem = classes.find(c => (c.id || c.docId) === classId);
          if (classItem?.subjectId) {
            const subject = subjects.find(s => (s.docId || s.id) === classItem.subjectId);
            return subject?.programId === filterProgram;
          }
        }
        if (subjectId) {
          const subject = subjects.find(s => (s.docId || s.id) === subjectId);
          return subject?.programId === filterProgram;
        }
        return false;
      });
    }

    if (filterSubject !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        const subjectId = n.data?.subjectId || n.metadata?.subjectId;
        if (classId) {
          const classItem = classes.find(c => (c.id || c.docId) === classId);
          return classItem?.subjectId === filterSubject;
        }
        return subjectId === filterSubject;
      });
    }

    if (filterClass !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        return classId === filterClass;
      });
    }

    if (filterYear !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        if (classId) {
          const classItem = classes.find(c => (c.id || c.docId) === classId);
          if (classItem?.year && String(classItem.year) === filterYear) return true;
          if (classItem?.term && classItem.term.includes(' ')) {
            const parts = classItem.term.split(' ');
            if (parts.length > 1 && parts[parts.length - 1] === filterYear) return true;
          }
        }
        return false;
      });
    }

    if (filterSemester !== 'all') {
      filtered = filtered.filter(n => {
        const subjectId = n.data?.subjectId || n.metadata?.subjectId;
        if (subjectId) {
          const subject = subjects.find(s => (s.docId || s.id) === subjectId);
          return subject?.semester === filterSemester;
        }
        return false;
      });
    }

    return filtered;
  }, [notifications, filterType, filterCategory, filterPenaltyType, filterAttendanceStatus, filterAbsenceType, searchTerm, showArchived, filterProgram, filterSubject, filterClass, filterYear, filterSemester, subjects, classes]);

  const groupedNotifications = useMemo(() => {
    const groups = {};
    filteredNotifications.forEach(n => {
      const group = getDateGroup(n.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    });
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    return order.filter(g => groups[g]).map(g => ({ label: GROUP_LABELS[g], items: groups[g] }));
  }, [filteredNotifications]);

  const archivedCount = notifications.filter(n => n.isArchived).length;

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return t('notifications.just_now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('notifications.minutes_ago')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('notifications.hours_ago')}`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}${t('notifications.days_ago')}`;
    return formatDateTime(date);
  }, [formatDateTime, t]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(notificationSettings.soundEnabled);
    setVibrationEnabled(notificationSettings.vibrationEnabled);
    setBrowserNotificationsEnabled(notificationSettings.browserNotificationsEnabled);
  }, [notificationSettings]);

  const handleTestBrowserNotification = useCallback(async () => {
    if (checkSupport().notification) {
      try {
        await triggerNotification('default', t('test_notification') || 'Test Notification', t('test_browser_notification_message') || 'This is a test browser notification!');
      } catch (err) {
        error('Failed to send test notification:', err);
      }
    }
  }, [checkSupport, triggerNotification, t]);

  const handleMarkAsRead = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      await ActivityLogger.notificationDismissed(notificationId);
    } catch (logError) {
      warn('Failed to log notification dismissed activity:', logError);
    }
    try {
      await markNotificationRead(notificationId);
    } catch {}
  }, []);

  const handleMarkAsUnread = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      await markNotificationUnread(notificationId);
    } catch {}
  }, []);

  const handleArchive = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      await archiveNotification(notificationId);
    } catch {}
  }, []);

  const handleDelete = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    if (!confirm(t('notifications.delete_confirmation'))) return;
    try {
      await deleteNotification(notificationId);
    } catch {}
  }, [t]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      await markAllNotificationsRead(user.uid);
    } catch {}
  }, [unreadCount, markAllNotificationsRead, user]);

  const gotoFromNotification = useCallback(async (n) => {
    try {
      await ActivityLogger.notificationClicked(n.id, n.type);
    } catch (logError) {
      warn('Failed to log notification clicked activity:', logError);
    }

    if (!n.isRead) await handleMarkAsRead(n.id);

    // If the notification has a link, use it directly
    if (n.link) {
      navigate(n.link);
      return;
    }

    const type = (n.type || n.category || '').toUpperCase();
    const data = n.data || n.metadata || {};

    switch (type) {
      case NOTIFICATION_TYPES.ASSESSMENT:
        if (data.activityId) navigate(`/activity/${data.activityId}`);
        else if (data.quizId) navigate(`/quiz/${data.quizId}`);
        else if (data.assignmentId) navigate(`/assignments/${data.assignmentId}`);
        else navigate('/?mode=quizzes');
        break;
      case NOTIFICATION_TYPES.COMMUNICATION:
        if (data.roomId || data.messageId) {
          let dest = data.classId || 'global';
          if (data.roomId) dest = `dm:${data.roomId}`;
          navigate(data.messageId ? `/chat?dest=${encodeURIComponent(dest)}&msgId=${data.messageId}` : `/chat?dest=${encodeURIComponent(dest)}`);
        } else {
          navigate('/chat');
        }
        break;
      case NOTIFICATION_TYPES.ANNOUNCEMENT:
        if (data.announcementId) navigate(`/announcements/${data.announcementId}`);
        else navigate('/announcements');
        break;
      case NOTIFICATION_TYPES.ATTENDANCE:
        navigate('/student-dashboard');
        break;
      case NOTIFICATION_TYPES.WORKFLOW:
        if (data.workflowId) navigate(`/workflows/${data.workflowId}`);
        else navigate('/workflows');
        break;
      case NOTIFICATION_TYPES.BEHAVIOR:
        navigate('/student-dashboard');
        break;
      case NOTIFICATION_TYPES.PARTICIPATION:
        navigate('/student-dashboard');
        break;
      case NOTIFICATION_TYPES.PENALTY:
        navigate('/student-dashboard');
        break;
      case NOTIFICATION_TYPES.FILE:
        if (data.fileId) navigate(`/drive?fileId=${data.fileId}`);
        else navigate('/drive');
        break;
      case NOTIFICATION_TYPES.RESOURCE:
        if (data.resourceId) navigate(`/resources/${data.resourceId}`);
        else navigate('/resources');
        break;
      case NOTIFICATION_TYPES.QR:
        navigate('/qr-scanner');
        break;
      case NOTIFICATION_TYPES.ACADEMIC:
        if (data.enrollmentId) navigate(`/enrollments/${data.enrollmentId}`);
        else navigate('/');
        break;
      case NOTIFICATION_TYPES.SYSTEM:
      default:
        navigate('/');
        break;
    }
  }, [navigate, handleMarkAsRead]);

  if (!isOpen || !user) return null;

  const inputStyle = {
    background: isDark ? '#0f0f1e' : '#fff',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
    color: isDark ? '#fff' : '#111'
  };

  const iconBtnStyle = (isHovered = false) => ({
    background: isHovered ? 'var(--color-primary, #800020)' : 'transparent',
    border: 'none',
    color: isHovered ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'),
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  });

  return (
    <>
      <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCallback} scrollOffset={80} scrollToFirstStep
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10100 } }}
      />
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
          backdropFilter: 'blur(2px)'
        }}
      />

      <div
        ref={drawerRef}
        data-tour="notif-drawer-header"
        style={{
          position: 'fixed',
          top: 0,
          [isRTL ? 'left' : 'right']: 0,
          height: '100vh',
          width: 'min(420px, 90vw)',
          background: isDark ? '#1a1a2e' : '#ffffff',
          boxShadow: isRTL ? '2px 0 20px rgba(0,0,0,0.15)' : '-2px 0 20px rgba(0,0,0,0.15)',
          zIndex: 1002,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : (isRTL ? 'translateX(-100%)' : 'translateX(100%)'),
          transition: 'transform 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '1rem 1rem 0.75rem',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          background: isDark ? '#0f0f1e' : '#f9fafb'
        }}>
          {/* Title Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: isDark ? '#fff' : '#111' }}>
                {t('notifications.title')}
              </h2>
              {unreadCount > 0 && (
                <Badge variant="danger" size="sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button type="button" onClick={() => setRunTour(true)} style={{ display:'inline-flex', alignItems:'center', padding:'0.3rem 0.55rem', fontSize:'0.8rem', borderRadius:'6px', border:'none', background:'var(--color-primary,#800020)', color:'white', cursor:'pointer', fontWeight:700 }}>?</button>
              {unreadCount > 0 && (
                <PortalTooltip content={t('notifications.mark_all_read')} position="top">
                  <button data-tour="notif-drawer-mark-all" onClick={handleMarkAllAsRead} style={iconBtnStyle(false)}
                    onMouseEnter={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(true)) }}
                    onMouseLeave={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(false)) }}
                  >
                    {getThemedIcon('ui', 'check_circle', 18, theme)}
                  </button>
                </PortalTooltip>
              )}
              <PortalTooltip content={t('notifications.settings') || 'Settings'} position="top">
                <button
                  data-tour="notif-drawer-settings"
                  onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings) }}
                  style={{
                    ...iconBtnStyle(false),
                    background: showSettings ? 'rgba(128,0,32,0.15)' : 'transparent',
                    color: showSettings ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280')
                  }}
                  onMouseEnter={(e) => { if (!showSettings) Object.assign(e.currentTarget.style, iconBtnStyle(true)) }}
                  onMouseLeave={(e) => { if (!showSettings) Object.assign(e.currentTarget.style, iconBtnStyle(false)) }}
                >
                  {getThemedIcon('ui', 'settings', 18, theme)}
                </button>
              </PortalTooltip>
              <PortalTooltip content={t('open_in_new_tab')} position="top">
                <button
                  onClick={(e) => { e.stopPropagation(); window.open('/notifications', '_blank') }}
                  style={iconBtnStyle(false)}
                  onMouseEnter={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(true)) }}
                  onMouseLeave={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(false)) }}
                >
                  {getThemedIcon('ui', 'external_link', 18, theme)}
                </button>
              </PortalTooltip>
              <PortalTooltip content={t('close')} position="top">
                <button onClick={onClose} style={iconBtnStyle(false)}
                  onMouseEnter={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(true)) }}
                  onMouseLeave={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(false)) }}
                >
                  {getThemedIcon('ui', 'close', 20, theme)}
                </button>
              </PortalTooltip>
            </div>
          </div>

          {/* Search */}
          <div data-tour="notif-drawer-search" style={{ marginBottom: '0.6rem' }}>
            <Input
              type="text"
              placeholder={t('search_notifications') || 'Search notifications...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Compact Filters */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={getNotificationStatusOptions(t, lang).map(option => ({
                ...option,
                label: option.value === NOTIFICATION_STATUS.UNREAD ? `Unread (${unreadCount})` :
                       option.value === NOTIFICATION_STATUS.ARCHIVED ? `Archived (${archivedCount})` :
                       option.label
              }))}
              size="small"
              style={{ flex: 1, minWidth: '80px', fontSize: '0.75rem' }}
            />
            <Select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterPenaltyType('all');
                setFilterAttendanceStatus('all');
                setFilterAbsenceType('all');
              }}
              options={[{ value: 'all', label: t('all_categories') || 'All' }, ...getNotificationTypeOptions(t, lang)]}
              size="small"
              style={{ flex: 1, minWidth: '80px', fontSize: '0.75rem' }}
            />
            {filterCategory === RECORD_TYPES.PENALTY && (
              <Select
                value={filterPenaltyType}
                onChange={(e) => setFilterPenaltyType(e.target.value)}
                options={[
                  { value: 'all', label: t('all_penalty_types') || 'All' },
                  ...(lookupData['penalty-types'] || []).map(pt => ({ value: pt.id, label: pt.nameEn || pt.code }))
                ]}
                size="small"
                style={{ flex: 1, minWidth: '100px', fontSize: '0.75rem' }}
              />
            )}
            {filterCategory === RECORD_TYPES.ATTENDANCE && (
              <Select
                value={filterAttendanceStatus}
                onChange={(e) => setFilterAttendanceStatus(e.target.value)}
                options={[
                  { value: 'all', label: t('all_statuses') || 'All' },
                  { value: ATTENDANCE_STATUS.PRESENT, label: t('present') || 'Present' },
                  { value: ATTENDANCE_STATUS.LATE, label: t('late') || 'Late' },
                  { value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: t('absent_no_excuse') || 'Absent (No Excuse)' },
                  { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: t('absent_with_excuse') || 'Absent (With Excuse)' },
                  { value: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: t('excused_leave') || 'Excused Leave' },
                  { value: ATTENDANCE_STATUS.HUMAN_CASE, label: t('human_case') || 'Human Case' }
                ]}
                size="small"
                style={{ flex: 1, minWidth: '100px', fontSize: '0.75rem' }}
              />
            )}
            {filterCategory === NOTIFICATION_TYPES.ATTENDANCE && (
              <Select
                value={filterAbsenceType}
                onChange={(e) => setFilterAbsenceType(e.target.value)}
                options={[
                  { value: 'all', label: t('all_absence_types') || 'All' },
                  ...ABSENCE_TYPES.map(at => ({ value: at.id, label: at.label_en }))
                ]}
                size="small"
                style={{ flex: 1, minWidth: '100px', fontSize: '0.75rem' }}
              />
            )}
          </div>

          {/* ── Advanced Toggle ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAdvanced(!showAdvanced) }}
              style={{
                background: 'transparent',
                border: 'none',
                color: showAdvanced ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'),
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {getThemedIcon('ui', 'filter', 13, theme)}
              <span
                style={{
                  display: 'inline-block',
                  minWidth: '6em',
                  textAlign: 'center'
                }}
              >
                {showAdvanced ? 'Hide advanced filters' : 'Advanced filters'}
              </span>
            </button>
          </div>

          {/* ── Collapsible Advanced Filters ── */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  marginTop: '0.4rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '0.3rem'
                }}>
                  <Select
                    value={filterProgram}
                    onChange={(e) => { setFilterProgram(e.target.value); setFilterSubject('all'); setFilterClass('all') }}
                    options={[
                      { value: 'all', label: t('all_programs') || 'All Programs' },
                      ...(programs || []).map(p => ({ value: p.docId || p.id, label: p.nameEn || p.name || p.code || p.docId }))
                    ]}
                    size="small" searchable fullWidth style={{ fontSize: '0.75rem' }}
                  />
                  <Select
                    value={filterSubject}
                    onChange={(e) => { setFilterSubject(e.target.value); setFilterClass('all') }}
                    options={[
                      { value: 'all', label: t('all_subjects') || 'All Subjects' },
                      ...(subjects || []).filter(s => filterProgram === 'all' || s.programId === filterProgram).map(s => ({
                        value: s.docId || s.id,
                        label: `${s.code || ''} - ${s.nameEn || s.name || s.docId}`.trim()
                      }))
                    ]}
                    size="small" searchable fullWidth style={{ fontSize: '0.75rem' }}
                  />
                  <Select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    options={[
                      { value: 'all', label: t('all_classes') || 'All Classes' },
                      ...(classes || []).filter(c => {
                        if (filterSubject !== 'all' && c.subjectId !== filterSubject) return false;
                        if (filterProgram !== 'all') {
                          const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                          if (!subject || subject.programId !== filterProgram) return false;
                        }
                        return true;
                      }).map(c => ({ value: c.id || c.docId, label: `${c.name || c.code || 'Unnamed'}${c.term ? ` (${c.term})` : ''}` }))
                    ]}
                    size="small" searchable fullWidth style={{ fontSize: '0.75rem' }}
                  />
                  <Select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    options={[
                      { value: 'all', label: t('notifications.all_years') },
                      ...Array.from(new Set((classes || []).map(c => {
                        if (c.year) return String(c.year);
                        if (c.term && c.term.includes(' ')) {
                          const parts = c.term.split(' ');
                          if (parts.length > 1 && !isNaN(parts[parts.length - 1])) return parts[parts.length - 1];
                        }
                        return null;
                      }).filter(Boolean))).sort((a, b) => Number(b) - Number(a)).map(y => ({ value: y, label: y }))
                    ]}
                    size="small" fullWidth
                  />
                  <Select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    options={[
                      { value: 'all', label: t('notifications.all_semesters') },
                      ...Array.from(new Set((subjects || []).map(s => s.semester).filter(Boolean))).map(v => ({ value: v, label: v }))
                    ]}
                    size="small" fullWidth
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Collapsible Settings Panel ── */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  marginTop: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {getThemedIcon('ui', 'volume', 16, theme)}
                    <ToggleSwitch label="" checked={soundEnabled} onChange={async (c) => { await updateSetting('soundEnabled', c) }} />
                  </div>
                  {checkSupport().vibration && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getThemedIcon('ui', 'vibrate', 16, theme)}
                      <ToggleSwitch label="" checked={vibrationEnabled} onChange={async (c) => { await updateSetting('vibrationEnabled', c) }} />
                    </div>
                  )}
                  {checkSupport().notification && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getThemedIcon('ui', 'bell', 16, theme)}
                      <ToggleSwitch label="" checked={browserNotificationsEnabled} onChange={async (c) => { await updateSetting('browserNotificationsEnabled', c) }} />
                      <PortalTooltip content={t('test_browser_notification')} position="top">
                        <button onClick={handleTestBrowserNotification} style={iconBtnStyle(false)}
                          onMouseEnter={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(true)) }}
                          onMouseLeave={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(false)) }}
                        >
                          {getThemedIcon('ui', 'test', 14, theme)}
                        </button>
                      </PortalTooltip>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Notifications List ── */}
        <div data-tour="notif-drawer-list" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem 0.75rem'
        }}>
          {groupedNotifications.length === 0 ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: isDark ? '#9ca3af' : '#6b7280'
            }}>
              {getThemedIcon('ui', 'bell', 48, theme)}
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                  ? t('no_notifications_match_filters') || 'No notifications match your filters'
                  : t('no_notifications_yet') || 'No notifications yet'}
              </p>
            </div>
          ) : (
            groupedNotifications.map(group => (
              <div key={group.label} style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDark ? '#6b7280' : '#9ca3af',
                  padding: '0.5rem 0.25rem 0.35rem',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6'}`,
                  marginBottom: '0.35rem'
                }}>
                  {group.label}
                </div>
                {group.items.map((notification, idx) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    onClick={() => gotoFromNotification(notification)}
                    onMouseEnter={() => setHoveredCard(notification.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      padding: '0.65rem 0.75rem',
                      marginBottom: '0.35rem',
                      borderRadius: '8px',
                      background: notification.isRead
                        ? (isDark ? 'rgba(255,255,255,0.02)' : '#fafafa')
                        : (isDark ? 'rgba(128,0,32,0.12)' : '#f0f4ff'),
                      border: `1px solid ${notification.isRead
                        ? (isDark ? 'rgba(255,255,255,0.04)' : '#e5e7eb')
                        : (isDark ? 'rgba(128,0,32,0.25)' : '#c7d2fe')}`,
                      borderLeft: `4px solid ${getCategoryColor(notification.type)}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    whileHover={{ scale: 1.01, x: 2 }}
                  >
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0, marginTop: '0.125rem', opacity: 0.7 }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          marginBottom: '0.15rem'
                        }}>
                          <div style={{
                            fontWeight: notification.isRead ? 500 : 600,
                            fontSize: '0.875rem',
                            color: isDark ? '#fff' : '#111',
                            lineHeight: 1.4
                          }}>
                            {notification.title}
                          </div>
                          {!notification.isRead && (
                            <div style={{
                              width: '7px',
                              height: '7px',
                              background: 'var(--color-primary, #800020)',
                              borderRadius: '50%',
                              flexShrink: 0,
                              marginTop: '0.3rem'
                            }} />
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: isDark ? '#9ca3af' : '#6b7280',
                          lineHeight: 1.4,
                          marginBottom: '0.2rem',
                          wordBreak: 'break-word'
                        }}>
                          {notification.message}
                        </div>
                        <div style={{
                          fontSize: '0.65rem',
                          color: isDark ? '#6b7280' : '#9ca3af',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>{formatTime(notification.createdAt)}</span>

                          {/* Hover-reveal action buttons */}
                          <AnimatePresence>
                            {hoveredCard === notification.id && (
                              <motion.div
                                initial={{ opacity: 0, x: 4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 4 }}
                                transition={{ duration: 0.15 }}
                                style={{ display: 'flex', gap: '1px' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {notification.isRead ? (
                                  <PortalTooltip content={t('mark_as_unread')} position="top">
                                    <button onClick={(e) => handleMarkAsUnread(notification.id, e)} style={{...iconBtnStyle(false), padding: '3px'}}
                                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '3px'}) }}
                                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '3px'}) }}
                                    >
                                      {getThemedIcon('ui', 'eye_off', 13, theme)}
                                    </button>
                                  </PortalTooltip>
                                ) : (
                                  <PortalTooltip content={t('mark_as_read')} position="top">
                                    <button onClick={(e) => handleMarkAsRead(notification.id, e)} style={{...iconBtnStyle(false), padding: '3px'}}
                                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '3px'}) }}
                                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '3px'}) }}
                                    >
                                      {getThemedIcon('ui', 'eye', 13, theme)}
                                    </button>
                                  </PortalTooltip>
                                )}
                                {!notification.isArchived && (
                                  <PortalTooltip content={t('archive')} position="top">
                                    <button onClick={(e) => handleArchive(notification.id, e)} style={{...iconBtnStyle(false), padding: '3px'}}
                                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '3px'}) }}
                                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '3px'}) }}
                                    >
                                      {getThemedIcon('ui', 'archive', 13, theme)}
                                    </button>
                                  </PortalTooltip>
                                )}
                                <PortalTooltip content={t('delete')} position="top">
                                  <button onClick={(e) => handleDelete(notification.id, e)} style={{...iconBtnStyle(false), padding: '3px'}}
                                    onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '3px'}) }}
                                    onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '3px'}) }}
                                  >
                                    {getThemedIcon('ui', 'trash', 13, theme)}
                                  </button>
                                </PortalTooltip>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDrawer;
