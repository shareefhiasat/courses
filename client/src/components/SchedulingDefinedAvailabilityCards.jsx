import React from 'react';
import { User, DoorOpen, Clock, CalendarRange } from 'lucide-react';
import { formatAvailabilityDateRange } from '../utils/schedulingAvailabilityUtils.js';
import { getClassroomDetailRows } from '../utils/schedulingDisplayUtils.js';

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_KEYS = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };

function groupRecordsByPeriod(records, lang) {
  const byPeriod = new Map();
  for (const record of records) {
    const periodKey = `${record.startDate || ''}|${record.endDate || ''}`;
    if (!byPeriod.has(periodKey)) {
      byPeriod.set(periodKey, {
        startDate: record.startDate,
        endDate: record.endDate,
        periodLabel: formatAvailabilityDateRange(record.startDate, record.endDate, lang),
        daySlots: {}
      });
    }
    const entry = byPeriod.get(periodKey);
    for (const day of record.dayOfWeek || []) {
      if (!entry.daySlots[day]) entry.daySlots[day] = new Set();
      for (const slot of record.slots || []) {
        entry.daySlots[day].add(`${slot.startTime}–${slot.endTime}`);
      }
    }
  }
  return [...byPeriod.values()];
}

function AvailabilityScheduleTable({ periodGroup, theme, t }) {
  const borderColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
  const headerBg = theme === 'dark' ? '#374151' : '#f3f4f6';
  const cellBg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const activeDays = DAY_ORDER.filter((d) => periodGroup.daySlots[d]);

  if (!activeDays.length) return null;

  return (
    <div style={{ marginTop: '0.625rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        marginBottom: '0.5rem',
        fontSize: 'var(--font-size-sm)',
        color: muted
      }}>
        <CalendarRange size={13} />
        <span style={{ fontWeight: 500 }}>{t('availability_period')}:</span>
        <span>{periodGroup.periodLabel}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--font-size-sm)',
          minWidth: '320px'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '0.5rem 0.75rem',
                textAlign: 'start',
                backgroundColor: headerBg,
                border: `1px solid ${borderColor}`,
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                {t('day')}
              </th>
              <th style={{
                padding: '0.5rem 0.75rem',
                textAlign: 'start',
                backgroundColor: headerBg,
                border: `1px solid ${borderColor}`,
                fontWeight: 600
              }}>
                {t('schedule_hours')}
              </th>
            </tr>
          </thead>
          <tbody>
            {activeDays.map((day) => {
              const slots = [...periodGroup.daySlots[day]].sort();
              return (
                <tr key={day}>
                  <td style={{
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${borderColor}`,
                    backgroundColor: cellBg,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top'
                  }}>
                    {t(DAY_KEYS[day] || day.toLowerCase()) || day}
                  </td>
                  <td style={{
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${borderColor}`,
                    backgroundColor: cellBg,
                    verticalAlign: 'top'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {slots.map((slot) => (
                        <span
                          key={slot}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5',
                            color: '#10b981',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Clock size={11} />
                          {slot}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClassroomDetailsGrid({ classroom, lang, t, theme }) {
  const rows = getClassroomDetailRows(classroom, lang, t);
  if (!rows.length) return null;
  const labelColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const valueColor = theme === 'dark' ? '#f3f4f6' : '#1f2937';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '0.375rem 0.75rem',
      marginTop: '0.5rem',
      padding: '0.5rem 0.625rem',
      borderRadius: '0.375rem',
      backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
      fontSize: 'var(--font-size-sm)'
    }}>
      {rows.map((row) => (
        <div key={row.label}>
          <span style={{ color: labelColor, fontWeight: 700 }}>{row.label}: </span>
          <span style={{ fontWeight: 500, color: valueColor }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function SchedulingDefinedAvailabilityCards({
  groups,
  type,
  theme,
  t,
  lang,
  emptyMessage
}) {
  if (!groups.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {groups.map(({ id, name, records, classroom }) => {
        const periodGroups = groupRecordsByPeriod(records, lang);
        const Icon = type === 'instructor' ? User : DoorOpen;

        return (
          <div
            key={id}
            style={{
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              borderRadius: '0.5rem',
              padding: '0.875rem',
              backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon size={16} color={type === 'instructor' ? '#3b82f6' : '#10b981'} />
              {name}
            </div>

            {type === 'room' && classroom && (
              <ClassroomDetailsGrid classroom={classroom} lang={lang} t={t} theme={theme} />
            )}

            {periodGroups.map((periodGroup, idx) => (
              <AvailabilityScheduleTable
                key={`${id}-period-${idx}`}
                periodGroup={periodGroup}
                theme={theme}
                t={t}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
