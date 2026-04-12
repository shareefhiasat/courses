/**
 * User Role Management Utility
 * 
 * Replaced Firebase with Keycloak role management
 */

import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Get user roles from Keycloak token
 * @param {Object} user - User object from AuthContext
 * @returns {Object} Role flags
 */
export function getUserRoles(user) {
  if (!user || !user.roles) {
    return {
      isAdmin: false,
      isSuperAdmin: false,
      isHR: false,
      isInstructor: false,
      isStudent: false
    };
  }

  return {
    isAdmin: user.roles.includes('admin'),
    isSuperAdmin: user.roles.includes('super-admin'),
    isHR: user.roles.includes('hr'),
    isInstructor: user.roles.includes('instructor'),
    isStudent: user.roles.includes('student')
  };
}

/**
 * Check if user has any admin-level role
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export function isAdminUser(user) {
  const roles = getUserRoles(user);
  return roles.isAdmin || roles.isSuperAdmin;
}

/**
 * Check if user can access admin features
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export function canAccessAdmin(user) {
  const roles = getUserRoles(user);
  return roles.isSuperAdmin || roles.isAdmin || roles.isHR;
}

/**
 * Check if user can manage classes
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export function canManageClasses(user) {
  const roles = getUserRoles(user);
  return roles.isSuperAdmin || roles.isAdmin || roles.isInstructor;
}

/**
 * Check if user can manage attendance
 * @param {Object} user - User object from AuthContext
 * @returns {boolean}
 */
export function canManageAttendance(user) {
  const roles = getUserRoles(user);
  return roles.isSuperAdmin || roles.isAdmin || roles.isInstructor;
}

/**
 * Get user display role
 * @param {Object} user - User object from AuthContext
 * @returns {string}
 */
export function getUserDisplayRole(user) {
  const roles = getUserRoles(user);
  
  if (roles.isSuperAdmin) return 'Super Admin';
  if (roles.isAdmin) return 'Admin';
  if (roles.isHR) return 'HR';
  if (roles.isInstructor) return 'Instructor';
  if (roles.isStudent) return 'Student';
  return 'Unknown';
}

/**
 * Log role changes (for audit)
 * @param {Object} user - User object
 * @param {string} action - Action performed
 */
export function logRoleChange(user, action) {
  info('👥 Role change:', {
    userId: user?.id,
    email: user?.email,
    roles: user?.roles,
    action,
    timestamp: new Date().toISOString()
  });
}

/**
 * Make current user super admin and instructor
 * @param {Object} user - User object from AuthContext
 * @returns {Object} Updated user object with super admin and instructor roles
 */
export function makeCurrentUserSuperAdminAndInstructor(user) {
  if (!user) {
    error('❌ No user provided to makeCurrentUserSuperAdminAndInstructor');
    return null;
  }

  // Ensure user has roles array
  if (!user.roles) {
    user.roles = [];
  }

  // Add super-admin and instructor roles if not present
  if (!user.roles.includes('super-admin')) {
    user.roles.push('super-admin');
  }
  if (!user.roles.includes('instructor')) {
    user.roles.push('instructor');
  }

  // Also add admin role for completeness
  if (!user.roles.includes('admin')) {
    user.roles.push('admin');
  }

  info('👑 User promoted to Super Admin and Instructor:', {
    userId: user.id,
    email: user.email,
    newRoles: user.roles
  });

  logRoleChange(user, 'Promoted to Super Admin and Instructor');
  
  return user;
}
