/**
 * Programs Controller
 * 
 * PURPOSE: Handle HTTP requests and responses for program operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import programBusinessService from '../services/programs.js';
import { applyListScope } from '../utils/applyListScope.js';
import { asyncHandler, sendResult } from '../utils/asyncHandler.js';

/**
 * Get all programs
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getProgramsController = asyncHandler(async (req, res) => {
  const result = await applyListScope(req, await programBusinessService.getAllPrograms(req.query), 'program');
  sendResult(res, result);
});

/**
 * Get program by ID
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getProgramByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Program ID is required' });
  }
  const result = await programBusinessService.getProgramById(id, req.query);
  sendResult(res, result);
});

/**
 * Create new program
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createProgramController = asyncHandler(async (req, res) => {
  const user = req.user || null;
  const result = await programBusinessService.createProgram(req.body, user);
  sendResult(res, result, { successStatus: 201 });
});

/**
 * Update program
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateProgramController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Program ID is required' });
  }
  const user = req.user || null;
  const result = await programBusinessService.updateProgram(id, req.body, user);
  sendResult(res, result);
});

/**
 * Delete program (soft delete)
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteProgramController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Program ID is required' });
  }
  const options = { force: req.body?.force || req.query?.force === 'true' };
  const result = await programBusinessService.deleteProgram(id, options);
  sendResult(res, result);
});

export const hardDeleteProgramController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Program ID is required' });
  }
  const result = await programBusinessService.hardDeleteProgram(id);
  sendResult(res, result);
});
