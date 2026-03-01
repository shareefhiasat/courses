/**
 * Activities Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for activity records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: RECORD_TYPES.ACTIVITY
 * 
 * @typedef {import('@types/index').Activity} Activity
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import dbService from '@services/other/dbService';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get activities by class ID - with performance monitoring and memoization
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivitiesByClass = async (classId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(RECORD_TYPES.ACTIVITY, {
      where: {
        field: 'classId',
        operator: '==',
        value: classId
      },
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ActivitiesDbService] Error getting activities by class:', error);
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
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    // Firestore 'in' query supports up to 10 values
    const limitedClassIds = classIds.slice(0, 10);
    
    const result = await dbService.getAll(RECORD_TYPES.ACTIVITY, {
      where: {
        field: 'classId',
        operator: 'in',
        value: limitedClassIds
      },
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ActivitiesDbService] Error getting activities by classes:', error);
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
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(RECORD_TYPES.ACTIVITY, {
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
    
    return result;
  } catch (error) {
    logger.error('[ActivitiesDbService] Error getting activities by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get activity by ID - with performance monitoring and memoization
 * @param {string} activityId - Activity ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getActivity = async (activityId) => {
  try {
    const result = await dbService.getById(RECORD_TYPES.ACTIVITY, activityId);
    return result;
  } catch (error) {
    logger.error('[ActivitiesDbService] Error getting activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create activity
 * @param {Object} activityData - Activity data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createActivity = async (activityData, user = null) => {
  try {
    logger.debug('[ActivitiesDbService] Creating activity with data:', JSON.stringify(activityData, null, 2));
    
    const docData = {
      ...activityData,
      ...getCreateAuditData(user || { uid: 'system' })
    };
    
    logger.debug('[ActivitiesDbService] Writing document data:', JSON.stringify(docData, null, 2));
    
    const result = await dbService.add(RECORD_TYPES.ACTIVITY, docData);
    
    logger.info('[ActivitiesDbService] Activity created successfully with ID:', result.id);
    return result;
  } catch (error) {
    logger.error('[ActivitiesDbService] Error creating activity:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      activityData: JSON.stringify(activityData, null, 2)
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update activity
 * @param {string} activityId - Activity ID
 * @param {Object} activityData - Updated activity data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateActivity = async (activityId, activityData, user = null) => {
  try {
    const result = await dbService.update(RECORD_TYPES.ACTIVITY, activityId, {
      ...activityData,
      ...getUpdateAuditData(user || { uid: 'system' })
    });
    return result;
  } catch (error) {
    logger.error('[ActivitiesDbService] Error updating activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete activity
 * @param {string} activityId - Activity ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteActivity = async (activityId) => {
  try {
    const result = await dbService.delete(RECORD_TYPES.ACTIVITY, activityId);
    return result;
  } catch (error) {
    logger.error('[ActivitiesDbService] Error deleting activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all activities with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivities = async (filters = {}) => {
  try {
    const { 
      userId,
      classId,
      programId,
      subjectId,
      type,
      status,
      limitCount = 100,
      orderByField = 'createdAt',
      orderDirection = 'desc'
    } = filters;
    
    // Since dbService only supports one where clause, we need to get all and filter client-side
    const result = await dbService.getAll(RECORD_TYPES.ACTIVITY, {
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    if (!result.success) {
      return result;
    }
    
    // Apply filters client-side
    let filteredActivities = result.data;
    
    if (userId) {
      filteredActivities = filteredActivities.filter(activity => activity.userId === userId);
    }
    if (classId) {
      filteredActivities = filteredActivities.filter(activity => activity.classId === classId);
    }
    if (programId) {
      filteredActivities = filteredActivities.filter(activity => activity.programId === programId);
    }
    if (subjectId) {
      filteredActivities = filteredActivities.filter(activity => activity.subjectId === subjectId);
    }
    if (type) {
      filteredActivities = filteredActivities.filter(activity => activity.type === type);
    }
    if (status) {
      filteredActivities = filteredActivities.filter(activity => activity.status === status);
    }
    
    return { success: true, data: filteredActivities };
  } catch (error) {
    logger.error('[ActivitiesDbService] Error getting activities:', error);
    return { success: false, error: error.message };
  }
};
