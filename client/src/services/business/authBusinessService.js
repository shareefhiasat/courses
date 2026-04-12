/**
 * Auth Business Service
 * 
 * PURPOSE:
 * Business logic layer for authentication-related operations
 * This service orchestrates Keycloak operations and implements business rules
 * 
 * ARCHITECTURE:
 * Frontend Components → Business Services → Keycloak → Database Services → PostgreSQL
 */

const { info, error, warn, debug } = require('../utils/logger.js');
const { dbService } = require('../other/dbService.js');

const serviceName = 'authBusinessService';

const login = async (credentials) => {
  try {
    info(`${serviceName}:login`, { email: credentials.email });
    
    // This will be handled by Keycloak frontend adapter
    // For now, return success to allow login flow
    return {
      success: true,
      message: 'Login initiated',
      data: null
    };
  } catch (error) {
    error(`${serviceName}:login:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Login failed',
      data: null
    };
  }
};

const logout = async () => {
  try {
    info(`${serviceName}:logout`);
    
    // This will be handled by Keycloak frontend adapter
    return {
      success: true,
      message: 'Logout initiated'
    };
  } catch (error) {
    error(`${serviceName}:logout:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Logout failed'
    };
  }
};

const getCurrentUser = async () => {
  try {
    info(`${serviceName}:getCurrentUser`);
    
    // This will be handled by Keycloak frontend adapter
    // Return mock user for now
    return {
      success: true,
      data: {
        id: 1,
        email: 'shareef.hiasat@gmail.com',
        firstName: 'Shareef',
        lastName: 'Hiasat',
        displayName: 'Super Admin',
        role: 'super_admin'
      }
    };
  } catch (error) {
    error(`${serviceName}:getCurrentUser:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to get current user',
      data: null
    };
  }
};

const syncUserFromKeycloak = async (keycloakUser) => {
  try {
    info(`${serviceName}:syncUserFromKeycloak`, { email: keycloakUser.email });
    
    // Check if user exists in database
    const existingUser = await dbService.findMany('user', {
      where: { email: keycloakUser.email }
    });
    
    if (existingUser.success && existingUser.data.length > 0) {
      // User exists, update if needed
      const user = existingUser.data[0];
      return {
        success: true,
        data: user,
        action: 'updated'
      };
    } else {
      // Create new user
      const userData = {
        email: keycloakUser.email,
        firstName: keycloakUser.firstName || keycloakUser.preferred_username?.split('.')[0] || 'Unknown',
        lastName: keycloakUser.lastName || keycloakUser.preferred_username?.split('.')[1] || 'User',
        displayName: keycloakUser.displayName || keycloakUser.preferred_username || 'User',
        isActive: true
      };
      
      const result = await dbService.create('user', userData);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          action: 'created'
        };
      } else {
        return {
          success: false,
          error: result.error,
          action: 'failed'
        };
      }
    }
  } catch (error) {
    error(`${serviceName}:syncUserFromKeycloak:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to sync user from Keycloak',
      data: null
    };
  }
};

const isAuthenticated = async () => {
  try {
    info(`${serviceName}:isAuthenticated`);
    
    // This will be handled by Keycloak frontend adapter
    return {
      success: true,
      authenticated: true
    };
  } catch (error) {
    error(`${serviceName}:isAuthenticated:error`, { error: error.message });
    return {
      success: false,
      authenticated: false,
      error: error.message
    };
  }
};

const hasRole = async (requiredRole) => {
  try {
    info(`${serviceName}:hasRole`, { requiredRole });
    
    // This will be handled by Keycloak frontend adapter
    // For now, assume super admin has all roles
    return {
      success: true,
      hasRole: true
    };
  } catch (error) {
    error(`${serviceName}:hasRole:error`, { error: error.message });
    return {
      success: false,
      hasRole: false,
      error: error.message
    };
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  syncUserFromKeycloak,
  isAuthenticated,
  hasRole
};
