import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Card, CardBody } from '@ui';

const COLORS = { TeaBreak: '#f59e0b', PrayerBreak: '#8b5cf6', LunchBreak: '#10b981', Other: '#6b7280' };

export default function BreakTypeDistributionCard({ distribution = [] }) {
  const { t } = useLang();
  const { theme } = useTheme();
  const total = distribution.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <Card>
      <CardBody>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '1rem' }}>
          {t('break_type_distribution') || 'Break Type Distribution'}
        </h3>
        {distribution.length === 0 ? (
          <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
            {t('no_data') || 'No data'}
          </p>
        ) : (
          distribution.map((d) => (
            <div key={d.breakType} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span>{t(`break_type_${d.breakType}`) || d.breakType}</span>
                <span>{d.count} ({Math.round((d.count / total) * 100)}%)</span>
              </div>
              <div style={{ height: '6px', background: theme === 'dark' ? '#374151' : '#e5e7eb', borderRadius: '3px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(d.count / total) * 100}%`,
                    background: COLORS[d.breakType] || '#6b7280',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
