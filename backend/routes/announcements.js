/**
 * Announcements API Routes
 * 
 * PURPOSE: Route definitions for announcement operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllAnnouncementsController,
  getAnnouncementByIdController,
  createAnnouncementController,
  updateAnnouncementController,
  deleteAnnouncementController,
  getAnnouncementsByProgramController,
  getAnnouncementsByClassController
} from '../controllers/announcements.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       required:
 *         - titleEn
 *         - contentEn
 *       properties:
 *         id:
 *           type: integer
 *           description: Announcement unique identifier
 *           example: 1
 *         titleEn:
 *           type: string
 *           description: Announcement title in English
 *           example: "Holiday Schedule Update"
 *         titleAr:
 *           type: string
 *           description: Announcement title in Arabic
 *           example: "تحديث جدول العطلات"
 *         descriptionEn:
 *           type: string
 *           description: Announcement description in English
 *           example: "Please note the updated holiday schedule for the upcoming semester"
 *         descriptionAr:
 *           type: string
 *           description: Announcement description in Arabic
 *           example: "يرجى ملاحظة جدول العطلات المحدث للفصل الدراسي القادم"
 *         priority:
 *           type: string
 *           description: Announcement priority level
 *           enum: [low, normal, high, urgent]
 *           example: "normal"
 *         targetAudience:
 *           type: string
 *           description: Target audience for the announcement
 *           enum: [all, students, instructors, admin]
 *           example: "all"
 *         programId:
 *           type: integer
 *           description: Program ID (for program-specific announcements)
 *           example: 1
 *         classId:
 *           type: integer
 *           description: Class ID (for class-specific announcements)
 *           example: 1
 *         isActive:
 *           type: boolean
 *           description: Whether the announcement is active
 *           example: true
 *         publishAt:
 *           type: string
 *           format: date-time
 *           description: Publication date
 *           example: "2024-03-01T09:00:00.000Z"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date
 *           example: "2024-03-31T23:59:59.000Z"
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
 *           description: User who created the announcement
 *         updater:
 *           type: object
 *           description: User who last updated the announcement
 *         program:
 *           type: object
 *           description: Program (if program-specific)
 *         class:
 *           type: object
 *           description: Class (if class-specific)
 */

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Get all announcements
 *     description: Retrieve a paginated list of announcements with optional filtering
 *     tags: [Announcements]
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
 *         description: Search term for title or content
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter by program ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: targetAudience
 *         schema:
 *           type: string
 *           enum: [all, students, instructors, admin]
 *         description: Filter by target audience
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
 *         description: Announcements retrieved successfully
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
 *                     $ref: '#/components/schemas/Announcement'
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
router.get('/', getAllAnnouncementsController);

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Get announcement by ID
 *     description: Retrieve a specific announcement by its ID
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       404:
 *         description: Announcement not found
 */
router.get('/:id', getAnnouncementByIdController);

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create new announcement
 *     description: Create a new announcement with the provided data
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titleEn
 *               - contentEn
 *             properties:
 *               titleEn:
 *                 type: string
 *                 example: "Holiday Schedule Update"
 *               titleAr:
 *                 type: string
 *                 example: "تحديث جدول العطلات"
 *               contentEn:
 *                 type: string
 *                 example: "Please note the updated holiday schedule"
 *               contentAr:
 *                 type: string
 *                 example: "يرجى ملاحظة جدول العطلات المحدث"
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 example: "normal"
 *               targetAudience:
 *                 type: string
 *                 enum: [all, students, instructors, admin]
 *                 example: "all"
 *               programId:
 *                 type: integer
 *                 example: 1
 *               classId:
 *                 type: integer
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-01T09:00:00.000Z"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *                 message:
 *                   type: string
 *                   example: "Announcement created successfully"
 *       400:
 *         description: Bad request - validation error
 */
router.post('/', createAnnouncementController);

/**
 * @swagger
 * /announcements/{id}:
 *   put:
 *     summary: Update announcement
 *     description: Update an existing announcement with new data
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleEn:
 *                 type: string
 *                 example: "Updated Holiday Schedule"
 *               titleAr:
 *                 type: string
 *                 example: "جدول العطلات المحدث"
 *               contentEn:
 *                 type: string
 *                 example: "Updated holiday schedule information"
 *               contentAr:
 *                 type: string
 *                 example: "معلومات جدول العطلات المحدث"
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 example: "high"
 *               targetAudience:
 *                 type: string
 *                 enum: [all, students, instructors, admin]
 *                 example: "students"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-02T09:00:00.000Z"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-04-02T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *                 message:
 *                   type: string
 *                   example: "Announcement updated successfully"
 *       404:
 *         description: Announcement not found
 */
router.put('/:id', updateAnnouncementController);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Delete announcement
 *     description: Delete an announcement
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
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
 *                   example: "Announcement deleted successfully"
 *       404:
 *         description: Announcement not found
 */
router.delete('/:id', deleteAnnouncementController);

/**
 * @swagger
 * /announcements/program/{programId}:
 *   get:
 *     summary: Get announcements by program
 *     description: Retrieve all announcements belonging to a specific program
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Program ID
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
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: targetAudience
 *         schema:
 *           type: string
 *           enum: [all, students, instructors, admin]
 *         description: Filter by target audience
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Program announcements retrieved successfully
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
 *                     $ref: '#/components/schemas/Announcement'
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
router.get('/program/:programId', getAnnouncementsByProgramController);

/**
 * @swagger
 * /announcements/class/{classId}:
 *   get:
 *     summary: Get announcements by class
 *     description: Retrieve all announcements belonging to a specific class
 *     tags: [Announcements]
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
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: targetAudience
 *         schema:
 *           type: string
 *           enum: [all, students, instructors, admin]
 *         description: Filter by target audience
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Class announcements retrieved successfully
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
 *                     $ref: '#/components/schemas/Announcement'
 *                 total:
 *                   type: integer
 *                   example: 15
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
router.get('/class/:classId', getAnnouncementsByClassController);

export default router;
