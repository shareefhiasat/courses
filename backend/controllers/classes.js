/**
 * Classes Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for class operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassesByProgram,
  getClassesBySubject,
  getClassesByInstructor
} from '../services/classes.js';
import { applyListScope } from '../utils/applyListScope.js';
import { asyncHandler, sendResult } from '../utils/asyncHandler.js';

async function applyClassScope(result, req) {
  return applyListScope(req, result, 'class');
}

/**
 * GET /api/v1/classes
 * Get all classes
 */
export const getAllClassesController = asyncHandler(async (req, res) => {
  const result = await getAllClasses(req.query, req.user);
  const scopedResult = await applyClassScope(result, req);
  res.status(200).json({
    success: true,
    data: scopedResult.data,
    total: scopedResult.total,
    page: scopedResult.page,
    limit: scopedResult.limit,
    totalPages: scopedResult.totalPages
  });
});

/**
 * GET /api/v1/classes/:id
 * Get class by ID
 */
export const getClassByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getClassById(id, req.user);
  sendResult(res, result);
});

/**
 * POST /api/v1/classes
 * Create new class
 */
export const createClassController = asyncHandler(async (req, res) => {
  const result = await createClass(req.body, req.user);
  sendResult(res, result, { successStatus: 201 });
});

/**
 * PUT /api/v1/classes/:id
 * Update class
 */
export const updateClassController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await updateClass(id, req.body, req.user);
  sendResult(res, result);
});

/**
 * DELETE /api/v1/classes/:id
 * Delete class
 */
export const deleteClassController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const options = { force: req.body?.force || req.query?.force === 'true' };
  const result = await deleteClass(id, req.user, options);
  if (result.success) {
    res.status(200).json({ success: true, data: result.data, message: result.message });
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
 * GET /api/v1/classes/program/:programId
 * Get classes by program
 */
export const getClassesByProgramController = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  const result = await applyClassScope(await getClassesByProgram(programId, req.query, req.user), req);
  if (result.success) {
    res.status(200).json({
      success: true, data: result.data, total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages
    });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/v1/classes/subject/:subjectId
 * Get classes by subject
 */
export const getClassesBySubjectController = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const result = await applyClassScope(await getClassesBySubject(subjectId, req.query, req.user), req);
  if (result.success) {
    res.status(200).json({
      success: true, data: result.data, total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages
    });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/v1/classes/instructor/:instructorId
 * Get classes by instructor
 */
export const getClassesByInstructorController = asyncHandler(async (req, res) => {
  const { instructorId } = req.params;
  const result = await applyClassScope(await getClassesByInstructor(instructorId, req.query, req.user), req);
  if (result.success) {
    res.status(200).json({
      success: true, data: result.data, total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages
    });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

export default {
  getAllClassesController,
  getClassByIdController,
  createClassController,
  updateClassController,
  deleteClassController,
  getClassesByProgramController,
  getClassesBySubjectController,
  getClassesByInstructorController
};
