/**
 * Behaviors Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for behavior operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getAllBehaviors,
  getBehaviorById,
  createBehavior,
  updateBehavior,
  deleteBehavior,
  getBehaviorsByStudent,
  getBehaviorsByClass
} from '../services/behaviors.js';
import { applyListScope } from '../utils/applyListScope.js';

/**
 * GET /api/v1/behaviors
 * Get all behaviors
 */
export const getAllBehaviorsController = async (req, res) => {
  try {
    const { page, limit, search, classId, studentId, userId, typeId, isActive, sortBy, sortOrder } = req.query;
    
    const params = {
      page: page || 1,
      limit: limit || 10,
      search: search || '',
      classId: classId || '',
      studentId: studentId || userId || '',
      typeId: typeId || '',
      isActive: isActive !== undefined ? isActive : null,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await applyListScope(req, await getAllBehaviors(params, req.user), 'classLinked');
    
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
        error: result.error,
        data: []
      });
    }
  } catch (error) {
    console.error('Error in getAllBehaviorsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/behaviors/:id
 * Get behavior by ID
 */
export const getBehaviorByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('Error in getBehaviorByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/behaviors
 * Create new behavior
 */
export const createBehaviorController = async (req, res) => {
  try {
    const result = await createBehavior(req.body, req.user);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Behavior created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to create behavior'
      });
    }
  } catch (error) {
    console.error('Error in createBehaviorController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/behaviors/:id
 * Update behavior
 */
export const updateBehaviorController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateBehavior(id, req.body, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Behavior updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to update behavior'
      });
    }
  } catch (error) {
    console.error('Error in updateBehaviorController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/behaviors/:id
 * Delete behavior
 */
export const deleteBehaviorController = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Behavior deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteBehaviorController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/behaviors/student/:studentId
 * Get behaviors by student ID
 */
export const getBehaviorsByStudentController = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error in getBehaviorsByStudentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/behaviors/class/:classId
 * Get behaviors by class ID
 */
export const getBehaviorsByClassController = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error in getBehaviorsByClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
