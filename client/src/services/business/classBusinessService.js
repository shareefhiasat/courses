/**
 * Class Business Service
 * 
 * PURPOSE:
 * Business logic layer for class-related operations
 * This service orchestrates database operations and implements business rules
 * 
 * ARCHITECTURE:
 * Frontend Components → Business Services → Database Services → PostgreSQL
 */

import classDbService from '../db/classDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'classBusinessService';

const getAllClasses = async (params = {}) => {
  try {
    info(`${serviceName}:getAllClasses`, { params });
    const result = await classDbService.getAll(params);
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.pagination?.total || 0,
      pagination: result.pagination
    };
  } catch (err) {
    error(`${serviceName}:getAllClasses:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load classes',
      data: []
    };
  }
};

const getClassById = async (id) => {
  try {
    info(`${serviceName}:getClassById`, { id });
    const result = await classDbService.getById(id);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (err) {
    error(`${serviceName}:getClassById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to load class',
      data: null
    };
  }
};

const createClass = async (classData, user = null) => {
  try {
    info(`${serviceName}:createClass`, { data: classData });
    
    const result = await classDbService.create(classData);
    
    if (result.success) {
      info(`${serviceName}:createClass:success`, { classId: result.data.id });
      return {
        success: true,
        data: result.data,
        message: 'Class created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create class',
        data: null
      };
    }
  } catch (err) {
    error(`${serviceName}:createClass:error`, { error: err.message, data: classData });
    return {
      success: false,
      error: err.message || 'Failed to create class',
      data: null
    };
  }
};

const updateClass = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateClass`, { id, data: updateData });
    
    const result = await classDbService.update(id, updateData);
    
    if (result.success) {
      info(`${serviceName}:updateClass:success`, { classId: id });
      return {
        success: true,
        data: result.data,
        message: 'Class updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update class',
        data: null
      };
    }
  } catch (err) {
    error(`${serviceName}:updateClass:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update class',
      data: null
    };
  }
};

const deleteClass = async (id, user = null, options = {}) => {
  try {
    info(`${serviceName}:deleteClass`, { id, force: options.force });
    
    const result = await classDbService.delete(id, options);
    
    if (result.success) {
      info(`${serviceName}:deleteClass:success`, { classId: id });
      return {
        success: true,
        message: result.message || 'Class deactivated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to deactivate class',
        code: result.code,
        dependencies: result.dependencies,
        data: null
      };
    }
  } catch (err) {
    error(`${serviceName}:deleteClass:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to deactivate class',
      data: null
    };
  }
};

export {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
