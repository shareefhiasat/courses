import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getUserRoleColor, getUserRoleIcon } from '@constants/iconTypes';
import { resolveUserRole } from '@utils/userUtils';
import useResizableDrawer from '@hooks/useResizableDrawer';
import { getLectureLog, getRecordHistory } from '@services/business/attendanceLogService';
import { formatDate, formatDateTime } from '@utils/date-formatter.js';
import { getAttendanceColor } from '@constants/attendanceTypes.js';
import { getWorkflowStatusColor } from '@constants/workspaceStatusColors.js';
import { getDateGroup, getGroupLabel } from '@utils/notificationHelpers.js';
import { Workflow as WorkflowIcon } from 'lucide-react';

const TABS = {
  LECTURE_LOG: 'lecture_log',
  RECORD_HISTORY: 'record_history',
};

const LectureLogDrawer = ({ isOpen, onClose, classInfo, date, embedded = false }) => {
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'lecture_log_drawer_width',
    defaultWidth: 520,
    minWidth: 360,
    maxWidth: 900,
    isRTL,
  });

  const [activeTab, setActiveTab] = useState(TABS.LECTURE_LOG);
  const [lectureLog, setLectureLog] = useState([]);
  const [recordHistory, setRecordHistory] = useState([]);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const classId = classInfo?.id;
  const dateStr = date ? new Date(date).toISOString().split('T')[0] : null;

  useEffect(() => {
    if (!isOpen || !classId || !dateStr) return;
    setLoading(true);
    setError(null);
    getLectureLog(classId, dateStr)
      .then((res) => {
        if (res.success) {
          setLectureLog(res.data || []);
        } else {
          setError(res.error || 'Failed to load');
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [isOpen, classId, dateStr]);

  const handleRecordHistoryFetch = useCallback(async (attendanceId) => {
    setSelectedAttendanceId(attendanceId);
    setLoading(true);
    setError(null);
    const res = await getRecordHistory(attendanceId);
    if (res.success) {
      setRecordHistory(res.data || []);
    } else {
      setError(res.error || 'Failed to load');
    }
    setLoading(false);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === TABS.LECTURE_LOG) {
      setRecordHistory([]);
      setSelectedAttendanceId(null);
    }
  }, []);

  const formatTimestamp = useCallback((ts) => {
    if (!ts) return '';
    return formatDateTime(ts, lang);
  }, [lang]);

  const groupedLectureLog = useMemo(() => {
    const sorted = [...lectureLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
  }, [lectureLog, t]);

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
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
    background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
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

  const renderEntryCard = (entry, idx) => {
    const isWorkflow = entry.type === 'workflow_status_change';
    const isAttendanceChange = entry.type === 'attendance_status_change';
    const isAttendanceMarked = !isWorkflow && !isAttendanceChange;
    const rawStatus = isAttendanceMarked ? entry.status : entry.toStatus;
    const statusRaw = isAttendanceMarked ? (lang === 'ar' ? entry.statusAr : entry.status) : (lang === 'ar' ? entry.toStatusAr : entry.toStatus);
    const statusColor = isWorkflow
      ? getWorkflowStatusColor(entry.toStatus)
      : getAttendanceColor(rawStatus);
    const iconColor = isWorkflow
      ? getWorkflowStatusColor(entry.toStatus)
      : getAttendanceColor(rawStatus);
    const titleKey = isWorkflow
      ? (lang === 'ar' ? 'تغيير حالة العمل' : 'Workflow Status Change')
      : isAttendanceChange
        ? (lang === 'ar' ? 'تغيير حالة الحضور' : 'Attendance Status Change')
        : (lang === 'ar' ? 'تسجيل حضور' : 'Attendance Marked');

    const actorRole = entry.user ? resolveUserRole(entry.user) : null;
    const actorRoleIcon = actorRole ? getUserRoleIcon(actorRole) : null;
    const actorRoleColor = actorRole ? getUserRoleColor(actorRole) : null;
    const showRoleLabel = actorRole && (actorRole === 'admin' || actorRole === 'hr' || actorRole === 'instructor');

    return (
      <motion.div
        key={`${entry.id || idx}-${entry.timestamp}`}
        initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: idx * 0.03 }}
        style={cardStyle}
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
            {isAttendanceMarked ? (
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: statusColor,
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
                {titleKey}
              </span>
              <span style={{
                fontSize: '11px',
                color: isDark ? '#6b7280' : '#9ca3af',
              }}>
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
            {isAttendanceMarked ? (
              <>
                <div style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#475569', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: statusColor }}>{statusRaw || '—'}</span>
                  <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {actorRoleIcon && React.cloneElement(actorRoleIcon, { color: actorRoleColor, size: 10 })}
                    <span>· {entry.actor}</span>
                    {showRoleLabel && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: `${actorRoleColor}22`,
                        color: actorRoleColor,
                      }}>
                        {actorRole}
                      </span>
                    )}
                  </span>
                </div>
                {entry.reason && (
                  <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                    "{entry.reason}"
                  </div>
                )}
              </>
            ) : (isWorkflow || isAttendanceChange) ? (
              <>
                <div style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#475569', marginBottom: '2px' }}>
                  <span style={labelStyle}>{t('log_drawer_from') || 'From'}: </span>
                  <span style={valueStyle}>{(lang === 'ar' ? entry.fromStatusAr : entry.fromStatus) || '—'}</span>
                  <span style={{ margin: '0 6px', color: isDark ? '#6b7280' : '#9ca3af' }}>→</span>
                  <span style={labelStyle}>{t('log_drawer_to') || 'To'}: </span>
                  <span style={{ ...valueStyle, color: iconColor, fontWeight: 600 }}>{(lang === 'ar' ? entry.toStatusAr : entry.toStatus) || '—'}</span>
                </div>
                <div style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#475569', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {actorRoleIcon && React.cloneElement(actorRoleIcon, { color: actorRoleColor, size: 12 })}
                  <span style={valueStyle}>{entry.actor}</span>
                  {showRoleLabel && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: `${actorRoleColor}22`,
                      color: actorRoleColor,
                    }}>
                      {actorRole}
                    </span>
                  )}
                </div>
                {entry.reason && (
                  <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                    "{entry.reason}"
                  </div>
                )}
                {entry.documentTitle && (
                  <div style={{ fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>
                    {t('log_drawer_document') || 'Document'}: {entry.documentTitle}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 12px',
    marginBottom: '8px',
    borderRadius: '8px',
    border: 'none',
    background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
    color: isDark ? '#f1f5f9' : '#1e293b',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'start',
  }), [isDark]);

  const renderLectureLog = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {t('loading') || 'Loading...'}
        </div>
      );
    }

    if (lectureLog.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {getThemedIcon('ui', 'inbox', 48, theme)}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {t('log_drawer_no_entries') || 'No log entries found for this lecture'}
          </p>
        </div>
      );
    }

    return (
      <div style={{ padding: '12px' }}>
        {groupedLectureLog.map((group) => {
          const expanded = expandedGroups[group.key] !== false;
          return (
            <div key={group.key} style={{ marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                style={groupHeaderStyle}
              >
                <span>{group.label} ({group.items.length})</span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>{expanded ? '▲' : '▼'}</span>
              </button>
              {expanded && (
                <AnimatePresence initial={false}>
                  {group.items.map((entry, idx) => renderEntryCard(entry, idx))}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderRecordHistory = () => {
    if (!selectedAttendanceId) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {getThemedIcon('ui', 'search', 48, theme)}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {t('log_drawer_select_record') || 'Select an attendance record from the lecture log to view its change history'}
          </p>
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
          {t('log_drawer_record_id') || 'Record ID'}: #{selectedAttendanceId}
        </div>
        {recordHistory.map((change, idx) => {
          const fromName = lang === 'ar' ? change.fromStatus?.nameAr : change.fromStatus?.nameEn;
          const toName = lang === 'ar' ? change.toStatus?.nameAr : change.toStatus?.nameEn;
          const actorName = change.changedByUser?.displayName
            || `${change.changedByUser?.firstName || ''} ${change.changedByUser?.lastName || ''}`.trim()
            || 'System';

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
                <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {t('log_drawer_by') || 'By'}: {actorName}
                </span>
                <span style={{ fontSize: '11px', color: isDark ? '#6b7280' : '#9ca3af' }}>
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

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              style={activeTab === TABS.LECTURE_LOG ? activeTabStyle : tabBtnStyle}
              onClick={() => handleTabChange(TABS.LECTURE_LOG)}
            >
              {t('log_drawer_tab_lecture') || 'Lecture Log'}
            </button>
            <button
              style={activeTab === TABS.RECORD_HISTORY ? activeTabStyle : tabBtnStyle}
              onClick={() => handleTabChange(TABS.RECORD_HISTORY)}
            >
              {t('log_drawer_tab_record') || 'Record History'}
            </button>
          </div>
        </div>
      )}

      {embedded && (
        <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}` }}>
          <button
            style={activeTab === TABS.LECTURE_LOG ? activeTabStyle : tabBtnStyle}
            onClick={() => handleTabChange(TABS.LECTURE_LOG)}
          >
            {t('log_drawer_tab_lecture') || 'Lecture Log'}
          </button>
          <button
            style={activeTab === TABS.RECORD_HISTORY ? activeTabStyle : tabBtnStyle}
            onClick={() => handleTabChange(TABS.RECORD_HISTORY)}
          >
            {t('log_drawer_tab_record') || 'Record History'}
          </button>
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
              {activeTab === TABS.LECTURE_LOG && renderLectureLog()}
              {activeTab === TABS.RECORD_HISTORY && renderRecordHistory()}
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

export default LectureLogDrawer;
