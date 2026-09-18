import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getUserRoleColor, getUserRoleIcon } from '@constants/iconTypes';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { ROLE_STRINGS, resolveUserRole } from '@utils/userUtils';
import useResizableDrawer from '@hooks/useResizableDrawer';
import { getLectureLog, getRecordHistory } from '@services/business/attendanceLogService';
import { formatDate, formatDateTime, getQatarDateParts } from '@utils/date-formatter.js';
import { getAttendanceColor, getStatusCodeFromRecord, getLocalizedAttendanceLabel } from '@constants/attendanceTypes.js';
import GridQuickFilterChips from '@components/ui/GridQuickFilterChips';
import { getWorkflowStatusColor } from '@constants/workspaceStatusColors.js';
import { getDateGroup, getGroupLabel, getLocalizedWorkflowName } from '@utils/notificationHelpers.js';
import { Workflow as WorkflowIcon, ChevronDown, ChevronUp } from 'lucide-react';
import chatSocket from '@services/realtime/chatSocket.js';
import DriveUserAvatar from '@components/ui/DriveTimeline/DriveUserAvatar.jsx';
import { WORKFLOW_COLUMNS } from '@services/business/operationsBoardService.js';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getLocalizedNoteText } from '@constants/noteTypes';

const WORKFLOW_STATUS_LABEL_KEYS = Object.fromEntries(
  WORKFLOW_COLUMNS.map((col) => [col.id, col.i18nKey]),
);

function localizeLogStatus(status, t, lang, localizedAr) {
  if (!status) return '—';
  const raw = typeof status === 'object'
    ? (status.code || status.nameEn || status.id || '')
    : status;
  const code = String(raw).toUpperCase().trim().replace(/\s+/g, '_');
  const labelKey = WORKFLOW_STATUS_LABEL_KEYS[code];
  if (labelKey) {
    const label = t(labelKey);
    if (label && label !== labelKey) return label;
  }
  // Common workflow aliases
  const aliases = {
    SENT: 'operations_board_lane_submitted',
    SUBMITTED: 'operations_board_lane_submitted',
    UNDER_REVIEW: 'operations_board_lane_hr_review',
    UNDER_HR_REVIEW: 'operations_board_lane_hr_review',
    UNDER_ADMIN_REVIEW: 'operations_board_lane_admin_review',
    ADMIN_APPROVED: 'operations_board_lane_approved',
  };
  if (aliases[code]) {
    const label = t(aliases[code]);
    if (label && label !== aliases[code]) return label;
  }
  if (lang === 'ar' && localizedAr) return localizedAr;
  // Never show raw enum keys like UNDER_ADMIN_REVIEW to users
  if (/^[A-Z][A-Z0-9_]+$/.test(code) && code.includes('_')) {
    return code.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  }
  return String(raw || status);
}

const TABS = {
  HISTORY: 'history',
};

function matchesDateFilter(entry, filterKey) {
  if (filterKey === 'all') return true;
  const nowParts = getQatarDateParts(new Date());
  if (!nowParts) return true;
  const today = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
  const oneDay = 24 * 60 * 60 * 1000;
  const ts = entry.timestamp?.seconds ? new Date(entry.timestamp.seconds * 1000) : new Date(entry.timestamp);
  const entryParts = getQatarDateParts(ts);
  if (!entryParts) return false;
  const entryDay = Date.UTC(entryParts.year, entryParts.month - 1, entryParts.day);
  if (filterKey === 'today') return entryDay === today;
  if (filterKey === 'yesterday') return entryDay === today - oneDay;
  const days = { last7days: 7, last14days: 14, last30days: 30 }[filterKey];
  if (days) return entryDay >= today - (days - 1) * oneDay && entryDay <= today;
  return true;
}

const LectureLogDrawer = ({ isOpen, onClose, classInfo, date, embedded = false, studentId = null, workflowId = null }) => {
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'lecture_log_drawer_width',
    defaultWidth: 720,
    minWidth: 360,
    maxWidth: 900,
    isRTL,
  });

  const activeTab = TABS.HISTORY;
  const [lectureLog, setLectureLog] = useState([]);
  const [recordHistory, setRecordHistory] = useState([]);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupStatusFilters, setGroupStatusFilters] = useState({});
  const [globalStatusFilter, setGlobalStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const classId = classInfo?.id;
  const dateStr = date ? new Date(date).toISOString().split('T')[0] : null;

  const fetchLectureLog = useCallback(() => {
    if (!isOpen || !classId || !dateStr) return;
    setLoading(true);
    setError(null);
    getLectureLog(classId, dateStr)
      .then((res) => {
        if (res.success) {
          setLectureLog(res.data || []);
        } else {
          setError(res.error || t('failed_to_load_history') || 'Failed to load');
        }
      })
      .catch(() => setError(t('failed_to_load_history') || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isOpen, classId, dateStr, t]);

  useEffect(() => {
    fetchLectureLog();
  }, [fetchLectureLog]);

  useEffect(() => {
    const handleBoardUpdate = (payload) => {
      const eventDate = payload?.date ? new Date(payload.date).toISOString().slice(0, 10) : null;
      if (
        String(payload?.classId) === String(classId) &&
        eventDate === dateStr
      ) {
        fetchLectureLog();
      }
    };
    chatSocket.on('board:attendance_updated', handleBoardUpdate);
    chatSocket.on('board:workflow_updated', handleBoardUpdate);
    return () => {
      chatSocket.off('board:attendance_updated', handleBoardUpdate);
      chatSocket.off('board:workflow_updated', handleBoardUpdate);
    };
  }, [classId, dateStr, fetchLectureLog]);

  const handleRecordHistoryFetch = useCallback(async (attendanceId) => {
    setSelectedAttendanceId(attendanceId);
    setLoading(true);
    setError(null);
    const res = await getRecordHistory(attendanceId);
    if (res.success) {
      setRecordHistory(res.data || []);
    } else {
      setError(res.error || t('failed_to_load_history') || 'Failed to load');
    }
    setLoading(false);
  }, [t]);

  const formatTimestamp = useCallback((ts) => {
    if (!ts) return '';
    return formatDateTime(ts, lang);
  }, [lang]);

  const statusFilters = useMemo(() => [
    { id: 'all', label: t('all') || 'All', color: '#800020', match: () => true },
    { id: 'ATTENDANCE_PRESENT', label: getLocalizedAttendanceLabel('ATTENDANCE_PRESENT', lang), color: getAttendanceColor('ATTENDANCE_PRESENT'), match: (code) => code === 'ATTENDANCE_PRESENT' || code === 'STANDUP_PRESENT' },
    { id: 'ATTENDANCE_LATE', label: getLocalizedAttendanceLabel('ATTENDANCE_LATE', lang), color: getAttendanceColor('ATTENDANCE_LATE'), match: (code) => code === 'ATTENDANCE_LATE' || code === 'STANDUP_LATE' },
    { id: 'ATTENDANCE_ABSENT', label: getLocalizedAttendanceLabel('ATTENDANCE_ABSENT', lang), color: getAttendanceColor('ATTENDANCE_ABSENT'), match: (code) => code === 'ATTENDANCE_ABSENT' || code === 'STANDUP_ABSENT' },
    { id: 'ATTENDANCE_HUMAN_CASE', label: getLocalizedAttendanceLabel('ATTENDANCE_HUMAN_CASE', lang), color: getAttendanceColor('ATTENDANCE_HUMAN_CASE'), match: (code) => code === 'ATTENDANCE_HUMAN_CASE' },
    { id: 'ATTENDANCE_LEAVE', label: getLocalizedAttendanceLabel('ATTENDANCE_LEAVE', lang), color: getAttendanceColor('ATTENDANCE_LEAVE'), match: (code) => code === 'ATTENDANCE_LEAVE' },
    { id: 'NOT_TAKEN', label: t('operations_board_lane_not_taken') || 'Not yet', color: getAttendanceColor('NOT_TAKEN'), match: (code) => code === 'NOT_TAKEN' },
  ], [t, lang]);

  const searchFilteredLectureLog = useMemo(() => {
    let data = lectureLog;
    if (studentId) {
      const targetStudent = String(studentId);
      data = data.filter((entry) =>
        String(entry.userId) === targetStudent ||
        String(entry.student?.id) === targetStudent
      );
    }
    if (workflowId) {
      const targetWorkflow = String(workflowId);
      data = data.filter((entry) =>
        String(entry.id) === targetWorkflow ||
        String(entry.workflowId) === targetWorkflow ||
        String(entry.workflowDocumentId) === targetWorkflow
      );
    }
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data;
    return data.filter((entry) => {
      const text = [
        getLocalizedUserName(entry.student, lang, entry.student?.displayName || ''),
        entry.actor,
        getLocalizedUserName(entry.user, lang, entry.actor || ''),
        entry.reason,
        entry.documentTitle,
        localizeLogStatus(entry.status, t, lang, entry.statusAr),
        localizeLogStatus(entry.fromStatus, t, lang, entry.fromStatusAr),
        localizeLogStatus(entry.toStatus, t, lang, entry.toStatusAr),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(term);
    });
  }, [lectureLog, studentId, workflowId, searchTerm, lang, t]);

  const getEntryResultStatus = useCallback((entry) => {
    if (!entry) return null;
    const isWorkflow = entry.type === 'workflow_status_change';
    const isAttendanceChange = entry.type === 'attendance_status_change';
    const isAttendanceMarked = !isWorkflow && !isAttendanceChange;
    const raw = isAttendanceMarked ? entry.status : (entry.toStatus || entry.status);
    if (!raw) return null;
    return getStatusCodeFromRecord({ status: raw });
  }, []);

  const typeFilteredLectureLog = useMemo(() => {
    if (globalStatusFilter === 'all') return searchFilteredLectureLog;
    const filter = statusFilters.find((f) => f.id === globalStatusFilter);
    if (!filter) return searchFilteredLectureLog;
    return searchFilteredLectureLog.filter((entry) => filter.match(getEntryResultStatus(entry)));
  }, [searchFilteredLectureLog, globalStatusFilter, statusFilters, getEntryResultStatus]);

  const filteredLectureLog = typeFilteredLectureLog;

  const groupedLectureLog = useMemo(() => {
    const sorted = [...filteredLectureLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const groups = {};
    sorted.forEach((entry) => {
      const group = getDateGroup(entry.timestamp);
      if (!groups[group]) groups[group] = [];
      groups[group].push(entry);
    });
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    return order.filter((g) => groups[g]).map((g) => ({
      key: g,
      label: getGroupLabel(g, t),
      items: groups[g],
    }));
  }, [filteredLectureLog, t]);

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      groupedLectureLog.forEach((g) => {
        if (!(g.key in next)) next[g.key] = true;
      });
      return next;
    });
  }, [groupedLectureLog]);

  const toggleGroup = useCallback((key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const tabBtnStyle = useMemo(() => ({
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    color: isDark ? '#94a3b8' : '#64748b',
  }), [isDark]);

  const activeTabStyle = useMemo(() => ({
    ...tabBtnStyle,
    color: 'var(--color-primary, #800020)',
    borderBottomColor: 'var(--color-primary, #800020)',
  }), [tabBtnStyle]);

  const cardStyle = useMemo(() => ({
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : '#d1d5db'}`,
    background: isDark ? '#111827' : '#ffffff',
    marginBottom: '6px',
  }), [isDark]);

  const labelStyle = useMemo(() => ({
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: isDark ? '#6b7280' : '#9ca3af',
  }), [isDark]);

  const valueStyle = useMemo(() => ({
    fontSize: '14px',
    color: isDark ? '#f1f5f9' : '#1e293b',
    fontWeight: 500,
  }), [isDark]);

  const actorRoleFor = (entry) => (entry.user ? resolveUserRole(entry.user) : null);
  const actorRoleColorFor = (entry) => {
    const role = actorRoleFor(entry);
    return role ? getUserRoleColor(role) : null;
  };
  const showRoleLabelFor = (entry) => {
    const role = actorRoleFor(entry);
    return role && (role === ROLE_STRINGS.ADMIN || role === ROLE_STRINGS.SUPER_ADMIN || role === ROLE_STRINGS.HR || role === ROLE_STRINGS.INSTRUCTOR);
  };

  const renderLogActor = (entry) => {
    const displayName = entry.user
      ? getLocalizedUserName(entry.user, lang, entry.actor)
      : (entry.actor || '—');
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ transform: 'scale(0.72)', transformOrigin: 'center', flexShrink: 0, lineHeight: 0 }}>
          <DriveUserAvatar
            user={entry.user || { displayName }}
            displayName={displayName}
            size="sm"
            showRoleBadge={true}
          />
        </span>
        {showRoleLabelFor(entry) && (
          <ColoredTooltip
            title={(
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {React.cloneElement(getUserRoleIcon(actorRoleFor(entry)), { size: 12, color: '#ffffff' })}
                {actorRoleFor(entry)}
              </span>
            )}
            color={actorRoleColorFor(entry)}
            placement="top"
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: 4,
                background: `${actorRoleColorFor(entry)}22`,
                color: actorRoleColorFor(entry),
              }}
            >
              {React.cloneElement(getUserRoleIcon(actorRoleFor(entry)), { size: 12, color: actorRoleColorFor(entry) })}
            </span>
          </ColoredTooltip>
        )}
        <span style={{ ...valueStyle, fontSize: '12px', fontWeight: 600 }}>{displayName}</span>
      </span>
    );
  };

  const renderLogStudent = (student) => {
    const displayName = getLocalizedUserName(student, lang, student?.displayName || '');
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ transform: 'scale(0.72)', transformOrigin: 'center', flexShrink: 0, lineHeight: 0 }}>
          <DriveUserAvatar
            user={student || { displayName }}
            displayName={displayName}
            size="sm"
            showRoleBadge={true}
          />
        </span>
        <span style={{ ...valueStyle, fontSize: '12px', fontWeight: 600 }}>{displayName}</span>
      </span>
    );
  };

  const renderWorkflowTransition = (entry, fallbackStatus) => {
    const fromRaw = entry.fromStatus;
    const toRaw = entry.toStatus || fallbackStatus;
    const fromLabel = localizeLogStatus(fromRaw, t, lang, lang === 'ar' ? entry.fromStatusAr : null);
    const toLabel = localizeLogStatus(toRaw, t, lang, lang === 'ar' ? entry.toStatusAr : null);
    const fromColor = getWorkflowStatusColor(fromRaw);
    const toColor = getWorkflowStatusColor(toRaw);
    const arrowColor = isDark ? '#6b7280' : '#9ca3af';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', direction: isRTL ? 'rtl' : 'ltr' }}>
        <span style={{ color: fromColor }}>{fromLabel || '—'}</span>
        <span style={{ color: arrowColor }}>{isRTL ? '←' : '→'}</span>
        <span style={{ color: toColor }}>{toLabel || '—'}</span>
      </span>
    );
  };

  const renderAttendanceTransition = (fromRaw, toRaw, fallbackTo, fromLocalizedAr, toLocalizedAr) => {
    const fromCode = typeof fromRaw === 'object'
      ? (fromRaw.code || fromRaw.nameEn || fromRaw.name || '')
      : String(fromRaw || '');
    const isNotTaken = fromCode.toUpperCase().trim().replace(/\s+/g, '_') === 'NOT_TAKEN';
    const fromLabel = isNotTaken
      ? (t('operations_board_lane_not_taken') || 'Not yet')
      : localizeLogStatus(fromRaw, t, lang, lang === 'ar' ? fromLocalizedAr : null);
    const toLabel = localizeLogStatus(toRaw || fallbackTo, t, lang, lang === 'ar' ? toLocalizedAr : null);
    const fromColor = getAttendanceColor(fromRaw);
    const toColor = getAttendanceColor(toRaw || fallbackTo);
    const arrowColor = isDark ? '#6b7280' : '#9ca3af';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', direction: isRTL ? 'rtl' : 'ltr' }}>
        <span style={{ color: fromColor }}>{fromLabel || '—'}</span>
        <span style={{ color: arrowColor }}>{isRTL ? '←' : '→'}</span>
        <span style={{ color: toColor }}>{toLabel || fallbackTo || '—'}</span>
      </span>
    );
  };

  const renderEntryCard = (entry, idx) => {
    const isWorkflow = entry.type === 'workflow_status_change';
    const isAttendanceChange = entry.type === 'attendance_status_change';
    const isAttendanceMarked = !isWorkflow && !isAttendanceChange;
    const rawStatus = isAttendanceMarked ? entry.status : entry.toStatus;
    const statusRaw = isAttendanceMarked ? (lang === 'ar' ? entry.statusAr : entry.status) : (lang === 'ar' ? entry.toStatusAr : entry.toStatus);
    const iconColor = isWorkflow
      ? getWorkflowStatusColor(entry.toStatus)
      : getAttendanceColor(rawStatus);
    const titleNode = isWorkflow ? (
      renderWorkflowTransition(entry, statusRaw)
    ) : (
      renderAttendanceTransition(
        isAttendanceMarked ? (entry.fromStatus || 'NOT_TAKEN') : entry.fromStatus,
        isAttendanceMarked ? entry.status : entry.toStatus,
        statusRaw,
        isAttendanceMarked ? null : entry.fromStatusAr,
        isAttendanceMarked ? (lang === 'ar' ? entry.statusAr : null) : (lang === 'ar' ? entry.toStatusAr : null),
      )
    );

    const attendanceId = entry.attendanceId || entry.recordId || entry.id;
    const canShowHistory = isAttendanceMarked || isAttendanceChange;

    return (
      <motion.div
        key={`${entry.id || idx}-${entry.timestamp}`}
        initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: idx * 0.03 }}
        style={{
          ...cardStyle,
          cursor: canShowHistory && attendanceId ? 'pointer' : 'default',
          ...(canShowHistory && selectedAttendanceId === attendanceId ? {
            borderColor: 'var(--color-primary, #800020)',
            background: isDark ? 'rgba(128,0,32,0.08)' : 'rgba(128,0,32,0.04)',
          } : {}),
        }}
        onClick={() => {
          if (canShowHistory && attendanceId) {
            handleRecordHistoryFetch(attendanceId);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{
            flexShrink: 0,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
          }}>
            {isAttendanceMarked || isAttendanceChange ? (
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: iconColor,
                flexShrink: 0,
              }} />
            ) : isWorkflow ? (
              <WorkflowIcon size={14} color={iconColor} strokeWidth={2.5} />
            ) : (
              getThemedIcon('ui', 'edit', 14, theme)
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: iconColor,
              }}>
                {titleNode}
              </span>
              <span style={{
                fontSize: '11px',
                color: isDark ? '#e5e7eb' : '#000000',
              }}>
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
            {isAttendanceMarked ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  {renderLogActor(entry)}
                  {entry.student && (
                    <>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{isRTL ? '←' : '→'}</span>
                      {renderLogStudent(entry.student)}
                    </>
                  )}
                </div>
                {entry.reason && (
                  <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                    "{getLocalizedNoteText(entry.reason, t)}"
                  </div>
                )}
              </>
            ) : (isWorkflow || isAttendanceChange) ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  {renderLogActor(entry)}
                  {entry.student && (
                    <>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{isRTL ? '←' : '→'}</span>
                      {renderLogStudent(entry.student)}
                    </>
                  )}
                </div>
                {entry.reason && (
                  <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                    "{getLocalizedNoteText(entry.reason, t)}"
                  </div>
                )}
                {entry.documentTitle && (
                  <div style={{ fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>
                    {(() => {
                      const raw = entry.documentTitle || '';
                      const parts = raw.split(/\s+[—–-]\s+/).map((s) => s.trim()).filter(Boolean);
                      const typeLabel = getLocalizedWorkflowName(raw, t).split(' — ')[0] || parts[0] || '';
                      const docDate = parts.length > 1 ? parts[parts.length - 1] : '';
                      if (parts.length >= 2 && className) {
                        return `${typeLabel} — ${className} — ${docDate}`;
                      }
                      return raw;
                    })()}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  };

  const groupHeaderStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: '12px',
    paddingBottom: '8px',
    gap: '8px',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
  }), [isDark]);

  const groupToggleBtnStyle = useMemo(() => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: 'none',
    background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    color: isDark ? '#e2e8f0' : '#334155',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }), [isDark]);

  const showStatusFilters = activeTab === TABS.HISTORY;

  const renderLectureLog = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {t('loading') || 'Loading...'}
        </div>
      );
    }

    const emptyMessage = searchTerm.trim()
      ? (t('log_drawer_no_search_results') || 'No matching entries')
      : (t('log_drawer_no_entries') || 'No log entries found for this lecture');

    const emptyIconColor = isDark ? '#94a3b8' : '#64748b';
    const listContent = filteredLectureLog.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: emptyIconColor }}>
        {getThemedIcon('ui', 'inbox', 48, emptyIconColor)}
        <p style={{ marginTop: '12px', fontSize: '14px' }}>
          {emptyMessage}
        </p>
      </div>
    ) : (
      <>
        {groupedLectureLog.map((group) => {
          const expanded = expandedGroups[group.key] !== false;
          const groupFilter = showStatusFilters ? (groupStatusFilters[group.key] || 'all') : 'all';
          const visibleItems = groupFilter !== 'all'
            ? group.items.filter((entry) => {
                const filter = statusFilters.find((f) => f.id === groupFilter);
                return filter ? filter.match(getEntryResultStatus(entry)) : true;
              })
            : group.items;
          const statusCounts = showStatusFilters ? statusFilters.reduce((acc, f) => {
            if (f.id === 'all') {
              acc[f.id] = group.items.length;
            } else {
              acc[f.id] = group.items.filter((entry) => f.match(getEntryResultStatus(entry))).length;
            }
            return acc;
          }, {}) : { all: group.items.length };
          return (
            <div key={group.key} style={{ marginBottom: '12px' }}>
              <div style={groupHeaderStyle}>
                <button
                  type="button"
                  style={groupToggleBtnStyle}
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={expanded}
                >
                  <span>{group.label}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    {visibleItems.length}
                  </span>
                  {getThemedIcon('ui', expanded ? 'chevron_up' : 'chevron_down', 16, theme)}
                </button>
                {showStatusFilters && (
                  <GridQuickFilterChips
                    chips={statusFilters
                      .filter((f) => f.id === 'all' || (statusCounts[f.id] || 0) > 0)
                      .map((f) => ({
                        id: f.id,
                        label: f.label,
                        count: statusCounts[f.id] || 0,
                        color: f.color,
                        icon: f.id !== 'all'
                          ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                          : undefined,
                      }))}
                    activeId={groupFilter}
                    onChange={(id) => {
                      setGroupStatusFilters((prev) => ({
                        ...prev,
                        [group.key]: id,
                      }));
                    }}
                    compact
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                )}
              </div>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    key="group-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <AnimatePresence initial={false}>
                      {visibleItems.map((entry, idx) => renderEntryCard(entry, idx))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </>
    );

    return (
      <div style={{ padding: '12px' }}>
        {date && lectureLog.length > 0 && (
          <DayFilterBanner date={date} lang={lang} t={t} isDark={isDark} />
        )}
        {lectureLog.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff' }}>
            {getThemedIcon('ui', 'search', 17, theme)}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search') || 'Search...'}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '16px',
                color: isDark ? '#f1f5f9' : '#1e293b',
              }}
            />
          </div>
        )}
        {showStatusFilters && searchFilteredLectureLog.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <GridQuickFilterChips
              chips={(() => {
                const counts = statusFilters.reduce((acc, f) => {
                  if (f.id === 'all') acc[f.id] = searchFilteredLectureLog.length;
                  else acc[f.id] = searchFilteredLectureLog.filter((entry) => f.match(getEntryResultStatus(entry))).length;
                  return acc;
                }, {});
                return statusFilters
                  .filter((f) => f.id === 'all' || (counts[f.id] || 0) > 0)
                  .map((f) => ({
                    id: f.id,
                    label: f.label,
                    count: counts[f.id] || 0,
                    color: f.color,
                    icon: f.id !== 'all'
                      ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                      : undefined,
                  }));
              })()}
              activeId={globalStatusFilter}
              onChange={(id) => setGlobalStatusFilter(id)}
              compact
              style={{ width: '100%', justifyContent: 'flex-start' }}
            />
          </div>
        )}
        {listContent}
      </div>
    );
  };

  const renderRecordHistory = () => {
    if (!selectedAttendanceId) {
      const attendanceEntries = lectureLog.filter((e) => {
        const type = e.type;
        return type === 'attendance_status_change' || (type && !type.includes('workflow'));
      });
      const workflowEntries = lectureLog.filter((e) => e.type === 'workflow_status_change');
      const uniqueStudentIds = new Set();
      attendanceEntries.forEach((e) => {
        const sid = e.student?.id || e.userId || e.studentId;
        if (sid) uniqueStudentIds.add(String(sid));
      });
      const uniqueStudents = uniqueStudentIds.size;
      const statusCounts = attendanceEntries.reduce((acc, entry) => {
        const code = getEntryResultStatus(entry);
        if (code) acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {});
      const workflowCount = workflowEntries.length;
      const attendanceCount = attendanceEntries.length;
      const totalChanges = lectureLog.length;
      const lastChange = lectureLog[0]?.timestamp ? formatTimestamp(lectureLog[0].timestamp) : null;

      const recentRecords = [];
      const seen = new Set();
      for (const e of attendanceEntries) {
        const id = e.attendanceId || e.recordId || e.id;
        if (id && e.student && !seen.has(id)) {
          seen.add(id);
          recentRecords.push({
            attendanceId: id,
            student: e.student,
            status: getEntryResultStatus(e),
          });
        }
      }

      const chipBase = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
        color: isDark ? '#e2e8f0' : '#334155',
      };

      return (
        <div style={{ padding: '12px' }}>
          <div style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b' }}>
                {t('log_drawer_daily_summary') || 'Daily Summary'}
              </div>
              {lastChange && (
                <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {lastChange}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={chipBase}>
                {getThemedIcon('ui', 'users', 12, theme)}
                {t('log_drawer_unique_students') || 'Students'}: <strong>{uniqueStudents}</strong>
              </span>
              <span style={chipBase}>
                {t('log_drawer_total_events') || 'Total'}: <strong>{totalChanges}</strong>
              </span>
              <span style={chipBase}>
                {getThemedIcon('ui', 'check_circle', 12, theme)}
                {t('log_drawer_attendance_records') || 'Attendance'}: <strong>{attendanceCount}</strong>
              </span>
              <span style={chipBase}>
                {getThemedIcon('ui', 'file', 12, theme)}
                {t('log_drawer_workflow_changes') || 'Workflow'}: <strong>{workflowCount}</strong>
              </span>
              {Object.entries(statusCounts).map(([code, count]) => {
                const label = getLocalizedAttendanceLabel(code, lang) || code.replace(/_/g, ' ');
                const color = getAttendanceColor(code);
                return (
                  <span key={code} style={{
                    ...chipBase,
                    color,
                    background: `${color}14`,
                    border: `1px solid ${color}30`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                    {label} {count}
                  </span>
                );
              })}
            </div>
          </div>

          {recentRecords.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>
                {t('log_drawer_recent_records') || 'Recent records'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentRecords.map((record) => {
                  const color = getAttendanceColor(record.status) || '#94a3b8';
                  const label = getLocalizedAttendanceLabel(record.status, lang) || record.status;
                  return (
                    <button
                      key={record.attendanceId}
                      type="button"
                      onClick={() => handleRecordHistoryFetch(record.attendanceId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                        background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <span style={{ transform: 'scale(0.72)', transformOrigin: 'center', flexShrink: 0, lineHeight: 0 }}>
                        <DriveUserAvatar
                          user={record.student}
                          displayName={getLocalizedUserName(record.student, lang)}
                          size="sm"
                          showRoleBadge={true}
                        />
                      </span>
                      <span style={{ flex: 1, fontSize: '13px', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                        {getLocalizedUserName(record.student, lang)}
                      </span>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {t('loading') || 'Loading...'}
        </div>
      );
    }

    if (recordHistory.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {getThemedIcon('ui', 'inbox', 48, theme)}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {t('log_drawer_no_changes') || 'No change history for this record'}
          </p>
        </div>
      );
    }

    const recordStudent = recordHistory[0]?.student;

    return (
      <div style={{ padding: '12px' }}>
        <div style={{
          marginBottom: '12px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: isDark ? 'rgba(128,0,32,0.1)' : 'rgba(128,0,32,0.05)',
          border: '1px solid rgba(128,0,32,0.15)',
          fontSize: '12px',
          color: isDark ? '#cbd5e1' : '#475569',
        }}>
          <div>{t('log_drawer_record_id') || 'Record ID'}: #{selectedAttendanceId}</div>
          {recordStudent && (
            <div style={{ marginTop: '4px' }}>
              {t('log_drawer_student') || 'Student'}: {getLocalizedUserName(recordStudent, lang)}
            </div>
          )}
        </div>
        {recordHistory.map((change, idx) => {
          const fromName = lang === 'ar' ? change.fromStatus?.nameAr : change.fromStatus?.nameEn;
          const toName = lang === 'ar' ? change.toStatus?.nameAr : change.toStatus?.nameEn;
          const actorName = getLocalizedUserName(change.changedByUser, lang)
            || `${change.changedByUser?.firstName || ''} ${change.changedByUser?.lastName || ''}`.trim()
            || t('operations_board_system_actor') || 'System';

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              style={cardStyle}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  flexShrink: 0,
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                }}>
                  {getThemedIcon('ui', 'edit', 12, theme)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {fromName && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                        color: isDark ? '#cbd5e1' : '#475569',
                      }}>
                        {fromName}
                      </span>
                    )}
                    {fromName && <span style={{ color: isDark ? '#6b7280' : '#9ca3af', fontSize: '12px' }}>→</span>}
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: 'rgba(128,0,32,0.1)',
                      color: 'var(--color-primary, #800020)',
                    }}>
                      {toName || '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: isDark ? '#e5e7eb' : '#000000' }}>
                  {t('log_drawer_by') || 'By'}: {actorName}
                </span>
                <span style={{ fontSize: '11px', color: isDark ? '#e5e7eb' : '#000000' }}>
                  {formatTimestamp(change.changedAt)}
                </span>
              </div>
              {change.reason && (
                <div style={{
                  marginTop: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  fontSize: '12px',
                  color: isDark ? '#cbd5e1' : '#475569',
                  fontStyle: 'italic',
                }}>
                  {change.reason}
                </div>
              )}
              {change.source && (
                <div style={{ fontSize: '10px', color: isDark ? '#6b7280' : '#9ca3af', marginTop: '4px' }}>
                  {t('log_drawer_source') || 'Source'}: {change.source}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  const className = lang === 'ar' && classInfo?.nameAr
    ? classInfo.nameAr
    : classInfo?.nameEn || classInfo?.code || '';

  const panel = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: embedded ? 'relative' : 'fixed',
        top: embedded ? undefined : 0,
        [isRTL ? 'left' : 'right']: embedded ? undefined : 0,
        height: embedded ? '100%' : '100vh',
        width: embedded ? '100%' : drawerWidth,
        background: isDark ? '#1a1a2e' : '#ffffff',
        boxShadow: embedded ? 'none' : (isRTL ? '2px 0 20px rgba(0,0,0,0.15)' : '-2px 0 20px rgba(0,0,0,0.15)'),
        zIndex: embedded ? 'auto' : 1002,
        display: 'flex',
        flexDirection: 'column',
        dir: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {!embedded && <div {...resizeHandleProps} />}

      {/* Header */}
      {!embedded && (
      <div style={{
          padding: '16px 20px 0',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          background: isDark ? '#0f0f1e' : '#f9fafb',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: isDark ? '#fff' : '#111',
              }}>
                {t('log_drawer_title') || 'Lecture Log'}
              </h2>
              {className && (
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}>
                  {className}
                  {dateStr && <span style={{ margin: '0 6px' }}>·</span>}
                  {dateStr && formatDate(dateStr, lang)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#9ca3af' : '#6b7280',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary, #800020)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280';
              }}
            >
              {getThemedIcon('ui', 'close', 20, theme)}
            </button>
          </div>

          {/* History */}
        </div>
      )}

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: isDark ? '#1a1a2e' : '#ffffff',
        }}>
          {error && (
            <div style={{
              margin: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.2)',
              color: '#dc2626',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {selectedAttendanceId && renderRecordHistory()}
              {renderLectureLog()}
            </motion.div>
          </AnimatePresence>
        </div>
    </div>
  );

  if (embedded) return panel;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 999,
          backdropFilter: 'blur(2px)',
        }}
      />
      {panel}
    </>
  );
};

export function DateGroupedList({
  items = [],
  getTimestamp = (item) => item.createdAt || item.timestamp,
  filterDefs = [],
  renderItem,
  emptyMessage,
  isDark,
  t,
}) {
  const { theme } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupFilters, setGroupFilters] = useState({});

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        const g = getDateGroup(getTimestamp(item));
        if (!(g in next)) next[g] = true;
      });
      return next;
    });
  }, [items, getTimestamp]);

  const toggleGroup = useCallback((key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const grouped = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(getTimestamp(b) || 0) - new Date(getTimestamp(a) || 0));
    const groups = {};
    sorted.forEach((item) => {
      const g = getDateGroup(getTimestamp(item));
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    return order.filter((g) => groups[g]).map((g) => ({
      key: g,
      label: getGroupLabel(g, t),
      items: groups[g],
    }));
  }, [items, getTimestamp, t]);

  const groupHeaderStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: '8px',
    paddingBottom: '6px',
    gap: '6px',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
  }), [isDark]);

  const groupToggleBtnStyle = useMemo(() => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '8px',
    border: 'none',
    background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
    color: isDark ? '#e2e8f0' : '#334155',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }), [isDark]);

  if (items.length === 0) return null;

  return (
    <div>
      {grouped.map((group) => {
        const groupFilter = groupFilters[group.key] || 'all';
        const filterDef = filterDefs.find((f) => f.id === groupFilter);
        const visibleItems = groupFilter === 'all' ? group.items : group.items.filter((item) => filterDef?.match(item));
        const counts = filterDefs.reduce((acc, f) => {
          if (f.id === 'all') acc[f.id] = group.items.length;
          else acc[f.id] = group.items.filter((item) => f.match(item)).length;
          return acc;
        }, {});
        const chips = filterDefs
          .filter((f) => f.id === 'all' || (counts[f.id] || 0) > 0)
          .map((f) => ({
            id: f.id,
            label: f.label,
            count: counts[f.id] || 0,
            color: f.color,
            icon: f.icon,
          }));
        const expanded = expandedGroups[group.key] !== false;

        return (
          <div key={group.key} style={{ marginBottom: '12px' }}>
            <div style={groupHeaderStyle}>
              <button
                type="button"
                style={groupToggleBtnStyle}
                onClick={() => toggleGroup(group.key)}
                aria-expanded={expanded}
              >
                <span>{group.label}</span>
                <span style={{ padding: '1px 6px', borderRadius: '999px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px', fontWeight: 700 }}>
                  {visibleItems.length}
                </span>
                {getThemedIcon('ui', expanded ? 'chevron_up' : 'chevron_down', 14, theme)}
              </button>
              {chips.length > 0 && (
                <GridQuickFilterChips
                  chips={chips}
                  activeId={groupFilter}
                  onChange={(id) => setGroupFilters((prev) => ({ ...prev, [group.key]: id }))}
                  compact
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                />
              )}
            </div>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="group-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <AnimatePresence initial={false}>
                    {visibleItems.map((item, idx) => (
                      <React.Fragment key={item.id ?? idx}>
                        {renderItem(item, idx)}
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function DayFilterBanner({ date, lang, t, isDark }) {
  if (!date) return null;
  const dateValue = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateValue.getTime())) return null;
  const dateStr = dateValue.toISOString().split('T')[0];
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '12px',
      padding: '8px 14px',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
      fontSize: '16px',
      color: isDark ? '#94a3b8' : '#64748b',
    }}>
      {getThemedIcon('ui', 'calendar', 18, isDark ? 'inverse' : 'primary')}
      <span>{t('showing_history_for') || 'Showing history for'}: <strong style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{formatDate(dateStr, lang)}</strong></span>
    </div>
  );
}

export default LectureLogDrawer;
