/**
 * Requirement Type Business Service
 * Handles business logic for requirement type operations
 */

import { info, error, warn, debug } from '@services/utils/logger.js';
import lookupDbService from '@services/db/lookupDbService.js';

const serviceName = 'requirementTypeService';

/**
 * Get all active requirement types
 */
export const getRequirementTypes = async (params = {}) => {
  try {
    info(`${serviceName}:getRequirementTypes`, { params });
    
    // Use lookup endpoint instead of deprecated requirement-types endpoint
    const result = await lookupDbService.getAll('requirement-types', params);
    return result;
  } catch (err) {
    error(`${serviceName}:getRequirementTypes:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve requirement types',
      data: null
    };
  }
};

/**
 * Get requirement type by ID
 */
export const getRequirementTypeById = async (id) => {
  try {
    info(`${serviceName}:getRequirementTypeById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Requirement type ID is required',
        data: null
      };
    }
    
    const result = await requirementTypeDbService.getById(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getRequirementTypeById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve requirement type',
      data: null
    };
  }
};

/**
 * Create new requirement type
 */
export const createRequirementType = async (requirementTypeData, user = null) => {
  try {
    info(`${serviceName}:createRequirementType`, { data: requirementTypeData });
    
    // Business rules validation
    if (!requirementTypeData.code) {
      return {
        success: false,
        error: 'Requirement type code is required',
        data: null
      };
    }
    
    if (!requirementTypeData.nameEn) {
      return {
        success: false,
        error: 'Requirement type name (English) is required',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...requirementTypeData,
      isActive: requirementTypeData.isActive !== undefined ? requirementTypeData.isActive : true,
      createdAt: new Date(),
      createdBy: user?.id || 1
    };
    
    // Use database service
    const result = await requirementTypeDbService.create(processedData);
    return result;
  } catch (err) {
    error(`${serviceName}:createRequirementType:error`, { error: err.message, data: requirementTypeData });
    return {
      success: false,
      error: err.message || 'Failed to create requirement type',
      data: null
    };
  }
};

/**
 * Update requirement type
 */
export const updateRequirementType = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateRequirementType`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Requirement type ID is required',
        data: null
      };
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    updateData.updatedBy = user?.id || 1;
    
    // Use database service
    const result = await requirementTypeDbService.update(id, updateData);
    return result;
  } catch (err) {
    error(`${serviceName}:updateRequirementType:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update requirement type',
      data: null
    };
  }
};

/**
 * Delete requirement type (soft delete)
 */
export const deleteRequirementType = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteRequirementType`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Requirement type ID is required',
        data: null
      };
    }
    
    const result = await requirementTypeDbService.delete(id);
    return result;
  } catch (err) {
    error(`${serviceName}:deleteRequirementType:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete requirement type',
      data: null
    };
  }
};
