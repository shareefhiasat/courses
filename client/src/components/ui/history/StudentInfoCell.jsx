import React, { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { getThemedIcon } from '@constants/iconTypes';
import { ATTENDANCE_TYPE_CATEGORY, getAttendanceColor, getAttendanceLabel, getAttendanceIcon } from '@constants/attendanceTypes';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, CircleIcon } from '@utils/icons.jsx';

/**
 * StudentInfoCell - Displays student name, avatar, ID, favorite button, and today's status
 * Logic-free component following workspace constitution
 */
const StudentInfoCell = ({ student, favoriteStudents, toggleFavorite, onStudentSelect, t, attendanceMode, todayStatus, theme = 'light' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const avatarColorObj = getAvatarColor(student.displayName || student.realName || student.name || '');
  const avatarInitials = getAvatarInitials(student.displayName || student.realName || student.name || '');
  const isStandupMode = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;

  // Get attendance icon component based on status
  const getAttendanceIconComponent = (status) => {
    if (!status) return null;
    const statusUpper = status?.toUpperCase();
    const iconName = getAttendanceIcon(statusUpper);
    const color = getAttendanceColor(statusUpper);
    
    switch (iconName) {
      case 'CheckCircle':
        return <CheckSmallIcon style={{ width: '14px', height: '14px', stroke: color }} />;
      case 'Clock':
        return <ClockSmallIcon style={{ width: '14px', height: '14px', stroke: color }} />;
      case 'XCircle':
        return <XSmallIcon style={{ width: '14px', height: '14px', stroke: color }} />;
      case 'Heart':
        return <HeartIcon style={{ width: '14px', height: '14px', stroke: color }} />;
      default:
        return <CircleIcon style={{ width: '14px', height: '14px', stroke: color }} />;
    }
  };

  return (
    <td
      style={{ padding: '0.5rem 0.75rem' }}
      onClick={() => onStudentSelect(student)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Avatar */}
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          background: avatarColorObj?.bg || '#e5e7eb',
          color: avatarColorObj?.color || '#374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '1rem',
          flexShrink: 0
        }}>
          {avatarInitials}
        </div>

        {/* Student Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(student.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {favoriteStudents.includes(student.id)
              ? getThemedIcon('ui', 'star', 16, '#fbbf24') // Yellow when favorited
              : getThemedIcon('ui', 'star', 16, '#9ca3af') // Gray when not favorited
            }
          </button>
          <div>
            <div style={{ fontWeight: 500, color: theme === 'dark' ? (isHovered ? '#000000' : '#ffffff') : 'var(--text, #111827)', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: isStandupMode ? 'nowrap' : 'normal' }}>
              {student.displayName || student.realName || student.name || student.email}
              {/* Today's Attendance Status - Show with color and icon */}
              {todayStatus && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: getAttendanceColor(todayStatus?.toUpperCase()),
                  background: getAttendanceColor(todayStatus?.toUpperCase()) + '15',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem'
                }}>
                  {/* {getAttendanceIconComponent(todayStatus)}
                  {getAttendanceLabel(todayStatus?.toUpperCase())} */}
                </span>
              )}
              {/* Student Order Badge - Hidden in standup mode */}
              {!isStandupMode && student.studentOrder !== null && student.studentOrder !== undefined && student.studentOrder !== '' && (
                <span style={{
                  background: 'var(--color-primary-light, #dbeafe)',
                  color: 'var(--color-primary, #2563eb)',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  border: '1px solid var(--color-primary-border, #93c5fd)'
                }}>
                  #{student.studentOrder}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </td>
  );
};

export default StudentInfoCell;
