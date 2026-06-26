/**
 * Schedule Sessions Database Service
 * 
 * PURPOSE: Database operations for schedule sessions using PostgreSQL
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import prisma from './prismaClient.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';


/**
 * Get all schedule sessions from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with schedule sessions data
 */
export const getScheduleSessions = async (params = {}) => {
  try {
    console.log('[ScheduleSessions DB] Getting schedule sessions with params:', params);
    
    const {
      page = 1,
      limit = 50,
      classId = '',
      subjectId = '',
      instructorUserId = '',
      classroomId = '',
      timeSlotId = '',
      programId = '',
      dateFrom = '',
      dateTo = '',
      isCancelled = '',
      isActive = null,
      sortBy = 'date',
      sortOrder = 'asc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (classId) {
      where.classId = parseInt(classId);
    }
    
    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }
    
    if (instructorUserId) {
      where.instructorUserId = parseInt(instructorUserId);
    }
    
    if (classroomId) {
      where.classroomId = parseInt(classroomId);
    }
    
    if (timeSlotId) {
      where.timeSlotId = parseInt(timeSlotId);
    }
    
    if (programId) {
      where.class = {
        programId: parseInt(programId)
      };
    }
    
    if (dateFrom) {
      where.date = { ...where.date, gte: new Date(dateFrom) };
    }
    
    if (dateTo) {
      where.date = { ...where.date, lte: new Date(dateTo) };
    }
    
    if (isCancelled !== '') {
      where.isCancelled = isCancelled === 'true' || isCancelled === true;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [sessions, total] = await Promise.all([
      prisma.scheduleSession.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          class: {
            include: {
              program: {
                select: {
                  id: true,
                  code: true,
                  nameEn: true,
                  nameAr: true
                }
              },
              subject: {
                select: {
                  id: true,
                  code: true,
                  nameEn: true,
                  nameAr: true
                }
              }
            }
          },
          subject: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          },
          instructor: {
            select: {
              id: true,
              email: true,
              firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
            }
          },
          classroom: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true,
              locationEn: true,
              locationAr: true
            }
          },
          timeSlot: {
            select: {
              id: true,
              labelEn: true,
              labelAr: true,
              startTime: true,
              endTime: true
            }
          }
        }
      }),
      prisma.scheduleSession.count({ where })
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
    console.error('[ScheduleSessions DB] Error getting schedule sessions:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Get schedule session by ID
 * 
 * @param {number} id - Schedule session ID
 * @returns {Promise<Object>} - Result object with schedule session data
 */
export const getScheduleSessionById = async (id) => {
  try {
    console.log('[ScheduleSessions DB] Getting schedule session by ID:', id);
    
    const session = await prisma.scheduleSession.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: {
          include: {
            program: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        instructor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            locationEn: true,
            locationAr: true
          }
        },
        timeSlot: {
          select: {
            id: true,
            labelEn: true,
            labelAr: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });
    
    if (!session) {
      return {
        success: false,
        error: 'Schedule session not found',
        code: 'NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: session
    };
  } catch (error) {
    console.error('[ScheduleSessions DB] Error getting schedule session by ID:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Get schedule sessions by date range
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with schedule sessions
 */
export const getScheduleSessionsByDateRange = async (params) => {
  try {
    const { dateFrom, dateTo, programId, instructorUserId, classroomId } = params;
    
    const where = {
      date: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      },
      isCancelled: false,
      isActive: true
    };
    
    if (programId) {
      where.class = {
        programId: parseInt(programId)
      };
    }
    
    if (instructorUserId) {
      where.instructorUserId = parseInt(instructorUserId);
    }
    
    if (classroomId) {
      where.classroomId = parseInt(classroomId);
    }
    
    const sessions = await prisma.scheduleSession.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        class: {
          include: {
            program: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
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
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        timeSlot: {
          select: {
            id: true,
            labelEn: true,
            labelAr: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: sessions
    };
  } catch (error) {
    console.error('[ScheduleSessions DB] Error getting sessions by date range:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Create a new schedule session
 * 
 * @param {Object} data - Schedule session data
 * @returns {Promise<Object>} - Result object with created schedule session
 */
export const createScheduleSession = async (data) => {
  try {
    console.log('[ScheduleSessions DB] Creating schedule session:', data);
    
    const session = await prisma.scheduleSession.create({
      data,
      include: {
        class: {
          include: {
            program: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        instructor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        timeSlot: {
          select: {
            id: true,
            labelEn: true,
            labelAr: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: session
    };
  } catch (error) {
    console.error('[ScheduleSessions DB] Error creating schedule session:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Update a schedule session
 * 
 * @param {number} id - Schedule session ID
 * @param {Object} data - Updated schedule session data
 * @returns {Promise<Object>} - Result object with updated schedule session
 */
export const updateScheduleSession = async (id, data) => {
  try {
    console.log('[ScheduleSessions DB] Updating schedule session:', id, data);
    
    const session = await prisma.scheduleSession.update({
      where: { id: parseInt(id) },
      data,
      include: {
        class: {
          include: {
            program: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                code: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        instructor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        timeSlot: {
          select: {
            id: true,
            labelEn: true,
            labelAr: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: session
    };
  } catch (error) {
    console.error('[ScheduleSessions DB] Error updating schedule session:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Delete a schedule session
 * 
 * @param {number} id - Schedule session ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteScheduleSession = async (id) => {
  try {
    console.log('[ScheduleSessions DB] Deleting schedule session:', id);
    
    await prisma.scheduleSession.delete({
      where: { id: parseInt(id) }
    });
    
    return {
      success: true,
      message: 'Schedule session deleted successfully'
    };
  } catch (error) {
    console.error('[ScheduleSessions DB] Error deleting schedule session:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Cancel a schedule session (soft delete)
 * 
 * @param {number} id - Schedule session ID
 * @param {string} cancelReason - Reason for cancellation
 * @returns {Promise<Object>} - Result object
 */
export const cancelScheduleSession = async (id, cancelReason = '') => {
  try {
    console.log('[ScheduleSessions DB] Cancelling schedule session:', id);
    
    const session = await prisma.scheduleSession.update({
      where: { id: parseInt(id) },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelReason
      }
    });
    
    return {
      success: true,
      data: session,
      message: 'Schedule session cancelled successfully'
    };
  } catch (error) {
    console.error('[ScheduleSessions DB] Error cancelling schedule session:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Bulk create schedule sessions
 * 
 * @param {Array} sessions - Array of session data objects
 * @returns {Promise<Object>} - Result object with created sessions
 */
export const bulkCreateScheduleSessions = async (sessions) => {
  try {
    console.log('[ScheduleSessions DB] Bulk creating schedule sessions:', sessions.length);
    
    const createdSessions = await prisma.scheduleSession.createMany({
      data: sessions,
      skipDuplicates: true
    });
    
    return {
      success: true,
      count: createdSessions.count,
      message: `Created ${createdSessions.count} schedule sessions`
    };
  } catch (error) {
    console.error('[ScheduleSessions DB] Error bulk creating schedule sessions:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};
