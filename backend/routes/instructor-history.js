import express from 'express';
import instructorHistoryService from '../services/instructorHistoryService.js';

const router = express.Router();

/**
 * Get instructor history for a class
 * GET /api/v1/instructor-history/class/:classId
 */
router.get('/class/:classId', async (req, res) => {
  try {
    const result = await instructorHistoryService.getClassInstructorHistory(req.params.classId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all classes taught by an instructor (historical)
 * GET /api/v1/instructor-history/instructor/:instructorId
 * Query params: startDate, endDate (optional)
 */
router.get('/instructor/:instructorId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await instructorHistoryService.getInstructorHistory(
      req.params.instructorId,
      { startDate, endDate }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get instructor history for a specific session
 * GET /api/v1/instructor-history/session/:sessionId
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const result = await instructorHistoryService.getSessionInstructorHistory(req.params.sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get instructor workload report
 * GET /api/v1/instructor-history/workload/:instructorId
 * Query params: startDate, endDate (optional)
 */
router.get('/workload/:instructorId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await instructorHistoryService.getInstructorWorkload(
      req.params.instructorId,
      { startDate, endDate }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
