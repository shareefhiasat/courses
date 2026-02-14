/**
 * Quiz Submissions Business Service
 * 
 * PURPOSE:
 * Business logic layer for quiz submission operations. This service handles
 * business rules, validation, logging, and orchestrates db operations.
 * 
 * Uses the db service layer for all database operations.
 */

import { 
  getQuizSubmissions as getQuizSubmissionsFromDb,
  getQuizSubmissionsByQuiz as getQuizSubmissionsByQuizFromDb,
  getQuizSubmissionsByUser as getQuizSubmissionsByUserFromDb,
  getQuizSubmission as getQuizSubmissionFromDb,
  createQuizSubmission as createQuizSubmissionInDb,
  updateQuizSubmission as updateQuizSubmissionInDb,
  deleteQuizSubmission as deleteQuizSubmissionFromDb
} from '../db/quizSubmissionsDbService';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { notificationGateway } from './notificationGateway';
import logger from '@utils/logger';

/**
 * Get all quiz submissions with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizSubmissions = async (filters = {}) => {
  try {
    const result = await getQuizSubmissionsFromDb(filters);
    if (result.success) {
      logger.log('[QuizSubmissionsService] Successfully fetched quiz submissions', { count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[QuizSubmissionsService] Error getting quiz submissions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz submissions by quiz ID
 * @param {string} quizId - Quiz ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getQuizSubmissionsByQuiz = async (quizId, options = {}) => {
  try {
    const result = await getQuizSubmissionsByQuizFromDb(quizId, options);
    if (result.success) {
      logger.log('[QuizSubmissionsService] Successfully fetched quiz submissions for quiz', { quizId, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[QuizSubmissionsService] Error getting quiz submissions by quiz:', error);
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
    const result = await getQuizSubmissionsByUserFromDb(userId, options);
    if (result.success) {
      logger.log('[QuizSubmissionsService] Successfully fetched quiz submissions for user', { userId, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[QuizSubmissionsService] Error getting quiz submissions by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get single quiz submission by ID
 * @param {string} submissionId - Quiz submission ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getQuizSubmission = async (submissionId) => {
  try {
    const result = await getQuizSubmissionFromDb(submissionId);
    if (result.success) {
      logger.log('[QuizSubmissionsService] Successfully fetched quiz submission', { submissionId });
    }
    return result;
  } catch (error) {
    logger.error('[QuizSubmissionsService] Error getting quiz submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new quiz submission
 * @param {Object} submissionData - Quiz submission data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createQuizSubmission = async (submissionData) => {
  try {
    const result = await createQuizSubmissionInDb(submissionData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.QUIZ_SUBMITTED, {
          submissionId: result.id,
          quizId: submissionData.quizId,
          userId: submissionData.userId
        });
      } catch (logError) {
        logger.warn('Failed to log quiz submission creation:', logError);
      }

      // Send notifications
      try {
        await notificationGateway.triggerQuizSubmission(submissionData);
      } catch (notificationError) {
        logger.warn('Failed to send quiz submission notifications:', notificationError);
      }

      logger.log('[QuizSubmissionsService] Successfully created quiz submission', { submissionId: result.id });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizSubmissionsService] Error creating quiz submission:', error);
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
    const result = await updateQuizSubmissionInDb(submissionId, submissionData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.QUIZ_GRADED, {
          submissionId,
          quizId: submissionData.quizId,
          userId: submissionData.userId,
          score: submissionData.score
        });
      } catch (logError) {
        logger.warn('Failed to log quiz submission update:', logError);
      }

      // Send notifications if graded
      if (submissionData.score !== undefined) {
        try {
          await notificationGateway.triggerQuizGraded(submissionData);
        } catch (notificationError) {
          logger.warn('Failed to send quiz grading notifications:', notificationError);
        }
      }

      logger.log('[QuizSubmissionsService] Successfully updated quiz submission', { submissionId });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizSubmissionsService] Error updating quiz submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete quiz submission
 * @param {string} submissionId - Quiz submission ID
 * @param {Object} submissionData - Quiz submission data for logging (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteQuizSubmission = async (submissionId, submissionData = null) => {
  try {
    const result = await deleteQuizSubmissionFromDb(submissionId);
    
    if (result.success) {
      // Log activity
      if (submissionData) {
        try {
          await logActivity(ACTIVITY_LOG_TYPES.QUIZ_DELETED, {
            submissionId,
            quizId: submissionData.quizId,
            userId: submissionData.userId
          });
        } catch (logError) {
          logger.warn('Failed to log quiz submission deletion:', logError);
        }
      }

      logger.log('[QuizSubmissionsService] Successfully deleted quiz submission', { submissionId });
    }
    
    return result;
  } catch (error) {
    logger.error('[QuizSubmissionsService] Error deleting quiz submission:', error);
    return { success: false, error: error.message };
  }
};
