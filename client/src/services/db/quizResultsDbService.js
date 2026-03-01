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
  serverTimestamp,
  writeBatch,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get quiz results by user ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizResultsByUser = async (userId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(COLLECTIONS.QUIZ_RESULTS, {
      where: {
        field: 'userId',
        operator: '==',
        value: userId
      },
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    // Handle missing collection gracefully
    if (!result.success && result.error && 
        (result.error.includes('Missing or insufficient permissions') || 
         result.error.includes('permission-denied') ||
         result.error.includes('No document to update'))) {
      logger.warn('[QuizResultsDbService] QuizResults collection not available:', { error: result.error });
      return {
        success: true,
        data: []
      };
    }
    
    return result;
  } catch (error) {
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
      collection(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS),
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
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS, resultId));
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
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS));
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
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS, resultId), {
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
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS, resultId));
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
    const batch = writeBatch(dbService.getDb());
    
    updates.forEach(({ id, data }) => {
      const docRef = doc(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS, id);
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
      collection(dbService.getDb(), COLLECTIONS.QUIZ_RESULTS),
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
