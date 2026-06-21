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
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: 0,
    }}>
      <div style={{
        backgroundColor: iconBg,
        borderRadius: '0.375rem',
        padding: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
        <div style={{
          fontSize: '0.7rem',
          color: muted,
          marginTop: '0.125rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
