/**
 * Resources API Routes
 * 
 * PURPOSE: Route definitions for resource operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllResourcesController,
  getResourceByIdController,
  createResourceController,
  updateResourceController,
  deleteResourceController,
  getResourcesByClassController
} from '../controllers/resources.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Resource:
 *       type: object
 *       required:
 *         - titleEn
 *         - classId
 *       properties:
 *         id:
 *           type: integer
 *           description: Resource unique identifier
 *           example: 1
 *         titleEn:
 *           type: string
 *           description: Resource title in English
 *           example: "Course Syllabus"
 *         titleAr:
 *           type: string
 *           description: Resource title in Arabic
 *           example: "منهج المقرر"
 *         descriptionEn:
 *           type: string
 *           description: Resource description in English
 *           example: "Complete course syllabus with topics and schedule"
 *         descriptionAr:
 *           type: string
 *           description: Resource description in Arabic
 *           example: "منهج المقرر الكامل مع المواضيع والجدول الزمني"
 *         fileUrl:
 *           type: string
 *           description: URL to the resource file
 *           example: "https://example.com/files/syllabus.pdf"
 *         fileName:
 *           type: string
 *           description: Original file name
 *           example: "CS101-Syllabus.pdf"
 *         fileSize:
 *           type: integer
 *           description: File size in bytes
 *           example: 2048576
 *         fileType:
 *           type: string
 *           description: File extension/type
 *           example: "pdf"
 *         type:
 *           type: string
 *           description: Resource type (video, link, document)
 *           example: "document"
 *         category:
 *           type: string
 *           description: Resource category
 *           example: "study-materials"
 *         tags:
 *           type: string
 *           description: Comma-separated tags
 *           example: "math,algebra,chapter1"
 *         downloadCount:
 *           type: integer
 *           description: Download counter
 *           example: 25
 *         isRequired:
 *           type: boolean
 *           description: Whether the resource is required
 *           example: true
 *         isActive:
 *           type: boolean
 *           description: Whether the resource is active
 *           example: true
 *         classId:
 *           type: integer
 *           description: Class ID the resource belongs to
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
 *           description: User who created the resource
 *         updater:
 *           type: object
 *           description: User who last updated the resource
 *         class:
 *           type: object
 *           description: Class the resource belongs to
 */

/**
 * @swagger
 * /resources:
 *   get:
 *     summary: Get all resources
 *     description: Retrieve a paginated list of resources with optional filtering
 *     tags: [Resources]
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
 *         description: Search term for title, description, or filename
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: isRequired
 *         schema:
 *           type: boolean
 *         description: Filter by required status
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
 *         description: Resources retrieved successfully
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
 *                     $ref: '#/components/schemas/Resource'
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
router.get('/', getAllResourcesController);

/**
 * @swagger
 * /resources/{id}:
 *   get:
 *     summary: Get resource by ID
 *     description: Retrieve a specific resource by its ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource not found
 */
router.get('/:id', getResourceByIdController);

/**
 * @swagger
 * /resources:
 *   post:
 *     summary: Create new resource
 *     description: Create a new resource with the provided data
 *     tags: [Resources]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titleEn
 *               - classId
 *             properties:
 *               titleEn:
 *                 type: string
 *                 example: "Course Syllabus"
 *               titleAr:
 *                 type: string
 *                 example: "منهج المقرر"
 *               descriptionEn:
 *                 type: string
 *                 example: "Complete course syllabus"
 *               descriptionAr:
 *                 type: string
 *                 example: "منهج المقرر الكامل"
 *               fileUrl:
 *                 type: string
 *                 example: "https://example.com/files/syllabus.pdf"
 *               fileName:
 *                 type: string
 *                 example: "CS101-Syllabus.pdf"
 *               fileSize:
 *                 type: integer
 *                 example: 2048576
 *               fileType:
 *                 type: string
 *                 example: "pdf"
 *               isRequired:
 *                 type: boolean
 *                 example: true
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               classId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *                 message:
 *                   type: string
 *                   example: "Resource created successfully"
 *       400:
 *         description: Bad request - validation error
 */
router.post('/', createResourceController);

/**
 * @swagger
 * /resources/{id}:
 *   put:
 *     summary: Update resource
 *     description: Update an existing resource with new data
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titleEn:
 *                 type: string
 *                 example: "Updated Course Syllabus"
 *               titleAr:
 *                 type: string
 *                 example: "منهج المقرر المحدث"
 *               descriptionEn:
 *                 type: string
 *                 example: "Updated complete course syllabus"
 *               descriptionAr:
 *                 type: string
 *                 example: "منهج المقرر الكامل المحدث"
 *               fileUrl:
 *                 type: string
 *                 example: "https://example.com/files/syllabus-v2.pdf"
 *               fileName:
 *                 type: string
 *                 example: "CS101-Syllabus-v2.pdf"
 *               isRequired:
 *                 type: boolean
 *                 example: false
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *                 message:
 *                   type: string
 *                   example: "Resource updated successfully"
 *       404:
 *         description: Resource not found
 */
router.put('/:id', updateResourceController);

/**
 * @swagger
 * /resources/{id}:
 *   delete:
 *     summary: Delete resource
 *     description: Delete a resource
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
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
 *                   example: "Resource deleted successfully"
 *       404:
 *         description: Resource not found
 */
router.delete('/:id', deleteResourceController);

/**
 * @swagger
 * /resources/class/{classId}:
 *   get:
 *     summary: Get resources by class
 *     description: Retrieve all resources belonging to a specific class
 *     tags: [Resources]
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
 *         name: isRequired
 *         schema:
 *           type: boolean
 *         description: Filter by required status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Class resources retrieved successfully
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
 *                     $ref: '#/components/schemas/Resource'
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
router.get('/class/:classId', getResourcesByClassController);

export default router;
