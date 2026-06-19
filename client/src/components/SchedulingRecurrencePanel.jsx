import React, { useMemo } from 'react';
import { Input, Select } from '@ui';
import { estimateRecurringSessionCount } from '../utils/schedulingDisplayUtils.js';

const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_I18N = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };

export default function SchedulingRecurrencePanel({
  isRecurring,
  onRecurringChange,
  recurrenceType,
  onRecurrenceTypeChange,
  recurrenceDays,
  onRecurrenceDaysChange,
  recurrenceEndMode,
  onRecurrenceEndModeChange,
  recurrenceEndDate,
  onRecurrenceEndDateChange,
  recurrenceCount,
  onRecurrenceCountChange,
  timesPerDay,
  onTimesPerDayChange,
  modalStartDateTime,
  modalEndDateTime,
  theme,
  t
}) {
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const panelBg = theme === 'dark' ? '#111827' : '#f9fafb';

  const estimatedCount = useMemo(() => {
    if (!isRecurring || !modalStartDateTime) return 0;
    return estimateRecurringSessionCount(
      { startDateTime: modalStartDateTime, endDateTime: modalEndDateTime },
      {
        recurrenceType,
        recurrenceDays: recurrenceType === 'daily' ? DAY_CODES : recurrenceDays,
        recurrenceEndDate,
        recurrenceCount,
        timesPerDay
      }
    );
  }, [
    isRecurring,
    modalStartDateTime,
    modalEndDateTime,
    recurrenceType,
    recurrenceDays,
    recurrenceEndDate,
    recurrenceCount,
    timesPerDay
  ]);

  const durationMins = useMemo(() => {
    if (!modalStartDateTime || !modalEndDateTime) return 0;
    return Math.round((new Date(modalEndDateTime) - new Date(modalStartDateTime)) / 60000);
  }, [modalStartDateTime, modalEndDateTime]);

  const handleRecurringToggle = (checked) => {
    onRecurringChange(checked);
    if (checked && !recurrenceDays.length && modalStartDateTime) {
      onRecurrenceDaysChange([DAY_CODES[new Date(modalStartDateTime).getDay()]]);
    }
    if (checked && !recurrenceEndMode) {
      onRecurrenceEndModeChange('date');
    }
  };

  return (
    <div style={{
      marginBottom: '1rem',
      padding: '1rem',
      border: `1px solid ${borderColor}`,
      borderRadius: '0.375rem',
      background: isRecurring ? panelBg : 'transparent'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: isRecurring ? '1rem' : 0 }}>
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => handleRecurringToggle(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor="isRecurring" style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
          {t('create_recurring_sessions')}
        </label>
      </div>

      {isRecurring && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: muted, lineHeight: 1.45 }}>
            {t('recurrence_time_explanation')}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1fr) minmax(240px, 2fr)', gap: '1rem', alignItems: 'start' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                {t('recurrence_type')}
              </label>
              <Select
                value={recurrenceType}
                onChange={(e) => {
                  const next = e.target.value;
                  onRecurrenceTypeChange(next);
                  if (next === 'daily') {
                    onRecurrenceDaysChange(DAY_CODES);
                  } else if (!recurrenceDays.length && modalStartDateTime) {
                    onRecurrenceDaysChange([DAY_CODES[new Date(modalStartDateTime).getDay()]]);
                  }
                }}
                options={[
                  { value: 'daily', label: t('daily') },
                  { value: 'weekly', label: t('weekly') },
                  { value: 'custom', label: t('custom') }
                ]}
              />
            </div>

            {recurrenceType !== 'daily' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                  {t('select_days')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {DAY_CODES.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        onRecurrenceDaysChange(
                          recurrenceDays.includes(day)
                            ? recurrenceDays.filter((d) => d !== day)
                            : [...recurrenceDays, day]
                        );
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: `1px solid ${borderColor}`,
                        backgroundColor: recurrenceDays.includes(day) ? '#3b82f6' : theme === 'dark' ? '#374151' : '#f9fafb',
                        color: recurrenceDays.includes(day) ? '#ffffff' : 'inherit',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      {t(DAY_I18N[day]) || day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              {t('series_end_condition')}
            </label>
            <div style={{
              display: 'inline-flex',
              gap: '0.25rem',
              padding: '0.25rem',
              borderRadius: '0.375rem',
              border: `1px solid ${borderColor}`,
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              marginBottom: '0.75rem'
            }}>
              {[
                { mode: 'date', label: t('series_end_by_date') },
                { mode: 'count', label: t('series_end_by_count') }
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onRecurrenceEndModeChange(mode);
                    if (mode === 'date') onRecurrenceCountChange(null);
                    else onRecurrenceEndDateChange(null);
                  }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    backgroundColor: recurrenceEndMode === mode ? '#3b82f6' : 'transparent',
                    color: recurrenceEndMode === mode ? '#ffffff' : 'inherit',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: recurrenceEndMode === mode ? 600 : 400,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {recurrenceEndMode === 'date' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem', color: muted }}>
                  {t('series_end_date')}
                </label>
                <Input
                  type="date"
                  value={recurrenceEndDate ? recurrenceEndDate.toISOString().slice(0, 10) : ''}
                  onChange={(e) => onRecurrenceEndDateChange(e.target.value ? new Date(e.target.value) : null)}
                  style={{ maxWidth: '280px' }}
                />
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: muted }}>
                  {t('series_end_date_hint')}
                </p>
              </div>
            )}

            {recurrenceEndMode === 'count' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem', color: muted }}>
                  {t('series_occurrence_count')}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={recurrenceCount || ''}
                  onChange={(e) => onRecurrenceCountChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder={t('number_of_sessions')}
                  style={{ maxWidth: '200px' }}
                />
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: muted }}>
                  {t('series_occurrence_count_hint')}
                </p>
              </div>
            )}
          </div>

          {estimatedCount > 0 && (
            <div style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.375rem',
              background: theme === 'dark' ? '#1e3a5f' : '#eff6ff',
              border: `1px solid ${theme === 'dark' ? '#2563eb' : '#bfdbfe'}`,
              fontSize: '0.8125rem',
              color: theme === 'dark' ? '#dbeafe' : '#1e40af'
            }}>
              {t('recurrence_preview', { count: estimatedCount, minutes: durationMins })}
            </div>
          )}

          {recurrenceType !== 'daily' && recurrenceDays.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                {t('custom_times_per_day')}
              </label>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: muted }}>
                {t('custom_times_per_day_hint')}
              </p>
              {recurrenceDays.map((day) => (
                <div key={day} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', minWidth: '3rem' }}>{t(DAY_I18N[day]) || day}</span>
                  <Input
                    type="time"
                    value={timesPerDay.find((row) => row.day === day)?.startTime || ''}
                    onChange={(e) => {
                      onTimesPerDayChange((prev) => {
                        const filtered = prev.filter((row) => row.day !== day);
                        if (e.target.value) {
                          return [...filtered, {
                            day,
                            startTime: e.target.value,
                            endTime: prev.find((row) => row.day === day)?.endTime || ''
                          }];
                        }
                        return filtered;
                      });
                    }}
                  />
                  <Input
                    type="time"
                    value={timesPerDay.find((row) => row.day === day)?.endTime || ''}
                    onChange={(e) => {
                      onTimesPerDayChange((prev) => {
                        const filtered = prev.filter((row) => row.day !== day);
                        const startTime = prev.find((row) => row.day === day)?.startTime || '';
                        if (e.target.value && startTime) {
                          return [...filtered, { day, startTime, endTime: e.target.value }];
                        }
                        return filtered;
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
