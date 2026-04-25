/**
 * Teacher Availability API Routes
 * 
 * PURPOSE: Route definitions for teacher availability operations
 * ARCHITECTURE: Routes → Controllers → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllTeacherAvailabilitiesController,
  getTeacherAvailabilityByIdController,
  getTeacherAvailabilityByUserIdController,
  createTeacherAvailabilityController,
  updateTeacherAvailabilityController,
  deleteTeacherAvailabilityController,
  getAvailableTeachersController
} from '../controllers/teacher-availability.js';

const router = Router();

/**
 * @swagger
 * /teacher-availability:
 *   get:
 *     summary: Get all teacher availabilities
 *     tags: [TeacherAvailability]
 *     responses:
 *       200:
 *         description: List of teacher availabilities
 */
router.get('/', getAllTeacherAvailabilitiesController);

/**
 * @swagger
 * /teacher-availability/available:
 *   get:
 *     summary: Get available teachers for a date/time slot
 *     tags: [TeacherAvailability]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date (YYYY-MM-DD)
 *       - in: query
 *         name: timeSlotId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Time slot ID
 *     responses:
 *       200:
 *         description: List of available teachers
 */
router.get('/available', getAvailableTeachersController);

/**
 * @swagger
 * /teacher-availability/user/{userId}:
 *   get:
 *     summary: Get teacher availability by user ID
 *     tags: [TeacherAvailability]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Teacher availability details
 *       404:
 *         description: Teacher availability not found
 */
router.get('/user/:userId', getTeacherAvailabilityByUserIdController);

/**
 * @swagger
 * /teacher-availability/{id}:
 *   get:
 *     summary: Get teacher availability by ID
 *     tags: [TeacherAvailability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Teacher availability details
 *       404:
 *         description: Teacher availability not found
 */
router.get('/:id', getTeacherAvailabilityByIdController);

/**
 * @swagger
 * /teacher-availability:
 *   post:
 *     summary: Create a new teacher availability record
 *     tags: [TeacherAvailability]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - availableDays
 *             properties:
 *               userId:
 *                 type: integer
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
 *               maxSessionsPerDay:
 *                 type: integer
 *                 default: 3
 *               status:
 *                 type: string
 *                 enum: [Active, OnLeave, Inactive]
 *                 default: Active
 *               contactPhone:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Teacher availability created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createTeacherAvailabilityController);

/**
 * @swagger
 * /teacher-availability/{id}:
 *   put:
 *     summary: Update teacher availability
 *     tags: [TeacherAvailability]
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
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxSessionsPerDay:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Active, OnLeave, Inactive]
 *               contactPhone:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Teacher availability updated successfully
 *       404:
 *         description: Teacher availability not found
 */
router.put('/:id', updateTeacherAvailabilityController);

/**
 * @swagger
 * /teacher-availability/{id}:
 *   delete:
 *     summary: Delete teacher availability
 *     tags: [TeacherAvailability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Teacher availability deleted successfully
 *       404:
 *         description: Teacher availability not found
 */
router.delete('/:id', deleteTeacherAvailabilityController);

export default router;
