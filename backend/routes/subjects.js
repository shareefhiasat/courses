/**
 * Subjects Routes - API Endpoints
 * 
 * PURPOSE: Route definitions for subject operations
 * ARCHITECTURE: HTTP Requests → Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllSubjectsController,
  getSubjectByIdController,
  createSubjectController,
  updateSubjectController,
  deleteSubjectController,
  getSubjectsByProgramController
} from '../controllers/subjects.js';
import { screenOps } from '../middleware/requirePermission.js';

const router = Router();
const ops = screenOps('subjects');

/**
 * @swagger
 * components:
 *   schemas:
 *     Subject:
 *       type: object
 *       required:
 *         - code
 *         - nameEn
 *         - programId
 *       properties:
 *         id:
 *           type: integer
 *           description: Subject unique identifier
 *           example: 1
 *         code:
 *           type: string
 *           description: Subject code
 *           example: "MATH101"
 *         nameEn:
 *           type: string
 *           description: Subject name in English
 *           example: "Mathematics 101"
 *         nameAr:
 *           type: string
 *           description: Subject name in Arabic
 *           example: "رياضيات 101"
 *         description:
 *           type: string
 *           description: Subject description
 *           example: "Fundamental mathematics course"
 *         credits:
 *           type: integer
 *           description: Number of credits
 *           example: 3
 *         isActive:
 *           type: boolean
 *           description: Whether the subject is active
 *           example: true
 *         programId:
 *           type: integer
 *           description: Program ID the subject belongs to
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
 *           description: User who created the subject
 *         updater:
 *           type: object
 *           description: User who last updated the subject
 *         program:
 *           type: object
 *           description: Program the subject belongs to
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Get all subjects
 *     description: Retrieve a paginated list of subjects with optional filtering
 *     tags: [Subjects]
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
 *         description: Subjects retrieved successfully
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
 *                     $ref: '#/components/schemas/Subject'
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
router.get('/', ops.view, getAllSubjectsController);

/**
 * @swagger
 * /subject-types:
 *   get:
 *     summary: Get subject types
 *     description: Retrieve list of subject type options
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: Subject types retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "core"
 *                       name:
 *                         type: string
 *                         example: "Core Subject"
 *                       description:
 *                         type: string
 *                         example: "Fundamental subject for the program"
 */
router.get('/subject-types', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'core', name: 'Core Subject', description: 'Fundamental subject for the program' },
      { id: 'elective', name: 'Elective Subject', description: 'Optional subject students can choose' },
      { id: 'specialization', name: 'Specialization Subject', description: 'Subject for specific specialization track' }
    ]
  });
});

/**
 * @swagger
 * /requirement-types:
 *   get:
 *     summary: Get requirement types
 *     description: Retrieve list of requirement type options
 *     tags: [Subjects]
 *     responses:
 *       200:
 *         description: Requirement types retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "mandatory"
 *                       name:
 *                         type: string
 *                         example: "Mandatory"
 *                       description:
 *                         type: string
 *                         example: "Required subject for graduation"
 */
router.get('/requirement-types', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'mandatory', name: 'Mandatory', description: 'Required subject for graduation' },
      { id: 'optional', name: 'Optional', description: 'Not required but recommended' },
      { id: 'prerequisite', name: 'Prerequisite', description: 'Required before taking other subjects' }
    ]
  });
});

/**
 * @swagger
 * /subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     description: Retrieve a specific subject by its ID
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *       404:
 *         description: Subject not found
 */
router.get('/:id', ops.view, getSubjectByIdController);

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Create new subject
 *     description: Create a new subject with the provided data
 *     tags: [Subjects]
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
 *             properties:
 *               code:
 *                 type: string
 *                 example: "MATH101"
 *               nameEn:
 *                 type: string
 *                 example: "Mathematics 101"
 *               nameAr:
 *                 type: string
 *                 example: "رياضيات 101"
 *               description:
 *                 type: string
 *                 example: "Fundamental mathematics course"
 *               credits:
 *                 type: integer
 *                 example: 3
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               programId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *                 message:
 *                   type: string
 *                   example: "Subject created successfully"
 *       400:
 *         description: Bad request - validation error
 */
router.post('/', ops.create, createSubjectController);

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Update subject
 *     description: Update an existing subject with new data
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "MATH102"
 *               nameEn:
 *                 type: string
 *                 example: "Mathematics 102"
 *               nameAr:
 *                 type: string
 *                 example: "رياضيات 102"
 *               description:
 *                 type: string
 *                 example: "Advanced mathematics course"
 *               credits:
 *                 type: integer
 *                 example: 4
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               programId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *                 message:
 *                   type: string
 *                   example: "Subject updated successfully"
 *       404:
 *         description: Subject not found
 */
router.put('/:id', ops.update, updateSubjectController);

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Delete subject
 *     description: Delete a subject (only if no dependencies exist)
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
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
 *                   example: "Subject deleted successfully"
 *       404:
 *         description: Subject not found
 *       400:
 *         description: Cannot delete subject with dependencies
 */
router.delete('/:id', ops.delete, deleteSubjectController);

/**
 * @swagger
 * /subjects/program/{programId}:
 *   get:
 *     summary: Get subjects by program
 *     description: Retrieve all subjects belonging to a specific program
 *     tags: [Subjects]
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
 *         description: Program subjects retrieved successfully
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
 *                     $ref: '#/components/schemas/Subject'
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
router.get('/program/:programId', ops.view, getSubjectsByProgramController);

export default router;
