/**
 * Quizzes API Routes
 * 
 * PURPOSE: Route definitions for quiz operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllQuizzesController,
  getQuizByIdController,
  createQuizController,
  updateQuizController,
  deleteQuizController,
  getQuizzesByCreatorController,
  getQuizStatsController
} from '../controllers/quizzes.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Quiz:
 *       type: object
 *       required:
 *         - titleEn
 *         - createdBy
 *       properties:
 *         id:
 *           type: integer
 *           description: Quiz unique identifier
 *           example: 1
 *         titleEn:
 *           type: string
 *           description: Quiz title in English
 *           example: "Midterm Exam"
 *         titleAr:
 *           type: string
 *           description: Quiz title in Arabic
 *           example: "امتحان منتصف الفصل"
 *         descriptionEn:
 *           type: string
 *           description: Quiz description in English
 *           example: "Comprehensive midterm examination"
 *         descriptionAr:
 *           type: string
 *           description: Quiz description in Arabic
 *           example: "امتحان منتصف الفصل الشامل"
 *         duration:
 *           type: integer
 *           description: Quiz duration in minutes
 *           example: 60
 *         maxAttempts:
 *           type: integer
 *           description: Maximum number of attempts allowed
 *           example: 1
 *         passingScore:
 *           type: number
 *           description: Minimum passing score percentage
 *           example: 60
 *         randomizeQuestions:
 *           type: boolean
 *           description: Whether to randomize question order
 *           example: false
 *         randomizeAnswers:
 *           type: boolean
 *           description: Whether to randomize answer order
 *           example: false
 *         showCorrectAnswers:
 *           type: boolean
 *           description: Whether to show correct answers after submission
 *           example: false
 *         isActive:
 *           type: boolean
 *           description: Whether the quiz is active
 *           example: true
 *         createdBy:
 *           type: integer
 *           description: User ID who created the quiz
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/quizzes:
 *   get:
 *     summary: Get all quizzes
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: Filter by creator user ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of quizzes
 *       500:
 *         description: Server error
 */
router.get('/', getAllQuizzesController);

/**
 * @swagger
 * /api/quizzes/stats:
 *   get:
 *     summary: Get quiz statistics
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: quizId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz statistics
 *       500:
 *         description: Server error
 */
router.get('/stats', getQuizStatsController);

/**
 * @swagger
 * /api/quizzes/creator/:userId:
 *   get:
 *     summary: Get quizzes by creator
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of quizzes by creator
 *       500:
 *         description: Server error
 */
router.get('/creator/:userId', getQuizzesByCreatorController);

/**
 * @swagger
 * /api/quizzes/:id:
 *   get:
 *     summary: Get quiz by ID
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz details
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getQuizByIdController);

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Create a new quiz
 *     tags: [Quizzes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titleEn
 *               - createdBy
 *             properties:
 *               titleEn:
 *                 type: string
 *               titleAr:
 *                 type: string
 *               descriptionEn:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               duration:
 *                 type: integer
 *               maxAttempts:
 *                 type: integer
 *               passingScore:
 *                 type: number
 *               randomizeQuestions:
 *                 type: boolean
 *               randomizeAnswers:
 *                 type: boolean
 *               showCorrectAnswers:
 *                 type: boolean
 *               createdBy:
 *                 type: integer
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', createQuizController);

/**
 * @swagger
 * /api/quizzes/:id:
 *   put:
 *     summary: Update a quiz
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleEn:
 *                 type: string
 *               titleAr:
 *                 type: string
 *               descriptionEn:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               duration:
 *                 type: integer
 *               maxAttempts:
 *                 type: integer
 *               passingScore:
 *                 type: number
 *               randomizeQuestions:
 *                 type: boolean
 *               randomizeAnswers:
 *                 type: boolean
 *               showCorrectAnswers:
 *                 type: boolean
 *               updatedBy:
 *                 type: integer
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 *       404:
 *         description: Quiz not found
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.put('/:id', updateQuizController);

/**
 * @swagger
 * /api/quizzes/:id:
 *   delete:
 *     summary: Delete a quiz (soft delete)
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteQuizController);

export default router;
