/**
 * Activities Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for activity operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getAllActivities, 
  getActivityById, 
  createActivity, 
  updateActivity, 
  deleteActivity, 
  getActivitiesByClass
} from '../services/activities.js';

/**
 * GET /api/v1/activities
 * Get all activities
 */
export const getAllActivitiesController = async (req, res) => {
  try {
    const result = await getAllActivities(req.query, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getAllActivitiesController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/activities/:id
 * Get activity by ID
 */
export const getActivityByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getActivityById(id, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getActivityByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/activities
 * Create new activity
 */
export const createActivityController = async (req, res) => {
  try {
    const result = await createActivity(req.body, req.user);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in createActivityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/activities/:id
 * Update activity
 */
export const updateActivityController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateActivity(id, req.body, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in updateActivityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/activities/:id
 * Delete activity
 */
export const deleteActivityController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteActivity(id, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in deleteActivityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/activities/class/:classId
 * Get activities by class
 */
export const getActivitiesByClassController = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const result = await getActivitiesByClass(classId, req.query, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getActivitiesByClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  getAllActivitiesController,
  getActivityByIdController,
  createActivityController,
  updateActivityController,
  deleteActivityController,
  getActivitiesByClassController
};
