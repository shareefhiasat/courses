import { ROLE_STRINGS, ROLE_HIERARCHY } from '../../utils/userUtils.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'configService';

// Screen access configuration
export const SCREEN_ACCESS = {
  // Super Admin screens
  [ROLE_STRINGS.SUPER_ADMIN]: [
    'dashboard',
    'users',
    'programs',
    'subjects',
    'classes',
    'enrollments',
    'attendance',
    'behavior',
    'participation',
    'notifications',
    'reports',
    'settings',
    'system',
    'audit'
  ],
  
  // Admin screens
  [ROLE_STRINGS.ADMIN]: [
    'dashboard',
    'users',
    'programs',
    'subjects',
    'classes',
    'enrollments',
    'attendance',
    'behavior',
    'participation',
    'notifications',
    'reports',
    'settings'
  ],
  
  // HR screens
  [ROLE_STRINGS.HR]: [
    'dashboard',
    'users',
    'programs',
    'classes',
    'enrollments',
    'attendance',
    'reports',
    'notifications'
  ],
  
  // Instructor screens
  [ROLE_STRINGS.INSTRUCTOR]: [
    'dashboard',
    'classes',
    'attendance',
    'behavior',
    'participation',
    'notifications',
    'reports'
  ],
  
  // Student screens
  [ROLE_STRINGS.STUDENT]: [
    'dashboard',
    'classes',
    'attendance',
    'notifications'
  ]
};

export const getAccessibleScreens = (userRole) => {
  try {
    if (!userRole) {
      return [];
    }
    
    return SCREEN_ACCESS[userRole] || [];
  } catch (error) {
    error(`${serviceName}:getAccessibleScreens:error`, { error: error.message, userRole });
    return [];
  }
};

// Role-based access checks
export const hasAdminAccess = (userRole) => {
  const adminRoles = [ROLE_STRINGS.ADMIN, ROLE_STRINGS.SUPER_ADMIN];
  return adminRoles.includes(userRole);
};

export const canManageUsers = (userRole) => {
  const userManagementRoles = [ROLE_STRINGS.ADMIN, ROLE_STRINGS.SUPER_ADMIN, ROLE_STRINGS.HR];
  return userManagementRoles.includes(userRole);
};

export const canViewReports = (userRole) => {
  const reportRoles = [ROLE_STRINGS.ADMIN, ROLE_STRINGS.SUPER_ADMIN, ROLE_STRINGS.HR, ROLE_STRINGS.INSTRUCTOR];
  return reportRoles.includes(userRole);
};

export const getRoleLevel = (userRole) => {
  return ROLE_HIERARCHY[userRole] || 0;
};

export const hasHigherPrivilege = (userRole, targetRole) => {
  const userLevel = getRoleLevel(userRole);
  const targetLevel = getRoleLevel(targetRole);
  return userLevel > targetLevel;
};

// Additional utility functions for role access
export const getRoleScreens = getAccessibleScreens; // Alias for useRoleAccess.js

export const getUserRoleAccess = (userRole) => {
  return {
    role: userRole,
    screens: getAccessibleScreens(userRole),
    hasAdminAccess: hasAdminAccess(userRole),
    canManageUsers: canManageUsers(userRole),
    canViewReports: canViewReports(userRole),
    level: getRoleLevel(userRole)
  };
};

// Feature access configuration
export const FEATURE_ACCESS = {
  // Super Admin features
  [ROLE_STRINGS.SUPER_ADMIN]: {
    canDeleteSystemData: true,
    canManageSystemSettings: true,
    canViewAuditLogs: true,
    canManageAllUsers: true,
    canAccessAllReports: true,
    canManageIntegrations: true
  },
  
  // Admin features
  [ROLE_STRINGS.ADMIN]: {
    canDeleteSystemData: false,
    canManageSystemSettings: true,
    canViewAuditLogs: false,
    canManageAllUsers: true,
    canAccessAllReports: true,
    canManageIntegrations: false
  },
  
  // HR features
  [ROLE_STRINGS.HR]: {
    canDeleteSystemData: false,
    canManageSystemSettings: false,
    canViewAuditLogs: false,
    canManageAllUsers: false,
    canAccessAllReports: true,
    canManageIntegrations: false
  },
  
  // Instructor features
  [ROLE_STRINGS.INSTRUCTOR]: {
    canDeleteSystemData: false,
    canManageSystemSettings: false,
    canViewAuditLogs: false,
    canManageAllUsers: false,
    canAccessAllReports: false,
    canManageIntegrations: false
  },
  
  // Student features
  [ROLE_STRINGS.STUDENT]: {
    canDeleteSystemData: false,
    canManageSystemSettings: false,
    canViewAuditLogs: false,
    canManageAllUsers: false,
    canAccessAllReports: false,
    canManageIntegrations: false
  }
};

export const hasFeatureAccess = (userRole, feature) => {
  try {
    if (!userRole || !feature) {
      return false;
    }
    
    const userFeatures = FEATURE_ACCESS[userRole] || {};
    return userFeatures[feature] || false;
  } catch (error) {
    error(`${serviceName}:hasFeatureAccess:error`, { error: error.message, userRole, feature });
    return false;
  }
};

export const getUserFeatures = (userRole) => {
  try {
    if (!userRole) {
      return {};
    }
    
    return FEATURE_ACCESS[userRole] || {};
  } catch (error) {
    error(`${serviceName}:getUserFeatures:error`, { error: error.message, userRole });
    return {};
  }
};

// Allowlist management functions
export const getAllowlist = async () => {
  try {
    info(`${serviceName}:getAllowlist`);
    
    // Mock implementation - replace with actual API call
    const mockAllowlist = {
      allowedEmails: [],
      adminEmails: [],
      allowedStudents: [],
      allowedInstructors: [],
      allowedHr: [],
      superAdmins: []
    };
    
    return {
      success: true,
      data: mockAllowlist,
      message: 'Allowlist retrieved successfully'
    };
  } catch (error) {
    error(`${serviceName}:getAllowlist:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to get allowlist',
      data: null
    };
  }
};

export const updateAllowlist = async (allowlistData) => {
  try {
    info(`${serviceName}:updateAllowlist`, { allowlistData });
    
    // Mock implementation - replace with actual API call
    return {
      success: true,
      data: allowlistData,
      message: 'Allowlist updated successfully'
    };
  } catch (error) {
    error(`${serviceName}:updateAllowlist:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to update allowlist',
      data: null
    };
  }
};

// Default export
export default {
  // Screen access
  getAccessibleScreens,
  hasAdminAccess,
  canManageUsers,
  canViewReports,
  getRoleLevel,
  hasHigherPrivilege,
  getRoleScreens,
  getUserRoleAccess,
  
  // Feature access
  hasFeatureAccess,
  getUserFeatures,
  
  // Allowlist management
  getAllowlist,
  updateAllowlist,
  
  // Configuration objects
  SCREEN_ACCESS,
  FEATURE_ACCESS
};
