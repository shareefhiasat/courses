import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import StudentRosterHistory from './StudentRosterHistory';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { ATTENDANCE_STATUS_LABELS, getAttendanceColor, getAttendanceLabel, getAttendanceIcon } from '@constants/attendanceTypes';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, CircleIcon } from '@utils/icons.jsx';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import PortalTooltip from '@ui/PortalTooltip';
import { ICON_TYPES } from '@constants/iconTypes';

const StudentTableRow = ({ 
  student, 
  isExpanded, 
  favoriteStudents, 
  toggleFavorite, 
  toggleRowExpansion, 
  onStudentAction, 
  onStudentSelect,
  onQuickAttendance, // New prop for quick attendance
  studentHistory, 
  expandedDays, 
  activeFilters, 
  toggleDayExpansion,
  expandAllDays,
  collapseAllDays,
  handleDeleteAttendance, 
  handleDeleteParticipation,
  handleDeleteBehavior,
  handleDeletePenalty, 
  getAttendanceBadge, 
  showTotalAttendance, 
  selectedStudentId, 
  sendingEmails, 
  setSendingEmails,
  sendStudentSummaryEmail, 
  isRTL,
  groupLogsByDay,
  toggleFilter,
  historyLoading = {}
}) => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  
  // Modal state for attendance confirmation
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalData, setResultModalData] = useState({ type: '', message: '', attendanceStatus: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const avatarColor = getAvatarColor(student.displayName || student.realName || student.name || '');

  // Get attendance icon and label function using official constants
  const getAttendanceDisplay = (status) => {
    const statusInfo = ATTENDANCE_STATUS_LABELS[status];
    if (!statusInfo) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {ICON_TYPES.attendance_status.none}
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>
            {t('none') || 'None'}
          </span>
        </div>
      );
    }

    // Get icon based on status
    const getIcon = (status) => {
      switch(status?.toLowerCase()) {
        case 'present': 
          return <CheckSmallIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
        case 'late': 
          return <ClockSmallIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
        case 'absent':
        case 'absent_no_excuse':
        case 'absent_with_excuse':
        case 'excused_leave':
          return <XSmallIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
        case 'human_case':
          return <HeartIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
        // Standup attendance icons
        case 'standup_present':
          return getThemedIcon('ui', 'star', 16, statusInfo.color);
        case 'standup_absent':
          return <XSmallIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
        case 'standup_clinic':
          return <HeartIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
        case 'standup_late':
          return <ClockSmallIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
        default: 
          return <CircleIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {getIcon(status)}
        <span style={{ fontSize: '0.75rem', color: statusInfo.color, fontWeight: 500 }}>
          {lang === 'ar' ? (statusInfo.ar || statusInfo.en) : statusInfo.en}
        </span>
      </div>
    );
  };

  // Show result modal function - Same as QR scanner
  const showResult = useCallback((type, message, attendanceStatus = null) => {
    let finalType = type;
    let finalMessage = message;
    
    // If attendance status is provided, use its color and icon
    if (attendanceStatus) {
      finalType = 'attendance';
      finalMessage = message || getAttendanceLabel(attendanceStatus, lang);
    }
    
    setResultModalData({ 
      type: finalType, 
      message: finalMessage, 
      attendanceStatus
    });
    setShowResultModal(true);
  }, [lang]);

  // Handle attendance with confirmation modal
  const handleQuickAttendance = useCallback(async (student, status) => {
    if (isSubmitting) return;
    
    // Check if student already has this status
    const currentStatus = student.attendance;
    if (currentStatus === status) {
      showResult('info', `${t('already_marked_as')} ${getAttendanceLabel(status, lang)}`, status);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onQuickAttendance(student, status);
      // Show modal immediately, delay table refresh
      showResult('success', `${t('successfully_marked')} ${getAttendanceLabel(status, lang)}`, status);
      
      // Delay to let user see the modal before table refresh
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000); // 2 seconds delay
    } catch (error) {
      showResult('error', `${t('failed_to_mark')} ${getAttendanceLabel(status, lang)}: ${error.message}`, status);
      
      // Delay to let user see the error modal
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000); // 2 seconds delay
    }
  }, [isSubmitting, onQuickAttendance, showResult, lang]);

  // Prevent double click
  const preventDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <React.Fragment key={student.id}>
      <tr
        style={{
          borderBottom: '1px solid var(--border, #e5e7eb)',
          background: selectedStudentId === student.id ? 'var(--panel-hover, #eff6ff)' : 'transparent',
          cursor: 'pointer',
          transition: 'background-color 0.15s'
        }}
        onMouseEnter={(e) => {
          if (selectedStudentId !== student.id) {
            e.currentTarget.style.background = '#eff6ff';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedStudentId !== student.id) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <td style={{ padding: '0.5rem 0.75rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRowExpansion(student.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isExpanded ? (
              getThemedIcon('ui', 'chevron_down', 16)
            ) : (
              isRTL ? (
                getThemedIcon('ui', 'chevron_down', 16)
              ) : (
                getThemedIcon('ui', 'chevron_right', 16)
              )
            )}
          </button>
        </td>
        <td style={{ padding: '0.5rem 0.75rem' }} onClick={() => onStudentSelect(student)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔖 Bookmark clicked for student:', student.id, student.displayName || student.name);
                console.log('🔖 Current favorite status:', favoriteStudents.includes(student.id));
                console.log('🔖 All favorite students:', favoriteStudents);
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
              <div style={{ fontWeight: 500, color: 'var(--text, #111827)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {student.displayName || student.realName || student.name || student.email}
                {student.studentOrder !== null && student.studentOrder !== undefined && student.studentOrder !== '' && (
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                {t('id')}: {student.studentNumber || '0000'}
              </div>
            </div>
          </div>
        </td>
        <td style={{ padding: '0.5rem 0.75rem' }} onClick={() => onStudentSelect(student)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {student.attendance && student.attendance !== 'absent_no_excuse' ? getAttendanceDisplay(student.attendance) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>None</span>
              </div>
            )}
          </div>
        </td>
        <td style={{ padding: '0.5rem 0.75rem' }} onClick={() => onStudentSelect(student)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {student.standupStatus && student.standupStatus !== 'absent_no_excuse' ? getAttendanceDisplay(student.standupStatus) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>None</span>
              </div>
            )}
          </div>
        </td>
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: '#dbeafe',
            color: '#1e40af'
          }}>
            {student.participation}
          </span>
        </td>
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: student.behavior >= 0 ? '#d1fae5' : '#fee2e2',
            color: student.behavior >= 0 ? '#065f46' : '#991b1b'
          }}>
            {student.behavior}
          </span>
        </td>
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: student.penalty < 0 ? '#fee2e2' : '#f3f4f6',
            color: student.penalty < 0 ? '#991b1b' : '#374151'
          }}>
            {student.penalty}
          </span>
        </td>
        {/* Attendance Statistics Columns */}
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: student.attendanceStats?.present > 0 ? '#dcfce7' : '#f3f4f6',
            color: student.attendanceStats?.present > 0 ? '#166534' : '#374151'
          }}>
            {student.attendanceStats?.present || 0}
          </span>
        </td>
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: student.attendanceStats?.late > 0 ? '#fef3c7' : '#f3f4f6',
            color: student.attendanceStats?.late > 0 ? '#92400e' : '#374151'
          }}>
            {student.attendanceStats?.late || 0}
          </span>
        </td>
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: student.attendanceStats?.absent > 0 ? '#fee2e2' : '#f3f4f6',
            color: student.attendanceStats?.absent > 0 ? '#991b1b' : '#374151'
          }}>
            {student.attendanceStats?.absent || 0}
          </span>
        </td>
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: student.attendanceStats?.absentWithExcuse > 0 ? '#dbeafe' : '#f3f4f6',
            color: student.attendanceStats?.absentWithExcuse > 0 ? '#1e40af' : '#374151'
          }}>
            {student.attendanceStats?.absentWithExcuse || 0}
          </span>
        </td>
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: student.attendanceStats?.excusedLeave > 0 ? '#f3e8ff' : '#f3f4f6',
            color: student.attendanceStats?.excusedLeave > 0 ? '#6b21a8' : '#374151'
          }}>
            {student.attendanceStats?.excusedLeave || 0}
          </span>
        </td>
        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            fontWeight: 500,
            background: student.attendanceStats?.humanitarianCase > 0 ? '#fef2f2' : '#f3f4f6',
            color: student.attendanceStats?.humanitarianCase > 0 ? '#b91c1c' : '#374151'
          }}>
            {student.attendanceStats?.humanitarianCase || 0}
          </span>
        </td>
        <td style={{ padding: '0.5rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {/* Senior-Level Quick Attendance Actions - Moved to first */}
            {onQuickAttendance && (
              <>
                {/* Quick Present Button */}
                <PortalTooltip 
                  content={student.attendance === 'present' ? t('already_marked_as_present') : t('mark_present')}
                  position="top"
                >
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={async (e) => {
                      e.stopPropagation();
                      preventDoubleClick(e);
                      await handleQuickAttendance(student, 'present');
                    }}
                    disabled={isSubmitting || student.attendance === 'present'}
                    onDoubleClick={preventDoubleClick}
                    style={{
                      background: student.attendance === 'present' ? '#9ca3af' : getAttendanceColor('present'),
                      border: 'none',
                      color: 'white',
                      borderRadius: '0.375rem',
                      transition: 'all 0.2s ease',
                      boxShadow: student.attendance === 'present' ? 'none' : `0 2px 4px ${getAttendanceColor('present')}30`,
                      opacity: student.attendance === 'present' ? 0.6 : 1,
                      cursor: student.attendance === 'present' ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (student.attendance !== 'present') {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('present')}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (student.attendance !== 'present') {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('present')}30`;
                      }
                    }}
                  >
                    <CheckSmallIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                  </Button>
                </PortalTooltip>

                {/* Quick Late Button */}
                <PortalTooltip 
                  content={student.attendance === 'late' ? t('already_marked_as_late') : t('mark_late')}
                  position="top"
                >
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={async (e) => {
                      e.stopPropagation();
                      preventDoubleClick(e);
                      await handleQuickAttendance(student, 'late');
                    }}
                    disabled={isSubmitting || student.attendance === 'late'}
                    onDoubleClick={preventDoubleClick}
                    style={{
                      background: student.attendance === 'late' ? '#9ca3af' : getAttendanceColor('late'),
                      border: 'none',
                      color: 'white',
                      borderRadius: '0.375rem',
                      transition: 'all 0.2s ease',
                      boxShadow: student.attendance === 'late' ? 'none' : `0 2px 4px ${getAttendanceColor('late')}30`,
                      opacity: student.attendance === 'late' ? 0.6 : 1,
                      cursor: student.attendance === 'late' ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (student.attendance !== 'late') {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('late')}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (student.attendance !== 'late') {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('late')}30`;
                      }
                    }}
                  >
                    <ClockSmallIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                  </Button>
                </PortalTooltip>
              </>
            )}
            <PortalTooltip content={t('actions')} position="top">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    onStudentAction(student);
                  } catch (error) {
                    logger.error('Error calling onStudentAction:', error);
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </Button>
            </PortalTooltip>
            <PortalTooltip content={t('stats')} position="top">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onStudentSelect(student);
                }}
              >
                {getThemedIcon('ui', 'sidebar_open', 16)}
              </Button>
            </PortalTooltip>
            <PortalTooltip content={t('open_qr_code')} position="top">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async (e) => {
                  e.stopPropagation();
                  // Navigate to QR code display page with student number in new tab
                  const studentNumber = student.studentNumber || student.id;
                  const qrUrl = `/qrcode/${studentNumber}`;
                  window.open(qrUrl, '_blank');
                }}
              >
                {getThemedIcon('ui', 'qr_code', 16)}
              </Button>
            </PortalTooltip>
            <PortalTooltip content={t('send_summary_report')} position="top">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async (e) => {
                  e.stopPropagation();
                  await sendStudentSummaryEmail(student);
                }}
                disabled={sendingEmails[student.id]?.summary}
              >
                {sendingEmails[student.id]?.summary ? (
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid #6b7280',
                    borderTop: '2px solid transparent',
                    borderRight: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  getThemedIcon('ui', 'mail', 16)
                )}
              </Button>
            </PortalTooltip>
          </div>
        </td>
      </tr>
      
      {/* Expanded History Row */}
      {isExpanded && (
        <tr style={{ background: 'var(--background-secondary, #f9fafb)', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
          <td colSpan="7" style={{ padding: '0.5rem 1rem' }}>
            <StudentRosterHistory 
              student={student}
              studentHistory={studentHistory}
              expandedDays={expandedDays}
              activeFilters={activeFilters}
              toggleDayExpansion={toggleDayExpansion}
              expandAllDays={expandAllDays}
              collapseAllDays={collapseAllDays}
              handleDeleteAttendance={handleDeleteAttendance}
              handleDeleteParticipation={handleDeleteParticipation}
              handleDeleteBehavior={handleDeleteBehavior}
              handleDeletePenalty={handleDeletePenalty}
              t={t}
              isRTL={isRTL}
              groupLogsByDay={groupLogsByDay}
              toggleFilter={toggleFilter}
              lang={lang}
              historyLoading={historyLoading}
            />
          </td>
        </tr>
      )}

      {/* Result Modal - Rendered outside table using Portal */}
      {showResultModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: resultModalData.attendanceStatus ? 
                getAttendanceColor(resultModalData.attendanceStatus) :
                (resultModalData.type === 'success' ? '#16a34a' :
                  resultModalData.type === 'error' ? '#dc2626' :
                    resultModalData.type === 'info' ? '#3b82f6' : '#6b7280'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              {resultModalData.attendanceStatus ? (
                // Use attendance icon
                (() => {
                  const iconName = getAttendanceIcon(resultModalData.attendanceStatus);
                  switch (iconName) {
                    case 'CheckCircle':
                      return <CheckSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                    case 'Clock':
                      return <ClockSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                    case 'XCircle':
                      return <XSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                    case 'Heart':
                      return <HeartIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                    default:
                      return <CircleIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                  }
                })()
              ) : resultModalData.type === 'success' ? (
                <CheckSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />
              ) : resultModalData.type === 'error' ? (
                <XSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />
              ) : resultModalData.type === 'info' ? (
                <CircleIcon style={{ width: '30px', height: '30px', color: 'white' }} />
              ) : (
                <CircleIcon style={{ width: '30px', height: '30px', color: 'white' }} />
              )}
            </div>

            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.5rem 0'
            }}>
              {resultModalData.attendanceStatus ? 
                getAttendanceLabel(resultModalData.attendanceStatus, lang) :
                (resultModalData.type === 'success' ? 'Success!' :
                  resultModalData.type === 'error' ? 'Error!' : 
                  resultModalData.type === 'info' ? 'Info' : 'Information')}
            </h3>

            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.5'
            }}>
              {resultModalData.message}
            </p>

            <Button
              onClick={() => setShowResultModal(false)}
              style={{
                background: resultModalData.attendanceStatus ? 
                  getAttendanceColor(resultModalData.attendanceStatus) :
                  (resultModalData.type === 'success' ? '#16a34a' :
                    resultModalData.type === 'error' ? '#dc2626' :
                      resultModalData.type === 'info' ? '#3b82f6' : '#6b7280'),
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              OK
            </Button>
          </div>
        </div>,
        document.body
      )}
    </React.Fragment>
  );
};

export default StudentTableRow;

