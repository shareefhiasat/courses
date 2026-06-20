/**
 * Programs API Routes
 * 
 * PURPOSE: Handle all program-related API endpoints with Swagger documentation
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getProgramsController,
  getProgramByIdController,
  createProgramController,
  updateProgramController,
  deleteProgramController,
  hardDeleteProgramController
} from '../controllers/programs.js';
import { screenOps } from '../middleware/requirePermission.js';

const router = Router();
const ops = screenOps('programs');

// Debug middleware
router.use((req, res, next) => {
  console.log('[Programs Router] Method:', req.method, 'Path:', req.path, 'Original URL:', req.originalUrl);
  console.log('[Programs Router] Available routes:', router.stack.map(layer => layer.route?.path).filter(Boolean));
  next();
});

// GET /api/programs - Get all programs
/**
 * @swagger
 * /api/programs:
 *   get:
 *     summary: Get all programs
 *     description: Retrieve a list of all programs in the system with optional filtering and pagination
 *     tags: [Programs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of programs per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter programs by name or code
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter programs by status
 *       - in: query
 *         name: includeSubjects
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include associated subjects in response
 *       - in: query
 *         name: includeClasses
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include associated classes in response
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [nameEn, nameAr, code, createdAt, updatedAt]
 *           default: nameEn
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Order direction
 *     responses:
 *       200:
 *         description: List of programs retrieved successfully
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
 *                     $ref: '#/components/schemas/Program'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', (req, res, next) => {
  console.log('[Programs Router] GET / route matched');
  getProgramsController(req, res, next);
});

// GET /api/programs/:id - Get program by ID
/**
 * @swagger
 * /api/programs/{id}:
 *   get:
 *     summary: Get program by ID
 *     description: Retrieve a specific program by its unique identifier
 *     tags: [Programs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *       - in: query
 *         name: includeSubjects
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include associated subjects in response
 *       - in: query
 *         name: includeClasses
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include associated classes in response
 *     responses:
 *       200:
 *         description: Program retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
 *       404:
 *         description: Program not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', (req, res, next) => {
  console.log('[Programs Router] GET /:id route matched with ID:', req.params.id);
  getProgramByIdController(req, res, next);
});

// POST /api/programs - Create new program
/**
 * @swagger
 * /api/programs:
 *   post:
 *     summary: Create a new program
 *     description: Create a new program with the provided data
 *     tags: [Programs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramInput'
 *     responses:
 *       201:
 *         description: Program created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
 *                 message:
 *                   type: string
 *                   example: "Program created successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', ops.create, createProgramController);

// PUT /api/programs/:id - Update program
/**
 * @swagger
 * /api/programs/{id}:
 *   put:
 *     summary: Update a program
 *     description: Update an existing program with new data
 *     tags: [Programs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgramInput'
 *     responses:
 *       200:
 *         description: Program updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
 *                 message:
 *                   type: string
 *                   example: "Program updated successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Program not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', ops.update, updateProgramController);

// DELETE /api/programs/:id - Delete program
/**
 * @swagger
 * /api/programs/{id}:
 *   delete:
 *     summary: Delete a program
 *     description: Soft delete a program by setting isActive to false
 *     tags: [Programs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program deleted successfully
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
 *                   example: "Program deleted successfully"
 *       404:
 *         description: Program not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', ops.delete, deleteProgramController);

/**
 * @swagger
 * /api/programs/{id}/hard:
 *   delete:
 *     summary: Hard delete a program
 *     description: Permanently delete a program from the database
 *     tags: [Programs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program hard deleted successfully
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Program not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id/hard', ops.delete, hardDeleteProgramController);

export default router;
