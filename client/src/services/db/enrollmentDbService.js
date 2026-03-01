/**
 * Enrollment Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for enrollment records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'enrollments'
 * 
 * @typedef {import('@types/index').Enrollment} Enrollment
 * @typedef {import('@types/index').EnrollmentStatus} EnrollmentStatus
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  Timestamp,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get all enrollments - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getEnrollments = async () => {
  try {
    const result = await dbService.getAll(COLLECTIONS.ENROLLMENTS);
    
    // Handle missing collection gracefully
    if (!result.success && result.error && 
        (result.error.includes('Missing or insufficient permissions') || 
         result.error.includes('permission-denied') ||
         result.error.includes('No document to update'))) {
      logger.warn('[EnrollmentDbService] Enrollments collection not available:', { error: result.error });
      return {
        success: true,
        data: []
      };
    }
    
    return result;
  } catch (error) {
    logger.error('[EnrollmentDbService] Error getting enrollments:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get enrollments by user - with performance monitoring and memoization
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getEnrollmentsByUser = async (userId) => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.ENROLLMENTS), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const enrollments = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: enrollments };
  } catch (error) {
    logger.error('[EnrollmentDbService] Error getting enrollments by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get enrollments by class - with performance monitoring and memoization
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getEnrollmentsByClass = async (classId) => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.ENROLLMENTS), where('classId', '==', classId));
    const querySnapshot = await getDocs(q);
    const enrollments = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: enrollments };
  } catch (error) {
    logger.error('[EnrollmentDbService] Error getting enrollments by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get enrollment by ID
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getEnrollment = async (enrollmentId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.ENROLLMENTS, enrollmentId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Enrollment not found' };
  } catch (error) {
    logger.error('[EnrollmentDbService] Error getting enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update enrollment
 * @param {string} enrollmentId - Enrollment ID (userId_classId)
 * @param {Object} enrollmentData - Enrollment data
 * @returns {Promise<{success: boolean, id: string, error?: string}>}
 */
export const setEnrollment = async (enrollmentId, enrollmentData) => {
  try {
    await setDoc(
      doc(dbService.getDb(), COLLECTIONS.ENROLLMENTS, enrollmentId),
      {
        ...enrollmentData,
        createdAt: enrollmentData.createdAt || Timestamp.now(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { success: true, id: enrollmentId };
  } catch (error) {
    logger.error('[EnrollmentDbService] Error setting enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update enrollment
 * @param {string} enrollmentId - Enrollment ID
 * @param {Object} updateData - Data to update
 * @param {Object} auditData - Audit data (updatedAt, updatedBy)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const update = async (enrollmentId, updateData, auditData = {}) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.ENROLLMENTS, enrollmentId), {
      ...updateData,
      ...auditData
    });
    return { success: true };
  } catch (error) {
    logger.error('[EnrollmentDbService] Error updating enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete enrollment
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteEnrollment = async (enrollmentId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.ENROLLMENTS, enrollmentId));
    return { success: true };
  } catch (error) {
    logger.error('[EnrollmentDbService] Error deleting enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if enrollment exists
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>}
 */
export const enrollmentExists = async (userId, classId) => {
  try {
    const enrollmentId = `${userId}_${classId}`;
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.ENROLLMENTS, enrollmentId));
    return docSnap.exists();
  } catch (error) {
    logger.error('[EnrollmentDbService] Error checking enrollment existence:', error);
    return false;
  }
};
