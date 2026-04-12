import express from 'express';
import {
  createStandupAttendance,
  getStandupAttendanceByUserAndDate,
  getAllStandupAttendanceByDate,
  getStandupAttendanceByClassAndDate,
  getStandupAttendanceByUser,
  getStandupAttendanceByProgramAndDate,
  getStandupAttendanceByProgramForDateRange,
  deleteStandupAttendance
} from '../controllers/standupAttendances.js';

const router = express.Router();

// POST /api/v1/standup-attendance - Create standup attendance
router.post('/', createStandupAttendance);

// GET /api/v1/standup-attendance/user/:userId/date/:date - Get standup attendance by user and date
router.get('/user/:userId/date/:date', getStandupAttendanceByUserAndDate);

// GET /api/v1/standup-attendance/user/:userId - Get all standup attendance for a user
router.get('/user/:userId', getStandupAttendanceByUser);

// GET /api/v1/standup-attendance/class - Get standup attendance by class and date (query: classId, date)
router.get('/class', getStandupAttendanceByClassAndDate);

// GET /api/v1/standup-attendance/date/:date - Get all standup attendance for a date
router.get('/date/:date', getAllStandupAttendanceByDate);

// GET /api/v1/standup-attendance/program - Get standup attendance by program and date (query: programId, date)
router.get('/program', getStandupAttendanceByProgramAndDate);

// GET /api/v1/standup-attendance/program/range - Get standup attendance by program for date range (query: programId, startDate, endDate)
router.get('/program/range', getStandupAttendanceByProgramForDateRange);

// DELETE /api/v1/standup-attendance/:id - Delete standup attendance by ID
router.delete('/:id', deleteStandupAttendance);

export default router;
