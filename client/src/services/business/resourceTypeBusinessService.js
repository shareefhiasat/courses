/**
 * Resource Type Business Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for resource type operations
 * ARCHITECTURE: Resource Type Service → Resource Type Business Service → Resource Type Database Service → PostgreSQL
 */

import { info, error, warn, debug } from '../utils/logger.js';

// Import database service instance
import resourceTypeDbService from '../db/resourceTypeDbService-postgres.js';

const serviceName = 'resourceTypeBusinessService';

/**
 * Get all resource types with business logic
 */
export const getAllResourceTypes = async (params = {}) => {
  try {
    info(`${serviceName}:getAllResourceTypes`, { params });
    
    const result = await resourceTypeDbService.getAll(params);
    return result;
  } catch (error) {
    error(`${serviceName}:getAllResourceTypes`, error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve resource types',
      data: []
    };
  }
};

/**
 * Get resource type by ID with business logic
 */
export const getResourceTypeById = async (resourceTypeId) => {
  try {
    if (!resourceTypeId) {
      return {
        success: false,
        error: 'Resource type ID is required',
        data: null
      };
    }
    
    const result = await resourceTypeDbService.getById(resourceTypeId);
    return result;
  } catch (error) {
    error(`${serviceName}:getResourceTypeById`, error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve resource type',
      data: null
    };
  }
};

/**
 * Create new resource type with business logic
 */
export const createResourceType = async (resourceTypeData) => {
  try {
    if (!resourceTypeData.nameEn) {
      return {
        success: false,
        error: 'Resource type name (English) is required',
        data: null
      };
    }
    
    if (!resourceTypeData.code) {
      return {
        success: false,
        error: 'Resource type code is required',
        data: null
      };
    }
    
    const result = await resourceTypeDbService.create(resourceTypeData);
    return result;
  } catch (error) {
    error(`${serviceName}:createResourceType`, error);
    return {
      success: false,
      error: error.message || 'Failed to create resource type',
      data: null
    };
  }
};

/**
 * Update resource type with business logic
 */
export const updateResourceType = async (resourceTypeId, updateData) => {
  try {
    if (!resourceTypeId) {
      return {
        success: false,
        error: 'Resource type ID is required',
        data: null
      };
    }
    
    const result = await resourceTypeDbService.update(resourceTypeId, updateData);
    return result;
  } catch (error) {
    error(`${serviceName}:updateResourceType`, error);
    return {
      success: false,
      error: error.message || 'Failed to update resource type',
      data: null
    };
  }
};

/**
 * Delete resource type with business logic
 */
export const deleteResourceType = async (resourceTypeId) => {
  try {
    if (!resourceTypeId) {
      return {
        success: false,
        error: 'Resource type ID is required',
        data: null
      };
    }
    
    const result = await resourceTypeDbService.delete(resourceTypeId);
    return result;
  } catch (error) {
    error(`${serviceName}:deleteResourceType`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete resource type',
      data: null
    };
  }
};
