/**
 * User Helper Functions
 * Provides utilities for user-related type operations and validations
 */

import { 
  USER_ROLES, 
  getRoleDisplayName,
  isAdmin,
  isInstructor,
  isHR,
  isStudent,
  isSuperAdmin
} from '@constants/userRoles';

/**
 * Get user role display name with proper fallbacks
 * @param {string} role - User role from database
 * @param {Object} user - Auth user object
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {string} Display name for the role
 */
export const getUserRoleDisplay = (role, user = {}, lang = 'en') => {
  if (!role && user?.role) {
    role = user.role;
  }
  
  return getRoleDisplayName(role, lang);
};

/**
 * Check if user has admin-level permissions
 * @param {Object} user - User object with role and claims
 * @returns {boolean} True if user has admin permissions
 */
export const isAdminUser = (user) => {
  return isAdmin(user?.role) || 
         isSuperAdmin(user?.role) ||
         user?.isAdmin === true || 
         user?.isSuperAdmin === true;
};

/**
 * Check if user is instructor
 * @param {Object} user - User object with role and claims
 * @returns {boolean} True if user is instructor
 */
export const isInstructorUser = (user) => {
  return isInstructor(user?.role) || user?.isInstructor === true;
};

/**
 * Check if user is HR
 * @param {Object} user - User object with role and claims
 * @returns {boolean} True if user is HR
 */
export const isHRUser = (user) => {
  return isHR(user?.role) || user?.isHR === true;
};

/**
 * Check if user is student
 * @param {Object} user - User object with role and claims
 * @returns {boolean} True if user is student
 */
export const isStudentUser = (user) => {
  return isStudent(user?.role) || user?.isStudent === true;
};

/**
 * Get user display name with proper fallbacks
 * @param {Object} user - User object
 * @returns {string} Display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  
  return user.displayName || 
         user.realName || 
         user.name || 
         user.email?.split('@')[0] || 
         'Unknown User';
};

/**
 * Validate user email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get user initials for avatar
 * @param {string} name - User name
 * @returns {string} 1-2 character initials
 */
export const getUserInitials = (name) => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Check if user profile is complete
 * @param {Object} userProfile - User profile from Firestore
 * @returns {boolean} True if profile has required fields
 */
export const isProfileComplete = (userProfile) => {
  if (!userProfile) return false;
  
  const requiredFields = ['displayName', 'email'];
  return requiredFields.every(field => userProfile[field]);
};

export default {
  getUserRoleDisplay,
  isAdminUser,
  isInstructorUser,
  isHRUser,
  isStudentUser,
  getUserDisplayName,
  isValidEmail,
  getUserInitials,
  isProfileComplete
};
