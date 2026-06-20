/**
 * Classes API Routes
 * 
 * PURPOSE: Route definitions for class operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllClassesController,
  getClassByIdController,
  createClassController,
  updateClassController,
  deleteClassController,
  getClassesByProgramController,
  getClassesBySubjectController,
  getClassesByInstructorController
} from '../controllers/classes.js';
import { screenOps } from '../middleware/requirePermission.js';

const router = Router();
const ops = screenOps('classes');

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       required:
 *         - code
 *         - nameEn
 *         - programId
 *         - subjectId
 *       properties:
 *         id:
 *           type: integer
 *           description: Class unique identifier
 *           example: 1
 *         code:
 *           type: string
 *           description: Class code
 *           example: "CS101-01"
 *         nameEn:
 *           type: string
 *           description: Class name in English
 *           example: "Computer Science 101 - Section 01"
 *         nameAr:
 *           type: string
 *           description: Class name in Arabic
 *           example: "علوم الحاسوب 101 - الشعبة 01"
 *         description:
 *           type: string
 *           description: Class description
 *           example: "Introduction to Computer Science"
 *         maxCapacity:
 *           type: integer
 *           description: Maximum number of students
 *           example: 30
 *         isActive:
 *           type: boolean
 *           description: Whether the class is active
 *           example: true
 *         programId:
 *           type: integer
 *           description: Program ID the class belongs to
 *           example: 1
 *         subjectId:
 *           type: integer
 *           description: Subject ID the class belongs to
 *           example: 1
 *         instructorId:
 *           type: integer
 *           description: Instructor ID assigned to the class
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
 *           description: User who created the class
 *         updater:
 *           type: object
 *           description: User who last updated the class
 *         program:
 *           type: object
 *           description: Program the class belongs to
 *         subject:
 *           type: object
 *           description: Subject the class belongs to
 *         instructor:
 *           type: object
 *           description: Instructor assigned to the class
 */

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes
 *     description: Retrieve a paginated list of classes with optional filtering
 *     tags: [Classes]
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
 *         description: Search term for code, nameEn, or nameAr
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter by program ID
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: integer
 *         description: Filter by subject ID
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: integer
 *         description: Filter by instructor ID
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
 *         description: Classes retrieved successfully
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
 *                     $ref: '#/components/schemas/Class'
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
router.get('/', ops.view, getAllClassesController);

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     description: Retrieve a specific class by its ID
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
 */
router.get('/:id', ops.view, getClassByIdController);

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create new class
 *     description: Create a new class with the provided data
 *     tags: [Classes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - nameEn
 *               - programId
 *               - subjectId
 *             properties:
 *               code:
 *                 type: string
 *                 example: "CS101-01"
 *               nameEn:
 *                 type: string
 *                 example: "Computer Science 101 - Section 01"
 *               nameAr:
 *                 type: string
 *                 example: "علوم الحاسوب 101 - الشعبة 01"
 *               description:
 *                 type: string
 *                 example: "Introduction to Computer Science"
 *               maxCapacity:
 *                 type: integer
 *                 example: 30
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               programId:
 *                 type: integer
 *                 example: 1
 *               subjectId:
 *                 type: integer
 *                 example: 1
 *               instructorId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *                 message:
 *                   type: string
 *                   example: "Class created successfully"
 *       400:
 *         description: Bad request - validation error
 */
router.post('/', ops.create, createClassController);

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update class
 *     description: Update an existing class with new data
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "CS101-02"
 *               nameEn:
 *                 type: string
 *                 example: "Computer Science 101 - Section 02"
 *               nameAr:
 *                 type: string
 *                 example: "علوم الحاسوب 101 - الشعبة 02"
 *               description:
 *                 type: string
 *                 example: "Advanced Computer Science"
 *               maxCapacity:
 *                 type: integer
 *                 example: 35
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               instructorId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *                 message:
 *                   type: string
 *                   example: "Class updated successfully"
 *       404:
 *         description: Class not found
 */
router.put('/:id', ops.update, updateClassController);

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete class
 *     description: Delete a class (only if no dependencies exist)
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
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
 *                   example: "Class deleted successfully"
 *       404:
 *         description: Class not found
 *       400:
 *         description: Cannot delete class with dependencies
 */
router.delete('/:id', ops.delete, deleteClassController);

/**
 * @swagger
 * /classes/program/{programId}:
 *   get:
 *     summary: Get classes by program
 *     description: Retrieve all classes belonging to a specific program
 *     tags: [Classes]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Program classes retrieved successfully
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
 *                     $ref: '#/components/schemas/Class'
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
router.get('/program/:programId', ops.view, getClassesByProgramController);

/**
 * @swagger
 * /classes/subject/{subjectId}:
 *   get:
 *     summary: Get classes by subject
 *     description: Retrieve all classes belonging to a specific subject
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
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
 *         description: Subject classes retrieved successfully
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
 *                     $ref: '#/components/schemas/Class'
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
router.get('/subject/:subjectId', ops.view, getClassesBySubjectController);

/**
 * @swagger
 * /classes/instructor/{instructorId}:
 *   get:
 *     summary: Get classes by instructor
 *     description: Retrieve all classes assigned to a specific instructor
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Instructor ID
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
 *         description: Instructor classes retrieved successfully
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
 *                     $ref: '#/components/schemas/Class'
 *                 total:
 *                   type: integer
 *                   example: 10
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
router.get('/instructor/:instructorId', ops.view, getClassesByInstructorController);

export default router;
