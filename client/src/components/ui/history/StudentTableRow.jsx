import React from 'react';
import { Button } from '@ui';
import { Star, ChevronDown, ChevronRight, Trash2, SidebarOpen, QrCode, Mail, ExternalLink, Users, Trophy, AlertCircle } from 'lucide-react';
import StudentRosterHistory from './StudentRosterHistory';
import { QRCodeDisplay, useQRCodeEmail } from '@utils/qrCodeUtils';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';
import { CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, CircleIcon } from '@utils/icons.jsx';

const StudentTableRow = ({ 
  student, 
  isExpanded, 
  favoriteStudents, 
  toggleFavorite, 
  toggleRowExpansion, 
  onStudentAction, 
  onStudentSelect, 
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
  t, 
  isRTL,
  groupLogsByDay,
  toggleFilter 
}) => {
  const { openQRCodeInNewTab } = QRCodeDisplay({});
  const { sendQRCodeEmail } = useQRCodeEmail();
  
  const avatarColor = getAvatarColor(student.displayName || student.realName || student.name || '');

  // Get attendance icon and label function using official constants
  const getAttendanceDisplay = (status) => {
    const statusInfo = ATTENDANCE_STATUS_LABELS[status];
    if (!statusInfo) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>None</span>
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
        default: 
          return <CircleIcon style={{ width: '16px', height: '16px', stroke: statusInfo.color }} />;
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {getIcon(status)}
        <span style={{ fontSize: '0.75rem', color: statusInfo.color, fontWeight: 500 }}>
          {statusInfo.en}
        </span>
      </div>
    );
  };

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
              <ChevronDown style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)' }} />
            ) : (
              isRTL ? (
                <ChevronDown style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)', transform: 'rotate(-90deg)' }} />
              ) : (
                <ChevronRight style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)' }} />
              )
            )}
          </button>
        </td>
        <td style={{ padding: '0.5rem 0.75rem' }} onClick={() => onStudentSelect(student)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              <Star 
                style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  color: favoriteStudents.includes(student.id) ? '#f59e0b' : 'var(--text-muted, #d1d5db)',
                  fill: favoriteStudents.includes(student.id) ? '#f59e0b' : 'none'
                }} 
              />
            </button>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text, #111827)' }}>
                {student.displayName || student.realName || student.name || student.email}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                ID: {student.studentNumber || '0000'}
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
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  onStudentAction(student);
                } catch (error) {
                  console.error('Error calling onStudentAction:', error);
                }
              }}
              title={t('actions')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              title={t('stats')}
              onClick={(e) => {
                e.stopPropagation();
                onStudentSelect(student);
              }}
            >
              <SidebarOpen style={{ width: '1rem', height: '1rem' }} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={async (e) => {
                e.stopPropagation();
                await openQRCodeInNewTab(student);
              }}
              title={t('open_qr_code')}
            >
              <ExternalLink style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={async (e) => {
                e.stopPropagation();
                await sendQRCodeEmail(student, setSendingEmails);
              }}
              disabled={sendingEmails[student.id]?.qrCode}
              title={t('send_qr_code')}
            >
              {sendingEmails[student.id]?.qrCode ? (
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
                <QrCode style={{ width: '1rem', height: '1rem' }} />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={async (e) => {
                e.stopPropagation();
                await sendStudentSummaryEmail(student);
              }}
              disabled={sendingEmails[student.id]?.summary}
              title={t('send_summary_report')}
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
                <Mail style={{ width: '1rem', height: '1rem' }} />
              )}
            </Button>
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
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default StudentTableRow;
