/**
 * Subject Service - ES6 Module
 * 
 * PURPOSE:
 * Provides subject-related business operations with ES6 exports
 * Simple, clean, import/export pattern
 */

import { info, error, warn, debug } from '../utils/logger.js';
import subjectDbService from '../db/subjectDbService-postgres.js';

const serviceName = 'subjectService';

// Core subject operations
export const getAllSubjects = async (params = {}) => {
  try {
    info(`${serviceName}:getAllSubjects`, { params });
    
    // Use PostgreSQL database service
    const result = await subjectDbService.getAll(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getAllSubjects:error`, { error: err.message, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve subjects',
      data: []
    };
  }
};

export const getSubjectById = async (id) => {
  try {
    info(`${serviceName}:getSubjectById`, { id });
    
    // Use PostgreSQL database service
    const result = await subjectDbService.getById(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getSubjectById:error`, { error: err.message, id });
    return {
      success: false,
      error: error.message || 'Failed to retrieve subject',
      data: null
    };
  }
};

export const createSubject = async (subjectData, user = null) => {
  try {
    info(`${serviceName}:createSubject`, { data: subjectData });
    
    // Business rules validation
    if (!subjectData.nameEn) {
      return {
        success: false,
        error: 'Subject name (English) is required',
        data: null
      };
    }
    
    if (!subjectData.nameAr) {
      return {
        success: false,
        error: 'Subject name (Arabic) is required',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...subjectData,
      status: subjectData.status || 'active',
      credits: subjectData.credits || 3,
      createdAt: new Date(),
      isActive: subjectData.isActive !== undefined ? subjectData.isActive : true
    };
    
    // Use PostgreSQL database service
    const result = await subjectDbService.create(processedData);
    return result;
  } catch (err) {
    error(`${serviceName}:createSubject:error`, { error: err.message, data: subjectData });
    return {
      success: false,
      error: err.message || 'Failed to create subject',
      data: null
    };
  }
};

export const updateSubject = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateSubject`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: null
      };
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    
    // Use PostgreSQL database service
    const result = await subjectDbService.update(id, updateData);
    return result;
  } catch (err) {
    error(`${serviceName}:updateSubject:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update subject',
      data: null
    };
  }
};

export const deleteSubject = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteSubject`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: null
      };
    }
    
    // Use PostgreSQL database service
    const result = await subjectDbService.delete(id);
    return result;
  } catch (err) {
    error(`${serviceName}:deleteSubject:error`, { error: err.message, id });
    return {
      success: false,
      error: error.message || 'Failed to delete subject',
      data: null
    };
  }
};

// Query functions
const getSubjectsByProgram = async (programId, params = {}) => {
  try {
    info(`${serviceName}:getSubjectsByProgram`, { programId, params });
    
    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: [],
      total: 0,
      message: 'Program subjects retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getSubjectsByProgram:error`, { error: err.message, programId, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve program subjects',
      data: []
    };
  }
};

const getSubjectsByClass = async (classId, params = {}) => {
  try {
    info(`${serviceName}:getSubjectsByClass`, { classId, params });
    
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: []
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: [],
      total: 0,
      message: 'Class subjects retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getSubjectsByClass:error`, { error: err.message, classId, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve class subjects',
      data: []
    };
  }
};

const getActiveSubjects = async (params = {}) => {
  try {
    info(`${serviceName}:getActiveSubjects`, { params });
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: [],
      total: 0,
      message: 'Active subjects retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getActiveSubjects:error`, { error: err.message, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve active subjects',
      data: []
    };
  }
};

const getSubjectCount = async (params = {}) => {
  try {
    info(`${serviceName}:getSubjectCount`, { params });
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: 0,
      message: 'Subject count retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getSubjectCount:error`, { error: err.message, params });
    return {
      success: false,
      error: error.message || 'Failed to get subject count',
      data: 0
    };
  }
};

// Subject management functions
const activateSubject = async (id, user = null) => {
  try {
    info(`${serviceName}:activateSubject`, { id });
    
    return await updateSubject(id, {
      status: 'active',
      isActive: true,
      activatedAt: new Date()
    }, user);
  } catch (err) {
    error(`${serviceName}:activateSubject:error`, { error: err.message, id });
    return {
      success: false,
      error: error.message || 'Failed to activate subject'
    };
  }
};

const deactivateSubject = async (id, user = null) => {
  try {
    info(`${serviceName}:deactivateSubject`, { id });
    
    return await updateSubject(id, {
      status: 'inactive',
      isActive: false,
      deactivatedAt: new Date()
    }, user);
  } catch (err) {
    error(`${serviceName}:deactivateSubject:error`, { error: err.message, id });
    return {
      success: false,
      error: error.message || 'Failed to deactivate subject'
    };
  }
};

// Class management within subjects
const getClassesForSubject = async (subjectId, params = {}) => {
  try {
    info(`${serviceName}:getClassesForSubject`, { subjectId, params });
    
    if (!subjectId) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: []
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: [],
      total: 0,
      message: 'Subject classes retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getClassesForSubject:error`, { error: err.message, subjectId, params });
    return {
      success: false,
      error: error.message || 'Failed to retrieve subject classes',
      data: []
    };
  }
};

const addClassToSubject = async (subjectId, classData, user = null) => {
  try {
    info(`${serviceName}:addClassToSubject`, { subjectId, data: classData });
    
    if (!subjectId) {
      return {
        success: false,
        error: 'Subject ID is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual database call
    const subjectClass = {
      id: Date.now(),
      subjectId: parseInt(subjectId),
      ...classData,
      addedAt: new Date()
    };
    
    return {
      success: true,
      data: subjectClass,
      message: 'Class added to subject successfully'
    };
  } catch (err) {
    error(`${serviceName}:addClassToSubject:error`, { error: err.message, subjectId, data: classData });
    return {
      success: false,
      error: error.message || 'Failed to add class to subject',
      data: null
    };
  }
};

const removeClassFromSubject = async (subjectId, classId, user = null) => {
  try {
    info(`${serviceName}:removeClassFromSubject`, { subjectId, classId });
    
    if (!subjectId || !classId) {
      return {
        success: false,
        error: 'Subject ID and Class ID are required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      message: 'Class removed from subject successfully'
    };
  } catch (err) {
    error(`${serviceName}:removeClassFromSubject:error`, { error: err.message, subjectId, classId });
    return {
      success: false,
      error: error.message || 'Failed to remove class from subject',
      data: null
    };
  }
};

// Aliases for commonly expected function names
export const getSubjects = getAllSubjects;
export const getSubject = getSubjectById;
export const addSubject = createSubject;
export const updateSubjectData = updateSubject;
export const removeSubject = deleteSubject;

// Default export
export default {
  // Core functions
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  
  // Query functions
  getSubjectsByProgram,
  getSubjectsByClass,
  getActiveSubjects,
  getSubjectCount,
  
  // Subject management
  activateSubject,
  deactivateSubject,
  
  // Class management
  getClassesForSubject,
  addClassToSubject,
  removeClassFromSubject,
  
  // Aliases
  getSubjects,
  getSubject,
  addSubject,
  updateSubjectData,
  removeSubject
};
