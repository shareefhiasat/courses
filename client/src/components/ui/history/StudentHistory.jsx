import React from 'react';
import { HistoryDayHeader } from './HistoryDayHeader';
import { HistorySection } from './HistorySection';
import { AttendanceIcon, ParticipationIcon, ZapIcon, PenaltyIcon } from '@utils/icons.jsx';

const StudentHistory = React.memo(({ 
  groupedLogs, 
  expandedDays, 
  activeFilters, 
  toggleDayExpansion, 
  handleDeleteAttendance, 
  handleDeleteParticipation,
  handleDeleteBehavior,
  handleDeletePenalty, 
  t, 
  isRTL,
  studentId 
}) => {
  console.log('🔧 StudentHistory rendering with groupedLogs:', groupedLogs);
  console.log('🔧 StudentHistory expandedDays:', expandedDays);
  console.log('🔧 StudentHistory activeFilters:', activeFilters);
  
  return groupedLogs.map((dayGroup, dayIndex) => {
    const dateObj = new Date(dayGroup.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const isDayExpanded = expandedDays.has(dayGroup.date);
    const filteredCounts = {
      attendance: activeFilters.attendance ? dayGroup.attendance.length : 0,
      participation: activeFilters.participation ? dayGroup.participation.length : 0,
      behavior: activeFilters.behavior ? (dayGroup.behavior ? dayGroup.behavior.length : 0) : 0,
      penalties: activeFilters.penalties ? dayGroup.penalties.length : 0
    };
    const hasVisibleItems = filteredCounts.attendance + filteredCounts.participation + filteredCounts.behavior + filteredCounts.penalties > 0;
    
    console.log('🔧 StudentHistory dayGroup:', {
      date: dayGroup.date,
      isDayExpanded,
      filteredCounts,
      hasVisibleItems,
      attendanceLogs: dayGroup.attendance.length,
      penaltyLogs: dayGroup.penalties.length,
      participationLogs: dayGroup.participation.length,
      behaviorLogs: dayGroup.behavior ? dayGroup.behavior.length : 0
    });
    
    if (!hasVisibleItems) {
      console.log('🔧 StudentHistory - skipping day due to no visible items:', dayGroup.date);
      return null;
    }
    
    return (
      <div key={dayIndex} style={{
        border: '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        overflow: 'hidden',
        marginBottom: '0.5rem'
      }}>
        <HistoryDayHeader
          dateStr={dateStr}
          filteredCounts={filteredCounts}
          isDayExpanded={isDayExpanded}
          onToggle={() => toggleDayExpansion(dayGroup.date)}
          t={t}
          isRTL={isRTL}
        />
        
        {isDayExpanded && (
          <div style={{ padding: '0.5rem 0.75rem' }}>
            <HistorySection
              title="Attendance"
              logs={dayGroup.attendance.sort((a, b) => {
                const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
                const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
                return timeB - timeA; // Newest first
              })}
              type="attendance"
              icon={<AttendanceIcon />}
              iconColor="#10b981"
              activeFilters={activeFilters}
              onDelete={(logId) => handleDeleteAttendance(studentId, logId)}
              t={t}
              isRTL={isRTL}
              borderColor="#f1f5f9"
            />
            
            <HistorySection
              title="Participation"
              logs={dayGroup.participation.sort((a, b) => {
                const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
                const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
                return timeB - timeA; // Newest first
              })}
              type="participation"
              icon={<ParticipationIcon />}
              iconColor="#3b82f6"
              activeFilters={activeFilters}
              onDelete={(logId) => handleDeleteParticipation(studentId, logId)}
              t={t}
              isRTL={isRTL}
              borderColor="#e5e7eb"
            />
            
            <HistorySection
              title="Behavior"
              logs={(dayGroup.behavior || []).sort((a, b) => {
                const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
                const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
                return timeB - timeA; // Newest first
              })}
              type="behavior"
              icon={<ZapIcon />}
              iconColor="#f97316"
              activeFilters={activeFilters}
              onDelete={(logId) => handleDeleteBehavior(studentId, logId)}
              t={t}
              isRTL={isRTL}
              borderColor="#fed7aa"
            />
            
            <HistorySection
              title="Penalties"
              logs={dayGroup.penalties.sort((a, b) => {
                const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
                const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
                return timeB - timeA; // Newest first
              })}
              type="penalty"
              icon={<PenaltyIcon />}
              iconColor="#ef4444"
              activeFilters={activeFilters}
              onDelete={(logId) => handleDeletePenalty(studentId, logId)}
              t={t}
              isRTL={isRTL}
              borderColor="#fecaca"
            />
          </div>
        )}
      </div>
    );
  });
});

StudentHistory.displayName = 'StudentHistory';

export default StudentHistory;
