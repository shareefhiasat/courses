/**
 * Quiz Results Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for quiz result records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'quizResults'
 * 
 * @typedef {import('@types/index').QuizResult} QuizResult
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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get quiz results by user ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizResultsByUser = async (userId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'quizResults'),
      where('userId', '==', userId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const quizResults = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: quizResults };
  } catch (error) {
    // Check if this is a missing collection error
    if (error.message.includes('Missing or insufficient permissions') || 
        error.code === 'permission-denied' ||
        error.message.includes('No document to update')) {
      logger.warn('[QuizResultsDbService] QuizResults collection not available:', { error: error.message });
      return {
        success: true,
        data: []
      };
    }
    
    logger.error('[QuizResultsDbService] Error getting quiz results by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz results by quiz ID
 * @param {string} quizId - Quiz ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizResultsByQuiz = async (quizId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'quizResults'),
      where('quizId', '==', quizId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const quizResults = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: quizResults };
  } catch (error) {
    logger.error('[QuizResultsDbService] Error getting quiz results by quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz result by ID
 * @param {string} resultId - Quiz result ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getQuizResult = async (resultId) => {
  try {
    const docSnap = await getDoc(doc(db, 'quizResults', resultId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Quiz result not found' };
  } catch (error) {
    logger.error('[QuizResultsDbService] Error getting quiz result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create quiz result
 * @param {Object} quizResultData - Quiz result data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createQuizResult = async (quizResultData) => {
  try {
    const docRef = doc(collection(db, 'quizResults'));
    await setDoc(docRef, {
      ...quizResultData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[QuizResultsDbService] Error creating quiz result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update quiz result
 * @param {string} resultId - Quiz result ID
 * @param {Object} quizResultData - Updated quiz result data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateQuizResult = async (resultId, quizResultData) => {
  try {
    await updateDoc(doc(db, 'quizResults', resultId), {
      ...quizResultData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[QuizResultsDbService] Error updating quiz result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz result
 * @param {string} resultId - Quiz result ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuizResult = async (resultId) => {
  try {
    await deleteDoc(doc(db, 'quizResults', resultId));
    return { success: true };
  } catch (error) {
    logger.error('[QuizResultsDbService] Error deleting quiz result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Batch update quiz results
 * @param {Array} updates - Array of { id, data } objects
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const batchUpdateQuizResults = async (updates) => {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, data }) => {
      const docRef = doc(db, 'quizResults', id);
      batch.update(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    logger.error('[QuizResultsDbService] Error batch updating quiz results:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all quiz results with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizResults = async (filters = {}) => {
  try {
    const { 
      userId, 
      quizId, 
      classId, 
      programId, 
      subjectId,
      limitCount = 100,
      orderByField = 'createdAt',
      orderDirection = 'desc'
    } = filters;
    
    let conditions = [];
    
    if (userId) conditions.push(where('userId', '==', userId));
    if (quizId) conditions.push(where('quizId', '==', quizId));
    if (classId) conditions.push(where('classId', '==', classId));
    if (programId) conditions.push(where('programId', '==', programId));
    if (subjectId) conditions.push(where('subjectId', '==', subjectId));
    
    const q = query(
      collection(db, 'quizResults'),
      ...conditions,
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const quizResults = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: quizResults };
  } catch (error) {
    logger.error('[QuizResultsDbService] Error getting quiz results:', error);
    return { success: false, error: error.message };
  }
};
