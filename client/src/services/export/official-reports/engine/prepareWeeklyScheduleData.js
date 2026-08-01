import { buildSerialNumber } from './serialNumber.js';
import {
  buildWeeklyScheduleFromSessions,
  hasScheduleContent,
  WORK_DAYS,
  ALL_DAYS,
  buildSlotWindowsFromTimeSlots,
  buildColumnDefsFromTimeSlots,
} from './buildWeeklyScheduleFromSessions.js';

const DAY_I18N = {
  Sun: { en: 'Sunday', ar: 'الأحد' },
  Mon: { en: 'Monday', ar: 'الإثنين' },
  Tue: { en: 'Tuesday', ar: 'الثلاثاء' },
  Wed: { en: 'Wednesday', ar: 'الأربعاء' },
  Thu: { en: 'Thursday', ar: 'الخميس' },
  Fri: { en: 'Friday', ar: 'الجمعة' },
  Sat: { en: 'Saturday', ar: 'السبت' },
};

const DEFAULT_BREAKS = {
  break1: '8:00 – 8:30',
  break2: '9:30 – 10:00',
};

function buildColumns(lang, timeSlots = [], t = null) {
  const fromSlots = buildColumnDefsFromTimeSlots(timeSlots, lang);
  if (fromSlots) return fromSlots;

  const isAr = lang === 'ar';
  const tx = (key, fallback) => (typeof t === 'function' ? t(key) : null) || fallback;
  return [
    { key: 'lecture1', label: tx('schedule_lecture_1', isAr ? 'المحاضرة الأولى' : '1st Lecture'), isBreak: false },
    { key: 'break1', label: tx('schedule_break', isAr ? 'استراحة' : 'Break'), isBreak: true },
    { key: 'lecture2', label: tx('schedule_lecture_2', isAr ? 'المحاضرة الثانية' : '2nd Lecture'), isBreak: false },
    { key: 'break2', label: tx('schedule_break', isAr ? 'استراحة' : 'Break'), isBreak: true },
    { key: 'lecture3', label: tx('schedule_lecture_3', isAr ? 'المحاضرة الثالثة' : '3rd Lecture'), isBreak: false },
    { key: 'officeHour', label: tx('office_hours', isAr ? 'ساعات مكتبية' : 'Office Hours'), isBreak: false },
  ];
}

function buildDayLabels(lang, t, dayCodes = WORK_DAYS) {
  const labels = {};
  dayCodes.forEach((code) => {
    if (typeof t === 'function') {
      const key = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' }[code];
      labels[code] = t(key, DAY_I18N[code][lang === 'ar' ? 'ar' : 'en']);
    } else {
      labels[code] = DAY_I18N[code][lang === 'ar' ? 'ar' : 'en'];
    }
  });
  return labels;
}

/** Empty weekly grid — breaks only, no fabricated subjects. */
function buildEmptyDays(lang, dayLabels, timeSlots = [], dayCodes = WORK_DAYS) {
  const { windows: slotWindows, breaks: breakTimes } = buildSlotWindowsFromTimeSlots(timeSlots);
  return dayCodes.map((code) => ({
    dayCode: code,
    dayLabel: dayLabels[code] || DAY_I18N[code][lang === 'ar' ? 'ar' : 'en'],
    slots: Object.fromEntries(
      slotWindows.map((w) => [
        w.key,
        w.isBreak ? { time: breakTimes[w.key] || '—', isBreak: true } : null,
      ]),
    ),
  }));
}

export function prepareWeeklyScheduleData({
  metadata = {},
  lang = 'ar',
  sessions = [],
  breakSessions = [],
  instructorAvailability = [],
  timeSlots = [],
  t = null,
  attachSessionMeta = false,
  hideWeekends = true,
} = {}) {
  const isAr = lang === 'ar';
  const serial = buildSerialNumber(metadata.programId || metadata.classId, { prefix: 'WS' });
  const programName = metadata.programName || '';
  const batch = metadata.batch || metadata.className || '';
  const room = metadata.scheduleRoom || '';
  const year = metadata.year || '';
  const term = metadata.term || '';
  const dayCodes = hideWeekends ? WORK_DAYS : ALL_DAYS;
  const dayLabels = buildDayLabels(lang, t, dayCodes);

  const dynamicDays = buildWeeklyScheduleFromSessions({
    sessions,
    breakSessions,
    instructorAvailability,
    lang,
    dayLabels,
    defaultRoom: room,
    timeSlots,
    attachSessionMeta,
    hideWeekends,
  });

  const days = hasScheduleContent(dynamicDays)
    ? dynamicDays
    : buildEmptyDays(lang, dayLabels, timeSlots, dayCodes);

  const tx = (key, fallback) => (typeof t === 'function' ? t(key) : null) || fallback;

  return {
    lang,
    serial,
    title: tx('weekly_schedule', isAr ? 'الجدول الأسبوعي للحصص' : 'Weekly Class Schedule'),
    subtitle: programName,
    batch,
    year,
    term,
    room,
    columns: buildColumns(lang, timeSlots, t),
    rowLabels: {
      subject: tx('schedule_subject', isAr ? 'المادة' : 'Subject'),
      time: tx('schedule_time', isAr ? 'الزمن' : 'Time'),
      instructor: tx('schedule_instructor', isAr ? 'الأستاذ' : 'Teacher'),
      room: tx('schedule_room', isAr ? 'القاعة' : 'Room'),
    },
    days,
    dataSource: hasScheduleContent(dynamicDays) ? 'database' : 'empty',
    meta: metadata,
    watermarkUser: metadata.watermarkUser,
  };
}
