import express from 'express';
const router = express.Router();
import flexibleSchedulingDb from '../db/flexible-scheduling-postgres.js';
import instructorAvailabilityDb from '../db/instructor-availability-postgres.js';
import classroomAvailabilityDb from '../db/classroom-availability-postgres.js';

/**
 * Flexible Scheduling Routes
 */

// Create flexible schedule session
router.post('/sessions', async (req, res) => {
  try {
    const result = await flexibleSchedulingDb.createFlexibleScheduleSession(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get flexible schedule session by ID
router.get('/sessions/:id', async (req, res) => {
  try {
    const result = await flexibleSchedulingDb.getFlexibleScheduleSessionById(req.params.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all flexible schedule sessions with filters
router.get('/sessions', async (req, res) => {
  try {
    const filters = {
      programId: req.query.programId,
      instructorUserId: req.query.instructorUserId,
      classroomId: req.query.classroomId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      isCancelled: req.query.isCancelled,
    };
    const result = await flexibleSchedulingDb.getFlexibleScheduleSessions(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update flexible schedule session
router.put('/sessions/:id', async (req, res) => {
  try {
    const result = await flexibleSchedulingDb.updateFlexibleScheduleSession(req.params.id, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete flexible schedule session (soft delete)
router.delete('/sessions/:id', async (req, res) => {
  try {
    const result = await flexibleSchedulingDb.deleteFlexibleScheduleSession(req.params.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk create flexible schedule sessions
router.post('/sessions/bulk', async (req, res) => {
  try {
    const result = await flexibleSchedulingDb.bulkCreateFlexibleScheduleSessions(req.body.sessions);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sessions for a specific date range
router.get('/sessions/range/:startDate/:endDate', async (req, res) => {
  try {
    const filters = {
      programId: req.query.programId,
      instructorUserId: req.query.instructorUserId,
      classroomId: req.query.classroomId,
    };
    const result = await flexibleSchedulingDb.getSessionsByDateRange(
      req.params.startDate,
      req.params.endDate,
      filters
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check for conflicts
router.get('/sessions/conflicts/check', async (req, res) => {
  try {
    const { instructorUserId, date, timeSlotId, classroomId, excludeSessionId } = req.query;
    const result = await flexibleSchedulingDb.checkConflicts(
      instructorUserId,
      date,
      timeSlotId,
      classroomId,
      excludeSessionId
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
