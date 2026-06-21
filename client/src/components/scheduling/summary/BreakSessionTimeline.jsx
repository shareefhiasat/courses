import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Card, CardBody } from '@ui';

const BREAK_ICONS = { TeaBreak: '☕', PrayerBreak: '🕌', LunchBreak: '🍽️', Other: '⏸️' };

export default function BreakSessionTimeline({ breaks = [] }) {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <Card>
      <CardBody>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '1rem' }}>
          {t('today_break_sessions') || "Today's Break Sessions"}
        </h3>
        {breaks.length === 0 ? (
          <p style={{ color: muted, fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
            {t('no_break_sessions') || 'No break sessions today'}
          </p>
        ) : (
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {breaks.map((b) => (
              <div
                key={b.id}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${border}` }}
              >
                <span style={{ fontSize: '0.875rem' }}>
                  {BREAK_ICONS[b.breakType] || '⏸️'}{' '}
                  {t(`break_type_${b.breakType}`) || b.breakType}
                </span>
                <span style={{ fontSize: '0.875rem', color: muted }}>
                  {b.timeSlot?.startTime} – {b.timeSlot?.endTime}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
