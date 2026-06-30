import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Card, CardBody } from '@ui';

export default function HolidayImpactCard({ impact = {} }) {
  const { t } = useLang();
  const { theme } = useTheme();
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <Card>
      <CardBody>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 500, marginBottom: '1rem' }}>
          {t('holiday_impact') || 'Holiday Impact'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: muted }}>{t('holidays_in_range') || 'Holidays in range'}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{impact.holidayCount ?? 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: muted }}>{t('sessions_affected') || 'Sessions affected'}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f59e0b' }}>{impact.affectedSessions ?? 0}</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
