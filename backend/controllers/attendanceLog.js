import * as logDb from '../db/attendance-log-postgres.js';
import { error } from '../utils/common/logger.js';

const serviceName = 'attendanceLogController';

export const getLectureLog = async (req, res) => {
  try {
    const { classId, date } = req.query;
    if (!classId || !date) {
      return res.status(400).json({ success: false, error: 'classId and date are required' });
    }
    const result = await logDb.getLectureLog({ classId, date });
    return res.json(result);
  } catch (err) {
    error(`${serviceName}:getLectureLog:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getRecordHistory = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    if (!attendanceId) {
      return res.status(400).json({ success: false, error: 'attendanceId is required' });
    }
    const result = await logDb.getRecordHistory(attendanceId);
    return res.json(result);
  } catch (err) {
    error(`${serviceName}:getRecordHistory:error`, { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export default {
  getLectureLog,
  getRecordHistory,
};
