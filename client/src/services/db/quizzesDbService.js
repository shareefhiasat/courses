/**
 * Quizzes Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for quiz records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'quizzes'
 * 
 * @typedef {import('@types/index').Quiz} Quiz
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
 * Get all quizzes with filters - with performance monitoring and memoization
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizzes = async (filters = {}) => {
  try {
    const { 
      classId,
      programId, 
      subjectId,
      limitCount = 100,
      orderByField = 'createdAt',
      orderDirection = 'desc'
    } = filters;
    
    let conditions = [];
    
    if (classId) conditions.push(where('classId', '==', classId));
    if (programId) conditions.push(where('programId', '==', programId));
    if (subjectId) conditions.push(where('subjectId', '==', subjectId));
    
    const q = query(
      collection(db, 'quizzes'),
      ...conditions,
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const quizzes = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: quizzes };
  } catch (error) {
    logger.error('[QuizzesDbService] Error getting quizzes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz by ID - with performance monitoring and memoization
 * @param {string} quizId - Quiz ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getQuiz = async (quizId) => {
  try {
    const docSnap = await getDoc(doc(db, 'quizzes', quizId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Quiz not found' };
  } catch (error) {
    logger.error('[QuizzesDbService] Error getting quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create quiz
 * @param {Object} quizData - Quiz data
 * @param {Object} auditData - Audit data (createdAt, updatedAt, createdBy, updatedBy)
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const create = async (quizData, auditData = {}) => {
  try {
    const docRef = doc(collection(db, 'quizzes'));
    await setDoc(docRef, {
      ...quizData,
      ...auditData
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[QuizzesDbService] Error creating quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update quiz
 * @param {string} quizId - Quiz ID
 * @param {Object} quizData - Updated quiz data
 * @param {Object} auditData - Audit data (updatedAt, updatedBy)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const update = async (quizId, quizData, auditData = {}) => {
  try {
    await updateDoc(doc(db, 'quizzes', quizId), {
      ...quizData,
      ...auditData
    });
    return { success: true };
  } catch (error) {
    logger.error('[QuizzesDbService] Error updating quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz
 * @param {string} quizId - Quiz ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuiz = async (quizId) => {
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
    return { success: true };
  } catch (error) {
    logger.error('[QuizzesDbService] Error deleting quiz:', error);
    return { success: false, error: error.message };
  }
};
