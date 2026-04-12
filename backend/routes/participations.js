/**
 * Participations API Routes
 * 
 * PURPOSE: Route definitions for participation operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllParticipationsController,
  getParticipationByIdController,
  createParticipationController,
  updateParticipationController,
  deleteParticipationController,
  getParticipationsByStudentController,
  getParticipationsByClassController,
  getStudentStatsController,
  getClassStatsController,
  getParticipationsByActivityController
} from '../controllers/participations.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Participation:
 *       type: object
 *       required:
 *         - userId
 *         - activityId
 *         - typeId
 *       properties:
 *         id:
 *           type: integer
 *           description: Participation unique identifier
 *           example: 1
 *         userId:
 *           type: integer
 *           description: User ID
 *           example: 1
 *         activityId:
 *           type: integer
 *           description: Activity ID
 *           example: 1
 *         typeId:
 *           type: integer
 *           description: Participation type ID
 *           example: 1
 *         score:
 *           type: integer
 *           description: Participation score
 *           example: 85
 *         feedback:
 *           type: string
 *           description: Participation feedback
 *           example: "Good participation in class activity"
 *         feedbackAr:
 *           type: string
 *           description: Participation feedback in Arabic
 *           example: "مشاركة جيدة في النشاط الصفي"
 *         participatedAt:
 *           type: string
 *           format: date-time
 *           description: Participation date
 *           example: "2024-01-15T10:30:00Z"
 *         isActive:
 *           type: boolean
 *           description: Whether participation is active
 *           example: true
 */

/**
 * @swagger
 * /participations:
 *   get:
 *     summary: Get all participations
 *     tags: [Participations]
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
 *         name: activityId
 *         schema:
 *           type: integer
 *         description: Filter by activity ID
 *       - in: query
 *         name: typeId
 *         schema:
 *           type: integer
 *         description: Filter by participation type ID
 *     responses:
 *       200:
 *         description: List of participations
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
 *                     $ref: '#/components/schemas/Participation'
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
router.get('/', getAllParticipationsController);

/**
 * @swagger
 * /participations/stats:
 *   get:
 *     summary: Get participation statistics for a student
 *     tags: [Participations]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Student participation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalParticipations:
 *                       type: integer
 *                       example: 15
 *                     totalPoints:
 *                       type: integer
 *                       example: 125
 *                     positiveCount:
 *                       type: integer
 *                       example: 12
 *                     negativeCount:
 *                       type: integer
 *                       example: 3
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           typeId:
 *                             type: integer
 *                           typeName:
 *                             type: string
 *                           isPositive:
 *                             type: boolean
 *                           count:
 *                             type: integer
 *                           totalPoints:
 *                             type: integer
 */
router.get('/stats', getStudentStatsController);

/**
 * @swagger
 * /participations/class-stats:
 *   get:
 *     summary: Get participation statistics for a class
 *     tags: [Participations]
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class participation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalParticipations:
 *                       type: integer
 *                       example: 25
 *                     totalPoints:
 *                       type: integer
 *                       example: 150
 *                     positiveCount:
 *                       type: integer
 *                       example: 20
 *                     negativeCount:
 *                       type: integer
 *                       example: 5
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           typeId:
 *                             type: integer
 *                           typeName:
 *                             type: string
 *                           isPositive:
 *                             type: boolean
 *                           count:
 *                             type: integer
 *                           totalPoints:
 *                             type: integer
 */
router.get('/class-stats', getClassStatsController);

/**
 * @swagger
 * /participations/{id}:
 *   get:
 *     summary: Get participation by ID
 *     tags: [Participations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participation ID
 *     responses:
 *       200:
 *         description: Participation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Participation'
 *       404:
 *         description: Participation not found
 */
router.get('/:id', getParticipationByIdController);

/**
 * @swagger
 * /participations:
 *   post:
 *     summary: Create new participation
 *     tags: [Participations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - activityId
 *               - typeId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               activityId:
 *                 type: integer
 *                 example: 1
 *               typeId:
 *                 type: integer
 *                 example: 1
 *               score:
 *                 type: integer
 *                 example: 85
 *               feedback:
 *                 type: string
 *                 example: "Good participation in class activity"
 *               feedbackAr:
 *                 type: string
 *                 example: "مشاركة جيدة في النشاط الصفي"
 *     responses:
 *       201:
 *         description: Participation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Participation'
 *                 message:
 *                   type: string
 *                   example: "Participation created successfully"
 *       400:
 *         description: Invalid input
 */
router.post('/', createParticipationController);

/**
 * @swagger
 * /participations/{id}:
 *   put:
 *     summary: Update participation
 *     tags: [Participations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: integer
 *                 example: 90
 *               feedback:
 *                 type: string
 *                 example: "Updated participation feedback"
 *               feedbackAr:
 *                 type: string
 *                 example: "ملاحظات المشاركة المحدثة"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Participation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Participation'
 *                 message:
 *                   type: string
 *                   example: "Participation updated successfully"
 *       404:
 *         description: Participation not found
 */
router.put('/:id', updateParticipationController);

/**
 * @swagger
 * /participations/{id}:
 *   delete:
 *     summary: Delete participation
 *     tags: [Participations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participation ID
 *     responses:
 *       200:
 *         description: Participation deleted successfully
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
 *                   example: "Participation deleted successfully"
 *       404:
 *         description: Participation not found
 */
router.delete('/:id', deleteParticipationController);

/**
 * @swagger
 * /participations/student/{studentId}:
 *   get:
 *     summary: Get participations by student ID
 *     tags: [Participations]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: List of student participations
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
 *                     $ref: '#/components/schemas/Participation'
 */
router.get('/student/:studentId', getParticipationsByStudentController);

/**
 * @swagger
 * /participations/class/{classId}:
 *   get:
 *     summary: Get participations by class ID
 *     tags: [Participations]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of class participations
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
 *                     $ref: '#/components/schemas/Participation'
 */
router.get('/class/:classId', getParticipationsByClassController);

/**
 * @swagger
 * /participations/activity/{activityId}:
 *   get:
 *     summary: Get participations by activity ID
 *     tags: [Participations]
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: List of activity participations
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
 *                     $ref: '#/components/schemas/Participation'
 */
router.get('/activity/:activityId', getParticipationsByActivityController);

/**
 * @swagger
 * /participations/class-stats:
 *   get:
 *     summary: Get participation statistics for a class
 *     tags: [Participations]
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class participation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalParticipations:
 *                       type: integer
 *                       example: 45
 *                     totalPoints:
 *                       type: integer
 *                       example: 380
 *                     positiveCount:
 *                       type: integer
 *                       example: 38
 *                     negativeCount:
 *                       type: integer
 *                       example: 7
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           typeId:
 *                             type: integer
 *                           typeName:
 *                             type: string
 *                           isPositive:
 *                             type: boolean
 *                           count:
 *                             type: integer
 *                           totalPoints:
 *                             type: integer
 */
router.get('/class-stats', getClassStatsController);

export default router;
