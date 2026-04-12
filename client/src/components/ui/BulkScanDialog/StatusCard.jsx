/**
 * StatusCard Component
 *
 * Renders a status selection card for attendance marking
 */

import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { getAttendanceColor, ATTENDANCE_DISPLAY_NAMES } from '@constants/attendanceTypes';
import styles from './BulkScanDialog.module.css';

const StatusCard = ({
  id,
  color,
  labelEn,
  labelAr,
  selected,
  onClick,
  disabled,
  theme,
  lang
}) => {
  // Status icon mapping
  const statusIconMap = {
    PRESENT: { icon: 'check_circle', color: '#22c55e' },
    LATE: { icon: 'clock', color: '#eab308' },
    ABSENT_NO_EXCUSE: { icon: 'x_circle', color: '#ef4444' },
    ABSENT_WITH_EXCUSE: { icon: 'x_circle', color: '#ef4444' },
    EXCUSED_LEAVE: { icon: 'heart', color: '#ec4899' },
    HUMAN_CASE: { icon: 'heart', color: '#8b5cf6' },
    STANDUP_PRESENT: { icon: 'star', color: '#10b981' },
    STANDUP_ABSENT: { icon: 'x', color: '#dc2626' },
    STANDUP_CLINIC: { icon: 'heart', color: '#ec4899' },
    STANDUP_LATE: { icon: 'clock', color: '#f59e0b' }
  };

  const iconConfig = statusIconMap[id] || { icon: 'circle', color: '#6b7280' };

  return (
    <button
      onClick={() => onClick(id)}
      disabled={disabled}
      className={`${styles.statusCard} ${styles[id]} ${selected ? styles.selected : ''} ${styles[theme]}`}
      style={{
        padding: '0.5rem',
        borderRadius: '0.375rem',
        border: `2px solid ${color || '#6b7280'}`,
        background: selected ? (color || '#6b7280') : (theme === 'dark' ? '#1f2937' : 'white'),
        color: selected ? 'white' : (color || '#6b7280'),
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        transition: 'all 0.2s',
        minWidth: '4rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {getThemedIcon('ui', iconConfig.icon, 14, selected ? 'white' : iconConfig.color)}
      </div>
      <span style={{ fontSize: '0.7rem', textAlign: 'center' }}>
        {lang === 'ar' ? labelAr : labelEn}
      </span>
    </button>
  );
};

export default StatusCard;
