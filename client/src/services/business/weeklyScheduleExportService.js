import { getAllScheduledSessions } from './scheduledSessionService.js';
import { getAllClasses } from './classService.js';
import schedulingSummaryService from './schedulingSummaryService.js';
import { getAllInstructorAvailabilities } from './instructorAvailabilityService.js';
import { getAllTimeSlots } from './timeSlotService.js';
import { getWeeklySchedule } from './attendanceWorkspaceService.js';

function normalizeTerm(term) {
  if (!term) return '';
  return String(term).trim().toLowerCase();
}

function classMatchesTerm(cls, term, termCode) {
  if (!term && !termCode) return true;
  const clsTerm = normalizeTerm(cls.term);
  if (termCode && clsTerm === normalizeTerm(termCode)) return true;
  if (term && clsTerm === normalizeTerm(term)) return true;
  if (term && clsTerm.endsWith(`-${normalizeTerm(term)}`)) return true;
  if (term && clsTerm.includes(normalizeTerm(term))) return true;
  return false;
}

function classMatchesYear(cls, year) {
  if (!year) return true;
  return String(cls.year) === String(year);
}

function classMatchesAcademicTerm(cls, academicTermId, academicTermCode) {
  if (academicTermId && cls.academicTermId) {
    return Number(cls.academicTermId) === Number(academicTermId);
  }
  if (!academicTermCode) return false;
  const code = String(academicTermCode).toUpperCase().replace(/\s+/g, '');
  const clsTerm = String(cls.term || '').toUpperCase().replace(/\s+/g, '');
  if (clsTerm && (code === clsTerm || code.endsWith(clsTerm) || clsTerm.endsWith(code.replace(/^\d+-/, '')))) {
    return true;
  }
  const legacy = `${cls.year || ''}-${cls.term || ''}`.toUpperCase().replace(/\s+/g, '');
  return legacy && legacy !== '-' && code === legacy;
}

async function fetchAllSessionsForClasses(classIds, singleClassId = null) {
  if (!classIds.length) return [];

  const classIdSet = new Set(classIds.map(Number));
  const res = await getAllScheduledSessions({ limit: 5000 });
  const all = res?.data || res?.payload || [];

  // If singleClassId is provided, only return sessions for that class
  if (singleClassId) {
    return all.filter((session) => Number(session.classId) === Number(singleClassId));
  }

  return all.filter((session) => classIdSet.has(Number(session.classId)));
}

async function loadFromAttendanceWorkspace({ programId, academicTermId }) {
  if (!programId) return null;

  const empty = {
    sessions: [],
    breakSessions: [],
    instructorAvailability: [],
    timeSlots: [],
    cohortClasses: [],
    fromDatabase: false,
  };

  const result = await getWeeklySchedule({ programId, academicTermId });
  if (!result?.success || !result.data) return empty;

  const {
    sessions = [],
    timeSlots = [],
    classes = [],
    breakSessions = [],
    instructorAvailability = [],
  } = result.data;

  const programTimeSlots = timeSlots
    .filter((ts) => ts.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return {
    sessions,
    breakSessions,
    instructorAvailability,
    timeSlots: programTimeSlots,
    cohortClasses: classes,
    fromDatabase: sessions.length > 0,
  };
}

async function resolveProgramClasses({
  programId,
  year,
  term,
  classId,
  academicTermId,
  academicTermCode,
}) {
  if (!programId && classId) {
    const single = await getAllClasses({ isActive: true });
    const list = single?.data || single?.payload || [];
    const cls = list.find((c) => Number(c.id) === Number(classId));
    if (cls) return [cls];
  }

  if (!programId) return [];

  const classesRes = await getAllClasses({ programId, isActive: true });
  let classes = classesRes?.data || classesRes?.payload || [];

  if (academicTermId || academicTermCode) {
    const matched = classes.filter((c) => classMatchesAcademicTerm(c, academicTermId, academicTermCode));
    if (matched.length) return matched;
  }

  if (year || term) {
    classes = classes.filter((c) => classMatchesYear(c, year) && classMatchesTerm(c, term, academicTermCode));
  }

  return classes;
}

/**
 * Load scheduled sessions, breaks, time slots, and instructor availability for weekly schedule export.
 * Always builds the full program cohort grid (all subjects in year/term), not a single class.
 */
export async function loadWeeklyScheduleSources({
  classId,
  programId,
  year,
  term,
  academicTermId,
  academicTermCode,
} = {}) {
  let resolvedProgramId = programId;
  let resolvedYear = year;
  let resolvedTerm = term;

  if (classId && !programId) {
    const classesRes = await getAllClasses({ isActive: true });
    const allClasses = classesRes?.data || classesRes?.payload || [];
    const anchor = allClasses.find((c) => Number(c.id) === Number(classId));
    if (anchor) {
      resolvedProgramId = anchor.programId;
      resolvedYear = resolvedYear || anchor.year;
      resolvedTerm = resolvedTerm || anchor.term;
    }
  }

  if (resolvedProgramId && academicTermId) {
    return loadFromAttendanceWorkspace({
      programId: resolvedProgramId,
      academicTermId,
    });
  }

  const cohortClasses = await resolveProgramClasses({
    programId: resolvedProgramId,
    year: resolvedYear,
    term: resolvedTerm,
    classId,
    academicTermId,
    academicTermCode,
  });

  const classIds = cohortClasses.map((c) => c.id || c.docId).filter(Boolean);

  const [sessions, breaksRes, availRes, timeSlotsRes] = await Promise.all([
    fetchAllSessionsForClasses(classIds, classId),
    resolvedProgramId
      ? schedulingSummaryService.getBreakSessions({ programId: resolvedProgramId, limit: 300 })
      : Promise.resolve({ success: true, data: [] }),
    resolvedProgramId || classId
      ? getAllInstructorAvailabilities({
          ...(resolvedProgramId && { programId: resolvedProgramId }),
          ...(classId && !resolvedProgramId && { classId }),
          limit: 500,
        })
      : Promise.resolve({ success: true, data: [] }),
    resolvedProgramId
      ? getAllTimeSlots({ programId: resolvedProgramId, limit: 50 })
      : Promise.resolve({ success: true, data: [] }),
  ]);

  const programTimeSlots = (timeSlotsRes?.data || timeSlotsRes?.payload || [])
    .filter((ts) => ts.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return {
    sessions,
    breakSessions: breaksRes?.data || breaksRes?.payload || [],
    instructorAvailability: availRes?.data || availRes?.payload || [],
    timeSlots: programTimeSlots,
    cohortClasses,
    fromDatabase: sessions.length > 0,
  };
}
