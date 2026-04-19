import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { ACTIVITY_COLORS } from '@constants';
import StudentRosterHistory from './StudentRosterHistory';
import { ATTENDANCE_STATUS_LABELS, getAttendanceColor, getAttendanceLabel, getAttendanceIcon, ATTENDANCE_TYPE_CATEGORY, STANDUP_ATTENDANCE_TYPES } from '@constants/attendanceTypes';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import PortalTooltip from '@ui/PortalTooltip';
import { ICON_TYPES } from '@constants/iconTypes';
import { RECORD_TYPES } from '@utils/sharedTypes.js';
import StudentInfoCell from './StudentInfoCell';
import AttendanceStatusCell from './AttendanceStatusCell';
import QuickAttendanceButtons from './QuickAttendanceButtons';
import StudentStatsRow from './StudentStatsRow';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, CircleIcon } from '@utils/icons.jsx';

import { info, error, warn, debug } from '@services/utils/logger.js';
const StudentTableRow = ({
  student,
  isExpanded,
  favoriteStudents,
  toggleFavorite,
  toggleRowExpansion,
  onStudentAction,
  onStudentSelect,
  onQuickAttendance, // New prop for quick attendance
  programId,
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
  canDeleteAttendance = false,
  canUseZapPanel = false,
  canUseStatsPanel = false,
  canSeeQuickButtons = false,
  canMarkAttendance = false,
  canEditAttendance = false,
  getAttendanceBadge,
  showTotalAttendance,
  selectedStudentId,
  sendingEmails,
  setSendingEmails,
  sendStudentSummaryEmail,
  isRTL,
  groupLogsByDay,
  toggleFilter,
  historyLoading = {},
  todayAttendanceOverrides = {},
  attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR,
  theme = 'light'
}) => {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  
  // Modal state for attendance confirmation
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalData, setResultModalData] = useState({ type: '', message: '', attendanceStatus: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use local override if available, otherwise fall back to student prop
  // Today column always shows regular attendance, regardless of mode
  const todayStatus = todayAttendanceOverrides[student.id] ?? student.attendance;

  // Status for current mode (used for button disable logic)
  const currentModeStatus = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? student.standupStatus : student.attendance;

  // Check if student has attendance for the current mode (already filtered by date in QRScannerPage)
  const hasAttendanceForMode = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
    ? !!student.standupStatus
    : !!student.attendance;

  // Toggle logic: buttons are disabled based on current status, not just if any attendance exists
  // If marked as Present, disable Present button but enable Late button (and vice versa)
  const isPresentButtonDisabled = hasAttendanceForMode && currentModeStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'standup_present' : 'present');
  const isLateButtonDisabled = hasAttendanceForMode && currentModeStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'standup_late' : 'late');
  const isAbsentButtonDisabled = hasAttendanceForMode && currentModeStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'standup_absent' : 'absent');
  const isClinicButtonDisabled = hasAttendanceForMode && currentModeStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'standup_clinic' : 'clinic');

  // Log 1: Inside disabled check, log Student ID and the specific record object being compared
  console.log('🔍 [LOG 1] StudentTableRow - Button disabled logic:', {
    studentId: student.id,
    studentName: student.displayName || student.name,
    attendanceMode,
    todayStatus,
    hasAttendanceForMode,
    isPresentButtonDisabled,
    isLateButtonDisabled,
    studentAttendance: student.attendance,
    studentStandupStatus: student.standupStatus,
    todayAttendanceOverrides: todayAttendanceOverrides[student.id],
    comparison: {
      presentComparison: todayStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT'),
      lateComparison: todayStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE')
    }
  });

  // Use pre-calculated totals from student object (calculated in QRScannerPage during initial load)
  // These are always available, regardless of whether studentHistory is populated
  const participationValue = student.participation || 0;
  const behaviorValue = student.behavior || 0;
  const penaltyValue = student.penalty || 0;

  // Student history logs are only used for the expanded history view
  const studentLogs = React.useMemo(() => studentHistory?.[student.id] || [], [studentHistory, student.id]);

  console.log('🔍 [DEBUG] StudentTableRow - Totals from student object:', {
    studentId: student.id,
    studentName: student.displayName || student.name,
    participationValue,
    behaviorValue,
    penaltyValue,
    studentParticipation: student.participation,
    studentBehavior: student.behavior,
    studentPenalty: student.penalty,
    studentLogsCount: studentLogs.length
  });

  // Get attendance icon and label function using official constants
  const getAttendanceDisplay = (status) => {
    if (!ATTENDANCE_STATUS_LABELS[status]) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {ICON_TYPES.attendance_status.none}
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>
            {t('none') || 'None'}
          </span>
        </div>
      );
    }

    const color = getAttendanceColor(status);
    const label = getAttendanceLabel(status);

    const getIcon = (s) => {
      const statusUpper = s?.toUpperCase();
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
        <span style={{ fontSize: '0.75rem', color, fontWeight: 500 }}>
          {label}
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
  const handleQuickAttendance = useCallback(async (student, status, mode, programIdParam) => {
    if (isSubmitting) return;

    // Check if student already has this status (use override if available)
    const currentStatus = todayStatus;
    if (currentStatus === status) {
      showResult('info', `${t('already_marked_as')} ${getAttendanceLabel(status, lang)}`, status);
      return;
    }

    setIsSubmitting(true);

    try {
      await onQuickAttendance(student, status, mode || attendanceMode, programIdParam || programId);
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
  }, [isSubmitting, onQuickAttendance, showResult, lang, t, todayStatus, attendanceMode, programId]);

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
        {/* Student Number/ID Column - First */}
        <td style={{
          padding: '0.5rem 0.75rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted, #6b7280)',
          width: '80px',
          fontWeight: 600
        }}>
          {student.studentNumber || student.id}
        </td>
        <td style={{ padding: '0.5rem 0.75rem' }}>
          {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
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
          )}
        </td>
        <StudentInfoCell
          student={student}
          favoriteStudents={favoriteStudents}
          toggleFavorite={toggleFavorite}
          onStudentSelect={onStudentSelect}
          t={t}
          attendanceMode={attendanceMode}
          todayStatus={todayStatus}
          theme={theme}
        />
        {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
          <td style={{ padding: '0.5rem 0.75rem' }} onClick={() => onStudentSelect(student)}>
            <AttendanceStatusCell status={todayStatus} type="regular" t={t} lang={lang} />
          </td>
        )}
        {attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && (
          <td style={{ padding: '0.5rem 0.75rem' }} onClick={() => onStudentSelect(student)}>
            <AttendanceStatusCell status={student.standupStatus} type="standup" t={t} lang={lang} />
          </td>
        )}
        {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
          <StudentStatsRow
            participationValue={participationValue}
            behaviorValue={behaviorValue}
            penaltyValue={penaltyValue}
            onStudentSelect={onStudentSelect}
            student={student}
            attendanceMode={attendanceMode}
          />
        )}
        {/* Attendance Statistics Columns */}
        {attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (
          // Standup Mode: Show standup-specific stats (present, late, absent, clinic)
          <>
            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.5rem',
                fontWeight: 500,
                background: student.standupStats?.present > 0 ? '#dcfce7' : '#f3f4f6',
                color: student.standupStats?.present > 0 ? '#166534' : '#374151'
              }}>
                {student.standupStats?.present || 0}
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
                background: student.standupStats?.late > 0 ? '#fef3c7' : '#f3f4f6',
                color: student.standupStats?.late > 0 ? '#92400e' : '#374151'
              }}>
                {student.standupStats?.late || 0}
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
                background: student.standupStats?.absent > 0 ? '#fee2e2' : '#f3f4f6',
                color: student.standupStats?.absent > 0 ? '#991b1b' : '#374151'
              }}>
                {student.standupStats?.absent || 0}
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
                background: student.standupStats?.clinic > 0 ? '#fce7f3' : '#f3f4f6',
                color: student.standupStats?.clinic > 0 ? '#ec4899' : '#374151'
              }}>
                {student.standupStats?.clinic || 0}
              </span>
            </td>
          </>
        ) : (
          // Regular Mode: Show regular attendance stats
          <>
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
                background: student.attendanceStats?.humanitarianCase > 0 ? ACTIVITY_COLORS.humanitarian : '#f3f4f6',
                color: student.attendanceStats?.humanitarianCase > 0 ? '#ffffff' : '#374151'
              }}>
                {student.attendanceStats?.humanitarianCase || 0}
              </span>
            </td>
          </>
        )}
        <td style={{ padding: '0.5rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {/* Senior-Level Quick Attendance Actions - Moved to first */}
            {canSeeQuickButtons && canMarkAttendance && onQuickAttendance && (
              <QuickAttendanceButtons
                student={student}
                attendanceMode={attendanceMode}
                isSubmitting={isSubmitting}
                isPresentButtonDisabled={isPresentButtonDisabled}
                isLateButtonDisabled={isLateButtonDisabled}
                isAbsentButtonDisabled={isAbsentButtonDisabled}
                isClinicButtonDisabled={isClinicButtonDisabled}
                handleQuickAttendance={handleQuickAttendance}
                programId={programId}
                canEditAttendance={canEditAttendance}
                t={t}
              />
            )}
            {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && canUseZapPanel && (
              <PortalTooltip content={t('actions')} position="top">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      onStudentAction(student);
                    } catch (error) {
                      error('Error calling onStudentAction:', error);
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </Button>
              </PortalTooltip>
            )}
            {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && canUseStatsPanel && (
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
            )}
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
                style={{ display: 'none' }}
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
                style={{ display: 'none' }}
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
      {isExpanded && attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
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
              handleDeleteAttendance={canDeleteAttendance ? handleDeleteAttendance : null}
              handleDeleteParticipation={canDeleteAttendance ? handleDeleteParticipation : null}
              handleDeleteBehavior={canDeleteAttendance ? handleDeleteBehavior : null}
              handleDeletePenalty={canDeleteAttendance ? handleDeletePenalty : null}
              t={t}
              isRTL={isRTL}
              groupLogsByDay={groupLogsByDay}
              toggleFilter={toggleFilter}
              lang={lang}
              historyLoading={historyLoading}
              canDeleteAttendance={canDeleteAttendance}
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

