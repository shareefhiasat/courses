/**
 * Category Type Business Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for category type operations
 * ARCHITECTURE: Category Type Service → Category Type Business Service → Category Type Database Service → PostgreSQL
 */

import { info, error, warn, debug } from '../utils/logger.js';

// Import database service instance
import categoryTypeDbService from '../db/categoryTypeDbService-postgres.js';

const serviceName = 'categoryTypeBusinessService';

/**
 * Get all category types with business logic
 */
export const getAllCategoryTypes = async (params = {}) => {
  try {
    info(`${serviceName}:getAllCategoryTypes`, { params });
    
    const result = await categoryTypeDbService.getAll(params);
    return result;
  } catch (error) {
    error(`${serviceName}:getAllCategoryTypes`, error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve category types',
      data: []
    };
  }
};

/**
 * Get category type by ID with business logic
 */
export const getCategoryTypeById = async (categoryTypeId) => {
  try {
    if (!categoryTypeId) {
      return {
        success: false,
        error: 'Category type ID is required',
        data: null
      };
    }
    
    const result = await categoryTypeDbService.getById(categoryTypeId);
    return result;
  } catch (error) {
    error(`${serviceName}:getCategoryTypeById`, error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve category type',
      data: null
    };
  }
};

/**
 * Create new category type with business logic
 */
export const createCategoryType = async (categoryTypeData) => {
  try {
    if (!categoryTypeData.nameEn) {
      return {
        success: false,
        error: 'Category type name (English) is required',
        data: null
      };
    }
    
    if (!categoryTypeData.code) {
      return {
        success: false,
        error: 'Category type code is required',
        data: null
      };
    }
    
    const result = await categoryTypeDbService.create(categoryTypeData);
    return result;
  } catch (error) {
    error(`${serviceName}:createCategoryType`, error);
    return {
      success: false,
      error: error.message || 'Failed to create category type',
      data: null
    };
  }
};

/**
 * Update category type with business logic
 */
export const updateCategoryType = async (categoryTypeId, updateData) => {
  try {
    if (!categoryTypeId) {
      return {
        success: false,
        error: 'Category type ID is required',
        data: null
      };
    }
    
    const result = await categoryTypeDbService.update(categoryTypeId, updateData);
    return result;
  } catch (error) {
    error(`${serviceName}:updateCategoryType`, error);
    return {
      success: false,
      error: error.message || 'Failed to update category type',
      data: null
    };
  }
};

/**
 * Delete category type with business logic
 */
export const deleteCategoryType = async (categoryTypeId) => {
  try {
    if (!categoryTypeId) {
      return {
        success: false,
        error: 'Category type ID is required',
        data: null
      };
    }
    
    const result = await categoryTypeDbService.delete(categoryTypeId);
    return result;
  } catch (error) {
    error(`${serviceName}:deleteCategoryType`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete category type',
      data: null
    };
  }
};
