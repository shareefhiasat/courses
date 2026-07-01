import React, { memo, useMemo, useCallback } from 'react';
import { Button, SimpleLoading } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';

const STATUS_LABELS = {
  ABSENT_NO_EXCUSE: 'Absent (No Excuse)',
  ABSENT_WITH_EXCUSE: 'Absent (Excused)',
  EXCUSED_LEAVE: 'Excused Leave',
  LATE: 'Late',
  HUMAN_CASE: 'Human Case',
  PRESENT: 'Present',
};

const STATUS_COLORS = {
  ABSENT_NO_EXCUSE: '#ef4444',
  ABSENT_WITH_EXCUSE: '#f59e0b',
  EXCUSED_LEAVE: '#3b82f6',
  LATE: '#f59e0b',
  HUMAN_CASE: '#a855f7',
  PRESENT: '#22c55e',
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
  width = 480,
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

  const renderProgressBar = useCallback((label, value, max, unit = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.875rem', color: mutedColor }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: textColor }}>
          {formatDeduction(value)} / {max}{unit}
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
            {new Date(entry.timestamp).toLocaleString()}
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
            {type === 'absence' ? (t('absence_deductions') || 'Absence Deductions') :
             type === 'penalty' ? (t('penalty_deductions') || 'Penalty Deductions') :
             (t('deductions') || 'Deductions')}
          </h3>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={onClose}
            style={{ padding: '4px 10px' }}
            aria-label="Close"
          >
            ×
          </Button>
        </div>

        {/* Student Info */}
        {student && (
          <div style={{
            padding: '0.75rem 1rem',
            background: cardBg,
            borderBottom: `1px solid ${borderColor}`,
          }}>
            <div style={{ fontWeight: 600, color: textColor, fontSize: '0.9rem' }}>
              {student.studentName || student.displayName || student.name || 'Unknown'}
            </div>
            <div style={{ fontSize: '0.75rem', color: mutedColor }}>
              {student.studentNumber ? `#${student.studentNumber} · ` : ''}
              {student.className || student.subjectName || ''}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <SimpleLoading message={t('loading_deductions') || 'Loading deductions...'} />
          </div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: mutedColor }}>
            {t('no_deduction_data') || 'No deduction data available'}
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
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: mutedColor,
                marginBottom: '0.75rem',
                letterSpacing: '0.05em',
              }}>
                {t('summary') || 'Summary'}
              </div>

              {/* Total Deduction */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: getProgressColor(totalDeduction, weight) }}>
                  {formatDeduction(totalDeduction)}
                </span>
                <span style={{ fontSize: '1rem', color: mutedColor }}>
                  / {weight} {t('deducted') || 'deducted'}
                </span>
              </div>

              {/* Suggested Score */}
              <div style={{
                marginBottom: '1rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: suggestedScore > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: mutedColor }}>{t('suggested_attendance_score') || 'Suggested attendance score'}: </span>
                <span style={{ fontWeight: 700, color: suggestedScore > 0 ? '#22c55e' : '#ef4444' }}>
                  {formatDeduction(suggestedScore)} / {weight}
                </span>
              </div>

              {/* Progress bars */}
              {renderProgressBar(t('total_deduction') || 'Total Deduction', totalDeduction, weight)}
              {renderProgressBar(t('absence_count') || 'Absence Count', absenceCount, thresholds.failureCount, ` / ${thresholds.failureCount}`)}

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
                      {t('attendance_failure') || 'Attendance Failure'}: {failureGrade}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: mutedColor }}>
                      {t('reached_threshold') || `Reached ${thresholds.failureCount} absence threshold`}
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
                  {t('itemized_deductions') || 'Itemized Deductions'} ({items.length})
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
                        gap: '0.75rem',
                        padding: '0.625rem',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '8px',
                        background: isDarkMode ? '#1f2937' : '#fff',
                      }}>
                        {/* Date */}
                        <div style={{
                          flexShrink: 0,
                          width: '64px',
                          textAlign: 'center',
                          padding: '0.25rem',
                          borderRadius: '6px',
                          background: cardBg,
                        }}>
                          <div style={{ fontSize: '0.7rem', color: mutedColor }}>
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short' })}
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: textColor }}>
                            {new Date(item.date).getDate()}
                          </div>
                        </div>

                        {/* Status + Excused */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.8rem',
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
                              fontSize: '0.65rem',
                              color: '#22c55e',
                              fontWeight: 600,
                            }}>
                              ✓ {t('excused_via_workflow') || 'Excused via workflow'}
                            </div>
                          )}
                        </div>

                        {/* Deduction amount */}
                        <div style={{
                          flexShrink: 0,
                          padding: '0.25rem 0.625rem',
                          borderRadius: '6px',
                          background: color,
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          minWidth: '48px',
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
                  {t('deduction_history') || 'Deduction History'} ({history.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {history.map((entry, idx) => renderHistoryEntry(entry, idx))}
                </div>
              </div>
            )}

            {items.length === 0 && history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: mutedColor }}>
                {t('no_deductions_found') || 'No deductions found for this student'}
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
