import React from 'react';
import { Button } from '@ui';
import { Star, ChevronDown, ChevronRight, Trash2, Users, Trophy, AlertCircle } from 'lucide-react';
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
              ID: STU-{student.studentNumber || student.studentId?.slice(-4) || '0000'}
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
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {student.attendance && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
              {t('todays_attendance') || "Today's Attendance"}:
            </span>
            {getAttendanceBadge(student.attendance)}
          </div>
        )}
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
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            try {
              onStudentAction(student);
            } catch (error) {
              console.error('Error calling onStudentAction:', error);
            }
          }}
          style={{ flex: 1 }}
        >
          {t('actions')}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onStudentSelect(student);
          }}
          style={{ flex: 1 }}
        >
          {t('stats')}
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
