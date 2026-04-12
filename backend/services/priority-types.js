/**
 * Priority Types Business Service
 * Handles business logic for priority types operations
 */

import { 
  getAllPriorityTypes as getAllPriorityTypesFromDb, 
  getPriorityTypeById as getPriorityTypeByIdFromDb, 
  createPriorityType as createPriorityTypeInDb, 
  updatePriorityType as updatePriorityTypeInDb, 
  deletePriorityType as deletePriorityTypeInDb 
} from '../db/priority-types-postgres.js';

/**
 * Get all priority types with business logic
 * @param {Object} params - Query parameters
 * @param {Object} user - User object for authorization
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllPriorityTypes = async (params = {}, user = null) => {
  try {
    // Add business logic here (authorization, validation, etc.)
    const filteredParams = { ...params };
    
    // For now, return all active priority types
    const result = await getAllPriorityTypesFromDb(filteredParams);
    return result;
  } catch (error) {
    console.error('[PriorityTypes Service] Error getting all priority types:', error);
    return {
      success: false,
      error: error.message || 'Failed to get priority types',
      data: null
    };
  }
};

/**
 * Get priority type by ID with business logic
 * @param {number} id - Priority type ID
 * @param {Object} user - User object for authorization
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getPriorityTypeById = async (id, user = null) => {
  try {
    // Add business logic here (authorization, validation, etc.)
    const result = await getPriorityTypeByIdFromDb(id);
    return result;
  } catch (error) {
    console.error('[PriorityTypes Service] Error getting priority type by ID:', error);
    return {
      success: false,
      error: error.message || 'Failed to get priority type',
      data: null
    };
  }
};

/**
 * Create new priority type with business logic
 * @param {Object} priorityTypeData - Priority type data
 * @param {Object} user - User object for authorization
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createPriorityType = async (priorityTypeData, user = null) => {
  try {
    // Business validation
    if (!priorityTypeData.code) {
      return {
        success: false,
        error: 'Priority type code is required',
        data: null
      };
    }
    
    if (!priorityTypeData.nameEn) {
      return {
        success: false,
        error: 'Priority type name (English) is required',
        data: null
      };
    }
    
    if (!priorityTypeData.nameAr) {
      return {
        success: false,
        error: 'Priority type name (Arabic) is required',
        data: null
      };
    }
    
    // Check if code already exists
    const existingByCode = await getPriorityTypeByIdFromDb(priorityTypeData.code);
    if (existingByCode.success) {
      return {
        success: false,
        error: 'Priority type with this code already exists',
        data: null
      };
    }
    
    const result = await createPriorityTypeInDb(priorityTypeData, user);
    return result;
  } catch (error) {
    console.error('[PriorityTypes Service] Error creating priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to create priority type',
      data: null
    };
  }
};

/**
 * Update priority type with business logic
 * @param {number} id - Priority type ID
 * @param {Object} updateData - Update data
 * @param {Object} user - User object for authorization
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updatePriorityType = async (id, updateData, user = null) => {
  try {
    // Business validation for updates
    const allowedPriorities = ['low', 'normal', 'high', 'urgent'];
    if (updateData.code && !allowedPriorities.includes(updateData.code.toLowerCase())) {
      return {
        success: false,
        error: 'Invalid priority code. Must be one of: low, normal, high, urgent',
        data: null
      };
    }
    
    const result = await updatePriorityTypeInDb(id, updateData, user);
    return result;
  } catch (error) {
    console.error('[PriorityTypes Service] Error updating priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to update priority type',
      data: null
    };
  }
};

/**
 * Delete priority type with business logic
 * @param {number} id - Priority type ID
 * @param {Object} user - User object for authorization
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deletePriorityType = async (id, user = null) => {
  try {
    // Business rule: Check if priority type is being used by announcements
    // This would typically involve checking the announcements table
    // For now, allow soft delete
    
    const result = await deletePriorityTypeInDb(id, user);
    return result;
  } catch (error) {
    console.error('[PriorityTypes Service] Error deleting priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete priority type',
      data: null
    };
  }
};
