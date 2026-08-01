import { QATAR_TIMEZONE, formatTime24 } from '@utils/date-formatter.js';
import {
  getLocalizedSubjectName,
  getLocalizedInstructorName,
  getLocalizedClassroomName,
  WEEK_DAY_CODES,
} from '@utils/schedulingDisplayUtils.js';

const WORK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_SLOT_WINDOWS = [
  { key: 'lecture1', min: 7 * 60, max: 8 * 60 },
  { key: 'break1', min: 8 * 60, max: 8 * 60 + 30, isBreak: true },
  { key: 'lecture2', min: 8 * 60 + 30, max: 9 * 60 + 30 },
  { key: 'break2', min: 9 * 60 + 30, max: 10 * 60 },
  { key: 'lecture3', min: 10 * 60, max: 11 * 60 },
  { key: 'officeHour', min: 11 * 60, max: 12 * 60 },
];

const DEFAULT_BREAKS = {
  break1: '8:00 – 8:30',
  break2: '9:30 – 10:00',
};

function slotKeyFromTimeSlot(ts, lectureCount, breakCount) {
  if (ts.isBreak) {
    if (ts.breakType === 'OfficeHours' || (ts.labelEn || '').toLowerCase().includes('office')) {
      return 'officeHour';
    }
    return breakCount === 0 ? 'break1' : 'break2';
  }
  if ((ts.labelEn || '').toLowerCase().includes('office')) return 'officeHour';
  const keys = ['lecture1', 'lecture2', 'lecture3'];
  return keys[lectureCount] || `lecture${lectureCount + 1}`;
}

/** Build slot windows from program time slots (falls back to defaults). */
export function buildSlotWindowsFromTimeSlots(timeSlots = []) {
  if (!timeSlots.length) return { windows: DEFAULT_SLOT_WINDOWS, breaks: { ...DEFAULT_BREAKS } };

  const windows = [];
  const breaks = { ...DEFAULT_BREAKS };
  let lectureCount = 0;
  let breakCount = 0;

  timeSlots.forEach((ts) => {
    const startMin = parseHmToMinutes(ts.startTime);
    const endMin = parseHmToMinutes(ts.endTime);
    if (startMin == null) return;

    const key = slotKeyFromTimeSlot(ts, lectureCount, breakCount);
    if (ts.isBreak) {
      if (key === 'officeHour') {
        // office-hour row marked as break in time slots
      } else {
        breakCount += 1;
      }
    } else if (key.startsWith('lecture')) {
      lectureCount += 1;
    }

    windows.push({
      key,
      min: startMin,
      max: endMin ?? startMin + (ts.durationMinutes || 60),
      isBreak: !!ts.isBreak,
    });

    if (ts.isBreak && ts.startTime && ts.endTime) {
      breaks[key] = `${ts.startTime} – ${ts.endTime}`;
    }
  });

  if (!windows.length) return { windows: DEFAULT_SLOT_WINDOWS, breaks: { ...DEFAULT_BREAKS } };
  return { windows, breaks };
}

export function buildColumnDefsFromTimeSlots(timeSlots = [], lang = 'en') {
  if (!timeSlots.length) return null;

  const hasLectureColumn = timeSlots.some((ts) => {
    if (ts.isBreak) return false;
    const label = (ts.labelEn || ts.labelAr || '').toLowerCase();
    return !label.includes('office');
  });
  if (!hasLectureColumn) return null;

  const isAr = lang === 'ar';
  let lectureCount = 0;
  let breakCount = 0;

  return timeSlots.map((ts) => {
    const key = slotKeyFromTimeSlot(ts, lectureCount, breakCount);
    if (ts.isBreak) {
      if (key !== 'officeHour') breakCount += 1;
    } else if (key.startsWith('lecture')) {
      lectureCount += 1;
    }
    const rawLabel = isAr ? (ts.labelAr || ts.labelEn) : (ts.labelEn || ts.labelAr);
    const label = key === 'officeHour' && !isAr
      ? (rawLabel || 'Office Hours').replace(/^OfficeHours$/i, 'Office Hours')
      : rawLabel;
    return {
      key,
      label,
      isBreak: !!ts.isBreak,
    };
  });
}

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

function formatTimeRange(start, end, lang) {
  return `${formatTime24(start, lang, QATAR_TIMEZONE)} – ${formatTime24(end, lang, QATAR_TIMEZONE)}`;
}

function parseHmToMinutes(hm) {
  if (!hm || typeof hm !== 'string') return null;
  const [h, m] = hm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function resolveSlotKey(startMinutes, slotWindows) {
  const windows = slotWindows || DEFAULT_SLOT_WINDOWS;
  const match = windows.find((w) => startMinutes >= w.min && startMinutes < w.max);
  if (match) return match.key;
  const lectures = windows.filter((w) => !w.isBreak && w.key !== 'officeHour');
  let nearest = lectures[0];
  let best = nearest ? Math.abs(startMinutes - nearest.min) : Infinity;
  lectures.forEach((w) => {
    const dist = Math.abs(startMinutes - w.min);
    if (dist < best) {
      best = dist;
      nearest = w;
    }
  });
  return nearest?.key || 'lecture1';
}

function emptySlots(slotWindows) {
  const windows = slotWindows || DEFAULT_SLOT_WINDOWS;
  return Object.fromEntries(windows.map((w) => [w.key, null]));
}

function sessionToSlot(session, lang, attachSessionMeta = false) {
  const subject = session.class?.subject;
  const room = getLocalizedClassroomName(session.classroom, lang)
    || session.class?.locationEn
    || session.class?.locationAr
    || '';
  const base = {
    subjectName: getLocalizedSubjectName(subject, lang) || session.class?.code || '—',
    time: formatTimeRange(session.startDateTime, session.endDateTime, lang),
    instructor: getLocalizedInstructorName(session.instructor, lang, ''),
    room,
    isBreak: false,
    isOfficeHour: session.sessionType === 'office_hours',
  };
  if (!attachSessionMeta) return base;
  const resolvedInstructorId = session.instructorId ?? session.class?.instructorId ?? null;
  return {
    ...base,
    sessionId: session.id,
    classId: session.classId,
    instructorId: resolvedInstructorId,
    sessionType: session.sessionType || 'lecture',
    class: session.class,
    session,
  };
}

function weeklySessionKey(session) {
  const { weekday, minutes } = qatarParts(session.startDateTime);
  return `${weekday}-${minutes}`;
}

function buildSessionsByDay(sessions, lang, slotWindows, attachSessionMeta = false, dayCodes = WORK_DAYS) {
  const byDay = Object.fromEntries(dayCodes.map((d) => [d, emptySlots(slotWindows)]));
  const seen = new Set();

  const active = (sessions || []).filter(
    (s) => s.isActive !== false && s.status !== 'cancelled' && !s.deletedAt
  );

  active
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
    .forEach((session) => {
      const { weekday, minutes } = qatarParts(session.startDateTime);
      if (!dayCodes.includes(weekday)) return;
      const uniq = weeklySessionKey(session);
      if (seen.has(`${weekday}-${uniq}`)) return;
      seen.add(`${weekday}-${uniq}`);

      const slotKey = session.sessionType === 'office_hours'
        ? 'officeHour'
        : resolveSlotKey(minutes, slotWindows);
      if (slotKey === 'officeHour') {
        byDay[weekday][slotKey] = {
          ...sessionToSlot(session, lang, attachSessionMeta),
          isOfficeHour: true,
        };
      } else {
        const slotDef = (slotWindows || DEFAULT_SLOT_WINDOWS).find((w) => w.key === slotKey);
        if (!slotDef?.isBreak) {
          byDay[weekday][slotKey] = sessionToSlot(session, lang, attachSessionMeta);
        }
      }
    });

  return byDay;
}

function applyBreakSessions(byDay, breakSessions, breakTimes, dayCodes = WORK_DAYS) {
  const defaults = breakTimes || DEFAULT_BREAKS;
  const seenBreaks = new Set();

  (breakSessions || []).forEach((bs) => {
    if (bs.isActive === false) return;
    const date = bs.date;
    if (!date) return;

    const weekday = qatarParts(date).weekday;
    if (!dayCodes.includes(weekday)) return;

    let startMinutes = null;
    let timeStr = defaults.break1;

    if (bs.timeSlot?.startTime && bs.timeSlot?.endTime) {
      startMinutes = parseHmToMinutes(bs.timeSlot.startTime);
      timeStr = `${bs.timeSlot.startTime} – ${bs.timeSlot.endTime}`;
    }

    const slotKey = startMinutes != null
      ? resolveSlotKey(startMinutes, null)
      : 'break1';
    if (!slotKey.startsWith('break')) return;

    const dedupeKey = `${weekday}-${slotKey}`;
    if (seenBreaks.has(dedupeKey)) return;
    seenBreaks.add(dedupeKey);

    byDay[weekday][slotKey] = { time: timeStr, isBreak: true };
  });

  dayCodes.forEach((day) => {
    ['break1', 'break2'].forEach((bk) => {
      if (!byDay[day][bk]) {
        byDay[day][bk] = { time: defaults[bk] || DEFAULT_BREAKS[bk], isBreak: true };
      }
    });
  });
}

function applyOfficeHoursFromAvailability(byDay, availabilityRecords, lang, defaultRoom, slotWindows, dayCodes = WORK_DAYS) {
  const officeLabel = lang === 'ar' ? 'ساعات مكتبية' : 'Office Hours';
  const officeWindow = (slotWindows || DEFAULT_SLOT_WINDOWS).find((w) => w.key === 'officeHour');
  const officeMin = officeWindow?.min ?? 11 * 60;
  const officeMax = officeWindow?.max ?? 12 * 60;

  (availabilityRecords || []).forEach((record) => {
    if (record.isActive === false) return;
    const days = record.dayOfWeek || [];
    const instructor = getLocalizedInstructorName(record.instructor, lang, '');

    (record.slots || []).forEach((slot) => {
      const startMin = parseHmToMinutes(slot.startTime);
      const endMin = parseHmToMinutes(slot.endTime);
      if (startMin == null || endMin == null) return;
      if (startMin < officeMin - 30 || startMin >= officeMax) return;

      days.forEach((dayCode) => {
        if (!dayCodes.includes(dayCode)) return;
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

function finalizeDaySlots(slots, slotWindows, breakTimes) {
  const windows = slotWindows || DEFAULT_SLOT_WINDOWS;
  const defaults = breakTimes || DEFAULT_BREAKS;
  const result = { ...slots };
  windows.forEach(({ key, isBreak }) => {
    if (isBreak && result[key]) return;
    if (isBreak) {
      result[key] = { time: defaults[key] || DEFAULT_BREAKS[key], isBreak: true };
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
  timeSlots = [],
  attachSessionMeta = false,
  hideWeekends = true,
} = {}) {
  const dayCodes = hideWeekends ? WORK_DAYS : ALL_DAYS;
  const { windows: slotWindows, breaks: breakTimes } = buildSlotWindowsFromTimeSlots(timeSlots);

  const byDay = buildSessionsByDay(sessions, lang, slotWindows, attachSessionMeta, dayCodes);
  applyBreakSessions(byDay, breakSessions, breakTimes, dayCodes);
  applyOfficeHoursFromAvailability(byDay, instructorAvailability, lang, defaultRoom, slotWindows, dayCodes);

  const days = dayCodes.map((code) => ({
    dayCode: code,
    dayLabel: dayLabels[code] || code,
    slots: finalizeDaySlots(byDay[code], slotWindows, breakTimes),
  }));

  return days;
}

export { WORK_DAYS, ALL_DAYS, DEFAULT_SLOT_WINDOWS as SLOT_WINDOWS };
