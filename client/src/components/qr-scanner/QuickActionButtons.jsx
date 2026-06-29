import React from 'react';
import PortalTooltip from '@ui/PortalTooltip';
import { CheckSmallIcon, ClockSmallIcon } from '@utils/icons.jsx';
import { getAttendanceColor, ATTENDANCE_STATUS, ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';

const QuickActionButtons = ({
  studentId,
  students,
  onQuickAttendance,
  programId,
  attendanceMode,
  canEditAttendance = false,
  t,
  isRTL
}) => {
  const student = students.find(s => s.id === studentId);

  if (!student) return null;

  // Determine current status based on attendance mode
  const currentStatus = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
    ? student?.standupStatus
    : student?.attendance;

  const hasAttendance = !!currentStatus;

  // If attendance exists and user doesn't have edit permission, disable all buttons
  const shouldDisableAll = hasAttendance && !canEditAttendance;

  // Check if specific status matches (case-insensitive, handles both regular and standup variants)
  const isPresent = hasAttendance && [
    'PRESENT', 'STANDUP_PRESENT', 'present', 'standup_present'
  ].includes(currentStatus);
  const isLate = hasAttendance && [
    'LATE', 'STANDUP_LATE', 'late', 'standup_late'
  ].includes(currentStatus);

  const handlePresentClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await onQuickAttendance(student, ATTENDANCE_STATUS.PRESENT, attendanceMode, programId);
  };

  const handleLateClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await onQuickAttendance(student, ATTENDANCE_STATUS.LATE, attendanceMode, programId);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      marginRight: '0.5rem'
    }}>
      {/* Quick Present Button */}
      <PortalTooltip
        content={shouldDisableAll && !isPresent ? t('no_edit_permission') : (isPresent ? t('already_marked_present') : t('mark_present'))}
        position="top"
      >
        <button
          onClick={handlePresentClick}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={isPresent || shouldDisableAll}
          style={{
            background: (isPresent || shouldDisableAll) ? '#9ca3af' : getAttendanceColor(ATTENDANCE_STATUS.PRESENT),
            border: 'none',
            color: 'white',
            cursor: (isPresent || shouldDisableAll) ? 'not-allowed' : 'pointer',
            padding: '0.25rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: (isPresent || shouldDisableAll) ? 'none' : `0 2px 4px ${getAttendanceColor(ATTENDANCE_STATUS.PRESENT)}30`,
            opacity: (isPresent || shouldDisableAll) ? 0.6 : 1,
            minWidth: '24px',
            height: '24px'
          }}
          onMouseEnter={(e) => {
            if (!isPresent && !shouldDisableAll) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor(ATTENDANCE_STATUS.PRESENT)}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isPresent && !shouldDisableAll) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor(ATTENDANCE_STATUS.PRESENT)}30`;
            }
          }}
        >
          <CheckSmallIcon style={{ width: '12px', height: '12px' }} />
        </button>
      </PortalTooltip>

      {/* Quick Late Button */}
      <PortalTooltip
        content={shouldDisableAll && !isLate ? t('no_edit_permission') : (isLate ? t('already_marked_late') : t('mark_late'))}
        position="top"
      >
        <button
          onClick={handleLateClick}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={isLate || shouldDisableAll}
          style={{
            background: (isLate || shouldDisableAll) ? '#9ca3af' : getAttendanceColor(ATTENDANCE_STATUS.LATE),
            border: 'none',
            color: 'white',
            cursor: (isLate || shouldDisableAll) ? 'not-allowed' : 'pointer',
            padding: '0.25rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: (isLate || shouldDisableAll) ? 'none' : `0 2px 4px ${getAttendanceColor(ATTENDANCE_STATUS.LATE)}30`,
            opacity: (isLate || shouldDisableAll) ? 0.6 : 1,
            minWidth: '24px',
            height: '24px'
          }}
          onMouseEnter={(e) => {
            if (!isLate && !shouldDisableAll) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor(ATTENDANCE_STATUS.LATE)}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLate && !shouldDisableAll) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor(ATTENDANCE_STATUS.LATE)}30`;
            }
          }}
        >
          <ClockSmallIcon style={{ width: '12px', height: '12px' }} />
        </button>
      </PortalTooltip>
    </div>
  );
};

export default QuickActionButtons;
