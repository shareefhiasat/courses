/**
 * Target Audience Types Service
 * 
 * Business service layer for target audience types operations
 */

import { info, error, warn } from '@services/utils/logger.js';
import { targetAudienceTypesDbService } from '@services/db/targetAudienceTypesDbService.js';

/**
 * Get all target audience types
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllTargetAudienceTypes = async (params = {}) => {
  try {
    info('[TargetAudienceService] Getting all target audience types with params:', params);
    
    const result = await targetAudienceTypesDbService.getAll(params);
    
    if (result.success) {
      info('[TargetAudienceService] ✅ Retrieved target audience types:', {
        count: result.data?.length || 0,
        firstItem: result.data?.[0] || null
      });
      return result;
    } else {
      error('[TargetAudienceService] ❌ Failed to retrieve target audience types:', result.error);
      return result;
    }
  } catch (err) {
    error('[TargetAudienceService] ❌ Unexpected error:', err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Get target audience type by ID
 * @param {number} id - Target audience type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getTargetAudienceTypeById = async (id) => {
  try {
    info('[TargetAudienceService] Getting target audience type by ID:', { id });
    
    if (!id) {
      warn('[TargetAudienceService] Target audience type ID is required');
      return { success: false, error: 'Target audience type ID is required', data: null };
    }
    
    const result = await targetAudienceTypesDbService.getById(id);
    
    if (result.success) {
      info('[TargetAudienceService] ✅ Retrieved target audience type:', result.data);
      return result;
    } else {
      error('[TargetAudienceService] ❌ Failed to retrieve target audience type:', result.error);
      return result;
    }
  } catch (err) {
    error('[TargetAudienceService] ❌ Unexpected error:', err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Create target audience type
 * @param {Object} targetAudienceTypeData - Target audience type data
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createTargetAudienceType = async (targetAudienceTypeData) => {
  try {
    info('[TargetAudienceService] Creating target audience type:', targetAudienceTypeData);
    
    if (!targetAudienceTypeData.code || !targetAudienceTypeData.nameEn) {
      warn('[TargetAudienceService] Code and nameEn are required');
      return { success: false, error: 'Code and nameEn are required', data: null };
    }
    
    const result = await targetAudienceTypesDbService.create(targetAudienceTypeData);
    
    if (result.success) {
      info('[TargetAudienceService] ✅ Created target audience type:', result.data);
      return result;
    } else {
      error('[TargetAudienceService] ❌ Failed to create target audience type:', result.error);
      return result;
    }
  } catch (err) {
    error('[TargetAudienceService] ❌ Unexpected error:', err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Update target audience type
 * @param {number} id - Target audience type ID
 * @param {Object} targetAudienceTypeData - Target audience type data
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateTargetAudienceType = async (id, targetAudienceTypeData) => {
  try {
    info('[TargetAudienceService] Updating target audience type:', { id, data: targetAudienceTypeData });
    
    if (!id) {
      warn('[TargetAudienceService] Target audience type ID is required');
      return { success: false, error: 'Target audience type ID is required', data: null };
    }
    
    const result = await targetAudienceTypesDbService.update(id, targetAudienceTypeData);
    
    if (result.success) {
      info('[TargetAudienceService] ✅ Updated target audience type:', result.data);
      return result;
    } else {
      error('[TargetAudienceService] ❌ Failed to update target audience type:', result.error);
      return result;
    }
  } catch (err) {
    error('[TargetAudienceService] ❌ Unexpected error:', err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Delete target audience type
 * @param {number} id - Target audience type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteTargetAudienceType = async (id) => {
  try {
    info('[TargetAudienceService] Deleting target audience type:', { id });
    
    if (!id) {
      warn('[TargetAudienceService] Target audience type ID is required');
      return { success: false, error: 'Target audience type ID is required', data: null };
    }
    
    const result = await targetAudienceTypesDbService.delete(id);
    
    if (result.success) {
      info('[TargetAudienceService] ✅ Deleted target audience type');
      return result;
    } else {
      error('[TargetAudienceService] ❌ Failed to delete target audience type:', result.error);
      return result;
    }
  } catch (err) {
    error('[TargetAudienceService] ❌ Unexpected error:', err);
    return { success: false, error: err.message, data: null };
  }
};

// Default export
export default {
  getAllTargetAudienceTypes,
  getTargetAudienceTypeById,
  createTargetAudienceType,
  updateTargetAudienceType,
  deleteTargetAudienceType
};
