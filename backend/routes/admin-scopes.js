/**
 * Admin Scopes API Routes
 * 
 * PURPOSE: Route definitions for admin scope operations
 * ARCHITECTURE: Routes → Controllers → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
  getAllAdminScopesController,
  getAdminScopesByUserIdController,
  getUserEffectiveScopeController,
  getAdminScopeByIdController,
  createAdminScopeController,
  updateAdminScopeController,
  deleteAdminScopeController
} from '../controllers/admin-scopes.js';

const router = Router();

/**
 * @swagger
 * /admin-scopes:
 *   get:
 *     summary: Get all admin scopes
 *     tags: [AdminScopes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: scopeType
 *         schema:
 *           type: string
 *           enum: [PROGRAM, CLASSROOM, INSTRUCTOR]
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: classroomId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: instructorUserId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of admin scopes
 */
router.get('/', getAllAdminScopesController);

/**
 * @swagger
 * /admin-scopes/user/:userId:
 *   get:
 *     summary: Get admin scopes by user ID
 *     tags: [AdminScopes]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of admin scopes for the user
 */
router.get('/user/:userId', getAdminScopesByUserIdController);

/**
 * @swagger
 * /admin-scopes/user/:userId/effective:
 *   get:
 *     summary: Get user's effective admin scope (union of all scopes)
 *     tags: [AdminScopes]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's effective scope data
 */
router.get('/user/:userId/effective', getUserEffectiveScopeController);

/**
 * @swagger
 * /admin-scopes/:id:
 *   get:
 *     summary: Get admin scope by ID
 *     tags: [AdminScopes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin scope details
 *       404:
 *         description: Admin scope not found
 */
router.get('/:id', getAdminScopeByIdController);

/**
 * @swagger
 * /admin-scopes:
 *   post:
 *     summary: Create a new admin scope
 *     tags: [AdminScopes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - scopeType
 *               - createdBy
 *             properties:
 *               userId:
 *                 type: integer
 *               scopeType:
 *                 type: string
 *                 enum: [PROGRAM, CLASSROOM, INSTRUCTOR]
 *               programId:
 *                 type: integer
 *               classroomId:
 *                 type: integer
 *               instructorUserId:
 *                 type: integer
 *               createdBy:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Admin scope created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createAdminScopeController);

/**
 * @swagger
 * /admin-scopes/:id:
 *   put:
 *     summary: Update an admin scope
 *     tags: [AdminScopes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scopeType:
 *                 type: string
 *                 enum: [PROGRAM, CLASSROOM, INSTRUCTOR]
 *               programId:
 *                 type: integer
 *               classroomId:
 *                 type: integer
 *               instructorUserId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Admin scope updated successfully
 *       404:
 *         description: Admin scope not found
 */
router.put('/:id', updateAdminScopeController);

/**
 * @swagger
 * /admin-scopes/:id:
 *   delete:
 *     summary: Delete an admin scope
 *     tags: [AdminScopes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin scope deleted successfully
 *       404:
 *         description: Admin scope not found
 */
router.delete('/:id', deleteAdminScopeController);

export default router;
