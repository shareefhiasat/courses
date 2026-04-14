import React, { useCallback, useMemo } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { HistoryEntry } from './HistoryEntry';
import { getAttendanceIcon, getAttendanceColor, ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
// OLD: import { getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes';
// OLD: import { getParticipationIcon, getParticipationColor } from '@constants/participationTypes';
// OLD: import { getPenaltyIcon, getPenaltyColor } from '@constants/penaltyTypes';
// NOW: Using useLookupTypes hook for all lookup data
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
  borderColor = '#f1f5f9',
  showDeleteButton = true,
  theme = 'light'
}) => {
  const isMobile = useIsMobile();
  const { data: lookupData } = useLookupTypes({
    types: ['behavior-types', 'participation-types', 'penalty-types']
  });
  // Handle the mismatch between type ('penalty') and filter key ('penalties')
  const filterKey = type === RECORD_TYPES.PENALTY ? 'penalties' : type;
  const isActive = activeFilters[filterKey];
  
  info('🔧 HistorySection:', {
    title,
    type,
    filterKey,
    isActive,
    logsLength: logs.length,
    logs: logs.slice(0, 2), // Show first 2 logs for debugging
    activeFilters: activeFilters
  });
  
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
      const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
      return timeB - timeA;
    });
  }, [logs]);
  
  info('🔍 HistorySection sorting:', { 
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
      
      const statusValue = status?.code || status;
      const iconName = getAttendanceIcon(statusValue);
      const statusColor = getAttendanceColor(statusValue);
      console.log('🔍 HistorySection - Icon Mapping:', { status, statusValue, iconName, statusColor, colorSource: statusValue === status ? 'direct' : 'code' });
      
      const iconMap = {
        CheckCircle: <CheckSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        Clock: <ClockSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        AlertCircle: <XSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        XCircle: <XSmallIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        Heart: <HeartIcon style={{ width: '12px', height: '12px', color: statusColor }} />,
        HelpCircle: <HelpCircleIcon style={{ width: '12px', height: '12px', color: statusColor }} />
      };
      
      const selectedIcon = iconMap[iconName] || iconMap.HelpCircle;
      console.log('🔍 HistorySection - Selected Icon:', { iconName, hasIcon: !!iconMap[iconName], fallback: !iconMap[iconName] });
      return selectedIcon;
    }
    
    if (type === RECORD_TYPES.BEHAVIOR) {
      info('🔍 HistorySection returning behavior icon');
      const behaviorType = (lookupData['behavior-types'] || []).find(bt => bt.id === log.type);
      const color = behaviorType?.color || '#f59e0b';
      return <ZapIcon style={{ width: '14px', height: '14px', color }} />;
    }
    
    if (type === RECORD_TYPES.PARTICIPATION) {
      info('🔍 HistorySection returning participation icon');
      const participationType = (lookupData['participation-types'] || []).find(pt => pt.id === log.type);
      const color = participationType?.color || '#10b981';
      return <ParticipationIcon style={{ width: '14px', height: '14px', color }} />;
    }
    
    if (type === RECORD_TYPES.PENALTY) {
      info('🔍 HistorySection returning penalty icon');
      const penaltyType = (lookupData['penalty-types'] || []).find(pt => pt.id === log.type);
      const color = penaltyType?.color || '#ef4444';
      return <PenaltyIcon style={{ width: '14px', height: '14px', color }} />;
    }
    
    info('🔍 HistorySection returning fallback icon');
    return icon;
  }, [type, icon, lookupData]);

  if (!isActive || logs.length === 0) return null;

  info('🔧 HistorySection - rendering section:', title);

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
          showDeleteButton={showDeleteButton}
          theme={theme}
        />
      ))}
    </div>
  );
};

export default HistorySection;

