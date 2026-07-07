import express from 'express';
import { getLectureLog, getRecordHistory } from '../controllers/attendanceLog.js';

const router = express.Router();

router.get('/lecture-log', getLectureLog);
router.get('/record-history/:attendanceId', getRecordHistory);

export default router;
