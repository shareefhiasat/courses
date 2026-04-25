/**
 * Time Slots API Routes
 * 
 * PURPOSE: Route definitions for time slot operations
 * ARCHITECTURE: Routes → Controllers → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllTimeSlotsController,
  getTimeSlotByIdController,
  createTimeSlotController,
  updateTimeSlotController,
  deleteTimeSlotController,
  getTimeSlotsByProgramController,
  getSchedulableTimeSlotsController,
  bulkInitDefaultsController
} from '../controllers/time-slots.js';

const router = Router();

/**
 * @swagger
 * /time-slots:
 *   get:
 *     summary: Get all time slots
 *     tags: [TimeSlots]
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter by program ID
 *     responses:
 *       200:
 *         description: List of time slots
 */
router.get('/', getAllTimeSlotsController);

/**
 * @swagger
 * /time-slots/schedulable:
 *   get:
 *     summary: Get schedulable time slots (excludes breaks)
 *     tags: [TimeSlots]
 *     parameters:
 *       - in: query
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Program ID
 *     responses:
 *       200:
 *         description: List of schedulable time slots
 */
router.get('/schedulable', getSchedulableTimeSlotsController);

/**
 * @swagger
 * /time-slots/bulk-init:
 *   post:
 *     summary: Initialize default time slots for a program
 *     tags: [TimeSlots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programId
 *             properties:
 *               programId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Default time slots created
 */
router.post('/bulk-init', bulkInitDefaultsController);

/**
 * @swagger
 * /time-slots/program/{programId}:
 *   get:
 *     summary: Get time slots by program
 *     tags: [TimeSlots]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of time slots for the program
 */
router.get('/program/:programId', getTimeSlotsByProgramController);

/**
 * @swagger
 * /time-slots/{id}:
 *   get:
 *     summary: Get time slot by ID
 *     tags: [TimeSlots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Time slot details
 *       404:
 *         description: Time slot not found
 */
router.get('/:id', getTimeSlotByIdController);

/**
 * @swagger
 * /time-slots:
 *   post:
 *     summary: Create a new time slot
 *     tags: [TimeSlots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programId
 *               - labelEn
 *               - startTime
 *               - endTime
 *               - durationMinutes
 *               - sortOrder
 *             properties:
 *               programId:
 *                 type: integer
 *               labelEn:
 *                 type: string
 *               labelAr:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "09:50"
 *               durationMinutes:
 *                 type: integer
 *               isBreak:
 *                 type: boolean
 *               breakType:
 *                 type: string
 *                 enum: [TeaBreak, PrayerBreak, LunchBreak]
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Time slot created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createTimeSlotController);

/**
 * @swagger
 * /time-slots/{id}:
 *   put:
 *     summary: Update a time slot
 *     tags: [TimeSlots]
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
 *               labelEn:
 *                 type: string
 *               labelAr:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               durationMinutes:
 *                 type: integer
 *               isBreak:
 *                 type: boolean
 *               breakType:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Time slot updated successfully
 *       404:
 *         description: Time slot not found
 */
router.put('/:id', updateTimeSlotController);

/**
 * @swagger
 * /time-slots/{id}:
 *   delete:
 *     summary: Delete a time slot
 *     tags: [TimeSlots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Time slot deleted successfully
 *       404:
 *         description: Time slot not found
 */
router.delete('/:id', deleteTimeSlotController);

export default router;
