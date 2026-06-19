import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

/**
 * Base status transitions (timing-aware rules applied in validateStatusTransition)
 */
const STATUS_TRANSITIONS = {
  scheduled: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['scheduled']
};

/**
 * Validate status transition (optionally time-aware when session is provided)
 */
export const validateStatusTransition = (currentStatus, newStatus, session = null) => {
  let allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  if (session && currentStatus === 'scheduled') {
    const now = new Date();
    const start = new Date(session.startDateTime);
    const end = new Date(session.endDateTime);

    if (now > end) {
      allowedTransitions = ['completed', 'cancelled'];
    } else if (now >= start && now <= end) {
      allowedTransitions = ['in_progress', 'cancelled'];
    } else {
      allowedTransitions = ['cancelled'];
    }
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot change status from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
    };
  }

  return { valid: true };
};

/**
 * Auto-mark past sessions as completed
 */
export const autoCompletePastSessions = async () => {
  const now = new Date();
  const result = await prisma.scheduledSession.updateMany({
    where: {
      status: { in: ['scheduled', 'in_progress'] },
      endDateTime: { lt: now },
      deletedAt: null,
      isActive: true
    },
    data: { status: 'completed' }
  });
  return result.count;
};

/**
 * Update session status
 */
export const updateSessionStatus = async (sessionId, newStatus, updatedBy = null, reason = null) => {
  try {
    // Get current session
    const session = await prisma.scheduledSession.findUnique({
      where: { id: parseInt(sessionId) }
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Validate transition (time-aware)
    const validation = validateStatusTransition(session.status, newStatus, session);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Update status
    const updated = await prisma.scheduledSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        status: newStatus,
        updatedBy: updatedBy ? parseInt(updatedBy) : null
      },
      include: {
        class: {
          include: {
            subject: true,
            program: true
          }
        },
        instructor: true,
        classroom: true
      }
    });

    console.log(`[SessionStatus] Changed status: ${session.status} → ${newStatus} for session ${sessionId}`);

    return { 
      success: true, 
      data: updated,
      message: `Session status changed to ${newStatus}`
    };
  } catch (error) {
    console.error('[SessionStatus] Error updating status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancel a single session
 */
export const cancelSession = async (sessionId, cancelledBy = null, reason = null) => {
  return updateSessionStatus(sessionId, 'cancelled', cancelledBy, reason);
};

/**
 * Cancel a recurring series (this session and all future)
 */
export const cancelRecurringSeries = async (sessionId, cancelledBy = null, reason = null) => {
  try {
    // Get the session to find its series
    const session = await prisma.scheduledSession.findUnique({
      where: { id: parseInt(sessionId) },
      select: {
        recurrenceSeriesId: true,
        startDateTime: true
      }
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (!session.recurrenceSeriesId) {
      // Not a recurring session, just cancel this one
      return cancelSession(sessionId, cancelledBy, reason);
    }

    // Cancel this session and all future sessions in the series
    const result = await prisma.scheduledSession.updateMany({
      where: {
        recurrenceSeriesId: session.recurrenceSeriesId,
        startDateTime: {
          gte: session.startDateTime
        },
        status: {
          in: ['scheduled', 'in_progress']
        }
      },
      data: {
        status: 'cancelled',
        updatedBy: cancelledBy ? parseInt(cancelledBy) : null
      }
    });

    console.log(`[SessionStatus] Cancelled ${result.count} sessions in series`);

    return {
      success: true,
      data: { cancelledCount: result.count },
      message: `Cancelled ${result.count} sessions in the series`
    };
  } catch (error) {
    console.error('[SessionStatus] Error cancelling series:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark session as in progress
 */
export const startSession = async (sessionId, startedBy = null) => {
  return updateSessionStatus(sessionId, 'in_progress', startedBy);
};

/**
 * Mark session as completed
 */
export const completeSession = async (sessionId, completedBy = null) => {
  return updateSessionStatus(sessionId, 'completed', completedBy);
};

/**
 * Get sessions by status
 */
export const getSessionsByStatus = async (status, filters = {}) => {
  try {
    const { startDate, endDate, classId, instructorId } = filters;
    
    const where = {
      status,
      deletedAt: null,
      ...(classId && { classId: parseInt(classId) }),
      ...(instructorId && { instructorId: parseInt(instructorId) })
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
        },
        instructor: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        classroom: {
          select: {
            id: true,
            nameEn: true,
            code: true
          }
        }
      },
      orderBy: {
        startDateTime: 'asc'
      }
    });

    return { success: true, data: sessions };
  } catch (error) {
    console.error('[SessionStatus] Error getting sessions by status:', error);
    return { success: false, error: error.message };
  }
};

export default {
  validateStatusTransition,
  updateSessionStatus,
  cancelSession,
  cancelRecurringSeries,
  startSession,
  completeSession,
  getSessionsByStatus,
  autoCompletePastSessions
};
