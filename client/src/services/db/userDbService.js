/**
 * User Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for user records. This is the database layer
 * and should NOT contain business logic. All business logic should be in the
 * corresponding business service layer.
 * 
 * USAGE:
 * Import these functions in business services only.
 * Do NOT import directly in UI components - use business services instead.
 * 
 * ARCHITECTURE:
 * - CRUD operations for user records
 * - Query operations for user lookups
 * - Real-time listeners for user updates
 * - No business logic or validation (handled by business layer)
 * 
 * COLLECTION: 'users'
 * 
 * @typedef {import('@types/index').User} User
 * @typedef {import('@types/index').UserRole} UserRole
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { USER_STATUS_TYPES } from '@constants/activityTypes';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get user by ID - with performance monitoring and memoization
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getUserById = async (userId) => {
  try {
    if (!userId || typeof userId !== 'string') {
      logger.error('[UserDbService] Invalid userId provided:', { userId, type: typeof userId });
      return { success: false, error: 'Invalid user ID provided' };
    }
    
    logger.debug('[UserDbService] Getting user by ID:', { userId });
    const result = await dbService.getById(COLLECTIONS.USERS, userId);
    return result;
  } catch (error) {
    logger.error('[UserDbService] Error getting user by ID:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user by student number
 * @param {string} studentNumber - Student number
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getUserByStudentNumber = async (studentNumber) => {
  try {
    const result = await dbService.getById(COLLECTIONS.USERS, studentNumber);
    return result;
  } catch (error) {
    logger.error('[UserDbService] Error getting user by student number:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getUserByEmail = async (email) => {
  try {
    const result = await dbService.getAll(COLLECTIONS.USERS, {
      where: {
        field: 'email',
        operator: '==',
        value: email
      }
    });
    
    if (result.success && result.data.length > 0) {
      return { success: true, data: result.data[0] };
    }
    
    return { success: false, error: 'User not found' };
  } catch (error) {
    logger.error('[UserDbService] Error getting user by email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get users by role
 * @param {string} role - User role
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getUsersByRole = async (role) => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.USERS), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: users };
  } catch (error) {
    logger.error('[UserDbService] Error getting users by role:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all users with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getUsers = async (filters = {}) => {
  try {
    const { role, status, isActive } = filters;
    const conditions = [];
    
    if (role) conditions.push(where('role', '==', role));
    if (status) conditions.push(where('status', '==', status));
    if (isActive !== undefined) conditions.push(where('isActive', '==', isActive));
    
    const q = conditions.length > 0 
      ? query(collection(dbService.getDb(), COLLECTIONS.USERS), ...conditions)
      : query(collection(dbService.getDb(), COLLECTIONS.USERS));
      
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: users };
  } catch (error) {
    logger.error('[UserDbService] Error getting users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update user
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 * @param {Object} auditData - Audit data (createdAt, updatedAt, createdBy, updatedBy)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setUser = async (userId, userData, auditData = {}) => {
  try {
    const docRef = doc(dbService.getDb(), COLLECTIONS.USERS, userId);
    await setDoc(docRef, {
      ...userData,
      ...auditData
    }, { merge: true });
    return { success: true };
  } catch (error) {
    logger.error('[UserDbService] Error setting user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {Object} auditData - Audit data (updatedAt, updatedBy)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUser = async (userId, updateData, auditData = {}) => {
  try {
    if (!userId || typeof userId !== 'string') {
      logger.error('[UserDbService] Invalid userId provided for update:', { userId, type: typeof userId });
      return { success: false, error: 'Invalid user ID provided for update' };
    }
    
    if (!updateData || typeof updateData !== 'object') {
      logger.error('[UserDbService] Invalid updateData provided:', { updateData });
      return { success: false, error: 'Invalid update data provided' };
    }
    
    logger.debug('[UserDbService] Updating user:', { userId, updateFields: Object.keys(updateData) });
    const docRef = doc(dbService.getDb(), COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      ...updateData,
      ...auditData
    });
    logger.info('[UserDbService] Successfully updated user:', { userId });
    return { success: true };
  } catch (error) {
    logger.error('[UserDbService] Error updating user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete user (both Firestore and Firebase Auth)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUser = async (userId) => {
  try {
    // First delete from Firestore
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.USERS, userId));
    
    // Then delete from Firebase Auth to revoke tokens
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      // If the current user is being deleted, sign them out
      if (user && user.uid === userId) {
        await user.delete();
        logger.info('[UserDbService] Firebase Auth user deleted and signed out:', userId);
      } else {
        // For other users, we need admin SDK to delete their auth account
        // This will be handled by the backend/Cloud Function
        logger.info('[UserDbService] Firestore user deleted, auth cleanup needed:', userId);
      }
    } catch (authError) {
      logger.warn('[UserDbService] Could not delete auth user (may need admin SDK):', authError);
      // Continue even if auth deletion fails - Firestore record is deleted
    }
    
    return { success: true };
  } catch (error) {
    logger.error('[UserDbService] Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user exists
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const userExists = async (userId) => {
  try {
    const userDoc = await getDoc(doc(dbService.getDb(), COLLECTIONS.USERS, userId));
    return userDoc.exists();
  } catch (error) {
    logger.error('[UserDbService] Error checking user existence:', error);
    return false;
  }
};

/**
 * Real-time listener for user changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onUserChange = (userId, callback) => {
  try {
    const docRef = doc(dbService.getDb(), COLLECTIONS.USERS, userId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    });
    return unsubscribe;
  } catch (error) {
    logger.error('[UserDbService] Error setting up user listener:', error);
    return () => {};
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
        const userDoc = await getDoc(doc(dbService.getDb(), COLLECTIONS.USERS, userId));
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
    logger.error('[UserDbService] Error fetching users in bulk:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin cascade delete for a user
 * @param {string} uid - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUserCascade = async (uid) => {
  try {
    if (!uid) return { success: false, error: "uid required" };
    const deletions = [];
    
    // notifications
    const nqs = await getDocs(
      query(collection(dbService.getDb(), COLLECTIONS.NOTIFICATIONS), where("userId", "==", uid))
    );
    nqs.forEach((d) =>
      deletions.push(deleteDoc(doc(dbService.getDb(), COLLECTIONS.NOTIFICATIONS, d.id)))
    );
    
    // enrollments
    const eqs = await getDocs(
      query(collection(dbService.getDb(), COLLECTIONS.ENROLLMENTS), where("userId", "==", uid))
    );
    eqs.forEach((d) => deletions.push(deleteDoc(doc(dbService.getDb(), COLLECTIONS.ENROLLMENTS, d.id))));
    
    // submissions
    const sqs = await getDocs(
      query(collection(dbService.getDb(), COLLECTIONS.SUBMISSIONS), where("userId", "==", uid))
    );
    sqs.forEach((d) => deletions.push(deleteDoc(doc(dbService.getDb(), COLLECTIONS.SUBMISSIONS, d.id))));
    
    // attendance records
    const attQuery = await getDocs(
      query(collection(dbService.getDb(), COLLECTIONS.ATTENDANCE), where("studentId", "==", uid))
    );
    attQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(dbService.getDb(), COLLECTIONS.ATTENDANCE, d.id)))
    );
    
    // quiz submissions
    const quizSubQuery = await getDocs(
      query(collection(dbService.getDb(), COLLECTIONS.QUIZ_SUBMISSIONS), where("userId", "==", uid))
    );
    quizSubQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(dbService.getDb(), COLLECTIONS.QUIZ_SUBMISSIONS, d.id)))
    );
    
    // quiz results
    const quizResQuery = await getDocs(
      query(collection(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS), where("userId", "==", uid))
    );
    quizResQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS, d.id)))
    );
    
    // marks/grades
    const marksQuery = await getDocs(
      query(collection(dbService.getDb(), 'studentMarks'), where("studentId", "==", uid))
    );
    marksQuery.forEach((d) =>
      deletions.push(deleteDoc(doc(dbService.getDb(), 'studentMarks', d.id)))
    );
    
    // messages (sent by user)
    const mqs = await getDocs(
      query(collection(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES), where("senderId", "==", uid))
    );
    
    // finally delete users/{uid}
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.USERS, uid));
    return { success: true };
  } catch (error) {
    logger.error('[UserDbService] Error deleting user cascade:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Disable user in Firestore
 * @param {string} userId - User ID
 * @param {string} adminId - Admin ID performing the action
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const disableUserFirestore = async (userId, adminId) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.USERS, userId), {
      disabled: true,
      isDisabled: true,
      status: USER_STATUS_TYPES.DISABLED,
      disabledAt: serverTimestamp(),
      disabledBy: adminId
    });
    
    return { success: true };
  } catch (error) {
    logger.error('[UserDbService] Error disabling user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enable user in Firestore
 * @param {string} userId - User ID
 * @param {string} adminId - Admin ID performing the action
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const enableUserFirestore = async (userId, adminId) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.USERS, userId), {
      disabled: false,
      isDisabled: false,
      status: USER_STATUS_TYPES.ACTIVE,
      disabledAt: null,
      enabledBy: adminId,
      enabledAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    logger.error('[UserDbService] Error enabling user:', error);
    return { success: false, error: error.message };
  }
};
