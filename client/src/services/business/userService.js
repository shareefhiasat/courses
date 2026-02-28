import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { 
  getUserById as getUserByIdFromDb,
  getUserByEmail as getUserByEmailFromDb,
  getUserByStudentNumber as getUserByStudentNumberFromDb,
  getUsersByRole as getUsersByRoleFromDb,
  getUsers as getAllUsersFromDb,
  setUser as setUserToDb,
  updateUser as updateUserInDb,
  deleteUser as deleteUserFromDb,
  userExists as checkUserExists
} from '../db/userDbService';
import { USER_STATUS } from '@utils/userStatus';

// Prevent duplicate ensureUserDoc writes during React StrictMode re-mounts
const _ensureUserDocOnce = new Set();

/**
 * Centralized User Service - DRY Firebase user operations
 * This REPLACES the limited user.js file
 */

// Get user by ID (centralized) - with performance monitoring and memoization
export const getUserById = async (userId) => {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  try {
    logger.debug('USER: Fetching user by ID', { userId });
    
    const result = await getUserByIdFromDb(userId);
    
    if (result.success) {
      logger.debug('USER: Successfully fetched user', { userId });
      return result;
    }
    
    logger.warn('USER: User not found', { userId });
    return result;
  } catch (error) {
    logger.error('USER: Failed to fetch user', { error: error.message, userId });
    return { success: false, error: error.message };
  }
};

// Get user by email (centralized)
export const getUserByEmail = async (email) => {
  try {
    return await getUserByEmailFromDb(email);
  } catch (error) {
    logger.error('USER: Failed to fetch user by email', { error: error.message, email });
    return { success: false, error: error.message };
  }
};

// Get user by student number (centralized)
export const getUserByStudentNumber = async (studentNumber) => {
  try {
    return await getUserByStudentNumberFromDb(studentNumber);
  } catch (error) {
    logger.error('Error fetching student by number:', error);
    return { success: false, error: error.message };
  }
};

// Check if user exists by ID
export const userExists = async (userId) => {
  try {
    return await checkUserExists(userId);
  } catch (error) {
    logger.error('Error checking user existence:', error);
    return false;
  }
};

// Get user preferences (centralized)
export const getUserPreferences = async (userId) => {
  try {
    const result = await getUserByIdFromDb(userId);
    if (result.success) {
      return { success: true, data: result.data.preferences || {} };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    logger.error('Error fetching user preferences:', error);
    return { success: false, error: error.message };
  }
};

// Get users by role (centralized)
export const getUsersByRole = async (role) => {
  try {
    return await getUsersByRoleFromDb(role);
  } catch (error) {
    logger.error('Error fetching users by role:', error);
    return { success: false, error: error.message };
  }
};

// Search users by display name or email (centralized)
export const searchUsers = async (searchTerm) => {
  try {
    const result = await getAllUsersFromDb();
    
    if (!result.success) {
      return result;
    }
    
    const users = result.data;
    const searchLower = searchTerm.toLowerCase();
    const filteredUsers = users.filter(userData => 
      userData.displayName?.toLowerCase().includes(searchLower) ||
      userData.email?.toLowerCase().includes(searchLower) ||
      userData.realName?.toLowerCase().includes(searchLower) ||
      userData.studentNumber?.toLowerCase().includes(searchLower)
    );
    
    return { success: true, data: filteredUsers };
  } catch (error) {
    logger.error('Error searching users:', error);
    return { success: false, error: error.message };
  }
};

// ===== LEGACY COMPATIBILITY FUNCTIONS (from user.js) =====

/**
 * Get current user's profile information from Firestore
 * @param {Object} user - Auth user object
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export async function getUserProfile(user) {
  if (!user) return null;
  try {
    const userResult = await getUserById(user.uid);
    return userResult.success ? userResult.data : null;
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get user's display name with proper fallbacks
 * @param {Object} user - Auth user object
 * @returns {Promise<string>} Display name
 */
export async function getUserDisplayName(user) {
  const userProfile = await getUserProfile(user);
  return userProfile?.displayName || user?.displayName || user?.email || 'Instructor';
}

/**
 * Get user's email with proper fallbacks
 * @param {Object} user - Auth user object
 * @returns {Promise<string>} User email
 */
export async function getUserEmail(user) {
  const userProfile = await getUserProfile(user);
  return userProfile?.email || user?.email || '';
}

/**
 * Get performed by fields for audit logging
 * @param {Object} user - Auth user object
 * @returns {Promise<Object>} { performedBy, performedByName, performedByEmail }
 */
export async function getPerformedByFields(user) {
  const userProfile = await getUserProfile(user);
  const performedByName = userProfile?.displayName || user?.displayName || user?.email || 'Instructor';
  const performedByEmail = userProfile?.email || user?.email || '';
  
  return {
    performedBy: user?.uid,
    performedByName,
    performedByEmail
  };
}

// ===== USER MANAGEMENT FUNCTIONS =====

// Ensure a deterministic users/{uid} doc exists
export const ensureUserDoc = async (uid, data = {}) => {
  if (!uid) return { success: false, error: "uid required" };
  if (_ensureUserDocOnce.has(uid)) return { success: true, skipped: true };
  try {
    // Check if user exists first
    const exists = await checkUserExists(uid);
    
    const baseData = {
      email: data.email || null,
      displayName: data.displayName || null,
      realName: data.realName || null,
      studentNumber: data.studentNumber || null,
      phoneNumber: data.phoneNumber || null,
      // S flags instead of deprecated role field
      isAdmin: false,
      isSuperAdmin: false,
      isHR: false,
      isInstructor: false,
      isStudent: true, // Default to student for new users
      createdAt: new Date(), // Will be converted to Timestamp by DB service
    };
    
    // If document exists, only merge the provided data fields
    // If document doesn't exist, use the base object with provided data
    const updateData = exists ? data : { ...baseData, ...data };
    
    const result = await setUserToDb(uid, updateData);
    
    if (result.success) {
      _ensureUserDocOnce.add(uid);
    }
    
    return result;
  } catch (error) {
    // Ignore permission-denied to avoid noisy console during restricted environments
    const code = error && (error.code || "").toString();
    if (code === "permission-denied") {
      logger.warn("ensureUserDoc permission denied for uid:", uid);
      return { success: false, error: "permission-denied" };
    }
    return { success: false, error: error.message };
  }
};

// Get all users
export const getUsers = async () => {
  try {
    return await getAllUsersFromDb();
  } catch (error) {
    logger.error("Error getting users:", error);
    return { success: false, error: error.message };
  }
};

// Get user by ID
export const getUser = async (uid) => {
  if (!uid) {
    return { success: false, error: "uid required" };
  }

  try {
    const result = await getUserByIdFromDb(uid);
    
    if (!result.success) {
      return { success: false, error: "user_not_found" };
    }

    return {
      success: true,
      data: {
        docId: uid,
        ...result.data,
      },
    };
  } catch (error) {
    logger.error("Error getting user:", error);
    return { success: false, error: error.message };
  }
};

// Add user function
export const addUser = async (userData) => {
  try {
    logger.info('USER: Creating new user', {
      uid: userData?.uid,
      email: userData?.email,
      role: userData?.role,
      displayName: userData?.displayName
    });
    
    // Enforce deterministic ID: uid is required
    if (!userData?.uid) {
      return { success: false, error: "uid is required for addUser" };
    }
    
    const { uid, ...rest } = userData;
    const result = await setUserToDb(uid, {
      ...rest,
      createdAt: new Date() // Will be converted to Timestamp by DB service
    });
    
    return result.success ? { success: true, id: uid } : result;
  } catch (error) {
    logger.error("Error adding user:", error);
    return { success: false, error: error.message };
  }
};

// Update user function
export const updateUser = async (id, userData) => {
  try {
    logger.info('USER: updateUser called', {
      timestamp: new Date().toISOString(),
      userId: id,
      userDataKeys: Object.keys(userData),
      userData: {
        email: userData.email,
        displayName: userData.displayName,
        realName: userData.realName,
        studentNumber: userData.studentNumber,
        order: userData.order,
        role: userData.role
      }
    });
    
    // Validate inputs
    if (!id || typeof id !== 'string') {
      logger.error('USER: Invalid user ID provided for update:', { id, type: typeof id });
      return { success: false, error: 'Invalid user ID provided' };
    }
    
    if (!userData || typeof userData !== 'object') {
      logger.error('USER: Invalid user data provided for update:', { userData });
      return { success: false, error: 'Invalid user data provided' };
    }
    
    logger.info('USER: Updating user', { userId: id, updateFields: Object.keys(userData) });
    
    // Check if email is being changed
    logger.info('USER: Checking current user data for email change detection', { userId: id });
    const currentUserResult = await getUserByIdFromDb(id);
    
    logger.info('USER: Current user data retrieved', {
      success: currentUserResult.success,
      hasData: !!currentUserResult.data,
      currentEmail: currentUserResult.data?.email,
      newEmail: userData.email
    });
    
    if (currentUserResult.success && userData.email && userData.email !== currentUserResult.data.email) {
      logger.info('USER: Email change detected, logging activity', {
        oldEmail: currentUserResult.data.email,
        newEmail: userData.email
      });
      // Log email change activity
      try {
        const { ActivityLogger } = await import('../other/activityLogger');
        await ActivityLogger.emailChange();
        logger.info('USER: Email change activity logged successfully');
      } catch (error) {
        logger.warn('Failed to log email change activity:', error);
      }
    }
    
    logger.info('USER: Calling updateUserInDb', { userId: id });
    const result = await updateUserInDb(id, userData);
    
    logger.info('USER: updateUserInDb response received', {
      success: result.success,
      error: result.error,
      userId: id
    });
    
    if (result.success) {
      // Log activity
      try {
        logger.info('USER: Logging update activity');
        await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
          userId: id,
          updateFields: Object.keys(userData)
        }, id);
        logger.info('USER: Update activity logged successfully');
      } catch (logError) {
        logger.warn('USER: Failed to log user update:', logError);
      }
      
      logger.info('USER: Successfully updated user', { userId: id });
    }
    
    return result;
  } catch (error) {
    logger.error('USER: Failed to update user', { 
      error: error.message, 
      userId: id,
      stack: error.stack 
    });
    logger.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
};

// Delete user function (role-based)
export const deleteUser = async (id) => {
  try {
    logger.info('USER: Deleting user', { userId: id });
    
    const result = await deleteUserFromDb(id);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.USER_DELETED, {
          userId: id
        }, id);
      } catch (logError) {
        logger.warn('USER: Failed to log user deletion:', logError);
      }
      
      logger.info('USER: Successfully deleted user', { userId: id });
    }
    
    return result;
  } catch (error) {
    logger.error('USER: Failed to delete user', { error: error.message, userId: id });
    logger.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
};

// Delete student completely (Firestore + Firebase Auth)
export const deleteStudent = async (userId) => {
  try {
    logger.info('USER: Deleting student completely', { userId });
    
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    
    const deleteUserAuthFn = httpsCallable(functions, 'deleteUserAuth');
    const result = await deleteUserAuthFn({ userId });
    
    if (result.data?.success) {
      logger.info('USER: Successfully deleted student from Firestore + Auth', { userId });
      return { success: true, message: result.data.message };
    } else {
      throw new Error(result.data?.message || 'Failed to delete student');
    }
  } catch (error) {
    logger.error('USER: Failed to delete student', { error: error.message, userId });
    return { success: false, error: error.message };
  }
};

// Disable user (soft delete for staff)
export const disableUser = async (userId) => {
  try {
    logger.info('USER: Disabling user (soft delete)', { userId });
    
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    
    const disableUserFn = httpsCallable(functions, 'disableUser');
    const result = await disableUserFn({ userId });
    
    if (result.data?.success) {
      logger.info('USER: Successfully disabled user', { userId });
      return { success: true, message: result.data.message };
    } else {
      throw new Error(result.data?.message || 'Failed to disable user');
    }
  } catch (error) {
    logger.error('USER: Failed to disable user', { error: error.message, userId });
    return { success: false, error: error.message };
  }
};

// Admin cascade delete for a user
export const deleteUserCascade = async (uid) => {
  try {
    if (!uid) return { success: false, error: "uid required" };
    
    // This function needs to be moved to a database service since it uses direct Firebase operations
    // For now, we'll delegate to a separate cascade delete service
    const { deleteUserCascade: cascadeDeleteFromDb } = await import('../db/userDbService');
    
    const result = await cascadeDeleteFromDb(uid);
    return result;
  } catch (error) {
    logger.error("Error deleting user cascade:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get multiple users by their IDs in bulk
 * @param {Array<string>} userIds - Array of user IDs to fetch
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getUsersByIds = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) {
      return { success: true, data: {} };
    }

    const uniqueIds = [...new Set(userIds)]; // Remove duplicates
    
    // Use the database service for batch operations
    const { getUsersByIds: getUsersByIdsFromDb } = await import('../db/userDbService');
    const result = await getUsersByIdsFromDb(uniqueIds);
    
    return result;
  } catch (error) {
    logger.error('Error fetching users in bulk:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all users with optional role filter
 * @param {Object} options - Filter options
 * @param {boolean} options.studentsOnly - Only return students (non-admin, non-instructor)
 * @param {boolean} options.instructorsOnly - Only return instructors
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAllUsers = async (options = {}) => {
  try {
    const filters = {};
    
    if (options.studentsOnly) {
      // This would need to be implemented in the DB service with complex filtering
      filters.role = { notIn: ['admin', 'instructor', 'hr', 'superadmin'] };
    } else if (options.instructorsOnly) {
      filters.role = { in: ['admin', 'instructor', 'superadmin'] };
    }
    
    const result = await getAllUsersFromDb(filters);
    
    if (result.success && (options.studentsOnly || options.instructorsOnly)) {
      // Apply additional filtering at the business logic level
      let users = result.data;
      
      if (options.studentsOnly) {
        users = users.filter(u => !u.isAdmin && !u.isInstructor && !u.isHR && !u.isSuperAdmin);
      } else if (options.instructorsOnly) {
        users = users.filter(u => u.isInstructor || u.isAdmin || u.isSuperAdmin);
      }
      
      return { success: true, data: users };
    }
    
    return result;
  } catch (error) {
    logger.error('Error fetching all users:', error);
    return { success: false, error: error.message };
  }
};

// ===== USER UTILITY FUNCTIONS (Unified UI Logic) =====

/**
 * Check if a user should be disabled in UI components (select dropdowns, etc.)
 * 
 * @param {Object|string} user - User object or user status string
 * @param {Array} enrollments - User's enrollments (optional, only used if user is an object)
 * @returns {boolean} True if user should be disabled
 */
export const isUserDisabled = (user, enrollments = []) => {
  try {
    // If user is already a status string, use it directly
    if (typeof user === 'string') {
      return user === USER_STATUS.DELETED;
    }

    // If user is an object, determine status
    if (user && typeof user === 'object') {
      const status = user.status || 
                    (user.deleted ? USER_STATUS.DELETED : null) ||
                    (user.archived ? USER_STATUS.ARCHIVED : null) ||
                    (user.disabled ? USER_STATUS.DISABLED : null);

      return status === USER_STATUS.DELETED;
    }

    // Default to disabled for invalid user data
    return true;
  } catch (error) {
    logger.error('Error checking if user is disabled:', error);
    return true; // Fail safe to disabled
  }
};

/**
 * Check if a user should be disabled for selection (includes archived)
 * More restrictive version used in some components
 * 
 * @param {Object|string} user - User object or user status string
 * @param {Array} enrollments - User's enrollments (optional)
 * @returns {boolean} True if user should be disabled for selection
 */
export const isUserDisabledForSelection = (user, enrollments = []) => {
  try {
    // If user is already a status string, use it directly
    if (typeof user === 'string') {
      return user === USER_STATUS.DELETED || user === USER_STATUS.ARCHIVED;
    }

    // If user is an object, determine status
    if (user && typeof user === 'object') {
      const status = user.status || 
                    (user.deleted ? USER_STATUS.DELETED : null) ||
                    (user.archived ? USER_STATUS.ARCHIVED : null) ||
                    (user.disabled ? USER_STATUS.DISABLED : null);

      return status === USER_STATUS.DELETED || status === USER_STATUS.ARCHIVED;
    }

    // Default to disabled for invalid user data
    return true;
  } catch (error) {
    logger.error('Error checking if user is disabled for selection:', error);
    return true; // Fail safe to disabled
  }
};

/**
 * Check if a user is deleted (most common check across components)
 * 
 * @param {Object|string} user - User object or user status string
 * @returns {boolean} True if user is deleted
 */
export const isUserDeleted = (user) => {
  try {
    // If user is already a status string, use it directly
    if (typeof user === 'string') {
      return user === USER_STATUS.DELETED;
    }

    // If user is an object, check deleted flag or status
    if (user && typeof user === 'object') {
      return user.deleted === true || 
             user.deletedAt !== undefined ||
             user.status === USER_STATUS.DELETED;
    }

    // Default to deleted for invalid user data
    return true;
  } catch (error) {
    logger.error('Error checking if user is deleted:', error);
    return true; // Fail safe to deleted
  }
};

/**
 * Check if a user is disabled (at user level, not class level)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is disabled
 */
export const isUserDisabledAtUserLevel = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      logger.warn('isUserDisabledAtUserLevel: Invalid user object', { user });
      return true;
    }

    const disabled = user.disabled === true;
    const disabledAt = user.disabledAt && user.disabledAt !== null && user.disabledAt !== '';
    const statusDisabled = user.status === USER_STATUS.DISABLED;
    const isDisabled = user.isDisabled === true;

    const result = disabled || disabledAt || statusDisabled || isDisabled;

    logger.info('isUserDisabledAtUserLevel: Checking user disabled status', {
      userEmail: user.email,
      disabled: disabled,
      disabledAt: disabledAt,
      status: user.status,
      isDisabled: isDisabled,
      result: result,
      allFields: Object.keys(user)
    });

    return result;
  } catch (error) {
    logger.error('Error checking if user is disabled at user level:', error);
    return true; // Fail safe to disabled
  }
};

/**
 * Enable user (both Firestore and Firebase Auth)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result object
 */
export const enableUser = async (userId) => {
  try {
    logger.info('USER: Enabling user', { userId });
    
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    
    const enableUserFn = httpsCallable(functions, 'enableUser');
    const result = await enableUserFn({ userId });
    
    logger.info('USER: User enabled successfully', { userId, result: result.data });
    
    return {
      success: true,
      payload: result.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('USER: Failed to enable user', { userId, error: error.message });
    
    return {
      success: false,
      error: {
        code: error.code || 'ENABLE_USER_FAILED',
        message: error.message || 'Failed to enable user'
      },
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get user display name with fallbacks (synchronous version for UI)
 * 
 * @param {Object} user - User object
 * @returns {string} Display name
 */
export const getUserDisplayNameSync = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return 'Unknown User';
    }

    return user.displayName || 
           user.realName || 
           user.name || 
           user.email || 
           'Unknown User';
  } catch (error) {
    logger.error('Error getting user display name:', error);
    return 'Unknown User';
  }
};

/**
 * Get user ID with fallbacks
 * 
 * @param {Object} user - User object
 * @returns {string} User ID
 */
export const getUserId = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return '';
    }

    return user.docId || 
           user.id || 
           user.uid || 
           '';
  } catch (error) {
    logger.error('Error getting user ID:', error);
    return '';
  }
};

/**
 * Common user option factory for select dropdowns
 * 
 * @param {Object} user - User object
 * @param {Object} options - Additional options
 * @param {boolean} options.includeArchived - Whether to include archived users (default: false)
 * @param {Array} options.enrollments - User's enrollments for status determination
 * @param {Function} options.t - Translation function
 * @returns {Object} User option object for select components
 */
export const createUserSelectOption = (user, options = {}) => {
  const { includeArchived = false, enrollments = [], t } = options;
  
  try {
    const userId = getUserId(user);
    const displayName = getUserDisplayNameSync(user);
    
    // Determine if user should be disabled
    const isDisabled = includeArchived 
      ? isUserDisabledForSelection(user, enrollments)
      : isUserDisabled(user, enrollments);

    return {
      value: userId,
      displayLabel: displayName,
      user,
      isDisabled,
      // Additional commonly needed properties
      email: user?.email || '',
      status: user?.status || (user?.deleted ? USER_STATUS.DELETED : null),
    };
  } catch (error) {
    logger.error('Error creating user select option:', error);
    return {
      value: getUserId(user) || '',
      displayLabel: 'Error Loading User',
      user,
      isDisabled: true,
      email: '',
      status: USER_STATUS.DELETED,
    };
  }
};

/**
 * Batch process users into select options
 * 
 * @param {Array} users - Array of user objects
 * @param {Object} options - Options passed to createUserSelectOption
 * @returns {Array} Array of user option objects
 */
export const createUserSelectOptions = (users, options = {}) => {
  try {
    if (!Array.isArray(users)) {
      return [];
    }

    return users
      .filter(user => user != null) // Filter out null/undefined
      .map(user => createUserSelectOption(user, options))
      .filter(option => option.value); // Filter out options without valid IDs
  } catch (error) {
    logger.error('Error creating user select options:', error);
    return [];
  }
};

/**
 * Check if user has a specific role (wrapper for userRoles utility)
 * 
 * @param {Object} user - User object
 * @param {string} role - Role to check
 * @returns {boolean} True if user has the role
 */
export const hasUserRole = (user, role) => {
  try {
    if (!user || typeof user !== 'object' || !role) {
      return false;
    }

    // Check if user has the specified role
    return user.role === role || 
           (Array.isArray(user.roles) && user.roles.includes(role));
  } catch (error) {
    logger.error('Error checking user role:', error);
    return false;
  }
};

/**
 * Check if user is a student (using new boolean flag system)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is a student
 */
export const isStudent = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return Boolean(user.isStudent);
  } catch (error) {
    logger.error('Error checking if user is student:', error);
    return false;
  }
};

/**
 * Check if user is an instructor (using new boolean flag system)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is an instructor
 */
export const isInstructor = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return Boolean(user.isInstructor);
  } catch (error) {
    logger.error('Error checking if user is instructor:', error);
    return false;
  }
};

/**
 * Check if user is an admin (using new boolean flag system)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is an admin
 */
export const isAdmin = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return Boolean(user.isAdmin);
  } catch (error) {
    logger.error('Error checking if user is admin:', error);
    return false;
  }
};

/**
 * Check if user is HR (using new boolean flag system)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is HR
 */
export const isHR = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return Boolean(user.isHR);
  } catch (error) {
    logger.error('Error checking if user is HR:', error);
    return false;
  }
};

/**
 * Check if user is a super admin (using new boolean flag system)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is a super admin
 */
export const isSuperAdmin = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return Boolean(user.isSuperAdmin);
  } catch (error) {
    logger.error('Error checking if user is super admin:', error);
    return false;
  }
};

/**
 * Check if user is enrolled in a specific class
 * 
 * @param {Object} user - User object
 * @param {string} classId - Class ID to check
 * @returns {boolean} True if user is enrolled in the class
 */
export const isUserEnrolledInClass = (user, classId) => {
  try {
    if (!user || typeof user !== 'object' || !classId) {
      return false;
    }

    const enrolledClasses = user.enrolledClasses || [];
    return Array.isArray(enrolledClasses) && enrolledClasses.includes(classId);
  } catch (error) {
    logger.error('Error checking class enrollment:', error);
    return false;
  }
};

/**
 * Get user's enrollment count
 * 
 * @param {Object} user - User object
 * @returns {number} Number of active enrollments
 */
export const getUserEnrollmentCount = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return 0;
    }

    const enrolledClasses = user.enrolledClasses || [];
    return Array.isArray(enrolledClasses) ? enrolledClasses.length : 0;
  } catch (error) {
    logger.error('Error getting user enrollment count:', error);
    return 0;
  }
};

/**
 * Update user progress function
 * @param {string} userId - User ID
 * @param {Object} progressData - Progress data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserProgress = async (userId, progressData) => {
  try {
    logger.info('USER: Updating user progress', { userId, progressKeys: Object.keys(progressData) });
    
    const result = await updateUserInDb(userId, {
      resourceProgress: progressData
    });
    
    if (result.success) {
      logger.info('USER: Successfully updated user progress', { userId });
    }
    
    return result;
  } catch (error) {
    logger.error('USER: Failed to update user progress', { error: error.message, userId });
    return { success: false, error: error.message };
  }
};

