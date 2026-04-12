/**
 * Participation Types API Routes
 * 
 * PURPOSE: Route definitions for participation type operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllParticipationTypesController,
  getParticipationTypeByIdController,
  createParticipationTypeController,
  updateParticipationTypeController,
  deleteParticipationTypeController
} from '../controllers/participation-types.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ParticipationType:
 *       type: object
 *       required:
 *         - code
 *         - nameEn
 *       properties:
 *         id:
 *           type: integer
 *           description: Participation type unique identifier
 *           example: 1
 *         code:
 *           type: string
 *           description: Unique code for participation type
 *           example: "POSITIVE"
 *         nameEn:
 *           type: string
 *           description: Participation type name in English
 *           example: "Positive Participation"
 *         nameAr:
 *           type: string
 *           description: Participation type name in Arabic
 *           example: "مشاركة إيجابية"
 *         description:
 *           type: string
 *           description: Description of participation type
 *           example: "Positive classroom participation"
 *         isPositive:
 *           type: boolean
 *           description: Whether this is a positive participation type
 *           example: true
 *         isActive:
 *           type: boolean
 *           description: Whether participation type is active
 *           example: true
 */

/**
 * @swagger
 * /participation-types:
 *   get:
 *     summary: Get all participation types
 *     tags: [ParticipationTypes]
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
 *     responses:
 *       200:
 *         description: List of participation types
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
 *                     $ref: '#/components/schemas/ParticipationType'
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 */
router.get('/', getAllParticipationTypesController);

/**
 * @swagger
 * /participation-types/{id}:
 *   get:
 *     summary: Get participation type by ID
 *     tags: [ParticipationTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participation type ID
 *     responses:
 *       200:
 *         description: Participation type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ParticipationType'
 *       404:
 *         description: Participation type not found
 */
router.get('/:id', getParticipationTypeByIdController);

/**
 * @swagger
 * /participation-types:
 *   post:
 *     summary: Create new participation type
 *     tags: [ParticipationTypes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - nameEn
 *             properties:
 *               code:
 *                 type: string
 *                 example: "POSITIVE"
 *               nameEn:
 *                 type: string
 *                 example: "Positive Participation"
 *               nameAr:
 *                 type: string
 *                 example: "مشاركة إيجابية"
 *               description:
 *                 type: string
 *                 example: "Positive classroom participation"
 *               isPositive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Participation type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ParticipationType'
 *                 message:
 *                   type: string
 *                   example: "Participation type created successfully"
 *       400:
 *         description: Invalid input
 */
router.post('/', createParticipationTypeController);

/**
 * @swagger
 * /participation-types/{id}:
 *   put:
 *     summary: Update participation type
 *     tags: [ParticipationTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participation type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nameEn:
 *                 type: string
 *                 example: "Updated Positive Participation"
 *               nameAr:
 *                 type: string
 *                 example: "مشاركة إيجابية محدثة"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               isPositive:
 *                 type: boolean
 *                 example: false
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Participation type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ParticipationType'
 *                 message:
 *                   type: string
 *                   example: "Participation type updated successfully"
 *       404:
 *         description: Participation type not found
 */
router.put('/:id', updateParticipationTypeController);

/**
 * @swagger
 * /participation-types/{id}:
 *   delete:
 *     summary: Delete participation type
 *     tags: [ParticipationTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Participation type ID
 *     responses:
 *       200:
 *         description: Participation type deleted successfully
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
 *                   example: "Participation type deleted successfully"
 *       404:
 *         description: Participation type not found
 */
router.delete('/:id', deleteParticipationTypeController);

export default router;
