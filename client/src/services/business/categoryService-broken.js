import { info, error, warn, debug } from '../utils/logger.js';

// Import business service functions
import { 
  getAllCategoryTypes as getAllCategoryTypesBusiness,
  getCategoryTypeById as getCategoryTypeByIdBusiness,
  createCategoryType as createCategoryTypeBusiness,
  updateCategoryType as updateCategoryTypeBusiness,
  deleteCategoryType as deleteCategoryTypeBusiness
} from './categoryTypeBusinessService.js';

const API_BASE = '/api/v1';
const serviceName = 'categoryService';

/**
 * Get all categories - public interface
 */
export const getCategories = async (params = {}) => {
  try {
    info(`${serviceName}:getCategories`, { params });
    
    // Use business service layer
    const result = await getAllCategoryTypesBusiness(params);
    return result;
  } catch (error) {
    error(`${serviceName}:getCategories`, error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve categories',
      data: []
    };
  }
};

export const addCategory = async (categoryData, user) => {
  try {
    info(`${serviceName}:addCategory`, { categoryData, user });
    
    // Use business service layer
    const result = await createCategoryTypeBusiness(categoryData);
    return result;
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        code: categoryData.code,
        nameEn: categoryData.nameEn,
        nameAr: categoryData.nameAr,
        descriptionEn: categoryData.descriptionEn,
        descriptionAr: categoryData.descriptionAr,
        icon: categoryData.icon,
        color: categoryData.color,
        order: categoryData.order,
        isActive: categoryData.isActive !== false
      })
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('[CategoryService] Error creating category:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const updateCategory = async (id, categoryData, user) => {
  try {
    const response = await fetch(`${API_BASE}/category-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        code: categoryData.code,
        nameEn: categoryData.nameEn,
        nameAr: categoryData.nameAr,
        descriptionEn: categoryData.descriptionEn,
        descriptionAr: categoryData.descriptionAr,
        icon: categoryData.icon,
        color: categoryData.color,
        order: categoryData.order,
        isActive: categoryData.isActive
      })
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('[CategoryService] Error updating category:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/category-types/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('[CategoryService] Error deleting category:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
};