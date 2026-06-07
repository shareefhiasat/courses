import { PrismaClient } from '@prisma/client';

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
 * Create a new scheduled session
 */
export const createScheduledSession = async (data) => {
  try {
    // Check for conflicts
    const conflict = await prisma.scheduledSession.findFirst({
      where: {
        isActive: true,
        OR: [
          { classroomId: parseInt(data.classroomId) },
          { instructorId: parseInt(data.instructorId) }
        ],
        AND: [
          { startDateTime: { lt: new Date(data.endDateTime) } },
          { endDateTime: { gt: new Date(data.startDateTime) } }
        ]
      }
    });

    if (conflict) {
      return {
        success: false,
        error: conflict.classroomId === parseInt(data.classroomId)
          ? 'Classroom is already booked for this time'
          : 'Instructor is already scheduled for this time'
      };
    }

    const session = await prisma.scheduledSession.create({
      data: {
        classId: parseInt(data.classId),
        instructorId: parseInt(data.instructorId),
        classroomId: parseInt(data.classroomId),
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        status: data.status || 'scheduled',
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy || null
      },
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

    return { success: true, data: session };
  } catch (error) {
    console.error('[ScheduledSession DB] Error creating session:', error);
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

    const session = await prisma.scheduledSession.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.classId !== undefined && { classId: parseInt(data.classId) }),
        ...(data.instructorId !== undefined && { instructorId: parseInt(data.instructorId) }),
        ...(data.classroomId !== undefined && { classroomId: parseInt(data.classroomId) }),
        ...(data.startDateTime !== undefined && { startDateTime: new Date(data.startDateTime) }),
        ...(data.endDateTime !== undefined && { endDateTime: new Date(data.endDateTime) }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy })
      },
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

    return { success: true, data: session };
  } catch (error) {
    console.error('[ScheduledSession DB] Error updating session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a scheduled session (soft delete)
 */
export const deleteScheduledSession = async (id) => {
  try {
    const session = await prisma.scheduledSession.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    return { success: true, data: session };
  } catch (error) {
    console.error('[ScheduledSession DB] Error deleting session:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getScheduledSessions,
  getScheduledSessionById,
  createScheduledSession,
  updateScheduledSession,
  deleteScheduledSession
};
