/**
 * Attendance Routes
 *
 * PURPOSE: Define REST API routes for attendance operations
 * ARCHITECTURE: Routes → Controller → Service → Database
 */

import { Router } from 'express';
import {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getClassAttendanceStats,
} from '../controllers/attendances.js';
import { qrScannerOps, requireAttendanceEdit } from '../middleware/requirePermission.js';

const router = Router();

router.get('/', qrScannerOps.view, getAllAttendance);
router.get('/stats', qrScannerOps.view, getClassAttendanceStats);
router.get('/:id', qrScannerOps.view, getAttendanceById);
router.post('/', requireAttendanceEdit, createAttendance);
router.put('/:id', requireAttendanceEdit, updateAttendance);
router.delete('/:id', requireAttendanceEdit, deleteAttendance);

export default router;
