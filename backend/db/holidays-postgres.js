/**
 * Holidays Database Service
 * 
 * PURPOSE: Database operations for holidays using PostgreSQL
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';
import {
  expandRecurrenceDates,
  buildRecurrencePattern,
  generateSeriesId,
} from '../utils/schedulingRecurrence.js';

const prisma = new PrismaClient();

const MAX_RECURRING_OCCURRENCES = 500;

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
      sortOrder = 'asc',
      startDate,
      endDate,
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

    // Date range filter: overlap with [startDate, endDate]
    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ endDate: { gte: new Date(startDate) } });
      }
      if (endDate) {
        where.AND.push({ startDate: { lte: new Date(endDate) } });
      }
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
export const createHoliday = async (data, userId) => {
  try {
    console.log('[Holidays DB] Creating holiday:', data);

    const isRecurring = Boolean(data.isRecurring);
    const seriesId = isRecurring ? generateSeriesId() : null;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const durationMs = endDate - startDate;
    const recurrencePattern = isRecurring
      ? data.recurrencePattern || buildRecurrencePattern({
          recurrenceType: data.recurrenceType,
          recurrenceDays: data.recurrenceDays,
          recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
          recurrenceCount: data.recurrenceCount,
        })
      : null;

    const baseRecord = {
      programId: data.programId ? parseInt(data.programId, 10) : null,
      descriptionEn: data.descriptionEn,
      descriptionAr: data.descriptionAr || null,
      type: data.type,
      createdBy: userId,
      updatedBy: userId,
    };

    if (!isRecurring) {
      const holiday = await prisma.holiday.create({
        data: {
          ...baseRecord,
          startDate,
          endDate,
          isRecurring: false,
          recurrencePattern: null,
          seriesId: null,
        },
        include: {
          program: {
            select: { id: true, code: true, nameEn: true, nameAr: true }
          }
        }
      });
      return { success: true, data: holiday };
    }

    const dates = expandRecurrenceDates({
      startDate,
      recurrenceType: data.recurrenceType,
      recurrenceDays: data.recurrenceDays,
      recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
      recurrenceCount: data.recurrenceCount,
      maxOccurrences: MAX_RECURRING_OCCURRENCES,
    });

    if (dates.length === 0) {
      return { success: false, error: 'No valid recurrence dates found' };
    }

    const records = await prisma.$transaction(
      dates.map((date) => {
        const occurrenceStart = new Date(date);
        occurrenceStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
        const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
        return prisma.holiday.create({
          data: {
            ...baseRecord,
            startDate: occurrenceStart,
            endDate: occurrenceEnd,
            isRecurring: true,
            recurrencePattern,
            seriesId,
          },
          include: {
            program: {
              select: { id: true, code: true, nameEn: true, nameAr: true }
            }
          }
        });
      })
    );

    return { success: true, data: records, seriesId, count: records.length };
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
export const updateHoliday = async (id, data, userId) => {
  try {
    console.log('[Holidays DB] Updating holiday:', id, data);

    const existing = await prisma.holiday.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return { success: false, error: 'Holiday not found', code: 'NOT_FOUND' };
    }

    const updateScope = data.updateScope || 'single';
    const updatePayload = {
      ...(data.programId !== undefined && { programId: data.programId ? parseInt(data.programId, 10) : null }),
      ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
      ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      updatedBy: userId,
    };

    if (updateScope === 'series' && existing.seriesId) {
      await prisma.holiday.updateMany({
        where: { seriesId: existing.seriesId },
        data: updatePayload,
      });
      const records = await prisma.holiday.findMany({
        where: { seriesId: existing.seriesId },
        include: { program: { select: { id: true, code: true, nameEn: true, nameAr: true } } },
      });
      return { success: true, data: records, scope: 'series' };
    }

    const holiday = await prisma.holiday.update({
      where: { id: parseInt(id) },
      data: {
        ...updatePayload,
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      },
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
    
    return { success: true, data: holiday, scope: 'single' };
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
 * @param {string} deleteScope - 'single' or 'series'
 * @returns {Promise<Object>} - Result object
 */
export const deleteHoliday = async (id, deleteScope = 'single') => {
  try {
    console.log('[Holidays DB] Deleting holiday:', id);

    const existing = await prisma.holiday.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return { success: false, error: 'Holiday not found', code: 'NOT_FOUND' };
    }

    if (deleteScope === 'series' && existing.seriesId) {
      const { count } = await prisma.holiday.deleteMany({ where: { seriesId: existing.seriesId } });
      return { success: true, message: 'Holiday series deleted successfully', scope: 'series', count };
    }

    await prisma.holiday.delete({ where: { id: parseInt(id) } });
    
    return { success: true, message: 'Holiday deleted successfully', scope: 'single' };
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
