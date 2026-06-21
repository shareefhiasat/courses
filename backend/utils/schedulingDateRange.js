/**
 * Date range helpers for scheduling summary queries.
 */

export function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

/** Prisma DateTime range from YYYY-MM-DD strings */
export function toDateTimeRange(start, end) {
  const range = {};
  if (start) range.gte = toDateStart(start);
  if (end) range.lte = toDateEnd(end);
  return range;
}

export function toDateStart(dateStr) {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function toDateEnd(dateStr) {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T23:59:59.999Z`);
}

/** Holidays overlapping a YYYY-MM-DD date range */
export function buildHolidayOverlapWhere(start, end) {
  const where = { isActive: true };
  if (end) where.startDate = { lte: toDateEnd(end) };
  if (start) where.endDate = { gte: toDateStart(start) };
  return where;
}

export function buildUpcomingHolidayWhere(fromDateStr) {
  return {
    isActive: true,
    startDate: { gte: toDateStart(fromDateStr) },
  };
}

export function resolveDateRange(timeRange = 'week', customStart, customEnd) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  let end = new Date(today);

  switch (timeRange) {
    case 'today':
      break;
    case 'week': {
      start.setDate(today.getDate() - today.getDay());
      break;
    }
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'year':
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) end = new Date(customEnd);
      break;
    default:
      start.setDate(today.getDate() - today.getDay());
  }

  return { start: toDateStr(start), end: toDateStr(end) };
}

export function buildSessionWhere({ programId, instructorId, start, end }) {
  const where = { isCancelled: false, isActive: true };
  if (programId) where.programId = parseInt(programId, 10);
  if (instructorId) where.instructorUserId = parseInt(instructorId, 10);
  if (start || end) {
    where.date = toDateTimeRange(start, end);
  }
  return where;
}

export function buildBreakWhere({ programId, instructorId, start, end }) {
  const where = { isActive: true };
  if (programId) where.programId = parseInt(programId, 10);
  if (instructorId) where.instructorUserId = parseInt(instructorId, 10);
  if (start || end) {
    where.date = toDateTimeRange(start, end);
  }
  return where;
}

/** Resolve class IDs from program/subject/class/term/year filters */
export async function resolveClassIds(prisma, { programId, subjectId, classId, term, year }) {
  if (classId) return [parseInt(classId, 10)];
  const where = { isActive: true };
  if (programId) where.programId = parseInt(programId, 10);
  if (subjectId) where.subjectId = parseInt(subjectId, 10);
  if (term) where.term = term;
  if (year) where.year = String(year);
  if (Object.keys(where).length === 1) return null;
  const classes = await prisma.class.findMany({ where, select: { id: true } });
  return classes.map((c) => c.id);
}
