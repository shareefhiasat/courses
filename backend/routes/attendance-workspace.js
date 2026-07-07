import express from 'express';
import {
  getInstructorPrograms,
  getAllPrograms,
  getProgramTerms,
  getWeeklySchedule,
  getScheduleGrid,
  getScheduleStatus,
} from '../controllers/attendanceWorkspace.js';

const router = express.Router();

router.get('/instructor-programs', getInstructorPrograms);
router.get('/programs', getAllPrograms);
router.get('/programs/:programId/terms', getProgramTerms);
router.get('/weekly-schedule', getWeeklySchedule);
router.get('/schedule-grid', getScheduleGrid);
router.get('/schedule-status', getScheduleStatus);

export default router;
