/**
 * Classroom Availability API Routes
 * 
 * PURPOSE: Route definitions for classroom availability operations
 * ARCHITECTURE: Routes → Controllers → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllClassroomAvailabilitiesController,
  createClassroomAvailabilityController,
  updateClassroomAvailabilityController,
  deleteClassroomAvailabilityController,
  validateClassroomAvailabilityChangeController
} from '../controllers/classroom-availability.js';

const router = Router();

/**
 * @swagger
 * /classroom-availability:
 *   get:
 *     summary: Get all classroom availability entries
 *     tags: [ClassroomAvailability]
 *     parameters:
 *       - in: query
 *         name: classroomId
 *         schema:
 *           type: integer
 *         description: Filter by classroom ID
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: string
 *         description: Filter by day of week (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *         description: Filter by reason (Maintenance, Reserved, Other)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of classroom availability entries
 */
router.get('/', getAllClassroomAvailabilitiesController);

router.post('/validate-change', validateClassroomAvailabilityChangeController);

/**
 * @swagger
 * /classroom-availability:
 *   post:
 *     summary: Create a classroom availability entry
 *     tags: [ClassroomAvailability]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classroomId
 *               - dayOfWeek
 *               - startTime
 *               - endTime
 *             properties:
 *               classroomId:
 *                 type: integer
 *               dayOfWeek:
 *                 type: string
 *                 enum: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
 *               startTime:
 *                 type: string
 *                 pattern: ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
 *                 description: HH:mm format
 *               endTime:
 *                 type: string
 *                 pattern: ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
 *                 description: HH:mm format
 *               reason:
 *                 type: string
 *                 enum: [Maintenance, Reserved, Other]
 *               isRecurring:
 *                 type: boolean
 *                 default: true
 *               specificDate:
 *                 type: string
 *                 format: date-time
 *                 description: For one-time unavailability
 *               status:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               createdBy:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Classroom availability entry created successfully
 *       400:
 *         description: Invalid input or time conflict
 */
router.post('/', createClassroomAvailabilityController);

/**
 * @swagger
 * /classroom-availability/{id}:
 *   put:
 *     summary: Update a classroom availability entry
 *     tags: [ClassroomAvailability]
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
 *               dayOfWeek:
 *                 type: string
 *                 enum: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
 *               startTime:
 *                 type: string
 *                 pattern: ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
 *               endTime:
 *                 type: string
 *                 pattern: ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
 *               reason:
 *                 type: string
 *                 enum: [Maintenance, Reserved, Other]
 *               isRecurring:
 *                 type: boolean
 *               specificDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               updatedBy:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Classroom availability entry updated successfully
 *       400:
 *         description: Invalid input or time conflict
 *       404:
 *         description: Classroom availability entry not found
 */
router.put('/:id', updateClassroomAvailabilityController);

/**
 * @swagger
 * /classroom-availability/{id}:
 *   delete:
 *     summary: Delete a classroom availability entry
 *     tags: [ClassroomAvailability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Classroom availability entry deleted successfully
 *       404:
 *         description: Classroom availability entry not found
 */
router.delete('/:id', deleteClassroomAvailabilityController);

export default router;
