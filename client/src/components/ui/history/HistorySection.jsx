import React from 'react';
import { HistoryEntry } from './HistoryEntry';

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
  
  console.log(`HistorySection - ${title}:`, { type, filterKey, logs, activeFilter: isActive }); // Debug
  
  if (!isActive || logs.length === 0) {
    console.log(`HistorySection - ${title} returning null:`, { 
      filterActive: isActive, 
      logsLength: logs.length,
      type,
      filterKey
    }); // Debug
    return null;
  }

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      {logs.map((log, idx) => (
        <HistoryEntry
          key={idx}
          log={log}
          type={type}
          icon={icon}
          iconColor={iconColor}
          onDelete={onDelete}
          t={t}
          isRTL={isRTL}
          borderColor={idx === logs.length - 1 ? 'none' : borderColor}
        />
      ))}
    </div>
  );
};

export default HistorySection;
