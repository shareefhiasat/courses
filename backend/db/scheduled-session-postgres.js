import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import * as schedulingEngine from '../services/schedulingEngine.js';
import instructorHistoryService from '../services/instructorHistoryService.js';

const prisma = new PrismaClient();

/**
 * Get all scheduled sessions with filters
 */
export const getScheduledSessions = async (params = {}) => {
  try {
    const {
      page = 1,
      limit = 100,
      classId,
      instructorId,
      classroomId,
      startDate,
      endDate,
      status,
      isActive = true
    } = params;

    const where = {
      ...(isActive !== undefined && { isActive }),
      ...(classId && { classId: parseInt(classId) }),
      ...(instructorId && { instructorId: parseInt(instructorId) }),
      ...(classroomId && { classroomId: parseInt(classroomId) }),
      ...(status && { status }),
    };

    // Date range filter
    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startDateTime: { gte: new Date(startDate) } });
      }
      if (endDate) {
        where.AND.push({ endDateTime: { lte: new Date(endDate) } });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [sessions, total] = await Promise.all([
      prisma.scheduledSession.findMany({
        where,
        skip,
        take,
        orderBy: { startDateTime: 'asc' },
        include: {
          class: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true,
              subject: {
                select: {
                  id: true,
                  code: true,
                  nameEn: true,
                  nameAr: true
                }
              },
              program: {
                select: {
                  id: true,
                  code: true,
                  nameEn: true,
                  nameAr: true
                }
              }
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              email: true
            }
          },
          classroom: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true,
              capacity: true
            }
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true
            }
          },
          updater: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true
            }
          }
        }
      }),
      prisma.scheduledSession.count({ where })
    ]);

    return {
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('[ScheduledSession DB] Error getting sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single scheduled session by ID
 */
export const getScheduledSessionById = async (id) => {
  try {
    const session = await prisma.scheduledSession.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: {
          include: {
            subject: true,
            program: true
          }
        },
        instructor: true,
        classroom: true,
        creator: true,
        updater: true
      }
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    return { success: true, data: session };
  } catch (error) {
    console.error('[ScheduledSession DB] Error getting session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new scheduled session with concurrency control
 */
export const createScheduledSession = async (data) => {
  try {
    // Use transaction for atomic operation - prevents race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Build conflict check conditions - only check if instructor/classroom is provided
      const conflictConditions = [];
      if (data.classroomId) {
        conflictConditions.push({ classroomId: parseInt(data.classroomId) });
      }
      if (data.instructorId) {
        conflictConditions.push({ instructorId: parseInt(data.instructorId) });
      }

      // Double-check for conflicts within transaction (prevents race conditions)
      if (conflictConditions.length > 0) {
        const conflict = await tx.scheduledSession.findFirst({
          where: {
            isActive: true,
            OR: conflictConditions,
            AND: [
              { startDateTime: { lt: new Date(data.endDateTime) } },
              { endDateTime: { gt: new Date(data.startDateTime) } }
            ]
          }
        });

        if (conflict) {
          throw new Error(
            conflict.classroomId === parseInt(data.classroomId)
              ? 'Classroom is already booked for this time'
              : 'Instructor is already scheduled for this time'
          );
        }
      }

      // Get the class to check if we need to update it
      const classRecord = await tx.class.findUnique({
        where: { id: parseInt(data.classId) }
      });

      // Update class record if instructor/classroom is being assigned for the first time
      const classUpdates = {};
      if (data.instructorId && !classRecord.instructorId) {
        classUpdates.instructorId = parseInt(data.instructorId);
        console.log(`[ScheduledSession DB] Updating class ${data.classId} with instructor ${data.instructorId}`);
      }
      if (data.classroomId && !classRecord.classroomId) {
        classUpdates.classroomId = parseInt(data.classroomId);
        console.log(`[ScheduledSession DB] Updating class ${data.classId} with classroom ${data.classroomId}`);
      }

      if (Object.keys(classUpdates).length > 0) {
        await tx.class.update({
          where: { id: parseInt(data.classId) },
          data: classUpdates
        });
      }

      // Create session - build data object conditionally
      const sessionData = {
        class: { connect: { id: parseInt(data.classId) } },
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        status: data.status || 'scheduled',
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      };

      // Only connect instructor/classroom if provided (check for truthy value, not just existence)
      console.log('[ScheduledSession DB] Creating session with:', {
        instructorId: data.instructorId,
        classroomId: data.classroomId,
        hasInstructor: !!data.instructorId,
        hasClassroom: !!data.classroomId
      });
      
      if (data.instructorId && data.instructorId !== null && data.instructorId !== 'null') {
        sessionData.instructor = { connect: { id: parseInt(data.instructorId) } };
      }
      if (data.classroomId && data.classroomId !== null && data.classroomId !== 'null') {
        sessionData.classroom = { connect: { id: parseInt(data.classroomId) } };
      }

      const session = await tx.scheduledSession.create({
        data: sessionData,
        include: {
          class: {
            include: {
              subject: true,
              program: true
            }
          },
          instructor: true,
          classroom: true,
          creator: true
        }
      });

      // Record instructor assignment in history (initial assignment)
      if (data.instructorId && data.instructorId !== null && data.instructorId !== 'null') {
        await instructorHistoryService.recordInstructorChange({
          classId: session.classId,
          sessionId: session.id,
          oldInstructorId: null, // No previous instructor
          newInstructorId: parseInt(data.instructorId),
          effectiveFrom: session.startDateTime,
          changedBy: data.createdBy || null,
          reason: 'Initial assignment'
        });
        
        console.log(`[ScheduledSession DB] Recorded initial instructor assignment: ${data.instructorId}`);
      }

      return session;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('[ScheduledSession DB] Error creating session:', error);
    // Check if it's a conflict error
    if (error.message.includes('already booked') || error.message.includes('already scheduled')) {
      return { success: false, error: error.message, isConflict: true };
    }
    return { success: false, error: error.message };
  }
};

/**
 * Update a scheduled session
 */
export const updateScheduledSession = async (id, data) => {
  try {
    // Check if session exists
    const existing = await prisma.scheduledSession.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return { success: false, error: 'Session not found' };
    }

    // Track instructor change for history
    const instructorChanged = data.instructorId !== undefined && 
                             parseInt(data.instructorId) !== existing.instructorId;
    const oldInstructorId = existing.instructorId;
    const newInstructorId = data.instructorId ? parseInt(data.instructorId) : null;

    // Check for conflicts if time/room/instructor changed
    if (data.startDateTime || data.endDateTime || data.classroomId || data.instructorId) {
      const conflict = await prisma.scheduledSession.findFirst({
        where: {
          id: { not: parseInt(id) },
          isActive: true,
          OR: [
            { classroomId: parseInt(data.classroomId || existing.classroomId) },
            { instructorId: parseInt(data.instructorId || existing.instructorId) }
          ],
          AND: [
            { startDateTime: { lt: new Date(data.endDateTime || existing.endDateTime) } },
            { endDateTime: { gt: new Date(data.startDateTime || existing.startDateTime) } }
          ]
        }
      });

      if (conflict) {
        return {
          success: false,
          error: conflict.classroomId === parseInt(data.classroomId || existing.classroomId)
            ? 'Classroom is already booked for this time'
            : 'Instructor is already scheduled for this time'
        };
      }
    }

    // Build update data
    const updateData = {
      ...(data.classId !== undefined && { classId: parseInt(data.classId) }),
      ...(data.instructorId !== undefined && { instructorId: parseInt(data.instructorId) }),
      ...(data.classroomId !== undefined && { classroomId: parseInt(data.classroomId) }),
      ...(data.startDateTime !== undefined && { startDateTime: new Date(data.startDateTime) }),
      ...(data.endDateTime !== undefined && { endDateTime: new Date(data.endDateTime) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive })
    };

    const session = await prisma.scheduledSession.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        class: {
          include: {
            subject: true,
            program: true
          }
        },
        instructor: true,
        classroom: true,
        creator: true,
        updater: true
      }
    });

    // Record instructor change in history if instructor was changed
    if (instructorChanged) {
      await instructorHistoryService.recordInstructorChange({
        classId: session.classId,
        sessionId: session.id,
        oldInstructorId,
        newInstructorId,
        effectiveFrom: session.startDateTime,
        changedBy: data.updatedBy || null,
        reason: data.instructorChangeReason || null
      });
      
      console.log(`[ScheduledSession DB] Recorded instructor change: ${oldInstructorId} → ${newInstructorId}`);
    }

    return { success: true, data: session };
  } catch (error) {
    console.error('[ScheduledSession DB] Error updating session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a scheduled session (soft delete with attendance protection)
 */
export const deleteScheduledSession = async (id, deletedBy = null, deletionReason = null) => {
  try {
    // Check if session exists
    const session = await prisma.scheduledSession.findUnique({
      where: { id: parseInt(id) }
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Soft delete the session
    const deletedSession = await prisma.scheduledSession.update({
      where: { id: parseInt(id) },
      data: { 
        isActive: false,
        deletedAt: new Date(),
        deletionReason: deletionReason || null
      },
      include: {
        class: true,
        instructor: true,
        classroom: true
      }
    });

    console.log(`[ScheduledSession DB] Soft deleted session ${id}`, {
      hasAttendance,
      deletedBy,
      reason: deletionReason
    });

    return { 
      success: true, 
      data: deletedSession,
      message: hasAttendance ? 'Session deleted (attendance preserved)' : 'Session deleted'
    };
  } catch (error) {
    console.error('[ScheduledSession DB] Error deleting session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore a soft-deleted session (admin only)
 */
export const restoreScheduledSession = async (id, restoredBy = null) => {
  try {
    const session = await prisma.scheduledSession.update({
      where: { id: parseInt(id) },
      data: {
        isActive: true,
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
        updatedBy: restoredBy ? parseInt(restoredBy) : null
      },
      include: {
        class: true,
        instructor: true,
        classroom: true
      }
    });

    console.log(`[ScheduledSession DB] Restored session ${id} by user ${restoredBy}`);

    return { success: true, data: session, message: 'Session restored successfully' };
  } catch (error) {
    console.error('[ScheduledSession DB] Error restoring session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create recurring sessions
 */
export const createRecurringSessions = async (data) => {
  try {
    const { 
      baseSession, 
      recurrenceConfig,
      createSeries = true 
    } = data;

    // Generate session instances
    const sessionInstances = schedulingEngine.generateRecurringSessions(
      baseSession, 
      recurrenceConfig
    );

    if (sessionInstances.length === 0) {
      return { success: false, error: 'No sessions generated' };
    }

    // Validate all sessions before creating any
    for (const session of sessionInstances) {
      const validation = await schedulingEngine.validateSession(session);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Conflict detected in recurring sessions',
          conflicts: validation.conflicts,
          failedAt: session.startDateTime
        };
      }
    }

    let seriesId = null;
    let createdSeries = null;

    // Create series record if requested
    if (createSeries) {
      const dayNames = recurrenceConfig.recurrenceDays.join(', ');
      const pattern = `Every ${dayNames}`;
      
      createdSeries = await prisma.sessionSeries.create({
        data: {
          name: `${baseSession.className || 'Class'} - ${pattern}`,
          pattern,
          recurrenceType: recurrenceConfig.recurrenceType,
          recurrenceDays: recurrenceConfig.recurrenceDays,
          startDate: new Date(sessionInstances[0].startDateTime),
          endDate: new Date(sessionInstances[sessionInstances.length - 1].startDateTime),
          totalSessions: sessionInstances.length,
          classId: parseInt(baseSession.classId),
          instructorId: parseInt(baseSession.instructorId),
          classroomId: parseInt(baseSession.classroomId),
          createdBy: baseSession.createdBy || null
        }
      });

      seriesId = createdSeries.id;
    }

    // Create all sessions
    const createdSessions = [];
    let parentSessionId = null;

    for (let i = 0; i < sessionInstances.length; i++) {
      const sessionData = sessionInstances[i];
      
      const session = await prisma.scheduledSession.create({
        data: {
          classId: parseInt(sessionData.classId),
          instructorId: parseInt(sessionData.instructorId),
          classroomId: parseInt(sessionData.classroomId),
          startDateTime: new Date(sessionData.startDateTime),
          endDateTime: new Date(sessionData.endDateTime),
          status: sessionData.status || 'scheduled',
          notes: sessionData.notes || null,
          recurrenceType: i === 0 ? recurrenceConfig.recurrenceType : null,
          recurrenceDays: i === 0 ? recurrenceConfig.recurrenceDays : [],
          recurrenceEndDate: i === 0 ? new Date(recurrenceConfig.recurrenceEndDate) : null,
          recurrenceCount: i === 0 ? sessionInstances.length : null,
          isRecurringInstance: i > 0,
          parentSessionId: i === 0 ? null : parentSessionId,
          seriesId: seriesId,
          isActive: true,
          createdBy: sessionData.createdBy || null
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

      if (i === 0) {
        parentSessionId = session.id;
      }

      createdSessions.push(session);
    }

    return {
      success: true,
      data: {
        series: createdSeries,
        sessions: createdSessions,
        totalCreated: createdSessions.length
      }
    };
  } catch (error) {
    console.error('[ScheduledSession DB] Error creating recurring sessions:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getScheduledSessions,
  getScheduledSessionById,
  createScheduledSession,
  updateScheduledSession,
  deleteScheduledSession,
  restoreScheduledSession,
  createRecurringSessions
};
