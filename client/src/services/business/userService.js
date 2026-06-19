import { info, error, warn, debug } from '../utils/logger.js';
import { appConfig } from '../config/apiConfig.js';
import { getLocalizedUserName } from '../../utils/localizedUserName.js';

const serviceName = 'userService';
const API_BASE = appConfig.getApiBaseUrl();

// Helper function to get normalized roles from user object
export const getUserRoles = (user) => {
  if (!user || typeof user !== 'object') {
    return [];
  }
  
  // Check for roleAssignments array (database format)
  if (user.roleAssignments && Array.isArray(user.roleAssignments)) {
    const assignedRoles = user.roleAssignments
      .map(ra => ra.role?.code?.toLowerCase()) // Convert to lowercase
      .filter(code => code);
    if (assignedRoles.length > 0) {
      return assignedRoles;
    }
  }
  
  // Check for roles array (Keycloak format)
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.map(role => role.toLowerCase());
  }
  
  // Check for realm_access.roles (Keycloak token format)
  if (user.realm_access?.roles && Array.isArray(user.realm_access.roles)) {
    return user.realm_access.roles.map(role => role.toLowerCase());
  }
  
  // Check for resource_access.roles (Keycloak client roles)
  const clientId = import.meta.env?.VITE_KEYCLOAK_CLIENT_ID || 'military-lms-app';
  if (user.resource_access?.[clientId]?.roles && Array.isArray(user.resource_access[clientId].roles)) {
    return user.resource_access[clientId].roles.map(role => role.toLowerCase());
  }
  
  // Fallback to single role property
  const userRole = user.role || user.userRole || user.roleId;
  if (userRole) {
    return [userRole.toString().toLowerCase()];
  }
  
  return [];
};

// Role checking functions
export const isAdmin = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    
    const roles = getUserRoles(user);
    return roles.includes('admin') || roles.includes('super_admin');
  } catch (error) {
    error(`${serviceName}:isAdmin:error`, { error: error.message, user });
    return false;
  }
};

export const isSuperAdmin = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    
    const roles = getUserRoles(user);
    return roles.includes('super_admin');
  } catch (error) {
    error(`${serviceName}:isSuperAdmin:error`, { error: error.message, user });
    return false;
  }
};

export const isHR = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    
    const roles = getUserRoles(user);
    return roles.includes('hr') || roles.includes('human_resources');
  } catch (error) {
    error(`${serviceName}:isHR:error`, { error: error.message, user });
    return false;
  }
};

export const isInstructor = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    
    const roles = getUserRoles(user);
    return roles.includes('instructor') || roles.includes('teacher');
  } catch (error) {
    error(`${serviceName}:isInstructor:error`, { error: error.message, user });
    return false;
  }
};

export const isStudent = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    
    const roles = getUserRoles(user);
    return roles.includes('student');
  } catch (error) {
    error(`${serviceName}:isStudent:error`, { error: error.message });
    return false;
  }
};

export const isUserDisabledAtUserLevel = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    
    // Check various disabled properties including isActive from database
    return (
      user?.disabled === true ||
      user?.isDisabled === true ||
      user?.status === 'disabled' ||
      user?.status === 'DISABLED' ||
      user?.enabled === false ||
      user?.isEnabled === false ||
      user?.isActive === false  // Add check for database isActive field
    );
  } catch (error) {
    error(`${serviceName}:isUserDisabledAtUserLevel:error`, { error: error.message });
    return false;
  }
};

// User CRUD operations (Keycloak-based via API)
export const getAllUsers = async (params = {}) => {
  try {
    info(`${serviceName}:getAllUsers`, { params });

    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.first !== undefined) queryParams.append('first', params.first);
    if (params.max !== undefined) queryParams.append('max', params.max);
    if (params.studentsOnly) queryParams.append('studentsOnly', 'true');
    if (params.excludeStudents) queryParams.append('excludeStudents', 'true');

    const response = await fetch(`${API_BASE}/v1/users?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak_token')}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to retrieve users');
    }

    let filteredData = result.data || [];

    // If studentsOnly is true, filter client-side as well (backup)
    if (params.studentsOnly && filteredData.length > 0) {
      filteredData = filteredData.filter(user => {
        const roles = getUserRoles(user);
        return roles.includes('student') && !roles.includes('instructor') && !roles.includes('admin') && !roles.includes('super_admin') && !roles.includes('hr');
      });
    }

    // If excludeStudents is true, filter client-side to exclude students
    if (params.excludeStudents && filteredData.length > 0) {
      filteredData = filteredData.filter(user => {
        const roles = getUserRoles(user);
        return !roles.includes('student');
      });
    }

    return {
      success: true,
      data: filteredData,
      total: filteredData.length,
      message: 'Users retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getAllUsers:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve users',
      data: []
    };
  }
};

export const getUsersByRole = async (role) => {
  try {
    info(`${serviceName}:getUsersByRole`, { role });

    const result = await getAllUsers();
    
    if (!result.success) {
      return result;
    }

    const filteredData = result.data.filter(user => {
      const roles = getUserRoles(user);
      return roles.includes(role.toLowerCase());
    });

    return {
      success: true,
      data: filteredData,
      total: filteredData.length,
      message: `Users with role ${role} retrieved successfully`
    };
  } catch (err) {
    error(`${serviceName}:getUsersByRole:error`, { error: err.message, role });
    return {
      success: false,
      error: err.message || 'Failed to retrieve users by role',
      data: []
    };
  }
};

export const getUserById = async (id) => {
  try {
    info(`${serviceName}:getUserById`, { id });

    const response = await fetch(`${API_BASE}/v1/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak_token')}`
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to retrieve user');
    }
    
    return {
      success: true,
      data: result.data,
      message: 'User retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getUserById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve user',
      data: null
    };
  }
};

export const createUser = async (userData, user = null) => {
  try {
    info(`${serviceName}:createUser`, { data: userData });

    const response = await fetch(`${API_BASE}/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak_token')}`
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create user');
    }
    
    return {
      success: true,
      data: result.data,
      message: 'User created successfully'
    };
  } catch (err) {
    error(`${serviceName}:createUser:error`, { error: err.message, data: userData });
    return {
      success: false,
      error: err.message || 'Failed to create user',
      data: null
    };
  }
};

export const updateUser = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateUser`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'User ID is required',
        data: null
      };
    }
    
    const response = await fetch(`${API_BASE}/v1/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak_token')}`
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update user');
    }
    
    return {
      success: true,
      data: result.data,
      message: 'User updated successfully'
    };
  } catch (err) {
    error(`${serviceName}:updateUser:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update user',
      data: null
    };
  }
};

export const deleteUser = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteUser`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'User ID is required',
        data: null
      };
    }
    
    const response = await fetch(`${API_BASE}/v1/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak_token')}`
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete user');
    }
    
    return {
      success: true,
      message: 'User deleted successfully'
    };
  } catch (err) {
    error(`${serviceName}:deleteUser:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete user',
      data: null
    };
  }
};

export const getUserByEmail = async (email) => {
  try {
    info(`${serviceName}:getUserByEmail`, { email });
    
    // Search for user by email
    const result = await getAllUsers({ search: email });
    
    if (result.success && result.data.length > 0) {
      const user = result.data.find(u => u.email === email);
      return {
        success: true,
        data: user || null,
        message: 'User retrieved successfully'
      };
    }
    
    return {
      success: false,
      error: 'User not found',
      data: null
    };
  } catch (err) {
    error(`${serviceName}:getUserByEmail:error`, { error: err.message, email });
    return {
      success: false,
      error: err.message || 'Failed to retrieve user',
      data: null
    };
  }
};

export const getUserByStudentNumber = async (studentNumber) => {
  try {
    info(`${serviceName}:getUserByStudentNumber`, { studentNumber });
    
    // Search for user by student number
    const result = await getAllUsers({ search: studentNumber });
    
    if (result.success && result.data.length > 0) {
      const user = result.data.find(u => u.studentNumber === studentNumber);
      return {
        success: true,
        data: user || null,
        message: 'User retrieved successfully'
      };
    }
    
    return {
      success: false,
      error: 'User not found',
      data: null
    };
  } catch (err) {
    error(`${serviceName}:getUserByStudentNumber:error`, { error: err.message, studentNumber });
    return {
      success: false,
      error: err.message || 'Failed to retrieve user',
      data: null
    };
  }
};

// Keycloak-specific user management functions
export const setUserPassword = async (userId, newPassword, temporary = false) => {
  try {
    info(`${serviceName}:setUserPassword`, { userId, temporary });
    
    const response = await fetch(`${API_BASE}/v1/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak_token')}`
      },
      body: JSON.stringify({ newPassword, temporary })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to set password');
    }
    
    return {
      success: true,
      message: result.message || 'Password updated successfully in Keycloak'
    };
  } catch (err) {
    error(`${serviceName}:setUserPassword:error`, { error: err.message, userId });
    return {
      success: false,
      error: err.message || 'Failed to set password'
    };
  }
};

export const enableUser = async (userId) => {
  try {
    info(`${serviceName}:enableUser`, { userId });
    
    const response = await fetch(`${API_BASE}/v1/users/${userId}/enabled`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak_token')}`
      },
      body: JSON.stringify({ enabled: true })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to enable user');
    }
    
    return {
      success: true,
      message: result.message || 'User enabled successfully in Keycloak'
    };
  } catch (err) {
    error(`${serviceName}:enableUser:error`, { error: err.message, userId });
    return {
      success: false,
      error: err.message || 'Failed to enable user'
    };
  }
};

export const disableUser = async (userId) => {
  try {
    info(`${serviceName}:disableUser`, { userId });
    
    const response = await fetch(`${API_BASE}/v1/users/${userId}/enabled`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('keycloak_token')}`
      },
      body: JSON.stringify({ enabled: false })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to disable user');
    }
    
    return {
      success: true,
      message: result.message || 'User disabled successfully in Keycloak'
    };
  } catch (err) {
    error(`${serviceName}:disableUser:error`, { error: err.message, userId });
    return {
      success: false,
      error: err.message || 'Failed to disable user'
    };
  }
};

// Utility functions
export const getPerformedByFields = (user) => {
  if (!user) return null;

  const userId = user.id || user.uid || user.sub || 'unknown';

  return {
    id: userId,
    name: user.displayName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
    email: user.email,
    role: user.role,
    performedAt: new Date(),
    performedBy: userId
  };
};

// User utility functions (to avoid circular dependency)
export const getUserDisplayName = (user, lang = 'en') => {
  return getLocalizedUserName(user, lang);
};

export const getUserInitials = (user) => {
  if (!user) return '??';
  
  const name = getUserDisplayName(user);
  const parts = name.split(' ');
  
  if (parts.length >= 2) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  
  return name.substring(0, 2).toUpperCase();
};

export const getUserProfile = async (userIdOrUser) => {
  try {
    const userId = typeof userIdOrUser === 'object'
      ? (userIdOrUser?.dbId || userIdOrUser?.uid || userIdOrUser?.id)
      : userIdOrUser;
    info(`${serviceName}:getUserProfile`, { userId });

    const result = await getUserById(userId);
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (err) {
    error(`${serviceName}:getUserProfile:error`, { error: err.message, userIdOrUser });
    return null;
  }
};

export const updateUserProgress = async (userId, progressData, user = null) => {
  try {
    info(`${serviceName}:updateUserProgress`, { userId, data: progressData });
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: {
        userId,
        ...progressData,
        updatedAt: new Date()
      },
      message: 'User progress updated successfully'
    };
  } catch (error) {
    error(`${serviceName}:updateUserProgress:error`, { error: error.message, userId, data: progressData });
    return {
      success: false,
      error: error.message || 'Failed to update user progress',
      data: null
    };
  }
};

export const getUserDisplayNameAsync = async (userId, lang = 'en') => {
  try {
    const profile = await getUserProfile(userId);
    return getUserDisplayName(profile, lang);
  } catch (err) {
    error(`${serviceName}:getUserDisplayNameAsync:error`, { error: err.message, userId });
    return 'Unknown User';
  }
};

// Aliases for commonly expected function names
export const getUsers = getAllUsers;
export const getUser = getUserById;
export const addUser = createUser;
export const updateUserData = updateUser;
export const removeUser = deleteUser;

// Delete student function (alias for removeUser)
export const deleteStudent = deleteUser;

// Get multiple users by IDs
export const getUsersByIds = async (ids, params = {}) => {
  try {
    info(`${serviceName}:getUsersByIds`, { ids, params });
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return {
        success: true,
        data: [],
        total: 0,
        message: 'No IDs provided'
      };
    }
    
    // Fetch all users and filter by IDs
    const result = await getAllUsers(params);
    if (result.success && result.data) {
      const filteredData = result.data.filter(user => ids.includes(user.id));
      return {
        success: true,
        data: filteredData,
        total: filteredData.length,
        message: 'Users retrieved successfully'
      };
    }
    return result;
  } catch (err) {
    error(`${serviceName}:getUsersByIds:error`, { error: err.message, ids, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve users',
      data: []
    };
  }
};

// Check if user is disabled
export const isUserDisabled = (user) => {
  return isUserDisabledAtUserLevel(user);
};

// Get user ID from user object
export const getUserId = (user) => {
  if (!user) return null;
  return user.id || user.userId || null;
};

// Get user display name synchronously
export const getUserDisplayNameSync = (user, lang = 'en') => {
  return getUserDisplayName(user, lang);
};

// Default export
export default {
  // Core functions
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  
  // Keycloak-specific functions
  setUserPassword,
  enableUser,
  disableUser,
  
  // Role checking functions
  isAdmin,
  isSuperAdmin,
  isHR,
  isInstructor,
  isStudent,
  
  // Utility functions
  getPerformedByFields,
  getUserDisplayName,
  getUserDisplayNameAsync,
  getUserInitials,
  getUserProfile,
  
  // Aliases
  getUsers,
  getUser,
  addUser,
  updateUserData,
  removeUser,
  deleteStudent,
  isUserDisabledAtUserLevel
};
