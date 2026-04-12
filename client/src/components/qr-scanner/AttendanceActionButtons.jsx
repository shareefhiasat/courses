import React from 'react';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon, AlertCircleIcon, HeartIcon } from '@utils/icons.jsx';
import { getAttendanceColor, ATTENDANCE_STATUS, ATTENDANCE_TYPE_CATEGORY, STANDUP_ATTENDANCE_TYPES } from '@constants/attendanceTypes';

const AttendanceActionButtons = ({
  onMarkAttendance,
  actionLoading,
  currentAction,
  currentAttendanceStatus,
  t,
  isMobile,
  attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR
}) => {
  // Normalize status to uppercase for comparison
  const normalizedCurrentStatus = currentAttendanceStatus ? String(currentAttendanceStatus).toUpperCase() : null;

  const createButtonStyle = (status, hoverColor, shadowColor) => {
    const isCurrentStatus = normalizedCurrentStatus && normalizedCurrentStatus === status.toUpperCase();
    return {
      padding: '0.875rem',
      border: 'none',
      background: isCurrentStatus ? '#94a3b8' : (actionLoading && currentAction === status ? '#94a3b8' : getAttendanceColor(status)),
      color: 'white',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: actionLoading || isCurrentStatus ? 'not-allowed' : 'pointer',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      opacity: actionLoading || isCurrentStatus ? 0.7 : 1,
      transition: 'all 0.2s ease',
      boxShadow: `0 2px 4px ${shadowColor}20`
    };
  };

  const renderButtonContent = (status, icon, label) => {
    if (actionLoading && currentAction === status) {
      return (
        <>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid white',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          {t('processing') || 'Processing...'}
        </>
      );
    }
    return (
      <>
        {icon}
        {label}
      </>
    );
  };

  // Define attendance buttons based on mode
  const attendanceButtons = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
    ? [
        { status: STANDUP_ATTENDANCE_TYPES.STANDUP_PRESENT, label: t('standup_present') || 'Standup Present', icon: <CheckSmallIcon style={{ width: '18px', height: '18px' }} />, hover: '#059669', shadow: '#10b981' },
        { status: STANDUP_ATTENDANCE_TYPES.STANDUP_LATE, label: t('standup_late') || 'Standup Late', icon: <ClockSmallIcon style={{ width: '18px', height: '18px' }} />, hover: '#f59e0b', shadow: '#fbbf24' },
        { status: STANDUP_ATTENDANCE_TYPES.STANDUP_ABSENT, label: t('standup_absent') || 'Standup Absent', icon: <XSmallIcon style={{ width: '18px', height: '18px' }} />, hover: '#dc2626', shadow: '#ef4444' },
        { status: STANDUP_ATTENDANCE_TYPES.STANDUP_CLINIC, label: t('standup_clinic') || 'Standup Clinic', icon: <HeartIcon style={{ width: '18px', height: '18px' }} />, hover: '#c026d3', shadow: '#ec4899' }
      ]
    : [
        { status: ATTENDANCE_STATUS.PRESENT, label: t('present') || 'Present', icon: <CheckSmallIcon style={{ width: '18px', height: '18px' }} />, hover: '#059669', shadow: '#10b981' },
        { status: ATTENDANCE_STATUS.LATE, label: t('late') || 'Late', icon: <ClockSmallIcon style={{ width: '18px', height: '18px' }} />, hover: '#d97706', shadow: '#f59e0b' },
        { status: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: t('absent_no_excuse') || 'Absent (No Excuse)', icon: <XSmallIcon style={{ width: '18px', height: '18px' }} />, hover: '#dc2626', shadow: '#ef4444' },
        { status: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: t('absent_with_excuse') || 'Absent (With Excuse)', icon: <AlertCircleIcon style={{ width: '18px', height: '18px' }} />, hover: '#ea580c', shadow: '#f97316' },
        { status: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: t('excused_leave') || 'Excused Leave', icon: <HeartIcon style={{ width: '18px', height: '18px' }} />, hover: '#c026d3', shadow: '#ec4899' },
        { status: ATTENDANCE_STATUS.HUMAN_CASE, label: t('human_case') || 'Human Case', icon: <HeartIcon style={{ width: '18px', height: '18px' }} />, hover: '#7c3aed', shadow: '#8b5cf6' }
      ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '0.75rem'
    }}>
      {attendanceButtons.map((button) => {
        const isCurrentStatus = normalizedCurrentStatus && normalizedCurrentStatus === button.status.toUpperCase();
        return (
        <button
          key={button.status}
          onClick={async () => {
            if (!actionLoading && !isCurrentStatus) {
              await onMarkAttendance(button.status, 'Manual');
            }
          }}
          disabled={actionLoading || isCurrentStatus}
          style={createButtonStyle(button.status, button.hover, button.shadow)}
        >
          {renderButtonContent(button.status, button.icon, button.label)}
        </button>
        );
      })}
    </div>
  );
};

export default AttendanceActionButtons;
