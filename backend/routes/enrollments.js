/**
 * Enrollments API Routes
 *
 * PURPOSE: Route definitions for enrollment operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from "express";
import {
  getAllEnrollmentsController,
  getEnrollmentByIdController,
  createEnrollmentController,
  updateEnrollmentController,
  deleteEnrollmentController,
  getEnrollmentsByStudentController,
  getEnrollmentsByClassController,
  getStudentsByClassController,
  getEnrollmentsByProgramController,
} from "../controllers/enrollments.js";
import { requireAuth } from "../middleware/keycloakAuth.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       required:
 *         - userId
 *         - classId
 *         - statusId
 *       properties:
 *         id:
 *           type: integer
 *           description: Enrollment unique identifier
 *           example: 1
 *         userId:
 *           type: integer
 *           description: User ID
 *           example: 1
 *         classId:
 *           type: integer
 *           description: Class ID
 *           example: 1
 *         statusId:
 *           type: integer
 *           description: Enrollment status ID
 *           example: 1
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *           description: Enrollment date
 *           example: "2024-01-15T10:30:00Z"
 *         isActive:
 *           type: boolean
 *           description: Whether enrollment is active
 *           example: true
 */

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Get all enrollments
 *     tags: [Enrollments]
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: statusId
 *         schema:
 *           type: integer
 *         description: Filter by status ID
 *     responses:
 *       200:
 *         description: List of enrollments
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
 *                     $ref: '#/components/schemas/Enrollment'
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 */
router.get("/", requireAuth, getAllEnrollmentsController);

/**
 * @swagger
 * /enrollments/students-by-class:
 *   get:
 *     summary: Get students by class ID (returns enrollments with user data)
 *     tags: [Enrollments]
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Class ID to filter by
 *     responses:
 *       200:
 *         description: List of enrollments with user data
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
 */
router.get("/students-by-class", requireAuth, getStudentsByClassController);

/**
 * @swagger
 * /enrollments/{id}:
 *   get:
 *     summary: Get enrollment by ID
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       404:
 *         description: Enrollment not found
 */
router.get("/:id", getEnrollmentByIdController);

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Create new enrollment
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - classId
 *               - statusId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               classId:
 *                 type: integer
 *                 example: 1
 *               statusId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *                   example: "Enrollment created successfully"
 *       400:
 *         description: Invalid input
 */
router.post("/", createEnrollmentController);

/**
 * @swagger
 * /enrollments/{id}:
 *   put:
 *     summary: Update enrollment
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statusId:
 *                 type: integer
 *                 example: 2
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *                   example: "Enrollment updated successfully"
 *       404:
 *         description: Enrollment not found
 */
router.put("/:id", updateEnrollmentController);

/**
 * @swagger
 * /enrollments/{id}:
 *   delete:
 *     summary: Delete enrollment
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
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
 *                   example: "Enrollment deleted successfully"
 *       404:
 *         description: Enrollment not found
 */
router.delete("/:id", deleteEnrollmentController);

/**
 * @swagger
 * /enrollments/student/{studentId}:
 *   get:
 *     summary: Get enrollments by student ID
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: List of student enrollments
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
 *                     $ref: '#/components/schemas/Enrollment'
 */
router.get("/student/:studentId", getEnrollmentsByStudentController);

/**
 * @swagger
 * /enrollments/class/{classId}:
 *   get:
 *     summary: Get enrollments by class ID
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of class enrollments
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
 *                     $ref: '#/components/schemas/Enrollment'
 */
router.get("/class/:classId", getEnrollmentsByClassController);

/**
 * @swagger
 * /enrollments/program/{programId}:
 *   get:
 *     summary: Get enrollments by program ID
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Program ID
 *     responses:
 *       200:
 *         description: List of program enrollments
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
 *                     $ref: '#/components/schemas/Enrollment'
 */
router.get("/program/:programId", requireAuth, getEnrollmentsByProgramController);

export default router;
