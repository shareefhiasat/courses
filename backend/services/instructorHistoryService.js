import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

/**
 * Record an instructor change in history
 */
export const recordInstructorChange = async ({
  classId,
  sessionId = null,
  oldInstructorId = null,
  newInstructorId = null,
  effectiveFrom,
  changedBy = null,
  reason = null
}) => {
  try {
    const history = await prisma.instructorAssignmentHistory.create({
      data: {
        classId: parseInt(classId),
        sessionId: sessionId ? parseInt(sessionId) : null,
        oldInstructorId: oldInstructorId ? parseInt(oldInstructorId) : null,
        newInstructorId: newInstructorId ? parseInt(newInstructorId) : null,
        effectiveFrom: new Date(effectiveFrom),
        changedBy: changedBy ? parseInt(changedBy) : null,
        reason: reason || null,
        isActive: true
      },
      include: {
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        session: {
          select: {
            id: true,
            startDateTime: true,
            endDateTime: true
          }
        },
        oldInstructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        newInstructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        changer: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });

    console.log('[InstructorHistory] Recorded change:', {
      classId,
      sessionId,
      oldInstructorId,
      newInstructorId,
      changedBy
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('[InstructorHistory] Error recording change:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get instructor history for a class
 */
export const getClassInstructorHistory = async (classId) => {
  try {
    const history = await prisma.instructorAssignmentHistory.findMany({
      where: {
        classId: parseInt(classId),
        isActive: true
      },
      include: {
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        session: {
          select: {
            id: true,
            startDateTime: true,
            endDateTime: true
          }
        },
        oldInstructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        newInstructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        changer: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: {
        changedAt: 'desc'
      }
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('[InstructorHistory] Error getting class history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all classes taught by an instructor (including historical)
 */
export const getInstructorHistory = async (instructorId, options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    const where = {
      OR: [
        { oldInstructorId: parseInt(instructorId) },
        { newInstructorId: parseInt(instructorId) }
      ],
      isActive: true
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      where.effectiveFrom = {};
      if (startDate) where.effectiveFrom.gte = new Date(startDate);
      if (endDate) where.effectiveFrom.lte = new Date(endDate);
    }

    const history = await prisma.instructorAssignmentHistory.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true,
            program: {
              select: {
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        session: {
          select: {
            id: true,
            startDateTime: true,
            endDateTime: true
          }
        },
        oldInstructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        newInstructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        changer: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: {
        changedAt: 'desc'
      }
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('[InstructorHistory] Error getting instructor history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get instructor history for a specific session
 */
export const getSessionInstructorHistory = async (sessionId) => {
  try {
    const history = await prisma.instructorAssignmentHistory.findMany({
      where: {
        sessionId: parseInt(sessionId),
        isActive: true
      },
      include: {
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        session: {
          select: {
            id: true,
            startDateTime: true,
            endDateTime: true
          }
        },
        oldInstructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        newInstructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        changer: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: {
        changedAt: 'desc'
      }
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('[InstructorHistory] Error getting session history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate instructor workload from history
 */
export const getInstructorWorkload = async (instructorId, options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    // Get all sessions where this instructor was assigned
    const where = {
      instructorId: parseInt(instructorId),
      isActive: true,
      deletedAt: null // Exclude deleted sessions
    };

    if (startDate || endDate) {
      where.startDateTime = {};
      if (startDate) where.startDateTime.gte = new Date(startDate);
      if (endDate) where.startDateTime.lte = new Date(endDate);
    }

    const sessions = await prisma.scheduledSession.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        }
      },
      orderBy: {
        startDateTime: 'asc'
      }
    });

    // Calculate total hours
    let totalHours = 0;
    const sessionsByClass = {};

    sessions.forEach(session => {
      const duration = (new Date(session.endDateTime) - new Date(session.startDateTime)) / (1000 * 60 * 60);
      totalHours += duration;

      const classId = session.classId;
      if (!sessionsByClass[classId]) {
        sessionsByClass[classId] = {
          class: session.class,
          sessionCount: 0,
          totalHours: 0,
          sessions: []
        };
      }

      sessionsByClass[classId].sessionCount++;
      sessionsByClass[classId].totalHours += duration;
      sessionsByClass[classId].sessions.push({
        id: session.id,
        startDateTime: session.startDateTime,
        endDateTime: session.endDateTime,
        duration
      });
    });

    return {
      success: true,
      data: {
        instructorId: parseInt(instructorId),
        totalSessions: sessions.length,
        totalHours: Math.round(totalHours * 100) / 100,
        classesTaught: Object.keys(sessionsByClass).length,
        breakdown: Object.values(sessionsByClass),
        dateRange: {
          start: startDate || null,
          end: endDate || null
        }
      }
    };
  } catch (error) {
    console.error('[InstructorHistory] Error calculating workload:', error);
    return { success: false, error: error.message };
  }
};

export default {
  recordInstructorChange,
  getClassInstructorHistory,
  getInstructorHistory,
  getSessionInstructorHistory,
  getInstructorWorkload
};
