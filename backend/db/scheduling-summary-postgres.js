/**
 * Scheduling Summary Database Service — aggregated dashboard statistics.
 */

import { PrismaClient } from '@prisma/client';
import { buildLocalizedNameFields } from '../utils/localizedUserName.js';
import {
  resolveDateRange,
  toDateStr,
  toDateTimeRange,
  buildSessionWhere,
  buildBreakWhere,
  buildHolidayOverlapWhere,
  buildUpcomingHolidayWhere,
  resolveClassIds,
} from '../utils/schedulingDateRange.js';
import { intersectClassIdLists } from '../utils/schedulingScope.js';
import { getBreakTypeDistribution } from './break-sessions-postgres.js';

const prisma = new PrismaClient();

async function countSessions(where) {
  return prisma.flexibleScheduleSession.count({ where });
}

async function getHolidayImpact(programId, start, end) {
  const holidayWhere = buildHolidayOverlapWhere(start, end);
  if (programId) {
    holidayWhere.OR = [{ programId: parseInt(programId, 10) }, { programId: null }];
  }

  const holidays = await prisma.holiday.findMany({ where: holidayWhere });
  let affectedSessions = 0;

  for (const holiday of holidays) {
    const hStart = toDateStr(new Date(holiday.startDate));
    const hEnd = toDateStr(new Date(holiday.endDate));
    const sessionWhere = buildSessionWhere({ programId, start: hStart, end: hEnd });
    affectedSessions += await countSessions(sessionWhere);
  }

  return { holidays, affectedSessions };
}

async function computeOverviewStats(params = {}) {
  const { programId, subjectId, classId, term, year, instructorId, start, end, scopeClassIds = null } = params;
  let classIds = await resolveClassIds(prisma, { programId, subjectId, classId, term, year });
  classIds = intersectClassIdLists(classIds, scopeClassIds);

  if (scopeClassIds !== null && scopeClassIds !== undefined && (!classIds || classIds.length === 0)) {
    return {
      totalPrograms: 0,
      totalSubjects: 0,
      totalClasses: 0,
      totalSessions: 0,
      scheduledCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      inProgressCount: 0,
      thisWeekSessions: 0,
      uniqueClassrooms: 0,
      totalClassrooms: 0,
      unusedRooms: 0,
      uniqueInstructors: 0,
      totalInstructors: 0,
      unusedInstructors: 0,
      avgDuration: 0,
    };
  }

  const scheduledWhere = {
    deletedAt: null,
    isActive: true,
    startDateTime: toDateTimeRange(start, end),
  };
  if (instructorId) scheduledWhere.instructorId = parseInt(instructorId, 10);
  if (classIds) scheduledWhere.classId = { in: classIds };
  else if (subjectId) scheduledWhere.class = { subjectId: parseInt(subjectId, 10) };
  else if (programId) scheduledWhere.class = { programId: parseInt(programId, 10) };

  const programWhere = programId ? { id: parseInt(programId, 10), isActive: true } : { isActive: true };
  const subjectWhere = { isActive: true };
  if (programId) subjectWhere.programId = parseInt(programId, 10);
  const classWhere = { isActive: true };
  if (programId) classWhere.programId = parseInt(programId, 10);
  if (subjectId) classWhere.subjectId = parseInt(subjectId, 10);
  if (term) classWhere.term = term;
  if (year) classWhere.year = String(year);
  if (classId) classWhere.id = parseInt(classId, 10);

  const [scheduledSessions, totalPrograms, totalSubjects, totalClasses, totalClassrooms, instructorCount] = await Promise.all([
    prisma.scheduledSession.findMany({
      where: scheduledWhere,
      select: {
        status: true, classroomId: true, instructorId: true, startDateTime: true, endDateTime: true,
      },
    }),
    prisma.program.count({ where: programWhere }),
    prisma.subject.count({ where: subjectWhere }),
    prisma.class.count({ where: classWhere }),
    prisma.classroom.count(),
    prisma.user.count({ where: { roleAssignments: { some: { role: { code: 'INSTRUCTOR' } } } } }),
  ]);

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const usedClassroomIds = new Set(scheduledSessions.filter((s) => s.classroomId).map((s) => s.classroomId));
  const usedInstructorIds = new Set(scheduledSessions.filter((s) => s.instructorId).map((s) => s.instructorId));

  const durations = scheduledSessions.map((s) => {
    if (!s.startDateTime || !s.endDateTime) return 1;
    return Math.max(0, (new Date(s.endDateTime) - new Date(s.startDateTime)) / (1000 * 60 * 60));
  });
  const avgDuration = durations.length
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0;

  return {
    totalPrograms,
    totalSubjects,
    totalClasses,
    totalSessions: scheduledSessions.length,
    scheduledCount: scheduledSessions.filter((s) => s.status === 'scheduled').length,
    completedCount: scheduledSessions.filter((s) => s.status === 'completed').length,
    cancelledCount: scheduledSessions.filter((s) => s.status === 'cancelled').length,
    inProgressCount: scheduledSessions.filter((s) => s.status === 'in_progress').length,
    thisWeekSessions: scheduledSessions.filter((s) => {
      const d = new Date(s.startDateTime);
      return d >= now && d <= oneWeekFromNow;
    }).length,
    uniqueClassrooms: usedClassroomIds.size,
    totalClassrooms,
    unusedRooms: Math.max(0, totalClassrooms - usedClassroomIds.size),
    uniqueInstructors: usedInstructorIds.size,
    totalInstructors: instructorCount,
    unusedInstructors: Math.max(0, instructorCount - usedInstructorIds.size),
    avgDuration,
  };
}

function slotDurationHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

function weeksInRange(start, end) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
}

async function buildScheduledSessionWhere(params) {
  const { programId, subjectId, classId, term, year, instructorId, start, end } = params;
  const classIds = await resolveClassIds(prisma, { programId, subjectId, classId, term, year });
  const where = {
    deletedAt: null,
    isActive: true,
    startDateTime: toDateTimeRange(start, end),
  };
  if (instructorId) where.instructorId = parseInt(instructorId, 10);
  if (classIds) where.classId = { in: classIds };
  else if (subjectId) where.class = { subjectId: parseInt(subjectId, 10) };
  else if (programId) where.class = { programId: parseInt(programId, 10) };
  return where;
}

async function computeWidgetAnalytics(params) {
  const { start, end, overview } = params;
  const sessionWhere = await buildScheduledSessionWhere(params);
  const weeks = weeksInRange(start, end);

  const [timelineSessions, recurrenceSessions, classGroups, instructorSessions, availabilities, holidayData] = await Promise.all([
    prisma.scheduledSession.findMany({
      where: sessionWhere,
      select: { startDateTime: true },
    }),
    prisma.scheduledSession.findMany({
      where: sessionWhere,
      select: { isRecurringInstance: true, recurrenceSeriesId: true, recurrenceType: true },
    }),
    prisma.scheduledSession.groupBy({
      by: ['classId'],
      where: sessionWhere,
      _count: { id: true },
    }),
    prisma.scheduledSession.findMany({
      where: { ...sessionWhere, instructorId: { not: null } },
      select: {
        instructorId: true,
        startDateTime: true,
        endDateTime: true,
        instructor: {
          select: {
            id: true, displayName: true, displayNameAr: true,
            firstName: true, lastName: true, firstNameAr: true, lastNameAr: true,
          },
        },
      },
    }),
    prisma.instructorAvailability.findMany({
      where: { isActive: true },
      include: { slots: true },
    }),
    getHolidayImpact(params.programId, start, end),
  ]);

  const timelineMap = {};
  for (const s of timelineSessions) {
    const d = toDateStr(new Date(s.startDateTime));
    timelineMap[d] = (timelineMap[d] || 0) + 1;
  }
  const sessionTimeline = Object.entries(timelineMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sessionCount]) => ({ date, sessionCount }));

  let recurringCount = 0;
  let oneOffCount = 0;
  for (const s of recurrenceSessions) {
    if (s.isRecurringInstance || s.recurrenceSeriesId || s.recurrenceType) recurringCount += 1;
    else oneOffCount += 1;
  }

  const classWhere = { isActive: true };
  if (params.programId) classWhere.programId = parseInt(params.programId, 10);
  if (params.subjectId) classWhere.subjectId = parseInt(params.subjectId, 10);
  if (params.term) classWhere.term = params.term;
  if (params.year) classWhere.year = String(params.year);
  if (params.classId) classWhere.id = parseInt(params.classId, 10);

  const allClasses = await prisma.class.findMany({
    where: classWhere,
    select: { id: true },
  });
  const classesWithSessions = new Set(classGroups.map((g) => g.classId));

  const instructorHours = new Map();
  for (const s of instructorSessions) {
    const hours = s.startDateTime && s.endDateTime
      ? Math.max(0, (new Date(s.endDateTime) - new Date(s.startDateTime)) / (1000 * 60 * 60))
      : 1;
    const id = s.instructorId;
    if (!instructorHours.has(id)) {
      const names = buildLocalizedNameFields(s.instructor, 'Unknown');
      instructorHours.set(id, {
        instructorId: id,
        instructorName: names.instructorName,
        instructorNameAr: names.instructorNameAr,
        assignedHours: 0,
        capacityHours: 0,
      });
    }
    instructorHours.get(id).assignedHours += hours;
  }

  const capacityByInstructor = new Map();
  for (const av of availabilities) {
    const slotHours = (av.slots || []).reduce((sum, sl) => sum + slotDurationHours(sl.startTime, sl.endTime), 0);
    const weeklyCapacity = av.maxHoursPerWeek || (slotHours * (av.dayOfWeek?.length || 1));
    const prev = capacityByInstructor.get(av.instructorUserId) || 0;
    capacityByInstructor.set(av.instructorUserId, prev + weeklyCapacity * weeks);
  }

  const instructorWorkload = [...instructorHours.values()].map((row) => {
    const capacityHours = Math.round((capacityByInstructor.get(row.instructorId) || weeks * 40) * 10) / 10;
    const assignedHours = Math.round(row.assignedHours * 10) / 10;
    const utilizationPct = capacityHours > 0
      ? Math.round((assignedHours / capacityHours) * 100)
      : 0;
    return {
      ...row,
      assignedHours,
      capacityHours,
      utilizationPct,
      metricLabel: `${assignedHours}h · ${capacityHours}h`,
    };
  }).sort((a, b) => b.assignedHours - a.assignedHours);

  const totalSessions = overview?.totalSessions ?? timelineSessions.length;
  const affected = holidayData.affectedSessions ?? 0;

  const classIds = await resolveClassIds(prisma, params);
  const attendanceWhere = { date: toDateTimeRange(start, end) };
  if (classIds) attendanceWhere.classId = { in: classIds };
  else if (params.programId) attendanceWhere.programId = parseInt(params.programId, 10);
  if (params.subjectId && !classIds) {
    attendanceWhere.class = { subjectId: parseInt(params.subjectId, 10) };
  }

  const standupWhere = { date: toDateTimeRange(start, end) };
  if (params.programId) standupWhere.programId = parseInt(params.programId, 10);

  const isPresentCode = (code) => code === 'PRESENT' || code === 'STANDUP_PRESENT';
  const isAbsentCode = (code) => typeof code === 'string' && code.includes('ABSENT');
  const isLateCode = (code) => typeof code === 'string' && code.includes('LATE');

  const [classAttendanceRows, standupAttendanceRows, sessionInstructors, workflowRows] = await Promise.all([
    prisma.attendance.findMany({
      where: attendanceWhere,
      select: {
        id: true,
        date: true,
        classId: true,
        userId: true,
        status: { select: { nameEn: true, nameAr: true, code: true } },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            programId: true,
            subjectId: true,
            program: { select: { nameEn: true, nameAr: true } },
            subject: { select: { nameEn: true, nameAr: true } },
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            displayNameAr: true,
            studentNumber: true,
          },
        },
        creator: {
          select: {
            displayName: true,
            displayNameAr: true,
          },
        },
      },
    }),
    prisma.standupAttendance.findMany({
      where: standupWhere,
      select: {
        id: true,
        date: true,
        userId: true,
        programId: true,
        status: { select: { nameEn: true, nameAr: true, code: true } },
        program: { select: { nameEn: true, nameAr: true } },
        user: {
          select: {
            id: true,
            displayName: true,
            displayNameAr: true,
            studentNumber: true,
          },
        },
        creator: {
          select: {
            displayName: true,
            displayNameAr: true,
          },
        },
      },
    }),
    prisma.scheduledSession.findMany({
      where: { ...sessionWhere, instructorId: { not: null } },
      select: {
        classId: true,
        instructor: {
          select: {
            id: true, displayName: true, displayNameAr: true,
            firstName: true, lastName: true, firstNameAr: true, lastNameAr: true,
          },
        },
      },
    }),
    prisma.workflowDocument.findMany({
      where: { createdAt: toDateTimeRange(start, end) },
      select: {
        status: true,
        workflowType: true,
        program: true,
        createdAt: true,
        instructor: {
          select: {
            displayName: true, displayNameAr: true,
            firstName: true, lastName: true, firstNameAr: true, lastNameAr: true,
          },
        },
      },
    }),
  ]);

  const classInstructor = new Map();
  for (const s of sessionInstructors) {
    if (s.classId && !classInstructor.has(s.classId)) {
      classInstructor.set(s.classId, buildLocalizedNameFields(s.instructor, 'Unassigned'));
    }
  }

  const attendanceRecords = [];
  const bump = (map, key, init, inc = 1) => {
    if (!map.has(key)) map.set(key, { ...init });
    map.get(key).recordCount = (map.get(key).recordCount || 0) + inc;
  };

  const combinedStatusMap = new Map();
  const classStatusMap = new Map();
  const dailyStatusMap = new Map();
  const combinedProgramMap = new Map();
  const classProgramMap = new Map();
  const dailyProgramMap = new Map();
  const classInstructorMap = new Map();
  const classNameMap = new Map();
  const classTimelineMap = new Map();
  const dailyTimelineMap = new Map();
  const combinedTimelineMap = new Map();
  const typeMap = new Map();

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  const uniqueStudents = new Set();
  const uniqueClasses = new Set();

  for (const row of classAttendanceRows) {
    const code = row.status?.code || 'unknown';
    const status = row.status?.nameEn || code;
    const statusAr = row.status?.nameAr || status;
    const programName = row.class?.program?.nameEn || `Program ${row.class?.programId || '—'}`;
    const programAr = row.class?.program?.nameAr || programName;
    const subjectName = row.class?.subject?.nameEn || '—';
    const className = row.class?.nameEn || `Class ${row.classId}`;
    const classNameAr = row.class?.nameAr || className;
    const inst = classInstructor.get(row.classId) || { instructorName: 'Unassigned', instructorNameAr: 'غير معين' };
    const instructorName = inst.instructorName || 'Unassigned';
    const instructorNameAr = inst.instructorNameAr || instructorName;
    const studentNames = buildLocalizedNameFields(row.user, `Student ${row.userId}`);
    const creatorNames = buildLocalizedNameFields(row.creator, '—');
    const dateStr = toDateStr(new Date(row.date));

    uniqueStudents.add(row.userId);
    uniqueClasses.add(row.classId);
    if (isPresentCode(code)) presentCount += 1;
    if (isAbsentCode(code)) absentCount += 1;
    if (isLateCode(code)) lateCount += 1;

    attendanceRecords.push({
      id: row.id,
      attendanceType: 'class',
      attendanceTypeLabel: 'Class attendance',
      date: dateStr,
      status,
      statusAr,
      statusCode: code,
      programName,
      programNameAr: programAr,
      subjectName,
      className,
      classNameAr,
      instructorName,
      instructorNameAr,
      studentName: studentNames.studentName,
      studentNameAr: studentNames.studentNameAr,
      studentNumber: row.user?.studentNumber || '—',
      markedBy: creatorNames.instructorName,
      markedByAr: creatorNames.instructorNameAr,
    });

    bump(combinedStatusMap, status, { status, statusAr });
    bump(classStatusMap, status, { status, statusAr });
    bump(combinedProgramMap, programName, { programName, programNameAr: programAr });
    bump(classProgramMap, programName, { programName, programNameAr: programAr });
    bump(classInstructorMap, instructorName, { instructorName, instructorNameAr });
    bump(classNameMap, className, { className, classNameAr });
    bump(classTimelineMap, dateStr, { date: dateStr });
    bump(combinedTimelineMap, dateStr, { date: dateStr });
    bump(typeMap, 'class', { attendanceType: 'class', attendanceTypeLabel: 'Class attendance' });
  }

  for (const row of standupAttendanceRows) {
    const code = row.status?.code || 'unknown';
    const status = row.status?.nameEn || code;
    const statusAr = row.status?.nameAr || status;
    const programName = row.program?.nameEn || `Program ${row.programId || '—'}`;
    const programAr = row.program?.nameAr || programName;
    const studentNames = buildLocalizedNameFields(row.user, `Student ${row.userId}`);
    const creatorNames = buildLocalizedNameFields(row.creator, '—');
    const dateStr = toDateStr(new Date(row.date));

    uniqueStudents.add(row.userId);
    if (isPresentCode(code)) presentCount += 1;
    if (isAbsentCode(code)) absentCount += 1;
    if (isLateCode(code)) lateCount += 1;

    attendanceRecords.push({
      id: `standup-${row.id}`,
      attendanceType: 'daily',
      attendanceTypeLabel: 'Daily attendance',
      date: dateStr,
      status,
      statusAr,
      statusCode: code,
      programName,
      programNameAr: programAr,
      subjectName: '—',
      className: '—',
      classNameAr: '—',
      instructorName: '—',
      instructorNameAr: '—',
      studentName: studentNames.studentName,
      studentNameAr: studentNames.studentNameAr,
      studentNumber: row.user?.studentNumber || '—',
      markedBy: creatorNames.instructorName,
      markedByAr: creatorNames.instructorNameAr,
    });

    bump(combinedStatusMap, status, { status, statusAr });
    bump(dailyStatusMap, status, { status, statusAr });
    bump(combinedProgramMap, programName, { programName, programNameAr: programAr });
    bump(dailyProgramMap, programName, { programName, programNameAr: programAr });
    bump(dailyTimelineMap, dateStr, { date: dateStr });
    bump(combinedTimelineMap, dateStr, { date: dateStr });
    bump(typeMap, 'daily', { attendanceType: 'daily', attendanceTypeLabel: 'Daily attendance' });
  }

  const toSorted = (map) => [...map.values()].sort((a, b) => (b.recordCount || 0) - (a.recordCount || 0));
  const toTimeline = (map) => [...map.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const attendanceByStatus = toSorted(combinedStatusMap);
  const classAttendanceByStatus = toSorted(classStatusMap);
  const dailyAttendanceByStatus = toSorted(dailyStatusMap);
  const attendanceByProgram = toSorted(combinedProgramMap);
  const classAttendanceByProgram = toSorted(classProgramMap);
  const dailyAttendanceByProgram = toSorted(dailyProgramMap);
  const attendanceByInstructor = toSorted(classInstructorMap);
  const classAttendanceByClass = toSorted(classNameMap);
  const attendanceTimeline = toTimeline(combinedTimelineMap);
  const classAttendanceTimeline = toTimeline(classTimelineMap);
  const dailyAttendanceTimeline = toTimeline(dailyTimelineMap);
  const attendanceByType = toSorted(typeMap);

  const workflowStatusMap = new Map();
  const workflowTypeMap = new Map();
  const workflowProgramMap = new Map();
  const workflowTimelineMap = new Map();
  for (const row of workflowRows) {
    const status = row.status || 'UNKNOWN';
    workflowStatusMap.set(status, {
      status,
      documentCount: (workflowStatusMap.get(status)?.documentCount || 0) + 1,
    });
    const wType = row.workflowType || 'UNKNOWN';
    workflowTypeMap.set(wType, {
      workflowType: wType,
      documentCount: (workflowTypeMap.get(wType)?.documentCount || 0) + 1,
    });
    const program = row.program || 'Unassigned';
    workflowProgramMap.set(program, {
      program,
      documentCount: (workflowProgramMap.get(program)?.documentCount || 0) + 1,
    });
    const d = toDateStr(new Date(row.createdAt));
    workflowTimelineMap.set(d, (workflowTimelineMap.get(d) || 0) + 1);
  }

  const workflowByStatus = [...workflowStatusMap.values()];
  const workflowByType = [...workflowTypeMap.values()];
  const workflowByProgram = [...workflowProgramMap.values()].sort((a, b) => b.documentCount - a.documentCount);
  const workflowTimeline = [...workflowTimelineMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, documentCount]) => ({ date, documentCount }));

  return {
    sessionTimeline,
    recurrenceBreakdown: [
      { recurrenceType: 'recurring', sessionCount: recurringCount },
      { recurrenceType: 'one_off', sessionCount: oneOffCount },
    ],
    classCoverage: [
      { coverageType: 'with_sessions', classCount: classesWithSessions.size },
      { coverageType: 'without_sessions', classCount: Math.max(0, allClasses.length - classesWithSessions.size) },
    ],
    instructorWorkload,
    holidayOverlap: [
      { impactType: 'affected_by_holiday', sessionCount: affected },
      { impactType: 'unaffected', sessionCount: Math.max(0, totalSessions - affected) },
    ],
    holidayCount: holidayData.holidays?.length ?? 0,
    attendanceOverview: {
      totalRecords: attendanceRecords.length,
      classRecords: classAttendanceRows.length,
      dailyRecords: standupAttendanceRows.length,
      presentCount,
      absentCount,
      lateCount,
      uniqueStudents: uniqueStudents.size,
      uniqueClasses: uniqueClasses.size,
      statusTypes: combinedStatusMap.size,
      programs: combinedProgramMap.size,
    },
    attendanceRecords,
    attendanceByStatus,
    classAttendanceByStatus,
    dailyAttendanceByStatus,
    attendanceByProgram,
    classAttendanceByProgram,
    dailyAttendanceByProgram,
    attendanceByInstructor,
    classAttendanceByClass,
    attendanceByType,
    attendanceTimeline,
    classAttendanceTimeline,
    dailyAttendanceTimeline,
    workflowOverview: {
      totalDocuments: workflowRows.length,
      statusTypes: workflowByStatus.length,
      workflowTypes: workflowByType.length,
    },
    workflowByStatus,
    workflowByType,
    workflowByProgram,
    workflowTimeline,
  };
}

export const getSchedulingSummary = async (params = {}) => {
  try {
    const {
      programId, subjectId, classId, term, year, instructorId,
      timeRange = 'week', startDate, endDate, scopeClassIds = null,
    } = params;
    const { start, end } = resolveDateRange(timeRange, startDate, endDate);
    const today = toDateStr(new Date());

    let scopedClassIds = await resolveClassIds(prisma, { programId, subjectId, classId, term, year });
    scopedClassIds = intersectClassIdLists(scopedClassIds, scopeClassIds);

    if (scopeClassIds !== null && scopeClassIds !== undefined && (!scopedClassIds || scopedClassIds.length === 0)) {
      return {
        success: true,
        data: {
          overview: await computeOverviewStats({ ...params, start, end, scopeClassIds }),
          todaySchedule: [],
          breakSessions: [],
          holidays: [],
          holidayImpact: { holidays: 0, affectedSessions: 0 },
          breakTypeDistribution: [],
          teacherLoad: [],
          subjectSessions: [],
        },
      };
    }

    const sessionWhere = buildSessionWhere({ programId, instructorId, start, end });
    const todayWhere = buildSessionWhere({ programId, instructorId, start: today, end: today });

    if (scopedClassIds?.length) {
      const programRows = await prisma.class.findMany({
        where: { id: { in: scopedClassIds } },
        select: { programId: true },
      });
      const allowedProgramIds = [...new Set(programRows.map((r) => r.programId).filter(Boolean))];
      if (allowedProgramIds.length) {
        sessionWhere.programId = { in: allowedProgramIds };
        todayWhere.programId = { in: allowedProgramIds };
      }
    }

    const [
      totalTeachers,
      activeTeachers,
      totalSubjects,
      totalCategories,
      totalClassrooms,
      availableClassrooms,
      rangeSessions,
      todaySessions,
      teacherLoadData,
      subjectSessionsData,
      holidays,
      breakDistribution,
      holidayImpact,
      overview,
    ] = await Promise.all([
      prisma.user.count({
        where: { roleAssignments: { some: { role: { code: 'INSTRUCTOR' } } } },
      }),
      prisma.user.count({
        where: { roleAssignments: { some: { role: { code: 'INSTRUCTOR' } } }, isActive: true },
      }),
      prisma.subject.count(programId ? { where: { programId: parseInt(programId, 10) } } : undefined),
      prisma.categoryTypes.count(),
      prisma.classroom.count(),
      prisma.classroom.count({ where: { status: 'Available' } }),
      countSessions(sessionWhere),
      prisma.flexibleScheduleSession.findMany({
        where: todayWhere,
        include: {
          program: { select: { id: true, nameEn: true, nameAr: true } },
          instructor: {
            select: { id: true, displayName: true, firstName: true, lastName: true, displayNameAr: true },
          },
          classroom: { select: { id: true, nameEn: true, nameAr: true } },
          timeSlot: { select: { startTime: true, endTime: true, labelEn: true, labelAr: true } },
        },
        orderBy: { timeSlot: { sortOrder: 'asc' } },
      }),
      prisma.flexibleScheduleSession.groupBy({
        by: ['instructorUserId'],
        where: sessionWhere,
        _count: { id: true },
      }),
      prisma.flexibleScheduleSession.groupBy({
        by: ['subjectId'],
        where: { ...sessionWhere, subjectId: { not: null } },
        _count: { id: true },
      }),
      prisma.holiday.findMany({
        where: {
          ...buildUpcomingHolidayWhere(today),
          ...(programId && { OR: [{ programId: parseInt(programId, 10) }, { programId: null }] }),
        },
        orderBy: { startDate: 'asc' },
        take: 5,
      }),
      getBreakTypeDistribution({ programId, instructorId, start, end }),
      getHolidayImpact(programId, start, end),
      computeOverviewStats({ programId, subjectId, classId, term, year, instructorId, start, end, scopeClassIds }),
    ]);

    const subjectIds = subjectSessionsData.map((s) => s.subjectId).filter(Boolean);
    const subjects = subjectIds.length
      ? await prisma.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, nameEn: true, nameAr: true },
        })
      : [];
    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

    const teacherLoad = await Promise.all(
      teacherLoadData.map(async (tl) => {
        const instructor = await prisma.user.findUnique({
          where: { id: tl.instructorUserId },
          select: {
            id: true, displayName: true, firstName: true, lastName: true,
            displayNameAr: true, firstNameAr: true, lastNameAr: true,
          },
        });
        const names = buildLocalizedNameFields(instructor, 'Unknown');
        return {
          instructorId: tl.instructorUserId,
          instructor,
          instructorName: names.instructorName,
          instructorNameAr: names.instructorNameAr,
          sessionCount: tl._count.id,
        };
      }),
    );

    const subjectSessions = subjectSessionsData.map((ss) => ({
      subjectId: ss.subjectId,
      subjectNameEn: subjectMap[ss.subjectId]?.nameEn || 'Unknown',
      subjectNameAr: subjectMap[ss.subjectId]?.nameAr || 'Unknown',
      sessionCount: ss._count.id,
    }));

    const rangeBreaks = await prisma.breakSession.findMany({
      where: buildBreakWhere({ programId, instructorId, start, end }),
      include: {
        timeSlot: { select: { startTime: true, endTime: true, labelEn: true, labelAr: true } },
        instructor: { select: { id: true, displayName: true, displayNameAr: true } },
      },
      orderBy: [{ date: 'asc' }, { timeSlot: { sortOrder: 'asc' } }],
    });

    const enrichedTodaySessions = await Promise.all(
      todaySessions.map(async (s) => {
        if (!s.subjectId) return { ...s, subject: null };
        const subject = await prisma.subject.findUnique({
          where: { id: s.subjectId },
          select: { nameEn: true, nameAr: true },
        });
        return { ...s, subject };
      }),
    );

    const widgetAnalytics = await computeWidgetAnalytics({
      programId, subjectId, classId, term, year, instructorId, start, end, overview,
    });

    return {
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        totalSubjects,
        totalCategories,
        totalClassrooms,
        availableClassrooms,
        rangeSessions,
        weekSessions: rangeSessions,
        monthSessions: rangeSessions,
        yearSessions: rangeSessions,
        todaySchedule: enrichedTodaySessions,
        holidays,
        teacherLoad,
        subjectSessions,
        breakSessions: rangeBreaks,
        breakTypeDistribution: breakDistribution.data || [],
        holidayImpact: {
          affectedSessions: holidayImpact.affectedSessions,
          holidayCount: holidayImpact.holidays.length,
        },
        widgetAnalytics,
        overview,
        dateRange: { start, end, timeRange },
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[SchedulingSummary] Error:', error);
    return { success: false, error: error.message };
  }
};

export const getBreakSessionSummary = async (params = {}) => {
  try {
    const { programId, instructorId, timeRange = 'week', startDate, endDate } = params;
    const { start, end } = resolveDateRange(timeRange, startDate, endDate);

    const [breaks, distribution] = await Promise.all([
      prisma.breakSession.findMany({
        where: buildBreakWhere({ programId, instructorId, start, end }),
        include: {
          timeSlot: { select: { startTime: true, endTime: true, labelEn: true, labelAr: true } },
          instructor: { select: { id: true, displayName: true, displayNameAr: true } },
        },
        orderBy: [{ date: 'asc' }, { timeSlot: { sortOrder: 'asc' } }],
      }),
      getBreakTypeDistribution({ programId, instructorId, start, end }),
    ]);

    return {
      success: true,
      data: {
        breaks,
        distribution: distribution.data || [],
        total: breaks.length,
        dateRange: { start, end },
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getHolidaySummary = async (params = {}) => {
  try {
    const { programId, timeRange = 'month', startDate, endDate } = params;
    const { start, end } = resolveDateRange(timeRange, startDate, endDate);
    const today = toDateStr(new Date());

    const where = buildHolidayOverlapWhere(start, end);
    if (programId) {
      where.OR = [{ programId: parseInt(programId, 10) }, { programId: null }];
    }

    const [holidays, upcoming, impact] = await Promise.all([
      prisma.holiday.findMany({ where, orderBy: { startDate: 'asc' } }),
      prisma.holiday.findMany({
        where: {
          ...buildUpcomingHolidayWhere(today),
          ...(programId && { OR: where.OR }),
        },
        orderBy: { startDate: 'asc' },
        take: 5,
      }),
      getHolidayImpact(programId, start, end),
    ]);

    return {
      success: true,
      data: {
        holidays,
        upcoming,
        affectedSessions: impact.affectedSessions,
        dateRange: { start, end },
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getTeacherWorkloadSummary = async (params = {}) => {
  try {
    const { programId, timeRange = 'month', startDate, endDate } = params;
    const { start, end } = resolveDateRange(timeRange, startDate, endDate);
    const sessionWhere = buildSessionWhere({ programId, start, end });

    const grouped = await prisma.flexibleScheduleSession.groupBy({
      by: ['instructorUserId'],
      where: sessionWhere,
      _count: { id: true },
    });

    const workloads = await Promise.all(
      grouped.map(async (g) => {
        const instructor = await prisma.user.findUnique({
          where: { id: g.instructorUserId },
          select: {
            id: true, displayName: true, firstName: true, lastName: true,
            displayNameAr: true, firstNameAr: true, lastNameAr: true,
          },
        });
        const names = buildLocalizedNameFields(instructor, 'Unknown');
        const sessions = await prisma.flexibleScheduleSession.findMany({
          where: { ...sessionWhere, instructorUserId: g.instructorUserId },
          include: { timeSlot: { select: { durationMinutes: true } } },
        });
        const teachingMinutes = sessions.reduce((sum, s) => sum + (s.timeSlot?.durationMinutes || 0), 0);
        return {
          instructorId: g.instructorUserId,
          instructor,
          instructorName: names.instructorName,
          instructorNameAr: names.instructorNameAr,
          sessionCount: g._count.id,
          teachingHours: Math.round((teachingMinutes / 60) * 10) / 10,
        };
      }),
    );

    return { success: true, data: workloads };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getClassroomUtilizationSummary = async (params = {}) => {
  try {
    const { programId, timeRange = 'month', startDate, endDate } = params;
    const { start, end } = resolveDateRange(timeRange, startDate, endDate);
    const sessionWhere = buildSessionWhere({ programId, start, end });

    const grouped = await prisma.flexibleScheduleSession.groupBy({
      by: ['classroomId'],
      where: { ...sessionWhere, classroomId: { not: null } },
      _count: { id: true },
    });

    const utilization = await Promise.all(
      grouped.map(async (g) => {
        const classroom = await prisma.classroom.findUnique({
          where: { id: g.classroomId },
          select: { id: true, code: true, nameEn: true, nameAr: true, capacity: true },
        });
        return {
          classroomId: g.classroomId,
          classroom,
          sessionCount: g._count.id,
        };
      }),
    );

    return { success: true, data: utilization };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  getSchedulingSummary,
  getBreakSessionSummary,
  getHolidaySummary,
  getTeacherWorkloadSummary,
  getClassroomUtilizationSummary,
};
