/**
 * Lookup Service
 * 
 * PURPOSE: Unified CRUD operations for all lookup types
 * ARCHITECTURE: Single service that works with any lookup type
 * 
 * This service provides a consistent interface for creating, reading,
 * updating, and deleting lookup data through the unified lookup API.
 */

import api from '@api';
import logger from '@logger';

const serviceName = 'lookupService';

/**
 * Create lookup item
 * @param {string} lookupType - The lookup type (e.g., 'category-types')
 * @param {object} data - The data to create
 * @returns {Promise<object>} - Result with success flag and data
 */
export const createLookupItem = async (lookupType, data) => {
  try {
    logger.info(`${serviceName}:createLookupItem`, { lookupType, data });
    
    const result = await api.post(`/lookup/${lookupType}`, data);
    
    if (result.success) {
      logger.info(`${serviceName}:createLookupItem - success`, { lookupType, itemId: result.data?.id });
    }
    
    return result;
  } catch (error) {
    logger.error(`${serviceName}:createLookupItem`, error);
    return {
      success: false,
      error: error.message || 'Failed to create lookup item',
      data: null
    };
  }
};

/**
 * Update lookup item
 * @param {string} lookupType - The lookup type
 * @param {string|number} id - The item ID
 * @param {object} data - The data to update
 * @returns {Promise<object>} - Result with success flag and data
 */
export const updateLookupItem = async (lookupType, id, data) => {
  try {
    logger.info(`${serviceName}:updateLookupItem`, { lookupType, id, data });
    
    const result = await api.put(`/lookup/${lookupType}/${id}`, data);
    
    if (result.success) {
      logger.info(`${serviceName}:updateLookupItem - success`, { lookupType, itemId: id });
    }
    
    return result;
  } catch (error) {
    logger.error(`${serviceName}:updateLookupItem`, error);
    return {
      success: false,
      error: error.message || 'Failed to update lookup item',
      data: null
    };
  }
};

/**
 * Delete lookup item (soft delete)
 * @param {string} lookupType - The lookup type
 * @param {string|number} id - The item ID
 * @param {object} user - The current user object
 * @returns {Promise<object>} - Result with success flag and data
 */
export const deleteLookupItem = async (lookupType, id, user) => {
  try {
    logger.info(`${serviceName}:deleteLookupItem`, { lookupType, id, user });
    
    // Get database user ID from Keycloak user
    const { getDatabaseUserId } = await import('@services/business/authService');
    const userId = await getDatabaseUserId(user);
    
    const requestData = {
      updatedBy: userId
    };
    
    const result = await api.delete(`/lookup/${lookupType}/${id}`, { data: requestData });
    
    if (result.success) {
      logger.info(`${serviceName}:deleteLookupItem - success`, { lookupType, itemId: id });
    }
    
    return result;
  } catch (error) {
    logger.error(`${serviceName}:deleteLookupItem`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete lookup item',
      data: null
    };
  }
};

/**
 * Get lookup items
 * @param {string} lookupType - The lookup type
 * @param {object} options - Query options (activeOnly, fields, orderBy)
 * @returns {Promise<object>} - Result with success flag and data
 */
export const getLookupItems = async (lookupType, options = {}) => {
  try {
    logger.info(`${serviceName}:getLookupItems`, { lookupType, options });
    
    const params = new URLSearchParams();
    
    // Add query parameters
    if (options.activeOnly !== undefined) {
      params.append('activeOnly', options.activeOnly.toString());
    }
    if (options.fields) {
      params.append('fields', options.fields.join(','));
    }
    if (options.orderBy) {
      params.append('orderBy', options.orderBy);
    }
    
    const url = `/lookup/${lookupType}${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await api.get(url);
    
    if (result.success) {
      logger.info(`${serviceName}:getLookupItems - success`, { lookupType, count: result.data?.length });
    }
    
    return result;
  } catch (error) {
    logger.error(`${serviceName}:getLookupItems`, error);
    return {
      success: false,
      error: error.message || 'Failed to get lookup items',
      data: null
    };
  }
};

/**
 * Get single lookup item
 * @param {string} lookupType - The lookup type
 * @param {string|number} id - The item ID
 * @returns {Promise<object>} - Result with success flag and data
 */
export const getLookupItem = async (lookupType, id) => {
  try {
    logger.info(`${serviceName}:getLookupItem`, { lookupType, id });
    
    const result = await api.get(`/lookup/${lookupType}/${id}`);
    
    if (result.success) {
      logger.info(`${serviceName}:getLookupItem - success`, { lookupType, itemId: id });
    }
    
    return result;
  } catch (error) {
    logger.error(`${serviceName}:getLookupItem`, error);
    return {
      success: false,
      error: error.message || 'Failed to get lookup item',
      data: null
    };
  }
};

/**
 * Get all lookup types with their items
 * @param {array} lookupTypes - Array of lookup type keys
 * @param {object} options - Query options
 * @returns {Promise<object>} - Result with success flag and data
 */
export const getAllLookupTypes = async (lookupTypes, options = {}) => {
  try {
    logger.info(`${serviceName}:getAllLookupTypes`, { lookupTypes, options });
    
    const params = new URLSearchParams();
    
    // Add query parameters
    if (options.activeOnly !== undefined) {
      params.append('activeOnly', options.activeOnly.toString());
    }
    if (options.fields) {
      params.append('fields', options.fields.join(','));
    }
    if (options.orderBy) {
      params.append('orderBy', options.orderBy);
    }
    
    const url = `/lookup${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await api.get(url);
    
    if (result.success) {
      logger.info(`${serviceName}:getAllLookupTypes - success`, { 
        lookupTypes, 
        counts: Object.keys(result.data || {}).reduce((acc, key) => {
          acc[key] = result.data[key]?.length || 0;
          return acc;
        }, {})
      });
    }
    
    return result;
  } catch (error) {
    logger.error(`${serviceName}:getAllLookupTypes`, error);
    return {
      success: false,
      error: error.message || 'Failed to get lookup types',
      data: null
    };
  }
};

// Default export
export default {
  createLookupItem,
  updateLookupItem,
  deleteLookupItem,
  getLookupItems,
  getLookupItem,
  getAllLookupTypes
};
