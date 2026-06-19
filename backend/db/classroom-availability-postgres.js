/**
 * Classroom Availability Database Service
 * 
 * PURPOSE: Database operations for classroom availability time-based entries
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all classroom availability entries
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with availability data
 */
export const getClassroomAvailabilities = async (params = {}) => {
  try {
    console.log('[ClassroomAvailability DB] Getting availabilities with params:', params);
    
    const {
      page = 1,
      limit = 50,
      search = '',
      classroomId = '',
      dayOfWeek = '',
      startDate = '',
      endDate = '',
      timeFrom = '',
      timeTo = '',
      reason = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { classroom: { code: { contains: search, mode: 'insensitive' } } },
        { classroom: { nameEn: { contains: search, mode: 'insensitive' } } },
        { classroom: { nameAr: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (classroomId) {
      where.classroomId = parseInt(classroomId);
    }
    
    if (dayOfWeek) {
      where.dayOfWeek = { has: dayOfWeek };
    }
    
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }
    
    if (reason) {
      where.reason = reason;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build the query
    const query = {
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            locationEn: true
          }
        },
        slots: {
          orderBy: { startTime: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        updater: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        }
      }
    };
    
    // If time filters are provided, add slot filtering
    if (timeFrom || timeTo) {
      query.where.slots = {};
      if (timeFrom) {
        query.where.slots.startTime = { gte: timeFrom };
      }
      if (timeTo) {
        query.where.slots.endTime = { lte: timeTo };
      }
    }
    
    const [availabilities, total] = await Promise.all([
      prisma.classroomAvailability.findMany(query),
      prisma.classroomAvailability.count({ where })
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
    console.error('[ClassroomAvailability DB] Error getting availabilities:', error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Failed to get classroom availabilities',
      code: isPrismaError(error) ? PRISMA_ERRORS[error.code] : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Create a classroom availability entry
 * 
 * @param {Object} data - Availability data
 * @returns {Promise<Object>} - Result object with created availability
 */
export const createClassroomAvailability = async (data) => {
  try {
    console.log('[ClassroomAvailability DB] Creating availability:', data);
    
    // Validate slots array
    if (!data.slots || !Array.isArray(data.slots) || data.slots.length === 0) {
      return {
        success: false,
        error: 'At least one time slot is required',
        code: 'VALIDATION_ERROR'
      };
    }
    
    // Parse dates safely
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [year, month, day] = dateStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    };
    
    // Check for conflicts for each slot
    for (const slot of data.slots) {
      const conflict = await checkTimeConflict(
        data.classroomId,
        data.dayOfWeek,
        slot.startTime,
        slot.endTime,
        data.startDate,
        data.endDate,
        null // Exclude current ID (null for create)
      );
      
      if (conflict) {
        return {
          success: false,
          error: `Time conflict: This classroom already has an availability entry for ${slot.startTime}-${slot.endTime}`,
          code: 'CONFLICT_ERROR'
        };
      }
    }
    
    const availability = await prisma.classroomAvailability.create({
      data: {
        classroomId: parseInt(data.classroomId),
        dayOfWeek: data.dayOfWeek || [],
        startDate: parseDate(data.startDate),
        endDate: parseDate(data.endDate),
        status: data.status || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy || null,
        slots: {
          create: data.slots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
        }
      },
      include: {
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        slots: {
          orderBy: { startTime: 'asc' }
        },
        creator: {
          select: {
            id: true,
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
    console.error('[ClassroomAvailability DB] Error creating availability:', error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Failed to create classroom availability',
      code: isPrismaError(error) ? PRISMA_ERRORS[error.code] : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Update a classroom availability entry
 * 
 * @param {number} id - Availability ID
 * @param {Object} data - Updated availability data
 * @returns {Promise<Object>} - Result object with updated availability
 */
export const updateClassroomAvailability = async (id, data) => {
  try {
    console.log('[ClassroomAvailability DB] Updating availability:', id, data);
    
    // Parse dates safely
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [year, month, day] = dateStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    };
    
    // If slots are provided, validate and check conflicts
    if (data.slots && Array.isArray(data.slots)) {
      if (data.slots.length === 0) {
        return {
          success: false,
          error: 'At least one time slot is required',
          code: 'VALIDATION_ERROR'
        };
      }
      
      // Check for conflicts for each slot
      for (const slot of data.slots) {
        const conflict = await checkTimeConflict(
          data.classroomId,
          data.dayOfWeek,
          slot.startTime,
          slot.endTime,
          data.startDate,
          data.endDate,
          id // Exclude current entry
        );
        
        if (conflict) {
          return {
            success: false,
            error: `Time conflict: This classroom already has an availability entry for ${slot.startTime}-${slot.endTime}`,
            code: 'CONFLICT_ERROR'
          };
        }
      }
    }
    
    // Build update data
    const updateData = {
      ...(data.classroomId !== undefined && { classroomId: parseInt(data.classroomId) }),
      ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek || [] }),
      ...(data.startDate !== undefined && { startDate: parseDate(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: parseDate(data.endDate) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy })
    };
    
    // If slots are provided, delete existing and create new ones
    if (data.slots && Array.isArray(data.slots)) {
      updateData.slots = {
        deleteMany: {}, // Delete all existing slots
        create: data.slots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        }))
      };
    }
    
    const availability = await prisma.classroomAvailability.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        slots: {
          orderBy: { startTime: 'asc' }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        updater: {
          select: {
            id: true,
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
    console.error('[ClassroomAvailability DB] Error updating availability:', error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Failed to update classroom availability',
      code: isPrismaError(error) ? PRISMA_ERRORS[error.code] : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Delete a classroom availability entry
 * 
 * @param {number} id - Availability ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteClassroomAvailability = async (id) => {
  try {
    console.log('[ClassroomAvailability DB] Deleting availability:', id);
    
    const availability = await prisma.classroomAvailability.delete({
      where: { id: parseInt(id) }
    });
    
    return {
      success: true,
      data: availability
    };
  } catch (error) {
    console.error('[ClassroomAvailability DB] Error deleting availability:', error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Failed to delete classroom availability',
      code: isPrismaError(error) ? PRISMA_ERRORS[error.code] : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Check for time conflicts in availability entries
 * 
 * STRICT RULES: No overlapping time slots/days/dates for the same classroom
 * 
 * @param {number} classroomId - Classroom ID
 * @param {string[]} dayOfWeek - Array of days of week (for recurring)
 * @param {string} startTime - Start time (HH:mm)
 * @param {string} endTime - End time (HH:mm)
 * @param {Date|null} startDate - Start date (for date range)
 * @param {Date|null} endDate - End date (for date range)
 * @param {number|null} excludeId - ID to exclude from conflict check (for updates)
 * @returns {Promise<boolean>} - True if conflict exists
 */
async function checkTimeConflict(classroomId, dayOfWeek, startTime, endTime, startDate, endDate, excludeId) {
  try {
    const where = {
      classroomId: parseInt(classroomId),
      isActive: true,
      ...(excludeId && { id: { not: parseInt(excludeId) } })
    };
    
    const existingEntries = await prisma.classroomAvailability.findMany({
      where,
      include: {
        slots: true
      }
    });
    
    // Check each existing entry for conflict
    for (const entry of existingEntries) {
      // Check if date ranges overlap
      const entryStart = entry.startDate ? new Date(entry.startDate) : null;
      const entryEnd = entry.endDate ? new Date(entry.endDate) : null;
      const newStart = startDate ? new Date(startDate) : null;
      const newEnd = endDate ? new Date(endDate) : null;
      
      let dateRangesOverlap = true;
      
      // If both have date ranges, check for overlap
      if (entryStart && entryEnd && newStart && newEnd) {
        // Date ranges overlap if: (StartA <= EndB) and (EndA >= StartB)
        dateRangesOverlap = (entryStart <= newEnd) && (entryEnd >= newStart);
      }
      // If one has no date range, they overlap by default (assume ongoing)
      
      if (!dateRangesOverlap) continue;
      
      // Check if days of week overlap
      let daysOverlap = false;
      if (dayOfWeek && dayOfWeek.length > 0 && entry.dayOfWeek && entry.dayOfWeek.length > 0) {
        daysOverlap = dayOfWeek.some(day => entry.dayOfWeek.includes(day));
      } else if (!dayOfWeek || dayOfWeek.length === 0) {
        // If no days specified, assume all days
        daysOverlap = true;
      }
      
      if (!daysOverlap) continue;
      
      // Check if time slots overlap with any of the entry's slots
      for (const slot of entry.slots) {
        if (isTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
          console.log('[ClassroomAvailability DB] Conflict detected:', {
            existingEntry: entry,
            existingSlot: slot,
            newEntry: { dayOfWeek, startTime, endTime, startDate, endDate }
          });
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('[ClassroomAvailability DB] Error checking time conflict:', error);
    return false;
  }
}

/**
 * Check if two time ranges overlap
 * 
 * @param {string} start1 - Start time 1 (HH:mm)
 * @param {string} end1 - End time 1 (HH:mm)
 * @param {string} start2 - Start time 2 (HH:mm)
 * @param {string} end2 - End time 2 (HH:mm)
 * @returns {boolean} - True if ranges overlap
 */
function isTimeOverlap(start1, end1, start2, end2) {
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  
  // Check for overlap: (StartA < EndB) and (EndA > StartB)
  return s1 < e2 && e1 > s2;
}

