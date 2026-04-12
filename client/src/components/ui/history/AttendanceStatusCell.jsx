import React from 'react';
import { ATTENDANCE_STATUS_LABELS, getAttendanceColor, getAttendanceLabel } from '@constants/attendanceTypes.js';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, CircleIcon } from '@utils/icons.jsx';
import { getThemedIcon } from '@constants/iconTypes';

/**
 * AttendanceStatusCell - Displays attendance status with proper icon and color
 * Logic-free component following workspace constitution
 */
const AttendanceStatusCell = ({ status, type = 'regular' }) => {
  const getAttendanceDisplay = (status) => {
    // Convert to uppercase for label lookup
    const statusUpper = status?.toUpperCase();
    if (!ATTENDANCE_STATUS_LABELS[statusUpper]) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <CircleIcon style={{ width: type === 'regular' ? '12px' : '16px', height: type === 'regular' ? '12px' : '16px', stroke: '#9ca3af' }} />
          <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>None</span>
        </div>
      );
    }

    const color = getAttendanceColor(statusUpper);
    const label = getAttendanceLabel(statusUpper);

    const getIcon = (s) => {
      switch(statusUpper) {
        case 'PRESENT':
        case 'STANDUP_PRESENT':
          return <CheckSmallIcon style={{ width: '16px', height: '16px', stroke: color }} />;
        case 'LATE':
        case 'STANDUP_LATE':
          return <ClockSmallIcon style={{ width: '16px', height: '16px', stroke: color }} />;
        case 'ABSENT':
        case 'ABSENT_NO_EXCUSE':
        case 'STANDUP_ABSENT':
          return <XSmallIcon style={{ width: '16px', height: '16px', stroke: color }} />;
        case 'ABSENT_WITH_EXCUSE':
        case 'EXCUSED':
          return <XSmallIcon style={{ width: '16px', height: '16px', stroke: color }} />;
        case 'EXCUSED_LEAVE':
          return <HeartIcon style={{ width: '16px', height: '16px', stroke: color }} />;
        case 'STANDUP_CLINIC':
          return <HeartIcon style={{ width: '16px', height: '16px', stroke: color }} />;
        case 'HUMAN_CASE':
          return <HeartIcon style={{ width: '16px', height: '16px', stroke: color }} />;
        default:
          return <CircleIcon style={{ width: '16px', height: '16px', stroke: color }} />;
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {getIcon(status)}
        <span style={{ fontSize: '0.75rem', color: color, fontWeight: 500 }}>
          {label}
        </span>
      </div>
    );
  };

  const iconSize = type === 'regular' ? 12 : 16;
  const fontSize = type === 'regular' ? '0.7rem' : '0.75rem';

  return status ? getAttendanceDisplay(status) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
      <span style={{ fontSize: fontSize, color: '#9ca3af', fontWeight: 500 }}>None</span>
    </div>
  );
};

export default AttendanceStatusCell;
