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
import { asyncHandler, sendResult } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/holidays
 * Get all holidays
 */
export const getAllHolidaysController = asyncHandler(async (req, res) => {
  const result = await getHolidays(req.query);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } else {
    res.status(400).json({ success: false, error: result.error, code: result.code });
  }
});

/**
 * GET /api/v1/holidays/upcoming
 * Get upcoming holidays
 */
export const getUpcomingHolidaysController = asyncHandler(async (req, res) => {
  const result = await getUpcomingHolidays(req.query);
  sendResult(res, result);
});

/**
 * GET /api/v1/holidays/program/:programId
 * Get holidays by program (including global)
 */
export const getHolidaysByProgramController = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const result = await getHolidaysByProgram(programId);
  sendResult(res, result);
});

/**
 * GET /api/v1/holidays/:id
 * Get holiday by ID
 */
export const getHolidayByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getHolidayById(id);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: result.error, code: result.code });
  }
});

/**
 * POST /api/v1/holidays
 * Create new holiday
 */
export const createHolidayController = asyncHandler(async (req, res) => {
  if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Access denied: Only admin and HR can create holidays' });
  }
  const result = await createHoliday(req.body, req.user?.dbId);
  if (result.success) {
    res.status(201).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, error: result.error, code: result.code });
  }
});

/**
 * PUT /api/v1/holidays/:id
 * Update holiday
 */
export const updateHolidayController = asyncHandler(async (req, res) => {
  if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Access denied: Only admin and HR can update holidays' });
  }
  const { id } = req.params;
  const result = await updateHoliday(id, req.body, req.user?.dbId);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: result.error, code: result.code });
  }
});

/**
 * DELETE /api/v1/holidays/:id
 * Delete holiday
 */
export const deleteHolidayController = asyncHandler(async (req, res) => {
  if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Access denied: Only admin and HR can delete holidays' });
  }
  const { id } = req.params;
  const { deleteScope } = req.body || {};
  const result = await deleteHoliday(id, deleteScope);
  if (result.success) {
    res.status(200).json({ success: true, message: result.message });
  } else {
    const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: result.error, code: result.code });
  }
});
