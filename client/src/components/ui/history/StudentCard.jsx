import React from 'react';
import { Button } from '@ui';
import { Star, ChevronDown, ChevronRight, Trash2, Users, Trophy, AlertCircle, Settings, BarChart3, QrCode, Mail, SidebarOpen, ExternalLink } from 'lucide-react';
import StudentRosterHistory from './StudentRosterHistory';
import { QRCodeDisplay, useQRCodeEmail } from '@utils/qrCodeUtils';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';

const StudentCard = ({ 
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
  handleDeleteAttendance, 
  handleDeleteParticipation,
  handleDeletePenalty, 
  getAttendanceBadge, 
  t, 
  isRTL,
  groupLogsByDay,
  toggleFilter,
  sendingEmails,
  setSendingEmails,
  sendStudentSummaryEmail
}) => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { openQRCodeInNewTab } = QRCodeDisplay({});
  const { sendQRCodeEmail } = useQRCodeEmail();
  
  const avatarColor = getAvatarColor(student.displayName || student.realName || student.name || '');

  return (
    <div
      key={student.id}
      style={{
        background: 'var(--panel, white)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '0.5rem',
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.15s'
      }}
      onClick={() => onStudentSelect(student)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
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
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: 500,
            background: avatarColor.bg,
            color: avatarColor.color
          }}>
            {getAvatarInitials(student.displayName || student.realName || student.name || '')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, color: 'var(--text, #111827)', fontSize: '0.875rem' }}>
              {student.displayName || student.realName || student.name || student.email}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
              ID: {student.studentNumber || student.studentId?.slice(-4) || '0000'}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRowExpansion(student.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem'
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
      </div>
      
      {/* Student Details - Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
        gap: '0.75rem', 
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('today') || "Today"}:
          </span>
          {student.attendance ? (
            getAttendanceBadge(student.attendance)
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>None</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('part')}:
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.75rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            background: '#dbeafe',
            color: '#1e40af',
            fontSize: '0.75rem',
            padding: '0 0.5rem'
          }}>
            {student.participation}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('behavior')}:
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.75rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            background: student.behavior >= 0 ? '#d1fae5' : '#fee2e2',
            color: student.behavior >= 0 ? '#065f46' : '#991b1b',
            fontSize: '0.75rem',
            padding: '0 0.5rem'
          }}>
            {student.behavior}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('penalties')}:
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.75rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            background: student.penalty < 0 ? '#fee2e2' : '#f3f4f6',
            color: student.penalty < 0 ? '#991b1b' : '#374151',
            fontSize: '0.75rem',
            padding: '0 0.5rem'
          }}>
            {student.penalty}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('id') || 'ID'}:
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: '#059669',
            fontWeight: 600
          }}>
            {student.studentNumber || '—'}
          </span>
        </div>
      </div>
      
      {/* Attendance Statistics - Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
        gap: '0.5rem', 
        marginBottom: '1rem',
        padding: '0.75rem',
        background: 'var(--panel-hover, #f8fafc)',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)' }}>Present:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.present > 0 ? '#dcfce7' : '#f3f4f6',
            color: student.attendanceStats?.present > 0 ? '#166534' : '#374151',
            fontSize: '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.present || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)' }}>Late:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.late > 0 ? '#fef3c7' : '#f3f4f6',
            color: student.attendanceStats?.late > 0 ? '#92400e' : '#374151',
            fontSize: '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.late || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)' }}>Absent:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.absent > 0 ? '#fee2e2' : '#f3f4f6',
            color: student.attendanceStats?.absent > 0 ? '#991b1b' : '#374151',
            fontSize: '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.absent || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)' }}>Absent Excused:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.absentWithExcuse > 0 ? '#dbeafe' : '#f3f4f6',
            color: student.attendanceStats?.absentWithExcuse > 0 ? '#1e40af' : '#374151',
            fontSize: '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.absentWithExcuse || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)' }}>Excused Leave:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.excusedLeave > 0 ? '#f3e8ff' : '#f3f4f6',
            color: student.attendanceStats?.excusedLeave > 0 ? '#6b21a8' : '#374151',
            fontSize: '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.excusedLeave || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #6b7280)' }}>Humanitarian:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2rem',
            height: '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.humanitarianCase > 0 ? '#fef2f2' : '#f3f4f6',
            color: student.attendanceStats?.humanitarianCase > 0 ? '#b91c1c' : '#374151',
            fontSize: '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.humanitarianCase || 0}
          </span>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: isMobile ? '0.25rem' : '0.5rem',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        <Button 
          variant="ghost" 
          size={isMobile ? 'icon' : 'sm'}
          onClick={(e) => {
            e.stopPropagation();
            try {
              onStudentAction(student);
            } catch (error) {
              console.error('Error calling onStudentAction:', error);
            }
          }}
          style={isMobile ? {} : { flex: 1 }}
          title={t('actions')}
        >
          {isMobile ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          ) : t('actions')}
        </Button>
        <Button 
          variant="ghost" 
          size={isMobile ? 'icon' : 'sm'}
          onClick={(e) => {
            e.stopPropagation();
            onStudentSelect(student);
          }}
          style={isMobile ? {} : { flex: 1 }}
          title={t('stats')}
        >
          {isMobile ? <SidebarOpen style={{ width: '1rem', height: '1rem' }} /> : t('stats')}
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            openQRCodeInNewTab(student);
          }}
          title={t('open_qr_code') || 'Open QR Code'}
        >
          <ExternalLink style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            sendQRCodeEmail(student, {
              onSuccess: () => {
                // Handle success
              },
              onError: (error) => {
                console.error('Failed to send QR code email:', error);
              }
            });
          }}
          title={t('send_qr_code') || 'Send QR Code'}
        >
          <Mail style={{ width: '1rem', height: '1rem' }} />
        </Button>
      </div>
      
      {isExpanded && studentHistory[student.id] && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
          <StudentRosterHistory 
            student={student}
            studentHistory={studentHistory}
            expandedDays={expandedDays}
            activeFilters={activeFilters}
            toggleDayExpansion={toggleDayExpansion}
            handleDeleteAttendance={handleDeleteAttendance}
            handleDeleteParticipation={handleDeleteParticipation}
            handleDeletePenalty={handleDeletePenalty}
            t={t}
            isRTL={isRTL}
            groupLogsByDay={groupLogsByDay}
            toggleFilter={toggleFilter}
          />
        </div>
      )}
    </div>
  );
};

export default StudentCard;
