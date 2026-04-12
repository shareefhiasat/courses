/**
 * User Business Service
 * 
 * PURPOSE:
 * Business logic layer for user-related operations
 * This service orchestrates database operations and implements business rules
 * 
 * ARCHITECTURE:
 * Frontend Components → Business Services → Database Services → PostgreSQL
 */

const { dbService } = require('../other/dbService.js');
const { info, error, warn, debug } = require('../utils/logger.js');

const serviceName = 'userBusinessService';

const getAllUsers = async (params = {}) => {
  try {
    info(`${serviceName}:getAllUsers`, { params });
    const result = await dbService.findMany('user', params);
    
    return {
      success: result.success,
      data: result.data || [],
      total: result.pagination?.total || 0,
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllUsers:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load users',
      data: []
    };
  }
};

const getUserById = async (id) => {
  try {
    info(`${serviceName}:getUserById`, { id });
    const result = await dbService.findUnique('user', id);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getUserById:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to load user',
      data: null
    };
  }
};

const createUser = async (userData, user = null) => {
  try {
    info(`${serviceName}:createUser`, { data: userData });
    
    const result = await dbService.create('user', userData, user);
    
    if (result.success) {
      info(`${serviceName}:createUser:success`, { userId: result.data.id });
      return {
        success: true,
        data: result.data,
        message: 'User created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create user',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createUser:error`, { error: error.message, data: userData });
    return {
      success: false,
      error: error.message || 'Failed to create user',
      data: null
    };
  }
};

const updateUser = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateUser`, { id, data: updateData });
    
    const result = await dbService.update('user', id, updateData, user);
    
    if (result.success) {
      info(`${serviceName}:updateUser:success`, { userId: id });
      return {
        success: true,
        data: result.data,
        message: 'User updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update user',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateUser:error`, { error: error.message, id, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update user',
      data: null
    };
  }
};

const deleteUser = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteUser`, { id });
    
    const result = await dbService.softDelete('user', id, user);
    
    if (result.success) {
      info(`${serviceName}:deleteUser:success`, { userId: id });
      return {
        success: true,
        message: 'User deactivated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to deactivate user',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteUser:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to deactivate user',
      data: null
    };
  }
};

const getUserByEmail = async (email) => {
  try {
    info(`${serviceName}:getUserByEmail`, { email });
    
    const result = await dbService.findMany('user', {
      where: { email }
    });
    
    if (result.success && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    } else {
      return {
        success: false,
        error: 'User not found',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:getUserByEmail:error`, { error: error.message, email });
    return {
      success: false,
      error: error.message || 'Failed to load user',
      data: null
    };
  }
};

// Role checking functions
const isAdmin = (user) => user?.isAdmin || user?.role === 'admin';
const isSuperAdmin = (user) => user?.isSuperAdmin || user?.role === 'super_admin';
const isHR = (user) => user?.isHR || user?.role === 'hr';
const isInstructor = (user) => user?.isInstructor || user?.role === 'instructor';
const isStudent = (user) => user?.isStudent || user?.role === 'student';

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  isAdmin,
  isSuperAdmin,
  isHR,
  isInstructor,
  isStudent
};
