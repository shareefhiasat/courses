import React from 'react';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, PenaltyIcon, ParticipationIcon, DetailsIcon, ZapIcon } from '@utils/icons.jsx';
import AttendanceActionButtons from './AttendanceActionButtons.jsx';
import { ATTENDANCE_STATUS, getAttendanceColor, ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { info } from '@services/utils/logger.js';
import { getLocalizedUserName } from '@utils/localizedUserName';

const StudentScanDialog = ({
  showScanDialog,
  lastScannedStudent,
  selectedProgramId,
  selectedSubjectId,
  selectedClassId,
  isMobile,
  actionLoading,
  currentAction,
  t,
  lang,
  onClose,
  onMarkAttendance,
  onOpenPenalty,
  onOpenParticipation,
  onOpenBehavior,
  onOpenDetails,
  canEditAttendance = false,
  onOpenActions,
  students,
  processStudentData,
  setStudentForAction,
  setShowStudentActionStatsPanel,
  setShowStudentActionZapPanel,
  setShowScanDialog,
  addDebugLog,
  showResult,
  attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR
}) => {
  // In standup mode, only require programId; in regular mode, require all three
  if (!showScanDialog || !lastScannedStudent || !selectedProgramId) {
    return null;
  }

  // In regular mode, also require subjectId and classId
  if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR && (!selectedSubjectId || !selectedClassId)) {
    return null;
  }

  const handleDetailsClick = async () => {
    info('📋 Open student details');
    addDebugLog('📋 Opening student details', 'info');

    try {
      let studentReferenceId = null;
      
      if (lastScannedStudent?.referenceId) {
        studentReferenceId = lastScannedStudent.referenceId;
        info('🔍 Found referenceId from lastScannedStudent:', studentReferenceId);
      } else if (lastScannedStudent?.studentId) {
        studentReferenceId = lastScannedStudent.studentId;
        info('🔍 Found studentId from lastScannedStudent:', studentReferenceId);
      }
      
      info('🔍 Final studentReferenceId:', studentReferenceId);
      
      if (studentReferenceId) {
        const studentData = await processStudentData(studentReferenceId);
        if (studentData) {
          setStudentForAction(studentData);
          setShowStudentActionStatsPanel(true);
          setShowScanDialog(false);
          addDebugLog(`✅ Opening details for: ${studentData.name || studentData.email || 'Unknown'} (${studentReferenceId})`, 'success');
        } else {
          showResult('error', 'Student data not found');
        }
      } else {
        showResult('error', 'No student reference ID available');
        addDebugLog('❌ Could not find student reference ID', 'error');
      }
    } catch (err) {
      addDebugLog(`❌ Error opening student details: ${err.message}`, 'error');
      showResult('error', `Failed to open student details: ${err.message}`);
    }
  };

  const handleActionsClick = async () => {
    info('🎯 Open student actions');
    addDebugLog('🎯 Opening student actions', 'info');

    try {
      let studentData;
      if (lastScannedStudent?.referenceId) {
        studentData = await processStudentData(lastScannedStudent.referenceId);
      } else if (lastScannedStudent?.id) {
        studentData = {
          id: lastScannedStudent.id,
          userId: lastScannedStudent.userId || lastScannedStudent.id,
          studentId: lastScannedStudent.studentId || lastScannedStudent.studentNumber,
          studentNumber: lastScannedStudent.studentNumber,
          name: lastScannedStudent.name || lastScannedStudent.displayName,
          displayName: lastScannedStudent.displayName,
          email: lastScannedStudent.email,
          attendance: lastScannedStudent.attendance || lastScannedStudent.status,
          classId: selectedClassId,
          programId: selectedProgramId,
          subjectId: selectedSubjectId,
          referenceId: lastScannedStudent.referenceId || lastScannedStudent.studentNumber || String(lastScannedStudent.id)
        };
      }

      if (studentData) {
        setStudentForAction(studentData);
        setShowStudentActionZapPanel(true);
        setShowScanDialog(false);
        addDebugLog(`✅ Opening actions for: ${studentData.name || studentData.email || 'Unknown'}`, 'success');
      } else {
        showResult('error', 'Student not found with this reference ID');
      }
    } catch (err) {
      addDebugLog(`❌ Error opening student actions: ${err.message}`, 'error');
      showResult('error', `Failed to open student actions: ${err.message}`);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'hidden',
      cursor: 'pointer'
    }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
        background: 'white',
        borderRadius: isMobile ? '0' : '0.5rem',
        padding: isMobile ? '0.75rem' : '1rem',
        width: isMobile ? '95vw' : '350px',
        maxWidth: isMobile ? '95vw' : '350px',
        minWidth: isMobile ? 'auto' : '300px',
        height: isMobile ? '100vh' : 'auto',
        maxHeight: isMobile ? '100vh' : '80vh',
        overflow: 'auto',
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? '0' : 'auto',
        left: isMobile ? '0' : 'auto',
        cursor: 'default'
      }}>
        <h3 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          color: '#111827',
          margin: '0 0 1rem 0'
        }}>
          {t('choose_action') || 'Choose Action'}
        </h3>

        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '0.375rem',
          fontSize: 'var(--font-size-sm)',
          color: '#6b7280'
        }}>
          <div>
            {lastScannedStudent.name || lastScannedStudent.displayName || lastScannedStudent.email ? (
              <div style={{ fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>{getLocalizedUserName(lastScannedStudent, lang)}</span>
                {(() => {
                  const sNum = lastScannedStudent.studentNumber || lastScannedStudent.referenceId || lastScannedStudent.studentId;
                  if (!sNum) return null;
                  return (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.125rem 0.5rem',
                      background: '#e0e7ff',
                      color: '#3730a3',
                      borderRadius: '0.25rem',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600
                    }}>
                      #{sNum}
                    </span>
                  );
                })()}
              </div>
            ) : (
              <div style={{ fontStyle: 'italic' }}>
                {t('no_name_available') || 'Not available'}
              </div>
            )}

            {lastScannedStudent.email && lastScannedStudent.name && (
              <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>
                {lastScannedStudent.email}
              </div>
            )}
          </div>
        </div>

        <AttendanceActionButtons
          onMarkAttendance={onMarkAttendance}
          actionLoading={actionLoading}
          currentAction={currentAction}
          currentAttendanceStatus={lastScannedStudent?.attendance || lastScannedStudent?.status}
          t={t}
          isMobile={isMobile}
          attendanceMode={attendanceMode}
          canEditAttendance={canEditAttendance}
        />

        {/* Hide Penalty, Participation, Behavior, and Actions buttons in standup mode */}
        {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}>
            <button
              onClick={onOpenPenalty}
              disabled={actionLoading}
              style={{
                padding: '0.875rem',
                border: 'none',
                background: actionLoading && currentAction === 'penalty' ? '#94a3b8' : '#ef4444',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                opacity: actionLoading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!actionLoading) {
                  e.target.style.background = '#dc2626';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!actionLoading) {
                  e.target.style.background = '#ef4444';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                }
              }}
            >
              {actionLoading && currentAction === 'penalty' ? (
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
              ) : (
                <>
                  <PenaltyIcon style={{ width: '18px', height: '18px' }} />
                  {t('penalty') || 'Penalty'}
                </>
              )}
            </button>

            <button
              onClick={onOpenParticipation}
              disabled={actionLoading}
              style={{
                padding: '0.875rem',
                border: 'none',
                background: actionLoading && currentAction === RECORD_TYPES.PARTICIPATION ? '#94a3b8' : '#3b82f6',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                opacity: actionLoading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!actionLoading) {
                  e.target.style.background = '#2563eb';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!actionLoading) {
                  e.target.style.background = '#3b82f6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                }
              }}
            >
              {actionLoading && currentAction === RECORD_TYPES.PARTICIPATION ? (
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
              ) : (
                <>
                  <ParticipationIcon style={{ width: '18px', height: '18px' }} />
                  {t('participation') || 'Participation'}
                </>
              )}
            </button>

            <button
              onClick={onOpenBehavior}
              disabled={actionLoading}
              style={{
                padding: '0.875rem',
                border: 'none',
                background: actionLoading && currentAction === RECORD_TYPES.BEHAVIOR ? '#94a3b8' : '#f97316',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                opacity: actionLoading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(249, 115, 22, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!actionLoading) {
                  e.target.style.background = '#ea580c';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(249, 115, 22, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!actionLoading) {
                  e.target.style.background = '#f97316';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(249, 115, 22, 0.2)';
                }
              }}
            >
              {actionLoading && currentAction === RECORD_TYPES.BEHAVIOR ? (
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
              ) : (
                <>
                  <ZapIcon style={{ width: '18px', height: '18px' }} />
                  {t('behavior') || 'Behavior'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Hide Actions button in standup mode */}
        {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}>
            <button
              onClick={handleDetailsClick}
              disabled={actionLoading}
              style={{
                display: 'none',
                flex: isMobile ? 1 : 2,
                padding: '0.875rem',
                border: 'none',
                background: actionLoading && currentAction === 'details' ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.625rem',
                opacity: actionLoading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)',
                order: isMobile ? -1 : 1
              }}
              onMouseEnter={(e) => {
                if (!actionLoading) {
                  e.target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!actionLoading) {
                  e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(139, 92, 246, 0.3)';
                }
              }}
            >
              {actionLoading && currentAction === 'details' ? (
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
              ) : (
                <>
                  <DetailsIcon style={{ width: '18px', height: '18px' }} />
                  {t('details') || 'Details'}
                </>
              )}
            </button>

            <button
              onClick={handleActionsClick}
              disabled={actionLoading}
              style={{
                flex: isMobile ? 1 : 2,
                padding: '0.875rem',
                border: 'none',
                background: actionLoading && currentAction === 'actions' ? '#94a3b8' : '#8b5cf6',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                opacity: actionLoading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!actionLoading) {
                  e.target.style.background = '#7c3aed';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!actionLoading) {
                  e.target.style.background = '#8b5cf6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.2)';
                }
              }}
            >
              {actionLoading && currentAction === 'actions' ? (
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
              ) : (
                <>
                  <ZapIcon style={{ width: '18px', height: '18px' }} />
                  {t('actions') || 'Actions'}
                </>
              )}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginTop: '1rem',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: '#4b5563',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#f3f4f6';
          }}
        >
          {t('cancel') || 'Cancel'}
        </button>
      </div>
    </div>
  );
};

export default StudentScanDialog;
