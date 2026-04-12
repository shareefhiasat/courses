/**
 * Priority Types Routes
 * Defines API routes for priority types operations
 */

import express from 'express';
import {
  getAllPriorityTypesController,
  getPriorityTypeByIdController,
  createPriorityTypeController,
  updatePriorityTypeController,
  deletePriorityTypeController
} from '../controllers/priority-types.js';

const router = express.Router();

/**
 * @route GET /api/v1/priority-types
 * @desc Get all priority types
 * @access Public
 */
router.get('/', getAllPriorityTypesController);

/**
 * @route GET /api/v1/priority-types/:id
 * @desc Get priority type by ID
 * @access Public
 */
router.get('/:id', getPriorityTypeByIdController);

/**
 * @route POST /api/v1/priority-types
 * @desc Create new priority type
 * @access Private
 */
router.post('/', createPriorityTypeController);

/**
 * @route PUT /api/v1/priority-types/:id
 * @desc Update priority type
 * @access Private
 */
router.put('/:id', updatePriorityTypeController);

/**
 * @route DELETE /api/v1/priority-types/:id
 * @desc Delete priority type (soft delete)
 * @access Private
 */
router.delete('/:id', deletePriorityTypeController);

export default router;
