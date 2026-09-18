import prisma from '../db/prismaClient.js';
import { USER_NAME_SELECT } from '../utils/userNameFields.js';
import {
  isPresentStatus,
  isLateStatus,
  isAbsentStatus,
  isExcusedStatus,
  isHumanCaseStatus,
} from '../constants/attendanceConstants.js';

const SESSION_INCLUDE = {
  class: {
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      instructorId: true,
      subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  },
  instructor: {
    select: {
      id: true,
      displayName: true,
      firstName: true,
      lastName: true,
      displayNameAr: true,
      firstNameAr: true,
      lastNameAr: true,
      rankEn: true,
      rankAr: true,
    },
  },
  classroom: {
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      locationEn: true,
      locationAr: true,
    },
  },
};

function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/\s+/g, '');
}

function classMatchesTerm(cls, term) {
  if (!term) return true;
  if (cls.academicTermId === term.id) return true;
  if (cls.academicTermId) return false;
  if (!cls.year && !cls.term) return false;
  const legacyCode = normalizeCode(`${cls.year}-${cls.term}`);
  const termCode = normalizeCode(term.code);
  if (legacyCode === termCode) return true;
  if (termCode.includes(normalizeCode(cls.year)) && term.nameEn?.toLowerCase().includes(String(cls.term || '').toLowerCase())) {
    return true;
  }
  return term.nameEn?.includes(cls.year) && (!cls.term || term.nameEn?.toLowerCase().includes(String(cls.term).toLowerCase()));
}

async function getClassesForProgramTerm({ programId, academicTermId, instructorId }) {
  const pid = parseInt(programId);
  const classes = await prisma.class.findMany({
    where: {
      programId: pid,
      isActive: true,
      ...(instructorId && { instructorId: parseInt(instructorId) }),
    },
    include: {
      academicTerm: {
        select: { id: true, code: true, nameEn: true, nameAr: true, isActive: true },
      },
      subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      instructor: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          displayNameAr: true,
          firstNameAr: true,
          lastNameAr: true,
        },
      },
      classroom: {
        select: { id: true, code: true, nameEn: true, nameAr: true },
      },
    },
    orderBy: { code: 'asc' },
  });

  if (!academicTermId) return classes;

  const term = await prisma.academicTerms.findUnique({
    where: { id: parseInt(academicTermId) },
  });
  if (!term) return classes;

  return classes.filter((cls) => classMatchesTerm(cls, term));
}

/**
 * Get instructor's programs (distinct programs from classes they teach)
 */
export const getInstructorPrograms = async (instructorId) => {
  try {
    const id = parseInt(instructorId, 10);
    const [fromClasses, fromSessions] = await Promise.all([
      prisma.class.findMany({
        where: { instructorId: id, isActive: true },
        select: {
          program: {
            select: { id: true, code: true, nameEn: true, nameAr: true },
          },
        },
        distinct: ['programId'],
      }),
      prisma.scheduledSession.findMany({
        where: { instructorId: id, isActive: true, class: { isActive: true } },
        select: {
          class: {
            select: {
              program: {
                select: { id: true, code: true, nameEn: true, nameAr: true },
              },
            },
          },
        },
        distinct: ['classId'],
      }),
    ]);

    const programs = [...fromClasses, ...fromSessions]
      .map((row) => row.program || row.class?.program)
      .filter(Boolean)
      .filter((p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx)
      .sort((a, b) => (a.nameEn || '').localeCompare(b.nameEn || ''));

    return { success: true, data: programs };
  } catch (err) {
    console.error('[attendance-workspace-postgres] getInstructorPrograms:', err);
    return { success: false, error: 'Internal server error' };
  }
};

/**
 * Get all programs (for admin/super_admin)
 */
export const getAllPrograms = async () => {
  try {
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      select: { id: true, code: true, nameEn: true, nameAr: true },
      orderBy: { nameEn: 'asc' },
    });
    return { success: true, data: programs };
  } catch (err) {
    console.error('[attendance-workspace-postgres] getAllPrograms:', err);
    return { success: false, error: 'Internal server error' };
  }
};

/**
 * Academic terms available for a program (FK on Class, with legacy year/term fallback)
 */
export const getProgramTerms = async ({ programId, instructorId }) => {
  try {
    const pid = parseInt(programId);
    const classes = await prisma.class.findMany({
      where: {
        programId: pid,
        isActive: true,
        ...(instructorId && { instructorId: parseInt(instructorId) }),
      },
      select: {
        id: true,
        academicTermId: true,
        year: true,
        term: true,
        academicTerm: {
          select: { id: true, code: true, nameEn: true, nameAr: true, isActive: true },
        },
      },
    });

    const allTerms = await prisma.academicTerms.findMany({
      where: { isActive: true },
      orderBy: { code: 'desc' },
    });

    const termMap = new Map();

    for (const cls of classes) {
      let term = cls.academicTerm;
      if (!term) {
        term = allTerms.find((t) => classMatchesTerm(cls, t));
      }
      if (!term) continue;
      const existing = termMap.get(term.id);
      if (existing) {
        existing.classCount += 1;
      } else {
        termMap.set(term.id, { ...term, classCount: 1 });
      }
    }

    if (termMap.size === 0) {
      return {
        success: true,
        data: allTerms.map((t) => ({ ...t, classCount: 0 })),
      };
    }

    return {
      success: true,
      data: [...termMap.values()].sort((a, b) => b.code.localeCompare(a.code)),
    };
  } catch (err) {
    console.error('[attendance-workspace-postgres] getProgramTerms:', err);
    return { success: false, error: 'Internal server error' };
  }
};

/**
 * Weekly schedule strip data for program + academic term
 */
export const getWeeklySchedule = async ({ programId, academicTermId, instructorId }) => {
  try {
    const pid = parseInt(programId);
    const classes = await getClassesForProgramTerm({ programId: pid, academicTermId, instructorId });
    const classIds = classes.map((c) => c.id);

    const extrasPromise = Promise.all([
      prisma.breakSession.findMany({
        where: { programId: pid },
        include: {
          program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
          timeSlot: { select: { id: true, labelEn: true, labelAr: true, startTime: true, endTime: true, durationMinutes: true } },
        },
        orderBy: [{ date: 'asc' }],
      }),
      prisma.instructorAvailability.findMany({
        where: { programId: pid, isActive: true },
        include: {
          instructor: {
            select: {
              id: true,
              displayName: true,
              firstName: true,
              lastName: true,
              displayNameAr: true,
              firstNameAr: true,
              lastNameAr: true,
            },
          },
          slots: { orderBy: { startTime: 'asc' } },
        },
      }),
    ]);

    if (classIds.length === 0) {
      const [program, academicTerm, timeSlots, [breakSessions, instructorAvailability]] = await Promise.all([
        prisma.program.findUnique({
          where: { id: pid },
          select: { id: true, code: true, nameEn: true, nameAr: true },
        }),
        academicTermId
          ? prisma.academicTerms.findUnique({ where: { id: parseInt(academicTermId) } })
          : null,
        prisma.timeSlot.findMany({
          where: { programId: pid, isActive: true },
          orderBy: { sortOrder: 'asc' },
        }),
        extrasPromise,
      ]);
      return {
        success: true,
        data: {
          program,
          academicTerm,
          timeSlots,
          sessions: [],
          classes: [],
          breakSessions,
          instructorAvailability,
          instructorId: instructorId ? parseInt(instructorId) : null,
        },
      };
    }

    const termFilteredClasses = academicTermId
      ? await getClassesForProgramTerm({ programId: pid, academicTermId, instructorId })
      : classes;
    const termClassIds = termFilteredClasses.map((c) => c.id);

    const [sessions, timeSlots, program, academicTerm, [breakSessions, instructorAvailability]] = await Promise.all([
      prisma.scheduledSession.findMany({
        where: {
          classId: { in: termClassIds },
          isActive: true,
          deletedAt: null,
          status: { not: 'cancelled' },
        },
        orderBy: { startDateTime: 'asc' },
        include: SESSION_INCLUDE,
      }),
      prisma.timeSlot.findMany({
        where: { programId: pid, isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.program.findUnique({
        where: { id: pid },
        select: { id: true, code: true, nameEn: true, nameAr: true },
      }),
      academicTermId
        ? prisma.academicTerms.findUnique({ where: { id: parseInt(academicTermId) } })
        : null,
      extrasPromise,
    ]);

    return {
      success: true,
      data: {
        program,
        academicTerm,
        timeSlots,
        sessions,
        classes: termFilteredClasses,
        breakSessions,
        instructorAvailability,
        instructorId: instructorId ? parseInt(instructorId) : null,
      },
    };
  } catch (err) {
    console.error('[attendance-workspace-postgres] getWeeklySchedule:', err);
    return { success: false, error: 'Internal server error' };
  }
};

/**
 * Get schedule grid data: sessions mapped to days×periods for a program
 */
export const getScheduleGrid = async ({ programId, instructorId, academicTermId, startDate, endDate }) => {
  try {
    const classes = await getClassesForProgramTerm({
      programId,
      academicTermId,
      instructorId,
    });
    const classIds = classes.map((c) => c.id);
    if (classIds.length === 0) {
      return { success: true, data: [] };
    }

    const where = {
      isActive: true,
      deletedAt: null,
      status: { not: 'cancelled' },
      classId: { in: classIds },
      ...(instructorId && { instructorId: parseInt(instructorId) }),
      ...(startDate && endDate && {
        AND: [
          { startDateTime: { gte: new Date(startDate) } },
          { endDateTime: { lte: new Date(endDate) } },
        ],
      }),
    };

    const sessions = await prisma.scheduledSession.findMany({
      where,
      orderBy: { startDateTime: 'asc' },
      include: SESSION_INCLUDE,
    });

    return { success: true, data: sessions };
  } catch (err) {
    console.error('[attendance-workspace-postgres] getScheduleGrid:', err);
    return { success: false, error: 'Internal server error' };
  }
};

/**
 * Get attendance status for classes on a specific date
 */
const QATAR_OFFSET_MS = 3 * 60 * 60 * 1000;

function getQatarDayRange(dateInput) {
  const d = new Date(dateInput);
  const qatarTime = new Date(d.getTime() + QATAR_OFFSET_MS);
  const y = qatarTime.getUTCFullYear();
  const m = qatarTime.getUTCMonth();
  const day = qatarTime.getUTCDate();
  const dayStart = new Date(Date.UTC(y, m, day, -3, 0, 0));
  const dayEnd = new Date(Date.UTC(y, m, day + 1, -3, 0, 0));
  return { dayStart, dayEnd };
}

function getQatarWeekRange(dateInput) {
  const d = new Date(dateInput);
  const qatarTime = new Date(d.getTime() + QATAR_OFFSET_MS);
  const dayOfWeek = qatarTime.getUTCDay();
  const weekStart = new Date(qatarTime);
  weekStart.setUTCDate(qatarTime.getUTCDate() - dayOfWeek);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  const y = weekStart.getUTCFullYear();
  const m = weekStart.getUTCMonth();
  const day = weekStart.getUTCDate();
  const weekStartUtc = new Date(Date.UTC(y, m, day, -3, 0, 0));
  const weekEndUtc = new Date(Date.UTC(y, m, day + 7, -3, 0, 0));
  return { weekStart: weekStartUtc, weekEnd: weekEndUtc };
}

export const getScheduleStatus = async ({ classIds, date }) => {
  try {
    if (!classIds || classIds.length === 0) {
      return { success: true, data: {} };
    }

    const { dayStart, dayEnd } = getQatarDayRange(date);

    const ids = classIds.map((id) => parseInt(id));

    const { weekStart, weekEnd } = getQatarWeekRange(date);

    const [attendances, workflowDocs, weeklyWorkflowDocs, participationRecords, classEnrollments] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          classId: { in: ids },
          date: { gte: dayStart, lt: dayEnd },
        },
        select: {
          id: true,
          classId: true,
          userId: true,
          statusId: true,
          createdAt: true,
          updatedAt: true,
          notes: true,
          createdBy: true,
          status: { select: { code: true, nameEn: true } },
          user: { select: USER_NAME_SELECT },
          creator: {
            select: {
              displayName: true,
              displayNameAr: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true,
              email: true,
            },
          },
        },
      }),
      prisma.workflowDocument.findMany({
        where: {
          classId: { in: ids },
          workflowCategory: 'ATTENDANCE',
          attendanceSubtype: 'DAILY',
          date: { gte: dayStart, lt: dayEnd },
        },
        select: {
          id: true,
          classId: true,
          status: true,
          updatedAt: true,
          fileId: true,
          file: { select: { id: true, name: true, mimeType: true } },
          snapshotFile: { select: { id: true, name: true, mimeType: true } },
          signedFileId: true,
          signedFile: { select: { id: true, name: true, mimeType: true } },
          _count: { select: { comments: true } },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              createdAt: true,
              actor: {
                select: {
                  id: true,
                  displayName: true,
                  displayNameAr: true,
                  firstName: true,
                  lastName: true,
                  firstNameAr: true,
                  lastNameAr: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.workflowDocument.findMany({
        where: {
          workflowCategory: 'ATTENDANCE',
          attendanceSubtype: 'WEEKLY_SUMMARY',
          classId: { in: ids },
          date: { gte: weekStart, lt: weekEnd },
        },
        select: {
          id: true,
          classId: true,
          status: true,
          date: true,
          dateFrom: true,
          dateTo: true,
          updatedAt: true,
          fileId: true,
          file: { select: { id: true, name: true, mimeType: true } },
          snapshotFile: { select: { id: true, name: true, mimeType: true } },
          signedFileId: true,
          signedFile: { select: { id: true, name: true, mimeType: true } },
          _count: { select: { comments: true } },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              createdAt: true,
              actor: {
                select: {
                  id: true,
                  displayName: true,
                  displayNameAr: true,
                  firstName: true,
                  lastName: true,
                  firstNameAr: true,
                  lastNameAr: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.participation.findMany({
        where: {
          classId: { in: ids },
          isActive: true,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        select: {
          id: true,
          classId: true,
          points: true,
          comment: true,
          descriptionEn: true,
          descriptionAr: true,
          createdAt: true,
          user: {
            select: USER_NAME_SELECT,
          },
          participationType: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true,
              isPositive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enrollment.findMany({
        where: {
          classId: { in: ids },
          status: {
            code: {
              notIn: ['dropped', 'DROPPED', 'withdrawn', 'WITHDRAWN', 'completed', 'COMPLETED', 'transferred', 'TRANSFERRED'],
            },
          },
        },
        select: {
          classId: true,
          userId: true,
        },
      }),
    ]);

    const resolveUserName = (user) => {
      if (!user) return { actorNameEn: null, actorNameAr: null };
      return {
        actorNameEn: user.displayName
          || [user.firstName, user.lastName].filter(Boolean).join(' ')
          || user.email
          || null,
        actorNameAr: user.displayNameAr
          || [user.firstNameAr, user.lastNameAr].filter(Boolean).join(' ')
          || null,
      };
    };

    const APPROVED_STATUSES = new Set(['APPROVED', 'ADMIN_APPROVED']);
    const resolveWorkflowApprover = (history = []) => {
      const approved = [...history]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .find((entry) => APPROVED_STATUSES.has(entry.toStatus));
      if (!approved) return null;
      const names = resolveUserName(approved.actor);
      return {
        approvedByNameEn: names.actorNameEn,
        approvedByNameAr: names.actorNameAr,
        approvedAt: approved.createdAt,
      };
    };

    const participationRecordsByClass = {};
    for (const record of participationRecords || []) {
      const classId = record.classId;
      if (!participationRecordsByClass[classId]) {
        participationRecordsByClass[classId] = [];
      }
      const user = record.user;
      const type = record.participationType;
      participationRecordsByClass[classId].push({
        id: record.id,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        firstNameAr: user?.firstNameAr || null,
        lastNameAr: user?.lastNameAr || null,
        studentName: user?.displayName
          || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
          || null,
        studentNameAr: user?.displayNameAr
          || [user?.firstNameAr, user?.lastNameAr].filter(Boolean).join(' ')
          || null,
        typeName: type?.nameEn || null,
        typeNameAr: type?.nameAr || null,
        isPositive: type?.isPositive ?? true,
        points: record.points,
        comment: record.comment || null,
        descriptionEn: record.descriptionEn || null,
        descriptionAr: record.descriptionAr || null,
        createdAt: record.createdAt,
      });
    }

    const participationCountByClass = Object.fromEntries(
      Object.entries(participationRecordsByClass).map(([classId, records]) => [classId, records.length]),
    );

    const notesRecordsByClass = {};
    for (const record of attendances || []) {
      if (!record.notes || !record.notes.trim()) continue;
      const classId = record.classId;
      if (!notesRecordsByClass[classId]) {
        notesRecordsByClass[classId] = [];
      }
      const user = record.user;
      notesRecordsByClass[classId].push({
        id: record.id,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        firstNameAr: user?.firstNameAr || null,
        lastNameAr: user?.lastNameAr || null,
        studentName: user?.displayName
          || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
          || null,
        studentNameAr: user?.displayNameAr
          || [user?.firstNameAr, user?.lastNameAr].filter(Boolean).join(' ')
          || null,
        note: record.notes,
        createdAt: record.createdAt,
      });
    }

    const notesCountByClass = Object.fromEntries(
      Object.entries(notesRecordsByClass).map(([classId, records]) => [classId, records.length]),
    );

    const statusMap = {};
    for (const id of ids) {
      const classAttendances = attendances.filter((a) => a.classId === id);
      const classWorkflow = workflowDocs.find((w) => w.classId === id);
      const classWeeklyWorkflow = weeklyWorkflowDocs.find((w) => w.classId === id);
      const dailyApprover = resolveWorkflowApprover(classWorkflow?.statusHistory || []);
      const weeklyApprover = resolveWorkflowApprover(classWeeklyWorkflow?.statusHistory || []);

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;
      let humanCaseCount = 0;

      const latestByUser = {};
      for (const att of classAttendances) {
        const uid = att.userId;
        const existing = latestByUser[uid];
        if (!existing || new Date(att.updatedAt || att.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
          latestByUser[uid] = att;
        }
      }
      const classAttendancesForCount = Object.values(latestByUser);

      const activeEnrollmentUserIds = new Set((classEnrollments || [])
        .filter((e) => e.classId === id)
        .map((e) => e.userId));
      const takenUserIds = new Set(classAttendancesForCount.map((att) => att.userId));
      const notTakenCount = Math.max(0, activeEnrollmentUserIds.size - takenUserIds.size);

      for (const att of classAttendancesForCount) {
        const code = att.status?.code;
        if (isLateStatus(code)) {
          lateCount += 1;
        } else if (isPresentStatus(code)) {
          presentCount += 1;
        } else if (isHumanCaseStatus(code)) {
          humanCaseCount += 1;
        } else if (isExcusedStatus(code)) {
          excusedCount += 1;
        } else if (isAbsentStatus(code)) {
          absentCount += 1;
        }
      }

      let statusHistory = (classWorkflow?.statusHistory || []).map((entry) => {
        const names = resolveUserName(entry.actor);
        return {
          fromStatus: entry.fromStatus,
          toStatus: entry.toStatus,
          createdAt: entry.createdAt,
          ...names,
        };
      });

      if (statusHistory.length === 0 && classAttendances.length > 0) {
        const firstTaken = [...classAttendances].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        )[0];
        const names = resolveUserName(firstTaken?.creator);
        statusHistory = [{
          fromStatus: null,
          toStatus: 'TAKEN',
          createdAt: firstTaken.createdAt,
          ...names,
        }];
      }

      statusMap[id] = {
        hasAttendance: classAttendances.length > 0,
        attendanceCount: classAttendances.length,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        humanCaseCount,
        notTakenCount,
        notesCount: notesCountByClass[id] || 0,
        notesRecords: notesRecordsByClass[id] || [],
        participationCount: participationCountByClass[id] || 0,
        participationRecords: participationRecordsByClass[id] || [],
        workflowCommentsCount: classWorkflow?._count?.comments || 0,
        attendanceSummary: {
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          excused: excusedCount,
          humanCase: humanCaseCount,
          notTaken: notTakenCount,
        },
        workflowStatus: classWorkflow?.status || null,
        workflowDocumentId: classWorkflow?.id || null,
        workflowUpdatedAt: classWorkflow?.updatedAt || null,
        workflowFile: classWorkflow?.file || null,
        workflowSnapshotFile: classWorkflow?.snapshotFile || null,
        workflowSignedFile: classWorkflow?.signedFile || null,
        workflowApprovedByName: dailyApprover?.approvedByNameEn || null,
        workflowApprovedByNameAr: dailyApprover?.approvedByNameAr || null,
        workflowApprovedAt: dailyApprover?.approvedAt || null,
        weeklyWorkflowStatus: classWeeklyWorkflow?.status || null,
        weeklyWorkflowDocumentId: classWeeklyWorkflow?.id || null,
        weeklyWorkflowUpdatedAt: classWeeklyWorkflow?.updatedAt || null,
        weeklyWorkflowFile: classWeeklyWorkflow?.file || null,
        weeklyWorkflowSnapshotFile: classWeeklyWorkflow?.snapshotFile || null,
        weeklyWorkflowSignedFile: classWeeklyWorkflow?.signedFile || null,
        weeklyWorkflowApprovedByName: weeklyApprover?.approvedByNameEn || null,
        weeklyWorkflowApprovedByNameAr: weeklyApprover?.approvedByNameAr || null,
        weeklyWorkflowApprovedAt: weeklyApprover?.approvedAt || null,
        statusHistory,
      };
    }

    return { success: true, data: statusMap };
  } catch (err) {
    console.error('[attendance-workspace-postgres] getScheduleStatus:', err);
    return { success: false, error: 'Internal server error' };
  }
};

export default {
  getInstructorPrograms,
  getAllPrograms,
  getProgramTerms,
  getWeeklySchedule,
  getScheduleGrid,
  getScheduleStatus,
};
