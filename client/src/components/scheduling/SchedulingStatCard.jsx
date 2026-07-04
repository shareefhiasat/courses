import React from 'react';

export default function SchedulingStatCard({ value, label, Icon, iconColor, iconBg, theme }) {
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
      borderRadius: '0.375rem',
      padding: '0.75rem',
      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '0.375rem',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        <div style={{
          backgroundColor: iconBg,
          borderRadius: '0.375rem',
          padding: '0.375rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color={iconColor} />
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: muted,
        lineHeight: 1.2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {label}
      </div>
    </div>
  );
}
