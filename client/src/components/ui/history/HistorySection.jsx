import React from 'react';
import { HistoryEntry } from './HistoryEntry';
import { getAttendanceIcon, getAttendanceColor } from '@constants/attendanceTypes';
import { getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes';
import { getParticipationIcon, getParticipationColor } from '@constants/participationTypes';
import { getPenaltyIcon, getPenaltyColor } from '@constants/penaltyTypes';
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
  // Handle the mismatch between type ('penalty') and filter key ('penalties')
  const filterKey = type === 'penalty' ? 'penalties' : type;
  const isActive = activeFilters[filterKey];
  
  console.log('🔧 HistorySection:', {
    title,
    type,
    filterKey,
    isActive,
    logsLength: logs.length,
    logs: logs.slice(0, 2), // Show first 2 logs for debugging
    activeFilters: activeFilters
  });
  
  if (!isActive || logs.length === 0) {
    console.log('🔧 HistorySection - skipping due to inactive filter or empty logs:', {
      title,
      type,
      filterKey,
      isActive,
      logsLength: logs.length,
      activeFilterValue: activeFilters[filterKey]
    });
    return null;
  }

  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => {
    const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
    const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
    return timeB - timeA; // Newest first
  });
  
  console.log('🔍 HistorySection sorting:', { 
    title, 
    type,
    originalLogsCount: logs.length,
    sortedLogsCount: sortedLogs.length,
    firstLog: sortedLogs[0],
    lastLog: sortedLogs[sortedLogs.length - 1]
  });

  // Get appropriate icon for each log based on type
  const getLogIcon = (log) => {
    if (type === 'attendance') {
      // Clean: use only the status field
      const status = log.status;
      
      const iconName = getAttendanceIcon(status);
      
      const iconMap = {
        CheckCircle: <CheckSmallIcon style={{ width: '12px', height: '12px' }} />,
        Clock: <ClockSmallIcon style={{ width: '12px', height: '12px' }} />,
        AlertCircle: <XSmallIcon style={{ width: '12px', height: '12px' }} />,
        XCircle: <XSmallIcon style={{ width: '12px', height: '12px' }} />,
        Heart: <HeartIcon style={{ width: '12px', height: '12px' }} />,
        HelpCircle: <HelpCircleIcon style={{ width: '12px', height: '12px' }} />
      };
      
      return iconMap[iconName] || iconMap.HelpCircle;
    }
    
    if (type === 'behavior') {
      console.log('🔍 HistorySection returning behavior icon');
      return <ZapIcon style={{ width: '14px', height: '14px', color: getBehaviorColor(log.type) }} />;
    }
    
    if (type === 'participation') {
      console.log('🔍 HistorySection returning participation icon');
      return <ParticipationIcon style={{ width: '14px', height: '14px', color: getParticipationColor(log.type) }} />;
    }
    
    if (type === 'penalty') {
      console.log('🔍 HistorySection returning penalty icon');
      return <PenaltyIcon style={{ width: '14px', height: '14px', color: getPenaltyColor(log.type) }} />;
    }
    
    console.log('🔍 HistorySection returning fallback icon');
    return icon;
  };

  console.log('🔧 HistorySection - rendering section:', title);

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      {sortedLogs.map((log, idx) => (
        <HistoryEntry
          key={idx}
          log={log}
          type={type}
          icon={getLogIcon(log)}
          iconColor={type === 'attendance' ? getAttendanceColor(log.status) : iconColor}
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
