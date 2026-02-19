/**
 * Class Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for class records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'classes'
 * 
 * @typedef {import('@types/index').Class} Class
 * @typedef {import('@types/index').ClassSchedule} ClassSchedule
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

/**
 * Get all classes - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getClasses = withPerformanceMonitoring(
  memoize(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      const classes = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      return { success: true, data: classes };
    } catch (error) {
      logger.error('[ClassDbService] Error getting classes:', error);
      return { success: false, error: error.message };
    }
  }),
  'getClasses'
);

/**
 * Get class by ID - with performance monitoring and memoization
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getClass = withPerformanceMonitoring(
  memoize(async (classId) => {
    try {
      const docSnap = await getDoc(doc(db, 'classes', classId));
      if (docSnap.exists()) {
        return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
      }
      return { success: false, error: 'Class not found' };
    } catch (error) {
      logger.error('[ClassDbService] Error getting class:', error);
      return { success: false, error: error.message };
    }
  }),
  'getClass'
);

/**
 * Get classes by program
 * @param {string} programId - Program ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getClassesByProgram = async (programId) => {
  try {
    const q = query(collection(db, 'classes'), where('programId', '==', programId));
    const querySnapshot = await getDocs(q);
    const classes = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: classes };
  } catch (error) {
    logger.error('[ClassDbService] Error getting classes by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get classes by instructor
 * @param {string} instructorId - Instructor ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getClassesByInstructor = async (instructorId) => {
  try {
    const q = query(collection(db, 'classes'), where('instructorId', '==', instructorId));
    const querySnapshot = await getDocs(q);
    const classes = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: classes };
  } catch (error) {
    logger.error('[ClassDbService] Error getting classes by instructor:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create class
 * @param {Object} classData - Class data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createClass = async (classData) => {
  try {
    const docRef = doc(collection(db, 'classes'));
    await setDoc(docRef, {
      ...classData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[ClassDbService] Error creating class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update class
 * @param {string} classId - Class ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateClass = async (classId, updateData) => {
  try {
    await updateDoc(doc(db, 'classes', classId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[ClassDbService] Error updating class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete class
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, 'classes', classId));
    return { success: true };
  } catch (error) {
    logger.error('[ClassDbService] Error deleting class:', error);
    return { success: false, error: error.message };
  }
};
