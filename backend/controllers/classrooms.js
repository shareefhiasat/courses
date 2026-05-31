/**
 * Classrooms Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for classroom operations
 * ARCHITECTURE: HTTP Requests → Controllers → DB Services → PostgreSQL
 */

import {
  getClassrooms,
  getClassroomById,
  getClassroomsByProgram,
  getAvailableClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom
} from '../db/classrooms-postgres.js';

/**
 * GET /api/v1/classrooms
 * Get all classrooms
 */
export const getAllClassroomsController = async (req, res) => {
  try {
    const result = await getClassrooms(req.query);
    
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
    console.error('Error in getAllClassroomsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/classrooms/available
 * Get available classrooms for a date/time slot
 */
export const getAvailableClassroomsController = async (req, res) => {
  try {
    const result = await getAvailableClassrooms(req.query);
    
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
    console.error('Error in getAvailableClassroomsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/classrooms/program/:programId
 * Get classrooms by program
 */
export const getClassroomsByProgramController = async (req, res) => {
  try {
    const { programId } = req.params;
    
    const result = await getClassroomsByProgram(programId);
    
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
    console.error('Error in getClassroomsByProgramController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/classrooms/:id
 * Get classroom by ID
 */
export const getClassroomByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getClassroomById(id);
    
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
    console.error('Error in getClassroomByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/classrooms
 * Create new classroom
 */
export const createClassroomController = async (req, res) => {
  try {
    console.log('[Classrooms Controller] Creating classroom with body:', req.body);
    const result = await createClassroom(req.body);
    console.log('[Classrooms Controller] Create result:', result);

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
    console.error('Error in createClassroomController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/classrooms/:id
 * Update classroom
 */
export const updateClassroomController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateClassroom(id, req.body);
    
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
    console.error('Error in updateClassroomController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/classrooms/:id
 * Delete classroom
 */
export const deleteClassroomController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteClassroom(id);
    
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
    console.error('Error in deleteClassroomController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
