import React from 'react';
import { getColoredIcon } from '@constants/iconTypes';
import { TASK_STATUS, getStatusLabel } from '@utils/sharedTypes';

/**
 * Reusable status filter chips component
 * Used in HomePage, StudentDashboard, and ReviewResultsPage
 */
const StatusFilterChips = ({
  completedFilter,
  setCompletedFilter,
  pendingFilter,
  setPendingFilter,
  requiredFilter,
  setRequiredFilter,
  optionalFilter,
  setOptionalFilter,
  overdueFilter,
  setOverdueFilter,
  requiresSubmissionFilter,
  setRequiresSubmissionFilter,
  completedCount = 0,
  pendingCount = 0,
  requiredCount = 0,
  optionalCount = 0,
  overdueCount = 0,
  requiresSubmissionCount = 0,
  isMinified = false,
  theme = 'light',
  lang = 'en',
  t = (key) => key
}) => {
  const filterChips = [
    {
      id: 'completed',
      active: completedFilter,
      toggle: () => setCompletedFilter(v => !v),
      icon: 'check_circle',
      label: getStatusLabel(TASK_STATUS.COMPLETED, lang),
      badge: completedCount > 0 ? completedCount : undefined,
      colors: {
        border: '#bbf7d0',
        bg: '#ecfdf5',
        activeBg: '#16a34a',
        text: '#16a34a',
        activeText: '#fff'
      }
    },
    {
      id: 'pending',
      active: pendingFilter,
      toggle: () => setPendingFilter(v => !v),
      icon: 'hourglass',
      label: getStatusLabel(TASK_STATUS.NOT_STARTED, lang),
      badge: pendingCount > 0 ? pendingCount : undefined,
      colors: {
        border: '#fde68a',
        bg: '#fffbeb',
        activeBg: '#f59e0b',
        text: '#b45309',
        activeText: '#fff'
      }
    },
    {
      id: 'required',
      active: requiredFilter,
      toggle: () => setRequiredFilter(v => !v),
      icon: 'alert_circle',
      label: t('required') || 'Required',
      badge: requiredCount > 0 ? requiredCount : undefined,
      colors: {
        border: '#fecaca',
        bg: '#fee2e2',
        activeBg: '#b91c1c',
        text: '#b91c1c',
        activeText: '#fff'
      }
    },
    {
      id: 'optional',
      active: optionalFilter,
      toggle: () => setOptionalFilter(v => !v),
      icon: 'book_open',
      label: t('optional') || 'Optional',
      badge: optionalCount > 0 ? optionalCount : undefined,
      colors: {
        border: '#fed7aa',
        bg: '#fff3e0',
        activeBg: '#f57c00',
        text: '#b45309',
        activeText: '#fff'
      }
    },
    {
      id: 'overdue',
      active: overdueFilter,
      toggle: () => setOverdueFilter(v => !v),
      icon: 'clock',
      label: t('overdue') || 'Overdue',
      badge: overdueCount > 0 ? overdueCount : undefined,
      colors: {
        border: '#fecaca',
        bg: '#fee2e2',
        activeBg: '#dc2626',
        text: '#dc2626',
        activeText: '#fff'
      }
    },
    {
      id: 'requiresSubmission',
      active: requiresSubmissionFilter,
      toggle: () => setRequiresSubmissionFilter(v => !v),
      icon: 'send',
      label: t('requires_submission') || 'Requires Submission',
      badge: requiresSubmissionCount > 0 ? requiresSubmissionCount : undefined,
      colors: {
        border: '#3b82f6',
        bg: '#dbeafe',
        activeBg: '#2563eb',
        text: '#1e40af',
        activeText: '#fff'
      }
    }
  ];

  return (
    <div className="filter-container filter-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
      {filterChips.map(chip => (
        <button
          key={chip.id}
          className="filter-button"
          onClick={chip.toggle}
          title={chip.label}
          style={isMinified ? {
            width: 32,
            height: 32,
            borderRadius: 999,
            border: `1px solid ${chip.colors.border}`,
            background: chip.active ? chip.colors.activeBg : chip.colors.bg,
            color: chip.active ? chip.colors.activeText : chip.colors.text,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.2s ease'
          } : {
            padding: '4px 8px',
            borderRadius: 999,
            border: `1px solid ${chip.colors.border}`,
            background: chip.active ? chip.colors.activeBg : chip.colors.bg,
            color: chip.active ? chip.colors.activeText : chip.colors.text,
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {getColoredIcon('ui', chip.icon, isMinified ? 14 : 12, chip.active ? chip.colors.activeText : chip.colors.text, theme)}
          {!isMinified && <span>{chip.label}</span>}
          {chip.badge && (
            <span style={{
              marginLeft: 4,
              background: chip.active ? chip.colors.activeText : chip.colors.text,
              color: chip.active ? chip.colors.activeBg : chip.colors.bg,
              fontSize: '0.625rem',
              fontWeight: 600,
              padding: '1px 4px',
              borderRadius: 999,
              minWidth: 16,
              textAlign: 'center',
              lineHeight: 1
            }}>
              {chip.badge > 99 ? '99+' : chip.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default StatusFilterChips;
