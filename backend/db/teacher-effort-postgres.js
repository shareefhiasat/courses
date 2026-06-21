/**
 * Teacher Effort Report Database Service
 */

import { PrismaClient } from '@prisma/client';
import { buildLocalizedNameFields } from '../utils/localizedUserName.js';
import { resolveDateRange, toDateStr, buildSessionWhere, buildBreakWhere, buildHolidayOverlapWhere } from '../utils/schedulingDateRange.js';

const prisma = new PrismaClient();

async function getHolidayImpactForTeacher(instructorUserId, programId, start, end) {
  const holidayWhere = buildHolidayOverlapWhere(start, end);
  if (programId) {
    holidayWhere.OR = [{ programId: parseInt(programId, 10) }, { programId: null }];
  }

  const holidays = await prisma.holiday.findMany({ where: holidayWhere });
  let missedSessions = 0;

  for (const holiday of holidays) {
    const hStart = toDateStr(new Date(holiday.startDate));
    const hEnd = toDateStr(new Date(holiday.endDate));
    missedSessions += await prisma.flexibleScheduleSession.count({
      where: buildSessionWhere({
        programId,
        instructorId: instructorUserId,
        start: hStart,
        end: hEnd,
      }),
    });
  }

  return { holidays, missedSessions };
}

export const getTeacherEffortSummary = async (teacherUserId, params = {}) => {
  try {
    const id = parseInt(teacherUserId, 10);
    const { programId, timeRange = 'month', startDate, endDate } = params;
    const { start, end } = resolveDateRange(timeRange, startDate, endDate);
    const sessionWhere = buildSessionWhere({ programId, instructorId: id, start, end });

    const instructor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, displayName: true, firstName: true, lastName: true,
        displayNameAr: true, firstNameAr: true, lastNameAr: true,
        email: true,
      },
    });

    if (!instructor) {
      return { success: false, error: 'Teacher not found' };
    }

    const names = buildLocalizedNameFields(instructor, 'Unknown');

    const [sessions, breakSessions, subjectGrouped, classroomGrouped, holidayImpact] = await Promise.all([
      prisma.flexibleScheduleSession.findMany({
        where: sessionWhere,
        include: {
          program: { select: { id: true, nameEn: true, nameAr: true, code: true } },
          classroom: { select: { id: true, nameEn: true, nameAr: true, code: true } },
          timeSlot: { select: { startTime: true, endTime: true, durationMinutes: true, labelEn: true, labelAr: true } },
        },
        orderBy: [{ date: 'asc' }, { timeSlot: { sortOrder: 'asc' } }],
      }),
      prisma.breakSession.findMany({
        where: buildBreakWhere({ programId, instructorId: id, start, end }),
        include: { timeSlot: { select: { startTime: true, endTime: true, labelEn: true, labelAr: true } } },
      }),
      prisma.flexibleScheduleSession.groupBy({
        by: ['subjectId'],
        where: { ...sessionWhere, subjectId: { not: null } },
        _count: { id: true },
      }),
      prisma.flexibleScheduleSession.groupBy({
        by: ['classroomId'],
        where: { ...sessionWhere, classroomId: { not: null } },
        _count: { id: true },
      }),
      getHolidayImpactForTeacher(id, programId, start, end),
    ]);

    const subjectIds = subjectGrouped.map((s) => s.subjectId).filter(Boolean);
    const subjects = subjectIds.length
      ? await prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, nameEn: true, nameAr: true } })
      : [];
    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

    const classroomIds = classroomGrouped.map((c) => c.classroomId).filter(Boolean);
    const classrooms = classroomIds.length
      ? await prisma.classroom.findMany({ where: { id: { in: classroomIds } }, select: { id: true, nameEn: true, nameAr: true, code: true } })
      : [];
    const classroomMap = Object.fromEntries(classrooms.map((c) => [c.id, c]));

    const teachingMinutes = sessions.reduce((sum, s) => sum + (s.timeSlot?.durationMinutes || 0), 0);
    const breakByType = breakSessions.reduce((acc, b) => {
      acc[b.breakType] = (acc[b.breakType] || 0) + 1;
      return acc;
    }, {});

    const enrichedSessions = await Promise.all(
      sessions.map(async (s) => {
        const subject = s.subjectId
          ? await prisma.subject.findUnique({ where: { id: s.subjectId }, select: { nameEn: true, nameAr: true } })
          : null;
        return { ...s, subject };
      }),
    );

    return {
      success: true,
      data: {
        teacher: {
          ...instructor,
          instructorName: names.instructorName,
          instructorNameAr: names.instructorNameAr,
        },
        summary: {
          totalSessions: sessions.length,
          totalBreaks: breakSessions.length,
          teachingHours: Math.round((teachingMinutes / 60) * 10) / 10,
          holidaysAffected: holidayImpact.holidays.length,
          sessionsMissedDueToHolidays: holidayImpact.missedSessions,
        },
        sessions: enrichedSessions,
        breakSessions,
        breakByType: Object.entries(breakByType).map(([breakType, count]) => ({ breakType, count })),
        subjectDistribution: subjectGrouped.map((s) => ({
          subjectId: s.subjectId,
          subjectNameEn: subjectMap[s.subjectId]?.nameEn || 'Unknown',
          subjectNameAr: subjectMap[s.subjectId]?.nameAr || 'Unknown',
          sessionCount: s._count.id,
        })),
        classroomUtilization: classroomGrouped.map((c) => ({
          classroomId: c.classroomId,
          classroom: classroomMap[c.classroomId] || null,
          sessionCount: c._count.id,
        })),
        holidayImpact: {
          holidays: holidayImpact.holidays,
          missedSessions: holidayImpact.missedSessions,
        },
        dateRange: { start, end, timeRange },
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[TeacherEffort] Error:', error);
    return { success: false, error: error.message };
  }
};

export const exportTeacherEffortCSV = async (teacherUserId, params = {}) => {
  const result = await getTeacherEffortSummary(teacherUserId, params);
  if (!result.success) return result;

  const { data } = result;
  const lines = [
  'Section,Field,Value',
  `Summary,Teacher,${data.teacher.instructorName}`,
  `Summary,Total Sessions,${data.summary.totalSessions}`,
  `Summary,Teaching Hours,${data.summary.teachingHours}`,
  `Summary,Total Breaks,${data.summary.totalBreaks}`,
  `Summary,Sessions Missed (Holidays),${data.summary.sessionsMissedDueToHolidays}`,
  '',
  'Sessions,Date,Subject,Time,Classroom',
  ...data.sessions.map((s) =>
    [
      'Session',
      toDateStr(new Date(s.date)),
      s.subject?.nameEn || '',
      `${s.timeSlot?.startTime}-${s.timeSlot?.endTime}`,
      s.classroom?.nameEn || '',
    ].join(','),
  ),
  '',
  'Breaks,Type,Date,Time',
  ...data.breakSessions.map((b) =>
    ['Break', b.breakType, toDateStr(new Date(b.date)), `${b.timeSlot?.startTime}-${b.timeSlot?.endTime}`].join(','),
  ),
  ];

  return { success: true, data: lines.join('\n'), filename: `teacher-effort-${teacherUserId}.csv` };
};

export default {
  getTeacherEffortSummary,
  exportTeacherEffortCSV,
};
