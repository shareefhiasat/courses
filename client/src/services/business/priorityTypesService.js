/**
 * Priority Types Business Service
 * Handles business logic for priority types operations via unified lookup API
 */

import api from '@api';

const normalizePriorityType = (item = {}) => ({
  ...item,
  descriptionEn: item.descriptionEn ?? item.description ?? '',
  descriptionAr: item.descriptionAr ?? item.description ?? '',
  sortOrder: item.sortOrder ?? item.level ?? 0,
  icon: item.icon ?? null,
  color: item.color ?? null
});

/**
 * Get all priority types
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllPriorityTypes = async (params = {}) => {
  try {
    console.log('[PriorityTypeService] Getting all priority types with params:', params);

    const queryParams = new URLSearchParams({
      types: 'priority-types',
      activeOnly: params.activeOnly !== false ? 'true' : 'false',
      orderBy: params.orderBy || 'nameEn:asc'
    });

    const result = await api.get(`/lookup?${queryParams}`);
    const data = result?.data?.['priority-types'] || [];

    return {
      success: !!result?.success,
      data: data.map(normalizePriorityType),
      error: result?.error || null
    };
  } catch (error) {
    console.error('[PriorityTypeService] Error getting all priority types:', error);
    return {
      success: false,
      error: error.message || 'Failed to get priority types',
      data: null
    };
  }
};

/**
 * Get priority type by ID
 * @param {number} id - Priority type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getPriorityTypeById = async (id) => {
  try {
    const result = await api.get(`/lookup/priority-types?activeOnly=false`);
    const list = result?.data || [];
    const found = list.find((item) => Number(item.id) === Number(id));
    return {
      success: !!found,
      data: found ? normalizePriorityType(found) : null,
      error: found ? null : 'Priority type not found'
    };
  } catch (error) {
    console.error('[PriorityTypeService] Error getting priority type by ID:', error);
    return {
      success: false,
      error: error.message || 'Failed to get priority type',
      data: null
    };
  }
};

/**
 * Create new priority type
 * @param {Object} priorityTypeData - Priority type data
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createPriorityType = async (priorityTypeData) => {
  try {
    const payload = {
      ...priorityTypeData,
      description: priorityTypeData.descriptionEn ?? priorityTypeData.descriptionAr ?? priorityTypeData.description ?? '',
      level: priorityTypeData.sortOrder ?? priorityTypeData.level ?? 0
    };
    const result = await api.post('/lookup/priority-types', payload);
    return result;
  } catch (error) {
    console.error('[PriorityTypeService] Error creating priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to create priority type',
      data: null
    };
  }
};

/**
 * Update priority type
 * @param {number} id - Priority type ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updatePriorityType = async (id, updateData) => {
  try {
    const payload = {
      ...updateData,
      description: updateData.descriptionEn ?? updateData.descriptionAr ?? updateData.description ?? '',
      level: updateData.sortOrder ?? updateData.level ?? 0
    };
    const result = await api.put(`/lookup/priority-types/${id}`, payload);
    return result;
  } catch (error) {
    console.error('[PriorityTypeService] Error updating priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to update priority type',
      data: null
    };
  }
};

/**
 * Delete priority type
 * @param {number} id - Priority type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deletePriorityType = async (id) => {
  try {
    const result = await api.delete(`/lookup/priority-types/${id}`);
    return result;
  } catch (error) {
    console.error('[PriorityTypeService] Error deleting priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete priority type',
      data: null
    };
  }
};
