import prisma from '../db/prismaClient.js';

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
    const classes = await getClassesForProgramTerm({ programId: pid, academicTermId, instructorId: null });
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
      ? await getClassesForProgramTerm({ programId: pid, academicTermId, instructorId: null })
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
      instructorId: null,
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
export const getScheduleStatus = async ({ classIds, date }) => {
  try {
    if (!classIds || classIds.length === 0) {
      return { success: true, data: {} };
    }

    const targetDate = new Date(date);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    const ids = classIds.map((id) => parseInt(id));

    const [attendances, workflowDocs] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          classId: { in: ids },
          date: { gte: dayStart, lt: dayEnd },
        },
        select: {
          id: true,
          classId: true,
          statusId: true,
          createdAt: true,
          createdBy: true,
          status: { select: { code: true, nameEn: true } },
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
    ]);

    const presentCodes = new Set(['PRESENT', 'P', 'LATE', 'L']);
    const lateCodes = new Set(['LATE', 'L']);
    const absentCodes = new Set(['ABSENT', 'A', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED']);

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

    const statusMap = {};
    for (const id of ids) {
      const classAttendances = attendances.filter((a) => a.classId === id);
      const classWorkflow = workflowDocs.find((w) => w.classId === id);

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      for (const att of classAttendances) {
        const code = (att.status?.code || '').toUpperCase();
        if (lateCodes.has(code)) lateCount += 1;
        if (presentCodes.has(code)) presentCount += 1;
        else if (absentCodes.has(code)) absentCount += 1;
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
        workflowStatus: classWorkflow?.status || null,
        workflowDocumentId: classWorkflow?.id || null,
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
