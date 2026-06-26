/**
 * Time Slots Database Service
 * 
 * PURPOSE: Database operations for time slots using PostgreSQL
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import prisma from './prismaClient.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';


/**
 * Get all time slots from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with time slots data
 */
export const getTimeSlots = async (params = {}) => {
  try {
    console.log('[TimeSlots DB] Getting time slots with params:', params);
    
    const {
      page = 1,
      limit = 50,
      programId = '',
      isBreak = '',
      isActive = null,
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (programId) {
      where.programId = parseInt(programId);
    }
    
    if (isBreak !== '') {
      where.isBreak = isBreak === 'true' || isBreak === true;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [timeSlots, total] = await Promise.all([
      prisma.timeSlot.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          program: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          }
        }
      }),
      prisma.timeSlot.count({ where })
    ]);
    
    return {
      success: true,
      data: timeSlots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('[TimeSlots DB] Error getting time slots:', error);
    
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
 * Get time slot by ID
 * 
 * @param {number} id - Time slot ID
 * @returns {Promise<Object>} - Result object with time slot data
 */
export const getTimeSlotById = async (id) => {
  try {
    console.log('[TimeSlots DB] Getting time slot by ID:', id);
    
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: parseInt(id) },
      include: {
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });
    
    if (!timeSlot) {
      return {
        success: false,
        error: 'Time slot not found',
        code: 'NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: timeSlot
    };
  } catch (error) {
    console.error('[TimeSlots DB] Error getting time slot by ID:', error);
    
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
 * Get time slots by program ID
 * 
 * @param {number} programId - Program ID
 * @returns {Promise<Object>} - Result object with time slots data
 */
export const getTimeSlotsByProgram = async (programId) => {
  try {
    console.log('[TimeSlots DB] Getting time slots by program ID:', programId);
    
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        programId: parseInt(programId),
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    return {
      success: true,
      data: timeSlots
    };
  } catch (error) {
    console.error('[TimeSlots DB] Error getting time slots by program:', error);
    
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
 * Get schedulable time slots (excludes breaks)
 * 
 * @param {number} programId - Program ID
 * @returns {Promise<Object>} - Result object with schedulable time slots
 */
export const getSchedulableTimeSlots = async (programId) => {
  try {
    console.log('[TimeSlots DB] Getting schedulable time slots:', programId);
    
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        programId: parseInt(programId),
        isBreak: false,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    return {
      success: true,
      data: timeSlots
    };
  } catch (error) {
    console.error('[TimeSlots DB] Error getting schedulable time slots:', error);
    
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
 * Bulk initialize default time slots for a program
 * 
 * @param {number} programId - Program ID
 * @returns {Promise<Object>} - Result object with created time slots
 */
export const bulkInitDefaults = async (programId) => {
  try {
    console.log('[TimeSlots DB] Bulk initializing default time slots for program:', programId);
    
    // Default time slots: 8 periods with breaks
    const defaultSlots = [
      { labelEn: 'Period 1', labelAr: 'الحصة 1', startTime: '08:00', endTime: '08:50', durationMinutes: 50, sortOrder: 1 },
      { labelEn: 'Period 2', labelAr: 'الحصة 2', startTime: '09:00', endTime: '09:50', durationMinutes: 50, sortOrder: 2 },
      { labelEn: 'Break', labelAr: 'استراحة', startTime: '09:50', endTime: '10:00', durationMinutes: 10, sortOrder: 3, isBreak: true, breakType: 'TeaBreak' },
      { labelEn: 'Period 3', labelAr: 'الحصة 3', startTime: '10:00', endTime: '10:50', durationMinutes: 50, sortOrder: 4 },
      { labelEn: 'Period 4', labelAr: 'الحصة 4', startTime: '11:00', endTime: '11:50', durationMinutes: 50, sortOrder: 5 },
      { labelEn: 'Break', labelAr: 'استراحة', startTime: '11:50', endTime: '12:10', durationMinutes: 20, sortOrder: 6, isBreak: true, breakType: 'PrayerBreak' },
      { labelEn: 'Period 5', labelAr: 'الحصة 5', startTime: '12:10', endTime: '13:00', durationMinutes: 50, sortOrder: 7 },
      { labelEn: 'Period 6', labelAr: 'الحصة 6', startTime: '13:00', endTime: '13:50', durationMinutes: 50, sortOrder: 8 }
    ];
    
    const createdSlots = [];
    
    for (const slot of defaultSlots) {
      const created = await prisma.timeSlot.create({
        data: {
          programId: parseInt(programId),
          ...slot,
          isActive: true
        }
      });
      createdSlots.push(created);
    }
    
    return {
      success: true,
      data: createdSlots,
      message: `Created ${createdSlots.length} default time slots`
    };
  } catch (error) {
    console.error('[TimeSlots DB] Error bulk initializing time slots:', error);
    
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
 * Create a new time slot
 * 
 * @param {Object} data - Time slot data
 * @returns {Promise<Object>} - Result object with created time slot
 */
export const createTimeSlot = async (data) => {
  try {
    console.log('[TimeSlots DB] Creating time slot:', data);
    
    const timeSlot = await prisma.timeSlot.create({
      data,
      include: {
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: timeSlot
    };
  } catch (error) {
    console.error('[TimeSlots DB] Error creating time slot:', error);
    
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
 * Update a time slot
 * 
 * @param {number} id - Time slot ID
 * @param {Object} data - Updated time slot data
 * @returns {Promise<Object>} - Result object with updated time slot
 */
export const updateTimeSlot = async (id, data) => {
  try {
    console.log('[TimeSlots DB] Updating time slot:', id, data);
    
    const timeSlot = await prisma.timeSlot.update({
      where: { id: parseInt(id) },
      data,
      include: {
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: timeSlot
    };
  } catch (error) {
    console.error('[TimeSlots DB] Error updating time slot:', error);
    
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
 * Delete a time slot
 * 
 * @param {number} id - Time slot ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteTimeSlot = async (id) => {
  try {
    console.log('[TimeSlots DB] Deleting time slot:', id);
    
    await prisma.timeSlot.delete({
      where: { id: parseInt(id) }
    });
    
    return {
      success: true,
      message: 'Time slot deleted successfully'
    };
  } catch (error) {
    console.error('[TimeSlots DB] Error deleting time slot:', error);
    
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
