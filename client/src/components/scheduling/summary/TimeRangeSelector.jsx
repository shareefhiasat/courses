import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Button, Input } from '@ui';

const RANGES = [
  { value: 'today', labelKey: 'time_range_today' },
  { value: 'week', labelKey: 'time_range_week' },
  { value: 'month', labelKey: 'time_range_month' },
  { value: 'year', labelKey: 'time_range_year' },
  { value: 'custom', labelKey: 'time_range_custom' },
];

export default function TimeRangeSelector({ timeRange, startDate, endDate, onChange, onApply }) {
  const { t } = useLang();
  const { theme } = useTheme();
  const border = theme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <div
      data-testid="time-range-selector"
      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}
    >
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange({ timeRange: r.value })}
          data-testid={`time-range-${r.value}`}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '6px',
            border: `1px solid ${border}`,
            background: timeRange === r.value ? '#3b82f6' : 'transparent',
            color: timeRange === r.value ? '#fff' : 'inherit',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {t(r.labelKey) || r.value}
        </button>
      ))}
      {timeRange === 'custom' && (
        <>
          <Input type="date" value={startDate || ''} onChange={(e) => onChange({ startDate: e.target.value })} />
          <Input type="date" value={endDate || ''} onChange={(e) => onChange({ endDate: e.target.value })} />
        </>
      )}
      <Button variant="primary" size="sm" onClick={onApply} data-testid="apply-time-range">
        {t('apply_filter') || 'Apply'}
      </Button>
    </div>
  );
}
