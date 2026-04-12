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
  getClassAttendanceStats
} from '../controllers/attendances.js';

const router = Router();

// GET /api/v1/attendance - Get all attendance records with filtering
router.get('/', getAllAttendance);

// GET /api/v1/attendance/stats - Get class attendance statistics
router.get('/stats', getClassAttendanceStats);

// GET /api/v1/attendance/:id - Get attendance by ID
router.get('/:id', getAttendanceById);

// POST /api/v1/attendance - Create new attendance record
router.post('/', createAttendance);

// PUT /api/v1/attendance/:id - Update attendance record
router.put('/:id', updateAttendance);

// DELETE /api/v1/attendance/:id - Delete attendance record
router.delete('/:id', deleteAttendance);

export default router;
