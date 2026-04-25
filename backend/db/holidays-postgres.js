/**
 * Holidays Database Service
 * 
 * PURPOSE: Database operations for holidays using PostgreSQL
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all holidays from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with holidays data
 */
export const getHolidays = async (params = {}) => {
  try {
    console.log('[Holidays DB] Getting holidays with params:', params);
    
    const {
      page = 1,
      limit = 50,
      programId = '',
      type = '',
      isActive = null,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (programId) {
      // Include both program-specific and global holidays
      where.OR = [
        { programId: parseInt(programId) },
        { programId: null }
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [holidays, total] = await Promise.all([
      prisma.holiday.findMany({
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
      prisma.holiday.count({ where })
    ]);
    
    return {
      success: true,
      data: holidays,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('[Holidays DB] Error getting holidays:', error);
    
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
 * Get holiday by ID
 * 
 * @param {number} id - Holiday ID
 * @returns {Promise<Object>} - Result object with holiday data
 */
export const getHolidayById = async (id) => {
  try {
    console.log('[Holidays DB] Getting holiday by ID:', id);
    
    const holiday = await prisma.holiday.findUnique({
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
    
    if (!holiday) {
      return {
        success: false,
        error: 'Holiday not found',
        code: 'NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: holiday
    };
  } catch (error) {
    console.error('[Holidays DB] Error getting holiday by ID:', error);
    
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
 * Get holidays by program ID (including global holidays)
 * 
 * @param {number} programId - Program ID
 * @returns {Promise<Object>} - Result object with holidays data
 */
export const getHolidaysByProgram = async (programId) => {
  try {
    console.log('[Holidays DB] Getting holidays by program ID:', programId);
    
    const holidays = await prisma.holiday.findMany({
      where: {
        OR: [
          { programId: parseInt(programId) },
          { programId: null }
        ],
        isActive: true
      },
      orderBy: { startDate: 'asc' }
    });
    
    return {
      success: true,
      data: holidays
    };
  } catch (error) {
    console.error('[Holidays DB] Error getting holidays by program:', error);
    
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
 * Get upcoming holidays
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with upcoming holidays
 */
export const getUpcomingHolidays = async (params) => {
  try {
    console.log('[Holidays DB] Getting upcoming holidays:', params);
    
    const { programId, limit = 5 } = params;
    
    const where = {
      startDate: { gte: new Date() },
      isActive: true
    };
    
    if (programId) {
      where.OR = [
        { programId: parseInt(programId) },
        { programId: null }
      ];
    }
    
    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: parseInt(limit),
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
      data: holidays
    };
  } catch (error) {
    console.error('[Holidays DB] Error getting upcoming holidays:', error);
    
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
 * Create a new holiday
 * 
 * @param {Object} data - Holiday data
 * @returns {Promise<Object>} - Result object with created holiday
 */
export const createHoliday = async (data) => {
  try {
    console.log('[Holidays DB] Creating holiday:', data);
    
    const holiday = await prisma.holiday.create({
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
      data: holiday
    };
  } catch (error) {
    console.error('[Holidays DB] Error creating holiday:', error);
    
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
 * Update a holiday
 * 
 * @param {number} id - Holiday ID
 * @param {Object} data - Updated holiday data
 * @returns {Promise<Object>} - Result object with updated holiday
 */
export const updateHoliday = async (id, data) => {
  try {
    console.log('[Holidays DB] Updating holiday:', id, data);
    
    const holiday = await prisma.holiday.update({
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
      data: holiday
    };
  } catch (error) {
    console.error('[Holidays DB] Error updating holiday:', error);
    
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
 * Delete a holiday
 * 
 * @param {number} id - Holiday ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteHoliday = async (id) => {
  try {
    console.log('[Holidays DB] Deleting holiday:', id);
    
    await prisma.holiday.delete({
      where: { id: parseInt(id) }
    });
    
    return {
      success: true,
      message: 'Holiday deleted successfully'
    };
  } catch (error) {
    console.error('[Holidays DB] Error deleting holiday:', error);
    
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
