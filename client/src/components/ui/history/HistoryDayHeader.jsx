import React from 'react';
import { formatLocalizedDate } from '@utils/date';
import { useIsMobile } from '@hooks/useIsMobile';

export const HistoryDayHeader = ({ 
  dateStr, 
  filteredCounts, 
  isDayExpanded, 
  onToggle, 
  t, 
  isRTL 
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.75rem',
        background: 'var(--background-secondary, #f9fafb)',
        cursor: 'pointer',
        borderBottom: isDayExpanded ? '1px solid #e5e7eb' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
          {dateStr}
        </span>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '0.2rem' : '0.375rem', 
          alignItems: 'center',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          overflowX: isMobile ? 'auto' : 'visible'
        }}>
          {filteredCounts.attendance > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: isMobile ? '0.2rem 0.3rem' : '0.25rem 0.5rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: '#166534',
              minWidth: isMobile ? 'auto' : undefined,
              flexShrink: 0
            }}>
              {filteredCounts.attendance}
            </div>
          )}
          {filteredCounts.participation > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: isMobile ? '0.2rem 0.3rem' : '0.25rem 0.5rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: '#1e40af',
              minWidth: isMobile ? 'auto' : undefined,
              flexShrink: 0
            }}>
              {filteredCounts.participation}
            </div>
          )}
          {filteredCounts.behavior > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: isMobile ? '0.2rem 0.3rem' : '0.25rem 0.5rem',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: '#c2410c',
              minWidth: isMobile ? 'auto' : undefined,
              flexShrink: 0
            }}>
              {filteredCounts.behavior}
            </div>
          )}
          {filteredCounts.penalties > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: isMobile ? '0.2rem 0.3rem' : '0.25rem 0.5rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: '#b91c1c',
              minWidth: isMobile ? 'auto' : undefined,
              flexShrink: 0
            }}>
              {filteredCounts.penalties}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg 
          style={{ 
            width: '16px', 
            height: '16px',
            transform: isDayExpanded 
              ? (isRTL ? 'rotate(180deg)' : 'rotate(0deg)') 
              : (isRTL ? 'rotate(90deg)' : 'rotate(-90deg)'),
            transition: 'transform 0.2s'
          }} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  );
};

export default HistoryDayHeader;
