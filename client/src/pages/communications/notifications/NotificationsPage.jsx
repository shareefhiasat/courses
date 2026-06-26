import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import Joyride from 'react-joyride';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { useAuth } from '@contexts/AuthContext';
import useNotificationsFeed from '@hooks/useNotificationsFeed';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { formatDateTime } from '@utils/date';
import { Button, Input, Select, Badge, Container } from '@ui';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import PortalTooltip from '@ui/PortalTooltip';
import { ToggleSwitch } from '@ui';
import { 
  NOTIFICATION_TYPES, 
  NOTIFICATION_STATUS,
  getNotificationIcon,
  getNotificationTypeOptions,
  getNotificationStatusOptions
} from '@constants/notificationTypes.jsx';
import { RECORD_TYPES } from '@utils/sharedTypes';
import useNotifications from '@hooks/useNotifications';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { ABSENCE_TYPES } from '@constants/absenceTypes';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';

const NotificationsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { startLoading } = useGlobalLoading();
  const { data: lookupData } = useLookupTypes({
    types: ['penalty-types']
  });
  const {
    notifications,
    unreadCount,
    loading: feedLoading,
    refresh,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archive,
    remove
  } = useNotificationsFeed({ limit: 100, archived: false });
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);
  const { 
    settings: notificationSettings, 
    updateSetting,
    triggerNotification,
    checkSupport,
    isMobile
  } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unread, read, archived
  const [filterCategory, setFilterCategory] = useState('all'); // all, activity, message, announcement, grade, etc.
  const [filterPenaltyType, setFilterPenaltyType] = useState('all');
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState('all');
  const [filterAbsenceType, setFilterAbsenceType] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const isDark = theme === 'dark';

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const tourSeenKey = `notifTourSeen_${lang}`;
  const tourSteps = useMemo(() => [
    { target: 'body', content: t('tour.notif_realtime'), disableBeacon: true, placement: 'center' },
    { target: '[data-tour="notif-search"]', content: t('tour.notif_search'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="notif-filters"]', content: t('tour.notif_filters'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="notif-type-toggle"]', content: t('tour.notif_type_toggle'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="notif-mark-read"]', content: t('tour.notif_mark_read'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="notif-list"]', content: t('tour.notif_list'), disableBeacon: true, placement: 'top' },
    { target: '[data-tour="notif-list"]', content: t('tour.notif_actions'), disableBeacon: true, placement: 'top' },
  ], [lang, t]);
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  useEffect(() => { try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {} }, [tourSeenKey]);
  const handleTourCallback = useCallback((data) => {
    const { status } = data || {};
    if (status === 'finished' || status === 'skipped') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  // Sync notification settings with useNotifications hook
  useEffect(() => {
    setSoundEnabled(notificationSettings.soundEnabled);
    setVibrationEnabled(notificationSettings.vibrationEnabled);
    setBrowserNotificationsEnabled(notificationSettings.browserNotificationsEnabled);
  }, [notificationSettings]);


  // Load programs, subjects, classes for filters
  const loadFilters = useCallback(async () => {
    try {
      const [programsRes, subjectsRes, classesRes] = await Promise.all([
        getPrograms(),
        getSubjects(),
        getClasses()
      ]);
      if (programsRes.success) setPrograms(programsRes.data || []);
      if (subjectsRes.success) setSubjects(subjectsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by read status
    if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.isRead && !n.isArchived);
    } else if (filterType === 'read') {
      filtered = filtered.filter(n => n.isRead && !n.isArchived);
    } else if (filterType === 'archived') {
      filtered = filtered.filter(n => n.isArchived);
    } else if (!showArchived) {
      filtered = filtered.filter(n => !n.isArchived);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.type === filterCategory);
    }

    // Filter by penalty type
    if (filterPenaltyType !== 'all' && filterCategory === RECORD_TYPES.PENALTY) {
      filtered = filtered.filter(n => n.metadata?.penaltyType === filterPenaltyType);
    }

    // Filter by attendance status
    if (filterAttendanceStatus !== 'all' && filterCategory === RECORD_TYPES.ATTENDANCE) {
      filtered = filtered.filter(n => n.metadata?.attendanceStatus === filterAttendanceStatus);
    }

    // Filter by absence type
    if (filterAbsenceType !== 'all' && filterCategory === NOTIFICATION_TYPES.ATTENDANCE) {
      filtered = filtered.filter(n => n.metadata?.absenceType === filterAbsenceType);
    }

    // Filter by program/subject/class/year/semester
    if (filterProgram !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        const subjectId = n.data?.subjectId || n.metadata?.subjectId;
        if (classId) {
          const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
          if (classItem?.subjectId) {
            const subject = subjects.find(s => String(s.docId || s.id) === String(classItem.subjectId));
            return String(subject?.programId) === String(filterProgram);
          }
        }
        if (subjectId) {
          const subject = subjects.find(s => String(s.docId || s.id) === String(subjectId));
          return String(subject?.programId) === String(filterProgram);
        }
        return false;
      });
    }

    if (filterSubject !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        const subjectId = n.data?.subjectId || n.metadata?.subjectId;
        if (classId) {
          const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
          return String(classItem?.subjectId) === String(filterSubject);
        }
        return String(subjectId) === String(filterSubject);
      });
    }

    if (filterClass !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        return String(classId) === String(filterClass);
      });
    }

    if (filterYear !== 'all') {
      filtered = filtered.filter(n => {
        const classId = n.data?.classId || n.classId;
        if (classId) {
          const classItem = classes.find(c => String(c.id || c.docId) === String(classId));
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
          const subject = subjects.find(s => String(s.docId || s.id) === String(subjectId));
          return String(subject?.semester) === String(filterSemester);
        }
        return false;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        (n.title || '').toLowerCase().includes(term) ||
        (n.message || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [notifications, filterType, filterCategory, filterPenaltyType, filterAttendanceStatus, filterAbsenceType, filterProgram, filterSubject, filterClass, filterYear, filterSemester, searchTerm, showArchived, subjects, classes]);

  const archivedCount = notifications.filter(n => n.isArchived).length;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return t('notifications_just_now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('notifications_minutes_ago')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('notifications_hours_ago')}`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}${t('notifications_days_ago')}`;
    return formatDateTime(date);
  };

  const handleMarkAsRead = async (notificationId) => {
    setLoading(true);
    try {
      await markAsRead(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    setLoading(true);
    try {
      await markAsUnread(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (notificationId) => {
    setLoading(true);
    try {
      await archive(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!confirm(t('notifications_delete_notification'))) return;
    setLoading(true);
    try {
      await remove(notificationId);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      await markAllAsRead();
    } finally {
      setLoading(false);
    }
  };

  const handleTestBrowserNotification = async () => {
    if (checkSupport().notification) {
      try {
        await triggerNotification('default', t('notifications_test_notification'), t('notifications_test_notification_message'));
      } catch (error) {
        error('Failed to send test notification:', error);
      }
    }
  };

  const gotoFromNotification = async (n) => {
    if (!n.isRead) await handleMarkAsRead(n.id);

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
      case NOTIFICATION_TYPES.PARTICIPATION:
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
  };

  // Use GlobalLoading for initial data load
  useLayoutEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const stopGlobalLoading = startLoading();
    // useNotificationsFeed handles loading automatically
    // We just need to stop the global loading when feed is done
    if (!feedLoading) {
      stopGlobalLoading();
    }

    return () => {
      stopGlobalLoading();
    };
  }, [authLoading, user, startLoading, feedLoading]);

  return (
    <Container maxWidth="xl" style={{ padding: '2rem', minHeight: '100vh', background: isDark ? '#0f0f1e' : '#f9fafb' }}>
      <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCallback} scrollOffset={100} scrollToFirstStep
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: isDark ? '#e5e7eb' : '#111', backgroundColor: isDark ? '#1f2937' : '#fff', zIndex: 10000 } }}
      />
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        background: isDark ? '#1a1a2e' : '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: isDark ? '#fff' : '#111' }}>
            Notifications
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button type="button" onClick={() => setRunTour(true)} style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', padding:'0.35rem 0.65rem', fontSize:'0.8125rem', borderRadius:'6px', border:'none', background:'var(--color-primary,#800020)', color:'white', cursor:'pointer' }}><span style={{fontWeight:700}}>?</span><span>{t('tour_help') || 'Tour'}</span></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getThemedIcon('ui', 'volume2', 18, theme)}
              <ToggleSwitch
                label=""
                checked={soundEnabled}
                onChange={async (checked) => {
                  await updateSetting('soundEnabled', checked);
                }}
              />
            </div>
            {checkSupport().vibration && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getThemedIcon('ui', 'vibrate', 18, theme)}
                <ToggleSwitch
                  label=""
                  checked={vibrationEnabled}
                  onChange={async (checked) => {
                    await updateSetting('vibrationEnabled', checked);
                  }}
                />
              </div>
            )}
            {checkSupport().notification && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getThemedIcon('ui', 'bell', 18, theme)}
                <ToggleSwitch
                  label=""
                  checked={browserNotificationsEnabled}
                  onChange={async (checked) => {
                    await updateSetting('browserNotificationsEnabled', checked);
                  }}
                />
                <PortalTooltip content={t('test_browser_notification')} position="top">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTestBrowserNotification}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  {getThemedIcon('ui', 'test_tube', 16, theme)}
                </Button>
              </PortalTooltip>
              </div>
            )}
            {unreadCount > 0 && (
              <Button
                data-tour="notif-mark-read"
                size="sm"
                variant="ghost"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div data-tour="notif-search" style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            {getThemedIcon('ui', 'search', 18, theme)}
            <Input
              type="text"
              placeholder={t('search_notifications') || 'Search notifications...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '3rem',
                background: isDark ? '#0f0f1e' : '#fff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                color: isDark ? '#fff' : '#111'
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div data-tour="notif-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={getNotificationStatusOptions(t, lang).map(option => ({
              ...option,
              label: option.value === 'unread' ? `Unread (${unreadCount})` : 
                     option.value === 'archived' ? `Archived (${archivedCount})` : 
                     option.label
            }))}
            size="small"
            fullWidth
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
            fullWidth
          />
          {filterCategory === RECORD_TYPES.PENALTY && (
            <Select
              value={filterPenaltyType}
              onChange={(e) => setFilterPenaltyType(e.target.value)}
              options={[
                { value: 'all', label: t('all_penalty_types') || 'All Penalty Types' },
                ...(lookupData['penalty-types'] || []).map(pt => ({ value: pt.id, label: pt.nameEn }))
              ]}
              size="small"
              fullWidth
            />
          )}
          {filterCategory === RECORD_TYPES.ATTENDANCE && (
            <Select
              value={filterAttendanceStatus}
              onChange={(e) => setFilterAttendanceStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: ATTENDANCE_STATUS.PRESENT, label: 'Present' },
                { value: ATTENDANCE_STATUS.LATE, label: 'Late' },
                { value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: 'Absent' },
                { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: 'Absent Excused' },
                { value: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: 'Excused Leave' },
                { value: ATTENDANCE_STATUS.HUMAN_CASE, label: 'Human Case' }
              ]}
              size="small"
              fullWidth
            />
          )}
          {filterCategory === NOTIFICATION_TYPES.ATTENDANCE && (
            <Select
              value={filterAbsenceType}
              onChange={(e) => setFilterAbsenceType(e.target.value)}
              options={[
                { value: 'all', label: t('all_absence_types') || 'All Absence Types' },
                ...ABSENCE_TYPES.map(at => ({ value: at.id, label: at.label_en }))
              ]}
              size="small"
              fullWidth
            />
          )}
        </div>
        
        {/* Academic Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Select
            value={filterProgram}
            onChange={(e) => {
              setFilterProgram(e.target.value);
              setFilterSubject('all');
              setFilterClass('all');
            }}
            options={[
              { value: 'all', label: 'All Programs' },
              ...(programs || []).map(p => ({
                value: p.docId || p.id,
                label: p.nameEn || p.name || p.code || p.docId
              }))
            ]}
            size="small"
            searchable
            fullWidth
          />
          <Select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setFilterClass('all');
            }}
            options={[
              { value: 'all', label: 'All Subjects' },
              ...(subjects || [])
                .filter(s => filterProgram === 'all' || String(s.programId) === String(filterProgram))
                .map(s => ({
                  value: s.docId || s.id,
                  label: `${s.code || ''} - ${s.nameEn || s.name || s.docId}`.trim()
                }))
            ]}
            size="small"
            searchable
            fullWidth
          />
          <Select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            options={[
              { value: 'all', label: 'All Classes' },
              ...(classes || [])
                .filter(c => {
                  if (filterSubject !== 'all' && String(c.subjectId) !== String(filterSubject)) return false;
                  if (filterProgram !== 'all') {
                    const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                    if (!subject || String(subject.programId) !== String(filterProgram)) return false;
                  }
                  return true;
                })
                .map(c => ({
                  value: c.id || c.docId,
                  label: `${c.name || c.code || 'Unnamed'}${c.term ? ` (${c.term})` : ''}`
                }))
            ]}
            size="small"
            searchable
            fullWidth
          />
          <Select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            options={[
              { value: 'all', label: 'All Years' },
              ...Array.from(new Set((classes || []).map(c => {
                if (c.year) return String(c.year);
                if (c.term && c.term.includes(' ')) {
                  const parts = c.term.split(' ');
                  if (parts.length > 1 && !isNaN(parts[parts.length - 1])) {
                    return parts[parts.length - 1];
                  }
                }
                return null;
              }).filter(Boolean))).sort((a, b) => Number(b) - Number(a)).map(y => ({ value: y, label: y }))
            ]}
            size="small"
            fullWidth
          />
          <Select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            options={[
              { value: 'all', label: t('all_semesters') || 'All Semesters' },
              ...Array.from(new Set((subjects || []).map(s => s.semester).filter(Boolean))).map(v => ({ value: v, label: v }))
            ]}
            size="small"
            fullWidth
          />
        </div>
      </div>

      {/* Notifications List */}
      <div data-tour="notif-list" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {filteredNotifications.length === 0 ? (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: isDark ? '#1a1a2e' : '#ffffff',
            borderRadius: '12px',
            color: isDark ? '#9ca3af' : '#6b7280'
          }}>
            {getThemedIcon('ui', 'bell', 64, theme)}
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>
              {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                ? 'No notifications match your filters'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => gotoFromNotification(notification)}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: notification.isRead 
                  ? (isDark ? 'rgba(255,255,255,0.02)' : '#ffffff')
                  : (isDark ? 'rgba(128,0,32,0.15)' : '#f0f4ff'),
                border: `1px solid ${notification.isRead 
                  ? (isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb')
                  : (isDark ? 'rgba(128,0,32,0.3)' : '#c7d2fe')}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark 
                  ? 'rgba(255,255,255,0.05)' 
                  : '#f3f4f6';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = notification.isRead 
                  ? (isDark ? 'rgba(255,255,255,0.02)' : '#ffffff')
                  : (isDark ? 'rgba(128,0,32,0.15)' : '#f0f4ff');
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                {getNotificationIcon(notification.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    fontWeight: notification.isRead ? 500 : 600,
                    fontSize: '1rem',
                    color: isDark ? '#fff' : '#111',
                    lineHeight: 1.4
                  }}>
                    {notification.title}
                  </div>
                  {!notification.isRead && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      background: 'var(--color-primary, #800020)',
                      borderRadius: '50%',
                      flexShrink: 0,
                      marginTop: '0.25rem'
                    }} />
                  )}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  lineHeight: 1.5,
                  marginBottom: '0.5rem',
                  wordBreak: 'break-word'
                }}>
                  {notification.message}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: isDark ? '#6b7280' : '#9ca3af',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{formatTime(notification.createdAt)}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                    {!notification.isRead ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        title={t('mark_as_read') || 'Mark as read'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#9ca3af' : '#6b7280',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {getThemedIcon('ui', 'eye', 16, theme)}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsUnread(notification.id);
                        }}
                        title={t('mark_as_unread') || 'Mark as unread'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#9ca3af' : '#6b7280',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {getThemedIcon('ui', 'eye_off', 16, theme)}
                      </button>
                    )}
                    {!notification.isArchived ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(notification.id);
                        }}
                        title={t('archive') || 'Archive'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#9ca3af' : '#6b7280',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {getThemedIcon('ui', 'archive', 16, theme)}
                      </button>
                    ) : null}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      title={t('delete') || 'Delete'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#9ca3af' : '#6b7280',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280';
                      }}
                    >
                      {getThemedIcon('ui', 'trash2', 16, theme)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Container>
  );
};

export default NotificationsPage;
