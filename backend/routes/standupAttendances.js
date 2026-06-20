import express from 'express';
import {
  createStandupAttendance,
  getStandupAttendanceByUserAndDate,
  getAllStandupAttendanceByDate,
  getStandupAttendanceByClassAndDate,
  getStandupAttendanceByUser,
  getStandupAttendanceByProgramAndDate,
  getStandupAttendanceByProgramForDateRange,
  deleteStandupAttendance,
} from '../controllers/standupAttendances.js';
import { qrScannerOps } from '../middleware/requirePermission.js';

const router = express.Router();

router.post('/', qrScannerOps.mark, createStandupAttendance);
router.get('/user/:userId/date/:date', qrScannerOps.view, getStandupAttendanceByUserAndDate);
router.get('/user/:userId', qrScannerOps.view, getStandupAttendanceByUser);
router.get('/class', qrScannerOps.view, getStandupAttendanceByClassAndDate);
router.get('/date/:date', qrScannerOps.view, getAllStandupAttendanceByDate);
router.get('/program', qrScannerOps.view, getStandupAttendanceByProgramAndDate);
router.get('/program/range', qrScannerOps.view, getStandupAttendanceByProgramForDateRange);
router.delete('/:id', qrScannerOps.delete, deleteStandupAttendance);

export default router;
