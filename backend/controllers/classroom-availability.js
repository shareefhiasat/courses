/**
 * Classroom Availability Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for classroom availability operations
 * ARCHITECTURE: HTTP Requests → Controllers → DB Services → PostgreSQL
 */

import {
  getClassroomAvailabilities,
  createClassroomAvailability,
  updateClassroomAvailability,
  deleteClassroomAvailability
} from '../db/classroom-availability-postgres.js';

/**
 * GET /api/v1/classroom-availability
 * Get all classroom availability entries
 */
export const getAllClassroomAvailabilitiesController = async (req, res) => {
  try {
    const result = await getClassroomAvailabilities(req.query);
    
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
    console.error('Error in getAllClassroomAvailabilitiesController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/classroom-availability
 * Create a classroom availability entry
 */
export const createClassroomAvailabilityController = async (req, res) => {
  try {
    const result = await createClassroomAvailability(req.body);
    
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
    console.error('Error in createClassroomAvailabilityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/classroom-availability/:id
 * Update a classroom availability entry
 */
export const updateClassroomAvailabilityController = async (req, res) => {
  try {
    const result = await updateClassroomAvailability(req.params.id, req.body);
    
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
    console.error('Error in updateClassroomAvailabilityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/classroom-availability/:id
 * Delete a classroom availability entry
 */
export const deleteClassroomAvailabilityController = async (req, res) => {
  try {
    const result = await deleteClassroomAvailability(req.params.id);
    
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
    console.error('Error in deleteClassroomAvailabilityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
