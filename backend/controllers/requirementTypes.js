/**
 * Requirement Types Controller
 * 
 * PURPOSE: HTTP request handlers for requirement type operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getRequirementTypes, 
  getRequirementTypeById, 
  createRequirementType, 
  updateRequirementType, 
  deleteRequirementType 
} from '../db/requirementTypes-postgres.js';

/**
 * Get all requirement types
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllRequirementTypesController = async (req, res) => {
  try {
    console.log('[Controller] Getting requirement types with query:', req.query);
    
    const result = await getRequirementTypes(req.query);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error getting requirement types:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Get requirement type by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRequirementTypeByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Getting requirement type by ID:', id);
    
    const result = await getRequirementTypeById(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error getting requirement type by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Create new requirement type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createRequirementTypeController = async (req, res) => {
  try {
    console.log('[Controller] Creating requirement type:', req.body);
    
    // Get user from request (assuming auth middleware adds user)
    const user = req.user || null;
    const requirementTypeData = {
      ...req.body,
      createdBy: user?.id
    };
    
    const result = await createRequirementType(requirementTypeData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error creating requirement type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Update requirement type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateRequirementTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Updating requirement type:', id, req.body);
    
    // Get user from request (assuming auth middleware adds user)
    const user = req.user || null;
    const updateData = {
      ...req.body,
      updatedBy: user?.id
    };
    
    const result = await updateRequirementType(id, updateData);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error updating requirement type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Delete requirement type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteRequirementTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Deleting requirement type:', id);
    
    const result = await deleteRequirementType(id);
    
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
    console.error('[Controller] Error deleting requirement type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
