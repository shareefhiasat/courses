/**
 * WorkflowBadge Component
 *
 * Displays workflow status badge on files in the roster.
 * Shows pending/approved/rejected state with icon and color.
 */

import React from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';

const statusConfig = {
  pending: {
    label: 'Pending Approval',
    icon: null, // Remove icon for cleaner look
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-800',
    borderClass: 'border-0', // Remove border
  },
  in_progress: {
    label: 'In Review',
    icon: 'refresh_cw',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-300 dark:border-blue-700',
  },
  completed: {
    label: 'Approved',
    icon: 'check_circle',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-300 dark:border-green-700',
  },
  rejected: {
    label: 'Rejected',
    icon: 'x_circle',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-300 dark:border-red-700',
  },
};

export default function WorkflowBadge({ status, currentStage, compact = false }) {
  const { t } = useLang();

  if (!status || status === 'none') return null;

  const config = statusConfig[status] || statusConfig.pending;
  const icon = getThemedIcon('ui', config.icon, compact ? 12 : 16, 'light');

  if (compact) {
    return (
      <div
        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${config.bgClass} ${config.textClass}`}
        title={currentStage ? `${config.label}: ${currentStage}` : config.label}
        style={{ 
          fontSize: '0.8125rem', // Slightly larger for better readability
          fontWeight: 600,
          letterSpacing: '0.025em',
          minWidth: '100px', // Ensure consistent width
          justifyContent: 'center'
        }}
      >
        {config.icon ? icon : null}
        <span>{t(config.label)}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      {icon}
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{t(config.label)}</span>
        {currentStage && (
          <span className="text-xs opacity-80">{currentStage}</span>
        )}
      </div>
    </div>
  );
}
