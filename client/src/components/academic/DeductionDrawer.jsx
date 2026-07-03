import React, { memo, useMemo, useCallback } from 'react';
import { Button, SimpleLoading } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { formatDateTime, formatDateShort, getQatarDateParts } from '@utils/date-formatter.js';

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
  width = 680,
}) => {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const borderColor = isDarkMode ? '#374151' : '#e5e7eb';
  const textColor = isDarkMode ? '#f3f4f6' : '#111827';
  const mutedColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const cardBg = isDarkMode ? '#374151' : '#f9fafb';

  const drawerStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    right: isOpen ? 0 : `-${width}px`,
    width: `${width}px`,
    height: '100vh',
    background: bgColor,
    boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
    transition: 'right 0.3s ease-in-out',
    zIndex: 1000,
    overflow: 'auto',
  }), [isOpen, width, bgColor]);

  const backdropStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: `${width}px`,
    height: '100vh',
    background: 'rgba(0,0,0,0.1)',
    zIndex: 999,
  }), [width]);

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

    return (
      <div key={`${entry.id}-${index}`} style={{
        padding: '0.75rem',
        marginBottom: '0.5rem',
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        background: cardBg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: isReduction ? '#22c55e' : isInitial ? '#3b82f6' : '#f59e0b',
          }}>
            {isReduction ? '↓ Reduction' : isInitial ? '◆ Initial' : '✎ Amendment'}
          </span>
          <span style={{ fontSize: '0.7rem', color: mutedColor }}>
            {formatDateTime(entry.timestamp, lang)}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: textColor, marginBottom: '0.25rem' }}>
          {entry.description}
        </div>
        {entry.deductionChange !== undefined && (
          <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>
              {formatDeduction(entry.deductionChange.old)}
            </span>
            <span style={{ color: mutedColor }}>→</span>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>
              {formatDeduction(entry.deductionChange.new)}
            </span>
            <span style={{ color: mutedColor, fontSize: '0.7rem' }}>
              (Δ {formatDeduction(entry.deductionChange.new - entry.deductionChange.old)})
            </span>
          </div>
        )}
        {entry.actorName && (
          <div style={{ fontSize: '0.7rem', color: mutedColor, marginTop: '0.25rem' }}>
            by {entry.actorName}
          </div>
        )}
      </div>
    );
  }, [borderColor, cardBg, textColor, mutedColor]);

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
              <div style={{ fontWeight: 600, color: textColor, fontSize: '0.9rem' }}>
                {student.studentName || student.displayName || student.name || 'Unknown'}
              </div>
              <div style={{ fontSize: '0.75rem', color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {student.studentNumber ? `#${student.studentNumber} · ` : ''}
                {student.programName ? `${student.programName} · ` : ''}
                {student.subjectName ? `${student.subjectName} · ` : ''}
                {student.className || ''}
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
                        gap: '1rem',
                        padding: '0.875rem',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '10px',
                        background: isDarkMode ? '#1f2937' : '#fff',
                      }}>
                        {/* Date */}
                        <div style={{
                          flexShrink: 0,
                          width: '72px',
                          textAlign: 'center',
                          padding: '0.375rem',
                          borderRadius: '8px',
                          background: cardBg,
                        }}>
                          <div style={{ fontSize: '0.75rem', color: mutedColor }}>
                            {formatDateShort(item.date, lang)}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: textColor }}>
                            {getQatarDateParts(item.date)?.day || ''}
                          </div>
                        </div>

                        {/* Status + Excused */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: textColor,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {label}
                          </div>
                          {excused && (
                            <div style={{
                              fontSize: '0.7rem',
                              color: '#22c55e',
                              fontWeight: 600,
                            }}>
                              ✓ {t('excused_via_workflow')}
                            </div>
                          )}
                        </div>

                        {/* Deduction amount */}
                        <div style={{
                          flexShrink: 0,
                          padding: '0.375rem 0.875rem',
                          borderRadius: '8px',
                          background: color,
                          color: '#fff',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          minWidth: '56px',
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
                  marginBottom: '0.75rem',
                  letterSpacing: '0.05em',
                }}>
                  {t('deduction_history')} ({history.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {history.map((entry, idx) => renderHistoryEntry(entry, idx))}
                </div>
              </div>
            )}

            {items.length === 0 && history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: mutedColor }}>
                {t('no_deductions_found')}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
});

DeductionDrawer.displayName = 'DeductionDrawer';

export default DeductionDrawer;
