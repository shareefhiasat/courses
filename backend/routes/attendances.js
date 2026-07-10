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
import { qrScannerOps, requireAnyPermission } from '../middleware/requirePermission.js';

const router = Router();

router.get('/', qrScannerOps.view, getAllAttendance);
router.get('/stats', qrScannerOps.view, getClassAttendanceStats);
router.get('/:id', qrScannerOps.view, getAttendanceById);
router.post('/', qrScannerOps.mark, createAttendance);
router.put('/:id', requireAnyPermission(
  'qr-scanner.canEditAttendance',
  'qr-scanner.canMarkAttendance',
  'qr-scanner.canManualInput',
), updateAttendance);
router.delete('/:id', requireAnyPermission(
  'qr-scanner.canDeleteAttendance',
  'qr-scanner.canMarkAttendance',
  'qr-scanner.canManualInput',
), deleteAttendance);

export default router;
