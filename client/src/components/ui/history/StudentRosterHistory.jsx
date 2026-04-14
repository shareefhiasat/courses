import React, { useMemo } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import StudentHistory from './StudentHistory';
import {
  CheckSmallIcon, MessageSquareIcon, ZapIcon, AlertCircleSmallIcon,
  ParticipationIcon, ChevronDownIcon
} from "@utils/icons.jsx";
import { RECORD_TYPES } from '@utils/sharedTypes';
import PortalTooltip from '@ui/PortalTooltip';
import { getThemedIcon } from '@constants/iconTypes';


import { info, error, warn, debug } from '@services/utils/logger.js';const StudentRosterHistory = ({ 
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
  setSearchQuery = () => {},
  historyLoading = {},
  theme = 'light',
  canDeleteAttendance = false
}) => {
  const isMobile = useIsMobile();
  const groupedLogs = useMemo(
    () => groupLogsByDay(studentHistory[student.id] || []),
    [groupLogsByDay, studentHistory, student.id]
  );
  // Show loading state while fetching history
  if (historyLoading[student.id]) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-muted, #9ca3af)',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid var(--text-muted, #9ca3af)',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        {t('loading')}...
      </div>
    );
  }

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
      backgroundColor: 'var(--background, white)',
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
        backgroundColor: 'var(--panel-hover, var(--background-secondary, #f9fafb))',
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
              border: '1px solid var(--border, #e2e8f0)',
              background: activeFilters.attendance ? '#10b981' : 'var(--background, white)',
              color: activeFilters.attendance ? 'white' : 'var(--text-muted, #64748b)',
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
              border: '1px solid var(--border, #e2e8f0)',
              background: activeFilters.participation ? '#3b82f6' : 'var(--background, white)',
              color: activeFilters.participation ? 'white' : 'var(--text-muted, #64748b)',
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
              border: '1px solid var(--border, #e2e8f0)',
              background: activeFilters.behavior ? '#f97316' : 'var(--background, white)',
              color: activeFilters.behavior ? 'white' : 'var(--text-muted, #64748b)',
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
              border: '1px solid var(--border, #e2e8f0)',
              background: activeFilters.penalties ? '#dc2626' : 'var(--background, white)',
              color: activeFilters.penalties ? 'white' : 'var(--text-muted, #64748b)',
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
              placeholder={t('attendance.search_placeholder') || 'Search...'}
              style={{
                width: '100%',
                padding: isMobile
                ? `0.375rem ${isRTL ? '2rem' : '0.5rem'} 0.375rem ${isRTL ? '0.5rem' : '2rem'}`
                : `0.5rem ${isRTL ? '2.5rem' : '0.75rem'} 0.5rem ${isRTL ? '0.75rem' : '2.5rem'}`,
                border: '1px solid var(--border, #d1d5db)',
                borderRadius: '0.375rem',
                fontSize: isMobile ? '0.75rem' : '0.8125rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: 'var(--input-bg, white)',
                color: 'var(--text, #111827)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border, #d1d5db)'}
            />
            <div style={{
              position: 'absolute',
              [isRTL ? 'left' : 'right']: isMobile ? '0.5rem' : '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #6b7280)'
            }}>
              {getThemedIcon('ui', 'search', isMobile ? 14 : 16, theme)}
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  [isRTL ? 'right' : 'left']: isMobile ? '0.5rem' : '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #6b7280)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                {getThemedIcon('ui', 'x', isMobile ? 12 : 14, theme)}
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
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--panel-hover, #f8fafc)',
              color: 'var(--text-muted, #64748b)',
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
        handleDeleteAttendance={canDeleteAttendance ? handleDeleteAttendance : null}
        handleDeleteParticipation={canDeleteAttendance ? handleDeleteParticipation : null}
        handleDeleteBehavior={canDeleteAttendance ? handleDeleteBehavior : null}
        handleDeletePenalty={canDeleteAttendance ? handleDeletePenalty : null}
        t={t}
        isRTL={isRTL}
        studentId={student.id}
        lang={lang}
        studentName={studentName}
        canDeleteAttendance={canDeleteAttendance}
        theme={theme}
      />
    </div>
  );
};

export default StudentRosterHistory;
