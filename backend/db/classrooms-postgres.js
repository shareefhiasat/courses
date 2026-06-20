/**
 * Classrooms Database Service
 * 
 * PURPOSE: Database operations for classrooms using PostgreSQL
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { validateClassroomRemoval } from '../services/availabilityGuardService.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all classrooms from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with classrooms data
 */
export const getClassrooms = async (params = {}) => {
  try {
    console.log('[Classrooms DB] Getting classrooms with params:', params);
    
    const {
      page = 1,
      limit = 50,
      search = '',
      programId = '',
      status = '',
      building = '',
      capacity = '',
      roomNumber = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { locationEn: { contains: search, mode: 'insensitive' } },
        { locationAr: { contains: search, mode: 'insensitive' } },
        { roomNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (programId) {
      where.programId = parseInt(programId);
    }
    
    if (status) {
      where.status = status;
    }
    
    if (building) {
      where.locationEn = { contains: building, mode: 'insensitive' };
    }
    
    if (capacity) {
      where.capacity = parseInt(capacity);
    }
    
    if (roomNumber) {
      where.roomNumber = { contains: roomNumber, mode: 'insensitive' };
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    console.log('[Classrooms DB] Final where clause:', JSON.stringify(where, null, 2));
    
    const [classrooms, total] = await Promise.all([
      prisma.classroom.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
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
      }),
      prisma.classroom.count({ where })
    ]);
    
    return {
      success: true,
      data: classrooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('[Classrooms DB] Error getting classrooms:', error);
    
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
 * Get classroom by ID
 * 
 * @param {number} id - Classroom ID
 * @returns {Promise<Object>} - Result object with classroom data
 */
export const getClassroomById = async (id) => {
  try {
    console.log('[Classrooms DB] Getting classroom by ID:', id);
    
    const classroom = await prisma.classroom.findUnique({
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
    
    if (!classroom) {
      return {
        success: false,
        error: 'Classroom not found',
        code: 'NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: classroom
    };
  } catch (error) {
    console.error('[Classrooms DB] Error getting classroom by ID:', error);
    
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
 * Get classrooms by program ID
 * 
 * @param {number} programId - Program ID
 * @returns {Promise<Object>} - Result object with classrooms data
 */
export const getClassroomsByProgram = async (programId) => {
  try {
    console.log('[Classrooms DB] Getting classrooms by program ID:', programId);
    
    const classrooms = await prisma.classroom.findMany({
      where: {
        programId: parseInt(programId),
        isActive: true
      },
      orderBy: { code: 'asc' }
    });
    
    return {
      success: true,
      data: classrooms
    };
  } catch (error) {
    console.error('[Classrooms DB] Error getting classrooms by program:', error);
    
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
 * Get available classrooms for a specific date and time slot
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with available classrooms
 */
export const getAvailableClassrooms = async (params) => {
  try {
    console.log('[Classrooms DB] Getting available classrooms:', params);
    
    const { date, timeSlotId, programId } = params;
    
    if (!date || !timeSlotId) {
      return {
        success: false,
        error: 'Date and timeSlotId are required',
        code: 'INVALID_PARAMS'
      };
    }
    
    // Get all classrooms (filtered by program if provided)
    const where = {
      isActive: true,
      status: 'Available'
    };
    
    if (programId) {
      where.programId = parseInt(programId);
    }
    
    const allClassrooms = await prisma.classroom.findMany({
      where,
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
    
    // Get classrooms already booked for this date and time slot
    const bookedClassroomIds = await prisma.scheduleSession.findMany({
      where: {
        date: new Date(date),
        timeSlotId: parseInt(timeSlotId),
        isCancelled: false,
        isActive: true,
        classroomId: { not: null }
      },
      select: { classroomId: true }
    }).then(sessions => sessions.map(s => s.classroomId));
    
    // Filter out booked classrooms
    const availableClassrooms = allClassrooms.filter(
      classroom => !bookedClassroomIds.includes(classroom.id)
    );
    
    return {
      success: true,
      data: availableClassrooms
    };
  } catch (error) {
    console.error('[Classrooms DB] Error getting available classrooms:', error);
    
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
 * Create a new classroom
 * 
 * @param {Object} data - Classroom data
 * @returns {Promise<Object>} - Result object with created classroom
 */
export const createClassroom = async (data) => {
  try {
    console.log('[Classrooms DB] Creating classroom:', data);
    
    const classroom = await prisma.classroom.create({
      data
    });
    
    return {
      success: true,
      data: classroom
    };
  } catch (error) {
    console.error('[Classrooms DB] Error creating classroom:', error);
    
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
 * Update a classroom
 * 
 * @param {number} id - Classroom ID
 * @param {Object} data - Updated classroom data
 * @returns {Promise<Object>} - Result object with updated classroom
 */
export const updateClassroom = async (id, data) => {
  try {
    console.log('[Classrooms DB] Updating classroom:', id, data);
    
    const classroom = await prisma.classroom.update({
      where: { id: parseInt(id) },
      data,
      include: {
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
      data: classroom
    };
  } catch (error) {
    console.error('[Classrooms DB] Error updating classroom:', error);
    
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
 * Delete a classroom
 * 
 * @param {number} id - Classroom ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteClassroom = async (id) => {
  try {
    console.log('[Classrooms DB] Deleting classroom:', id);
    
    const classroomId = parseInt(id);

    const guardResult = await validateClassroomRemoval(classroomId);
    if (!guardResult.valid) {
      return {
        success: false,
        error: guardResult.conflicts.map((c) => c.message).join('. '),
        code: 'HAS_RELATED_RECORDS',
        conflicts: guardResult.conflicts
      };
    }
    
    await prisma.classroom.delete({
      where: { id: classroomId }
    });
    
    return {
      success: true,
      message: 'Classroom deleted successfully'
    };
  } catch (error) {
    console.error('[Classrooms DB] Error deleting classroom:', error);
    
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
