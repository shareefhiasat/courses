import React from 'react';
import StudentHistory from './StudentHistory';
import {
  CheckSmallIcon, MessageSquareIcon, ZapIcon, AlertCircleSmallIcon,
  ParticipationIcon
} from "@utils/icons.jsx";
import { RECORD_TYPES } from '@constants/activityTypes';

const StudentRosterHistory = ({ 
  student, 
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
  t, 
  isRTL,
  groupLogsByDay,
  toggleFilter 
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
  if (!studentHistory[student.id]) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-muted, #9ca3af)',
        fontSize: '0.875rem'
      }}>
        {t('no_history_available')}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--background, #ffffff)',
      borderRadius: '0.5rem',
      border: '1px solid var(--border, #e5e7eb)',
      overflow: 'hidden'
    }}>
      {/* Filter Buttons */}
      <div style={{
        padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid var(--border, #e5e7eb)',
        backgroundColor: 'var(--surface, #f9fafb)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? '0.5rem' : '0'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.25rem' : '0.5rem',
          flexWrap: 'wrap',
          flex: isMobile ? '1' : 'auto'
        }}>
          <button
            onClick={() => toggleFilter(RECORD_TYPES.ATTENDANCE)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.25rem' : '0.375rem',
              padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeFilters.attendance ? '#10b981' : '#ffffff',
              color: activeFilters.attendance ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeFilters.attendance ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              minWidth: isMobile ? 'auto' : '0'
            }}
          >
            <CheckSmallIcon style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }} />
            {t('attendance')}
          </button>
          <button
            onClick={() => toggleFilter(RECORD_TYPES.PARTICIPATION)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.25rem' : '0.375rem',
              padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeFilters.participation ? '#3b82f6' : '#ffffff',
              color: activeFilters.participation ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeFilters.participation ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              minWidth: isMobile ? 'auto' : '0'
            }}
          >
            <ParticipationIcon style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }} />
            {t('participation')}
          </button>
          <button
            onClick={() => toggleFilter(RECORD_TYPES.BEHAVIOR)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.25rem' : '0.375rem',
              padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeFilters.behavior ? '#f97316' : '#ffffff',
              color: activeFilters.behavior ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeFilters.behavior ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              minWidth: isMobile ? 'auto' : '0'
            }}
          >
            <ZapIcon style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }} />
            {t('behavior')}
          </button>
          <button
            onClick={() => toggleFilter('penalties')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.25rem' : '0.375rem',
              padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.75rem',
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeFilters.penalties ? '#dc2626' : '#ffffff',
              color: activeFilters.penalties ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeFilters.penalties ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              minWidth: isMobile ? 'auto' : '0'
            }}
          >
            <AlertCircleSmallIcon style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }} />
            {t('penalties')}
          </button>
        </div>
        {studentHistory[student.id] && studentHistory[student.id].length > 0 && (
          <button
            onClick={() => {
              const groupedLogs = groupLogsByDay(studentHistory[student.id] || []);
              const allExpanded = groupedLogs.every(log => expandedDays.has(log.date));
              if (allExpanded) {
                collapseAllDays();
              } else {
                expandAllDays();
              }
            }}
            style={{
              display: isMobile ? 'none' : 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={() => {
              const groupedLogs = groupLogsByDay(studentHistory[student.id] || []);
              const allExpanded = groupedLogs.every(log => expandedDays.has(log.date));
              return allExpanded ? (t('collapse_all') || 'Collapse All') : (t('expand_all') || 'Expand All');
            }}
          >
            {(() => {
              const groupedLogs = groupLogsByDay(studentHistory[student.id] || []);
              const allExpanded = groupedLogs.every(log => expandedDays.has(log.date));
              return allExpanded ? (
                <>
                  <svg style={{ width: '14px', height: '14px', transform: 'rotate(180deg)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  {t('collapse_all') || 'Collapse All'}
                </>
              ) : (
                <>
                  <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  {/*{t('expand_all') || 'Expand All'}*/}
                </>
              );
            })()}
          </button>
        )}
      </div>

      {/* Student History Component */}
      <StudentHistory 
        groupedLogs={groupLogsByDay(studentHistory[student.id] || [])}
        expandedDays={expandedDays}
        activeFilters={activeFilters}
        toggleDayExpansion={toggleDayExpansion}
        handleDeleteAttendance={handleDeleteAttendance}
        handleDeleteParticipation={handleDeleteParticipation}
        handleDeleteBehavior={handleDeleteBehavior}
        handleDeletePenalty={handleDeletePenalty}
        t={t}
        isRTL={isRTL}
        studentId={student.id}
      />
    </div>
  );
};

export default StudentRosterHistory;
