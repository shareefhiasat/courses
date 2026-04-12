/**
 * Activities API Routes
 * 
 * PURPOSE: Route definitions for activity operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllActivitiesController,
  getActivityByIdController,
  createActivityController,
  updateActivityController,
  deleteActivityController,
  getActivitiesByClassController
} from '../controllers/activities.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       required:
 *         - titleEn
 *         - typeId
 *         - classId
 *       properties:
 *         id:
 *           type: integer
 *           description: Activity unique identifier
 *           example: 1
 *         titleEn:
 *           type: string
 *           description: Activity title in English
 *           example: "Midterm Exam"
 *         titleAr:
 *           type: string
 *           description: Activity title in Arabic
 *           example: "امتحان منتصف الفصل"
 *         descriptionEn:
 *           type: string
 *           description: Activity description in English
 *           example: "Comprehensive midterm examination covering chapters 1-5"
 *         descriptionAr:
 *           type: string
 *           description: Activity description in Arabic
 *           example: "امتحان منتصف الفصل الشامل يشمل الفصول 1-5"
 *         typeId:
 *           type: integer
 *           description: Activity type ID
 *           example: 1
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Activity due date
 *           example: "2024-03-15T23:59:59.000Z"
 *         maxScore:
 *           type: number
 *           description: Maximum score for the activity
 *           example: 100
 *         weight:
 *           type: number
 *           description: Activity weight in final grade
 *           example: 0.3
 *         imageUrl:
 *           type: string
 *           description: Activity image URL
 *           example: "https://example.com/images/activity.jpg"
 *         link:
 *           type: string
 *           description: External link for activity
 *           example: "https://example.com/external-resource"
 *         quizId:
 *           type: integer
 *           description: Quiz ID if activity is linked to a quiz
 *           example: 1
 *         allowRetake:
 *           type: boolean
 *           description: Allow quiz retake
 *           example: false
 *         isActive:
 *           type: boolean
 *           description: Whether the activity is active
 *           example: true
 *         classId:
 *           type: integer
 *           description: Class ID the activity belongs to
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         creator:
 *           type: object
 *           description: User who created the activity
 *         updater:
 *           type: object
 *           description: User who last updated the activity
 *         class:
 *           type: object
 *           description: Class the activity belongs to
 *         type:
 *           type: object
 *           description: Activity type information
 */

/**
 * @swagger
 * /activities:
 *   get:
 *     summary: Get all activities
 *     description: Retrieve a paginated list of activities with optional filtering
 *     tags: [Activities]
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
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: typeId
 *         schema:
 *           type: integer
 *         description: Filter by activity type ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *         description: Sort order (asc/desc)
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
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
 *                     $ref: '#/components/schemas/Activity'
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 2
 */
router.get('/', getAllActivitiesController);

/**
 * @swagger
 * /activities/{id}:
 *   get:
 *     summary: Get activity by ID
 *     description: Retrieve a specific activity by its ID
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Activity not found
 */
router.get('/:id', getActivityByIdController);

/**
 * @swagger
 * /activities:
 *   post:
 *     summary: Create new activity
 *     description: Create a new activity with the provided data
 *     tags: [Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titleEn
 *               - typeId
 *               - classId
 *             properties:
 *               titleEn:
 *                 type: string
 *                 example: "Midterm Exam"
 *               titleAr:
 *                 type: string
 *                 example: "امتحان منتصف الفصل"
 *               descriptionEn:
 *                 type: string
 *                 example: "Comprehensive midterm examination"
 *               descriptionAr:
 *                 type: string
 *                 example: "امتحان منتصف الفصل الشامل"
 *               typeId:
 *                 type: integer
 *                 example: 1
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-15T23:59:59.000Z"
 *               maxScore:
 *                 type: number
 *                 example: 100
 *               weight:
 *                 type: number
 *                 example: 0.3
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               classId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Activity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *                 message:
 *                   type: string
 *                   example: "Activity created successfully"
 *       400:
 *         description: Bad request - validation error
 */
router.post('/', createActivityController);

/**
 * @swagger
 * /activities/{id}:
 *   put:
 *     summary: Update activity
 *     description: Update an existing activity with new data
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleEn:
 *                 type: string
 *                 example: "Updated Midterm Exam"
 *               titleAr:
 *                 type: string
 *                 example: "امتحان منتصف الفصل المحدث"
 *               descriptionEn:
 *                 type: string
 *                 example: "Updated comprehensive midterm examination"
 *               descriptionAr:
 *                 type: string
 *                 example: "امتحان منتصف الفصل الشامل المحدث"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-20T23:59:59.000Z"
 *               maxScore:
 *                 type: number
 *                 example: 150
 *               weight:
 *                 type: number
 *                 example: 0.4
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *                 message:
 *                   type: string
 *                   example: "Activity updated successfully"
 *       404:
 *         description: Activity not found
 */
router.put('/:id', updateActivityController);

/**
 * @swagger
 * /activities/{id}:
 *   delete:
 *     summary: Delete activity
 *     description: Delete an activity (only if no submissions exist)
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                 message:
 *                   type: string
 *                   example: "Activity deleted successfully"
 *       404:
 *         description: Activity not found
 *       400:
 *         description: Cannot delete activity with submissions
 */
router.delete('/:id', deleteActivityController);

/**
 * @swagger
 * /activities/class/{classId}:
 *   get:
 *     summary: Get activities by class
 *     description: Retrieve all activities belonging to a specific class
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
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
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Class activities retrieved successfully
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
 *                     $ref: '#/components/schemas/Activity'
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 */
router.get('/class/:classId', getActivitiesByClassController);

export default router;
