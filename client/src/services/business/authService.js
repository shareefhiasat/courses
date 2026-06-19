import { info, error, warn, debug } from '../utils/logger.js';
import { getUserByEmail } from './userService.js';
import {
  getUserDisplayInfo,
  getUserDisplayProps,
  getUserDisplayName,
  getUserTooltip,
} from '../../utils/userDisplayUtils.js';

export { getUserDisplayInfo, getUserDisplayProps, getUserDisplayName, getUserTooltip };

const serviceName = 'authService';

/**
 * Get database user ID from Keycloak user object
 * Maps Keycloak email to database user ID for audit fields
 * @param {Object} user - Keycloak user object from AuthContext
 * @returns {Promise<number|null>} - Database user ID or null if not found
 */
export const getDatabaseUserId = async (user) => {
  if (!user?.email) return null;
  
  try {
    info(`${serviceName}:getDatabaseUserId`, { email: user.email });
    
    const result = await getUserByEmail(user.email);
    if (result.success && result.data) {
      info(`${serviceName}:getDatabaseUserId - success`, { 
        email: user.email, 
        userId: result.data.id 
      });
      return result.data.id;
    } else {
      warn(`${serviceName}:getDatabaseUserId - user not found`, { email: user.email });
      return null;
    }
  } catch (error) {
    error(`${serviceName}:getDatabaseUserId - error`, { 
      email: user.email, 
      error: error.message 
    });
    return null;
  }
};

// Core authentication functions
export const login = async (credentials) => {
  try {
    info(`${serviceName}:login`, { email: credentials?.email });
    
    if (!credentials || !credentials.email || !credentials.password) {
      return {
        success: false,
        error: 'Email and password are required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual authentication logic
    return {
      success: true,
      data: {
        user: {
          id: 1,
          email: credentials.email,
          name: 'Test User',
          role: 'student'
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      },
      message: 'Login successful'
    };
  } catch (error) {
    error(`${serviceName}:login:error`, { error: error.message, email: credentials?.email });
    return {
      success: false,
      error: error.message || 'Login failed',
      data: null
    };
  }
};

export const logout = async (token) => {
  try {
    info(`${serviceName}:logout`, { token: token ? 'provided' : 'missing' });
    
    // Mock implementation - replace with actual logout logic
    return {
      success: true,
      message: 'Logout successful'
    };
  } catch (error) {
    error(`${serviceName}:logout:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Logout failed'
    };
  }
};

export const getCurrentUser = async (token) => {
  try {
    info(`${serviceName}:getCurrentUser`, { token: token ? 'provided' : 'missing' });
    
    if (!token) {
      return {
        success: false,
        error: 'Token is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual token validation
    return {
      success: true,
      data: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student'
      },
      message: 'User retrieved successfully'
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

// Token management functions
export const refreshToken = async (refreshToken) => {
  try {
    info(`${serviceName}:refreshToken`, { refreshToken: refreshToken ? 'provided' : 'missing' });
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'Refresh token is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual token refresh logic
    return {
      success: true,
      data: {
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token'
      },
      message: 'Token refreshed successfully'
    };
  } catch (error) {
    error(`${serviceName}:refreshToken:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Token refresh failed',
      data: null
    };
  }
};

export const validateToken = async (token) => {
  try {
    info(`${serviceName}:validateToken`, { token: token ? 'provided' : 'missing' });
    
    if (!token) {
      return {
        success: false,
        error: 'Token is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual token validation
    return {
      success: true,
      data: {
        valid: true,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      },
      message: 'Token is valid'
    };
  } catch (error) {
    error(`${serviceName}:validateToken:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Token validation failed',
      data: null
    };
  }
};

// Password management functions
export const changePassword = async (userId, currentPassword, newPassword, user = null) => {
  try {
    info(`${serviceName}:changePassword`, { userId });
    
    if (!userId || !currentPassword || !newPassword) {
      return {
        success: false,
        error: 'User ID, current password, and new password are required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual password change logic
    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    error(`${serviceName}:changePassword:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Password change failed',
      data: null
    };
  }
};

// REMOVED: resetPassword and confirmResetPassword
// Email-based password reset is no longer used
// Super admins set passwords directly via userService.setUserPassword()

// Session management functions
export const getActiveSessions = async (userId) => {
  try {
    info(`${serviceName}:getActiveSessions`, { userId });
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: []
      };
    }
    
    // Mock implementation - replace with actual session retrieval
    return {
      success: true,
      data: [],
      total: 0,
      message: 'Active sessions retrieved successfully'
    };
  } catch (error) {
    error(`${serviceName}:getActiveSessions:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to retrieve active sessions',
      data: []
    };
  }
};

export const revokeSession = async (sessionId, user = null) => {
  try {
    info(`${serviceName}:revokeSession`, { sessionId });
    
    if (!sessionId) {
      return {
        success: false,
        error: 'Session ID is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual session revocation
    return {
      success: true,
      message: 'Session revoked successfully'
    };
  } catch (error) {
    error(`${serviceName}:revokeSession:error`, { error: error.message, sessionId });
    return {
      success: false,
      error: error.message || 'Failed to revoke session',
      data: null
    };
  }
};

export const revokeAllSessions = async (userId, user = null) => {
  try {
    info(`${serviceName}:revokeAllSessions`, { userId });
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual session revocation
    return {
      success: true,
      message: 'All sessions revoked successfully'
    };
  } catch (error) {
    error(`${serviceName}:revokeAllSessions:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to revoke all sessions',
      data: null
    };
  }
};

// Aliases for commonly expected function names
export const signIn = login;
export const signOut = logout;
export const getUser = getCurrentUser;

// Default export
export default {
  // Core authentication
  login,
  logout,
  getCurrentUser,
  
  // User mapping and display
  getDatabaseUserId,
  getUserDisplayInfo,
  getUserDisplayProps,
  getUserDisplayName,
  getUserTooltip,
  
  // Token management
  refreshToken,
  validateToken,
  
  // Password management
  changePassword,
  // resetPassword and confirmResetPassword removed - use userService.setUserPassword()
  
  // Session management
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  
  // Aliases
  signIn,
  signOut,
  getUser
};
