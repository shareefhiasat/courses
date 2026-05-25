import { Router } from 'express';
import {
  exportWorkflowStatusHistoryController,
  exportPermissionDenialsController
} from '../controllers/audit-export.js';

const router = Router();

/**
 * @swagger
 * /api/v1/audit-export/workflow-status-history:
 *   get:
 *     summary: Export workflow status history for regulatory requests
 *     tags: [Audit Export]
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
 *         name: documentId
 *         schema:
 *           type: integer
 *         description: Filter by document ID
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: integer
 *         description: Filter by actor ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *         description: Export format (default: csv)
 *     responses:
 *       200:
 *         description: Audit trail exported successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/workflow-status-history', exportWorkflowStatusHistoryController);

/**
 * @swagger
 * /api/v1/audit-export/permission-denials:
 *   get:
 *     summary: Export permission denial logs for regulatory requests
 *     tags: [Audit Export]
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
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *         description: Export format (default: csv)
 *     responses:
 *       200:
 *         description: Permission denial logs exported successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/permission-denials', exportPermissionDenialsController);

export default router;
