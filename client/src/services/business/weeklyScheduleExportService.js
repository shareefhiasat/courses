import { getAllScheduledSessions } from './scheduledSessionService.js';
import { getAllClasses } from './classService.js';
import schedulingSummaryService from './schedulingSummaryService.js';
import { getAllInstructorAvailabilities } from './instructorAvailabilityService.js';
import { getAllTimeSlots } from './timeSlotService.js';

function normalizeTerm(term) {
  if (!term) return '';
  return String(term).trim().toLowerCase();
}

function classMatchesTerm(cls, term) {
  if (!term) return true;
  return normalizeTerm(cls.term) === normalizeTerm(term);
}

function classMatchesYear(cls, year) {
  if (!year) return true;
  return String(cls.year) === String(year);
}

async function fetchAllSessionsForClasses(classIds) {
  if (!classIds.length) return [];

  const classIdSet = new Set(classIds.map(Number));
  const res = await getAllScheduledSessions({ limit: 5000 });
  const all = res?.data || res?.payload || [];

  return all.filter((session) => classIdSet.has(Number(session.classId)));
}

async function resolveProgramClasses({ programId, year, term, classId }) {
  if (!programId && classId) {
    const single = await getAllClasses({ isActive: true });
    const list = single?.data || single?.payload || [];
    const cls = list.find((c) => Number(c.id) === Number(classId));
    if (cls) return [cls];
  }

  if (!programId) return [];

  const classesRes = await getAllClasses({ programId, isActive: true });
  let classes = classesRes?.data || classesRes?.payload || [];

  if (year || term) {
    classes = classes.filter((c) => classMatchesYear(c, year) && classMatchesTerm(c, term));
  }

  return classes;
}

/**
 * Load scheduled sessions, breaks, time slots, and instructor availability for weekly schedule export.
 * Always builds the full program cohort grid (all subjects in year/term), not a single class.
 */
export async function loadWeeklyScheduleSources({ classId, programId, year, term } = {}) {
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

  const cohortClasses = await resolveProgramClasses({
    programId: resolvedProgramId,
    year: resolvedYear,
    term: resolvedTerm,
    classId,
  });

  const classIds = cohortClasses.map((c) => c.id || c.docId).filter(Boolean);

  const [sessions, breaksRes, availRes, timeSlotsRes] = await Promise.all([
    fetchAllSessionsForClasses(classIds),
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
