/**
 * Dashboard Routes
 * 
 * PURPOSE: Express routes for dashboard API endpoints
 * ARCHITECTURE: API → Routes → Controller → DB Service → PostgreSQL
 */

import express from 'express';
import { getDashboardSummary, getTeacherDashboard } from '../controllers/dashboard.js';
import dashboardAnalyticsController from '../controllers/dashboard-analytics.js';

const router = express.Router();

const dashboardController = {
  getDashboardSummary,
  getTeacherDashboard
};

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     description: Get aggregated dashboard data including today's schedule, teacher load, classroom utilization, holidays, conflicts, and pending items
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: integer
 *         description: Filter by program ID
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: integer
 *         description: Filter by instructor ID
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/summary', dashboardController.getDashboardSummary);

/**
 * @swagger
 * /dashboard/teacher/{teacherUserId}:
 *   get:
 *     summary: Get teacher-specific dashboard
 *     description: Get dashboard data specific to a teacher including their schedule and availability
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher user ID
 *     responses:
 *       200:
 *         description: Teacher dashboard retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/teacher/:teacherUserId', dashboardController.getTeacherDashboard);

// Analytics endpoints for dashboard widgets
router.get('/analytics', dashboardAnalyticsController.getAnalytics);
router.get('/analytics/drive', dashboardAnalyticsController.getDriveAnalytics);
router.get('/analytics/workflow', dashboardAnalyticsController.getWorkflowAnalytics);
router.get('/analytics/activity', dashboardAnalyticsController.getActivityAnalytics);

export default router;
