/**
 * Classes Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for class operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getClasses, 
  getClassById as getClassByIdFromDb, 
  createClass as createClassInDb, 
  updateClass as updateClassInDb, 
  deleteClass as deleteClassInDb, 
  getClassesByProgram as getClassesByProgramFromDb,
  getClassesBySubject as getClassesBySubjectFromDb,
  getClassesByInstructor as getClassesByInstructorFromDb
} from '../db/classes-postgres.js';
import { createTtlCache } from '../utils/ttlCache.js';
import { invalidateProgramCountsCache } from './programs.js';
import { invalidateSubjectCountsCache } from './subjects.js';

// Cache: classId → { enrollments: N }
const classEnrollmentCountsCache = createTtlCache('classEnrollmentCounts', 60_000);

/**
 * Get all classes with business logic
 * 
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllClasses = async (params = {}, user = null) => {
  try {
    // Add business logic here (authorization, validation, etc.)
    const result = await getClasses(params);
    
    // Populate cache from fresh data
    if (result.success && result.data) {
      result.data.forEach(c => {
        if (c._count) {
          classEnrollmentCountsCache.set(c.id, { enrollments: c._count.enrollments ?? 0 });
        }
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in getAllClasses:', error);
    return {
      success: false,
      error: 'Internal server error' || 'Failed to retrieve classes',
      data: []
    };
  }
};

/**
 * Get class by ID with business logic
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getClassById = async (classId, user = null) => {
  try {
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    const result = await getClassByIdFromDb(classId);
    return result;
  } catch (error) {
    console.error('Error in getClassById:', error);
    return {
      success: false,
      error: 'Internal server error' || 'Failed to retrieve class',
      data: null
    };
  }
};

/**
 * Create new class with business logic
 * 
 * @param {Object} classData - Class data
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createClass = async (classData, user = null) => {
  try {
    // Business validation
    if (!classData.nameEn) {
      return {
        success: false,
        error: 'Class name (English) is required',
        data: null
      };
    }
    
    if (!classData.code) {
      return {
        success: false,
        error: 'Class code is required',
        data: null
      };
    }
    
    if (!classData.programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    if (!classData.subjectId) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: null
      };
    }
    
    const result = await createClassInDb(classData, user);
    if (result.success) {
      // New class affects program and subject counts
      invalidateProgramCountsCache();
      invalidateSubjectCountsCache();
    }
    return result;
  } catch (error) {
    console.error('Error in createClass:', error);
    return {
      success: false,
      error: 'Internal server error' || 'Failed to create class',
      data: null
    };
  }
};

/**
 * Update class with business logic
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} updateData - Class data to update
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateClass = async (classId, updateData, user = null) => {
  try {
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    const result = await updateClassInDb(classId, updateData, user);
    if (result.success) {
      classEnrollmentCountsCache.invalidate(classId);
      // If program or subject changed, invalidate their counts too
      if (updateData.programId !== undefined || updateData.subjectId !== undefined) {
        invalidateProgramCountsCache();
        invalidateSubjectCountsCache();
      }
    }
    return result;
  } catch (error) {
    console.error('Error in updateClass:', error);
    return {
      success: false,
      error: 'Internal server error' || 'Failed to update class',
      data: null
    };
  }
};

/**
 * Delete class with business logic
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteClass = async (classId, user = null, options = {}) => {
  try {
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    const result = await deleteClassInDb(classId, user, options);
    if (result.success) {
      classEnrollmentCountsCache.invalidate(classId);
      invalidateProgramCountsCache();
      invalidateSubjectCountsCache();
    }
    return result;
  } catch (error) {
    console.error('Error in deleteClass:', error);
    return {
      success: false,
      error: 'Internal server error' || 'Failed to delete class',
      data: null
    };
  }
};

/**
 * Get classes by program with business logic
 * 
 * @param {number|string} programId - Program ID
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getClassesByProgram = async (programId, params = {}, user = null) => {
  try {
    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    const result = await getClassesByProgramFromDb(programId, params);
    return result;
  } catch (error) {
    console.error('Error in getClassesByProgram:', error);
    return {
      success: false,
      error: 'Internal server error' || 'Failed to retrieve classes for program',
      data: []
    };
  }
};

/**
 * Get classes by subject with business logic
 * 
 * @param {number|string} subjectId - Subject ID
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getClassesBySubject = async (subjectId, params = {}, user = null) => {
  try {
    if (!subjectId) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: []
      };
    }
    
    const result = await getClassesBySubjectFromDb(subjectId, params);
    return result;
  } catch (error) {
    console.error('Error in getClassesBySubject:', error);
    return {
      success: false,
      error: 'Internal server error' || 'Failed to retrieve classes for subject',
      data: []
    };
  }
};

/**
 * Get classes by instructor with business logic
 * 
 * @param {number|string} instructorId - Instructor ID
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getClassesByInstructor = async (instructorId, params = {}, user = null) => {
  try {
    if (!instructorId) {
      return {
        success: false,
        error: 'Instructor ID is required',
        data: []
      };
    }
    
    const result = await getClassesByInstructorFromDb(instructorId, params);
    return result;
  } catch (error) {
    console.error('Error in getClassesByInstructor:', error);
    return {
      success: false,
      error: 'Internal server error' || 'Failed to retrieve classes for instructor',
      data: []
    };
  }
};

export function invalidateClassEnrollmentCountsCache(classId) {
  classEnrollmentCountsCache.invalidate(classId);
}

export default {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassesByProgram,
  getClassesBySubject,
  getClassesByInstructor,
  invalidateClassEnrollmentCountsCache
};
