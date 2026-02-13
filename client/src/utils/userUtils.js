/**
 * Consolidated User Utilities
 * Combines userHelpers.js, roleAccess.js, and other user-related utilities
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "@services/other/config";
import { 
  USER_ROLES, 
  getRoleDisplayName
} from '@constants/userRoles';

// ===== ROLE ACCESS UTILITIES =====

/**
 * Check if a user has access to a specific screen
 * Super admins always have access
 * @param {string} screenId - The screen ID to check
 * @param {Object} userContext - User context from useAuth hook
 * @param {Object} roleScreens - Optional cached roleScreens config
 * @returns {Promise<boolean>} - Whether the user has access
 */
export const hasScreenAccess = async (
  screenId,
  userContext,
  roleScreens = null
) => {
  const { isSuperAdmin, role } = userContext;

  // Super admins bypass all restrictions
  if (isSuperAdmin) {
    return true;
  }

  // Load role screens if not provided
  let screens = roleScreens;
  if (!screens) {
    try {
      const configRef = doc(db, 'config', 'roleScreens');
      const configSnap = await getDoc(configRef);
      screens = configSnap.exists() ? configSnap.data() : {};
    } catch (error) {
      console.error('Error loading role screens:', error);
      return false;
    }
  }

  // Check if user has access to the screen
  const roleAccess = screens[role];
  return roleAccess && roleAccess[screenId] === true;
};

// ===== USER DISPLAY UTILITIES =====

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
 * Get user display name with proper fallbacks
 * @param {Object} user - User object
 * @returns {string} Display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  
  return user.displayName || 
         user.name || 
         user.email?.split('@')[0] || 
         'Unknown User';
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

// ===== USER VALIDATION UTILITIES =====

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
 * Check if user profile is complete
 * @param {Object} userProfile - User profile from Firestore
 * @returns {boolean} True if profile has required fields
 */
export const isProfileComplete = (userProfile) => {
  if (!userProfile) return false;
  
  const requiredFields = ['displayName', 'email'];
  return requiredFields.every(field => userProfile[field]);
};

// ===== USER ROLE CHECK UTILITIES =====

/**
 * Check if user is admin (helper function)
 * @param {Object} user - User object
 * @returns {boolean} True if user is admin
 */
export const isAdminUser = (user) => {
  if (!user) return false;
  return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.SUPER_ADMIN || user.isAdmin === true;
};

/**
 * Check if user is instructor (helper function)
 * @param {Object} user - User object
 * @returns {boolean} True if user is instructor
 */
export const isInstructorUser = (user) => {
  if (!user) return false;
  return user.role === USER_ROLES.INSTRUCTOR || user.isInstructor === true;
};

/**
 * Check if user is HR (helper function)
 * @param {Object} user - User object
 * @returns {boolean} True if user is HR
 */
export const isHRUser = (user) => {
  if (!user) return false;
  return user.role === USER_ROLES.HR || user.isHR === true;
};

/**
 * Check if user is student (helper function)
 * @param {Object} user - User object
 * @returns {boolean} True if user is student
 */
export const isStudentUser = (user) => {
  if (!user) return false;
  return user.role === USER_ROLES.STUDENT || user.isStudent === true;
};

/**
 * Check if user is super admin (helper function)
 * @param {Object} user - User object
 * @returns {boolean} True if user is super admin
 */
export const isSuperAdminUser = (user) => {
  if (!user) return false;
  return user.role === USER_ROLES.SUPER_ADMIN || user.isSuperAdmin === true;
};

// ===== USER PROFILE UTILITIES =====

/**
 * Get current user's profile information from Firestore
 * @param {Object} user - Auth user object
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export async function getUserProfile(user) {
  if (!user) return null;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get user's display name with proper fallbacks (async version)
 * @param {Object} user - Auth user object
 * @returns {Promise<string>} Display name
 */
export async function getUserDisplayNameAsync(user) {
  const userProfile = await getUserProfile(user);
  return userProfile?.displayName || user?.displayName || user?.email || 'Unknown User';
}

// Export all utilities
export default {
  // Role access
  hasScreenAccess,
  
  // Display utilities
  getUserRoleDisplay,
  getUserDisplayName,
  getUserInitials,
  
  // Validation utilities
  isValidEmail,
  isProfileComplete,
  
  // Role check utilities
  isAdminUser,
  isInstructorUser,
  isHRUser,
  isStudentUser,
  isSuperAdminUser,
  
  // Profile utilities
  getUserProfile,
  getUserDisplayNameAsync
};
