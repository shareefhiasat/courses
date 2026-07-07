import React, { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import ClassCell from './ClassCell';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const DAY_LABELS_EN = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday' };
const DAY_LABELS_AR = { Sun: 'الأحد', Mon: 'الإثنين', Tue: 'الثلاثاء', Wed: 'الأربعاء', Thu: 'الخميس' };

const SemesterScheduleGrid = ({ sessions, statusMap, onCellClick }) => {
  const { lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Group sessions by day and time slot
  const grid = useMemo(() => {
    const map = {}; // { day: { timeKey: session } }
    const timeSlots = new Map(); // timeKey -> { start, end, label }

    for (const session of sessions) {
      const start = new Date(session.startDateTime);
      const dayName = DAYS[start.getDay()];
      if (!dayName) continue;

      const timeKey = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
      const end = new Date(session.endDateTime);
      const endKey = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
      const label = `${timeKey} - ${endKey}`;

      if (!map[dayName]) map[dayName] = {};
      map[dayName][timeKey] = session;

      if (!timeSlots.has(timeKey)) {
        timeSlots.set(timeKey, { start: timeKey, end: endKey, label });
      }
    }

    const sortedSlots = [...timeSlots.values()].sort((a, b) => a.start.localeCompare(b.start));
    return { map, slots: sortedSlots };
  }, [sessions]);

  const dayLabels = lang === 'ar' ? DAY_LABELS_AR : DAY_LABELS_EN;

  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const rowBorderColor = isDark ? '#1e293b' : '#f1f5f9';
  const headerBg = isDark ? '#1e293b' : '#f8fafc';
  const headerColor = isDark ? '#94a3b8' : '#64748b';
  const containerBg = isDark ? '#0f172a' : '#ffffff';
  const emptyColor = isDark ? '#64748b' : '#94a3b8';
  const timeColor = isDark ? '#94a3b8' : '#64748b';

  const headerStyle = {
    padding: '12px 8px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: headerColor,
    borderBottom: '1px solid ' + borderColor,
    position: 'sticky',
    top: 0,
    background: headerBg,
    zIndex: 1,
  };

  const timeCellStyle = {
    padding: '8px',
    fontSize: '11px',
    color: timeColor,
    whiteSpace: 'nowrap',
    borderBottom: '1px solid ' + rowBorderColor,
  };

  const bodyCellStyle = {
    padding: '6px',
    borderBottom: '1px solid ' + rowBorderColor,
    verticalAlign: 'top',
  };

  return (
    <div
      style={{
        overflow: 'auto',
        borderRadius: '12px',
        border: '1px solid ' + borderColor,
        background: containerBg,
        dir: lang === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
        <thead>
          <tr>
            <th style={headerStyle}>
              {lang === 'ar' ? 'الوقت' : 'Time'}
            </th>
            {DAYS.map((day) => (
              <th key={day} style={headerStyle}>
                {dayLabels[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.slots.length === 0 && (
            <tr>
              <td
                colSpan={DAYS.length + 1}
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: emptyColor,
                }}
              >
                {lang === 'ar' ? 'لا توجد جلسات مجدولة' : 'No scheduled sessions found'}
              </td>
            </tr>
          )}
          {grid.slots.map((slot) => (
            <tr key={slot.start}>
              <td style={timeCellStyle}>
                {slot.label}
              </td>
              {DAYS.map((day) => {
                const session = grid.map[day] && grid.map[day][slot.start];
                const classId = session && session.class ? session.class.id : null;
                const status = classId ? statusMap[classId] : null;
                return (
                  <td key={day} style={bodyCellStyle}>
                    <ClassCell
                      session={session}
                      status={status}
                      onClick={() => session && onCellClick(session)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SemesterScheduleGrid;
