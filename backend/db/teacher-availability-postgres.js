/**
 * Teacher Availability Database Service
 * 
 * PURPOSE: Database operations for teacher availability using PostgreSQL
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all teacher availabilities from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with teacher availabilities data
 */
export const getTeacherAvailabilities = async (params = {}) => {
  try {
    console.log('[TeacherAvailability DB] Getting teacher availabilities with params:', params);
    
    const {
      page = 1,
      limit = 50,
      status = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [availabilities, total] = await Promise.all([
      prisma.teacherAvailability.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
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
          }
        }
      }),
      prisma.teacherAvailability.count({ where })
    ]);
    
    return {
      success: true,
      data: availabilities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('[TeacherAvailability DB] Error getting teacher availabilities:', error);
    
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
 * Get teacher availability by ID
 * 
 * @param {number} id - Teacher availability ID
 * @returns {Promise<Object>} - Result object with teacher availability data
 */
export const getTeacherAvailabilityById = async (id) => {
  try {
    console.log('[TeacherAvailability DB] Getting teacher availability by ID:', id);
    
    const availability = await prisma.teacherAvailability.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
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
        }
      }
    });
    
    if (!availability) {
      return {
        success: false,
        error: 'Teacher availability not found',
        code: 'NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: availability
    };
  } catch (error) {
    console.error('[TeacherAvailability DB] Error getting teacher availability by ID:', error);
    
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
 * Get teacher availability by user ID
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result object with teacher availability data
 */
export const getTeacherAvailabilityByUserId = async (userId) => {
  try {
    console.log('[TeacherAvailability DB] Getting teacher availability by user ID:', userId);
    
    const availability = await prisma.teacherAvailability.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        user: {
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
        }
      }
    });
    
    if (!availability) {
      return {
        success: false,
        error: 'Teacher availability not found',
        code: 'NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: availability
    };
  } catch (error) {
    console.error('[TeacherAvailability DB] Error getting teacher availability by user ID:', error);
    
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
 * Get available teachers for a specific date and time slot
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with available teachers
 */
export const getAvailableTeachers = async (params) => {
  try {
    console.log('[TeacherAvailability DB] Getting available teachers:', params);
    
    const { date, timeSlotId } = params;
    
    if (!date || !timeSlotId) {
      return {
        success: false,
        error: 'Date and timeSlotId are required',
        code: 'INVALID_PARAMS'
      };
    }
    
    // Get all active teachers with availability
    const allTeachers = await prisma.teacherAvailability.findMany({
      where: {
        status: 'Active',
        isActive: true
      },
      include: {
        user: {
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
        }
      }
    });
    
    // Get teachers already booked for this date and time slot
    const bookedTeacherIds = await prisma.scheduleSession.findMany({
      where: {
        date: new Date(date),
        timeSlotId: parseInt(timeSlotId),
        isCancelled: false,
        isActive: true
      },
      select: { instructorUserId: true }
    }).then(sessions => sessions.map(s => s.instructorUserId));
    
    // Filter out booked teachers and check daily session limits
    const availableTeachers = [];
    
    for (const teacher of allTeachers) {
      // Skip if already booked
      if (bookedTeacherIds.includes(teacher.userId)) {
        continue;
      }
      
      // Check if teacher is available on this day of week
      const dayOfWeek = new Date(date).getDay();
      const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
      const dayName = dayMap[dayOfWeek];
      
      if (!teacher.availableDays.includes(dayName)) {
        continue;
      }
      
      // Check max sessions per day
      const sessionsCount = await prisma.scheduleSession.count({
        where: {
          instructorUserId: teacher.userId,
          date: new Date(date),
          isCancelled: false,
          isActive: true
        }
      });
      
      if (sessionsCount >= teacher.maxSessionsPerDay) {
        continue;
      }
      
      availableTeachers.push(teacher);
    }
    
    return {
      success: true,
      data: availableTeachers
    };
  } catch (error) {
    console.error('[TeacherAvailability DB] Error getting available teachers:', error);
    
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
 * Create a new teacher availability record
 * 
 * @param {Object} data - Teacher availability data
 * @returns {Promise<Object>} - Result object with created teacher availability
 */
export const createTeacherAvailability = async (data) => {
  try {
    console.log('[TeacherAvailability DB] Creating teacher availability:', data);
    
    const availability = await prisma.teacherAvailability.create({
      data,
      include: {
        user: {
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
        }
      }
    });
    
    return {
      success: true,
      data: availability
    };
  } catch (error) {
    console.error('[TeacherAvailability DB] Error creating teacher availability:', error);
    
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
 * Update teacher availability
 * 
 * @param {number} id - Teacher availability ID
 * @param {Object} data - Updated teacher availability data
 * @returns {Promise<Object>} - Result object with updated teacher availability
 */
export const updateTeacherAvailability = async (id, data) => {
  try {
    console.log('[TeacherAvailability DB] Updating teacher availability:', id, data);
    
    const availability = await prisma.teacherAvailability.update({
      where: { id: parseInt(id) },
      data,
      include: {
        user: {
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
        }
      }
    });
    
    return {
      success: true,
      data: availability
    };
  } catch (error) {
    console.error('[TeacherAvailability DB] Error updating teacher availability:', error);
    
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
 * Delete teacher availability
 * 
 * @param {number} id - Teacher availability ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteTeacherAvailability = async (id) => {
  try {
    console.log('[TeacherAvailability DB] Deleting teacher availability:', id);
    
    await prisma.teacherAvailability.delete({
      where: { id: parseInt(id) }
    });
    
    return {
      success: true,
      message: 'Teacher availability deleted successfully'
    };
  } catch (error) {
    console.error('[TeacherAvailability DB] Error deleting teacher availability:', error);
    
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
