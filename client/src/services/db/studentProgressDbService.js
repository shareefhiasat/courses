/**
 * Student Progress Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for student progress records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'studentProgress'
 * 
 * @typedef {import('@types/index').StudentProgress} StudentProgress
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
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get student progress by user ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getStudentProgress = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'studentProgress', userId));
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Student progress not found' };
  } catch (error) {
    logger.error('[StudentProgressDbService] Error getting student progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update student progress
 * @param {string} userId - User ID
 * @param {Object} progressData - Progress data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setStudentProgress = async (userId, progressData) => {
  try {
    await setDoc(
      doc(db, 'studentProgress', userId),
      {
        ...progressData,
        userId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    logger.error('[StudentProgressDbService] Error setting student progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update student progress
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateStudentProgress = async (userId, updateData) => {
  try {
    await updateDoc(doc(db, 'studentProgress', userId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[StudentProgressDbService] Error updating student progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Increment student progress metrics
 * @param {string} userId - User ID
 * @param {Object} increments - Object with fields to increment
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const incrementStudentProgress = async (userId, increments) => {
  try {
    const incrementData = {};
    Object.keys(increments).forEach(key => {
      incrementData[key] = increment(increments[key]);
    });
    
    await updateDoc(doc(db, 'studentProgress', userId), {
      ...incrementData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[StudentProgressDbService] Error incrementing student progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all student progress records
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAllStudentProgress = async (options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'updatedAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'studentProgress'),
      orderBy(orderByField, orderDirection),
      limit ? limit(limitCount) : undefined
    ).filter(Boolean);
    
    const querySnapshot = await getDocs(q);
    const progressRecords = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: progressRecords };
  } catch (error) {
    logger.error('[StudentProgressDbService] Error getting all student progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get student progress by class
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getStudentProgressByClass = async (classId) => {
  try {
    // This would require a composite index or different data structure
    // For now, return all progress and filter client-side
    const result = await getAllStudentProgress();
    if (!result.success) {
      return result;
    }
    
    // Filter by enrolled classes (this would need to be optimized)
    const filteredProgress = result.data.filter(progress => 
      progress.enrolledClasses && progress.enrolledClasses.includes(classId)
    );
    
    return { success: true, data: filteredProgress };
  } catch (error) {
    logger.error('[StudentProgressDbService] Error getting student progress by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete student progress
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteStudentProgress = async (userId) => {
  try {
    await deleteDoc(doc(db, 'studentProgress', userId));
    return { success: true };
  } catch (error) {
    logger.error('[StudentProgressDbService] Error deleting student progress:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize student progress with default values
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const initializeStudentProgress = async (userId) => {
  try {
    const defaultProgress = {
      userId,
      enrolledClasses: 0,
      completedClasses: 0,
      quizzesCompleted: 0,
      homeworksCompleted: 0,
      trainingsCompleted: 0,
      totalPoints: 0,
      level: 1,
      badges: [],
      streak: 0,
      lastActivityDate: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'studentProgress', userId), defaultProgress);
    return { success: true };
  } catch (error) {
    logger.error('[StudentProgressDbService] Error initializing student progress:', error);
    return { success: false, error: error.message };
  }
};
