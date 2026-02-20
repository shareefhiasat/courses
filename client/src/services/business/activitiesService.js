/**
 * Activities Business Service
 * 
 * PURPOSE:
 * Business logic layer for activity operations. This service handles
 * business rules, validation, logging, and orchestrates db operations.
 * 
 * Uses the db service layer for all database operations.
 */

import { 
  getActivities as getActivitiesFromDb,
  getActivitiesByClass as getActivitiesByClassFromDb,
  getActivitiesByClasses as getActivitiesByClassesFromDb,
  getActivitiesByUser as getActivitiesByUserFromDb,
  getActivity as getActivityFromDb,
  createActivity as createActivityInDb,
  updateActivity as updateActivityInDb,
  deleteActivity as deleteActivityFromDb
} from '../db/activitiesDbService';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { notificationGateway } from './notificationGateway';
import logger from '@utils/logger';

/**
 * Get all activities with filters - with performance monitoring and memoization
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivities = async (filters = {}) => {
  try {
    const result = await getActivitiesFromDb(filters);
    if (result.success) {
      logger.log('[ActivitiesService] Successfully fetched activities', { count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[ActivitiesService] Error getting activities:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activities by class ID - with performance monitoring and memoization
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivitiesByClass = async (classId, options = {}) => {
  try {
    const result = await getActivitiesByClassFromDb(classId, options);
    if (result.success) {
      logger.log('[ActivitiesService] Successfully fetched activities for class', { classId, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[ActivitiesService] Error getting activities by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activities by multiple class IDs - with performance monitoring and memoization
 * @param {Array} classIds - Array of class IDs
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivitiesByClasses = async (classIds, options = {}) => {
  try {
    const result = await getActivitiesByClassesFromDb(classIds, options);
    if (result.success) {
      logger.log('[ActivitiesService] Successfully fetched activities for classes', { classIds: classIds.length, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[ActivitiesService] Error getting activities by classes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activities by user ID - with performance monitoring and memoization
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivitiesByUser = async (userId, options = {}) => {
  try {
    const result = await getActivitiesByUserFromDb(userId, options);
    if (result.success) {
      logger.log('[ActivitiesService] Successfully fetched activities for user', { userId, count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('[ActivitiesService] Error getting activities by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get single activity by ID - with performance monitoring and memoization
 * @param {string} activityId - Activity ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getActivity = async (activityId) => {
  try {
    const result = await getActivityFromDb(activityId);
    if (result.success) {
      logger.log('[ActivitiesService] Successfully fetched activity', { activityId });
    }
    return result;
  } catch (error) {
    logger.error('[ActivitiesService] Error getting activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create new activity
 * @param {Object} activityData - Activity data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createActivity = async (activityData) => {
  try {
    const result = await createActivityInDb(activityData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ACTIVITY_CREATED, {
          activityId: result.id,
          activityType: activityData.type,
          classId: activityData.classId,
          title: activityData.title
        });
      } catch (logError) {
        logger.warn('Failed to log activity creation:', logError);
      }

      // Send notifications
      try {
        await notificationGateway.triggerActivityCreation(activityData);
      } catch (notificationError) {
        logger.warn('Failed to send activity creation notifications:', notificationError);
      }

      logger.log('[ActivitiesService] Successfully created activity', { activityId: result.id });
    }
    
    return result;
  } catch (error) {
    logger.error('[ActivitiesService] Error creating activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update activity
 * @param {string} activityId - Activity ID
 * @param {Object} activityData - Updated activity data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateActivity = async (activityId, activityData) => {
  try {
    const result = await updateActivityInDb(activityId, activityData);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ACTIVITY_UPDATED, {
          activityId,
          activityType: activityData.type,
          classId: activityData.classId,
          title: activityData.title
        });
      } catch (logError) {
        logger.warn('Failed to log activity update:', logError);
      }

      logger.log('[ActivitiesService] Successfully updated activity', { activityId });
    }
    
    return result;
  } catch (error) {
    logger.error('[ActivitiesService] Error updating activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete activity
 * @param {string} activityId - Activity ID
 * @param {Object} activityData - Activity data for logging (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteActivity = async (activityId, activityData = null) => {
  try {
    const result = await deleteActivityFromDb(activityId);
    
    if (result.success) {
      // Log activity
      if (activityData) {
        try {
          await logActivity(ACTIVITY_LOG_TYPES.ACTIVITY_DELETED, {
            activityId,
            activityType: activityData.type,
            classId: activityData.classId,
            title: activityData.title
          });
        } catch (logError) {
          logger.warn('Failed to log activity deletion:', logError);
        }
      }

      logger.log('[ActivitiesService] Successfully deleted activity', { activityId });
    }
    
    return result;
  } catch (error) {
    logger.error('[ActivitiesService] Error deleting activity:', error);
    return { success: false, error: error.message };
  }
};
