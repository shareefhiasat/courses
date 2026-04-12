/**
 * Resource Service - Interface Layer
 * 
 * PURPOSE: Public API for resource operations
 * ARCHITECTURE: Frontend Components → Resource Service → Resource Business Service → Database Service
 */

import { info, error, warn, debug } from '../utils/logger.js';

// Import business service functions
import { 
  getAllResources as getAllResourcesBusiness,
  getResourceById as getResourceByIdBusiness,
  createResource as createResourceBusiness,
  updateResource as updateResourceBusiness,
  deleteResource as deleteResourceBusiness
} from './resourceBusinessService.js';

const serviceName = 'resourceService';

/**
 * Get all resources - public interface
 */
export const getResources = async (params = {}) => {
  try {
    info(`${serviceName}:getResources`, { params });
    
    // Use business service layer
    const result = await getAllResourcesBusiness(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getResources:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load resources',
      data: []
    };
  }
};

/**
 * Get resource by ID - public interface
 */
export const getResourceById = async (id) => {
  try {
    info(`${serviceName}:getResourceById`, { id });
    
    // Use business service layer
    const result = await getResourceByIdBusiness(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getResourceById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to load resource',
      data: null
    };
  }
};

/**
 * Create resource - public interface
 */
export const createResource = async (resourceData, user = null) => {
  try {
    info(`${serviceName}:createResource`, { data: resourceData });
    
    // Use business service layer
    const result = await createResourceBusiness(resourceData, user);
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

export const addResource = createResource;

/**
 * Update resource - public interface
 */
export const updateResource = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateResource`, { id, data: updateData });
    
    // Use business service layer
    const result = await updateResourceBusiness(id, updateData, user);
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
 * Delete resource - public interface
 */
export const deleteResource = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteResource`, { id });
    
    // Use business service layer
    const result = await deleteResourceBusiness(id, user);
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
  getResources,
  getResourceById,
  createResource,
  addResource,
  updateResource,
  deleteResource
};
