import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { getClasses as getClassesFromDb, create as createClassToDb, update as updateClassInDb, deleteClass as deleteClassFromDb, getClass as getClassByIdFromDb } from '../db/classDbService';

/**
 * Class Service
 * Handles class/course management
 */

// Get all classes - with performance monitoring and memoization
export const getClasses = async () => {
  try {
    return await getClassesFromDb();
  } catch (error) {
    logger.error('CLASS: Failed to fetch classes', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Add new class
export const addClass = async (data, user) => {
  try {
    logger.info('CLASS: Creating new class', { className: data.name, classCode: data.code });
    
    const result = await createClassToDb(data, user);
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.CLASS_CREATED, {
        classId: result.id,
        className: data.name,
        classCode: data.code
      });
    } catch (logError) {
      logger.warn('CLASS: Failed to log class creation:', logError);
    }
    
    logger.info('CLASS: Successfully created class', { classId: result.id, className: data.name });
    return result;
  } catch (error) {
    logger.error('CLASS: Failed to create class', { error: error.message, classData: { name: data.name, code: data.code } });
    return { success: false, error: error.message };
  }
};

// Update class
export const updateClass = async (id, data, user) => {
  try {
    logger.info('CLASS: Updating class', { classId: id, updateFields: Object.keys(data) });
    
    const result = await updateClassInDb(id, data, user);
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.CLASS_UPDATED, {
        classId: id,
        updateFields: Object.keys(data)
      });
    } catch (logError) {
      logger.warn('CLASS: Failed to log class update:', logError);
    }
    
    logger.info('CLASS: Successfully updated class', { classId: id });
    return result;
  } catch (error) {
    logger.error('CLASS: Failed to update class', { error: error.message, classId: id });
    return { success: false, error: error.message };
  }
};

// Delete class with cascade
export const deleteClass = async (id) => {
  try {
    logger.info('CLASS: Deleting class', { classId: id });
    
    // Use database service for cascade delete
    const { deleteClassCascade: deleteClassCascadeFromDb } = await import('../db/classDbService');
    const result = await deleteClassCascadeFromDb(id);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.CLASS_DELETED, {
          classId: id,
          cascadeDeletedCount: result.deletedCount || 0
        });
      } catch (logError) {
        logger.warn('CLASS: Failed to log class deletion:', logError);
      }
      
      logger.info('CLASS: Successfully deleted class', { classId: id, cascadeDeletedCount: result.deletedCount });
    }
    
    return result;
  } catch (error) {
    logger.error('CLASS: Failed to delete class', { error: error.message, classId: id });
    return { success: false, error: error.message };
  }
};

// Get class by ID
export const getClassById = async (id) => {
  try {
    return await getClassByIdFromDb(id);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update class schedule
 * @param {string} classId - Class ID
 * @param {Object} schedule - Schedule data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateClassSchedule = async (classId, schedule) => {
  try {
    // Use database service to update class
    const result = await updateClassInDb(classId, { schedule });
    return result;
  } catch (error) {
    logger.error('Error updating class schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all classes
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAllClasses = async () => {
  try {
    // Use database service to get all classes
    return await getClassesFromDb();
  } catch (error) {
    logger.error('Error fetching classes:', error);
    return { success: false, error: error.message };
  }
};

// Alias for getClassById for consistency with other services
export const fetchClass = getClassById;

