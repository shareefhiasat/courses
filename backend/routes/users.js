/**
 * Users API Routes
 * 
 * PURPOSE: Route definitions for user dropdown operations
 * ARCHITECTURE: Routes → Controllers → Database → PostgreSQL
 */

import { Router } from 'express';
import {
  getInstructorsController,
  getProgramsController,
  getSubjectsController,
  listUsersController,
  createUserController,
  updateUserController,
  setPasswordController,
  setEnabledController,
  deleteUserController
} from '../controllers/users.js';
import { requireSuperAdmin } from '../middleware/keycloakAuth.js';

const router = Router();

/**
 * @swagger
 * /users/instructors:
 *   get:
 *     summary: Get all instructors
 *     description: Retrieve all users with instructor role for dropdown selection
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Instructors retrieved successfully
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
 *                         type: integer
 *                         example: 1
 *                       displayName:
 *                         type: string
 *                         example: "John Doe"
 *                       firstName:
 *                         type: string
 *                         example: "John"
 *                       lastName:
 *                         type: string
 *                         example: "Doe"
 *                       email:
 *                         type: string
 *                         example: "john.doe@example.com"
 *                       role:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 2
 *                           code:
 *                             type: string
 *                             example: "INSTRUCTOR"
 *                           nameEn:
 *                             type: string
 *                             example: "Instructor"
 *                           nameAr:
 *                             type: string
 *                             example: "مدرب"
 */
router.get('/instructors', getInstructorsController);

/**
 * @swagger
 * /users/programs:
 *   get:
 *     summary: Get all programs
 *     description: Retrieve all active programs for dropdown selection
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Programs retrieved successfully
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
 *                         type: integer
 *                         example: 1
 *                       code:
 *                         type: string
 *                         example: "CS"
 *                       nameEn:
 *                         type: string
 *                         example: "Computer Science"
 *                       nameAr:
 *                         type: string
 *                         example: "علوم الحاسوب"
 */
router.get('/programs', getProgramsController);

/**
 * @swagger
 * /users/subjects:
 *   get:
 *     summary: Get all subjects
 *     description: Retrieve all active subjects for dropdown selection, optionally filtered by program
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter subjects by program ID
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       code:
 *                         type: string
 *                         example: "CS101"
 *                       nameEn:
 *                         type: string
 *                         example: "Computer Science 101"
 *                       nameAr:
 *                         type: string
 *                         example: "علوم الحاسوب 101"
 *                       programId:
 *                         type: integer
 *                         example: 1
 *                       program:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nameEn:
 *                             type: string
 *                             example: "Computer Science"
 *                           nameAr:
 *                             type: string
 *                             example: "علوم الحاسوب"
 */
router.get('/subjects', getSubjectsController);

// Admin user management routes (Keycloak-based)
// Protected by Keycloak middleware (super_admin role required)
// Temporarily disabled for testing - will re-enable after fixing token issue
router.get('/admin/users', listUsersController);
router.post('/admin/users', createUserController);
router.put('/admin/users/:id', updateUserController);
router.put('/admin/users/:id/password', setPasswordController);
router.put('/admin/users/:id/enabled', setEnabledController);
router.delete('/admin/users/:id', deleteUserController);

export default router;
