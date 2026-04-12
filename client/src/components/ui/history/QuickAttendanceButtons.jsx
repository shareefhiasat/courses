import React from 'react';
import Button from '@components/ui/Button';
import PortalTooltip from '@ui/PortalTooltip';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon } from '@utils/icons.jsx';
import { ATTENDANCE_TYPE_CATEGORY, getAttendanceColor } from '@constants/attendanceTypes.js';
import { getThemedIcon } from '@constants/iconTypes';

/**
 * QuickAttendanceButtons - Present and Late buttons with toggle logic
 * Logic-free component following workspace constitution
 */
const QuickAttendanceButtons = ({
  student,
  attendanceMode,
  isSubmitting,
  isPresentButtonDisabled,
  isLateButtonDisabled,
  isAbsentButtonDisabled,
  isClinicButtonDisabled,
  handleQuickAttendance,
  programId,
  t
}) => {
  const preventDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      {/* Quick Present Button */}
      <PortalTooltip
        content={isPresentButtonDisabled ? t('already_marked_as_present') : t('mark_present')}
        position="top"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={async (e) => {
            e.stopPropagation();
            preventDoubleClick(e);
            const statusToMark = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT';
            console.log('🔍 [QuickAttendanceButtons] Present button clicked:', {
              studentId: student.id,
              studentName: student.displayName || student.name,
              attendanceMode,
              statusToMark
            });
            await handleQuickAttendance(student, statusToMark, attendanceMode, programId);
          }}
          disabled={isSubmitting || isPresentButtonDisabled}
          onDoubleClick={preventDoubleClick}
          style={{
            background: getAttendanceColor(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT'),
            border: 'none',
            color: 'white',
            borderRadius: '0.375rem',
            transition: 'all 0.2s ease',
            boxShadow: isPresentButtonDisabled ? 'none' : `0 2px 4px ${getAttendanceColor(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT')}30`,
            opacity: isPresentButtonDisabled ? 0.5 : 1,
            cursor: isPresentButtonDisabled ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isPresentButtonDisabled) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT')}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isPresentButtonDisabled) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT')}30`;
            }
          }}
        >
          <CheckSmallIcon style={{ width: '0.875rem', height: '0.875rem' }} />
        </Button>
      </PortalTooltip>

      {/* Quick Late Button */}
      <PortalTooltip
        content={isLateButtonDisabled ? t('already_marked_as_late') : t('mark_late')}
        position="top"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={async (e) => {
            e.stopPropagation();
            preventDoubleClick(e);
            const statusToMark = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE';
            console.log('🔍 [QuickAttendanceButtons] Late button clicked:', {
              studentId: student.id,
              studentName: student.displayName || student.name,
              attendanceMode,
              statusToMark
            });
            await handleQuickAttendance(student, statusToMark, attendanceMode, programId);
          }}
          disabled={isSubmitting || isLateButtonDisabled}
          onDoubleClick={preventDoubleClick}
          style={{
            background: getAttendanceColor(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE'),
            border: 'none',
            color: 'white',
            borderRadius: '0.375rem',
            transition: 'all 0.2s ease',
            boxShadow: isLateButtonDisabled ? 'none' : `0 2px 4px ${getAttendanceColor(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE')}30`,
            opacity: isLateButtonDisabled ? 0.5 : 1,
            cursor: isLateButtonDisabled ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isLateButtonDisabled) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE')}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLateButtonDisabled) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE')}30`;
            }
          }}
        >
          <ClockSmallIcon style={{ width: '0.875rem', height: '0.875rem' }} />
        </Button>
      </PortalTooltip>

      {/* Standup Absent Button - Only show in standup mode */}
      {attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && (
        <PortalTooltip
          content={isAbsentButtonDisabled ? t('already_marked_as_absent') : t('mark_absent')}
          position="top"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={async (e) => {
              e.stopPropagation();
              preventDoubleClick(e);
              const statusToMark = 'STANDUP_ABSENT';
              console.log('🔍 [QuickAttendanceButtons] Standup Absent button clicked:', {
                studentId: student.id,
                studentName: student.displayName || student.name,
                attendanceMode,
                statusToMark
              });
              await handleQuickAttendance(student, statusToMark, attendanceMode, programId);
            }}
            disabled={isSubmitting || isAbsentButtonDisabled}
            onDoubleClick={preventDoubleClick}
            style={{
              background: getAttendanceColor('STANDUP_ABSENT'),
              border: 'none',
              color: 'white',
              borderRadius: '0.375rem',
              transition: 'all 0.2s ease',
              boxShadow: isAbsentButtonDisabled ? 'none' : `0 2px 4px ${getAttendanceColor('STANDUP_ABSENT')}30`,
              opacity: isAbsentButtonDisabled ? 0.5 : 1,
              cursor: isAbsentButtonDisabled ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isAbsentButtonDisabled) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('STANDUP_ABSENT')}40`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isAbsentButtonDisabled) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('STANDUP_ABSENT')}30`;
              }
            }}
          >
            <XSmallIcon style={{ width: '0.875rem', height: '0.875rem' }} />
          </Button>
        </PortalTooltip>
      )}

      {/* Standup Clinic Button - Only show in standup mode */}
      {attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && (
        <PortalTooltip
          content={isClinicButtonDisabled ? t('already_marked_as_clinic') : t('mark_clinic')}
          position="top"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={async (e) => {
              e.stopPropagation();
              preventDoubleClick(e);
              const statusToMark = 'STANDUP_CLINIC';
              console.log('🔍 [QuickAttendanceButtons] Standup Clinic button clicked:', {
                studentId: student.id,
                studentName: student.displayName || student.name,
                attendanceMode,
                statusToMark
              });
              await handleQuickAttendance(student, statusToMark, attendanceMode, programId);
            }}
            disabled={isSubmitting || isClinicButtonDisabled}
            onDoubleClick={preventDoubleClick}
            style={{
              background: getAttendanceColor('STANDUP_CLINIC'),
              border: 'none',
              color: 'white',
              borderRadius: '0.375rem',
              transition: 'all 0.2s ease',
              boxShadow: isClinicButtonDisabled ? 'none' : `0 2px 4px ${getAttendanceColor('STANDUP_CLINIC')}30`,
              opacity: isClinicButtonDisabled ? 0.5 : 1,
              cursor: isClinicButtonDisabled ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isClinicButtonDisabled) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('STANDUP_CLINIC')}40`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isClinicButtonDisabled) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('STANDUP_CLINIC')}30`;
              }
            }}
          >
            {getThemedIcon('ui', 'heart', 14, 'white')}
          </Button>
        </PortalTooltip>
      )}
    </>
  );
};

export default QuickAttendanceButtons;
