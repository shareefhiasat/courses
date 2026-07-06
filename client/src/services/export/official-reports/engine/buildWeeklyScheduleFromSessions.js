import { QATAR_TIMEZONE } from '@utils/date-formatter.js';
import {
  getLocalizedSubjectName,
  getLocalizedInstructorName,
  getLocalizedClassroomName,
  WEEK_DAY_CODES,
} from '@utils/schedulingDisplayUtils.js';

const WORK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const SLOT_WINDOWS = [
  { key: 'lecture1', min: 7 * 60, max: 8 * 60 },
  { key: 'break1', min: 8 * 60, max: 8 * 60 + 30, isBreak: true },
  { key: 'lecture2', min: 8 * 60 + 30, max: 9 * 60 + 30 },
  { key: 'break2', min: 9 * 60 + 30, max: 9 * 60 + 50, isBreak: true },
  { key: 'lecture3', min: 9 * 60 + 50, max: 10 * 60 + 50 },
  { key: 'officeHour', min: 10 * 60 + 30, max: 12 * 60 },
];

const DEFAULT_BREAKS = {
  break1: '8:00 – 8:30',
  break2: '9:30 – 9:50',
};

function qatarParts(dateValue) {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: QATAR_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekday = map.weekday?.slice(0, 3);
  const hour = Number(map.hour || 0);
  const minute = Number(map.minute || 0);
  return { weekday, minutes: hour * 60 + minute };
}

function formatTime24(dateValue, lang) {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return d.toLocaleTimeString(lang === 'ar' ? 'ar-QA-u-ca-gregory' : 'en-US', {
    timeZone: QATAR_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTimeRange(start, end, lang) {
  return `${formatTime24(start, lang)} – ${formatTime24(end, lang)}`;
}

function parseHmToMinutes(hm) {
  if (!hm || typeof hm !== 'string') return null;
  const [h, m] = hm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function resolveSlotKey(startMinutes) {
  const match = SLOT_WINDOWS.find((w) => startMinutes >= w.min && startMinutes < w.max);
  if (match) return match.key;
  const lectures = SLOT_WINDOWS.filter((w) => !w.isBreak && w.key !== 'officeHour');
  let nearest = lectures[0];
  let best = Math.abs(startMinutes - nearest.min);
  lectures.forEach((w) => {
    const dist = Math.abs(startMinutes - w.min);
    if (dist < best) {
      best = dist;
      nearest = w;
    }
  });
  return nearest.key;
}

function emptySlots() {
  return Object.fromEntries(SLOT_WINDOWS.map((w) => [w.key, null]));
}

function sessionToSlot(session, lang) {
  const subject = session.class?.subject;
  const room = getLocalizedClassroomName(session.classroom, lang)
    || session.class?.locationEn
    || session.class?.locationAr
    || '';
  return {
    subjectName: getLocalizedSubjectName(subject, lang) || session.class?.code || '—',
    time: formatTimeRange(session.startDateTime, session.endDateTime, lang),
    instructor: getLocalizedInstructorName(session.instructor, lang, ''),
    room,
    isBreak: false,
    isOfficeHour: false,
  };
}

function weeklySessionKey(session) {
  const { weekday, minutes } = qatarParts(session.startDateTime);
  return `${weekday}-${minutes}`;
}

function buildSessionsByDay(sessions, lang) {
  const byDay = Object.fromEntries(WORK_DAYS.map((d) => [d, emptySlots()]));
  const seen = new Set();

  const active = (sessions || []).filter(
    (s) => s.isActive !== false && s.status !== 'cancelled' && !s.deletedAt
  );

  active
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
    .forEach((session) => {
      const { weekday, minutes } = qatarParts(session.startDateTime);
      if (!WORK_DAYS.includes(weekday)) return;
      const uniq = weeklySessionKey(session);
      if (seen.has(`${weekday}-${uniq}`)) return;
      seen.add(`${weekday}-${uniq}`);

      const slotKey = resolveSlotKey(minutes);
      if (slotKey === 'officeHour') {
        byDay[weekday][slotKey] = {
          ...sessionToSlot(session, lang),
          isOfficeHour: true,
        };
      } else if (!SLOT_WINDOWS.find((w) => w.key === slotKey)?.isBreak) {
        byDay[weekday][slotKey] = sessionToSlot(session, lang);
      }
    });

  return byDay;
}

function applyBreakSessions(byDay, breakSessions) {
  const seenBreaks = new Set();

  (breakSessions || []).forEach((bs) => {
    if (bs.isActive === false) return;
    const date = bs.date;
    if (!date) return;

    const weekday = qatarParts(date).weekday;
    if (!WORK_DAYS.includes(weekday)) return;

    let startMinutes = null;
    let timeStr = DEFAULT_BREAKS.break1;

    if (bs.timeSlot?.startTime && bs.timeSlot?.endTime) {
      startMinutes = parseHmToMinutes(bs.timeSlot.startTime);
      timeStr = `${bs.timeSlot.startTime} – ${bs.timeSlot.endTime}`;
    }

    const slotKey = startMinutes != null ? resolveSlotKey(startMinutes) : 'break1';
    if (!slotKey.startsWith('break')) return;

    const dedupeKey = `${weekday}-${slotKey}`;
    if (seenBreaks.has(dedupeKey)) return;
    seenBreaks.add(dedupeKey);

    byDay[weekday][slotKey] = { time: timeStr, isBreak: true };
  });

  WORK_DAYS.forEach((day) => {
    ['break1', 'break2'].forEach((bk) => {
      if (!byDay[day][bk]) {
        byDay[day][bk] = { time: DEFAULT_BREAKS[bk], isBreak: true };
      }
    });
  });
}

function applyOfficeHoursFromAvailability(byDay, availabilityRecords, lang, defaultRoom) {
  const officeLabel = lang === 'ar' ? 'ساعات مكتبية' : 'Office Hours';

  (availabilityRecords || []).forEach((record) => {
    if (record.isActive === false) return;
    const days = record.dayOfWeek || [];
    const instructor = getLocalizedInstructorName(record.instructor, lang, '');

    (record.slots || []).forEach((slot) => {
      const startMin = parseHmToMinutes(slot.startTime);
      const endMin = parseHmToMinutes(slot.endTime);
      if (startMin == null || endMin == null) return;
      if (startMin < 10 * 60 + 30 || startMin >= 12 * 60) return;

      days.forEach((dayCode) => {
        if (!WORK_DAYS.includes(dayCode)) return;
        if (byDay[dayCode].officeHour?.subjectName) return;
        byDay[dayCode].officeHour = {
          subjectName: officeLabel,
          time: `${slot.startTime} – ${slot.endTime}`,
          instructor,
          room: defaultRoom || '—',
          isOfficeHour: true,
        };
      });
    });
  });
}

function finalizeDaySlots(slots) {
  const result = { ...slots };
  SLOT_WINDOWS.forEach(({ key, isBreak }) => {
    if (isBreak && result[key]) return;
    if (isBreak) {
      result[key] = { time: DEFAULT_BREAKS[key], isBreak: true };
    } else if (!result[key]) {
      result[key] = null;
    }
  });
  return result;
}

export function hasScheduleContent(days) {
  return (days || []).some((day) =>
    Object.values(day.slots || {}).some(
      (slot) => slot && !slot.isBreak && (slot.subjectName || slot.instructor)
    )
  );
}

export function buildWeeklyScheduleFromSessions({
  sessions = [],
  breakSessions = [],
  instructorAvailability = [],
  lang = 'ar',
  dayLabels = {},
  defaultRoom = '',
}) {
  const byDay = buildSessionsByDay(sessions, lang);
  applyBreakSessions(byDay, breakSessions);
  applyOfficeHoursFromAvailability(byDay, instructorAvailability, lang, defaultRoom);

  const days = WORK_DAYS.map((code) => ({
    dayCode: code,
    dayLabel: dayLabels[code] || code,
    slots: finalizeDaySlots(byDay[code]),
  }));

  return days;
}

export { WORK_DAYS, SLOT_WINDOWS };
