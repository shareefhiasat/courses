/**
 * Activity Service - Interface Layer
 * 
 * PURPOSE: Public API for activity operations
 * ARCHITECTURE: Frontend Components → Activity Service → Activity Business Service → Database Service
 */

import { info, error, warn, debug } from '../utils/logger.js';

// Import business service functions
import { 
  getAllActivities as getAllActivitiesBusiness,
  getActivityById as getActivityByIdBusiness,
  createActivity as createActivityBusiness,
  updateActivity as updateActivityBusiness,
  deleteActivity as deleteActivityBusiness
} from './activitiesBusinessService.js';

const serviceName = 'activityService';

/**
 * Get all activities - public interface
 */
export const getActivities = async (params = {}) => {
  try {
    info(`${serviceName}:getActivities`, { params });
    
    // Use business service layer
    const result = await getAllActivitiesBusiness(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getActivities:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load activities',
      data: []
    };
  }
};

/**
 * Get activity by ID - public interface
 */
export const getActivityById = async (id) => {
  try {
    info(`${serviceName}:getActivityById`, { id });
    
    // Use business service layer
    const result = await getActivityByIdBusiness(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getActivityById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to load activity',
      data: null
    };
  }
};

/**
 * Create activity - public interface
 */
export const createActivity = async (activityData, user = null) => {
  try {
    info(`${serviceName}:createActivity`, { data: activityData });
    
    // Use business service layer
    const result = await createActivityBusiness(activityData, user);
    return result;
  } catch (err) {
    error(`${serviceName}:createActivity:error`, { error: err.message, data: activityData });
    return {
      success: false,
      error: err.message || 'Failed to create activity',
      data: null
    };
  }
};

/**
 * Update activity - public interface
 */
export const updateActivity = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateActivity`, { id, data: updateData });
    
    // Use business service layer
    const result = await updateActivityBusiness(id, updateData, user);
    return result;
  } catch (err) {
    error(`${serviceName}:updateActivity:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update activity',
      data: null
    };
  }
};

/**
 * Delete activity - public interface
 */
export const deleteActivity = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteActivity`, { id });
    
    // Use business service layer
    const result = await deleteActivityBusiness(id, user);
    return result;
  } catch (err) {
    error(`${serviceName}:deleteActivity:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete activity',
      data: null
    };
  }
};

export default {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity
};
