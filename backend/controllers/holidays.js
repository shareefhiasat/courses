/**
 * Holidays Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for holiday operations
 * ARCHITECTURE: HTTP Requests → Controllers → DB Services → PostgreSQL
 */

import {
  getHolidays,
  getHolidayById,
  getHolidaysByProgram,
  getUpcomingHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
} from '../db/holidays-postgres.js';

/**
 * GET /api/v1/holidays
 * Get all holidays
 */
export const getAllHolidaysController = async (req, res) => {
  try {
    const result = await getHolidays(req.query);
    
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
    console.error('Error in getAllHolidaysController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/holidays/upcoming
 * Get upcoming holidays
 */
export const getUpcomingHolidaysController = async (req, res) => {
  try {
    const result = await getUpcomingHolidays(req.query);
    
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
    console.error('Error in getUpcomingHolidaysController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/holidays/program/:programId
 * Get holidays by program (including global)
 */
export const getHolidaysByProgramController = async (req, res) => {
  try {
    const { programId } = req.params;
    
    const result = await getHolidaysByProgram(programId);
    
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
    console.error('Error in getHolidaysByProgramController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/holidays/:id
 * Get holiday by ID
 */
export const getHolidayByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getHolidayById(id);
    
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
    console.error('Error in getHolidayByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/holidays
 * Create new holiday
 */
export const createHolidayController = async (req, res) => {
  try {
    // Authorization check: only admin/HR can create holidays
    if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Only admin and HR can create holidays'
      });
    }

    const result = await createHoliday(req.body, req.user?.dbId);
    
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
    console.error('Error in createHolidayController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/holidays/:id
 * Update holiday
 */
export const updateHolidayController = async (req, res) => {
  try {
    // Authorization check: only admin/HR can update holidays
    if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Only admin and HR can update holidays'
      });
    }

    const { id } = req.params;
    
    const result = await updateHoliday(id, req.body, req.user?.dbId);
    
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
    console.error('Error in updateHolidayController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/holidays/:id
 * Delete holiday
 */
export const deleteHolidayController = async (req, res) => {
  try {
    // Authorization check: only admin/HR can delete holidays
    if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Only admin and HR can delete holidays'
      });
    }

    const { id } = req.params;
    const { deleteScope } = req.body || {};
    
    const result = await deleteHoliday(id, deleteScope);
    
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
    console.error('Error in deleteHolidayController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
