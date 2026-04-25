/**
 * Holidays API Routes
 * 
 * PURPOSE: Route definitions for holiday operations
 * ARCHITECTURE: Routes → Controllers → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllHolidaysController,
  getHolidayByIdController,
  createHolidayController,
  updateHolidayController,
  deleteHolidayController,
  getHolidaysByProgramController,
  getUpcomingHolidaysController
} from '../controllers/holidays.js';

const router = Router();

/**
 * @swagger
 * /holidays:
 *   get:
 *     summary: Get all holidays (global + program-specific)
 *     tags: [Holidays]
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter by program ID (includes global holidays)
 *     responses:
 *       200:
 *         description: List of holidays
 */
router.get('/', getAllHolidaysController);

/**
 * @swagger
 * /holidays/upcoming:
 *   get:
 *     summary: Get upcoming holidays
 *     tags: [Holidays]
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter by program ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum number of holidays to return
 *     responses:
 *       200:
 *         description: List of upcoming holidays
 */
router.get('/upcoming', getUpcomingHolidaysController);

/**
 * @swagger
 * /holidays/program/{programId}:
 *   get:
 *     summary: Get holidays by program (including global)
 *     tags: [Holidays]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of holidays for the program
 */
router.get('/program/:programId', getHolidaysByProgramController);

/**
 * @swagger
 * /holidays/{id}:
 *   get:
 *     summary: Get holiday by ID
 *     tags: [Holidays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Holiday details
 *       404:
 *         description: Holiday not found
 */
router.get('/:id', getHolidayByIdController);

/**
 * @swagger
 * /holidays:
 *   post:
 *     summary: Create a new holiday
 *     tags: [Holidays]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descriptionEn
 *               - type
 *               - startDate
 *               - endDate
 *             properties:
 *               programId:
 *                 type: integer
 *                 description: null = global holiday
 *               descriptionEn:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Public, National, SemesterBreak, Summer, Winter, Other]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isRecurring:
 *                 type: boolean
 *               recurrencePattern:
 *                 type: string
 *                 example: "yearly"
 *     responses:
 *       201:
 *         description: Holiday created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createHolidayController);

/**
 * @swagger
 * /holidays/{id}:
 *   put:
 *     summary: Update a holiday
 *     tags: [Holidays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descriptionEn:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Public, National, SemesterBreak, Summer, Winter, Other]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isRecurring:
 *                 type: boolean
 *               recurrencePattern:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Holiday updated successfully
 *       404:
 *         description: Holiday not found
 */
router.put('/:id', updateHolidayController);

/**
 * @swagger
 * /holidays/{id}:
 *   delete:
 *     summary: Delete a holiday
 *     tags: [Holidays]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Holiday deleted successfully
 *       404:
 *         description: Holiday not found
 */
router.delete('/:id', deleteHolidayController);

export default router;
