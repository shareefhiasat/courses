/**
 * Priority Types Controller
 * Handles HTTP requests for priority types operations
 */

import { 
  getAllPriorityTypes, 
  getPriorityTypeById, 
  createPriorityType, 
  updatePriorityType, 
  deletePriorityType 
} from '../services/priority-types.js';

/**
 * Get all priority types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllPriorityTypesController = async (req, res) => {
  try {
    console.log('[PriorityTypes Controller] Getting all priority types');
    
    const result = await getAllPriorityTypes(req.query, req.user);
    
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
    console.error('[PriorityTypes Controller] Error getting all priority types:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get priority type by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPriorityTypeByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PriorityTypes Controller] Getting priority type by ID: ${id}`);
    
    const result = await getPriorityTypeById(id, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[PriorityTypes Controller] Error getting priority type by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Create new priority type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createPriorityTypeController = async (req, res) => {
  try {
    console.log('[PriorityTypes Controller] Creating new priority type');
    
    const result = await createPriorityType(req.body, req.user);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[PriorityTypes Controller] Error creating priority type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update priority type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePriorityTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PriorityTypes Controller] Updating priority type: ${id}`);
    
    const result = await updatePriorityType(id, req.body, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[PriorityTypes Controller] Error updating priority type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Delete priority type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deletePriorityTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PriorityTypes Controller] Deleting priority type: ${id}`);
    
    const result = await deletePriorityType(id, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[PriorityTypes Controller] Error deleting priority type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
