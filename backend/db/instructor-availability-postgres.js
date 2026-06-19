/**
 * Instructor Availability Database Service
 * 
 * PURPOSE: Database operations for instructor availability with time slots
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all instructor availability entries
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with availability data
 */
export const getInstructorAvailabilities = async (params = {}) => {
  try {
    console.log('[InstructorAvailability DB] Getting availabilities with params:', params);
    
    const {
      page = 1,
      limit = 50,
      search = '',
      instructorUserId = '',
      dayOfWeek = '',
      startDate = '',
      endDate = '',
      timeFrom = '',
      timeTo = '',
      programId = '',
      subjectId = '',
      classId = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { instructor: { firstName: { contains: search, mode: 'insensitive' } } },
        { instructor: { lastName: { contains: search, mode: 'insensitive' } } },
        { instructor: { displayName: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (instructorUserId) {
      where.instructorUserId = parseInt(instructorUserId);
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
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    if (programId) {
      where.programId = parseInt(programId);
    }
    
    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }
    
    if (classId) {
      where.classId = parseInt(classId);
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
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true,
            email: true
          }
        },
        program: true,
        subject: true,
        class: true,
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
      prisma.instructorAvailability.findMany(query),
      prisma.instructorAvailability.count({ where })
    ]);
    
    return {
      success: true,
      data: availabilities,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };
  } catch (error) {
    console.error('[InstructorAvailability DB] Error getting availabilities:', error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Failed to get instructor availabilities',
      code: isPrismaError(error) ? PRISMA_ERRORS[error.code] : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Create an instructor availability entry
 * 
 * @param {Object} data - Availability data
 * @returns {Promise<Object>} - Result object with created availability
 */
export const createInstructorAvailability = async (data) => {
  try {
    console.log('[InstructorAvailability DB] Creating availability:', data);
    
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
        data.instructorUserId,
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
          error: `Time conflict: This instructor already has an availability entry for ${slot.startTime}-${slot.endTime}`,
          code: 'CONFLICT_ERROR'
        };
      }
    }
    
    const availability = await prisma.instructorAvailability.create({
      data: {
        instructorUserId: parseInt(data.instructorUserId),
        dayOfWeek: data.dayOfWeek || [],
        startDate: parseDate(data.startDate),
        endDate: parseDate(data.endDate),
        maxSessionsPerDay: data.maxSessionsPerDay || 3,
        maxHoursPerWeek: data.maxHoursPerWeek || null,
        status: data.status || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy || null,
        programId: data.programId || null,
        subjectId: data.subjectId || null,
        classId: data.classId || null,
        slots: {
          create: data.slots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
        }
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true,
            email: true
          }
        },
        program: true,
        subject: true,
        class: true,
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
    console.error('[InstructorAvailability DB] Error creating availability:', error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Failed to create instructor availability',
      code: isPrismaError(error) ? PRISMA_ERRORS[error.code] : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Update an instructor availability entry
 * 
 * @param {number} id - Availability ID
 * @param {Object} data - Updated availability data
 * @returns {Promise<Object>} - Result object with updated availability
 */
export const updateInstructorAvailability = async (id, data) => {
  try {
    console.log('[InstructorAvailability DB] Updating availability:', id, data);
    
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
          data.instructorUserId,
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
            error: `Time conflict: This instructor already has an availability entry for ${slot.startTime}-${slot.endTime}`,
            code: 'CONFLICT_ERROR'
          };
        }
      }
    }
    
    // Build update data
    const updateData = {
      ...(data.instructorUserId !== undefined && { instructorUserId: parseInt(data.instructorUserId) }),
      ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek || [] }),
      ...(data.startDate !== undefined && { startDate: parseDate(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: parseDate(data.endDate) }),
      ...(data.maxSessionsPerDay !== undefined && { maxSessionsPerDay: data.maxSessionsPerDay }),
      ...(data.maxHoursPerWeek !== undefined && { maxHoursPerWeek: data.maxHoursPerWeek }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
      ...(data.programId !== undefined && { programId: data.programId }),
      ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
      ...(data.classId !== undefined && { classId: data.classId })
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
    
    const availability = await prisma.instructorAvailability.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true,
            email: true
          }
        },
        program: true,
        subject: true,
        class: true,
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
    console.error('[InstructorAvailability DB] Error updating availability:', error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Failed to update instructor availability',
      code: isPrismaError(error) ? PRISMA_ERRORS[error.code] : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Delete an instructor availability entry
 * 
 * @param {number} id - Availability ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteInstructorAvailability = async (id) => {
  try {
    console.log('[InstructorAvailability DB] Deleting availability:', id);
    
    await prisma.instructorAvailability.delete({
      where: { id: parseInt(id) }
    });
    
    return {
      success: true,
      data: null
    };
  } catch (error) {
    console.error('[InstructorAvailability DB] Error deleting availability:', error);
    return {
      success: false,
      error: getPrismaErrorMessage(error) || 'Failed to delete instructor availability',
      code: isPrismaError(error) ? PRISMA_ERRORS[error.code] : 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Check for time conflicts in availability entries
 * 
 * STRICT RULES: No overlapping time slots/days/dates for the same instructor
 * 
 * @param {number} instructorUserId - Instructor User ID
 * @param {string[]} dayOfWeek - Array of days of week
 * @param {string} startTime - Start time (HH:mm)
 * @param {string} endTime - End time (HH:mm)
 * @param {Date|null} startDate - Start date (for date range)
 * @param {Date|null} endDate - End date (for date range)
 * @param {number|null} excludeId - ID to exclude from conflict check (for updates)
 * @returns {Promise<boolean>} - True if conflict exists
 */
async function checkTimeConflict(instructorUserId, dayOfWeek, startTime, endTime, startDate, endDate, excludeId) {
  try {
    const where = {
      instructorUserId: parseInt(instructorUserId),
      isActive: true,
      ...(excludeId && { id: { not: parseInt(excludeId) } })
    };
    
    const existingEntries = await prisma.instructorAvailability.findMany({
      where,
      select: {
        id: true,
        dayOfWeek: true,
        startDate: true,
        endDate: true,
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
      
      if (!dateRangesOverlap) continue;
      
      // Check if days of week overlap
      let daysOverlap = false;
      if (dayOfWeek && dayOfWeek.length > 0 && entry.dayOfWeek && entry.dayOfWeek.length > 0) {
        daysOverlap = dayOfWeek.some(day => entry.dayOfWeek.includes(day));
      } else if (!dayOfWeek || dayOfWeek.length === 0) {
        daysOverlap = true;
      }
      
      if (!daysOverlap) continue;
      
      // Check if time slots overlap
      for (const existingSlot of entry.slots) {
        if (isTimeOverlap(startTime, endTime, existingSlot.startTime, existingSlot.endTime)) {
          console.log('[InstructorAvailability DB] Conflict detected:', {
            existingEntry: entry,
            newEntry: { dayOfWeek, startTime, endTime, startDate, endDate }
          });
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('[InstructorAvailability DB] Error checking time conflict:', error);
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
 * @returns {boolean} - True if times overlap
 */
function isTimeOverlap(start1, end1, start2, end2) {
  const start1Minutes = parseInt(start1.split(':')[0]) * 60 + parseInt(start1.split(':')[1]);
  const end1Minutes = parseInt(end1.split(':')[0]) * 60 + parseInt(end1.split(':')[1]);
  const start2Minutes = parseInt(start2.split(':')[0]) * 60 + parseInt(start2.split(':')[1]);
  const end2Minutes = parseInt(end2.split(':')[0]) * 60 + parseInt(end2.split(':')[1]);
  
  // Two ranges overlap if: (Start1 < End2) and (End1 > Start2)
  return (start1Minutes < end2Minutes) && (end1Minutes > start2Minutes);
}
