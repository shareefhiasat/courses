import express from 'express';
import {
  getMarksDistribution,
  setMarksDistribution,
  getStudentMarks,
  updateStudentMarks,
  batchUpdateStudentMarks,
  getAllStudentMarksReport,
  getStudentMarksHistory,
  getAttendanceDeductionSuggestion,
  getAbsenceDeductionRules,
} from '../controllers/marks.js';
import { screenOps } from '../middleware/requirePermission.js';

const router = express.Router();
const ops = screenOps('marks-entry');

/**
 * @swagger
 * tags:
 *   name: Marks
 *   description: Student marks and distribution management
 */

/**
 * @swagger
 * /api/v1/marks/distribution/{subjectId}:
 *   get:
 *     summary: Get marks distribution for a subject
 *     tags: [Marks]
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Marks distribution retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/distribution/:subjectId', ops.view, getMarksDistribution);

/**
 * @swagger
 * /api/v1/marks/distribution/{subjectId}:
 *   put:
 *     summary: Set/Update marks distribution for a subject
 *     tags: [Marks]
 *     parameters:
 *       - in: path
 *         name: subjectId
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
 *               midTermExam:
 *                 type: number
 *               finalExam:
 *                 type: number
 *               homework:
 *                 type: number
 *               labsProjectResearch:
 *                 type: number
 *               quizzes:
 *                 type: number
 *               participation:
 *                 type: number
 *               attendance:
 *                 type: number
 *     responses:
 *       200:
 *         description: Marks distribution updated successfully
 *       400:
 *         description: Validation error (percentages must total 100%)
 *       500:
 *         description: Server error
 */
router.put('/distribution/:subjectId', ops.update, setMarksDistribution);

/**
 * @swagger
 * /api/v1/marks/students/{subjectId}:
 *   get:
 *     summary: Get student marks for a subject
 *     tags: [Marks]
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Optional class ID filter
 *     responses:
 *       200:
 *         description: Student marks retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/students/:subjectId', ops.view, getStudentMarks);

/**
 * @swagger
 * /api/v1/marks/students/{userId}/{subjectId}/{classId}:
 *   put:
 *     summary: Update marks for a specific student
 *     tags: [Marks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: classId
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
 *               midTermExam:
 *                 type: number
 *               finalExam:
 *                 type: number
 *               homework:
 *                 type: number
 *               labsProjectResearch:
 *                 type: number
 *               quizzes:
 *                 type: number
 *               participation:
 *                 type: number
 *               attendance:
 *                 type: number
 *     responses:
 *       200:
 *         description: Student marks updated successfully
 *       500:
 *         description: Server error
 */
router.put('/students/:userId/:subjectId/:classId', ops.update, updateStudentMarks);

/**
 * @swagger
 * /api/v1/marks/students/batch/{subjectId}/{classId}:
 *   put:
 *     summary: Batch update marks for multiple students
 *     tags: [Marks]
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: classId
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
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     midTermExam:
 *                       type: number
 *                     finalExam:
 *                       type: number
 *                     homework:
 *                       type: number
 *                     labsProjectResearch:
 *                       type: number
 *                     quizzes:
 *                       type: number
 *                     participation:
 *                       type: number
 *                     attendance:
 *                       type: number
 *     responses:
 *       200:
 *         description: Student marks batch updated successfully
 *       400:
 *         description: Invalid request format
 *       500:
 *         description: Server error
 */
router.put('/students/batch/:subjectId/:classId', ops.update, batchUpdateStudentMarks);

/**
 * @swagger
 * /api/v1/marks/report:
 *   get:
 *     summary: Get all student marks report with complete information
 *     tags: [Marks]
 *     parameters:
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
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Filter by year
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *         description: Filter by term
 *       - in: query
 *         name: isRepeated
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by repeated status
 *     responses:
 *       200:
 *         description: Student marks report retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/report', ops.view, getAllStudentMarksReport);

/**
 * @swagger
 * /api/v1/marks/history/{userId}/{subjectId}/{classId}:
 *   get:
 *     summary: Get marks history for a specific student
 *     tags: [Marks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Student marks history retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/history/:userId/:subjectId/:classId', ops.view, getStudentMarksHistory);

router.get('/attendance-deduction', ops.view, getAttendanceDeductionSuggestion);
router.get('/absence-deduction-rules', ops.view, getAbsenceDeductionRules);

export default router;
