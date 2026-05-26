/**
 * WorkflowStatusIndicator Component
 *
 * Displays compact workflow status icons with counts for files in the roster.
 * Supports multiple workflows per file (many-to-many relationship).
 * Example: ⏱2 ✓1 ↻1 (2 pending, 1 approved, 1 needs feedback)
 */

import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { WORKFLOW_STATUS_CONFIG, DEFAULT_WORKFLOW_COUNTS } from '@constants/driveConstants';

export default function WorkflowStatusIndicator({ workflowCounts = {}, onClick, showTooltip = false }) {
  const { theme } = useTheme();
  const { t } = useLang();

  // Filter out statuses with zero count
  const activeStatuses = Object.entries(workflowCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({ status, count, config: WORKFLOW_STATUS_CONFIG[status] || WORKFLOW_STATUS_CONFIG.draft }));

  if (activeStatuses.length === 0) return null;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        cursor: onClick ? 'pointer' : 'default',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
      title={showTooltip ? activeStatuses.map(s => `${t(s.config.labelKey)}: ${s.count}`).join(', ') : undefined}
    >
      {activeStatuses.map(({ status, count, config }) => (
        <div
          key={status}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: config.color,
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>
            {getThemedIcon('ui', config.icon, 14, config.color)}
          </span>
          <span>{count}</span>
        </div>
      ))}
    </div>
  );
}
