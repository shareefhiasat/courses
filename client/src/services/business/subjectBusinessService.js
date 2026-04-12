/**
 * Subject Business Service
 * 
 * PURPOSE:
 * Business logic layer for subject-related operations
 * This service orchestrates database operations and implements business rules
 * 
 * ARCHITECTURE:
 * Frontend Components → Business Services → Database Services → PostgreSQL
 */

const { dbService } = require('../other/dbService.js');
const { info, error, warn, debug } = require('../utils/logger.js');

const serviceName = 'subjectBusinessService';

const getAllSubjects = async (params = {}) => {
  try {
    info(`${serviceName}:getAllSubjects`, { params });
    const result = await dbService.findMany('subject', params);
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.pagination?.total || 0,
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllSubjects:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load subjects',
      data: []
    };
  }
};

const getSubjectById = async (id) => {
  try {
    info(`${serviceName}:getSubjectById`, { id });
    const result = await dbService.findUnique('subject', id);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getSubjectById:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to load subject',
      data: null
    };
  }
};

const createSubject = async (subjectData, user = null) => {
  try {
    info(`${serviceName}:createSubject`, { data: subjectData });
    
    const result = await dbService.create('subject', subjectData, user);
    
    if (result.success) {
      info(`${serviceName}:createSubject:success`, { subjectId: result.data.id });
      return {
        success: true,
        data: result.data,
        message: 'Subject created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create subject',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createSubject:error`, { error: error.message, data: subjectData });
    return {
      success: false,
      error: error.message || 'Failed to create subject',
      data: null
    };
  }
};

const updateSubject = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateSubject`, { id, data: updateData });
    
    const result = await dbService.update('subject', id, updateData, user);
    
    if (result.success) {
      info(`${serviceName}:updateSubject:success`, { subjectId: id });
      return {
        success: true,
        data: result.data,
        message: 'Subject updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update subject',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateSubject:error`, { error: error.message, id, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update subject',
      data: null
    };
  }
};

const deleteSubject = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteSubject`, { id });
    
    const result = await dbService.softDelete('subject', id, user);
    
    if (result.success) {
      info(`${serviceName}:deleteSubject:success`, { subjectId: id });
      return {
        success: true,
        message: 'Subject deactivated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to deactivate subject',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteSubject:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to deactivate subject',
      data: null
    };
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
