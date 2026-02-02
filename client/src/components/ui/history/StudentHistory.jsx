import React from 'react';
import { HistoryDayHeader } from './HistoryDayHeader';
import { HistorySection } from './HistorySection';
import { HistoryEntry } from './HistoryEntry';
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
      attendanceData: dayGroup.attendance.slice(0, 2), // Show first 2 attendance logs
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
            {/* Combined Timeline - All records sorted by time */}
            {(() => {
              // Combine all logs from all types and sort by time
              const allLogs = [
                ...dayGroup.attendance.map(log => ({ ...log, logType: 'attendance' })),
                ...dayGroup.participation.map(log => ({ ...log, logType: 'participation' })),
                ...(dayGroup.behavior || []).map(log => ({ ...log, logType: 'behavior' })),
                ...dayGroup.penalties.map(log => ({ ...log, logType: 'penalty' }))
              ].sort((a, b) => {
                const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
                const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
                return timeB - timeA; // Newest first
              });

              console.log('🔍 Combined timeline logs:', allLogs.map(log => ({
                time: log.time,
                type: log.logType,
                label: log.label
              })));

              return allLogs.map((log, index) => {
                // Get the appropriate icon and color based on log type
                let icon, iconColor, borderColor, onDelete;
                
                switch (log.logType) {
                  case 'attendance':
                    icon = <AttendanceIcon />;
                    iconColor = "#10b981";
                    borderColor = "#f1f5f9";
                    onDelete = (logId) => handleDeleteAttendance(studentId, logId);
                    break;
                  case 'participation':
                    icon = <ParticipationIcon />;
                    iconColor = "#3b82f6";
                    borderColor = "#e5e7eb";
                    onDelete = (logId) => handleDeleteParticipation(studentId, logId);
                    break;
                  case 'behavior':
                    icon = <ZapIcon />;
                    iconColor = "#f97316";
                    borderColor = "#fed7aa";
                    onDelete = (logId) => handleDeleteBehavior(studentId, logId);
                    break;
                  case 'penalty':
                    icon = <PenaltyIcon />;
                    iconColor = "#ef4444";
                    borderColor = "#fecaca";
                    onDelete = (logId) => handleDeletePenalty(studentId, logId);
                    break;
                  default:
                    return null;
                }

                return (
                  <HistoryEntry
                    key={`${log.logType}-${log.id}-${index}`}
                    log={log}
                    type={log.logType}
                    icon={icon}
                    iconColor={iconColor}
                    borderColor={index === allLogs.length - 1 ? 'none' : borderColor}
                    onDelete={onDelete}
                    t={t}
                    isRTL={isRTL}
                  />
                );
              });
            })()}
          </div>
        )}
      </div>
    );
  });
});

StudentHistory.displayName = 'StudentHistory';

export default StudentHistory;
