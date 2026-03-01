/**
 * Consolidated User Utilities
 * Combines userHelpers.js, roleAccess.js, and other user-related utilities
 * Single source of truth for all role-related data and functions
 */

import { getUserById, isAdmin, isSuperAdmin, isStudent } from '@services/business/userService';

// ===== ROLE STRING CONSTANTS (Single Source of Truth) =====
export const ROLE_STRINGS = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor', 
  ADMIN: 'admin',
  HR: 'hr',
  SUPER_ADMIN: 'super_admin'
};

// ===== ROLE DISPLAY NAMES (for backward compatibility) =====
export const ROLE_DISPLAY_NAMES = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
  HR: 'HR',
  SUPER_ADMIN: 'Super Admin'
};

// ===== ROLE HIERARCHY (for permission comparisons) =====
export const ROLE_HIERARCHY = [
  ROLE_STRINGS.STUDENT,
  ROLE_STRINGS.INSTRUCTOR,
  ROLE_STRINGS.HR,
  ROLE_STRINGS.ADMIN,
  ROLE_STRINGS.SUPER_ADMIN
];

// ===== ROLE PRECEDENCE (highest to lowest) =====
export const ROLE_PRECEDENCE = {
  [ROLE_STRINGS.SUPER_ADMIN]: 5,
  [ROLE_STRINGS.ADMIN]: 4,
  [ROLE_STRINGS.HR]: 3,
  [ROLE_STRINGS.INSTRUCTOR]: 2,
  [ROLE_STRINGS.STUDENT]: 1
};

// ===== DEFAULT ROLE =====
export const DEFAULT_ROLE = ROLE_STRINGS.STUDENT;

// ===== EXPORT ALL ROLES ARRAY =====
export const ALL_ROLES = Object.values(ROLE_STRINGS);

// ===== EXPORT ROLE KEYS ARRAY =====
export const ROLE_KEYS = Object.keys(ROLE_STRINGS);

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
  const { isSuperAdmin, isAdmin, isHR } = userContext;

  // Super admins bypass all restrictions
  if (isSuperAdmin) {
    return true;
  }

  // Load role screens if not provided
  let screens = roleScreens;
  if (!screens) {
    try {
      // Import getRoleScreens dynamically to avoid circular dependency
      const { getRoleScreens } = await import('@services/business/configService');
      const result = await getRoleScreens();
      screens = result.success ? result.data : {};
    } catch (error) {
      logger.error('Error loading role screens:', error);
      return false;
    }
  }

  // Determine role for screen access (in order of precedence)
  let userRole = ROLE_STRINGS.STUDENT; // default
  if (isAdmin) userRole = ROLE_STRINGS.ADMIN;
  else if (isHR) userRole = ROLE_STRINGS.HR;
  else if (userContext.isInstructor) userRole = ROLE_STRINGS.INSTRUCTOR;

  // Check if user has access to the screen
  const roleAccess = screens[userRole];
  return roleAccess && roleAccess[screenId] === true;
};

// ===== USER DISPLAY UTILITIES =====

/**
 * Get user role display name using boolean flags with localization
 * @param {Object} user - User object with boolean flags
 * @param {Function} t - Translation function
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {string} Display name for the role
 */
export const getUserRoleDisplay = (user = {}, t = () => ({}), lang = 'en') => {
  // Check in order of precedence (super admin > admin > hr > instructor > student)
  if (user.isSuperAdmin) return t('super_admin') || (lang === 'en' ? 'Super Admin' : 'مدير عام');
  if (user.isAdmin) return t('admin') || (lang === 'en' ? 'Admin' : 'مدير');
  if (user.isHR) return t('hr') || (lang === 'en' ? 'HR' : 'الموارد البشرية');
  if (user.isInstructor) return t('instructor') || (lang === 'en' ? 'Instructor' : 'مدرب');
  if (user.isStudent) return t('student') || (lang === 'en' ? 'Student' : 'طالب');
  
  return t('unknown') || (lang === 'en' ? 'Unknown' : 'غير معروف');
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

// ===== USER PROFILE UTILITIES =====

/**
 * Get current user's profile information from Firestore
 * @param {Object} user - Auth user object
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export async function getUserProfile(user) {
  if (!user) return null;
  try {
    const result = await getUserById(user.uid);
    return result.success ? result.data : null;
  } catch (error) {
    logger.error('Error fetching user profile:', error);
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

// Export role checking functions
export { isAdmin, isSuperAdmin, isStudent };

// Export all utilities
export default {
  // Role access
  hasScreenAccess,
  
  // Role checking
  isAdmin,
  isSuperAdmin,
  isStudent,
  
  // Display utilities
  getUserRoleDisplay,
  getUserDisplayName,
  getUserInitials,
  
  // Validation utilities
  isValidEmail,
  isProfileComplete,
  
  // Profile utilities
  getUserProfile,
  getUserDisplayNameAsync
};

