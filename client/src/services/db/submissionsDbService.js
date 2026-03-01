/**
 * Submissions Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for submission records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'submissions'
 * 
 * @typedef {import('@types/index').Submission} Submission
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
  limit,
  serverTimestamp
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import { COLLECTIONS } from '@constants/collections';
import logger from '@utils/logger';

/**
 * Get submissions by user ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubmissionsByUser = async (userId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.SUBMISSIONS),
      where('userId', '==', userId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: submissions };
  } catch (error) {
    // Check if this is a missing collection error
    if (error.message.includes('Missing or insufficient permissions') || 
        error.code === 'permission-denied' ||
        error.message.includes('No document to update')) {
      logger.warn('[SubmissionsDbService] Submissions collection not available:', { error: error.message });
      return {
        success: true,
        data: []
      };
    }
    
    logger.error('[SubmissionsDbService] Error getting submissions by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get submissions by activity ID
 * @param {string} activityId - Activity ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubmissionsByActivity = async (activityId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.SUBMISSIONS),
      where('activityId', '==', activityId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: submissions };
  } catch (error) {
    logger.error('[SubmissionsDbService] Error getting submissions by activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getSubmission = async (submissionId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.SUBMISSIONS, submissionId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Submission not found' };
  } catch (error) {
    logger.error('[SubmissionsDbService] Error getting submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create submission
 * @param {Object} submissionData - Submission data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createSubmission = async (submissionData) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.SUBMISSIONS));
    await setDoc(docRef, {
      ...submissionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[SubmissionsDbService] Error creating submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update submission
 * @param {string} submissionId - Submission ID
 * @param {Object} submissionData - Updated submission data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSubmission = async (submissionId, submissionData) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.SUBMISSIONS, submissionId), {
      ...submissionData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[SubmissionsDbService] Error updating submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteSubmission = async (submissionId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.SUBMISSIONS, submissionId));
    return { success: true };
  } catch (error) {
    logger.error('[SubmissionsDbService] Error deleting submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all submissions with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubmissions = async (filters = {}) => {
  try {
    const { 
      userId,
      activityId,
      classId,
      programId,
      subjectId,
      status,
      limitCount = 100,
      orderByField = 'createdAt',
      orderDirection = 'desc'
    } = filters;
    
    let conditions = [];
    
    if (userId) conditions.push(where('userId', '==', userId));
    if (activityId) conditions.push(where('activityId', '==', activityId));
    if (classId) conditions.push(where('classId', '==', classId));
    if (programId) conditions.push(where('programId', '==', programId));
    if (subjectId) conditions.push(where('subjectId', '==', subjectId));
    if (status) conditions.push(where('status', '==', status));
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.SUBMISSIONS),
      ...conditions,
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: submissions };
  } catch (error) {
    logger.error('[SubmissionsDbService] Error getting submissions:', error);
    return { success: false, error: error.message };
  }
};
