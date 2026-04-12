import React from 'react';
import PortalTooltip from '@ui/PortalTooltip';
import { CheckSmallIcon, ClockSmallIcon } from '@utils/icons.jsx';
import { getAttendanceColor, ATTENDANCE_STATUS } from '@constants/attendanceTypes';

const QuickActionButtons = ({
  studentId,
  students,
  onQuickAttendance,
  programId,
  attendanceMode,
  t,
  isRTL
}) => {
  const student = students.find(s => s.id === studentId);

  if (!student) return null;

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

  const isPresent = student?.attendance === 'present';
  const isLate = student?.attendance === 'late';

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.25rem',
      marginRight: '0.5rem'
    }}>
      {/* Quick Present Button */}
      <PortalTooltip 
        content={isPresent ? t('already_marked_present') : t('mark_present')} 
        position="top"
      >
        <button
          onClick={handlePresentClick}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={isPresent}
          style={{
            background: isPresent ? '#9ca3af' : getAttendanceColor(ATTENDANCE_STATUS.PRESENT),
            border: 'none',
            color: 'white',
            cursor: isPresent ? 'not-allowed' : 'pointer',
            padding: '0.25rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: isPresent ? 'none' : `0 2px 4px ${getAttendanceColor(ATTENDANCE_STATUS.PRESENT)}30`,
            opacity: isPresent ? 0.6 : 1,
            minWidth: '24px',
            height: '24px'
          }}
          onMouseEnter={(e) => {
            if (!isPresent) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor(ATTENDANCE_STATUS.PRESENT)}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isPresent) {
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
        content={isLate ? t('already_marked_late') : t('mark_late')} 
        position="top"
      >
        <button
          onClick={handleLateClick}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={isLate}
          style={{
            background: isLate ? '#9ca3af' : getAttendanceColor(ATTENDANCE_STATUS.LATE),
            border: 'none',
            color: 'white',
            cursor: isLate ? 'not-allowed' : 'pointer',
            padding: '0.25rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: isLate ? 'none' : `0 2px 4px ${getAttendanceColor(ATTENDANCE_STATUS.LATE)}30`,
            opacity: isLate ? 0.6 : 1,
            minWidth: '24px',
            height: '24px'
          }}
          onMouseEnter={(e) => {
            if (!isLate) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor(ATTENDANCE_STATUS.LATE)}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLate) {
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
