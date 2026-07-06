import { getAllScheduledSessions } from './scheduledSessionService.js';
import { getAllClasses } from './classService.js';
import schedulingSummaryService from './schedulingSummaryService.js';
import { getAllInstructorAvailabilities } from './instructorAvailabilityService.js';

async function fetchSessionsForExport({ classId, programId }) {
  if (classId) {
    const res = await getAllScheduledSessions({ classId, limit: 500, isActive: true });
    return res?.data || res?.payload || [];
  }

  if (!programId) return [];

  const classesRes = await getAllClasses({ programId, isActive: true });
  const classes = classesRes?.data || classesRes?.payload || [];
  if (!classes.length) return [];

  const results = await Promise.all(
    classes.map((cls) =>
      getAllScheduledSessions({ classId: cls.id || cls.docId, limit: 200, isActive: true })
    )
  );

  const merged = [];
  const seen = new Set();
  results.forEach((res) => {
    (res?.data || res?.payload || []).forEach((session) => {
      const key = weeklySessionKey(session);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(session);
    });
  });
  return merged;
}

function weeklySessionKey(session) {
  const start = new Date(session.startDateTime).toISOString();
  return `${session.classId}-${start}`;
}

/**
 * Load scheduled sessions, breaks, and instructor availability for weekly schedule export.
 */
export async function loadWeeklyScheduleSources({ classId, programId } = {}) {
  const [sessions, breaksRes, availRes] = await Promise.all([
    fetchSessionsForExport({ classId, programId }),
    programId
      ? schedulingSummaryService.getBreakSessions({ programId, limit: 300 })
      : Promise.resolve({ success: true, data: [] }),
    programId || classId
      ? getAllInstructorAvailabilities({
          ...(programId && { programId }),
          ...(classId && { classId }),
          isActive: true,
          limit: 200,
        })
      : Promise.resolve({ success: true, data: [] }),
  ]);

  return {
    sessions,
    breakSessions: breaksRes?.data || breaksRes?.payload || [],
    instructorAvailability: availRes?.data || availRes?.payload || [],
    fromDatabase: sessions.length > 0,
  };
}
