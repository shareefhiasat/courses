/**
 * Activities Business Service
 * 
 * PURPOSE: Business logic layer for activity-related operations
 * This service orchestrates database operations and implements business rules
 * 
 * ARCHITECTURE: Frontend Components → Business Services → Database Services → PostgreSQL
 */

import activityDbService from '../db/activityDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'activitiesBusinessService';

/**
 * Get all activities with business logic
 */
export const getAllActivities = async (params = {}) => {
  try {
    info(`${serviceName}:getAllActivities`, { params });
    
    const result = await activityDbService.getAll(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getAllActivities:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve activities',
      data: []
    };
  }
};

/**
 * Get activity by ID with business validation
 */
export const getActivityById = async (id) => {
  try {
    info(`${serviceName}:getActivityById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Activity ID is required',
        data: null
      };
    }
    
    const result = await activityDbService.getById(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getActivityById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve activity',
      data: null
    };
  }
};

/**
 * Create new activity with business validation
 */
export const createActivity = async (activityData, user = null) => {
  try {
    info(`${serviceName}:createActivity`, { data: activityData });
    
    // Business rules validation
    if (!activityData.title) {
      return {
        success: false,
        error: 'Activity title is required',
        data: null
      };
    }
    
    if (!activityData.type) {
      return {
        success: false,
        error: 'Activity type is required',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...activityData,
      isActive: activityData.isActive !== undefined ? activityData.isActive : true,
      createdAt: new Date(),
      createdBy: user?.id || 1
    };
    
    // Use database service
    const result = await activityDbService.create(processedData);
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
 * Update activity with business validation
 */
export const updateActivity = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateActivity`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Activity ID is required',
        data: null
      };
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    updateData.updatedBy = user?.id || 1;
    
    // Use database service
    const result = await activityDbService.update(id, updateData);
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
 * Delete activity (soft delete) with business validation
 */
export const deleteActivity = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteActivity`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Activity ID is required',
        data: null
      };
    }
    
    const result = await activityDbService.delete(id);
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
  getAllActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity
};
