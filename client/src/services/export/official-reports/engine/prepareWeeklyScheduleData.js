import { buildSerialNumber } from './serialNumber.js';
import {
  buildWeeklyScheduleFromSessions,
  hasScheduleContent,
  WORK_DAYS,
} from './buildWeeklyScheduleFromSessions.js';

const DAY_I18N = {
  Sun: { en: 'Sunday', ar: 'الأحد' },
  Mon: { en: 'Monday', ar: 'الإثنين' },
  Tue: { en: 'Tuesday', ar: 'الثلاثاء' },
  Wed: { en: 'Wednesday', ar: 'الأربعاء' },
  Thu: { en: 'Thursday', ar: 'الخميس' },
};

/** Static IT fallback when no sessions exist in the database yet. */
const IT_SCHEDULE_FALLBACK = {
  programNameEn: 'Information Technology Diploma',
  programNameAr: 'دبلوم تقنية المعلومات',
  batchEn: 'Batch 1',
  batchAr: 'الدفعة الأولى',
  defaultRoom: 'B-1052',
  subjects: {
    python: { en: 'Computer Programming 2 (Python)', ar: 'برمجة الحاسوب 2 (بايثون)' },
    dbms: { en: 'Database Management System', ar: 'نظم إدارة قواعد البيانات' },
    network: { en: 'Computer Network & Internet Systems', ar: 'شبكات الحاسوب وأنظمة الإنترنت' },
    web: { en: 'Website Design & Development', ar: 'تصميم وتطوير المواقع' },
    analysis: { en: 'System Analysis & Design', ar: 'تحليل وتصميم النظم' },
  },
  pattern: [
    { day: 'Sun', slots: { lecture1: 'python', lecture2: 'dbms', lecture3: 'network', officeHour: 'web' } },
    { day: 'Mon', slots: { lecture1: 'analysis', lecture2: 'python', lecture3: 'dbms', officeHour: 'network' } },
    { day: 'Tue', slots: { lecture1: 'web', lecture2: 'network', lecture3: 'analysis', officeHour: 'python' } },
    { day: 'Wed', slots: { lecture1: 'dbms', lecture2: 'web', lecture3: 'python', officeHour: 'analysis' } },
    { day: 'Thu', slots: { lecture1: 'network', lecture2: 'analysis', lecture3: 'web', officeHour: 'dbms' } },
  ],
  times: {
    lecture1: '7:00 – 8:00',
    break1: '8:00 – 8:30',
    lecture2: '8:30 – 9:30',
    break2: '9:30 – 9:50',
    lecture3: '9:50 – 10:50',
    officeHourSunWed: '11:00 – 12:00',
    officeHourTueThu: '10:30 – 12:00',
  },
};

function buildColumns(lang) {
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

function buildFallbackDays(lang, room) {
  const subjects = IT_SCHEDULE_FALLBACK.subjects;
  const resolve = (key) => {
    const entry = subjects[key];
    return lang === 'ar' ? entry?.ar || entry?.en : entry?.en || entry?.ar;
  };
  const times = IT_SCHEDULE_FALLBACK.times;

  return IT_SCHEDULE_FALLBACK.pattern.map(({ day, slots }) => ({
    dayCode: day,
    dayLabel: DAY_I18N[day][lang === 'ar' ? 'ar' : 'en'],
    slots: {
      lecture1: {
        subjectName: resolve(slots.lecture1),
        time: times.lecture1,
        instructor: '',
        room,
      },
      break1: { time: times.break1, isBreak: true },
      lecture2: {
        subjectName: resolve(slots.lecture2),
        time: times.lecture2,
        instructor: '',
        room,
      },
      break2: { time: times.break2, isBreak: true },
      lecture3: {
        subjectName: resolve(slots.lecture3),
        time: times.lecture3,
        instructor: '',
        room,
      },
      officeHour: {
        subjectName: resolve(slots.officeHour),
        time: ['Tue', 'Thu'].includes(day) ? times.officeHourTueThu : times.officeHourSunWed,
        instructor: '',
        room,
      },
    },
  }));
}

export function prepareWeeklyScheduleData({
  metadata = {},
  lang = 'ar',
  sessions = [],
  breakSessions = [],
  instructorAvailability = [],
  t = null,
} = {}) {
  const isAr = lang === 'ar';
  const serial = buildSerialNumber(metadata.programId || metadata.classId, { prefix: 'WS' });
  const programName = metadata.programName
    || (isAr ? IT_SCHEDULE_FALLBACK.programNameAr : IT_SCHEDULE_FALLBACK.programNameEn);
  const batch = metadata.batch
    || (isAr ? IT_SCHEDULE_FALLBACK.batchAr : IT_SCHEDULE_FALLBACK.batchEn);
  const room = metadata.scheduleRoom || IT_SCHEDULE_FALLBACK.defaultRoom;
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
  });

  const days = hasScheduleContent(dynamicDays)
    ? dynamicDays
    : buildFallbackDays(lang, room);

  return {
    lang,
    serial,
    title: isAr ? 'الجدول الأسبوعي للحصص' : 'Weekly Class Schedule',
    subtitle: programName,
    batch,
    year,
    term,
    room,
    columns: buildColumns(lang),
    rowLabels: {
      subject: isAr ? 'المادة' : 'Subject',
      time: isAr ? 'الزمن' : 'Time',
      instructor: isAr ? 'الأستاذ' : 'Instructor',
      room: isAr ? 'القاعة' : 'Room',
    },
    days,
    dataSource: hasScheduleContent(dynamicDays) ? 'database' : 'fallback',
    meta: metadata,
  };
}

export { IT_SCHEDULE_FALLBACK as IT_SCHEDULE };
