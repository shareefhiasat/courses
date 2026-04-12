/**
 * Subject Types Controller
 * 
 * PURPOSE: HTTP request handlers for subject type operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getSubjectTypes, 
  getSubjectTypeById, 
  createSubjectType, 
  updateSubjectType, 
  deleteSubjectType 
} from '../db/subjectTypes-postgres.js';

/**
 * Get all subject types
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllSubjectTypesController = async (req, res) => {
  try {
    console.log('[Controller] Getting subject types with query:', req.query);
    
    const result = await getSubjectTypes(req.query);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error getting subject types:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Get subject type by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSubjectTypeByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Getting subject type by ID:', id);
    
    const result = await getSubjectTypeById(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error getting subject type by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Create new subject type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createSubjectTypeController = async (req, res) => {
  try {
    console.log('[Controller] Creating subject type:', req.body);
    
    // Get user from request (assuming auth middleware adds user)
    const user = req.user || null;
    const subjectTypeData = {
      ...req.body,
      createdBy: user?.id
    };
    
    const result = await createSubjectType(subjectTypeData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error creating subject type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Update subject type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateSubjectTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Updating subject type:', id, req.body);
    
    // Get user from request (assuming auth middleware adds user)
    const user = req.user || null;
    const updateData = {
      ...req.body,
      updatedBy: user?.id
    };
    
    const result = await updateSubjectType(id, updateData);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error updating subject type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Delete subject type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteSubjectTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Deleting subject type:', id);
    
    const result = await deleteSubjectType(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else if (result.code === 'HAS_DEPENDENCIES') {
      res.status(409).json(result); // Conflict
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error deleting subject type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
