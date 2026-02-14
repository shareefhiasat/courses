/**
 * Submissions Business Service
 * 
 * PURPOSE:
 * Business logic layer for submission operations. This service handles
 * business rules, validation, logging, and orchestrates db operations.
 * 
 * Uses the db service layer for all database operations.
 */

import { 
  getSubmissions as getSubmissionsFromDb,
  getSubmissionsByUser as getSubmissionsByUserFromDb,
  getSubmissionsByActivity as getSubmissionsByActivityFromDb,
  getSubmission as getSubmissionFromDb,
  createSubmission as createSubmissionInDb,
  updateSubmission as updateSubmissionInDb,
  deleteSubmission as deleteSubmissionFromDb
} from '../db/submissionsDbService';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { notificationGateway } from './notificationGateway';
import logger from '@utils/logger';

/**
 * Get all submissions with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubmissions = async (filters = {}) => {
  try {
    const result = await getSubmissionsFromDb(filters);
    if (result.success) {
      logger.log('[SubmissionsService] Successfully fetched submissions', { count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[SubmissionsService] Error getting submissions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get submissions by user ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubmissionsByUser = async (userId, options = {}) => {
  try {
    const result = await getSubmissionsByUserFromDb(userId, options);
    if (result.success) {
      logger.log('[SubmissionsService] Successfully fetched submissions for user', { userId, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[SubmissionsService] Error getting submissions by user:', error);
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
    const result = await getSubmissionsByActivityFromDb(activityId, options);
    if (result.success) {
      logger.log('[SubmissionsService] Successfully fetched submissions for activity', { activityId, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[SubmissionsService] Error getting submissions by activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get single submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getSubmission = async (submissionId) => {
  try {
    const result = await getSubmissionFromDb(submissionId);
    if (result.success) {
      logger.log('[SubmissionsService] Successfully fetched submission', { submissionId });
    }
    return result;
  } catch (error) {
    logger.error('[SubmissionsService] Error getting submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new submission
 * @param {Object} submissionData - Submission data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createSubmission = async (submissionData) => {
  try {
    const result = await createSubmissionInDb(submissionData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ASSIGNMENT_SUBMITTED, {
          submissionId: result.id,
          activityId: submissionData.activityId,
          userId: submissionData.userId,
          title: submissionData.title
        });
      } catch (logError) {
        logger.warn('Failed to log submission creation:', logError);
      }

      // Send notifications
      try {
        await notificationGateway.triggerSubmission(submissionData);
      } catch (notificationError) {
        logger.warn('Failed to send submission notifications:', notificationError);
      }

      logger.log('[SubmissionsService] Successfully created submission', { submissionId: result.id });
    }
    
    return result;
  } catch (error) {
    logger.error('[SubmissionsService] Error creating submission:', error);
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
    const result = await updateSubmissionInDb(submissionId, submissionData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ASSIGNMENT_GRADED, {
          submissionId,
          activityId: submissionData.activityId,
          userId: submissionData.userId,
          grade: submissionData.grade
        });
      } catch (logError) {
        logger.warn('Failed to log submission update:', logError);
      }

      // Send notifications if graded
      if (submissionData.grade !== undefined) {
        try {
          await notificationGateway.triggerGrading(submissionData);
        } catch (notificationError) {
          logger.warn('Failed to send grading notifications:', notificationError);
        }
      }

      logger.log('[SubmissionsService] Successfully updated submission', { submissionId });
    }
    
    return result;
  } catch (error) {
    logger.error('[SubmissionsService] Error updating submission:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete submission
 * @param {string} submissionId - Submission ID
 * @param {Object} submissionData - Submission data for logging (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteSubmission = async (submissionId, submissionData = null) => {
  try {
    const result = await deleteSubmissionFromDb(submissionId);
    
    if (result.success) {
      // Log activity
      if (submissionData) {
        try {
          await logActivity(ACTIVITY_LOG_TYPES.ASSIGNMENT_DELETED, {
            submissionId,
            activityId: submissionData.activityId,
            userId: submissionData.userId,
            title: submissionData.title
          });
        } catch (logError) {
          logger.warn('Failed to log submission deletion:', logError);
        }
      }

      logger.log('[SubmissionsService] Successfully deleted submission', { submissionId });
    }
    
    return result;
  } catch (error) {
    logger.error('[SubmissionsService] Error deleting submission:', error);
    return { success: false, error: error.message };
  }
};
