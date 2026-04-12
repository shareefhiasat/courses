/**
 * Category Type Service - Interface Layer
 * 
 * PURPOSE: Public API for category type operations
 * ARCHITECTURE: Frontend Components → Category Type Service → Category Type Business Service → Database Service
 */

import { info, error, warn, debug } from '../utils/logger.js';

// Import business service functions
import { 
  getAllCategoryTypes as getAllCategoryTypesBusiness,
  getCategoryTypeById as getCategoryTypeByIdBusiness,
  createCategoryType as createCategoryTypeBusiness,
  updateCategoryType as updateCategoryTypeBusiness,
  deleteCategoryType as deleteCategoryTypeBusiness
} from './categoryTypeBusinessService.js';

const serviceName = 'categoryTypeService';

/**
 * Get all category types - public interface
 */
export const getCategoryTypes = async (params = {}) => {
  try {
    info(`${serviceName}:getCategoryTypes`, { params });
    
    // Use business service layer
    const result = await getAllCategoryTypesBusiness(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getCategoryTypes:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load category types',
      data: []
    };
  }
};

/**
 * Get category type by ID - public interface
 */
export const getCategoryTypeById = async (id) => {
  try {
    info(`${serviceName}:getCategoryTypeById`, { id });
    
    // Use business service layer
    const result = await getCategoryTypeByIdBusiness(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getCategoryTypeById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to load category type',
      data: null
    };
  }
};

/**
 * Create new category type - public interface
 */
export const createCategoryType = async (categoryTypeData) => {
  try {
    info(`${serviceName}:createCategoryType`, { categoryTypeData });
    
    // Use business service layer
    const result = await createCategoryTypeBusiness(categoryTypeData);
    return result;
  } catch (err) {
    error(`${serviceName}:createCategoryType:error`, { error: err.message, categoryTypeData });
    return {
      success: false,
      error: err.message || 'Failed to create category type',
      data: null
    };
  }
};

/**
 * Update category type - public interface
 */
export const updateCategoryType = async (id, updateData) => {
  try {
    info(`${serviceName}:updateCategoryType`, { id, updateData });
    
    // Use business service layer
    const result = await updateCategoryTypeBusiness(id, updateData);
    return result;
  } catch (err) {
    error(`${serviceName}:updateCategoryType:error`, { error: err.message, id, updateData });
    return {
      success: false,
      error: err.message || 'Failed to update category type',
      data: null
    };
  }
};

/**
 * Delete category type - public interface
 */
export const deleteCategoryType = async (id) => {
  try {
    info(`${serviceName}:deleteCategoryType`, { id });
    
    // Use business service layer
    const result = await deleteCategoryTypeBusiness(id);
    return result;
  } catch (err) {
    error(`${serviceName}:deleteCategoryType:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete category type',
      data: null
    };
  }
};
