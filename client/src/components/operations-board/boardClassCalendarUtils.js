import {
  buildSlotWindowsFromTimeSlots,
  WORK_DAYS,
} from '@services/export/official-reports/engine/buildWeeklyScheduleFromSessions.js';
import {
  SCHEDULE_WORKFLOW_COLORS,
  SCHEDULE_WORKFLOW_STATUS,
  resolveScheduleWorkflowKey,
} from '@constants/workspaceStatusColors.js';

const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SCHEDULE_CALENDAR_LEGEND = [
  { key: SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN, i18nKey: 'workspace_status_not_taken' },
  { key: SCHEDULE_WORKFLOW_STATUS.DRAFT, i18nKey: 'workspace_status_draft' },
  { key: SCHEDULE_WORKFLOW_STATUS.TAKEN, i18nKey: 'workspace_status_taken' },
  { key: SCHEDULE_WORKFLOW_STATUS.SUBMITTED, i18nKey: 'workspace_status_submitted' },
];

export function dateToDayCode(date) {
  return DAY_CODES[date.getDay()];
}

export function toIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toApiDate(iso) {
  return new Date(`${iso}T12:00:00`);
}

export function eachDayInRange(start, end) {
  const days = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  while (cur <= endDate) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function extractWeeklyClassSessions(scheduleDays = []) {
  const sessions = [];
  for (const day of scheduleDays) {
    if (!WORK_DAYS.includes(day.dayCode)) continue;
    const slots = day.slots || {};
    for (const [slotKey, slot] of Object.entries(slots)) {
      if (!slot || slot.isBreak || !slot.classId) continue;
      sessions.push({
        dayCode: day.dayCode,
        slotKey,
        classId: slot.classId,
        subjectName: slot.subjectName || '—',
        sessionType: slot.sessionType || 'lecture',
        instructor: slot.instructor || '',
        room: slot.room || '',
        classData: slot.class || null,
      });
    }
  }
  return sessions;
}

function minutesOnDate(baseDate, totalMinutes) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(totalMinutes);
  return d;
}

export function buildClassCalendarEvents({
  weeklySessions = [],
  slotWindows = [],
  rangeStart,
  rangeEnd,
  statusByDate = {},
}) {
  if (!rangeStart || !rangeEnd || !weeklySessions.length) return [];

  const windows = slotWindows.length ? slotWindows : buildSlotWindowsFromTimeSlots([]).windows;
  const events = [];

  for (const date of eachDayInRange(rangeStart, rangeEnd)) {
    const dayCode = dateToDayCode(date);
    const iso = toIsoDate(date);
    if (!iso) continue;

    const daySessions = weeklySessions.filter((s) => s.dayCode === dayCode);
    for (const session of daySessions) {
      const window = windows.find((w) => w.key === session.slotKey)
        || windows.find((w) => !w.isBreak && w.key.startsWith('lecture'));
      const startMin = window?.min ?? 7 * 60;
      const endMin = window?.max ?? startMin + 60;
      const status = statusByDate[iso]?.[session.classId] ?? null;
      const workflowKey = resolveScheduleWorkflowKey(status);

      events.push({
        id: `${iso}-${session.classId}-${session.slotKey}`,
        title: session.subjectName,
        start: minutesOnDate(date, startMin),
        end: minutesOnDate(date, Math.max(endMin, startMin + 15)),
        resource: {
          classId: session.classId,
          date: iso,
          workflowKey,
          status,
          subjectName: session.subjectName,
          slotKey: session.slotKey,
          sessionType: session.sessionType,
          instructor: session.instructor || '',
          room: session.room || '',
          classData: session.classData || null,
        },
      });
    }
  }

  return events;
}

export function getWorkflowEventColor(workflowKey) {
  return SCHEDULE_WORKFLOW_COLORS[workflowKey] || SCHEDULE_WORKFLOW_COLORS[SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN];
}

export function isActionableClassSession(workflowKey) {
  return workflowKey === SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN
    || workflowKey === SCHEDULE_WORKFLOW_STATUS.DRAFT;
}

export function collectDatesWithSessions(weeklySessions, rangeStart, rangeEnd) {
  const dayCodesWithSessions = new Set(weeklySessions.map((s) => s.dayCode));
  return eachDayInRange(rangeStart, rangeEnd)
    .filter((date) => dayCodesWithSessions.has(dateToDayCode(date)))
    .map((date) => toIsoDate(date))
    .filter(Boolean);
}
