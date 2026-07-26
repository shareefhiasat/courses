import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { warn, error } from '@services/utils/logger.js';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  getNotificationIcon,
  getNotificationTypeOptions,
  getNotificationStatusOptions,
  getCategoryColor,
  getNotificationBorderColor
} from '@constants/notificationTypes.jsx';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import useResizableDrawer from '@hooks/useResizableDrawer';
import { formatDateTime } from '@utils/date';
import { formatNotificationTime, filterNotifications as filterNotificationsUtil, groupNotificationsByDate, gotoFromNotification as gotoFromNotificationUtil, WORKFLOW_NOTIFICATION_STATUS_FILTERS, getWorkflowSubgroupColor, getWorkflowStatusKey, getLocalizedNotificationTitle } from '@utils/notificationHelpers';
import Input from './Input';
import Select from './Select';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { ABSENCE_TYPES } from '@constants/absenceTypes';
import PortalTooltip from './PortalTooltip/PortalTooltip';
import { ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { ActivityLogger } from '@services/other/activityLogger';
import useNotifications from '@hooks/useNotifications';
import { getPrograms, getSubjects } from '@services/business/programService';
import { getClasses } from '@services/business/classService';
import { useToast } from '@ui';

// ── Notification Card (extracted for reuse in sub-groups) ──────────────────
const NotificationCard = ({ notification, idx, isDark, isRTL, theme, t, lang, formatTime, hoveredCard, setHoveredCard, gotoFromNotification, handleMarkAsRead, handleMarkAsUnread, handleArchive, handleUnarchive, handleDelete, iconBtnStyle, getNotificationIcon, getCategoryColor, getNotificationBorderColor, PortalTooltip, getThemedIcon, motion, AnimatePresence, programs, classes }) => {
  const borderColor = getNotificationBorderColor(notification);
  const accentColor = borderColor || getCategoryColor(notification.type);
  const iconEl = getNotificationIcon(notification.type, 20);
  const data = notification.data || notification.metadata || {};
  const localizedTitle = getLocalizedNotificationTitle(notification, t);
  const rawWorkflowName = data.workflowName || notification.message;
  const messageText =
    notification.event?.startsWith('workflow.') && rawWorkflowName
      ? getLocalizedWorkflowName(rawWorkflowName, t)
      : (notification.message || data.message || data.body || notification.body || '');
  const showMessage = messageText && messageText !== localizedTitle && messageText.trim() !== '';
  const classId = data.classId || notification.classId;
  const classItem = classId ? classes.find(c => String(c.id || c.docId) === String(classId)) : null;
  const programId = data.programId || classItem?.programId;
  const program = programId ? programs.find(p => String(p.id || p.docId) === String(programId)) : null;
  const programName = program
    ? (lang === 'ar' ? (program.nameAr || program.nameEn || program.name || program.code) : (program.nameEn || program.name || program.code))
    : '';
  const className = classItem
    ? (lang === 'ar' ? (classItem.nameAr || classItem.nameEn || classItem.name || classItem.code) : (classItem.name || classItem.code || ''))
    : '';
  const contextParts = [programName, className].filter(Boolean);
  const contextLabel = contextParts.join(' · ');
  return (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.02 }}
      onClick={() => gotoFromNotification(notification)}
      onMouseEnter={() => setHoveredCard(notification.id)}
      onMouseLeave={() => setHoveredCard(null)}
      style={{
        padding: '0.7rem 0.8rem',
        marginBottom: '0.4rem',
        borderRadius: '10px',
        background: notification.isRead
          ? (isDark ? 'rgba(255,255,255,0.02)' : '#fafafa')
          : (isDark ? 'rgba(128,0,32,0.10)' : '#f0f4ff'),
        border: `1px solid ${notification.isRead
          ? (isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb')
          : (isDark ? 'rgba(128,0,32,0.25)' : '#c7d2fe')}`,
        [isRTL ? 'borderRight' : 'borderLeft']: `4px solid ${borderColor}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative'
      }}
      whileHover={{ scale: 1.01, x: 2 }}
    >
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, marginTop: '0.125rem', color: accentColor }}>
          {React.cloneElement(iconEl, { color: accentColor })}
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
              fontWeight: notification.isRead ? 400 : 600,
              fontSize: '0.82rem',
              color: isDark ? '#fff' : '#111',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexWrap: 'wrap'
            }}>
              {localizedTitle}
            </div>
            {!notification.isRead && (
              <div style={{
                width: '8px',
                height: '8px',
                background: 'var(--color-primary, #800020)',
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: '0.25rem',
                boxShadow: '0 0 4px var(--color-primary, #800020)'
              }} />
            )}
          </div>
          {showMessage && (
            <div style={{
              fontSize: '0.78rem',
              color: isDark ? '#b0b8c4' : '#555',
              lineHeight: 1.5,
              marginBottom: '0.3rem',
              wordBreak: 'break-word',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {messageText}
            </div>
          )}
          <div style={{
            fontSize: '0.66rem',
            color: accentColor,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: 0.85
          }}>
            <span>{formatTime(notification.createdAt)}</span>
            {contextLabel && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {getThemedIcon('ui', 'tag', 10, isDark ? '#94a3b8' : '#64748b')}
                <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{contextLabel}</span>
              </span>
            )}
          </div>

          <AnimatePresence>
            {hoveredCard === notification.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  [isRTL ? 'left' : 'right']: '0.5rem',
                  display: 'flex',
                  gap: '2px',
                  background: isDark ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.95)',
                  borderRadius: '6px',
                  padding: '2px',
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {notification.isRead ? (
                  <PortalTooltip content={t('mark_as_unread')} position="top">
                    <button onClick={(e) => handleMarkAsUnread(notification.id, e)} style={{...iconBtnStyle(false), padding: '4px'}}
                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '4px'}) }}
                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '4px'}) }}
                    >
                      {getThemedIcon('ui', 'eye_off', 14, hoveredCard === notification.id ? 'currentColor' : theme)}
                    </button>
                  </PortalTooltip>
                ) : (
                  <PortalTooltip content={t('mark_as_read')} position="top">
                    <button onClick={(e) => handleMarkAsRead(notification.id, e)} style={{...iconBtnStyle(false), padding: '4px'}}
                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '4px'}) }}
                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '4px'}) }}
                    >
                      {getThemedIcon('ui', 'eye', 14, hoveredCard === notification.id ? 'currentColor' : theme)}
                    </button>
                  </PortalTooltip>
                )}
                {notification.isArchived ? (
                  <PortalTooltip content={t('unarchive')} position="top">
                    <button onClick={(e) => handleUnarchive(notification.id, e)} style={{...iconBtnStyle(false), padding: '4px'}}
                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '4px'}) }}
                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '4px'}) }}
                    >
                      {getThemedIcon('ui', 'inbox', 14, hoveredCard === notification.id ? 'currentColor' : theme)}
                    </button>
                  </PortalTooltip>
                ) : (
                  <PortalTooltip content={t('archive')} position="top">
                    <button onClick={(e) => handleArchive(notification.id, e)} style={{...iconBtnStyle(false), padding: '4px'}}
                      onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '4px'}) }}
                      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '4px'}) }}
                    >
                      {getThemedIcon('ui', 'archive', 14, hoveredCard === notification.id ? 'currentColor' : theme)}
                    </button>
                  </PortalTooltip>
                )}
                <PortalTooltip content={t('delete')} position="top">
                  <button onClick={(e) => handleDelete(notification.id, e)} style={{...iconBtnStyle(false), padding: '4px'}}
                    onMouseEnter={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(true), padding: '4px'}) }}
                    onMouseLeave={(e) => { Object.assign(e.currentTarget.style, {...iconBtnStyle(false), padding: '4px'}) }}
                  >
                    {getThemedIcon('ui', 'trash', 14, hoveredCard === notification.id ? 'currentColor' : theme)}
                  </button>
                </PortalTooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const NotificationDrawer = ({ isOpen, onClose, feed, initialFilters = null }) => {
  const { user, isHR, isAdmin, isSuperAdmin } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'notification_drawer_width',
    defaultWidth: 480,
    minWidth: 320,
    maxWidth: 800,
    isRTL,
  });

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const tourSeenKey = `notifDrawerTourSeen_${lang}`;
  const tourSteps = useMemo(() => [
    { target: '[data-tour="notif-drawer-header"]', content: t('tour.notif_drawer_header'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-search"]', content: t('tour.notif_drawer_search'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-mark-all"]', content: t('tour.notif_drawer_mark_all'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-list"]', content: t('tour.notif_drawer_list'), disableBeacon: true, placement: 'left' },
    { target: '[data-tour="notif-drawer-list"]', content: t('tour.notif_drawer_actions'), disableBeacon: true, placement: 'left' },
  ], [t]);
  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);
  useEffect(() => { if (isOpen) { try { if (!localStorage.getItem(tourSeenKey) && !window.__joyrideActive) setRunTour(true); } catch {} } }, [isOpen, tourSeenKey]);
  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); window.__joyrideActive = false; try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
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
    refresh,
    markAsRead: hookMarkAsRead,
    markAllAsRead: hookMarkAllAsRead,
    markAsUnread: hookMarkAsUnread,
    archive: hookArchive,
    unarchive: hookUnarchive,
    remove: hookRemove
  } = feed || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPenaltyType, setFilterPenaltyType] = useState('all');
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState('all');
  const [filterAbsenceType, setFilterAbsenceType] = useState('all');
  const [filterWorkflowStatus, setFilterWorkflowStatus] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
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
  const isDark = theme === 'dark';
  const toast = useToast();

  useEffect(() => {
    if (!user || !isOpen) return;
    refresh();
  }, [user, isOpen, refresh]);

  useEffect(() => {
    if (!isOpen || !initialFilters) return;
    const {
      filterClass,
      filterSubject,
      filterProgram,
      filterYear,
      filterSemester,
      showAdvanced: openAdvanced,
    } = initialFilters;
    if (filterClass && filterClass !== 'all') setFilterClass(String(filterClass));
    if (filterSubject && filterSubject !== 'all') setFilterSubject(String(filterSubject));
    if (filterProgram && filterProgram !== 'all') setFilterProgram(String(filterProgram));
    if (filterYear && filterYear !== 'all') setFilterYear(String(filterYear));
    if (filterSemester && filterSemester !== 'all') setFilterSemester(String(filterSemester));
    if (openAdvanced) setShowAdvanced(true);
  }, [isOpen, initialFilters]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [programsRes, subjectsRes, classesRes] = await Promise.all([
          getPrograms(), getSubjects(), getClasses()
        ]);
        if (programsRes.success) setPrograms(programsRes.data || []);
        else warn('NotificationDrawer: programs API returned no success', { programsRes });
        if (subjectsRes.success) setSubjects(subjectsRes.data || []);
        else warn('NotificationDrawer: subjects API returned no success', { subjectsRes });
        if (classesRes.success) setClasses(classesRes.data || []);
        else warn('NotificationDrawer: classes API returned no success', { classesRes });
      } catch (err) {
        error('NotificationDrawer: Failed to load filter data', { err });
      }
    })();
  }, [isOpen]);

  const filteredNotifications = useMemo(() => {
    let feed = notifications;
    if (isHR && !isAdmin && !isSuperAdmin) {
      feed = notifications.filter((n) => getWorkflowStatusKey(n) !== 'REJECTED');
    }
    return filterNotificationsUtil({
      notifications: feed,
      filterType,
      filterCategory,
      filterPenaltyType,
      filterAttendanceStatus,
      filterAbsenceType,
      searchTerm,
      showArchived,
      filterProgram,
      filterSubject,
      filterClass,
      filterYear,
      filterSemester,
      filterWorkflowStatus,
      subjects,
      classes
    });
  }, [notifications, filterType, filterCategory, filterPenaltyType, filterAttendanceStatus, filterAbsenceType, searchTerm, showArchived, filterProgram, filterSubject, filterClass, filterYear, filterSemester, filterWorkflowStatus, subjects, classes, isHR, isAdmin, isSuperAdmin]);

  const hasActiveFilters = searchTerm.trim()
    || filterProgram !== 'all'
    || filterSubject !== 'all'
    || filterClass !== 'all'
    || filterYear !== 'all'
    || filterSemester !== 'all'
    || filterWorkflowStatus !== 'all';

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterProgram('all');
    setFilterSubject('all');
    setFilterClass('all');
    setFilterYear('all');
    setFilterSemester('all');
    setFilterWorkflowStatus('all');
  }, []);

  const workflowStatusCounts = useMemo(() => {
    const counts = {};
    WORKFLOW_NOTIFICATION_STATUS_FILTERS.forEach((chip) => {
      if (chip.hideForHR && isHR && !isAdmin && !isSuperAdmin) return;
      counts[chip.id] = 0;
    });
    notifications.forEach((n) => {
      if (n.isArchived && !showArchived && filterType !== NOTIFICATION_STATUS.ARCHIVED) return;
      if (!(n.type || '').startsWith('WORKFLOW')) return;
      const key = getWorkflowStatusKey(n);
      WORKFLOW_NOTIFICATION_STATUS_FILTERS.forEach((chip) => {
        if (chip.matchKeys ? chip.matchKeys.includes(key) : chip.id === key) {
          if (counts[chip.id] === undefined) counts[chip.id] = 0;
          counts[chip.id] += 1;
        }
      });
    });
    return counts;
  }, [notifications, showArchived, filterType, isHR, isAdmin, isSuperAdmin]);

  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications, t);
  }, [filteredNotifications, t]);

  const archivedCount = notifications.filter(n => n.isArchived).length;
  const readCount = notifications.filter(n => n.isRead && !n.isArchived).length;

  const formatTime = useCallback((timestamp) => {
    return formatNotificationTime(timestamp, t);
  }, [t]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(notificationSettings.soundEnabled);
    setBrowserNotificationsEnabled(notificationSettings.browserNotificationsEnabled);
  }, [notificationSettings]);

  const handleMarkAsRead = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      await ActivityLogger.notificationDismissed(notificationId);
    } catch (logError) {
      warn('Failed to log notification dismissed activity:', logError);
    }
    try {
      const success = await hookMarkAsRead(notificationId);
      if (success) toast.success(t('notification_marked_read'));
    } catch {}
  }, [hookMarkAsRead, toast, t]);

  const handleMarkAsUnread = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      const success = await hookMarkAsUnread(notificationId);
      if (success) toast.success(t('notification_marked_unread'));
    } catch {}
  }, [hookMarkAsUnread, toast, t]);

  const handleArchive = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      const result = await hookArchive(notificationId);
      if (result) {
        toast.success(t('notification_archived'));
      } else {
        console.error('[NotificationDrawer] Archive failed - server returned false');
      }
    } catch (err) {
      console.error('[NotificationDrawer] Archive error:', err);
    }
  }, [hookArchive, toast, t]);

  const handleUnarchive = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      const result = await hookUnarchive(notificationId);
      if (result) {
        toast.success(t('notification_unarchived'));
      } else {
        console.error('[NotificationDrawer] Unarchive failed - server returned false');
      }
    } catch (err) {
      console.error('[NotificationDrawer] Unarchive error:', err);
    }
  }, [hookUnarchive, toast, t]);

  const handleDelete = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    if (!confirm(t('notifications.delete_confirmation'))) return;
    try {
      const result = await hookRemove(notificationId);
      if (result) {
        toast.success(t('notification_deleted'));
      } else {
        console.error('[NotificationDrawer] Delete failed - server returned false');
      }
    } catch (err) {
      console.error('[NotificationDrawer] Delete error:', err);
    }
  }, [t, hookRemove, toast]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      const success = await hookMarkAllAsRead();
      if (success) toast.success(t('notifications_all_read'));
    } catch {}
  }, [unreadCount, hookMarkAllAsRead, toast, t]);

  const gotoFromNotification = useCallback(async (n) => {
    try {
      await ActivityLogger.notificationClicked(n.id, n.type);
    } catch (logError) {
      warn('Failed to log notification clicked activity:', logError);
    }
    await gotoFromNotificationUtil(n, navigate, hookMarkAsRead);
    onClose?.();
  }, [navigate, hookMarkAsRead, onClose]);

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
      <Joyride continuous run={runTour} steps={tourSteps} callback={handleTourCallback} scrollOffset={80} scrollToFirstStep showSkipButton showProgress tooltipComponent={TourTooltipComponent}
        locale={{ back: t('tour_back'), close: t('tour_close'), last: t('tour_finish'), next: t('tour_next'), skip: t('tour_skip') }}
        styles={{ options: { primaryColor: 'var(--color-primary,#800020)', textColor: theme === 'dark' ? '#e5e7eb' : '#111', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', zIndex: 10100 } }}
      />
      <style>{`
        @keyframes notif-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
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
          width: drawerWidth,
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <Input
                type="text"
                placeholder={t('search_notifications')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              
              {/* Pushable settings icon buttons */}
              <PortalTooltip content={t('notifications_sound_enabled')} position="top">
                <button
                  onClick={(e) => { e.stopPropagation(); updateSetting('soundEnabled', !soundEnabled) }}
                  style={{
                    ...iconBtnStyle(false),
                    background: soundEnabled ? 'rgba(128,0,32,0.15)' : 'transparent',
                    color: soundEnabled ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'),
                    opacity: soundEnabled ? 1 : 0.4
                  }}
                  onMouseEnter={(e) => { if (!soundEnabled) Object.assign(e.currentTarget.style, iconBtnStyle(true)) }}
                  onMouseLeave={(e) => { if (!soundEnabled) Object.assign(e.currentTarget.style, { ...iconBtnStyle(false), opacity: 0.4 }) }}
                >
                  {getThemedIcon('ui', 'volume', 18, soundEnabled ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'))}
                </button>
              </PortalTooltip>
              {checkSupport().notification && (
                <PortalTooltip content={t('notifications_browser_notifications')} position="top">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateSetting('browserNotificationsEnabled', !browserNotificationsEnabled) }}
                    style={{
                      ...iconBtnStyle(false),
                      background: browserNotificationsEnabled ? 'rgba(128,0,32,0.15)' : 'transparent',
                      color: browserNotificationsEnabled ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'),
                      opacity: browserNotificationsEnabled ? 1 : 0.4
                    }}
                    onMouseEnter={(e) => { if (!browserNotificationsEnabled) Object.assign(e.currentTarget.style, iconBtnStyle(true)) }}
                    onMouseLeave={(e) => { if (!browserNotificationsEnabled) Object.assign(e.currentTarget.style, { ...iconBtnStyle(false), opacity: 0.4 }) }}
                  >
                    {getThemedIcon('ui', 'monitor', 18, browserNotificationsEnabled ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'))}
                  </button>
                </PortalTooltip>
              )}
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

          {/* Status Filter Icons + Academic Filter Toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', alignItems: 'center' }}>
            {[
              { value: 'all', icon: 'inbox', label: t('all') || 'All' },
              { value: NOTIFICATION_STATUS.UNREAD, icon: 'circle', label: t('unread') || 'Unread', count: unreadCount },
              { value: NOTIFICATION_STATUS.READ, icon: 'check_circle', label: t('read') || 'Read', count: readCount },
              { value: NOTIFICATION_STATUS.ARCHIVED, icon: 'archive', label: t('archived') || 'Archived', count: archivedCount },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => { setFilterType(opt.value); if (opt.value === NOTIFICATION_STATUS.ARCHIVED) setShowArchived(true); }}
                style={{
                  background: filterType === opt.value ? 'rgba(128,0,32,0.12)' : 'transparent',
                  border: `1px solid ${filterType === opt.value ? 'var(--color-primary, #800020)' : (isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb')}`,
                  color: filterType === opt.value ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'),
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: filterType === opt.value ? 600 : 400,
                  transition: 'all 0.2s ease',
                }}
              >
                {getThemedIcon('ui', opt.icon, 14, filterType === opt.value ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'))}
                <span>{opt.label}</span>
                {opt.count != null && opt.count > 0 && (
                  <span style={{
                    background: filterType === opt.value ? 'var(--color-primary, #800020)' : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
                    color: filterType === opt.value ? '#fff' : (isDark ? '#9ca3af' : '#6b7280'),
                    borderRadius: '10px',
                    padding: '0 6px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    minWidth: '18px',
                    textAlign: 'center',
                  }}>{opt.count}</span>
                )}
              </button>
            ))}
            <PortalTooltip content={t('academic_filters') || 'Academic Filters'} position="top">
              <button
                onClick={(e) => { e.stopPropagation(); setShowAdvanced(!showAdvanced) }}
                style={{
                  background: showAdvanced ? 'rgba(128,0,32,0.12)' : 'transparent',
                  border: `1px solid ${showAdvanced ? 'var(--color-primary, #800020)' : (isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb')}`,
                  color: showAdvanced ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'),
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: showAdvanced ? 600 : 400,
                  transition: 'all 0.2s ease',
                  marginLeft: 'auto',
                }}
              >
                {getThemedIcon('ui', 'sliders_horizontal', 14, showAdvanced ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'))}
                <span>{t('filters') || 'Filters'}</span>
              </button>
            </PortalTooltip>
          </div>

          {/* Workflow status legend chips */}
          {Object.values(workflowStatusCounts).some((c) => c > 0) && (
            <div style={{
              display: 'flex',
              gap: '0.35rem',
              flexWrap: 'wrap',
              marginBottom: '0.5rem',
              alignItems: 'center',
            }}>
              <button
                type="button"
                onClick={() => setFilterWorkflowStatus('all')}
                style={{
                  background: filterWorkflowStatus === 'all' ? 'rgba(128,0,32,0.12)' : 'transparent',
                  border: `1px solid ${filterWorkflowStatus === 'all' ? 'var(--color-primary, #800020)' : (isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb')}`,
                  color: filterWorkflowStatus === 'all' ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'),
                  borderRadius: '999px',
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: filterWorkflowStatus === 'all' ? 700 : 500,
                }}
              >
                {t('notifications_all_statuses') || 'All'}
              </button>
              {WORKFLOW_NOTIFICATION_STATUS_FILTERS.filter((chip) => {
                if (chip.hideForHR && isHR && !isAdmin && !isSuperAdmin) return false;
                return true;
              }).map((chip) => {
                const active = filterWorkflowStatus === chip.id;
                const count = workflowStatusCounts[chip.id] || 0;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFilterWorkflowStatus(active ? 'all' : chip.id)}
                    style={{
                      background: active ? `${chip.color}22` : 'transparent',
                      border: `1px solid ${active ? chip.color : (isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb')}`,
                      color: active ? chip.color : (isDark ? '#9ca3af' : '#6b7280'),
                      borderRadius: '999px',
                      padding: '3px 10px',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: active ? 700 : 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: chip.color,
                      flexShrink: 0,
                    }} />
                    {t(chip.labelKey) || chip.id}
                    <span style={{
                      minWidth: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: chip.color,
                      color: '#fff',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      flexShrink: 0,
                      opacity: count > 0 ? 1 : 0.55,
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {hasActiveFilters && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  background: 'transparent',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                }}
              >
                {t('operations_board_clear_filters') || 'Clear all'}
              </button>
            </div>
          )}

          {/* Collapsible Academic Filters */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginBottom: '0.4rem' }}
              >
                {/* Program — own row */}
                <div style={{ marginBottom: '0.3rem' }}>
                  <Select
                    value={filterProgram}
                    onChange={(e) => { setFilterProgram(e.target.value); setFilterSubject('all'); setFilterClass('all') }}
                    options={[
                      { value: 'all', label: t('all_programs') },
                      ...(programs || []).map(p => ({ value: p.docId || p.id, label: p.nameEn || p.name || p.code || p.docId }))
                    ]}
                    size="small" searchable fullWidth style={{ fontSize: 'var(--font-size-xs)' }}
                  />
                </div>
                {/* Subject — own row */}
                <div style={{ marginBottom: '0.3rem' }}>
                  <Select
                    value={filterSubject}
                    onChange={(e) => { setFilterSubject(e.target.value); setFilterClass('all') }}
                    options={[
                      { value: 'all', label: t('all_subjects') },
                      ...(subjects || []).filter(s => filterProgram === 'all' || String(s.programId) === String(filterProgram)).map(s => ({
                        value: s.docId || s.id,
                        label: `${s.code || ''} - ${s.nameEn || s.name || s.docId}`.trim()
                      }))
                    ]}
                    size="small" searchable fullWidth style={{ fontSize: 'var(--font-size-xs)' }}
                  />
                </div>
                {/* Class — own row */}
                <div style={{ marginBottom: '0.3rem' }}>
                  <Select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    options={[
                      { value: 'all', label: t('all_classes') },
                      ...(classes || []).filter(c => {
                        if (filterSubject !== 'all' && String(c.subjectId) !== String(filterSubject)) return false;
                        if (filterProgram !== 'all') {
                          const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
                          if (!subject || String(subject.programId) !== String(filterProgram)) return false;
                        }
                        return true;
                      }).map(c => ({ value: c.id || c.docId, label: `${c.name || c.code || 'Unnamed'}${c.term ? ` (${c.term})` : ''}` }))
                    ]}
                    size="small" searchable fullWidth style={{ fontSize: 'var(--font-size-xs)' }}
                  />
                </div>
                {/* Year + Semester — one row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.3rem'
                }}>
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
                    size="small" fullWidth style={{ fontSize: 'var(--font-size-xs)' }}
                  />
                  <Select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    options={[
                      { value: 'all', label: t('notifications.all_semesters') },
                      ...Array.from(new Set((subjects || []).map(s => s.semester).filter(Boolean))).map(v => ({ value: v, label: v }))
                    ]}
                    size="small" fullWidth style={{ fontSize: 'var(--font-size-xs)' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Settings Panel removed — settings are now in Profile page ── */}
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
                {searchTerm || filterType !== 'all' || filterProgram !== 'all' || filterSubject !== 'all' || filterClass !== 'all' || filterYear !== 'all' || filterSemester !== 'all' || filterWorkflowStatus !== 'all'
                  ? t('no_notifications_match_filters')
                  : t('no_notifications_yet')}
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
                {group.subGroups ? (
                  group.subGroups.map((sub, subIdx) => (
                    <div key={subIdx} style={{ marginBottom: subIdx < group.subGroups.length - 1 ? '0.5rem' : 0 }}>
                      {sub.label && (
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: getWorkflowSubgroupColor(sub.status),
                          padding: '0.2rem 0.25rem 0.35rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}>
                          {getThemedIcon('ui', 'git_branch', 14, getWorkflowSubgroupColor(sub.status))}
                          {sub.label} ({sub.items.length})
                        </div>
                      )}
                      {sub.items.map((notification, idx) => (
                        <NotificationCard key={notification.id} notification={notification} idx={idx}
                          isDark={isDark} isRTL={isRTL} theme={theme} t={t} lang={lang} formatTime={formatTime}
                          hoveredCard={hoveredCard} setHoveredCard={setHoveredCard}
                          gotoFromNotification={gotoFromNotification}
                          handleMarkAsRead={handleMarkAsRead} handleMarkAsUnread={handleMarkAsUnread}
                          handleArchive={handleArchive} handleUnarchive={handleUnarchive} handleDelete={handleDelete}
                          iconBtnStyle={iconBtnStyle}
                          getNotificationIcon={getNotificationIcon} getCategoryColor={getCategoryColor} getNotificationBorderColor={getNotificationBorderColor}
                          PortalTooltip={PortalTooltip} getThemedIcon={getThemedIcon}
                          motion={motion} AnimatePresence={AnimatePresence}
                          programs={programs} classes={classes}
                        />
                      ))}
                    </div>
                  ))
                ) : (
                  group.items.map((notification, idx) => (
                    <NotificationCard key={notification.id} notification={notification} idx={idx}
                      isDark={isDark} isRTL={isRTL} theme={theme} t={t} lang={lang} formatTime={formatTime}
                      hoveredCard={hoveredCard} setHoveredCard={setHoveredCard}
                      gotoFromNotification={gotoFromNotification}
                      handleMarkAsRead={handleMarkAsRead} handleMarkAsUnread={handleMarkAsUnread}
                      handleArchive={handleArchive} handleUnarchive={handleUnarchive} handleDelete={handleDelete}
                      iconBtnStyle={iconBtnStyle}
                      getNotificationIcon={getNotificationIcon} getCategoryColor={getCategoryColor} getNotificationBorderColor={getNotificationBorderColor}
                      PortalTooltip={PortalTooltip} getThemedIcon={getThemedIcon}
                      motion={motion} AnimatePresence={AnimatePresence}
                      programs={programs} classes={classes}
                    />
                  ))
                )}
              </div>
            ))
          )}
        </div>
        <div {...resizeHandleProps} />
      </div>
    </>
  );
};

export default NotificationDrawer;
