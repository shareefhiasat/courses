import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Card, CardBody } from '@ui';

const HOLIDAY_ICONS = {
  Public: '🏛️', National: '🇶🇦', SemesterBreak: '📚', Summer: '☀️', Winter: '❄️', Other: '📅',
  PublicHoliday: '🏛️', NationalDay: '🇶🇦', SummerVacation: '☀️', WinterBreak: '❄️',
};

export default function UpcomingHolidaysList({ holidays = [] }) {
  const { t, isRTL } = useLang();
  const { theme } = useTheme();
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';

  return (
    <Card>
      <CardBody>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '1rem' }}>
          {t('upcoming_holidays') || 'Upcoming Holidays'}
        </h3>
        {holidays.length === 0 ? (
          <p style={{ color: muted, fontSize: '0.875rem', textAlign: 'center' }}>
            {t('no_upcoming_holidays') || 'No upcoming holidays'}
          </p>
        ) : (
          holidays.map((h) => (
            <div key={h.id} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${border}`, fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span>{HOLIDAY_ICONS[h.type] || '📅'}</span>
                <span style={{ fontWeight: 500 }}>{isRTL ? h.descriptionAr || h.descriptionEn : h.descriptionEn}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: muted, marginTop: '0.25rem' }}>
                {new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}
                {' · '}{t(`holiday_type_${h.type}`) || h.type}
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
