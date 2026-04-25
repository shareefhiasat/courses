/**
 * Time Slots Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for time slot operations
 * ARCHITECTURE: HTTP Requests → Controllers → DB Services → PostgreSQL
 */

import {
  getTimeSlots,
  getTimeSlotById,
  getTimeSlotsByProgram,
  getSchedulableTimeSlots,
  bulkInitDefaults,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot
} from '../db/time-slots-postgres.js';

/**
 * GET /api/v1/time-slots
 * Get all time slots
 */
export const getAllTimeSlotsController = async (req, res) => {
  try {
    const result = await getTimeSlots(req.query);
    
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
    console.error('Error in getAllTimeSlotsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/time-slots/schedulable
 * Get schedulable time slots (excludes breaks)
 */
export const getSchedulableTimeSlotsController = async (req, res) => {
  try {
    const result = await getSchedulableTimeSlots(req.query);
    
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
    console.error('Error in getSchedulableTimeSlotsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/time-slots/bulk-init
 * Bulk initialize default time slots for a program
 */
export const bulkInitDefaultsController = async (req, res) => {
  try {
    const result = await bulkInitDefaults(req.body);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in bulkInitDefaultsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/time-slots/program/:programId
 * Get time slots by program
 */
export const getTimeSlotsByProgramController = async (req, res) => {
  try {
    const { programId } = req.params;
    
    const result = await getTimeSlotsByProgram(programId);
    
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
    console.error('Error in getTimeSlotsByProgramController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/time-slots/:id
 * Get time slot by ID
 */
export const getTimeSlotByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getTimeSlotById(id);
    
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
    console.error('Error in getTimeSlotByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/time-slots
 * Create new time slot
 */
export const createTimeSlotController = async (req, res) => {
  try {
    const result = await createTimeSlot(req.body);
    
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
    console.error('Error in createTimeSlotController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/time-slots/:id
 * Update time slot
 */
export const updateTimeSlotController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateTimeSlot(id, req.body);
    
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
    console.error('Error in updateTimeSlotController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/time-slots/:id
 * Delete time slot
 */
export const deleteTimeSlotController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteTimeSlot(id);
    
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
    console.error('Error in deleteTimeSlotController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
