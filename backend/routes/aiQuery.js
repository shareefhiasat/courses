/**
 * AI Query Routes
 *
 * Exposes the offline rule-based query endpoint under /api/v1/ai
 */

import express from 'express';
import { queryAiAssistantController, quickQuestionController, refreshAiCacheController, invalidateAiCacheController } from '../controllers/aiQuery.js';
import { requireAiAccess } from '../middleware/requireAiAccess.js';

const router = express.Router();

// Apply AI access check (admin / hr / super-admin only)
router.use(requireAiAccess);

/**
 * @swagger
 * /api/v1/ai/query:
 *   post:
 *     summary: Ask a natural language question about system or student records
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "كم عدد الغيابات في الشهر الماضي؟"
 *               lang:
 *                 type: string
 *                 enum: [ar, en]
 *                 default: ar
 *     responses:
 *       200:
 *         description: Query result and formatted answer
 */
router.post('/query', queryAiAssistantController);

/**
 * @swagger
 * /api/v1/ai/quick:
 *   post:
 *     summary: Execute a predefined quick AI question
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId]
 *             properties:
 *               questionId:
 *                 type: string
 *                 example: "attendance-today"
 *               lang:
 *                 type: string
 *                 enum: [ar, en]
 *                 default: ar
 *               extraParams:
 *                 type: object
 *     responses:
 *       200:
 *         description: Quick-question result and formatted answer
 */
router.post('/quick', quickQuestionController);

/**
 * @swagger
 * /api/v1/ai/cache/refresh:
 *   post:
 *     summary: Manually refresh the AI metric cache
 *     tags: [AI Assistant]
 *     responses:
 *       200:
 *         description: Cache refresh completed
 */
router.post('/cache/refresh', refreshAiCacheController);

/**
 * @swagger
 * /api/v1/ai/cache/invalidate:
 *   post:
 *     summary: Manually invalidate all AI caches
 *     tags: [AI Assistant]
 *     responses:
 *       200:
 *         description: AI caches invalidated
 */
router.post('/cache/invalidate', invalidateAiCacheController);

export default router;
