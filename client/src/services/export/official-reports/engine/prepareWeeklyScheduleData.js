import { buildSerialNumber } from './serialNumber.js';
import {
  buildWeeklyScheduleFromSessions,
  hasScheduleContent,
  WORK_DAYS,
  buildSlotWindowsFromTimeSlots,
  buildColumnDefsFromTimeSlots,
} from './buildWeeklyScheduleFromSessions.js';

const DAY_I18N = {
  Sun: { en: 'Sunday', ar: 'الأحد' },
  Mon: { en: 'Monday', ar: 'الإثنين' },
  Tue: { en: 'Tuesday', ar: 'الثلاثاء' },
  Wed: { en: 'Wednesday', ar: 'الأربعاء' },
  Thu: { en: 'Thursday', ar: 'الخميس' },
};

const DEFAULT_BREAKS = {
  break1: '8:00 – 8:30',
  break2: '9:30 – 10:00',
};

function buildColumns(lang, timeSlots = []) {
  const fromSlots = buildColumnDefsFromTimeSlots(timeSlots, lang);
  if (fromSlots) return fromSlots;

  const isAr = lang === 'ar';
  return [
    { key: 'lecture1', label: isAr ? 'المحاضرة الأولى' : '1st Lecture', isBreak: false },
    { key: 'break1', label: isAr ? 'استراحة' : 'Break', isBreak: true },
    { key: 'lecture2', label: isAr ? 'المحاضرة الثانية' : '2nd Lecture', isBreak: false },
    { key: 'break2', label: isAr ? 'استراحة' : 'Break', isBreak: true },
    { key: 'lecture3', label: isAr ? 'المحاضرة الثالثة' : '3rd Lecture', isBreak: false },
    { key: 'officeHour', label: isAr ? 'ساعات مكتبية' : 'Office Hours', isBreak: false },
  ];
}

function buildDayLabels(lang, t) {
  const labels = {};
  WORK_DAYS.forEach((code) => {
    if (typeof t === 'function') {
      const key = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu' }[code];
      labels[code] = t(key, DAY_I18N[code][lang === 'ar' ? 'ar' : 'en']);
    } else {
      labels[code] = DAY_I18N[code][lang === 'ar' ? 'ar' : 'en'];
    }
  });
  return labels;
}

/** Empty weekly grid — breaks only, no fabricated subjects. */
function buildEmptyDays(lang, dayLabels, timeSlots = []) {
  const { windows: slotWindows, breaks: breakTimes } = buildSlotWindowsFromTimeSlots(timeSlots);
  return WORK_DAYS.map((code) => ({
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
} = {}) {
  const isAr = lang === 'ar';
  const serial = buildSerialNumber(metadata.programId || metadata.classId, { prefix: 'WS' });
  const programName = metadata.programName || '';
  const batch = metadata.batch || metadata.className || '';
  const room = metadata.scheduleRoom || '';
  const year = metadata.year || '';
  const term = metadata.term || '';
  const dayLabels = buildDayLabels(lang, t);

  const dynamicDays = buildWeeklyScheduleFromSessions({
    sessions,
    breakSessions,
    instructorAvailability,
    lang,
    dayLabels,
    defaultRoom: room,
    timeSlots,
    attachSessionMeta,
  });

  const days = hasScheduleContent(dynamicDays)
    ? dynamicDays
    : buildEmptyDays(lang, dayLabels, timeSlots);

  return {
    lang,
    serial,
    title: isAr ? 'الجدول الأسبوعي للحصص' : 'Weekly Class Schedule',
    subtitle: programName,
    batch,
    year,
    term,
    room,
    columns: buildColumns(lang, timeSlots),
    rowLabels: {
      subject: isAr ? 'المادة' : 'Subject',
      time: isAr ? 'الزمن' : 'Time',
      instructor: isAr ? 'الأستاذ' : 'Teacher',
      room: isAr ? 'القاعة' : 'Room',
    },
    days,
    dataSource: hasScheduleContent(dynamicDays) ? 'database' : 'empty',
    meta: metadata,
    watermarkUser: metadata.watermarkUser,
  };
}
