import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { DRIVE_TIMELINE } from './constants';

/**
 * Read-only icon badge matching DriveActionButton dimensions (e.g. permission indicator).
 */
export default function DriveIconBadge({
  icon,
  title,
  iconSize = DRIVE_TIMELINE.ACTION_ICON_SIZE,
}) {
  return (
    <div
      title={title}
      aria-label={title}
      style={{
        width: DRIVE_TIMELINE.ACTION_BTN_SIZE,
        height: DRIVE_TIMELINE.ACTION_BTN_SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--text-muted, #6b7280)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '0.375rem',
        background: 'transparent',
      }}
    >
      {getThemedIcon('ui', icon, iconSize, 'currentColor')}
    </div>
  );
}
