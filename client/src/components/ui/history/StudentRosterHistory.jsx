import React from 'react';
import StudentHistory from './StudentHistory';

const StudentRosterHistory = ({ 
  student, 
  studentHistory, 
  expandedDays, 
  activeFilters, 
  toggleDayExpansion, 
  handleDeleteAttendance, 
  handleDeleteParticipation,
  handleDeleteBehavior,
  handleDeletePenalty, 
  t, 
  isRTL,
  groupLogsByDay,
  toggleFilter 
}) => {
  if (!studentHistory[student.id]) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-muted, #9ca3af)',
        fontSize: '0.875rem'
      }}>
        {t('loading')}...
      </div>
    );
  }

  return (
    <div style={{ fontSize: '0.875rem' }}>
      {/* History Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '0.5rem',
        background: 'var(--panel-hover, #f8fafc)',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-secondary, #374151)',
          margin: 0
        }}>
          {t('history')}
        </h4>
        <div style={{
          display: 'flex',
          gap: '0.25rem'
        }}>
          <button
            onClick={() => toggleFilter('attendance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeFilters.attendance ? '#065f46' : '#ffffff',
              color: activeFilters.attendance ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeFilters.attendance ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {t('attendance')}
          </button>
          <button
            onClick={() => toggleFilter('participation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeFilters.participation ? '#3b82f6' : '#ffffff',
              color: activeFilters.participation ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeFilters.participation ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            {t('participation')}
          </button>
          <button
            onClick={() => toggleFilter('behavior')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeFilters.behavior ? '#f97316' : '#ffffff',
              color: activeFilters.behavior ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeFilters.behavior ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            {t('behavior')}
          </button>
          <button
            onClick={() => toggleFilter('penalties')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeFilters.penalties ? '#dc2626' : '#ffffff',
              color: activeFilters.penalties ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeFilters.penalties ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {t('penalties')}
          </button>
        </div>
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
