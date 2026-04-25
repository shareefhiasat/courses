/**
 * Schedule Sessions API Routes
 * 
 * PURPOSE: Route definitions for schedule session operations
 * ARCHITECTURE: Routes → Controllers → Conflict Detection Service → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllScheduleSessionsController,
  getScheduleSessionsByRangeController,
  getScheduleSessionByIdController,
  checkConflictsController,
  createScheduleSessionController,
  updateScheduleSessionController,
  cancelScheduleSessionController,
  deleteScheduleSessionController,
  bulkCreateScheduleSessionsController
} from '../controllers/schedule-sessions.js';

const router = Router();

/**
 * @swagger
 * /schedule-sessions:
 *   get:
 *     summary: Get all schedule sessions
 *     tags: [ScheduleSessions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: instructorUserId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: classroomId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: timeSlotId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: isCancelled
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of schedule sessions
 */
router.get('/', getAllScheduleSessionsController);

/**
 * @swagger
 * /schedule-sessions/range:
 *   get:
 *     summary: Get schedule sessions by date range
 *     tags: [ScheduleSessions]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: instructorUserId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: classroomId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of schedule sessions in date range
 */
router.get('/range', getScheduleSessionsByRangeController);

/**
 * @swagger
 * /schedule-sessions/check-conflicts:
 *   post:
 *     summary: Check for scheduling conflicts without creating session
 *     tags: [ScheduleSessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructorUserId
 *               - date
 *               - timeSlotId
 *             properties:
 *               instructorUserId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlotId:
 *                 type: integer
 *               classroomId:
 *                 type: integer
 *               programId:
 *                 type: integer
 *               excludeSessionId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Conflict detection result
 */
router.post('/check-conflicts', checkConflictsController);

/**
 * @swagger
 * /schedule-sessions/bulk:
 *   post:
 *     summary: Bulk create schedule sessions
 *     tags: [ScheduleSessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessions
 *             properties:
 *               sessions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Sessions created successfully
 *       409:
 *         description: Scheduling conflicts detected
 */
router.post('/bulk', bulkCreateScheduleSessionsController);

/**
 * @swagger
 * /schedule-sessions/:id:
 *   get:
 *     summary: Get schedule session by ID
 *     tags: [ScheduleSessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule session details
 *       404:
 *         description: Schedule session not found
 */
router.get('/:id', getScheduleSessionByIdController);

/**
 * @swagger
 * /schedule-sessions:
 *   post:
 *     summary: Create a new schedule session
 *     tags: [ScheduleSessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - subjectId
 *               - instructorUserId
 *               - timeSlotId
 *               - date
 *             properties:
 *               classId:
 *                 type: integer
 *               subjectId:
 *                 type: integer
 *               instructorUserId:
 *                 type: integer
 *               classroomId:
 *                 type: integer
 *               timeSlotId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Schedule session created successfully
 *       409:
 *         description: Scheduling conflict detected
 *       400:
 *         description: Invalid input
 */
router.post('/', createScheduleSessionController);

/**
 * @swagger
 * /schedule-sessions/:id:
 *   put:
 *     summary: Update a schedule session
 *     tags: [ScheduleSessions]
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
 *               classroomId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schedule session updated successfully
 *       409:
 *         description: Scheduling conflict detected
 *       404:
 *         description: Schedule session not found
 */
router.put('/:id', updateScheduleSessionController);

/**
 * @swagger
 * /schedule-sessions/:id/cancel:
 *   post:
 *     summary: Cancel a schedule session
 *     tags: [ScheduleSessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schedule session cancelled successfully
 *       404:
 *         description: Schedule session not found
 */
router.post('/:id/cancel', cancelScheduleSessionController);

/**
 * @swagger
 * /schedule-sessions/:id:
 *   delete:
 *     summary: Delete a schedule session
 *     tags: [ScheduleSessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule session deleted successfully
 *       404:
 *         description: Schedule session not found
 */
router.delete('/:id', deleteScheduleSessionController);

export default router;
