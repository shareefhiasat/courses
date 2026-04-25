/**
 * Classrooms API Routes
 * 
 * PURPOSE: Route definitions for classroom operations
 * ARCHITECTURE: Routes → Controllers → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllClassroomsController,
  getClassroomByIdController,
  createClassroomController,
  updateClassroomController,
  deleteClassroomController,
  getClassroomsByProgramController,
  getAvailableClassroomsController
} from '../controllers/classrooms.js';

const router = Router();

/**
 * @swagger
 * /classrooms:
 *   get:
 *     summary: Get all classrooms
 *     tags: [Classrooms]
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter by program ID
 *     responses:
 *       200:
 *         description: List of classrooms
 */
router.get('/', getAllClassroomsController);

/**
 * @swagger
 * /classrooms/available:
 *   get:
 *     summary: Get available classrooms for a date/time slot
 *     tags: [Classrooms]
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
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter by program ID
 *     responses:
 *       200:
 *         description: List of available classrooms
 */
router.get('/available', getAvailableClassroomsController);

/**
 * @swagger
 * /classrooms/program/{programId}:
 *   get:
 *     summary: Get classrooms by program
 *     tags: [Classrooms]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of classrooms for the program
 */
router.get('/program/:programId', getClassroomsByProgramController);

/**
 * @swagger
 * /classrooms/{id}:
 *   get:
 *     summary: Get classroom by ID
 *     tags: [Classrooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Classroom details
 *       404:
 *         description: Classroom not found
 */
router.get('/:id', getClassroomByIdController);

/**
 * @swagger
 * /classrooms:
 *   post:
 *     summary: Create a new classroom
 *     tags: [Classrooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programId
 *               - code
 *               - nameEn
 *               - capacity
 *             properties:
 *               programId:
 *                 type: integer
 *               code:
 *                 type: string
 *               nameEn:
 *                 type: string
 *               nameAr:
 *                 type: string
 *               locationEn:
 *                 type: string
 *               locationAr:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               equipment:
 *                 type: array
 *                 items:
 *                   type: string
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Available, UnderMaintenance, Closed]
 *     responses:
 *       201:
 *         description: Classroom created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createClassroomController);

/**
 * @swagger
 * /classrooms/{id}:
 *   put:
 *     summary: Update a classroom
 *     tags: [Classrooms]
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
 *               code:
 *                 type: string
 *               nameEn:
 *                 type: string
 *               nameAr:
 *                 type: string
 *               locationEn:
 *                 type: string
 *               locationAr:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               equipment:
 *                 type: array
 *                 items:
 *                   type: string
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Available, UnderMaintenance, Closed]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Classroom updated successfully
 *       404:
 *         description: Classroom not found
 */
router.put('/:id', updateClassroomController);

/**
 * @swagger
 * /classrooms/{id}:
 *   delete:
 *     summary: Delete a classroom
 *     tags: [Classrooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Classroom deleted successfully
 *       404:
 *         description: Classroom not found
 */
router.delete('/:id', deleteClassroomController);

export default router;
