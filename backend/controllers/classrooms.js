/**
 * Classrooms Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for classroom operations
 * ARCHITECTURE: HTTP Requests → Controllers → DB Services → PostgreSQL
 */

import {
  getClassrooms,
  getClassroomById,
  getClassroomsByProgram,
  getAvailableClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom
} from '../db/classrooms-postgres.js';
import { asyncHandler, sendResult } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/classrooms
 * Get all classrooms
 */
export const getAllClassroomsController = asyncHandler(async (req, res) => {
  const result = await getClassrooms(req.query);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } else {
    res.status(400).json({ success: false, error: result.error, code: result.code });
  }
});

/**
 * GET /api/v1/classrooms/available
 * Get available classrooms for a date/time slot
 */
export const getAvailableClassroomsController = asyncHandler(async (req, res) => {
  const result = await getAvailableClassrooms(req.query);
  sendResult(res, result);
});

/**
 * GET /api/v1/classrooms/program/:programId
 * Get classrooms by program
 */
export const getClassroomsByProgramController = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const result = await getClassroomsByProgram(programId);
  sendResult(res, result);
});

/**
 * GET /api/v1/classrooms/:id
 * Get classroom by ID
 */
export const getClassroomByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getClassroomById(id);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: result.error, code: result.code });
  }
});

/**
 * POST /api/v1/classrooms
 * Create new classroom
 */
export const createClassroomController = asyncHandler(async (req, res) => {
  const result = await createClassroom(req.body);
  if (result.success) {
    res.status(201).json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, error: result.error, code: result.code });
  }
});

/**
 * PUT /api/v1/classrooms/:id
 * Update classroom
 */
export const updateClassroomController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await updateClassroom(id, req.body);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data });
  } else {
    const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: result.error, code: result.code });
  }
});

/**
 * DELETE /api/v1/classrooms/:id
 * Delete classroom
 */
export const deleteClassroomController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteClassroom(id);
  if (result.success) {
    res.status(200).json({ success: true, message: result.message });
  } else {
    const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: result.error, code: result.code });
  }
});
