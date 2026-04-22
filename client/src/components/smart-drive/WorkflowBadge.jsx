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
    icon: 'clock',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-300 dark:border-yellow-700',
  },
  in_progress: {
    label: 'In Review',
    icon: 'refresh',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-300 dark:border-blue-700',
  },
  completed: {
    label: 'Approved',
    icon: 'checkCircle',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-300 dark:border-green-700',
  },
  rejected: {
    label: 'Rejected',
    icon: 'xCircle',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-300 dark:border-red-700',
  },
};

export default function WorkflowBadge({ status, currentStage, compact = false }) {
  const { t } = useLang();

  if (!status || status === 'none') return null;

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = getThemedIcon(config.icon);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
        title={currentStage ? `${config.label}: ${currentStage}` : config.label}
      >
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium">{t(config.label)}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      <Icon className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{t(config.label)}</span>
        {currentStage && (
          <span className="text-xs opacity-80">{currentStage}</span>
        )}
      </div>
    </div>
  );
}
