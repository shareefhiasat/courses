/**
 * Centralized Badge Utilities
 * 
 * Provides standardized badge creation functions for attendance, penalties, participation, etc.
 * Used across ClassCard, HRAttendancePage, and other components.
 */

import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';
import { Tooltip } from '@ui';

/**
 * Helper function to get icon color based on theme
 */
export const getIconColor = (defaultColor, theme) => {
  return defaultColor;
};

/**
 * Creates a standardized attendance badge with icon and count
 */
export const createAttendanceBadge = (count, iconType, color, tooltipText, theme) => {
  if (!count || count <= 0) return null;

  return (
    <span
      style={{
        background: `${color}15`,
        color: color,
        padding: '1px 4px',
        borderRadius: 3,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
      }}
      title={tooltipText}
    >
      {getThemedIcon('ui', iconType, 10, getIconColor(color, theme))}
      {count}
    </span>
  );
};

/**
 * Creates a standardized badge for class stats (penalties, behaviors, etc.)
 */
export const createClassStatBadge = (count, iconType, color, tooltipText, theme) => {
  if (!count || count <= 0) return null;

  return (
    <Tooltip content={tooltipText}>
      <span
        style={{
          background: `${color}15`,
          color: color,
          padding: '1px 4px',
          borderRadius: 3,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}
      >
        {getThemedIcon(iconType.type, iconType.name, 10, getIconColor(color, theme))}
        {count}
      </span>
    </Tooltip>
  );
};

/**
 * Gets the appropriate icon for attendance status
 */
export const getAttendanceIcon = (status) => {
  switch (status) {
    case ATTENDANCE_STATUS.PRESENT:
      return 'check_circle';
    case ATTENDANCE_STATUS.LATE:
      return 'clock';
    case ATTENDANCE_STATUS.ABSENT_NO_EXCUSE:
      return 'x_circle';
    case ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE:
      return 'file_text';
    case ATTENDANCE_STATUS.EXCUSED_LEAVE:
      return 'home';
    case ATTENDANCE_STATUS.HUMAN_CASE:
      return 'heart';
    default:
      return 'check_circle';
  }
};

/**
 * Gets attendance status color and label
 */
export const getAttendanceStatusInfo = (status) => {
  const statusInfo = ATTENDANCE_STATUS_LABELS[status] || ATTENDANCE_STATUS_LABELS.present;
  return {
    color: statusInfo.color || '#6b7280',
    label: statusInfo.en || status,
    icon: getAttendanceIcon(status)
  };
};

/**
 * Creates attendance summary stats with icons and colors
 */
export const createAttendanceSummaryStats = (marks, theme) => {
  const stats = [
    { key: ATTENDANCE_STATUS.PRESENT, label: ATTENDANCE_STATUS_LABELS.present },
    { key: ATTENDANCE_STATUS.LATE, label: ATTENDANCE_STATUS_LABELS.late },
    { key: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_no_excuse },
    { key: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_with_excuse },
    { key: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: ATTENDANCE_STATUS_LABELS.excused_leave },
    { key: ATTENDANCE_STATUS.HUMAN_CASE, label: ATTENDANCE_STATUS_LABELS.human_case }
  ];

  return stats.map(({ key, label }) => {
    const count = marks.filter(m => {
      const status = m.status || 'present';
      // Handle legacy statuses
      if (key === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE && (status === 'absent' || status === 'absent_no_excuse')) return true;
      if (key === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE && status === 'absent_with_excuse') return true;
      if (key === ATTENDANCE_STATUS.EXCUSED_LEAVE && (status === 'leave' || status === 'excused_leave')) return true;
      return status === key;
    }).length;
    
    const color = label.color || '#6b7280';
    const displayLabel = label.en || key;
    const icon = getAttendanceIcon(key);
    
    return {
      key,
      count,
      color,
      label: displayLabel,
      icon
    };
  });
};

/**
 * Class stat configurations for badges
 */
export const CLASS_STAT_CONFIGS = {
  penalties: {
    color: '#ef4444',
    icon: { type: 'penalty_type', name: 'cheating' }
  },
  behaviors: {
    color: '#f59e0b',
    icon: { type: 'behavior_type', name: 'disruptive' }
  },
  quizzes: {
    color: '#8b5cf6',
    icon: { type: 'ui', name: 'file_text' }
  },
  activities: {
    color: '#10b981',
    icon: { type: 'participation_type', name: 'excellent' }
  },
  announcements: {
    color: '#3b82f6',
    icon: { type: 'ui', name: 'megaphone' }
  },
  resources: {
    color: '#06b6d4',
    icon: { type: 'ui', name: 'folder' }
  }
};
