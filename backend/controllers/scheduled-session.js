import express from 'express';
import * as scheduledSessionDb from '../db/scheduled-session-postgres.js';

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

export default router;
