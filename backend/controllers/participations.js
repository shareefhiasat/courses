/**
 * Participations Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for participation operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getAllParticipations,
  getParticipationById,
  createParticipation,
  updateParticipation,
  deleteParticipation,
  getParticipationsByStudent,
  getParticipationsByClass,
  getStudentStats,
  getClassStats
} from '../services/participations.js';

/**
 * GET /api/v1/participations
 * Get all participations
 */
export const getAllParticipationsController = async (req, res) => {
  try {
    const result = await getAllParticipations(req.query, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getAllParticipationsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/participations/:id
 * Get participation by ID
 */
export const getParticipationByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getParticipationById(id, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getParticipationByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/participations
 * Create new participation
 */
export const createParticipationController = async (req, res) => {
  try {
    const result = await createParticipation(req.body, req.user);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in createParticipationController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/participations/:id
 * Update participation
 */
export const updateParticipationController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateParticipation(id, req.body, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in updateParticipationController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/participations/:id
 * Delete participation
 */
export const deleteParticipationController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteParticipation(id, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in deleteParticipationController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/participations/student/:studentId
 * Get participations by student ID
 */
export const getParticipationsByStudentController = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await getParticipationsByStudent(studentId, req.query, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getParticipationsByStudentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/participations/class/:classId
 * Get participations by class ID
 */
export const getParticipationsByClassController = async (req, res) => {
  try {
    const { classId } = req.params;
    const result = await getParticipationsByClass(classId, req.query, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getParticipationsByClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/participations/stats?userId=:userId
 * Get participation statistics for a student
 */
export const getStudentStatsController = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const result = await getStudentStats(userId, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getStudentStatsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/participations/class-stats?classId=:classId
 * Get participation statistics for a class
 */
export const getClassStatsController = async (req, res) => {
  try {
    const { classId } = req.query;
    
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: 'Class ID is required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const result = await getClassStats(classId, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getClassStatsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/participations/activity/:activityId
 * Get participations by activity ID (placeholder for future implementation)
 */
export const getParticipationsByActivityController = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    // For now, return empty since activities are not fully implemented yet
    res.status(200).json({
      success: true,
      data: [],
      total: 0,
      message: 'Activity-based participations not yet implemented'
    });
  } catch (error) {
    console.error('Error in getParticipationsByActivityController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
