import React, { useMemo } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import StudentHistory from './StudentHistory';
import {
  CheckSmallIcon, MessageSquareIcon, ZapIcon, AlertCircleSmallIcon,
  ParticipationIcon, ChevronDownIcon
} from "@utils/icons.jsx";
import { RECORD_TYPES } from '@utils/sharedTypes';
import PortalTooltip from '@ui/PortalTooltip';

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
  toggleFilter,
  lang = 'en',
  studentName,
  searchQuery = '',
  setSearchQuery = () => {}
}) => {
  const isMobile = useIsMobile();
  const groupedLogs = useMemo(
    () => groupLogsByDay(studentHistory[student.id] || []),
    [groupLogsByDay, studentHistory, student.id]
  );
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
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1
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
          flex: isMobile ? '1' : 'auto',
          alignItems: 'center'
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
          
          {/* Search Input */}
          <div style={{
            position: 'relative',
            width: isMobile ? '200px' : '250px'
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder') || 'Search...'}
              style={{
                width: '100%',
                padding: isMobile ? '0.375rem 0.5rem 0.375rem 2rem' : '0.5rem 0.75rem 0.5rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: isMobile ? '0.75rem' : '0.8125rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <div style={{
              position: 'absolute',
              left: isMobile ? '0.5rem' : '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}>
              <svg style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: isMobile ? '0.5rem' : '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <svg style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {studentHistory[student.id] && studentHistory[student.id].length > 0 && (
          <PortalTooltip content={(() => {
            const allExpanded = groupedLogs.every(log => expandedDays.has(log.date));
            return t('expand_all');
          })()} position="top">
          <button
            onClick={expandAllDays}
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
          >
            <>
                  <ChevronDownIcon style={{ width: '14px', height: '14px' }} />
                </>
          </button>
          </PortalTooltip>
        )}
      </div>

      {/* Student History Component */}
      <StudentHistory 
        groupedLogs={groupedLogs}
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
        lang={lang}
        studentName={studentName}
      />
    </div>
  );
};

export default StudentRosterHistory;
