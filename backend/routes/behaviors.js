/**
 * Behaviors API Routes
 * 
 * PURPOSE: Route definitions for behavior operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllBehaviorsController,
  getBehaviorByIdController,
  createBehaviorController,
  updateBehaviorController,
  deleteBehaviorController,
  getBehaviorsByStudentController,
  getBehaviorsByClassController
} from '../controllers/behaviors.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Behavior:
 *       type: object
 *       required:
 *         - userId
 *         - classId
 *         - typeId
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *           description: Behavior unique identifier
 *           example: 1
 *         userId:
 *           type: integer
 *           description: User ID
 *           example: 1
 *         classId:
 *           type: integer
 *           description: Class ID
 *           example: 1
 *         typeId:
 *           type: integer
 *           description: Behavior type ID
 *           example: 1
 *         description:
 *           type: string
 *           description: Behavior description
 *           example: "Excellent participation in class discussion"
 *         descriptionAr:
 *           type: string
 *           description: Behavior description in Arabic
 *           example: "مشاركة ممتازة في المناقشة الصفية"
 *         points:
 *           type: integer
 *           description: Behavior points
 *           example: 5
 *         recordedAt:
 *           type: string
 *           format: date-time
 *           description: Behavior recorded date
 *           example: "2024-01-15T10:30:00Z"
 *         isActive:
 *           type: boolean
 *           description: Whether behavior record is active
 *           example: true
 */

/**
 * @swagger
 * /behaviors:
 *   get:
 *     summary: Get all behaviors
 *     tags: [Behaviors]
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
 *         description: Filter by behavior type ID
 *     responses:
 *       200:
 *         description: List of behaviors
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
 *                     $ref: '#/components/schemas/Behavior'
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
router.get('/', getAllBehaviorsController);

/**
 * @swagger
 * /behaviors/{id}:
 *   get:
 *     summary: Get behavior by ID
 *     tags: [Behaviors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Behavior ID
 *     responses:
 *       200:
 *         description: Behavior details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Behavior'
 *       404:
 *         description: Behavior not found
 */
router.get('/:id', getBehaviorByIdController);

/**
 * @swagger
 * /behaviors:
 *   post:
 *     summary: Create new behavior
 *     tags: [Behaviors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - classId
 *               - typeId
 *               - description
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
 *               description:
 *                 type: string
 *                 example: "Excellent participation in class discussion"
 *               descriptionAr:
 *                 type: string
 *                 example: "مشاركة ممتازة في المناقشة الصفية"
 *               points:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Behavior created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Behavior'
 *                 message:
 *                   type: string
 *                   example: "Behavior created successfully"
 *       400:
 *         description: Invalid input
 */
router.post('/', createBehaviorController);

/**
 * @swagger
 * /behaviors/{id}:
 *   put:
 *     summary: Update behavior
 *     tags: [Behaviors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Behavior ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Updated behavior description"
 *               descriptionAr:
 *                 type: string
 *                 example: "وصف السلوك المحدث"
 *               points:
 *                 type: integer
 *                 example: 10
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Behavior updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Behavior'
 *                 message:
 *                   type: string
 *                   example: "Behavior updated successfully"
 *       404:
 *         description: Behavior not found
 */
router.put('/:id', updateBehaviorController);

/**
 * @swagger
 * /behaviors/{id}:
 *   delete:
 *     summary: Delete behavior
 *     tags: [Behaviors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Behavior ID
 *     responses:
 *       200:
 *         description: Behavior deleted successfully
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
 *                   example: "Behavior deleted successfully"
 *       404:
 *         description: Behavior not found
 */
router.delete('/:id', deleteBehaviorController);

/**
 * @swagger
 * /behaviors/student/{studentId}:
 *   get:
 *     summary: Get behaviors by student ID
 *     tags: [Behaviors]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: List of student behaviors
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
 *                     $ref: '#/components/schemas/Behavior'
 */
router.get('/student/:studentId', getBehaviorsByStudentController);

/**
 * @swagger
 * /behaviors/class/{classId}:
 *   get:
 *     summary: Get behaviors by class ID
 *     tags: [Behaviors]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of class behaviors
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
 *                     $ref: '#/components/schemas/Behavior'
 */
router.get('/class/:classId', getBehaviorsByClassController);

export default router;
