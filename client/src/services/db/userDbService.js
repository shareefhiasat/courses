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
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get user by ID - with performance monitoring and memoization
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: 'User not found' };
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
    const userDoc = await getDoc(doc(db, 'users', studentNumber));
    if (userDoc.exists()) {
      return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: 'Student not found' };
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
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
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
    const q = query(collection(db, 'users'), where('role', '==', role));
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
      ? query(collection(db, 'users'), ...conditions)
      : query(collection(db, 'users'));
      
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setUser = async (userId, userData) => {
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
      ...userData,
      updatedAt: serverTimestamp()
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUser = async (userId, updateData) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[UserDbService] Error updating user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
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
    const userDoc = await getDoc(doc(db, 'users', userId));
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
    const docRef = doc(db, 'users', userId);
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
    logger.error('[UserDbService] Error deleting user cascade:', error);
    return { success: false, error: error.message };
  }
};
