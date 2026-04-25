/**
 * Admin Scope Business Service
 * 
 * PURPOSE: Business logic layer for admin scope-related operations
 * ARCHITECTURE: Frontend → Business Services → API Client → API Server → PostgreSQL
 */

import adminScopeDbService from '../db/adminScopeDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'adminScopeBusinessService';

const getAllAdminScopes = async (params = {}) => {
  try {
    info(`${serviceName}:getAllAdminScopes`, { params });
    const result = await adminScopeDbService.getAdminScopes(params);
    
    return {
      success: result.success,
      data: result.data || [],
      pagination: result.pagination
    };
  } catch (error) {
    error(`${serviceName}:getAllAdminScopes:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load admin scopes',
      data: []
    };
  }
};

const getAdminScopesByUserId = async (userId) => {
  try {
    info(`${serviceName}:getAdminScopesByUserId`, { userId });
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: []
      };
    }
    
    const result = await adminScopeDbService.getAdminScopesByUserId(userId);
    
    return {
      success: result.success,
      data: result.data || [],
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getAdminScopesByUserId:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to load admin scopes',
      data: []
    };
  }
};

const getUserEffectiveScope = async (userId) => {
  try {
    info(`${serviceName}:getUserEffectiveScope`, { userId });
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: null
      };
    }
    
    const result = await adminScopeDbService.getUserEffectiveScope(userId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getUserEffectiveScope:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to load effective scope',
      data: null
    };
  }
};

const getAdminScopeById = async (scopeId) => {
  try {
    info(`${serviceName}:getAdminScopeById`, { scopeId });
    
    if (!scopeId) {
      return {
        success: false,
        error: 'Admin scope ID is required',
        data: null
      };
    }
    
    const result = await adminScopeDbService.getAdminScopeById(scopeId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.success ? undefined : result.error
    };
  } catch (error) {
    error(`${serviceName}:getAdminScopeById:error`, { error: error.message, scopeId });
    return {
      success: false,
      error: error.message || 'Failed to load admin scope',
      data: null
    };
  }
};

const createAdminScope = async (scopeData, user = null) => {
  try {
    // Business rules validation
    const userId = scopeData.userId;
    const scopeType = scopeData.scopeType;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: null
      };
    }
    
    if (!scopeType) {
      return {
        success: false,
        error: 'Scope type is required',
        data: null
      };
    }
    
    const validScopeTypes = ['PROGRAM', 'CLASSROOM', 'INSTRUCTOR'];
    if (!validScopeTypes.includes(scopeType)) {
      return {
        success: false,
        error: `Invalid scope type. Must be one of: ${validScopeTypes.join(', ')}`,
        data: null
      };
    }
    
    // Validate that the appropriate ID is provided based on scope type
    if (scopeType === 'PROGRAM' && !scopeData.programId) {
      return {
        success: false,
        error: 'Program ID is required for PROGRAM scope type',
        data: null
      };
    }
    
    if (scopeType === 'CLASSROOM' && !scopeData.classroomId) {
      return {
        success: false,
        error: 'Classroom ID is required for CLASSROOM scope type',
        data: null
      };
    }
    
    if (scopeType === 'INSTRUCTOR' && !scopeData.instructorUserId) {
      return {
        success: false,
        error: 'Instructor user ID is required for INSTRUCTOR scope type',
        data: null
      };
    }
    
    if (!scopeData.createdBy) {
      return {
        success: false,
        error: 'Creator user ID is required',
        data: null
      };
    }
    
    const processedData = {
      ...scopeData,
      userId,
      scopeType,
      programId: scopeType === 'PROGRAM' ? scopeData.programId : null,
      classroomId: scopeType === 'CLASSROOM' ? scopeData.classroomId : null,
      instructorUserId: scopeType === 'INSTRUCTOR' ? scopeData.instructorUserId : null,
      isActive: scopeData.isActive !== undefined ? scopeData.isActive : true
    };
    
    const result = await adminScopeDbService.createAdminScope(processedData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Admin scope created successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create admin scope',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:createAdminScope:error`, { error: error.message, data: scopeData });
    return {
      success: false,
      error: error.message || 'Failed to create admin scope',
      data: null
    };
  }
};

const updateAdminScope = async (scopeId, updateData, user = null) => {
  try {
    info(`${serviceName}:updateAdminScope`, { scopeId, data: updateData });
    
    if (!scopeId) {
      return {
        success: false,
        error: 'Admin scope ID is required',
        data: null
      };
    }
    
    // Validate scope type if being updated
    if (updateData.scopeType) {
      const validScopeTypes = ['PROGRAM', 'CLASSROOM', 'INSTRUCTOR'];
      if (!validScopeTypes.includes(updateData.scopeType)) {
        return {
          success: false,
          error: `Invalid scope type. Must be one of: ${validScopeTypes.join(', ')}`,
          data: null
        };
      }
    }
    
    const result = await adminScopeDbService.updateAdminScope(scopeId, updateData, user);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Admin scope updated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update admin scope',
        data: null
      };
    }
  } catch (error) {
    error(`${serviceName}:updateAdminScope:error`, { error: error.message, scopeId, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update admin scope',
      data: null
    };
  }
};

const deleteAdminScope = async (scopeId, user = null) => {
  try {
    info(`${serviceName}:deleteAdminScope`, { scopeId });
    
    if (!scopeId) {
      return {
        success: false,
        error: 'Admin scope ID is required',
        data: null
      };
    }
    
    const result = await adminScopeDbService.deleteAdminScope(scopeId, user);
    
    if (result.success) {
      return {
        success: true,
        message: 'Admin scope deleted successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to delete admin scope'
      };
    }
  } catch (error) {
    error(`${serviceName}:deleteAdminScope:error`, { error: error.message, scopeId });
    return {
      success: false,
      error: error.message || 'Failed to delete admin scope'
    };
  }
};

export default {
  getAllAdminScopes,
  getAdminScopesByUserId,
  getUserEffectiveScope,
  getAdminScopeById,
  createAdminScope,
  updateAdminScope,
  deleteAdminScope
};
