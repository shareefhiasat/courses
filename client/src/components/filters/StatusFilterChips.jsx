import React from 'react';
import { getColoredIcon } from '@constants/iconTypes';
import { TASK_STATUS, getStatusLabel } from '@utils/sharedTypes';

/**
 * Reusable status filter chips component
 * Used in HomePage, StudentDashboard, and ReviewResultsPage
 * 
 * Features:
 * - RTL support with logical properties
 * - Localized labels
 * - Accessibility with ARIA labels
 * - Hover and focus states
 * - Responsive design
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
      label: t('filter_completed') || getStatusLabel(TASK_STATUS.COMPLETED, lang),
      badge: completedCount !== undefined ? completedCount : undefined,
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
      label: t('filter_not_started') || getStatusLabel(TASK_STATUS.NOT_STARTED, lang),
      badge: pendingCount !== undefined ? pendingCount : undefined,
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
      label: t('filter_required') || 'Required',
      badge: requiredCount !== undefined ? requiredCount : undefined,
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
      label: t('filter_optional') || 'Optional',
      badge: optionalCount !== undefined ? optionalCount : undefined,
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
      label: t('filter_overdue') || 'Overdue',
      badge: overdueCount !== undefined ? overdueCount : undefined,
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
      label: t('filter_requires_submission') || 'Requires Submission',
      badge: requiresSubmissionCount !== undefined ? requiresSubmissionCount : undefined,
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
    <div 
      className={`filter-container flex flex-wrap gap-1 relative z-10 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}
      role="group"
      aria-label={t('status_filters') || 'Status filters'}
    >
      {filterChips.map(chip => (
        <button
          key={chip.id}
          className={`filter-button inline-flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isMinified 
              ? 'w-8 h-8 rounded-full border-1 p-0' 
              : `px-2 py-1 rounded-full border-1 text-xs font-semibold gap-1 ${lang === 'ar' ? 'flex-row-reverse' : ''}`
          }`}
          onClick={chip.toggle}
          title={chip.label}
          role="button"
          aria-pressed={chip.active}
          aria-label={`${chip.label} ${chip.active ? 'selected' : 'not selected'} ${chip.badge ? `(${chip.badge} items)` : ''}`}
          tabIndex={0}
          style={{
            borderColor: chip.colors.border,
            backgroundColor: chip.active ? chip.colors.activeBg : chip.colors.bg,
            color: chip.active ? chip.colors.activeText : chip.colors.text,
            borderRadius: 999,
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          {getColoredIcon('ui', chip.icon, isMinified ? 14 : 12, chip.active ? chip.colors.activeText : chip.colors.text, theme)}
          {!isMinified && <span className={`${lang === 'ar' ? 'ms-1' : 'me-1'}`}>{chip.label}</span>}
          {chip.badge !== undefined && (
            <span 
              className={`inline-flex items-center justify-center text-xs font-normal rounded-full ${
                lang === 'ar' ? 'me-1' : 'ms-1'
              }`}
              style={{
                backgroundColor: chip.active ? chip.colors.activeText : chip.colors.text,
                color: chip.active ? chip.colors.activeBg : chip.colors.bg,
                minWidth: '1rem',
                height: '1rem',
                padding: '0 0.25rem',
                fontSize: '0.625rem',
                lineHeight: '1rem'
              }}
            >
              {chip.badge > 99 ? '99+' : chip.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default StatusFilterChips;
