/**
 * Activities Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for activity operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getActivities, 
  getActivityById as getActivityByIdFromDb, 
  createActivity as createActivityInDb, 
  updateActivity as updateActivityInDb, 
  deleteActivity as deleteActivityInDb,
  getActivitiesByClass as getActivitiesByClassFromDb
} from '../db/activities-postgres.js';
import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';

/**
 * Get all activities with business logic
 * 
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllActivities = async (params = {}, user = null) => {
  try {
    // Add business logic here (authorization, validation, etc.)
    const result = await getActivities(params);
    
    return result;
    
  } catch (error) {
    console.error('Error in getAllActivities:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve activities',
      data: []
    };
  }
};

/**
 * Get activity by ID with business logic
 * 
 * @param {number|string} activityId - Activity ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getActivityById = async (activityId, user = null) => {
  try {
    if (!activityId) {
      return {
        success: false,
        error: 'Activity ID is required',
        data: null
      };
    }
    
    const result = await getActivityByIdFromDb(activityId);
    return result;
  } catch (error) {
    console.error('Error in getActivityById:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve activity',
      data: null
    };
  }
};

/**
 * Create new activity with business logic
 * 
 * @param {Object} activityData - Activity data
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createActivity = async (activityData, user = null) => {
  try {
    // Business validation
    if (!activityData.titleEn) {
      return {
        success: false,
        error: 'Activity title (English) is required',
        data: null
      };
    }
    
    if (!activityData.typeId) {
      return {
        success: false,
        error: 'Activity type is required',
        data: null
      };
    }
    
    if (!activityData.classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    // Validate due date if provided
    if (activityData.dueDate && new Date(activityData.dueDate) <= new Date()) {
      return {
        success: false,
        error: 'Due date must be in the future',
        data: null
      };
    }
    
    // Validate max score if provided
    if (activityData.maxScore !== undefined && (activityData.maxScore < 0 || activityData.maxScore > 100)) {
      return {
        success: false,
        error: 'Max score must be between 0 and 100',
        data: null
      };
    }
    
    // Validate weight if provided
    if (activityData.weight !== undefined && (activityData.weight < 0 || activityData.weight > 10)) {
      return {
        success: false,
        error: 'Weight must be between 0 and 10',
        data: null
      };
    }
    
    const result = await createActivityInDb(activityData, user);
    
    // Emit notification for activity creation if toggle is on
    if (result.success && result.data && activityData.sendNotification !== false) {
      try {
        const activity = result.data;
        
        // Get students in the class
        const classId = activity.classId;
        if (classId) {
          // Get all students enrolled in this class
const prisma = (await import('../db/prismaClient.js')).default;
          
          const enrollments = await prisma.enrollment.findMany({
            where: { classId: parseInt(classId) },
            select: { userId: true }
          });
          
          const studentIds = enrollments.map(e => e.userId);
          
          if (studentIds.length > 0) {
            await notificationGateway.emit(
              EVENTS.ACTIVITY_ASSIGNED,
              {
                activityName: activity.titleEn || activity.titleAr,
                dueDate: activity.dueDate
              },
              user,
              { userIds: studentIds }
            );
          }
        }
      } catch (notifError) {
        console.error('Failed to emit activity creation notification:', notifError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in createActivity:', error);
    return {
      success: false,
      error: error.message || 'Failed to create activity',
      data: null
    };
  }
};

/**
 * Update activity with business logic
 * 
 * @param {number|string} activityId - Activity ID
 * @param {Object} updateData - Activity data to update
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateActivity = async (activityId, updateData, user = null) => {
  try {
    if (!activityId) {
      return {
        success: false,
        error: 'Activity ID is required',
        data: null
      };
    }
    
    // Business validation for updates
    if (updateData.dueDate && new Date(updateData.dueDate) <= new Date()) {
      return {
        success: false,
        error: 'Due date must be in the future',
        data: null
      };
    }
    
    if (updateData.maxScore !== undefined && (updateData.maxScore < 0 || updateData.maxScore > 100)) {
      return {
        success: false,
        error: 'Max score must be between 0 and 100',
        data: null
      };
    }
    
    if (updateData.weight !== undefined && (updateData.weight < 0 || updateData.weight > 10)) {
      return {
        success: false,
        error: 'Weight must be between 0 and 10',
        data: null
      };
    }
    
    const result = await updateActivityInDb(activityId, updateData, user);
    
    // Emit notification for activity completion if status changed to completed and toggle is on
    if (result.success && result.data && updateData.sendNotification !== false && updateData.status === 'completed') {
      try {
        const activity = result.data;
        
        // Get the student who completed the activity (from user object)
        if (user?.dbId) {
          await notificationGateway.emit(
            EVENTS.ACTIVITY_COMPLETED,
            {
              activityName: activity.titleEn || activity.titleAr,
              grade: updateData.grade
            },
            user,
            { userId: user.dbId }
          );
        }
      } catch (notifError) {
        console.error('Failed to emit activity completion notification:', notifError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in updateActivity:', error);
    return {
      success: false,
      error: error.message || 'Failed to update activity',
      data: null
    };
  }
};

/**
 * Delete activity with business logic
 * 
 * @param {number|string} activityId - Activity ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteActivity = async (activityId, user = null, options = {}) => {
  try {
    if (!activityId) {
      return {
        success: false,
        error: 'Activity ID is required',
        data: null
      };
    }
    
    const result = await deleteActivityInDb(activityId, user, options);
    return result;
  } catch (error) {
    console.error('Error in deleteActivity:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete activity',
      data: null
    };
  }
};

/**
 * Get activities by class with business logic
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getActivitiesByClass = async (classId, params = {}, user = null) => {
  try {
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: []
      };
    }
    
    // Business rule: Check if user has access to this class
    // This would typically involve checking enrollment or instructor assignment
    
    const result = await getActivitiesByClassFromDb(classId, params);
    return result;
  } catch (error) {
    console.error('Error in getActivitiesByClass:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve activities for class',
      data: []
    };
  }
};

export default {
  getAllActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitiesByClass
};
