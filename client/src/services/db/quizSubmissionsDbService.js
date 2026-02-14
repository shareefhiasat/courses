/**
 * Quiz Submissions Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for quiz submission records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'quizSubmissions'
 * 
 * @typedef {import('@types/index').QuizSubmission} QuizSubmission
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
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get quiz submissions by quiz ID
 * @param {string} quizId - Quiz ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizSubmissionsByQuiz = async (quizId, options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'submittedAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'quizSubmissions'),
      where('quizId', '==', quizId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: submissions };
  } catch (error) {
    logger.error('[QuizSubmissionsDbService] Error getting quiz submissions by quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz submissions by user ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizSubmissionsByUser = async (userId, options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'submittedAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'quizSubmissions'),
      where('userId', '==', userId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: submissions };
  } catch (error) {
    logger.error('[QuizSubmissionsDbService] Error getting quiz submissions by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all quiz submissions with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizSubmissions = async (filters = {}) => {
  try {
    const { 
      quizId,
      userId,
      classId,
      limitCount = 100,
      orderByField = 'submittedAt',
      orderDirection = 'desc'
    } = filters;
    
    let conditions = [];
    
    if (quizId) conditions.push(where('quizId', '==', quizId));
    if (userId) conditions.push(where('userId', '==', userId));
    if (classId) conditions.push(where('classId', '==', classId));
    
    const q = query(
      collection(db, 'quizSubmissions'),
      ...conditions,
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: submissions };
  } catch (error) {
    logger.error('[QuizSubmissionsDbService] Error getting quiz submissions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz submission by ID
 * @param {string} submissionId - Quiz submission ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getQuizSubmission = async (submissionId) => {
  try {
    const docSnap = await getDoc(doc(db, 'quizSubmissions', submissionId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Quiz submission not found' };
  } catch (error) {
    logger.error('[QuizSubmissionsDbService] Error getting quiz submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create quiz submission
 * @param {Object} submissionData - Quiz submission data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createQuizSubmission = async (submissionData) => {
  try {
    const docRef = doc(collection(db, 'quizSubmissions'));
    await setDoc(docRef, {
      ...submissionData,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[QuizSubmissionsDbService] Error creating quiz submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update quiz submission
 * @param {string} submissionId - Quiz submission ID
 * @param {Object} submissionData - Updated quiz submission data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateQuizSubmission = async (submissionId, submissionData) => {
  try {
    await updateDoc(doc(db, 'quizSubmissions', submissionId), {
      ...submissionData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[QuizSubmissionsDbService] Error updating quiz submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz submission
 * @param {string} submissionId - Quiz submission ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuizSubmission = async (submissionId) => {
  try {
    await deleteDoc(doc(db, 'quizSubmissions', submissionId));
    return { success: true };
  } catch (error) {
    logger.error('[QuizSubmissionsDbService] Error deleting quiz submission:', error);
    return { success: false, error: error.message };
  }
};
