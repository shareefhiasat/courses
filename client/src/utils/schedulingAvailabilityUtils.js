import {
  getLocalizedInstructorName,
  getLocalizedClassroomName
} from './schedulingDisplayUtils.js';

function instructorSearchText(instructor) {
  return [
    instructor?.displayName,
    instructor?.email,
    instructor?.firstName,
    instructor?.lastName,
    instructor?.firstNameAr,
    instructor?.lastNameAr,
    instructor?.realName
  ].filter(Boolean).join(' ').toLowerCase();
}

function classroomSearchText(classroom) {
  return [
    classroom?.nameEn,
    classroom?.nameAr,
    classroom?.code
  ].filter(Boolean).join(' ').toLowerCase();
}

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_KEYS = {
  Sun: 'sun',
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat'
};

export function getDayCode(date) {
  return DAY_ORDER[new Date(date).getDay()];
}

export function formatDayList(days, t) {
  if (!days?.length) return '—';
  return [...days]
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map((d) => t(DAY_KEYS[d] || d.toLowerCase()) || d)
    .join(', ');
}

export function formatSlotList(slots) {
  if (!slots?.length) return '—';
  return slots.map((s) => `${s.startTime}–${s.endTime}`).join(', ');
}

export function formatAvailabilityDateRange(startDate, endDate, lang) {
  if (!startDate && !endDate) return '';
  const opts = { year: 'numeric', month: 'numeric', day: 'numeric', calendar: 'gregory' };
  const locale = lang === 'ar' ? 'ar-QA-u-ca-gregory' : 'en-US';
  const start = startDate ? new Date(startDate).toLocaleDateString(locale, opts) : '…';
  const end = endDate ? new Date(endDate).toLocaleDateString(locale, opts) : '…';
  return `${start} – ${end}`;
}

export function getActiveRecordsForEntity(records, entityId, idField) {
  if (!entityId || !records?.length) return [];
  const now = new Date();
  return records.filter((r) => {
    if (!r.isActive) return false;
    if (r[idField] !== entityId) return false;
    const start = r.startDate ? new Date(r.startDate) : null;
    const end = r.endDate ? new Date(r.endDate) : null;
    if (start && start > now && !end) return true;
    if (end && end < now) return false;
    return true;
  });
}

export function summarizeDefinedAvailability(records) {
  const daySlots = {};
  for (const record of records) {
    for (const day of record.dayOfWeek || []) {
      if (!daySlots[day]) daySlots[day] = new Set();
      for (const slot of record.slots || []) {
        daySlots[day].add(`${slot.startTime}–${slot.endTime}`);
      }
    }
  }
  return DAY_ORDER.filter((d) => daySlots[d]).map((day) => ({
    day,
    slots: [...daySlots[day]].sort()
  }));
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function sessionFitsRecord(start, end, record) {
  const day = getDayCode(start);
  if (!record.dayOfWeek?.includes(day)) return false;
  const sessionStart = start.getHours() * 60 + start.getMinutes();
  const sessionEnd = end.getHours() * 60 + end.getMinutes();
  const recordStart = record.startDate ? new Date(record.startDate) : null;
  const recordEnd = record.endDate ? new Date(record.endDate) : null;
  if (recordStart && start < recordStart) return false;
  if (recordEnd && start > recordEnd) return false;
  return (record.slots || []).some((slot) => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return sessionStart >= slotStart && sessionEnd <= slotEnd;
  });
}

export function checkDefinedAvailability(startDateTime, endDateTime, records) {
  if (!records?.length) {
    return { configured: false, fits: true, summary: [] };
  }
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const fits = records.some((r) => sessionFitsRecord(start, end, r));
  return {
    configured: true,
    fits,
    summary: summarizeDefinedAvailability(records),
    day: getDayCode(start)
  };
}

export function groupInstructorAvailability(records, instructors, searchQuery = '', lang = 'en') {
  const byId = new Map();
  for (const record of records.filter((r) => r.isActive)) {
    const id = record.instructorUserId;
    if (!byId.has(id)) {
      const instructor = record.instructor || instructors.find((i) => i.id === id);
      const name = getLocalizedInstructorName(instructor, lang, `#${id}`);
      if (searchQuery && !instructorSearchText(instructor).includes(searchQuery.toLowerCase())) continue;
      byId.set(id, { id, name, records: [] });
    }
    if (byId.has(id)) byId.get(id).records.push(record);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function groupClassroomAvailability(records, classrooms, searchQuery = '', lang = 'en') {
  const byId = new Map();
  for (const record of records.filter((r) => r.isActive)) {
    const id = record.classroomId;
    if (!byId.has(id)) {
      const classroom = record.classroom || classrooms.find((c) => c.id === id);
      const name = getLocalizedClassroomName(classroom, lang) || `#${id}`;
      if (searchQuery && !classroomSearchText(classroom).includes(searchQuery.toLowerCase())) continue;
      byId.set(id, { id, name, classroom, records: [] });
    }
    if (byId.has(id)) byId.get(id).records.push(record);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Suggest the next valid start/end using defined availability windows. */
export function suggestNearestValidSlot(startDateTime, endDateTime, instructorRecords, classroomRecords) {
  const durationMs = new Date(endDateTime) - new Date(startDateTime);
  if (durationMs <= 0) return null;

  const instructorSummary = summarizeDefinedAvailability(instructorRecords);
  const classroomSummary = summarizeDefinedAvailability(classroomRecords);
  const instructorDays = new Set(instructorSummary.map((s) => s.day));
  const classroomDays = new Set(classroomSummary.map((s) => s.day));

  let allowedDays = DAY_ORDER;
  if (instructorRecords?.length) allowedDays = allowedDays.filter((d) => instructorDays.has(d));
  if (classroomRecords?.length) allowedDays = allowedDays.filter((d) => classroomDays.has(d));
  if (!allowedDays.length) return null;

  const base = new Date(startDateTime);
  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(base);
    candidate.setDate(candidate.getDate() + offset);
    const day = getDayCode(candidate);
    if (!allowedDays.includes(day)) continue;

    const dayInstructorSlots = instructorSummary.find((s) => s.day === day)?.slots || [];
    const dayRoomSlots = classroomSummary.find((s) => s.day === day)?.slots || [];
    let slotStrings = dayInstructorSlots.length ? dayInstructorSlots : ['00:00–23:59'];
    if (classroomRecords?.length) {
      slotStrings = slotStrings.filter((s) => dayRoomSlots.includes(s));
      if (!slotStrings.length && dayRoomSlots.length) slotStrings = dayRoomSlots;
    }

    for (const slotStr of slotStrings) {
      const [startTime, endTime] = slotStr.split('–');
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const slotStart = new Date(candidate);
      slotStart.setHours(sh, sm, 0, 0);
      const slotEnd = new Date(candidate);
      slotEnd.setHours(eh, em, 0, 0);
      const proposedEnd = new Date(slotStart.getTime() + durationMs);
      if (proposedEnd <= slotEnd) {
        const instCheck = checkDefinedAvailability(slotStart, proposedEnd, instructorRecords);
        const roomCheck = checkDefinedAvailability(slotStart, proposedEnd, classroomRecords);
        if ((!instructorRecords?.length || instCheck.fits) && (!classroomRecords?.length || roomCheck.fits)) {
          return { start: slotStart, end: proposedEnd, day };
        }
      }
    }
  }
  return null;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Filter availability records overlapping [fromDate, toDate] (inclusive). */
export function filterAvailabilityRecordsByDateRange(records, fromDate, toDate) {
  if (!records?.length) return [];
  if (!fromDate && !toDate) return records.filter((r) => r.isActive);
  const from = fromDate ? startOfDay(fromDate) : null;
  const to = toDate ? endOfDay(toDate) : null;
  return records.filter((r) => {
    if (!r.isActive) return false;
    const rStart = r.startDate ? new Date(r.startDate) : null;
    const rEnd = r.endDate ? new Date(r.endDate) : null;
    if (from && rEnd && rEnd < from) return false;
    if (to && rStart && rStart > to) return false;
    return true;
  });
}

/** Group slots by weekday (Sun→Sat) for one entity's records. */
export function groupRecordsByDayOrdered(records, t) {
  const byDay = {};
  for (const record of records) {
    const rangeLabel = formatAvailabilityDateRange(record.startDate, record.endDate, 'en');
    for (const day of record.dayOfWeek || []) {
      if (!byDay[day]) byDay[day] = { day, slots: new Set(), ranges: new Set() };
      for (const slot of record.slots || []) {
        byDay[day].slots.add(`${slot.startTime}–${slot.endTime}`);
      }
      if (rangeLabel) byDay[day].ranges.add(rangeLabel);
    }
  }
  return DAY_ORDER.filter((d) => byDay[d]).map((day) => ({
    day,
    dayLabel: t(DAY_KEYS[day] || day.toLowerCase()) || day,
    slots: [...byDay[day].slots].sort(),
    ranges: [...byDay[day].ranges]
  }));
}

function getCalendarRange(view, anchorDate) {
  const d = new Date(anchorDate);
  if (view === 'day') {
    return { start: startOfDay(d), end: endOfDay(d) };
  }
  if (view === 'month') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  // week — Sunday start
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Expand defined availability into calendar events for timeline view. */
export function expandAvailabilityToCalendarEvents(records, options = {}) {
  const {
    view = 'week',
    anchorDate = new Date(),
    filterFrom = null,
    filterTo = null,
    getTitle = () => 'Available',
    color = '#10b981',
    entityId = null,
    idField = null
  } = options;

  let list = records.filter((r) => r.isActive);
  if (entityId != null && idField) {
    list = list.filter((r) => r[idField] === entityId);
  }
  list = filterAvailabilityRecordsByDateRange(list, filterFrom, filterTo);

  const { start: viewStart, end: viewEnd } = getCalendarRange(view, anchorDate);
  const rangeStart = filterFrom ? startOfDay(filterFrom) : viewStart;
  const rangeEnd = filterTo ? endOfDay(filterTo) : viewEnd;
  const effStart = rangeStart > viewStart ? rangeStart : viewStart;
  const effEnd = rangeEnd < viewEnd ? rangeEnd : viewEnd;

  const events = [];
  let eventIdx = 0;

  for (const record of list) {
    const recStart = record.startDate ? startOfDay(record.startDate) : effStart;
    const recEnd = record.endDate ? endOfDay(record.endDate) : effEnd;
    const walkStart = recStart > effStart ? recStart : effStart;
    const walkEnd = recEnd < effEnd ? recEnd : effEnd;
    if (walkStart > walkEnd) continue;

    const cursor = new Date(walkStart);
    while (cursor <= walkEnd) {
      const dayCode = DAY_ORDER[cursor.getDay()];
      if ((record.dayOfWeek || []).includes(dayCode)) {
        for (const slot of record.slots || []) {
          const [sh, sm] = slot.startTime.split(':').map(Number);
          const [eh, em] = slot.endTime.split(':').map(Number);
          const start = new Date(cursor);
          start.setHours(sh, sm, 0, 0);
          const end = new Date(cursor);
          end.setHours(eh, em, 0, 0);
          if (start >= effStart && end <= effEnd) {
            events.push({
              id: `avail-${record.id}-${eventIdx++}`,
              calendarId: 'availability',
              title: getTitle(record),
              category: 'time',
              start,
              end,
              backgroundColor: color,
              borderColor: color,
              color: '#ffffff',
              isReadOnly: true,
              raw: { record, type: 'availability' }
            });
          }
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return events.sort((a, b) => a.start - b.start);
}

function overlapsRange(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

/** Flag availability blocks that overlap scheduled sessions (booked during defined hours). */
export function markAvailabilitySessionConflicts(events, sessions, options = {}) {
  const { instructorUserId = null, classroomId = null } = options;
  if (!events?.length || !sessions?.length) return events;

  const activeSessions = sessions.filter((s) => s.status !== 'cancelled');

  return events.map((ev) => {
    const record = ev.raw?.record;
    const entityInstructorId = instructorUserId ?? record?.instructorUserId ?? null;
    const entityClassroomId = classroomId ?? record?.classroomId ?? null;

    const conflicting = activeSessions.filter((s) => {
      if (entityInstructorId && s.instructorId !== entityInstructorId) return false;
      if (entityClassroomId && s.classroomId !== entityClassroomId) return false;
      const sStart = new Date(s.startDateTime);
      const sEnd = new Date(s.endDateTime);
      return overlapsRange(ev.start, ev.end, sStart, sEnd);
    });

    if (!conflicting.length) return ev;

    return {
      ...ev,
      backgroundColor: '#d97706',
      borderColor: '#b45309',
      color: '#ffffff',
      raw: { ...ev.raw, hasSessionConflict: true, conflictingSessions: conflicting }
    };
  });
}

/** Overlay scheduled sessions on the availability timeline (booked time). */
export function expandSessionsToTimelineEvents(sessions, options = {}) {
  const {
    view = 'week',
    anchorDate = new Date(),
    filterFrom = null,
    filterTo = null,
    instructorUserId = null,
    classroomId = null,
    getTitle = (s) => s.class?.nameEn || s.class?.code || 'Session',
    color = '#3b82f6'
  } = options;

  if (!sessions?.length) return [];

  const { start: viewStart, end: viewEnd } = getCalendarRange(view, anchorDate);
  const rangeStart = filterFrom ? startOfDay(filterFrom) : viewStart;
  const rangeEnd = filterTo ? endOfDay(filterTo) : viewEnd;

  let list = sessions.filter((s) => s.status !== 'cancelled');
  if (instructorUserId) list = list.filter((s) => s.instructorId === instructorUserId);
  if (classroomId) list = list.filter((s) => s.classroomId === classroomId);

  return list
    .filter((s) => {
      const start = new Date(s.startDateTime);
      const end = new Date(s.endDateTime);
      return start <= rangeEnd && end >= rangeStart;
    })
    .map((s, idx) => ({
      id: `session-overlay-${s.id}-${idx}`,
      calendarId: 'booked',
      title: getTitle(s),
      category: 'time',
      start: new Date(s.startDateTime),
      end: new Date(s.endDateTime),
      backgroundColor: color,
      borderColor: color,
      color: '#ffffff',
      isReadOnly: true,
      raw: { session: s, type: 'booked' }
    }))
    .sort((a, b) => a.start - b.start);
}

export { DAY_ORDER, DAY_KEYS };
