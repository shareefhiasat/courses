/**
 * Resource Business Service
 * 
 * PURPOSE: Business logic layer for resource-related operations
 * This service orchestrates database operations and implements business rules
 * 
 * ARCHITECTURE: Frontend Components → Business Services → Database Services → PostgreSQL
 */

import resourceDbService from '../db/resourceDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'resourceBusinessService';

/**
 * Get all resources with business logic
 */
export const getAllResources = async (params = {}) => {
  try {
    info(`${serviceName}:getAllResources`, { params });
    
    const result = await resourceDbService.getAll(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getAllResources:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve resources',
      data: []
    };
  }
};

/**
 * Get resource by ID with business validation
 */
export const getResourceById = async (id) => {
  try {
    info(`${serviceName}:getResourceById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Resource ID is required',
        data: null
      };
    }
    
    const result = await resourceDbService.getById(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getResourceById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve resource',
      data: null
    };
  }
};

/**
 * Create new resource with business validation
 */
export const createResource = async (resourceData, user = null) => {
  try {
    info(`${serviceName}:createResource`, { data: resourceData });
    
    // Business rules validation
    if (!resourceData.titleEn && !resourceData.titleAr) {
      return {
        success: false,
        error: 'Resource title (English or Arabic) is required',
        data: null
      };
    }
    
    if (!resourceData.typeId) {
      return {
        success: false,
        error: 'Resource type is required',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...resourceData,
      isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,
      createdAt: new Date(),
      createdBy: user?.id || 1
    };
    
    // Use database service
    const result = await resourceDbService.create(processedData);
    return result;
  } catch (err) {
    error(`${serviceName}:createResource:error`, { error: err.message, data: resourceData });
    return {
      success: false,
      error: err.message || 'Failed to create resource',
      data: null
    };
  }
};

/**
 * Update resource with business validation
 */
export const updateResource = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateResource`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Resource ID is required',
        data: null
      };
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    updateData.updatedBy = user?.id || 1;
    
    // Use database service
    const result = await resourceDbService.update(id, updateData);
    return result;
  } catch (err) {
    error(`${serviceName}:updateResource:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update resource',
      data: null
    };
  }
};

/**
 * Delete resource (soft delete) with business validation
 */
export const deleteResource = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteResource`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Resource ID is required',
        data: null
      };
    }
    
    const result = await resourceDbService.delete(id);
    return result;
  } catch (err) {
    error(`${serviceName}:deleteResource:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete resource',
      data: null
    };
  }
};

export default {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
};
