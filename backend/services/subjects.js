/**
 * Subjects Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for subject operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getSubjects as getSubjectsFromDb, 
  getSubjectById as getSubjectByIdFromDb, 
  createSubject as createSubjectInDb, 
  updateSubject as updateSubjectInDb, 
  deleteSubject as deleteSubjectFromDb, 
  getSubjectsByProgram as getSubjectsByProgramFromDb 
} from '../db/subjects-postgres.js';

/**
 * Get all subjects with business logic
 */
export const getAllSubjects = async (params = {}, user = null) => {
  try {
    console.log('🔍 Subjects service called with params:', params);
    const result = await getSubjectsFromDb(params);
    
    // Debug logging to see what's being returned
    console.log('🔍 Subjects service result:', {
      success: result.success,
      dataLength: result.data?.length,
      firstSubject: result.data?.[0],
      result: result
    });
    
    return result;
  } catch (error) {
    console.error('Error in getAllSubjects:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve subjects',
      data: []
    };
  }
};

/**
 * Get subject by ID with business logic
 */
export const getSubjectById = async (subjectId, user = null) => {
  try {
    if (!subjectId) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: null
      };
    }
    
    const result = await getSubjectByIdFromDb(subjectId);
    return result;
  } catch (error) {
    console.error('Error in getSubjectById:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve subject',
      data: null
    };
  }
};

/**
 * Create new subject with business logic
 */
export const createSubject = async (subjectData, user = null) => {
  try {
    if (!subjectData.nameEn) {
      return {
        success: false,
        error: 'Subject name (English) is required',
        data: null
      };
    }
    
    if (!subjectData.code) {
      return {
        success: false,
        error: 'Subject code is required',
        data: null
      };
    }
    
    if (!subjectData.programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: null
      };
    }
    
    const result = await createSubjectInDb(subjectData, user);
    return result;
  } catch (error) {
    console.error('Error in createSubject:', error);
    return {
      success: false,
      error: error.message || 'Failed to create subject',
      data: null
    };
  }
};

/**
 * Update subject with business logic
 */
export const updateSubject = async (subjectId, updateData, user = null) => {
  try {
    if (!subjectId) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: null
      };
    }
    
    const result = await updateSubjectInDb(subjectId, updateData, user);
    return result;
  } catch (error) {
    console.error('Error in updateSubject:', error);
    return {
      success: false,
      error: error.message || 'Failed to update subject',
      data: null
    };
  }
};

/**
 * Delete subject with business logic
 */
export const deleteSubject = async (subjectId, user = null, options = {}) => {
  try {
    if (!subjectId) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: null
      };
    }
    
    const result = await deleteSubjectFromDb(subjectId, user, options);
    return result;
  } catch (error) {
    console.error('Error in deleteSubject:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete subject',
      data: null
    };
  }
};

/**
 * Get subjects by program with business logic
 */
export const getSubjectsByProgram = async (programId, params = {}, user = null) => {
  try {
    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    const result = await getSubjectsByProgramFromDb(programId, params);
    return result;
  } catch (error) {
    console.error('Error in getSubjectsByProgram:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve subjects for program',
      data: []
    };
  }
};

export default {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByProgram
};
