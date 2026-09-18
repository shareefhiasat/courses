import React from 'react';
import { Check, Clock, X, AlertCircle, Heart } from '@utils/icons.jsx';
import { getAttendanceColor, ATTENDANCE_STATUS, ATTENDANCE_TYPE_CATEGORY, STANDUP_ATTENDANCE_TYPES } from '@constants/attendanceTypes';

const AttendanceActionButtons = ({
  onMarkAttendance,
  actionLoading,
  currentAction,
  currentAttendanceStatus,
  t,
  isMobile,
  attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR,
  canEditAttendance = false
}) => {
  // Normalize status to uppercase for comparison
  const normalizedCurrentStatus = currentAttendanceStatus ? String(currentAttendanceStatus).toUpperCase() : null;

  const createButtonStyle = (status, hoverColor, shadowColor) => {
    const isCurrentStatus = normalizedCurrentStatus && normalizedCurrentStatus === status.toUpperCase();
    // Disable if: current status matches, OR attendance exists AND user doesn't have edit permission
    const shouldDisable = isCurrentStatus || (normalizedCurrentStatus && !canEditAttendance);
    return {
      padding: '0.875rem',
      border: 'none',
      background: isCurrentStatus ? '#94a3b8' : (actionLoading && currentAction === status ? '#94a3b8' : getAttendanceColor(status)),
      color: 'white',
      borderRadius: '0.5rem',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 600,
      cursor: actionLoading || shouldDisable ? 'not-allowed' : 'pointer',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      opacity: actionLoading || shouldDisable ? 0.7 : 1,
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
          {t('processing')}
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
        { status: STANDUP_ATTENDANCE_TYPES.STANDUP_PRESENT, label: t('standup_present'), icon: <Check size={18} strokeWidth={3} />, hover: '#059669', shadow: '#10b981' },
        { status: STANDUP_ATTENDANCE_TYPES.STANDUP_LATE, label: t('standup_late'), icon: <Clock size={18} />, hover: '#f59e0b', shadow: '#fbbf24' },
        { status: STANDUP_ATTENDANCE_TYPES.STANDUP_ABSENT, label: t('standup_absent'), icon: <X size={18} />, hover: '#dc2626', shadow: '#ef4444' },
        { status: STANDUP_ATTENDANCE_TYPES.STANDUP_CLINIC, label: t('standup_clinic'), icon: <Heart size={18} strokeWidth={2.5} />, hover: '#c026d3', shadow: '#ec4899' }
      ]
    : [
        { status: ATTENDANCE_STATUS.PRESENT, label: t('present'), icon: <Check size={18} strokeWidth={3} />, hover: '#059669', shadow: '#10b981' },
        { status: ATTENDANCE_STATUS.LATE, label: t('late'), icon: <Clock size={18} />, hover: '#d97706', shadow: '#f59e0b' },
        { status: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: t('absent_no_excuse'), icon: <X size={18} />, hover: '#dc2626', shadow: '#ef4444' },
        { status: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: t('excused_leave'), icon: <AlertCircle size={18} strokeWidth={2.5} />, hover: '#ea580c', shadow: '#f97316' },
        { status: ATTENDANCE_STATUS.HUMAN_CASE, label: t('human_case'), icon: <Heart size={18} strokeWidth={2.5} />, hover: '#7c3aed', shadow: '#8b5cf6' }
      ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '0.75rem'
    }}>
      {attendanceButtons.map((button) => {
        const isCurrentStatus = normalizedCurrentStatus && normalizedCurrentStatus === button.status.toUpperCase();
        // Disable if: current status matches, OR attendance exists AND user doesn't have edit permission
        const shouldDisable = isCurrentStatus || (normalizedCurrentStatus && !canEditAttendance);
        return (
        <button
          key={button.status}
          onClick={async () => {
            if (!actionLoading && !shouldDisable) {
              await onMarkAttendance(button.status, 'Manual');
            }
          }}
          disabled={actionLoading || shouldDisable}
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
