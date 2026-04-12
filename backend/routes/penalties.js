/**
 * Penalties API Routes
 * 
 * PURPOSE: Route definitions for penalty operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllPenaltiesController,
  getPenaltyByIdController,
  createPenaltyController,
  updatePenaltyController,
  deletePenaltyController,
  getPenaltiesByStudentController,
  getPenaltiesByClassController
} from '../controllers/penalties.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Penalty:
 *       type: object
 *       required:
 *         - userId
 *         - typeId
 *         - reason
 *       properties:
 *         id:
 *           type: integer
 *           description: Penalty unique identifier
 *           example: 1
 *         userId:
 *           type: integer
 *           description: User ID
 *           example: 1
 *         classId:
 *           type: integer
 *           description: Class ID (optional)
 *           example: 1
 *         typeId:
 *           type: integer
 *           description: Penalty type ID
 *           example: 1
 *         reason:
 *           type: string
 *           description: Penalty reason
 *           example: "Late submission of assignment"
 *         reasonAr:
 *           type: string
 *           description: Penalty reason in Arabic
 *           example: "تسليم متأخر للواجب"
 *         points:
 *           type: integer
 *           description: Penalty points
 *           example: -5
 *         issuedAt:
 *           type: string
 *           format: date-time
 *           description: Penalty issued date
 *           example: "2024-01-15T10:30:00Z"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Penalty expiration date
 *           example: "2024-02-15T10:30:00Z"
 *         isActive:
 *           type: boolean
 *           description: Whether penalty is active
 *           example: true
 */

/**
 * @swagger
 * /penalties:
 *   get:
 *     summary: Get all penalties
 *     tags: [Penalties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: typeId
 *         schema:
 *           type: integer
 *         description: Filter by penalty type ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of penalties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Penalty'
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 */
router.get('/', getAllPenaltiesController);

/**
 * @swagger
 * /penalties/{id}:
 *   get:
 *     summary: Get penalty by ID
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Penalty ID
 *     responses:
 *       200:
 *         description: Penalty details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Penalty'
 *       404:
 *         description: Penalty not found
 */
router.get('/:id', getPenaltyByIdController);

/**
 * @swagger
 * /penalties:
 *   post:
 *     summary: Create new penalty
 *     tags: [Penalties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - typeId
 *               - reason
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               classId:
 *                 type: integer
 *                 example: 1
 *               typeId:
 *                 type: integer
 *                 example: 1
 *               reason:
 *                 type: string
 *                 example: "Late submission of assignment"
 *               reasonAr:
 *                 type: string
 *                 example: "تسليم متأخر للواجب"
 *               points:
 *                 type: integer
 *                 example: -5
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-02-15T10:30:00Z"
 *     responses:
 *       201:
 *         description: Penalty created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Penalty'
 *                 message:
 *                   type: string
 *                   example: "Penalty created successfully"
 *       400:
 *         description: Invalid input
 */
router.post('/', createPenaltyController);

/**
 * @swagger
 * /penalties/{id}:
 *   put:
 *     summary: Update penalty
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Penalty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Updated penalty reason"
 *               reasonAr:
 *                 type: string
 *                 example: "سبب العقوبة المحدث"
 *               points:
 *                 type: integer
 *                 example: -10
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-15T10:30:00Z"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Penalty updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Penalty'
 *                 message:
 *                   type: string
 *                   example: "Penalty updated successfully"
 *       404:
 *         description: Penalty not found
 */
router.put('/:id', updatePenaltyController);

/**
 * @swagger
 * /penalties/{id}:
 *   delete:
 *     summary: Delete penalty
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Penalty ID
 *     responses:
 *       200:
 *         description: Penalty deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Penalty deleted successfully"
 *       404:
 *         description: Penalty not found
 */
router.delete('/:id', deletePenaltyController);

/**
 * @swagger
 * /penalties/student/{studentId}:
 *   get:
 *     summary: Get penalties by student ID
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: List of student penalties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Penalty'
 */
router.get('/student/:studentId', getPenaltiesByStudentController);

/**
 * @swagger
 * /penalties/class/{classId}:
 *   get:
 *     summary: Get penalties by class ID
 *     tags: [Penalties]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of class penalties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Penalty'
 */
router.get('/class/:classId', getPenaltiesByClassController);

export default router;
