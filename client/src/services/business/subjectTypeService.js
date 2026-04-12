/**
 * Subject Type Business Service
 * Handles business logic for subject type operations
 */

import { info, error, warn, debug } from '@services/utils/logger.js';
import lookupDbService from '@services/db/lookupDbService.js';

const serviceName = 'subjectTypeService';

/**
 * Get all active subject types
 */
export const getSubjectTypes = async (params = {}) => {
  try {
    info(`${serviceName}:getSubjectTypes`, { params });
    
    // Use lookup endpoint instead of deprecated subject-types endpoint
    const result = await lookupDbService.getAll('subject-types', params);
    return result;
  } catch (err) {
    error(`${serviceName}:getSubjectTypes:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve subject types',
      data: null
    };
  }
};

/**
 * Get subject type by ID
 */
export const getSubjectTypeById = async (id) => {
  try {
    info(`${serviceName}:getSubjectTypeById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Subject type ID is required',
        data: null
      };
    }
    
    const result = await subjectTypeDbService.getById(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getSubjectTypeById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve subject type',
      data: null
    };
  }
};

/**
 * Create new subject type
 */
export const createSubjectType = async (subjectTypeData, user = null) => {
  try {
    info(`${serviceName}:createSubjectType`, { data: subjectTypeData });
    
    // Business rules validation
    if (!subjectTypeData.code) {
      return {
        success: false,
        error: 'Subject type code is required',
        data: null
      };
    }
    
    if (!subjectTypeData.nameEn) {
      return {
        success: false,
        error: 'Subject type name (English) is required',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...subjectTypeData,
      isActive: subjectTypeData.isActive !== undefined ? subjectTypeData.isActive : true,
      createdAt: new Date(),
      createdBy: user?.id || 1
    };
    
    // Use database service
    const result = await subjectTypeDbService.create(processedData);
    return result;
  } catch (err) {
    error(`${serviceName}:createSubjectType:error`, { error: err.message, data: subjectTypeData });
    return {
      success: false,
      error: err.message || 'Failed to create subject type',
      data: null
    };
  }
};

/**
 * Update subject type
 */
export const updateSubjectType = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateSubjectType`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Subject type ID is required',
        data: null
      };
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    updateData.updatedBy = user?.id || 1;
    
    // Use database service
    const result = await subjectTypeDbService.update(id, updateData);
    return result;
  } catch (err) {
    error(`${serviceName}:updateSubjectType:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update subject type',
      data: null
    };
  }
};

/**
 * Delete subject type (soft delete)
 */
export const deleteSubjectType = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteSubjectType`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Subject type ID is required',
        data: null
      };
    }
    
    const result = await subjectTypeDbService.delete(id);
    return result;
  } catch (err) {
    error(`${serviceName}:deleteSubjectType:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete subject type',
      data: null
    };
  }
};
