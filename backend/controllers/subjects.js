/**
 * Subjects Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for subject operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByProgram
} from '../services/subjects.js';
import { applyListScope } from '../utils/applyListScope.js';
import { asyncHandler, sendResult } from '../utils/asyncHandler.js';

function applySubjectScope(result, req) {
  return applyListScope(req, result, 'subject');
}

/**
 * GET /api/v1/subjects
 * Get all subjects
 */
export const getAllSubjectsController = asyncHandler(async (req, res) => {
  const result = await getAllSubjects(req.query, req.user);
  const scoped = await applySubjectScope(result, req);
  if (scoped.success) {
    res.status(200).json({
      success: true,
      data: scoped.data,
      total: scoped.total,
      page: scoped.page,
      limit: scoped.limit,
      totalPages: scoped.totalPages
    });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/v1/subjects/:id
 * Get subject by ID
 */
export const getSubjectByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getSubjectById(id, req.user);
  sendResult(res, result);
});

/**
 * POST /api/v1/subjects
 * Create new subject
 */
export const createSubjectController = asyncHandler(async (req, res) => {
  const result = await createSubject(req.body, req.user);
  sendResult(res, result, { successStatus: 201 });
});

/**
 * PUT /api/v1/subjects/:id
 * Update subject
 */
export const updateSubjectController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await updateSubject(id, req.body, req.user);
  sendResult(res, result);
});

/**
 * DELETE /api/v1/subjects/:id
 * Delete subject
 */
export const deleteSubjectController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const options = { force: req.body?.force || req.query?.force === 'true' };
  const result = await deleteSubject(id, req.user, options);
  if (result.success) {
    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message
    });
  } else {
    const statusCode = result.error.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: result.error,
      code: result.code || undefined,
      dependencies: result.dependencies || undefined
    });
  }
});

/**
 * GET /api/v1/subjects/program/:programId
 * Get subjects by program
 */
export const getSubjectsByProgramController = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const result = await getSubjectsByProgram(programId, req.query, req.user);
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
    res.status(400).json({ success: false, error: result.error });
  }
});

export default {
  getAllSubjectsController,
  getSubjectByIdController,
  createSubjectController,
  updateSubjectController,
  deleteSubjectController,
  getSubjectsByProgramController
};
