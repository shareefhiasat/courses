/**
 * Question Bank Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for question bank records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'questionBank'
 * 
 * @typedef {import('@types/index').Question} Question
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

const COLLECTION = 'questionBank';

/**
 * Get all questions
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuestions = async (options = {}) => {
  try {
    const { 
      limitCount = 100, 
      orderByField = 'createdAt', 
      orderDirection = 'desc',
      subjectId,
      difficulty,
      questionType
    } = options;
    
    let q = query(collection(db, COLLECTION));
    
    // Add filters
    if (subjectId) q = query(q, where('subjectId', '==', subjectId));
    if (difficulty) q = query(q, where('difficulty', '==', difficulty));
    if (questionType) q = query(q, where('questionType', '==', questionType));
    
    // Add ordering and limit
    q = query(q, orderBy(orderByField, orderDirection));
    if (limitCount) q = query(q, limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    const questions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: questions };
  } catch (error) {
    // Check if this is a missing collection error
    if (error.message.includes('Missing or insufficient permissions') || 
        error.code === 'permission-denied' ||
        error.message.includes('No document to update')) {
      logger.warn('[QuestionBankDbService] QuestionBank collection not available:', { error: error.message });
      return {
        success: true,
        data: []
      };
    }
    
    logger.error('[QuestionBankDbService] Error getting questions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get question by ID
 * @param {string} questionId - Question ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getQuestion = async (questionId) => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION, questionId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Question not found' };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error getting question:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create question
 * @param {Object} questionData - Question data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createQuestion = async (questionData) => {
  try {
    const docRef = doc(collection(db, COLLECTION));
    await setDoc(docRef, {
      ...questionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error creating question:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update question
 * @param {string} questionId - Question ID
 * @param {Object} questionData - Updated question data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateQuestion = async (questionId, questionData) => {
  try {
    await updateDoc(doc(db, COLLECTION, questionId), {
      ...questionData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error updating question:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete question
 * @param {string} questionId - Question ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuestion = async (questionId) => {
  try {
    await deleteDoc(doc(db, COLLECTION, questionId));
    return { success: true };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error deleting question:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get questions by subject
 * @param {string} subjectId - Subject ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuestionsBySubject = async (subjectId, options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, COLLECTION),
      where('subjectId', '==', subjectId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const questions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: questions };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error getting questions by subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get questions by difficulty
 * @param {string} difficulty - Difficulty level
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuestionsByDifficulty = async (difficulty, options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, COLLECTION),
      where('difficulty', '==', difficulty),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const questions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: questions };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error getting questions by difficulty:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get questions by type
 * @param {string} questionType - Question type
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuestionsByType = async (questionType, options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, COLLECTION),
      where('questionType', '==', questionType),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const questions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: questions };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error getting questions by type:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search questions
 * @param {string} searchTerm - Search term
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const searchQuestions = async (searchTerm, options = {}) => {
  try {
    // This would typically require a full-text search index
    // For now, get all questions and filter client-side
    const result = await getQuestions({ limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    const filteredQuestions = result.data.filter(question => 
      question.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return { success: true, data: filteredQuestions };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error searching questions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get questions by tags
 * @param {Array} tags - Array of tags
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuestionsByTags = async (tags, options = {}) => {
  try {
    // This would require array-contains-any query or multiple queries
    // For now, get all questions and filter client-side
    const result = await getQuestions({ limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    const filteredQuestions = result.data.filter(question => 
      question.tags && tags.some(tag => question.tags.includes(tag))
    );
    
    return { success: true, data: filteredQuestions };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error getting questions by tags:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get random questions
 * @param {number} count - Number of random questions
 * @param {Object} filters - Filters to apply
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getRandomQuestions = async (count = 10, filters = {}) => {
  try {
    // Get filtered questions first
    const result = await getQuestions({ ...filters, limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    // Randomly select questions
    const shuffled = result.data.sort(() => 0.5 - Math.random());
    const randomQuestions = shuffled.slice(0, count);
    
    return { success: true, data: randomQuestions };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error getting random questions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update question usage statistics
 * @param {string} questionId - Question ID
 * @param {Object} usageData - Usage data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateQuestionUsage = async (questionId, usageData) => {
  try {
    await updateDoc(doc(db, COLLECTION, questionId), {
      usage: usageData,
      lastUsedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[QuestionBankDbService] Error updating question usage:', error);
    return { success: false, error: error.message };
  }
};
