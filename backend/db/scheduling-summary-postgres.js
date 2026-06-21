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
  const { programId, subjectId, classId, term, year, instructorId, start, end } = params;
  const classIds = await resolveClassIds(prisma, { programId, subjectId, classId, term, year });

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

export const getSchedulingSummary = async (params = {}) => {
  try {
    const {
      programId, subjectId, classId, term, year, instructorId,
      timeRange = 'week', startDate, endDate,
    } = params;
    const { start, end } = resolveDateRange(timeRange, startDate, endDate);
    const today = toDateStr(new Date());

    const sessionWhere = buildSessionWhere({ programId, instructorId, start, end });
    const todayWhere = buildSessionWhere({ programId, instructorId, start: today, end: today });

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
      computeOverviewStats({ programId, subjectId, classId, term, year, instructorId, start, end }),
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

    const todayBreaks = await prisma.breakSession.findMany({
      where: buildBreakWhere({ programId, instructorId, start: today, end: today }),
      include: {
        timeSlot: { select: { startTime: true, endTime: true, labelEn: true, labelAr: true } },
        instructor: { select: { id: true, displayName: true, displayNameAr: true } },
      },
      orderBy: { timeSlot: { sortOrder: 'asc' } },
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
        breakSessions: todayBreaks,
        breakTypeDistribution: breakDistribution.data || [],
        holidayImpact: {
          affectedSessions: holidayImpact.affectedSessions,
          holidayCount: holidayImpact.holidays.length,
        },
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
