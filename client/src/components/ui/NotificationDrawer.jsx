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
  getCategoryColor
} from '@constants/notificationTypes.jsx';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { formatDateTime } from '@utils/date';
import { formatNotificationTime, filterNotifications as filterNotificationsUtil, groupNotificationsByDate, gotoFromNotification as gotoFromNotificationUtil } from '@utils/notificationHelpers';
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


const NotificationDrawer = ({ isOpen, onClose, feed }) => {
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
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') { setRunTour(false); try { localStorage.setItem(tourSeenKey, 'true'); } catch {} }
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
    remove: hookRemove
  } = feed || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPenaltyType, setFilterPenaltyType] = useState('all');
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState('all');
  const [filterAbsenceType, setFilterAbsenceType] = useState('all');
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
    return filterNotificationsUtil({
      notifications,
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
      subjects,
      classes
    });
  }, [notifications, filterType, filterCategory, filterPenaltyType, filterAttendanceStatus, filterAbsenceType, searchTerm, showArchived, filterProgram, filterSubject, filterClass, filterYear, filterSemester, subjects, classes]);

  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications, t);
  }, [filteredNotifications, t]);

  const archivedCount = notifications.filter(n => n.isArchived).length;

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
      await hookMarkAsRead(notificationId);
    } catch {}
  }, [hookMarkAsRead]);

  const handleMarkAsUnread = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      await hookMarkAsUnread(notificationId);
    } catch {}
  }, [hookMarkAsUnread]);

  const handleArchive = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    try {
      await hookArchive(notificationId);
    } catch {}
  }, [hookArchive]);

  const handleDelete = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    if (!confirm(t('notifications.delete_confirmation'))) return;
    try {
      await hookRemove(notificationId);
    } catch {}
  }, [t, hookRemove]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      await hookMarkAllAsRead();
    } catch {}
  }, [unreadCount, hookMarkAllAsRead]);

  const gotoFromNotification = useCallback(async (n) => {
    try {
      await ActivityLogger.notificationClicked(n.id, n.type);
    } catch (logError) {
      warn('Failed to log notification clicked activity:', logError);
    }
    await gotoFromNotificationUtil(n, navigate, handleMarkAsRead);
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
          width: 'min(840px, 90vw)',
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
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--color-primary, #800020)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0 6px',
                  boxSizing: 'border-box',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 2px 6px rgba(128,0,32,0.4)',
                  animation: 'notif-pulse 2s ease-in-out infinite',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              
              {/* Pushable settings icon buttons */}
              <PortalTooltip content={t('notifications_sound_enabled') || 'Sound'} position="top">
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
                <PortalTooltip content={t('notifications_browser_notifications') || 'Browser Notifications'} position="top">
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
              <PortalTooltip content={t('notifications_notification_settings') || 'Notification Settings'} position="top">
                <button
                  data-tour="notif-drawer-settings"
                  onClick={(e) => { e.stopPropagation(); onClose(); navigate('/profile'); }}
                  style={iconBtnStyle(false)}
                  onMouseEnter={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(true)) }}
                  onMouseLeave={(e) => { Object.assign(e.currentTarget.style, iconBtnStyle(false)) }}
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
                label: option.value === NOTIFICATION_STATUS.UNREAD ? `${t('unread') || 'Unread'} (${unreadCount})` :
                       option.value === NOTIFICATION_STATUS.ARCHIVED ? `${t('archived') || 'Archived'} (${archivedCount})` :
                       option.label
              }))}
              size="small"
              style={{ flex: 1, minWidth: '80px', fontSize: '0.75rem' }}
            />
            <div style={{ display: 'flex', flex: 1, minWidth: '80px', gap: '0.25rem', alignItems: 'center' }}>
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
                style={{ flex: 1, fontSize: '0.75rem' }}
              />
              <PortalTooltip content={t('advanced_filters') || 'Advanced filters'} position="top">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAdvanced(!showAdvanced) }}
                  style={{
                    background: showAdvanced ? 'rgba(128,0,32,0.15)' : 'transparent',
                    border: 'none',
                    color: showAdvanced ? 'var(--color-primary, #800020)' : (isDark ? '#9ca3af' : '#6b7280'),
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { if (!showAdvanced) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}
                  onMouseLeave={(e) => { if (!showAdvanced) e.currentTarget.style.background = 'transparent' }}
                >
                  {getThemedIcon('ui', 'sliders_horizontal', 16, theme)}
                </button>
              </PortalTooltip>
            </div>
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
                  { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: t('absent_with_excuse') || 'Absent excused' },
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem'
                }}>
                  <div style={{
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
                  </div>
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
                      [isRTL ? 'borderRight' : 'borderLeft']: `4px solid ${getCategoryColor(notification.type)}`,
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
                        </div>

                        {/* Hover-reveal action buttons — absolutely positioned to avoid height change */}
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
                              {!notification.isArchived && (
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
