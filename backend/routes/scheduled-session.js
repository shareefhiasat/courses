import express from 'express';
import * as scheduledSessionDb from '../db/scheduled-session-postgres.js';
import * as schedulingEngine from '../services/schedulingEngine.js';
import * as suggestionEngine from '../services/suggestionEngine.js';
import sessionStatusService from '../services/sessionStatusService.js';
import { screenOps } from '../middleware/requirePermission.js';
import { applyListScope } from '../utils/applyListScope.js';

const router = express.Router();
const calendarOps = screenOps('scheduling-calendar');

/**
 * Get all scheduled sessions
 * GET /api/v1/scheduled-sessions
 */
router.get('/', calendarOps.view, async (req, res) => {
  try {
    const result = await scheduledSessionDb.getScheduledSessions(req.query);
    const scoped = await applyListScope(req, result, 'classLinked');
    res.json(scoped);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
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
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Create a new scheduled session
 * POST /api/v1/scheduled-sessions
 */
router.post('/', async (req, res) => {
  try {
    // Remove createdBy/updatedBy from request body - Prisma handles these automatically
    const { createdBy, updatedBy, ...sessionData } = req.body;
    const result = await scheduledSessionDb.createScheduledSession(sessionData);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Update a scheduled session
 * PUT /api/v1/scheduled-sessions/:id
 */
router.put('/:id', async (req, res) => {
  try {
    // Remove createdBy/updatedBy from request body - Prisma handles these automatically
    const { createdBy, updatedBy, ...sessionData } = req.body;
    const result = await scheduledSessionDb.updateScheduledSession(req.params.id, sessionData);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Delete a scheduled session (soft delete)
 * DELETE /api/v1/scheduled-sessions/:id
 * Body: { deletedBy, deletionReason } (optional)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { deletedBy, deletionReason } = req.body;
    const result = await scheduledSessionDb.deleteScheduledSession(
      req.params.id,
      deletedBy,
      deletionReason
    );
    
    if (result.requiresReason) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Restore a soft-deleted session (admin only)
 * POST /api/v1/scheduled-sessions/:id/restore
 * Body: { restoredBy }
 */
router.post('/:id/restore', async (req, res) => {
  try {
    const { restoredBy } = req.body;
    const result = await scheduledSessionDb.restoreScheduledSession(
      req.params.id,
      restoredBy
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Validate a session without saving
 * POST /api/v1/scheduled-sessions/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { classId, instructorId, classroomId, startDateTime, endDateTime } = req.body;
    console.log('[validateSession]', {
      classId,
      instructorId,
      classroomId,
      startDateTime,
      endDateTime
    });
    const result = await schedulingEngine.validateSession(req.body, req.body.excludeSessionId);
    if (!result.valid) {
      console.log('[validateSession] conflicts:', result.conflicts?.map(c => c.type + ': ' + c.message));
    }
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
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
    res.status(500).json({ success: false, error: "Internal server error" });
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
    res.status(500).json({ success: false, error: "Internal server error" });
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
    res.status(500).json({ success: false, error: "Internal server error" });
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
    res.status(500).json({ success: false, error: "Internal server error" });
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
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Update session status
 * PATCH /api/v1/scheduled-sessions/:id/status
 * Body: { status, updatedBy, reason }
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, updatedBy, reason } = req.body;
    const result = await sessionStatusService.updateSessionStatus(
      req.params.id,
      status,
      updatedBy,
      reason
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Cancel a session
 * POST /api/v1/scheduled-sessions/:id/cancel
 * Body: { cancelledBy, reason }
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { cancelledBy, reason } = req.body;
    const result = await sessionStatusService.cancelSession(
      req.params.id,
      cancelledBy,
      reason
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Cancel recurring series (this and all future)
 * POST /api/v1/scheduled-sessions/:id/cancel-series
 * Body: { cancelledBy, reason }
 */
router.post('/:id/cancel-series', async (req, res) => {
  try {
    const { cancelledBy, reason } = req.body;
    const result = await sessionStatusService.cancelRecurringSeries(
      req.params.id,
      cancelledBy,
      reason
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * Get sessions by status
 * GET /api/v1/scheduled-sessions/status/:status
 * Query params: startDate, endDate, classId, instructorId
 */
router.get('/status/:status', async (req, res) => {
  try {
    const result = await sessionStatusService.getSessionsByStatus(
      req.params.status,
      req.query
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
