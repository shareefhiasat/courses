import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { DRIVE_TIMELINE } from './constants';

/**
 * Unified icon action button for timeline list cards (delete, preview, etc.)
 */
export default function DriveActionButton({
  icon = 'trash',
  onClick,
  ariaLabel,
  variant = 'danger',
  disabled = false,
  iconSize = DRIVE_TIMELINE.DELETE_ICON_SIZE,
  iconColor,
}) {
  const isDanger = variant === 'danger';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={`drive-action-${icon}`}
      style={{
        width: DRIVE_TIMELINE.ACTION_BTN_SIZE,
        height: DRIVE_TIMELINE.ACTION_BTN_SIZE,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: isDanger ? 'var(--error-text, #dc2626)' : 'var(--text-muted, #6b7280)',
        background: 'transparent',
        border: `1px solid ${isDanger ? 'var(--error-border, #fecaca)' : 'var(--border, #e5e7eb)'}`,
        borderRadius: '0.375rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (isDanger) {
          e.currentTarget.style.borderColor = '#dc2626';
          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
          e.currentTarget.style.color = '#dc2626';
        } else {
          e.currentTarget.style.color = 'var(--color-primary, #2563eb)';
          e.currentTarget.style.background = 'var(--bg-primary, #f3f4f6)';
        }
      }}
      onMouseLeave={(e) => {
        if (isDanger) {
          e.currentTarget.style.borderColor = 'var(--error-border, #fecaca)';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--error-text, #dc2626)';
        } else {
          e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
        }
      }}
    >
      {getThemedIcon('ui', icon, iconSize, iconColor || 'currentColor')}
    </button>
  );
}
