/**
 * Resource Type Service - Interface Layer
 * 
 * PURPOSE: Public API for resource type operations
 * ARCHITECTURE: Frontend Components → Resource Type Service → Lookup System
 */

import { info, error, warn, debug } from '../utils/logger.js';
import api from '@api';

const serviceName = 'resourceTypeService';

const normalizeResourceType = (item = {}) => ({
  ...item,
  descriptionEn: item.descriptionEn ?? item.description ?? '',
  descriptionAr: item.descriptionAr ?? item.description ?? '',
  sortOrder: item.sortOrder ?? item.sort ?? item.level ?? 0,
  icon: item.icon ?? null,
  color: item.color ?? null
});

/**
 * Get all resource types - using unified lookup endpoint
 */
export const getResourceTypes = async (params = {}) => {
  try {
    info(`${serviceName}:getResourceTypes`, { params });
    
    // Use unified lookup endpoint instead of deprecated resource-types endpoint
    const queryParams = new URLSearchParams({
      types: 'resource-types',
      activeOnly: params.activeOnly !== false ? 'true' : 'false',
      ...(params.orderBy && { orderBy: params.orderBy }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.limit && { limit: params.limit.toString() })
    });
    
    const result = await api.get(`/lookup?${queryParams}`);
    
    // Extract the resource-types array from the lookup response
    if (result.success && result.data && result.data['resource-types']) {
      return {
        success: true,
        data: (result.data['resource-types'] || []).map(normalizeResourceType),
        error: null
      };
    }
    
    return {
      success: false,
      error: 'Resource types not found in response',
      data: []
    };
  } catch (err) {
    error(`${serviceName}:getResourceTypes:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load resource types',
      data: []
    };
  }
};

/**
 * Get resource type by ID - using unified lookup endpoint
 */
export const getResourceTypeById = async (id) => {
  try {
    info(`${serviceName}:getResourceTypeById`, { id });
    
    // Use single lookup endpoint
    const result = await api.get('/lookup/resource-types?activeOnly=false');
    
    const found = (result?.data || []).find((item) => Number(item.id) === Number(id));

    if (result.success && found) {
      return {
        success: true,
        data: normalizeResourceType(found),
        error: null
      };
    }
    
    return {
      success: false,
      error: 'Resource type not found',
      data: null
    };
  } catch (err) {
    error(`${serviceName}:getResourceTypeById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to load resource type',
      data: null
    };
  }
};

/**
 * Create new resource type - using unified lookup endpoint
 */
export const createResourceType = async (resourceTypeData) => {
  try {
    info(`${serviceName}:createResourceType`, { resourceTypeData });
    
    // Use unified lookup endpoint
    const payload = {
      ...resourceTypeData,
      description: resourceTypeData.descriptionEn ?? resourceTypeData.descriptionAr ?? resourceTypeData.description ?? ''
    };
    const result = await api.post('/lookup/resource-types', payload);
    return result;
  } catch (err) {
    error(`${serviceName}:createResourceType:error`, { error: err.message, resourceTypeData });
    return {
      success: false,
      error: err.message || 'Failed to create resource type',
      data: null
    };
  }
};

/**
 * Update resource type - using unified lookup endpoint
 */
export const updateResourceType = async (id, updateData) => {
  try {
    info(`${serviceName}:updateResourceType`, { id, updateData });
    
    // Use unified lookup endpoint
    const payload = {
      ...updateData,
      description: updateData.descriptionEn ?? updateData.descriptionAr ?? updateData.description ?? ''
    };
    const result = await api.put(`/lookup/resource-types/${id}`, payload);
    return result;
  } catch (err) {
    error(`${serviceName}:updateResourceType:error`, { error: err.message, id, updateData });
    return {
      success: false,
      error: err.message || 'Failed to update resource type',
      data: null
    };
  }
};

/**
 * Delete resource type - using unified lookup endpoint
 */
export const deleteResourceType = async (id) => {
  try {
    info(`${serviceName}:deleteResourceType`, { id });
    
    // Use unified lookup endpoint (soft delete)
    const result = await api.delete(`/lookup/resource-types/${id}`);
    return result;
  } catch (err) {
    error(`${serviceName}:deleteResourceType:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete resource type',
      data: null
    };
  }
};
