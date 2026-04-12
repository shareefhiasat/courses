/**
 * Participation Types Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for participation type operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getAllParticipationTypes,
  getParticipationTypeById,
  createParticipationType,
  updateParticipationType,
  deleteParticipationType
} from '../services/participation-types.js';

/**
 * GET /api/v1/participation-types
 * Get all participation types
 */
export const getAllParticipationTypesController = async (req, res) => {
  try {
    const result = await getAllParticipationTypes(req.query, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getAllParticipationTypesController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/participation-types/:id
 * Get participation type by ID
 */
export const getParticipationTypeByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getParticipationTypeById(id, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getParticipationTypeByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/participation-types
 * Create new participation type
 */
export const createParticipationTypeController = async (req, res) => {
  try {
    const result = await createParticipationType(req.body, req.user);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in createParticipationTypeController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/participation-types/:id
 * Update participation type
 */
export const updateParticipationTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateParticipationType(id, req.body, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in updateParticipationTypeController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/participation-types/:id
 * Delete participation type
 */
export const deleteParticipationTypeController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteParticipationType(id, req.user);
    
    if (result.success) {
      res.status(200).json(result);
    } else if (result.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in deleteParticipationTypeController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
