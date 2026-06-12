import express from 'express';
import * as scheduledSessionDb from '../db/scheduled-session-postgres.js';
import * as schedulingEngine from '../services/schedulingEngine.js';
import * as suggestionEngine from '../services/suggestionEngine.js';

const router = express.Router();

/**
 * Get all scheduled sessions
 * GET /api/v1/scheduled-sessions
 */
router.get('/', async (req, res) => {
  try {
    const result = await scheduledSessionDb.getScheduledSessions(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get scheduled session by ID
 * GET /api/v1/scheduled-sessions/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await scheduledSessionDb.getScheduledSessionById(req.params.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create a new scheduled session
 * POST /api/v1/scheduled-sessions
 */
router.post('/', async (req, res) => {
  try {
    const result = await scheduledSessionDb.createScheduledSession(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update a scheduled session
 * PUT /api/v1/scheduled-sessions/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const result = await scheduledSessionDb.updateScheduledSession(req.params.id, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete a scheduled session
 * DELETE /api/v1/scheduled-sessions/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await scheduledSessionDb.deleteScheduledSession(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Validate a session without saving
 * POST /api/v1/scheduled-sessions/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const result = await schedulingEngine.validateSession(req.body, req.body.excludeSessionId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create recurring sessions
 * POST /api/v1/scheduled-sessions/recurring
 */
router.post('/recurring', async (req, res) => {
  try {
    const result = await scheduledSessionDb.createRecurringSessions(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get suggestions for best instructor/room match
 * POST /api/v1/scheduled-sessions/suggestions
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { classId, preferredTime } = req.body;
    const result = await suggestionEngine.suggestBestMatch(classId, preferredTime);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get alternative time suggestions
 * POST /api/v1/scheduled-sessions/alternative-times
 */
router.post('/alternative-times', async (req, res) => {
  try {
    const { classId, instructorId, classroomId, originalStart } = req.body;
    const result = await suggestionEngine.suggestAlternativeTimes(
      classId, 
      instructorId, 
      classroomId, 
      originalStart
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get sessions by instructor
 * GET /api/v1/scheduled-sessions/by-instructor/:instructorId
 */
router.get('/by-instructor/:instructorId', async (req, res) => {
  try {
    const result = await scheduledSessionDb.getScheduledSessions({
      instructorId: req.params.instructorId,
      ...req.query
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get sessions by classroom
 * GET /api/v1/scheduled-sessions/by-room/:classroomId
 */
router.get('/by-room/:classroomId', async (req, res) => {
  try {
    const result = await scheduledSessionDb.getScheduledSessions({
      classroomId: req.params.classroomId,
      ...req.query
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
