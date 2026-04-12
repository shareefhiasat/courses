import { createServiceLogger } from '@logger';
import api from '@api';
import { getDatabaseUserId } from './authService.js';

const logger = createServiceLogger('categoryService');

const normalizeCategory = (item = {}) => ({
  ...item,
  descriptionEn: item.descriptionEn ?? item.description ?? '',
  descriptionAr: item.descriptionAr ?? item.description ?? '',
  sortOrder: item.sortOrder ?? item.sort ?? 0,
  icon: item.icon ?? null,
  color: item.color ?? null
});

/**
 * Get all categories - using unified lookup endpoint
 */
export const getCategories = async (params = {}) => {
  try {
    logger.info('getCategories', { params });
    
    // Use unified lookup endpoint instead of deprecated category-types endpoint
    const queryParams = new URLSearchParams({
      types: 'category-types',
      activeOnly: params.activeOnly !== false ? 'true' : 'false',
      ...(params.orderBy && { orderBy: params.orderBy }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.limit && { limit: params.limit.toString() })
    });
    
    const result = await api.get(`/lookup?${queryParams}`);
    
    // Extract the category-types array from the lookup response
    if (result.success && result.data && result.data['category-types']) {
      return {
        success: true,
        data: (result.data['category-types'] || []).map(normalizeCategory),
        error: null
      };
    }
    
    return {
      success: false,
      error: 'Category types not found in response',
      data: []
    };
  } catch (error) {
    logger.error('getCategories', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve categories',
      data: []
    };
  }
};

/**
 * Add a new category - using lookup CRUD endpoint
 */
export const addCategory = async (categoryData, user = null) => {
  try {
    logger.info('addCategory', { categoryData, user });
    
    // Use lookup CRUD endpoint for creating categories
    // Get database user ID from Keycloak user
    const userId = await getDatabaseUserId(user);
    const requestData = {
      ...categoryData,
      sort: categoryData.sortOrder ?? categoryData.sort ?? 0,
      createdBy: userId,
      updatedBy: userId
    };
    
    const result = await api.post('/lookup/category-types', requestData);
    
    if (result.success) {
      logger.info('addCategory - Category created successfully', result.data);
    }
    
    return result;
  } catch (error) {
    logger.error('addCategory', error);
    return {
      success: false,
      error: error.message || 'Failed to create category',
      data: null
    };
  }
};

/**
 * Update an existing category - using lookup CRUD endpoint
 */
export const updateCategory = async (categoryId, categoryData, user = null) => {
  try {
    logger.info('updateCategory', { categoryId, categoryData, user });
    
    // Use lookup CRUD endpoint for updating categories
    // Get database user ID from Keycloak user
    const userId = await getDatabaseUserId(user);
    const requestData = {
      ...categoryData,
      sort: categoryData.sortOrder ?? categoryData.sort ?? 0,
      updatedBy: userId
    };
    
    const result = await api.put(`/lookup/category-types/${categoryId}`, requestData);
    
    if (result.success) {
      logger.info('updateCategory - Category updated successfully', result.data);
    }
    
    return result;
  } catch (error) {
    logger.error('updateCategory', error);
    return {
      success: false,
      error: error.message || 'Failed to update category',
      data: null
    };
  }
};

/**
 * Delete a category - using lookup CRUD endpoint
 */
export const deleteCategory = async (categoryId, user = null) => {
  try {
    logger.info('deleteCategory', { categoryId, user });
    
    // Use lookup CRUD endpoint for deleting categories
    // Get database user ID from Keycloak user
    const userId = await getDatabaseUserId(user);
    const requestData = {
      updatedBy: userId
    };
    
    const result = await api.delete(`/lookup/category-types/${categoryId}`, { data: requestData });
    
    if (result.success) {
      logger.info('deleteCategory - Category deleted successfully');
    }
    
    return result;
  } catch (error) {
    logger.error('deleteCategory', error);
    return {
      success: false,
      error: error.message || 'Failed to delete category',
      data: null
    };
  }
};

export default {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
};
