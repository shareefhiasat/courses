/**
 * Multi-teacher effort report — program, subject, class, term, year, date range.
 */

import prisma from './prismaClient.js';
import { buildLocalizedNameFields } from '../utils/localizedUserName.js';
import { resolveDateRange, toDateStr, toDateTimeRange, resolveClassIds as resolveClassIdsUtil } from '../utils/schedulingDateRange.js';
import { intersectClassIdLists } from '../utils/schedulingScope.js';


const sessionInclude = {
  class: {
    select: {
      id: true, code: true, nameEn: true, nameAr: true, term: true, year: true,
      maxCapacity: true, capacity: true, locationEn: true, locationAr: true,
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  },
  subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  instructor: {
    select: {
      id: true, displayName: true, firstName: true, lastName: true,
      displayNameAr: true, firstNameAr: true, lastNameAr: true,
    },
  },
  classroom: {
    select: {
      id: true, code: true, nameEn: true, nameAr: true, capacity: true,
      locationEn: true, locationAr: true, floor: true, roomNumber: true,
    },
  },
  timeSlot: { select: { startTime: true, endTime: true, durationMinutes: true, labelEn: true, labelAr: true } },
};

const flexInclude = {
  program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  instructor: {
    select: {
      id: true, displayName: true, firstName: true, lastName: true,
      displayNameAr: true, firstNameAr: true, lastNameAr: true,
    },
  },
  classroom: {
    select: {
      id: true, code: true, nameEn: true, nameAr: true, capacity: true,
      locationEn: true, locationAr: true,
    },
  },
  timeSlot: { select: { startTime: true, endTime: true, durationMinutes: true, labelEn: true, labelAr: true } },
};

async function resolveClassIds(params) {
  return resolveClassIdsUtil(prisma, params);
}

function normalizeScheduledCalendarSession(s) {
  const durationMinutes = s.startDateTime && s.endDateTime
    ? Math.max(0, Math.round((new Date(s.endDateTime) - new Date(s.startDateTime)) / 60000))
    : 60;
  return {
    source: 'scheduled',
    sessionId: s.id,
    date: s.startDateTime,
    status: s.status,
    instructorUserId: s.instructorId,
    instructor: s.instructor,
    program: s.class?.program || null,
    subject: s.class?.subject || null,
    class: s.class,
    classroom: s.classroom,
    timeSlot: null,
    durationMinutes,
    location: s.class?.locationEn || s.classroom?.locationEn || s.classroom?.nameEn || null,
    capacity: s.class?.capacity || s.class?.maxCapacity || s.classroom?.capacity || null,
  };
}

const scheduledInclude = {
  class: {
    select: {
      id: true, code: true, nameEn: true, nameAr: true, term: true, year: true,
      maxCapacity: true, capacity: true, locationEn: true, locationAr: true,
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  },
  instructor: {
    select: {
      id: true, displayName: true, firstName: true, lastName: true,
      displayNameAr: true, firstNameAr: true, lastNameAr: true,
    },
  },
  classroom: {
    select: {
      id: true, code: true, nameEn: true, nameAr: true, capacity: true,
      locationEn: true, locationAr: true,
    },
  },
};

function normalizeFlexSession(s, subjectMap) {
  const subject = s.subjectId ? subjectMap[s.subjectId] : null;
  return {
    source: 'flexible',
    sessionId: s.id,
    date: s.date,
    instructorUserId: s.instructorUserId,
    instructor: s.instructor,
    program: s.program,
    subject,
    class: null,
    classroom: s.classroom,
    timeSlot: s.timeSlot,
    durationMinutes: s.timeSlot?.durationMinutes || 0,
    location: s.classroom?.locationEn || s.classroom?.nameEn || null,
    capacity: s.classroom?.capacity || null,
  };
}

function normalizeScheduleSession(s) {
  return {
    source: 'class',
    sessionId: s.id,
    date: s.date,
    instructorUserId: s.instructorUserId,
    instructor: s.instructor,
    program: s.class?.program || null,
    subject: s.subject,
    class: s.class,
    classroom: s.classroom,
    timeSlot: s.timeSlot,
    durationMinutes: s.timeSlot?.durationMinutes || 0,
    location: s.class?.locationEn || s.classroom?.locationEn || s.classroom?.nameEn || null,
    capacity: s.class?.capacity || s.class?.maxCapacity || s.classroom?.capacity || null,
  };
}

export const getEffortReport = async (params = {}) => {
  try {
    const {
      programId, subjectId, classId, term, year, instructorId,
      timeRange = 'month', startDate, endDate, reportFormat = 'summary',
      scopeClassIds = null,
    } = params;

    const { start, end } = resolveDateRange(timeRange, startDate, endDate);
    let classIds = await resolveClassIds({ programId, subjectId, classId, term, year });
    classIds = intersectClassIdLists(classIds, scopeClassIds);

    if (scopeClassIds !== null && scopeClassIds !== undefined && (!classIds || classIds.length === 0)) {
      return {
        success: true,
        data: {
          reportFormat,
          filters: { programId, subjectId, classId, term, year, instructorId, timeRange, start, end },
          totals: { sessionCount: 0, teachingHours: 0, teacherCount: 0, courseCount: 0 },
          teachers: [],
          courses: [],
          chartData: { byTeacher: [], bySubject: [], byProgram: [] },
          generatedAt: new Date().toISOString(),
        },
      };
    }

    const scheduleWhere = {
      isCancelled: false,
      isActive: true,
      date: toDateTimeRange(start, end),
    };
    if (instructorId) scheduleWhere.instructorUserId = parseInt(instructorId, 10);
    if (classIds) scheduleWhere.classId = { in: classIds };
    else if (subjectId) scheduleWhere.subjectId = parseInt(subjectId, 10);

    const scheduledWhere = {
      deletedAt: null,
      isActive: true,
      startDateTime: toDateTimeRange(start, end),
    };
    if (instructorId) scheduledWhere.instructorId = parseInt(instructorId, 10);
    if (classIds) scheduledWhere.classId = { in: classIds };
    else if (subjectId) scheduledWhere.class = { subjectId: parseInt(subjectId, 10) };
    else if (programId) scheduledWhere.class = { programId: parseInt(programId, 10) };

    const flexWhere = {
      isCancelled: false,
      isActive: true,
      date: toDateTimeRange(start, end),
    };
    if (programId) flexWhere.programId = parseInt(programId, 10);
    if (subjectId) flexWhere.subjectId = parseInt(subjectId, 10);
    if (instructorId) flexWhere.instructorUserId = parseInt(instructorId, 10);

    const [scheduleSessions, scheduledCalendarSessions, flexSessions] = await Promise.all([
      prisma.scheduleSession.findMany({ where: scheduleWhere, include: sessionInclude }),
      prisma.scheduledSession.findMany({ where: scheduledWhere, include: scheduledInclude }),
      prisma.flexibleScheduleSession.findMany({ where: flexWhere, include: flexInclude }),
    ]);

    const flexSubjectIds = flexSessions.map((s) => s.subjectId).filter(Boolean);
    const subjects = flexSubjectIds.length
      ? await prisma.subject.findMany({
          where: { id: { in: flexSubjectIds } },
          select: { id: true, code: true, nameEn: true, nameAr: true },
        })
      : [];
    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

    const rows = [
      ...scheduleSessions.map(normalizeScheduleSession),
      ...scheduledCalendarSessions.map(normalizeScheduledCalendarSession),
      ...flexSessions.map((s) => normalizeFlexSession(s, subjectMap)),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const teacherMap = new Map();
    const courseMap = new Map();

    for (const row of rows) {
      const tid = row.instructorUserId;
      if (!teacherMap.has(tid)) {
        const names = buildLocalizedNameFields(row.instructor, 'Unknown');
        teacherMap.set(tid, {
          instructorId: tid,
          instructor: row.instructor,
          instructorName: names.instructorName,
          instructorNameAr: names.instructorNameAr,
          sessionCount: 0,
          teachingMinutes: 0,
          subjects: new Set(),
          classes: new Set(),
          programs: new Set(),
        });
      }
      const t = teacherMap.get(tid);
      t.sessionCount += 1;
      t.teachingMinutes += row.durationMinutes;
      if (row.subject?.id) t.subjects.add(row.subject.id);
      if (row.class?.id) t.classes.add(row.class.id);
      if (row.program?.id) t.programs.add(row.program.id);

      const courseKey = `${row.class?.id || 'flex'}-${row.subject?.id || 'na'}-${row.program?.id || 'na'}`;
      if (!courseMap.has(courseKey)) {
        courseMap.set(courseKey, {
          courseKey,
          class: row.class,
          subject: row.subject,
          program: row.program,
          classroom: row.classroom,
          location: row.location,
          capacity: row.capacity,
          sessionCount: 0,
          teachingMinutes: 0,
          instructors: new Set(),
        });
      }
      const c = courseMap.get(courseKey);
      c.sessionCount += 1;
      c.teachingMinutes += row.durationMinutes;
      c.instructors.add(tid);
    }

    const teachers = [...teacherMap.values()].map((t) => ({
      instructorId: t.instructorId,
      instructor: t.instructor,
      instructorName: t.instructorName,
      instructorNameAr: t.instructorNameAr,
      sessionCount: t.sessionCount,
      teachingHours: Math.round((t.teachingMinutes / 60) * 10) / 10,
      teachingMinutes: t.teachingMinutes,
      subjectCount: t.subjects.size,
      classCount: t.classes.size,
      programCount: t.programs.size,
    }));

    const courses = [...courseMap.values()].map((c) => ({
      class: c.class,
      subject: c.subject,
      program: c.program,
      classroom: c.classroom,
      location: c.location,
      capacity: c.capacity,
      sessionCount: c.sessionCount,
      teachingHours: Math.round((c.teachingMinutes / 60) * 10) / 10,
      instructorCount: c.instructors.size,
    }));

    const totals = {
      sessionCount: rows.length,
      teachingHours: Math.round((rows.reduce((s, r) => s + r.durationMinutes, 0) / 60) * 10) / 10,
      teacherCount: teachers.length,
      courseCount: courses.length,
    };

    return {
      success: true,
      data: {
        reportFormat,
        filters: { programId, subjectId, classId, term, year, instructorId, timeRange, start, end },
        totals,
        teachers: teachers.sort((a, b) => b.sessionCount - a.sessionCount),
        courses: courses.sort((a, b) => b.sessionCount - a.sessionCount),
        sessions: reportFormat === 'breakdown' ? rows : undefined,
        chartData: {
          byTeacher: teachers.map((t) => ({ label: t.instructorName, value: t.sessionCount, hours: t.teachingHours })),
          bySubject: aggregateByField(rows, 'subject', 'nameEn'),
          byProgram: aggregateByField(rows, 'program', 'nameEn'),
        },
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[EffortReport] Error:', error);
    return { success: false, error: error.message };
  }
};

function aggregateByField(rows, field, nameKey) {
  const map = new Map();
  for (const row of rows) {
    const item = row[field];
    if (!item) continue;
    const key = item.id;
    if (!map.has(key)) map.set(key, { label: item[nameKey] || item.code, value: 0, hours: 0 });
    const e = map.get(key);
    e.value += 1;
    e.hours = Math.round((e.hours + row.durationMinutes / 60) * 10) / 10;
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

export default { getEffortReport };
