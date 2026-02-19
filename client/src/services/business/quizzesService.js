/**
 * Quizzes Business Service
 * 
 * PURPOSE:
 * Business logic layer for quiz operations. This service handles
 * business rules, validation, logging, and orchestrates db operations.
 * 
 * Uses the db service layer for all database operations.
 */

import { 
  getQuizzes as getQuizzesFromDb,
  getQuiz as getQuizFromDb,
  createQuiz as createQuizInDb,
  updateQuiz as updateQuizInDb,
  deleteQuiz as deleteQuizFromDb
} from '../db/quizzesDbService';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { notificationGateway } from './notificationGateway';
import logger from '@utils/logger';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

/**
 * Get all quizzes with filters - with performance monitoring and memoization
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizzes = withPerformanceMonitoring(
  memoize(async (filters = {}) => {
    try {
      const result = await getQuizzesFromDb(filters);
      if (result.success) {
        logger.log('[QuizzesService] Successfully fetched quizzes', { count: result.data.length });
      }
      return result;
    } catch (error) {
      logger.error('[QuizzesService] Error getting quizzes:', error);
      return { success: false, error: error.message };
    }
  }),
  'getQuizzes'
);

/**
 * Get single quiz by ID - with performance monitoring and memoization
 * @param {string} quizId - Quiz ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getQuiz = withPerformanceMonitoring(
  memoize(async (quizId) => {
    try {
      const result = await getQuizFromDb(quizId);
      if (result.success) {
        logger.log('[QuizzesService] Successfully fetched quiz', { quizId });
      }
      return result;
    } catch (error) {
      logger.error('[QuizzesService] Error getting quiz:', error);
      return { success: false, error: error.message };
    }
  }),
  'getQuiz'
);

/**
 * Create new quiz
 * @param {Object} quizData - Quiz data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createQuiz = async (quizData) => {
  try {
    const result = await createQuizInDb(quizData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.QUIZ_CREATED, {
          quizId: result.id,
          title: quizData.title,
          classId: quizData.classId
        });
      } catch (logError) {
        logger.warn('Failed to log quiz creation:', logError);
      }

      // Send notifications
      try {
        await notificationGateway.triggerQuizCreation(quizData);
      } catch (notificationError) {
        logger.warn('Failed to send quiz creation notifications:', notificationError);
      }

      logger.log('[QuizzesService] Successfully created quiz', { quizId: result.id });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizzesService] Error creating quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update quiz
 * @param {string} quizId - Quiz ID
 * @param {Object} quizData - Updated quiz data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateQuiz = async (quizId, quizData) => {
  try {
    const result = await updateQuizInDb(quizId, quizData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.QUIZ_UPDATED, {
          quizId,
          title: quizData.title,
          classId: quizData.classId
        });
      } catch (logError) {
        logger.warn('Failed to log quiz update:', logError);
      }

      logger.log('[QuizzesService] Successfully updated quiz', { quizId });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizzesService] Error updating quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz
 * @param {string} quizId - Quiz ID
 * @param {Object} quizData - Quiz data for logging (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuiz = async (quizId, quizData = null) => {
  try {
    const result = await deleteQuizFromDb(quizId);
    
    if (result.success) {
      // Log activity
      if (quizData) {
        try {
          await logActivity(ACTIVITY_LOG_TYPES.QUIZ_DELETED, {
            quizId,
            title: quizData.title,
            classId: quizData.classId
          });
        } catch (logError) {
          logger.warn('Failed to log quiz deletion:', logError);
        }
      }

      logger.log('[QuizzesService] Successfully deleted quiz', { quizId });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizzesService] Error deleting quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all quizzes (alias for compatibility)
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAllQuizzes = async () => {
  return getQuizzes();
};
