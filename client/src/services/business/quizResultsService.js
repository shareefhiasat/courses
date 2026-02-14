/**
 * Quiz Results Business Service
 * 
 * PURPOSE:
 * Business logic layer for quiz results operations. This service handles
 * business rules, validation, logging, and orchestrates db operations.
 * 
 * Uses the db service layer for all database operations.
 */

import { 
  getQuizResults as getQuizResultsFromDb,
  getQuizResultsByUser as getQuizResultsByUserFromDb,
  getQuizResultsByQuiz as getQuizResultsByQuizFromDb,
  getQuizResult as getQuizResultFromDb,
  createQuizResult as createQuizResultInDb,
  updateQuizResult as updateQuizResultInDb,
  deleteQuizResult as deleteQuizResultFromDb,
  batchUpdateQuizResults as batchUpdateQuizResultsInDb
} from '../db/quizResultsDbService';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { notificationGateway } from './notificationGateway';
import logger from '@utils/logger';

/**
 * Get all quiz results with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizResults = async (filters = {}) => {
  try {
    const result = await getQuizResultsFromDb(filters);
    if (result.success) {
      logger.log('[QuizResultsService] Successfully fetched quiz results', { count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[QuizResultsService] Error getting quiz results:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz results by user ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizResultsByUser = async (userId, options = {}) => {
  try {
    const result = await getQuizResultsByUserFromDb(userId, options);
    if (result.success) {
      logger.log('[QuizResultsService] Successfully fetched quiz results for user', { userId, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[QuizResultsService] Error getting quiz results by user:', error);
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
    const result = await getQuizResultsByQuizFromDb(quizId, options);
    if (result.success) {
      logger.log('[QuizResultsService] Successfully fetched quiz results for quiz', { quizId, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[QuizResultsService] Error getting quiz results by quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get single quiz result by ID
 * @param {string} resultId - Quiz result ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getQuizResult = async (resultId) => {
  try {
    const result = await getQuizResultFromDb(resultId);
    if (result.success) {
      logger.log('[QuizResultsService] Successfully fetched quiz result', { resultId });
    }
    return result;
  } catch (error) {
    logger.error('[QuizResultsService] Error getting quiz result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new quiz result
 * @param {Object} quizResultData - Quiz result data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createQuizResult = async (quizResultData) => {
  try {
    const result = await createQuizResultInDb(quizResultData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.QUIZ_SUBMITTED, {
          quizResultId: result.id,
          quizId: quizResultData.quizId,
          userId: quizResultData.userId,
          score: quizResultData.score
        });
      } catch (logError) {
        logger.warn('Failed to log quiz result creation:', logError);
      }

      // Send notifications if needed
      try {
        await notificationGateway.triggerQuizSubmission(quizResultData);
      } catch (notificationError) {
        logger.warn('Failed to send quiz submission notifications:', notificationError);
      }

      logger.log('[QuizResultsService] Successfully created quiz result', { resultId: result.id });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizResultsService] Error creating quiz result:', error);
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
    const result = await updateQuizResultInDb(resultId, quizResultData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.QUIZ_GRADED, {
          quizResultId: resultId,
          quizId: quizResultData.quizId,
          userId: quizResultData.userId,
          score: quizResultData.score
        });
      } catch (logError) {
        logger.warn('Failed to log quiz result update:', logError);
      }

      // Send notifications if grade was updated
      if (quizResultData.score !== undefined) {
        try {
          await notificationGateway.triggerQuizGraded(quizResultData);
        } catch (notificationError) {
          logger.warn('Failed to send quiz graded notifications:', notificationError);
        }
      }

      logger.log('[QuizResultsService] Successfully updated quiz result', { resultId });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizResultsService] Error updating quiz result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz result
 * @param {string} resultId - Quiz result ID
 * @param {Object} quizResultData - Quiz result data for logging (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuizResult = async (resultId, quizResultData = null) => {
  try {
    const result = await deleteQuizResultFromDb(resultId);
    
    if (result.success) {
      // Log activity
      if (quizResultData) {
        try {
          await logActivity(ACTIVITY_LOG_TYPES.QUIZ_DELETED, {
            quizResultId: resultId,
            quizId: quizResultData.quizId,
            userId: quizResultData.userId
          });
        } catch (logError) {
          logger.warn('Failed to log quiz result deletion:', logError);
        }
      }

      logger.log('[QuizResultsService] Successfully deleted quiz result', { resultId });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizResultsService] Error deleting quiz result:', error);
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
    const result = await batchUpdateQuizResultsInDb(updates);
    
    if (result.success) {
      // Log activity for batch update
      try {
        await logActivity(ACTIVITY_LOG_TYPES.BATCH_UPDATE, {
          entityType: 'quizResults',
          count: updates.length
        });
      } catch (logError) {
        logger.warn('Failed to log batch quiz results update:', logError);
      }

      logger.log('[QuizResultsService] Successfully batch updated quiz results', { count: updates.length });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizResultsService] Error batch updating quiz results:', error);
    return { success: false, error: error.message };
  }
};
