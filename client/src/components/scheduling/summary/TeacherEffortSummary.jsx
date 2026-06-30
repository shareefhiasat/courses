import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Card, CardBody } from '@ui';

export default function TeacherEffortSummary({ effort }) {
  const { t } = useLang();
  const { theme } = useTheme();
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';

  if (!effort?.summary) return null;

  const cards = [
    { label: t('total_sessions') || 'Sessions', value: effort.summary.totalSessions, color: '#3b82f6' },
    { label: t('teaching_hours') || 'Teaching Hours', value: effort.summary.teachingHours, color: '#10b981' },
    { label: t('total_breaks') || 'Breaks', value: effort.summary.totalBreaks, color: '#f59e0b' },
    { label: t('holiday_sessions_missed') || 'Holiday Impact', value: effort.summary.sessionsMissedDueToHolidays, color: '#ef4444' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
      {cards.map((c) => (
        <Card key={c.label}>
          <CardBody>
            <div style={{ fontSize: 'var(--font-size-xs)', color: muted }}>{c.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: c.color }}>{c.value}</div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
