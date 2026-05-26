/**
 * WorkflowBadge Component
 *
 * Displays workflow status badge on files in the roster.
 * Shows pending/approved/rejected state with icon and color.
 */

import React from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { WORKFLOW_STATUS_CONFIG } from '@constants/driveConstants';

export default function WorkflowBadge({ status, currentStage, compact = false }) {
  const { t } = useLang();

  if (!status || status === 'none') return null;

  const config = WORKFLOW_STATUS_CONFIG[status] || WORKFLOW_STATUS_CONFIG.draft;
  const icon = getThemedIcon('ui', config.icon, compact ? 12 : 16, 'light');
  const label = t(config.labelKey);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${config.bgClass} ${config.textClass}`}
        title={currentStage ? `${label}: ${currentStage}` : label}
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          letterSpacing: '0.025em',
          minWidth: '100px',
          justifyContent: 'center',
        }}
      >
        {config.icon ? icon : null}
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      {icon}
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        {currentStage && (
          <span className="text-xs opacity-80">{currentStage}</span>
        )}
      </div>
    </div>
  );
}
