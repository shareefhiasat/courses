/**
 * Weekly Summary Routes
 * 
 * PURPOSE: API routes for weekly summary operations
 * ARCHITECTURE: Routes → Controllers → Services → DB Services → Prisma
 */

import express from 'express';
import weeklySummaryController from '../controllers/weeklySummary.js';
import { keycloakAuth } from '../middleware/keycloakAuth.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/weekly-summary/generate:
 *   post:
 *     summary: Generate weekly attendance summary
 *     tags: [Weekly Summary]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekStart
 *               - weekEnd
 *             properties:
 *               weekStart:
 *                 type: string
 *                 format: date
 *                 description: Week start date (YYYY-MM-DD)
 *               weekEnd:
 *                 type: string
 *                 format: date
 *                 description: Week end date (YYYY-MM-DD)
 *               comments:
 *                 type: string
 *                 description: Optional comments for the summary
 *     responses:
 *       201:
 *         description: Weekly summary generated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/generate', keycloakAuth, weeklySummaryController.generateWeeklySummaryController);

/**
 * @swagger
 * /api/v1/weekly-summary/daily-documents:
 *   get:
 *     summary: Get daily attendance documents for a date range
 *     tags: [Weekly Summary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date (YYYY-MM-DD)
 *       - in: query
 *         name: weekEnd
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Week end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Daily documents retrieved successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.get('/daily-documents', keycloakAuth, weeklySummaryController.getDailyDocumentsController);

export default router;
