import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { ExternalLink, Workflow } from 'lucide-react';
import { Button, SimpleLoading } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import useResizableDrawer from '@hooks/useResizableDrawer';
import { formatDateTime, formatDateShort, getQatarDateParts, formatDate } from '@utils/date-formatter.js';
import { getWorkflowDocumentsByContext } from '@services/api/workflow-documents-api';
import DayWorkflowsDrawer from './DayWorkflowsDrawer';

const WORKFLOW_ACTIVE = '#8b5cf6';
const WORKFLOW_INACTIVE = '#9ca3af';

function toDateKey(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

const STATUS_LABELS = {
  ATTENDANCE_ABSENT: 'Absent (No Excuse)',
  ATTENDANCE_LEAVE: 'Excused Leave',
  ATTENDANCE_LATE: 'Late',
  ATTENDANCE_HUMAN_CASE: 'Human Case',
  ATTENDANCE_PRESENT: 'Present',
};

const STATUS_COLORS = {
  ATTENDANCE_ABSENT: '#ef4444',
  ATTENDANCE_LEAVE: '#3b82f6',
  ATTENDANCE_LATE: '#f59e0b',
  ATTENDANCE_HUMAN_CASE: '#a855f7',
  ATTENDANCE_PRESENT: '#22c55e',
};

function getProgressColor(value, max) {
  if (!max) return '#6b7280';
  const pct = value / max;
  if (pct >= 1) return '#dc2626';
  if (pct >= 0.75) return '#ef4444';
  if (pct >= 0.5) return '#f59e0b';
  return '#22c55e';
}

function formatDeduction(val) {
  return Number(val).toFixed(2);
}

const DeductionDrawer = memo(({
  isOpen,
  onClose,
  student = null,
  data = null,
  history = [],
  loading = false,
  type = 'absence',
  weight = 10,
  thresholds = { failureCount: 8, failureGrade: 'FB' },
  width: widthProp = 400,
  programId = '',
  classId: classIdProp = null,
}) => {
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'deduction_drawer_width',
    defaultWidth: widthProp,
    minWidth: 320,
    maxWidth: 800,
    isRTL,
  });

  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'recorded', 'approved', 'amended', 'no-workflow'
  const [dayWorkflowContext, setDayWorkflowContext] = useState(null);
  const [datesWithWorkflows, setDatesWithWorkflows] = useState(() => new Set());

  const resolvedClassId = classIdProp || student?.classId || null;
  const resolvedUserId = student?.studentId || student?.userId || student?.id;

  useEffect(() => {
    if (!isOpen || !resolvedUserId || !resolvedClassId) {
      setDatesWithWorkflows(new Set());
      return;
    }

    const summaryItems = data?.items || data?.summary?.items || [];
    const dates = [...new Set([
      ...summaryItems.map((item) => item.date),
      ...history.map((entry) => entry.attendanceDate),
    ].filter(Boolean).map(toDateKey))];

    if (dates.length === 0) {
      setDatesWithWorkflows(new Set());
      return;
    }

    let cancelled = false;
    (async () => {
      const active = new Set();
      await Promise.all(dates.map(async (date) => {
        try {
          const result = await getWorkflowDocumentsByContext({
            userId: resolvedUserId,
            classId: resolvedClassId,
            date,
          });
          const rows = result?.data || result?.payload || [];
          if (result?.success !== false && rows.length > 0) {
            active.add(date);
          }
        } catch (err) {
          console.warn('[DeductionDrawer] workflow lookup failed', err);
        }
      }));
      if (!cancelled) setDatesWithWorkflows(active);
    })();

    return () => { cancelled = true; };
  }, [isOpen, resolvedUserId, resolvedClassId, data, history]);

  const renderDayWorkflowButton = useCallback((date) => {
    if (!date) return null;
    const key = toDateKey(date);
    const hasWorkflows = datesWithWorkflows.has(key);
    return (
      <button
        type="button"
        onClick={() => hasWorkflows && setDayWorkflowContext({ date })}
        disabled={!hasWorkflows}
        title={hasWorkflows
          ? (t('workflow.dayDrawer.open', 'View workflows for this day'))
          : (t('workflow.dayDrawer.none', 'No workflows for this day'))}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: hasWorkflows ? 'pointer' : 'not-allowed',
          padding: '1px',
          display: 'flex',
          alignItems: 'center',
          color: hasWorkflows ? WORKFLOW_ACTIVE : WORKFLOW_INACTIVE,
          borderRadius: '3px',
          flexShrink: 0,
          opacity: hasWorkflows ? 1 : 0.55,
        }}
      >
        <Workflow size={12} />
      </button>
    );
  }, [datesWithWorkflows, t]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return history;
    if (historyFilter === 'no-workflow') return history.filter(e => !e.workflowDocumentId);
    return history.filter(e => e.eventType === historyFilter);
  }, [history, historyFilter]);

  const filterButtons = useMemo(() => {
    const total = history.length;
    const counts = {
      all: total,
      recorded: history.filter(e => e.eventType === 'attendance_recorded').length,
      approved: history.filter(e => e.eventType === 'excuse_approved' || e.eventType === 'amended_to_excused').length,
      amended: history.filter(e => e.eventType === 'amended').length,
      'no-workflow': history.filter(e => !e.workflowDocumentId).length,
    };
    return [
      { key: 'all', label: 'All', count: counts.all },
      { key: 'attendance_recorded', label: 'Recorded', count: counts.recorded },
      { key: 'excuse_approved', label: 'Approved', count: counts.approved },
      { key: 'amended', label: 'Amended', count: counts.amended },
      { key: 'no-workflow', label: 'No Workflow', count: counts['no-workflow'] },
    ].filter(b => b.key === 'all' || (b.count > 0 && b.count < total));
  }, [history]);

  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const borderColor = isDarkMode ? '#374151' : '#e5e7eb';
  const textColor = isDarkMode ? '#f3f4f6' : '#111827';
  const mutedColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const cardBg = isDarkMode ? '#374151' : '#f9fafb';

  const drawerStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    right: isRTL ? 'auto' : (isOpen ? 0 : `-${drawerWidth}px`),
    left: isRTL ? (isOpen ? 0 : `-${drawerWidth}px`) : 'auto',
    width: `${drawerWidth}px`,
    height: '100vh',
    background: bgColor,
    boxShadow: isRTL ? '2px 0 10px rgba(0,0,0,0.1)' : '-2px 0 10px rgba(0,0,0,0.1)',
    transition: 'right 0.3s ease-in-out, left 0.3s ease-in-out',
    zIndex: 1000,
    overflow: 'auto',
  }), [isOpen, drawerWidth, bgColor, isRTL]);

  const backdropStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: isRTL ? `${drawerWidth}px` : 0,
    right: isRTL ? 0 : `${drawerWidth}px`,
    height: '100vh',
    background: 'rgba(0,0,0,0.45)',
    zIndex: 999,
  }), [drawerWidth, isRTL]);

  const summary = data?.summary || data;
  const items = data?.items || data?.rows || [];
  const totalDeduction = summary?.totalDeduction ?? 0;
  const absenceCount = summary?.absenceCount ?? summary?.count ?? 0;
  const suggestedScore = summary?.suggestedScore ?? Math.max(0, weight - totalDeduction);
  const failureByCount = summary?.failureByCount ?? (absenceCount >= thresholds.failureCount);
  const failureGrade = summary?.failureGrade ?? (failureByCount ? thresholds.failureGrade : null);

  const renderProgressBar = useCallback((label, value, max, isInteger = false) => (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.875rem', color: mutedColor }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
          {isInteger ? Math.round(value) : formatDeduction(value)} / {max}
        </span>
      </div>
      <div style={{
        height: '8px',
        borderRadius: '4px',
        background: isDarkMode ? '#1f2937' : '#e5e7eb',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, (value / max) * 100)}%`,
          background: getProgressColor(value, max),
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  ), [mutedColor, textColor, isDarkMode]);

  const renderHistoryEntry = useCallback((entry, index) => {
    const isReduction = entry.eventType === 'excuse_approved' || entry.eventType === 'amended_to_excused';
    const isInitial = entry.eventType === 'attendance_recorded';
    const delta = entry.deductionChange ? entry.deductionChange.new - entry.deductionChange.old : 0;
    const isDeductionIncrease = delta > 0;

    return (
      <div key={`${entry.id}-${index}`} style={{
        padding: '0.5rem 0.625rem',
        marginBottom: '0.375rem',
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        background: cardBg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: isReduction ? '#22c55e' : isInitial ? '#3b82f6' : '#f59e0b',
          }}>
            {isReduction ? '↓ Excuse Approved' : isInitial ? '● Recorded' : '✎ Amended'}
          </span>
          <span style={{ fontSize: '0.65rem', color: mutedColor }}>
            {formatDate(entry.timestamp, lang)}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: textColor, marginBottom: '0.15rem' }}>
          {entry.description}
        </div>
        {entry.deductionChange !== undefined && (
          <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: mutedColor }}>
              Deduction: {formatDeduction(entry.deductionChange.old)} → {formatDeduction(entry.deductionChange.new)}
            </span>
            <span style={{
              color: isDeductionIncrease ? '#ef4444' : '#22c55e',
              fontWeight: 600,
              fontSize: '0.65rem',
            }}>
              ({isDeductionIncrease ? '-' : '+'}{formatDeduction(Math.abs(delta))})
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
          {entry.actorName && (
            <span style={{ fontSize: '0.65rem', color: mutedColor }}>
              by {entry.actorName}
            </span>
          )}
          {entry.workflowDocumentId && (
            <button
              onClick={() => window.open(`/workflow-documents/${entry.workflowDocumentId}`, '_blank')}
              title={t('view_workflow') || 'View workflow'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '1px',
                display: 'flex',
                alignItems: 'center',
                color: mutedColor,
              }}
            >
              <ExternalLink size={12} />
            </button>
          )}
          {entry.attendanceDate && renderDayWorkflowButton(entry.attendanceDate)}
        </div>
      </div>
    );
  }, [borderColor, cardBg, textColor, mutedColor, lang, t, renderDayWorkflowButton]);

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div
          style={backdropStyle}
          onClick={onClose}
          role="button"
          tabIndex={0}
          aria-label="Close drawer"
        />
      )}

      <div
        style={drawerStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: bgColor,
          zIndex: 10,
        }}>
          <h3 style={{ margin: 0, color: textColor, fontSize: '1.125rem', fontWeight: 700 }}>
            {type === 'absence' ? (t('absence_deductions')) :
             type === 'penalty' ? (t('penalty_deductions')) :
             (t('deductions'))}
          </h3>
        </div>

        {/* Student Info */}
        {student && (
          <div style={{
            padding: '0.75rem 1rem',
            background: cardBg,
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            {/* Avatar */}
            <div style={{
              flexShrink: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isDarkMode ? '#4b5563' : '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              color: isDarkMode ? '#e5e7eb' : '#4b5563',
              overflow: 'hidden',
            }}>
              {(student.studentName || student.displayName || student.name || '?')
                .split(' ')
                .map(w => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontWeight: 600, color: textColor, fontSize: '0.9rem' }}>
                  {student.studentName || student.displayName || student.name || 'Unknown'}
                </div>
                {student.studentId && (
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (student.studentId) params.set('studentId', student.studentId);
                      if (programId) params.set('programId', programId);
                      if (student.subjectId) params.set('subjectId', student.subjectId);
                      if (student.classId) params.set('classId', student.classId);
                      window.open(`/student-dashboard?${params.toString()}`, '_blank');
                    }}
                    title={t('open_student_dashboard') || 'Open student dashboard'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      color: mutedColor,
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: mutedColor, lineHeight: 1.4 }}>
                {student.studentNumber && <div>#{student.studentNumber}</div>}
                {student.programName && <div>{student.programName}</div>}
                {student.subjectName && <div>{student.subjectName}</div>}
                {student.className && <div>{student.className}</div>}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <SimpleLoading message={t('loading_deductions')} />
          </div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: mutedColor }}>
            {t('no_deduction_data')}
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {/* Summary Section */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              background: cardBg,
            }}>
              {/* Big numbers: deduction + remaining score */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', borderRadius: '8px', background: isDarkMode ? '#1f2937' : '#fff', border: `1px solid ${borderColor}` }}>
                  <div style={{ fontSize: '0.7rem', color: mutedColor, textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {t('deducted')}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: getProgressColor(totalDeduction, weight) }}>
                    -{formatDeduction(totalDeduction)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: mutedColor }}>out of {weight}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', borderRadius: '8px', background: isDarkMode ? '#1f2937' : '#fff', border: `1px solid ${borderColor}` }}>
                  <div style={{ fontSize: '0.7rem', color: mutedColor, textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {t('remaining_score')}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: suggestedScore > 0 ? '#22c55e' : '#ef4444' }}>
                    {formatDeduction(suggestedScore)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: mutedColor }}>out of {weight}</div>
                </div>
              </div>

              {/* Progress bars */}
              {renderProgressBar(t('marks_lost'), totalDeduction, weight)}
              {renderProgressBar(t('absences'), absenceCount, thresholds.failureCount, true)}

              {/* Failure Warning */}
              {failureGrade && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.875rem' }}>
                      {t('attendance_failure')}: {failureGrade}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: mutedColor }}>
                      {t('reached_threshold')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Itemized Deductions */}
            {items.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: mutedColor,
                  marginBottom: '0.75rem',
                  letterSpacing: '0.05em',
                }}>
                  {t('itemized_deductions')} ({items.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {items.map((item, idx) => {
                    const statusCode = item.statusCode || item.status?.code || '';
                    const color = STATUS_COLORS[statusCode] || '#6b7280';
                    const label = STATUS_LABELS[statusCode] || statusCode || 'Unknown';
                    const excused = item.excusedViaWorkflow || !!item.excuseApprovedAt;

                    return (
                      <div key={item.attendanceId || idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.375rem 0.5rem',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '6px',
                        background: isDarkMode ? '#1f2937' : '#fff',
                      }}>
                        {/* Date */}
                        <div style={{
                          flexShrink: 0,
                          fontSize: '0.7rem',
                          color: mutedColor,
                          minWidth: '70px',
                        }}>
                          {formatDate(item.date, lang)}
                        </div>

                        {/* Status + Excused */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: textColor,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {label}
                          </span>
                          {excused && (
                            <span
                              title={t('workflow.excuseApprovedBadge', 'Excuse approved — 0.25 deduction')}
                              style={{
                                fontSize: '0.65rem',
                                color: '#22c55e',
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              0.25
                            </span>
                          )}
                        {renderDayWorkflowButton(item.date)}
                        {item.workflowDocumentId && (
                            <button
                              onClick={() => window.open(`/workflow-documents/${item.workflowDocumentId}`, '_blank')}
                              title={t('view_workflow') || 'View workflow'}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                color: mutedColor,
                                borderRadius: '3px',
                                flexShrink: 0,
                              }}
                            >
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>

                        {/* Deduction amount */}
                        <div style={{
                          flexShrink: 0,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: color,
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          minWidth: '44px',
                          textAlign: 'center',
                        }}>
                          -{formatDeduction(item.deduction)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History Timeline */}
            {history.length > 0 && (
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: mutedColor,
                  marginBottom: '0.5rem',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}>
                  <span>{t('deduction_history')} ({filteredHistory.length})</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                  {filterButtons.map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setHistoryFilter(btn.key)}
                      style={{
                        padding: '2px 8px', borderRadius: '10px', border: `1px solid ${historyFilter === btn.key ? 'var(--brand)' : borderColor}`,
                        fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        background: historyFilter === btn.key ? 'var(--brand)' : 'transparent',
                        color: historyFilter === btn.key ? '#fff' : mutedColor,
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                      }}
                    >
                      {btn.label}
                      <span style={{
                        fontSize: '0.55rem', opacity: 0.8,
                        background: historyFilter === btn.key ? 'rgba(255,255,255,0.2)' : cardBg,
                        padding: '0 4px', borderRadius: '8px',
                      }}>{btn.count}</span>
                    </button>
                  ))}
                </div>
                {filteredHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {filteredHistory.map((entry, idx) => renderHistoryEntry(entry, idx))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: mutedColor, fontSize: '0.75rem' }}>
                    No entries match this filter
                  </div>
                )}
              </div>
            )}

            {items.length === 0 && history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: mutedColor }}>
                {t('no_deductions_found')}
              </div>
            )}
          </div>
        )}
        <div {...resizeHandleProps} />
      </div>

      <DayWorkflowsDrawer
        isOpen={Boolean(dayWorkflowContext)}
        onClose={() => setDayWorkflowContext(null)}
        student={student}
        classId={resolvedClassId}
        date={dayWorkflowContext?.date}
        programId={programId}
      />
    </>
  );
});

DeductionDrawer.displayName = 'DeductionDrawer';

export default DeductionDrawer;
