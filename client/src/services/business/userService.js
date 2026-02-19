import { doc, getDoc, query, collection, where, getDocs, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { getUserByEmail as getUserByEmailFromDb } from '../db/userDbService';
import { USER_STATUS } from '@utils/userStatus';
import { 
  USER_ROLES, 
  isAdmin as isRoleAdmin, 
  isInstructor as isRoleInstructor, 
  isStudent as isRoleStudent,
  isHR as isRoleHR
} from '@constants/userRoles';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

// Prevent duplicate ensureUserDoc writes during React StrictMode re-mounts
const _ensureUserDocOnce = new Set();

/**
 * Centralized User Service - DRY Firebase user operations
 * This REPLACES the limited user.js file
 */

// Get user by ID (centralized) - with performance monitoring and memoization
export const getUserById = withPerformanceMonitoring(
  memoize(async (userId) => {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    try {
      logger.debug('USER: Fetching user by ID', { userId });
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        logger.debug('USER: Successfully fetched user', { userId });
        return { success: true, data: userData };
      }
      
      logger.warn('USER: User not found', { userId });
      return { success: false, error: 'User not found' };
    } catch (error) {
      logger.error('USER: Failed to fetch user', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }),
  'getUserById'
);

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
    const userDoc = await getDoc(doc(db, 'users', studentNumber));
    if (userDoc.exists()) {
      return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: 'Student not found' };
  } catch (error) {
    logger.error('Error fetching student by number:', error);
    return { success: false, error: error.message };
  }
};

// Check if user exists by ID
export const userExists = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists();
  } catch (error) {
    logger.error('Error checking user existence:', error);
    return false;
  }
};

// Get user preferences (centralized)
export const getUserPreferences = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data().preferences || {} };
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
    const q = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: users };
  } catch (error) {
    logger.error('Error fetching users by role:', error);
    return { success: false, error: error.message };
  }
};

// Search users by display name or email (centralized)
export const searchUsers = async (searchTerm) => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = { id: doc.id, ...doc.data() };
      const searchLower = searchTerm.toLowerCase();
      if (
        userData.displayName?.toLowerCase().includes(searchLower) ||
        userData.email?.toLowerCase().includes(searchLower) ||
        userData.realName?.toLowerCase().includes(searchLower) ||
        userData.studentNumber?.toLowerCase().includes(searchLower)
      ) {
        users.push(userData);
      }
    });
    return { success: true, data: users };
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
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const base = {
      email: data.email || null,
      displayName: data.displayName || null,
      realName: data.realName || null,
      studentNumber: data.studentNumber || null,
      role: data.role || "student",
      createdAt: Timestamp.now(),
    };
    // If document exists, only merge the provided data fields
    // If document doesn't exist, use the base object with provided data
    const updateData = snap.exists() ? data : { ...base, ...data };
    await setDoc(ref, updateData, { merge: true });
    _ensureUserDocOnce.add(uid);
    return { success: true };
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
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((d) => {
      users.push({ docId: d.id, ...d.data() });
    });
    return { success: true, data: users };
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
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { success: false, error: "user_not_found" };
    }

    return {
      success: true,
      data: {
        docId: uid,
        ...snap.data(),
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
    await setDoc(
      doc(db, "users", uid),
      { ...rest, createdAt: Timestamp.now() },
      { merge: true }
    );
    return { success: true, id: uid };
  } catch (error) {
    logger.error("Error adding user:", error);
    return { success: false, error: error.message };
  }
};

// Update user function
export const updateUser = async (id, userData) => {
  try {
    logger.info('USER: Updating user', { userId: id, updateFields: Object.keys(userData) });
    
    // Check if email is being changed
    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists() && userData.email && userData.email !== userSnap.data().email) {
      // Log email change activity
      try {
        const { ActivityLogger } = await import('../other/activityLogger');
        await ActivityLogger.emailChange();
      } catch (error) {
        logger.warn('Failed to log email change activity:', error);
      }
    }
    
    await updateDoc(userRef, userData);
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.USER_UPDATED, {
        userId: id,
        updateFields: Object.keys(userData)
      });
    } catch (logError) {
      logger.warn('USER: Failed to log user update:', logError);
    }
    
    logger.info('USER: Successfully updated user', { userId: id });
    return { success: true };
  } catch (error) {
    logger.error('USER: Failed to update user', { error: error.message, userId: id });
    logger.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
};

// Delete user function
export const deleteUser = async (id) => {
  try {
    logger.info('USER: Deleting user', { userId: id });
    
    await deleteDoc(doc(db, "users", id));
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.USER_DELETED, {
        userId: id
      });
    } catch (logError) {
      logger.warn('USER: Failed to log user deletion:', logError);
    }
    
    logger.info('USER: Successfully deleted user', { userId: id });
    return { success: true };
  } catch (error) {
    logger.error('USER: Failed to delete user', { error: error.message, userId: id });
    logger.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
};

// Admin cascade delete for a user
export const deleteUserCascade = async (uid) => {
  try {
    if (!uid) return { success: false, error: "uid required" };
    const deletions = [];
    
    // notifications
    const nqs = await getDocs(
      query(collection(db, "notifications"), where("userId", "==", uid))
    );
    nqs.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "notifications", d.id)))
    );
    
    // enrollments
    const eqs = await getDocs(
      query(collection(db, "enrollments"), where("userId", "==", uid))
    );
    eqs.forEach((d) => deletions.push(deleteDoc(doc(db, "enrollments", d.id))));
    
    // submissions
    const sqs = await getDocs(
      query(collection(db, "submissions"), where("userId", "==", uid))
    );
    sqs.forEach((d) => deletions.push(deleteDoc(doc(db, "submissions", d.id))));
    
    // attendance records
    const attQuery = await getDocs(
      query(collection(db, "attendance"), where("studentId", "==", uid))
    );
    attQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "attendance", d.id)))
    );
    
    // quiz submissions
    const quizSubQuery = await getDocs(
      query(collection(db, "quizSubmissions"), where("userId", "==", uid))
    );
    quizSubQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "quizSubmissions", d.id)))
    );
    
    // quiz results
    const quizResQuery = await getDocs(
      query(collection(db, "quizResults"), where("userId", "==", uid))
    );
    quizResQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "quizResults", d.id)))
    );
    
    // marks/grades
    const marksQuery = await getDocs(
      query(collection(db, "studentMarks"), where("studentId", "==", uid))
    );
    marksQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(db, "studentMarks", d.id)))
    );
    
    // messages (sent by user)
    const mqs = await getDocs(
      query(collection(db, "messages"), where("senderId", "==", uid))
    );
    mqs.forEach((d) => deletions.push(deleteDoc(doc(db, "messages", d.id))));
    
    // direct rooms containing user (delete room)
    const rqs = await getDocs(
      query(
        collection(db, "directRooms"),
        where("participants", "array-contains", uid)
      )
    );
    rqs.forEach((d) => deletions.push(deleteDoc(doc(db, "directRooms", d.id))));
    
    await Promise.allSettled(deletions);
    
    // finally delete users/{uid}
    await deleteDoc(doc(db, "users", uid));
    return { success: true };
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
    
    // Batch fetch users with error handling
    const userPromises = uniqueIds.map(async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          return { id: userId, data: { id: userDoc.id, ...userDoc.data() } };
        }
        return { id: userId, data: null };
      } catch (error) {
        logger.error(`Error fetching user ${userId}:`, error);
        return { id: userId, data: null };
      }
    });

    const results = await Promise.allSettled(userPromises);
    
    // Convert array to object map for easy lookup
    const userMap = {};
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        userMap[result.value.id] = result.value.data;
      }
    });

    return { success: true, data: userMap };
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
    const usersSnap = await getDocs(collection(db, 'users'));
    let users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (options.studentsOnly) {
      users = users.filter(u => !u.isAdmin && !u.isInstructor && !u.isHR && !u.isSuperAdmin);
    } else if (options.instructorsOnly) {
      users = users.filter(u => u.isInstructor || u.isAdmin || u.isSuperAdmin);
    }

    return { success: true, data: users };
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
      return true;
    }

    return user.disabled === true || 
           user.disabledAt !== undefined ||
           user.status === USER_STATUS.DISABLED ||
           user.isDisabled === true;
  } catch (error) {
    logger.error('Error checking if user is disabled at user level:', error);
    return true; // Fail safe to disabled
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
 * Check if user is a student (wrapper for userRoles utility)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is a student
 */
export const isStudent = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return isRoleStudent(user.role);
  } catch (error) {
    logger.error('Error checking if user is student:', error);
    return false;
  }
};

/**
 * Check if user is an instructor (wrapper for userRoles utility)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is an instructor
 */
export const isInstructor = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return isRoleInstructor(user.role);
  } catch (error) {
    logger.error('Error checking if user is instructor:', error);
    return false;
  }
};

/**
 * Check if user is an admin (wrapper for userRoles utility)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is an admin
 */
export const isAdmin = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return isRoleAdmin(user.role);
  } catch (error) {
    logger.error('Error checking if user is admin:', error);
    return false;
  }
};

/**
 * Check if user is HR (wrapper for userRoles utility)
 * 
 * @param {Object} user - User object
 * @returns {boolean} True if user is HR
 */
export const isHR = (user) => {
  try {
    if (!user || typeof user !== 'object') {
      return false;
    }
    return isRoleHR(user.role);
  } catch (error) {
    logger.error('Error checking if user is HR:', error);
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
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      resourceProgress: progressData
    }, { merge: true });
    
    logger.info('USER: Successfully updated user progress', { userId });
    return { success: true };
  } catch (error) {
    logger.error('USER: Failed to update user progress', { error: error.message, userId });
    return { success: false, error: error.message };
  }
};

