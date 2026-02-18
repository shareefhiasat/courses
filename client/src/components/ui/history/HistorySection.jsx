import React, { useCallback, useMemo } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { HistoryEntry } from './HistoryEntry';
import { getAttendanceIcon, getAttendanceColor, ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes';
import { getParticipationIcon, getParticipationColor } from '@constants/participationTypes';
import { getPenaltyIcon, getPenaltyColor } from '@constants/penaltyTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import {
  CheckSmallIcon,
  ClockSmallIcon,
  XSmallIcon,
  HeartIcon,
  HelpCircleIcon,
  ParticipationIcon,
  ZapIcon,
  PenaltyIcon
} from '@utils/icons.jsx';

export const HistorySection = ({ 
  title, 
  logs, 
  type, 
  icon, 
  iconColor, 
  activeFilters, 
  onDelete, 
  t, 
  isRTL,
  borderColor = '#f1f5f9'
}) => {
  const isMobile = useIsMobile();
  // Handle the mismatch between type ('penalty') and filter key ('penalties')
  const filterKey = type === RECORD_TYPES.PENALTY ? 'penalties' : type;
  const isActive = activeFilters[filterKey];
  
  logger.log('🔧 HistorySection:', {
    title,
    type,
    filterKey,
    isActive,
    logsLength: logs.length,
    logs: logs.slice(0, 2), // Show first 2 logs for debugging
    activeFilters: activeFilters
  });
  
  if (!isActive || logs.length === 0) {
    logger.log('🔧 HistorySection - skipping due to inactive filter or empty logs:', {
      title,
      type,
      filterKey,
      isActive,
      logsLength: logs.length,
      activeFilterValue: activeFilters[filterKey]
    });
    return null;
  }

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
      const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
      return timeB - timeA;
    });
  }, [logs]);
  
  logger.log('🔍 HistorySection sorting:', { 
    title, 
    type,
    originalLogsCount: logs.length,
    sortedLogsCount: sortedLogs.length,
    firstLog: sortedLogs[0],
    lastLog: sortedLogs[sortedLogs.length - 1]
  });

  const getLogIcon = useCallback((log) => {
    if (type === RECORD_TYPES.ATTENDANCE) {
      // Attendance status is now flattened to top level (no more data nesting)
      const status = log.status;
      
      const iconName = getAttendanceIcon(status);
      const statusColor = getAttendanceColor(status);
      
      const iconMap = {
        CheckCircle: <CheckSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        Clock: <ClockSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        AlertCircle: <XSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        XCircle: <XSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        Heart: <HeartIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        HelpCircle: <HelpCircleIcon style={{ width: '12px', height: '12px', color: statusColor }} />
      };
      
      return iconMap[iconName] || iconMap.HelpCircle;
    }
    
    if (type === RECORD_TYPES.BEHAVIOR) {
      logger.log('🔍 HistorySection returning behavior icon');
      return <ZapIcon style={{ width: '14px', height: '14px', color: getBehaviorColor(log.type) }} />;
    }
    
    if (type === RECORD_TYPES.PARTICIPATION) {
      logger.log('🔍 HistorySection returning participation icon');
      return <ParticipationIcon style={{ width: '14px', height: '14px', color: getParticipationColor(log.type) }} />;
    }
    
    if (type === RECORD_TYPES.PENALTY) {
      logger.log('🔍 HistorySection returning penalty icon');
      return <PenaltyIcon style={{ width: '14px', height: '14px', color: getPenaltyColor(log.type) }} />;
    }
    
    logger.log('🔍 HistorySection returning fallback icon');
    return icon;
  }, [type, icon]);

  logger.log('🔧 HistorySection - rendering section:', title);

  return (
    <div style={{ marginBottom: isMobile ? '0.25rem' : '0.5rem' }}>
      {sortedLogs.map((log, idx) => (
        <HistoryEntry
          key={idx}
          log={log}
          type={type}
          icon={getLogIcon(log)}
          iconColor={type === RECORD_TYPES.ATTENDANCE ? getAttendanceColor(log.status) : iconColor}
          onDelete={onDelete}
          t={t}
          isRTL={isRTL}
          borderColor={idx === sortedLogs.length - 1 ? 'none' : borderColor}
        />
      ))}
    </div>
  );
};

export default HistorySection;

