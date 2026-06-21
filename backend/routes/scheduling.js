/**
 * Scheduling API Routes — summary dashboard, break sessions, teacher effort.
 */

import { Router } from 'express';
import { requirePermission } from '../middleware/requirePermission.js';
import { isSuperAdmin, getEffectiveRoles } from '../utils/roleUtils.js';
import { permissionsService } from '../services/permissions.js';
import {
  getBreakSessions,
  createBreakSession,
  updateBreakSession,
  deleteBreakSession,
  getSchedulingSummary,
  getBreakSessionSummary,
  getHolidaySummary,
  getTeacherWorkloadSummary,
  getClassroomUtilizationSummary,
  getTeacherEffort,
  exportTeacherEffortExcel,
  exportTeacherEffortPDF,
  getEffortReport,
} from '../controllers/scheduling.js';

const router = Router();

async function allowSummaryView(req, res, next) {
  const roles = getEffectiveRoles(req.user?.roles || []);
  if (isSuperAdmin(roles)) return next();
  if (roles.includes('instructor')) return next();
  const allowed = await permissionsService.checkPermissionForRoles(roles, 'summary-dashboard.canView');
  if (allowed) return next();
  return res.status(403).json({ success: false, error: 'Insufficient permissions' });
}

const viewSummary = allowSummaryView;
const exportReport = requirePermission('summary-dashboard', 'export');

router.get('/break-sessions', viewSummary, getBreakSessions);
router.post('/break-sessions', viewSummary, createBreakSession);
router.put('/break-sessions/:id', viewSummary, updateBreakSession);
router.delete('/break-sessions/:id', viewSummary, deleteBreakSession);

router.get('/summary', viewSummary, getSchedulingSummary);
router.get('/summary/break-sessions', viewSummary, getBreakSessionSummary);
router.get('/summary/holidays', viewSummary, getHolidaySummary);
router.get('/summary/teacher-workload', viewSummary, getTeacherWorkloadSummary);
router.get('/summary/classroom-utilization', viewSummary, getClassroomUtilizationSummary);

router.get('/effort-report', viewSummary, getEffortReport);

router.get('/teacher-effort/:teacherId/export/pdf', exportReport, exportTeacherEffortPDF);
router.get('/teacher-effort/:teacherId/export/excel', exportReport, exportTeacherEffortExcel);
router.get('/teacher-effort/:teacherId', viewSummary, getTeacherEffort);

export default router;
