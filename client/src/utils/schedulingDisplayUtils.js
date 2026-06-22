/**
 * Shared display helpers for scheduling calendar UI
 */

import { getLocalizedUserName } from './localizedUserName.js';

export { getEntityDisplayName } from './entityDisplayName.js';

const CALENDAR_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const CALENDAR_DAY_KEYS_WORKWEEK = ['sun', 'mon', 'tue', 'wed', 'thu'];
const EN_DAY_TO_KEY = {
  Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat',
  Sunday: 'sun', Monday: 'mon', Tuesday: 'tue', Wednesday: 'wed', Thursday: 'thu', Friday: 'fri', Saturday: 'sat'
};

/** Arabic locale with Gregorian calendar (not Hijri). */
export function getSchedulingLocale(lang) {
  return lang === 'ar' ? 'ar-QA-u-ca-gregory' : 'en-US';
}

export function getCalendarDayNames(t, hideWeekends = false) {
  const keys = hideWeekends ? CALENDAR_DAY_KEYS_WORKWEEK : CALENDAR_DAY_KEYS;
  return keys.map((k) => t(k));
}

export function getLocalizedClassName(cls, lang, fallback = '') {
  if (!cls) return fallback;
  if (lang === 'ar' && cls.nameAr) return cls.nameAr;
  return cls.nameEn || cls.name || cls.code || fallback;
}

export function getLocalizedSubjectName(subject, lang) {
  if (!subject) return '';
  if (lang === 'ar' && subject.nameAr) return subject.nameAr;
  return subject.nameEn || subject.code || '';
}

export function getLocalizedProgramName(program, lang) {
  if (!program) return '';
  if (lang === 'ar' && program.nameAr) return program.nameAr;
  return program.nameEn || program.name || program.code || '';
}

export const WEEK_DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getWeekDayOptions(t) {
  return WEEK_DAY_CODES.map((code) => ({
    value: code,
    label: t(EN_DAY_TO_KEY[code] || code),
  }));
}

export function formatWeekDayCodes(days, t) {
  if (!days || !Array.isArray(days) || days.length === 0) return '—';
  return days.map((d) => t(EN_DAY_TO_KEY[d] || d)).join(', ');
}

export function getLocalizedInstructorName(instructor, lang, fallback = '') {
  return getLocalizedUserName(instructor, lang, fallback || 'Unknown User');
}

export function getLocalizedClassroomName(classroom, lang) {
  if (!classroom) return '';
  if (lang === 'ar' && classroom.nameAr) return classroom.nameAr;
  return classroom.nameEn || classroom.code || '';
}

export function formatSchedulingDateTime(date, lang, options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString(getSchedulingLocale(lang), {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    calendar: 'gregory',
    ...options
  });
}

export function formatSchedulingDateOnly(date, lang, options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(getSchedulingLocale(lang), {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    calendar: 'gregory',
    ...options
  });
}

export function formatSchedulingTimeOnly(date, lang, options = {}) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString(getSchedulingLocale(lang), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  });
}

/** Toast UI Calendar templates for localized day names and AM/PM labels. */
export function createToastCalendarTemplates(lang, t) {
  const locale = getSchedulingLocale(lang);

  const localizeDayLabel = (model) => {
    if (model?.day != null && CALENDAR_DAY_KEYS[model.day]) {
      return t(CALENDAR_DAY_KEYS[model.day]);
    }
    const key = EN_DAY_TO_KEY[model?.dayName];
    if (key) return t(key);
    return model?.dayName || '';
  };

  return {
    weekDayName(model) {
      const dateNum = model?.date ?? '';
      const dayLabel = localizeDayLabel(model);
      return `<span class="toastui-calendar-day-name__date">${dateNum}</span>&nbsp;&nbsp;<span class="toastui-calendar-day-name__name">${escapeHtml(dayLabel)}</span>`;
    },
    monthDayName(model) {
      const label = model?.label ?? model?.date ?? '';
      const key = EN_DAY_TO_KEY[label];
      return key ? t(key) : String(label);
    },
    timegridDisplayPrimaryTime({ time }) {
      const d = time instanceof Date ? time : new Date(time);
      return d.toLocaleTimeString(locale, { hour: 'numeric', hour12: true });
    },
    timegridDisplayTime({ time }) {
      const d = time instanceof Date ? time : new Date(time);
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true });
    },
    timegridNowIndicatorLabel({ time }) {
      const d = time instanceof Date ? time : new Date(time);
      return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };
}

export function getRoomName(session, lang) {
  const classroom = session?.classroom;
  if (!classroom) return null;
  return lang === 'ar'
    ? (classroom.nameAr || classroom.nameEn || classroom.code)
    : (classroom.nameEn || classroom.nameAr || classroom.code);
}

export function getLocationText(session, lang) {
  const classroom = session?.classroom;
  const classLocation = lang === 'ar' ? session?.class?.locationAr : session?.class?.locationEn;
  const classroomLocation = lang === 'ar' ? classroom?.locationAr : classroom?.locationEn;

  const parts = [];
  if (classroomLocation) parts.push(classroomLocation);
  else if (classLocation) parts.push(classLocation);
  if (classroom?.floor) parts.push(classroom.floor);
  if (classroom?.roomNumber) parts.push(classroom.roomNumber);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function buildSessionEventVenueLine(session, lang, t) {
  const room = getRoomName(session, lang);
  const location = getLocationText(session, lang);

  const parts = [];
  if (room) parts.push(room);
  if (location && location !== room) parts.push(location);
  return parts.length > 0 ? parts.join(' · ') : t('not_assigned');
}

export function buildSessionEventInstructorLine(session, lang, t) {
  return getLocalizedInstructorName(session?.instructor, lang, t('instructor'));
}

/** @deprecated Use buildSessionEventVenueLine + buildSessionEventInstructorLine */
export function buildSessionEventSubtitle(session, lang, t) {
  return `${buildSessionEventVenueLine(session, lang, t)} · ${buildSessionEventInstructorLine(session, lang, t)}`;
}

export function getClassroomById(classrooms, classroomId) {
  if (!classroomId) return null;
  return classrooms.find(c => c.id === classroomId) || null;
}

export function getLocalizedClassroomStatus(classroom, t) {
  if (!classroom?.status) return null;
  const statusMap = {
    Available: t('available'),
    UnderMaintenance: t('under_maintenance'),
    Closed: t('closed'),
  };
  return statusMap[classroom.status] || classroom.status;
}

export function formatClassroomOptionLabel(classroom, lang, t) {
  if (!classroom) return '';
  const name = getLocalizedClassroomName(classroom, lang);
  const capacity = classroom.capacity != null ? classroom.capacity : '—';
  const statusLabel = getLocalizedClassroomStatus(classroom, t);
  const statusSuffix = statusLabel ? ` · ${statusLabel}` : '';
  return `${name} (${capacity} ${t('seats')})${statusSuffix}`;
}

export function formatClassroomDetails(classroom, lang, t) {
  if (!classroom) return null;
  const parts = [];
  const name = lang === 'ar'
    ? (classroom.nameAr || classroom.nameEn || classroom.code)
    : (classroom.nameEn || classroom.nameAr || classroom.code);
  parts.push(name);
  const location = lang === 'ar' ? classroom.locationAr : classroom.locationEn;
  if (location) parts.push(location);
  if (classroom.floor) parts.push(`${t('floor')}: ${classroom.floor}`);
  if (classroom.roomNumber) parts.push(`${t('room_number')}: ${classroom.roomNumber}`);
  if (classroom.capacity != null) parts.push(`${t('capacity')}: ${classroom.capacity}`);
  return parts.join(' · ');
}

/** Full room detail rows for availability / room cards. */
export function getClassroomDetailRows(classroom, lang, t) {
  if (!classroom) return [];
  const name = lang === 'ar'
    ? (classroom.nameAr || classroom.nameEn || classroom.code)
    : (classroom.nameEn || classroom.nameAr || classroom.code);
  const location = lang === 'ar' ? classroom.locationAr : classroom.locationEn;
  const rows = [
    { label: t('code'), value: classroom.code },
    { label: t('name'), value: name },
    { label: t('capacity'), value: classroom.capacity != null ? String(classroom.capacity) : null },
    { label: t('floor'), value: classroom.floor },
    { label: t('room_number'), value: classroom.roomNumber },
    { label: t('location'), value: location },
    { label: t('status'), value: getLocalizedClassroomStatus(classroom, t) },
    { label: t('equipment'), value: classroom.equipment?.length ? classroom.equipment.join(', ') : null },
    { label: t('available_days'), value: classroom.availableDays?.length
      ? classroom.availableDays.join(', ') : null }
  ];
  return rows.filter((r) => r.value);
}

export function formatWorkloadSessionTime(startDateTime, lang) {
  return formatSchedulingDateTime(startDateTime, lang);
}

/** Estimate how many sessions a recurrence series will create (mirrors backend engine). */
export function estimateRecurringSessionCount(baseSession, recurrenceConfig) {
  const {
    recurrenceType = 'weekly',
    recurrenceDays = [],
    recurrenceEndDate,
    recurrenceCount,
    timesPerDay = []
  } = recurrenceConfig || {};

  if (!baseSession?.startDateTime) return 0;

  const effectiveDays = recurrenceType === 'daily'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : recurrenceDays;

  if (!effectiveDays.length) return 0;
  if (!recurrenceEndDate && !recurrenceCount) return 0;

  const sessions = [];
  let currentDate = new Date(baseSession.startDateTime);
  const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
  let count = 0;
  const maxCount = recurrenceCount || 1000;
  const dayCodes = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  while (count < maxCount) {
    const dayOfWeek = dayCodes[currentDate.getDay()];
    if (effectiveDays.includes(dayOfWeek)) {
      const dayTimes = timesPerDay.find((row) => row.day === dayOfWeek);
      if (dayTimes?.startTime && dayTimes?.endTime) {
        sessions.push(true);
      } else {
        sessions.push(true);
      }
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
    if (endDate && currentDate > endDate) break;
    if (recurrenceCount && count >= recurrenceCount) break;
  }

  return sessions.length;
}

export function formatSessionDuration(start, end) {
  const diffMs = new Date(end) - new Date(start);
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Context-aware status transitions based on session timing
 */
export function getAvailableStatusTransitions(session) {
  if (!session) return [];

  const { status, startDateTime, endDateTime } = session;
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (status === 'cancelled') {
    return [{ value: 'scheduled', labelKey: 'restore_to_scheduled', iconName: 'Calendar' }];
  }
  if (status === 'completed') {
    return [];
  }
  if (status === 'in_progress') {
    return [
      { value: 'completed', labelKey: 'completed', iconName: 'CheckCircle2' },
      { value: 'cancelled', labelKey: 'cancelled', iconName: 'XCircle' }
    ];
  }

  // scheduled — only allow in_progress while session is active
  const options = [{ value: 'cancelled', labelKey: 'cancelled', iconName: 'XCircle' }];
  if (now >= start && now <= end) {
    options.unshift({ value: 'in_progress', labelKey: 'in_progress', iconName: 'Clock' });
  } else if (now > end) {
    options.unshift({ value: 'completed', labelKey: 'completed', iconName: 'CheckCircle2' });
  }
  return options;
}

/** Format Date for `<input type="datetime-local">` using local timezone (not UTC). */
export function toDatetimeLocalValue(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** User-facing summary for a scheduling validation conflict. */
export function formatValidationConflict(conflict, t) {
  if (!conflict) return t('validation_failed');
  const typeLabels = {
    instructor: t('conflict_instructor'),
    classroom: t('conflict_classroom'),
    class: t('conflict_class'),
    capacity: t('conflict_capacity'),
    instructor_availability: t('conflict_instructor_availability'),
    classroom_availability: t('conflict_classroom_availability'),
    validation: t('conflict_validation')
  };
  const prefix = typeLabels[conflict.type];
  return prefix ? `${prefix}: ${conflict.message}` : conflict.message;
}

const SESSION_CALENDAR_HOUR_START = 6;
const SESSION_CALENDAR_HOUR_END = 24;
const SESSION_DROP_DURATION_MS = 2 * 60 * 60 * 1000;
const SESSION_DROP_SNAP_MINUTES = 15;

/** Week column dates aligned with Toast UI Calendar (Sunday start, optional workweek). */
export function getWeekDatesForCalendar(anchorDate, { hideWeekends = false, startDayOfWeek = 0 } = {}) {
  const base = new Date(anchorDate);
  base.setHours(0, 0, 0, 0);
  const nowDay = base.getDay();
  const prevDateCount = nowDay - startDayOfWeek;
  const offsets = prevDateCount >= 0
    ? Array.from({ length: 7 }, (_, i) => i - prevDateCount)
    : Array.from({ length: 7 }, (_, i) => i - 7 - prevDateCount);

  const dates = [];
  for (const offset of offsets) {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    if (hideWeekends && (d.getDay() === 0 || d.getDay() === 6)) continue;
    dates.push(d);
  }
  return dates;
}

/**
 * Resolve drop coordinates on the sessions calendar to start/end DateTimes.
 * Returns null when the pointer is not over the time grid.
 */
export function resolveSessionDropDateTime(clientX, clientY, calendarContainer, options = {}) {
  const {
    currentView = 'week',
    anchorDate = new Date(),
    hideWeekends = false,
    hourStart = SESSION_CALENDAR_HOUR_START,
    hourEnd = SESSION_CALENDAR_HOUR_END,
    durationMs = SESSION_DROP_DURATION_MS
  } = options;

  if (!calendarContainer) return null;

  const columnsContainer = calendarContainer.querySelector('.toastui-calendar-columns');
  if (!columnsContainer) return null;

  const scrollArea = calendarContainer.querySelector('.toastui-calendar-timegrid-scroll-area');
  const columnEls = [...columnsContainer.querySelectorAll('.toastui-calendar-column')];
  if (!columnEls.length) return null;

  const measureEl = scrollArea ?? columnsContainer;
  const areaRect = measureEl.getBoundingClientRect();
  if (
    clientX < areaRect.left || clientX > areaRect.right
    || clientY < areaRect.top || clientY > areaRect.bottom
  ) {
    return null;
  }

  let columnIndex = columnEls.findIndex((el) => {
    const r = el.getBoundingClientRect();
    return clientX >= r.left && clientX < r.right;
  });
  if (columnIndex < 0) columnIndex = columnEls.length - 1;

  const weekDates = currentView === 'day'
    ? [new Date(anchorDate)]
    : getWeekDatesForCalendar(anchorDate, { hideWeekends });

  if (!weekDates.length) return null;
  columnIndex = Math.min(columnIndex, weekDates.length - 1);
  const columnDate = new Date(weekDates[columnIndex]);

  const scrollTop = scrollArea?.scrollTop ?? 0;
  const gridHeight = scrollArea?.scrollHeight ?? columnsContainer.scrollHeight;
  let relativeY = clientY - areaRect.top + scrollTop;
  relativeY = Math.max(0, Math.min(relativeY, gridHeight));

  const totalMinutes = (hourEnd - hourStart) * 60;
  const minutesFromStart = (relativeY / gridHeight) * totalMinutes;
  const snapped = Math.round(minutesFromStart / SESSION_DROP_SNAP_MINUTES) * SESSION_DROP_SNAP_MINUTES;
  const clampedMinutes = Math.max(0, Math.min(totalMinutes - SESSION_DROP_SNAP_MINUTES, snapped));

  const startDateTime = new Date(columnDate);
  startDateTime.setHours(hourStart, 0, 0, 0);
  startDateTime.setMinutes(startDateTime.getMinutes() + clampedMinutes);

  const endDateTime = new Date(startDateTime.getTime() + durationMs);
  return { startDateTime, endDateTime };
}
