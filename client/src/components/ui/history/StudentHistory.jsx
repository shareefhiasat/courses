import React from 'react';
import { HistoryDayHeader } from './HistoryDayHeader';
import { HistorySection } from './HistorySection';
import { HistoryEntry } from './HistoryEntry';
import { AttendanceIcon, ParticipationIcon, ZapIcon, PenaltyIcon, CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, HelpCircleIcon } from '@utils/icons.jsx';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getAttendanceIcon, getAttendanceColor } from '@constants/attendanceTypes';
import { formatLocalizedDate } from '@utils/date';
import logger from '@utils/logger';

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
  studentId,
  lang = 'en',
  studentName
}) => {
  logger.log('🔧 StudentHistory rendering with groupedLogs:', groupedLogs);
  logger.log('🔧 StudentHistory expandedDays:', expandedDays);
  logger.log('🔧 StudentHistory activeFilters:', activeFilters);
  
  return groupedLogs.map((dayGroup, dayIndex) => {
    logger.log('🔧 StudentHistory - processing dayGroup:', {
      dayIndex,
      date: dayGroup.date,
      dateType: typeof dayGroup.date,
      attendanceCount: dayGroup.attendance?.length || 0,
      participationCount: dayGroup.participation?.length || 0,
      penaltiesCount: dayGroup.penalties?.length || 0,
      behaviorCount: dayGroup.behavior?.length || 0
    });

    // Handle invalid dates - if date is 'unknown' or invalid, show a fallback
    let dateStr;
    if (dayGroup.date === 'unknown') {
      dateStr = lang === 'ar' ? 'تاريخ غير معروف' : 'Unknown Date';
      logger.log('🔧 StudentHistory - unknown date encountered:', dayGroup.date);
      logger.log('🔧 StudentHistory - dayGroup with unknown date:', dayGroup);
    } else {
      try {
        dateStr = formatLocalizedDate(dayGroup.date, t, lang);
        logger.log('🔧 StudentHistory - formatted date:', { 
          original: dayGroup.date, 
          formatted: dateStr,
          lang,
          dayIndex
        });
      } catch (error) {
        dateStr = lang === 'ar' ? 'تاريخ غير صالح' : 'Invalid Date';
        logger.log('🔧 StudentHistory - date formatting error:', { 
          date: dayGroup.date, 
          error: error.message,
          lang,
          dayIndex
        });
      }
    }
    const isDayExpanded = expandedDays.has(dayGroup.date);
    const filteredCounts = {
      attendance: activeFilters.attendance ? dayGroup.attendance.length : 0,
      participation: activeFilters.participation ? dayGroup.participation.length : 0,
      behavior: activeFilters.behavior ? (dayGroup.behavior ? dayGroup.behavior.length : 0) : 0,
      penalties: activeFilters.penalties ? dayGroup.penalties.length : 0
    };
    const hasVisibleItems = filteredCounts.attendance + filteredCounts.participation + filteredCounts.behavior + filteredCounts.penalties > 0;
    
    logger.log('🔧 StudentHistory dayGroup:', {
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
      logger.log('🔧 StudentHistory - skipping day due to no visible items:', dayGroup.date);
      return null;
    }
    
    return (
      <div key={dayIndex} style={{
        border: '1px solid var(--border, #e5e7eb)',
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
                ...dayGroup.attendance.map(log => ({ ...log, logType: RECORD_TYPES.ATTENDANCE })),
                ...dayGroup.participation.map(log => ({ ...log, logType: RECORD_TYPES.PARTICIPATION })),
                ...(dayGroup.behavior || []).map(log => ({ ...log, logType: RECORD_TYPES.BEHAVIOR })),
                ...dayGroup.penalties.map(log => ({ ...log, logType: RECORD_TYPES.PENALTY }))
              ].sort((a, b) => {
                const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
                const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
                return timeB - timeA; // Newest first
              });

              logger.log('🔍 Combined timeline logs:', allLogs.map(log => ({
                time: log.time,
                type: log.logType,
                label: log.label
              })));

              return allLogs.map((log, index) => {
                // Check if this log type should be shown based on activeFilters
                const shouldShow = 
                  (log.logType === RECORD_TYPES.ATTENDANCE && activeFilters.attendance) ||
                  (log.logType === RECORD_TYPES.PARTICIPATION && activeFilters.participation) ||
                  (log.logType === RECORD_TYPES.BEHAVIOR && activeFilters.behavior) ||
                  (log.logType === RECORD_TYPES.PENALTY && activeFilters.penalties);

                if (!shouldShow) {
                  return null;
                }

                // Get the appropriate icon and color based on log type
                let icon, iconColor, borderColor, onDelete;
                
                switch (log.logType) {
                  case RECORD_TYPES.ATTENDANCE:
                    // Use specific attendance icons based on status
                    const status = log.status;
                    const iconName = getAttendanceIcon(status);
                    const statusColor = getAttendanceColor(status);
                    
                    const attendanceIconMap = {
                      CheckCircle: <CheckSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
                      Clock: <ClockSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
                      AlertCircle: <XSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
                      XCircle: <XSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
                      Heart: <HeartIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
                      HelpCircle: <HelpCircleIcon style={{ width: '12px', height: '12px', color: statusColor }} />
                    };
                    
                    icon = attendanceIconMap[iconName] || attendanceIconMap.HelpCircle;
                    iconColor = statusColor;
                    borderColor = "var(--border-light, #f1f5f9)";
                    onDelete = (logId) => handleDeleteAttendance(studentId, logId);
                    break;
                  case RECORD_TYPES.PARTICIPATION:
                    icon = <ParticipationIcon />;
                    iconColor = "var(--color-info, #3b82f6)";
                    borderColor = "var(--border, #e5e7eb)";
                    onDelete = (logId) => handleDeleteParticipation(studentId, logId);
                    break;
                  case RECORD_TYPES.BEHAVIOR:
                    icon = <ZapIcon />;
                    iconColor = "var(--color-warning, #f97316)";
                    borderColor = "var(--color-warning-border, #fed7aa)";
                    onDelete = (logId) => handleDeleteBehavior(studentId, logId);
                    break;
                  case RECORD_TYPES.PENALTY:
                    icon = <PenaltyIcon />;
                    iconColor = "var(--color-danger, #ef4444)";
                    borderColor = "var(--color-danger-border, #fecaca)";
                    onDelete = (logId) => handleDeletePenalty(studentId, logId);
                    break;
                  default:
                    return null;
                }

                logger.log('🔧 StudentHistory - rendering HistoryEntry:', {
      logId: log.id,
      logType: log.logType,
      hasStudentName: !!studentName,
      studentName,
      logStudentName: log.studentName,
      label: log.label
    });

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
        lang={lang}
        studentName={studentName || log.studentName}
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

