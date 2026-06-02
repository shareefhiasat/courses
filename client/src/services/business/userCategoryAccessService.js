import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * User Category Access Service
 * 
 * Service layer for user category access operations
 */

const API_BASE = '/api/v1/user-category-access';

/**
 * Get all user category accesses
 */
export const getAllUserCategoryAccesses = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.roleId) params.append('roleId', filters.roleId);
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.classId) params.append('classId', filters.classId);
    if (filters.canView !== undefined) params.append('canView', filters.canView);
    if (filters.canManage !== undefined) params.append('canManage', filters.canManage);
    
    const response = await fetch(`${API_BASE}?${params}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting user category accesses:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user category access by ID
 */
export const getUserCategoryAccessById = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting user category access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all category access for a user
 */
export const getUserCategoryAccessByUserId = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/user/${userId}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting user category access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all users with access to a category
 */
export const getUsersByCategoryAccess = async (categoryId) => {
  try {
    const response = await fetch(`${API_BASE}/category/${categoryId}/users`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting users by category access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create user category access
 */
export const createUserCategoryAccess = async (data) => {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error creating user category access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user category access
 */
export const updateUserCategoryAccess = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error updating user category access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete user category access
 */
export const deleteUserCategoryAccess = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error deleting user category access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has access to a category
 */
export const checkUserCategoryAccess = async (userId, categoryId, permission = 'view') => {
  try {
    const response = await fetch(`${API_BASE}/check/${userId}/${categoryId}?permission=${permission}`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error checking user category access:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get categories accessible to a user
 */
export const getAccessibleCategoriesForUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/user/${userId}/categories`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting accessible categories:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get programs accessible to a user based on category access
 */
export const getAccessibleProgramsForUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/user/${userId}/programs`);
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error getting accessible programs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bulk assign category access to users
 */
export const bulkAssignCategoryAccess = async (assignments) => {
  try {
    const response = await fetch(`${API_BASE}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignments),
    });
    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    error('Error bulk assigning category access:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getAllUserCategoryAccesses,
  getUserCategoryAccessById,
  getUserCategoryAccessByUserId,
  getUsersByCategoryAccess,
  createUserCategoryAccess,
  updateUserCategoryAccess,
  deleteUserCategoryAccess,
  checkUserCategoryAccess,
  getAccessibleCategoriesForUser,
  getAccessibleProgramsForUser,
  bulkAssignCategoryAccess,
};
