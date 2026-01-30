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
  if (!activeFilters[type] || logs.length === 0) {
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
