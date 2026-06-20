/**
 * Programs Controller
 * 
 * PURPOSE: Handle HTTP requests and responses for program operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import programBusinessService from '../services/programs.js';
import { applyListScope } from '../utils/applyListScope.js';

/**
 * Get all programs
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getProgramsController = async (req, res) => {
  try {
    console.log('[Controller] Getting programs with query:', req.query);
    const result = await applyListScope(req, await programBusinessService.getAllPrograms(req.query), 'program');
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error getting programs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve programs'
    });
  }
};

/**
 * Get program by ID
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getProgramByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Getting program by ID:', id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Program ID is required',
        message: 'Program ID is required'
      });
    }
    
    const result = await programBusinessService.getProgramById(id, req.query);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.error === 'Program not found') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error getting program:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve program'
    });
  }
};

/**
 * Create new program
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createProgramController = async (req, res) => {
  try {
    const programData = req.body;
    console.log('[Controller] Creating program:', programData.nameEn || 'unnamed');
    
    // Extract user from request (will be populated by auth middleware)
    const user = req.user || null;
    
    const result = await programBusinessService.createProgram(programData, user);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error creating program:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create program'
    });
  }
};

/**
 * Update program
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateProgramController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('[Controller] Updating program:', id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Program ID is required',
        message: 'Program ID is required'
      });
    }
    
    // Extract user from request (will be populated by auth middleware)
    const user = req.user || null;
    
    const result = await programBusinessService.updateProgram(id, updateData, user);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.error === 'Program not found') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error updating program:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update program'
    });
  }
};

/**
 * Delete program (soft delete)
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteProgramController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Deleting program:', id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Program ID is required',
        message: 'Program ID is required'
      });
    }
    
    const result = await programBusinessService.deleteProgram(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.error === 'Program not found') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error deleting program:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete program'
    });
  }
};

export const hardDeleteProgramController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Controller] Hard deleting program:', id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Program ID is required',
        message: 'Program ID is required'
      });
    }
    
    const result = await programBusinessService.hardDeleteProgram(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.error === 'Program not found') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[Controller] Error hard deleting program:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to hard delete program'
    });
  }
};
