import { Router } from 'express';
import {
  amendAttendanceController,
  getAttendanceAmendmentsController,
  getAllAttendanceAmendmentsController
} from '../controllers/attendance-amendment.js';

const router = Router();

/**
 * @swagger
 * /api/v1/attendance-amendment:
 *   post:
 *     summary: Amend an attendance record
 *     tags: [Attendance Amendment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendanceId
 *               - toStatusId
 *               - reason
 *             properties:
 *               attendanceId:
 *                 type: integer
 *               toStatusId:
 *                 type: integer
 *               reason:
 *                 type: string
 *               workflowDocumentId:
 *                 type: integer
 *                 description: Optional workflow document ID to add auto-generated comment
 *     responses:
 *       200:
 *         description: Attendance amended successfully
 *       403:
 *         description: Access denied
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post('/', amendAttendanceController);

/**
 * @swagger
 * /api/v1/attendance-amendment/{attendanceId}:
 *   get:
 *     summary: Get amendments for a specific attendance record
 *     tags: [Attendance Amendment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Amendments retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/:attendanceId', getAttendanceAmendmentsController);

/**
 * @swagger
 * /api/v1/attendance-amendment:
 *   get:
 *     summary: Get all attendance amendments with filters
 *     tags: [Attendance Amendment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (ISO format)
 *       - in: query
 *         name: amendedBy
 *         schema:
 *           type: integer
 *         description: Filter by user ID who made the amendment
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset results
 *     responses:
 *       200:
 *         description: Amendments retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllAttendanceAmendmentsController);

export default router;
