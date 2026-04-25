/**
 * Teacher Availability Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for teacher availability operations
 * ARCHITECTURE: HTTP Requests → Controllers → DB Services → PostgreSQL
 */

import {
  getTeacherAvailabilities,
  getTeacherAvailabilityById,
  getTeacherAvailabilityByUserId,
  getAvailableTeachers,
  createTeacherAvailability,
  updateTeacherAvailability,
  deleteTeacherAvailability
} from '../db/teacher-availability-postgres.js';

/**
 * GET /api/v1/teacher-availability
 * Get all teacher availabilities
 */
export const getAllTeacherAvailabilitiesController = async (req, res) => {
  try {
    const result = await getTeacherAvailabilities(req.query);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getAllTeacherAvailabilitiesController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/teacher-availability/available
 * Get available teachers for a date/time slot
 */
export const getAvailableTeachersController = async (req, res) => {
  try {
    const result = await getAvailableTeachers(req.query);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getAvailableTeachersController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/teacher-availability/user/:userId
 * Get teacher availability by user ID
 */
export const getTeacherAvailabilityByUserIdController = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await getTeacherAvailabilityByUserId(userId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getTeacherAvailabilityByUserIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/teacher-availability/:id
 * Get teacher availability by ID
 */
export const getTeacherAvailabilityByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getTeacherAvailabilityById(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getTeacherAvailabilityByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/teacher-availability
 * Create new teacher availability record
 */
export const createTeacherAvailabilityController = async (req, res) => {
  try {
    const result = await createTeacherAvailability(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in createTeacherAvailabilityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/teacher-availability/:id
 * Update teacher availability
 */
export const updateTeacherAvailabilityController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateTeacherAvailability(id, req.body);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in updateTeacherAvailabilityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/teacher-availability/:id
 * Delete teacher availability
 */
export const deleteTeacherAvailabilityController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteTeacherAvailability(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in deleteTeacherAvailabilityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
