import express from 'express';
const router = express.Router();
import classroomAvailabilityDb from '../db/classroom-availability-postgres.js';

/**
 * Classroom Availability Routes
 */

// Create classroom availability
router.post('/', async (req, res) => {
  try {
    const result = await classroomAvailabilityDb.createClassroomAvailability(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get classroom availability by classroom ID
router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const result = await classroomAvailabilityDb.getClassroomAvailabilityByClassroomId(req.params.classroomId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all classroom availabilities
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
    };
    const result = await classroomAvailabilityDb.getAllClassroomAvailabilities(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update classroom availability
router.put('/classroom/:classroomId', async (req, res) => {
  try {
    const result = await classroomAvailabilityDb.updateClassroomAvailability(req.params.classroomId, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete classroom availability
router.delete('/classroom/:classroomId', async (req, res) => {
  try {
    const result = await classroomAvailabilityDb.deleteClassroomAvailability(req.params.classroomId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if classroom is available on a specific date
router.get('/classroom/:classroomId/check/:date', async (req, res) => {
  try {
    const result = await classroomAvailabilityDb.checkClassroomAvailability(
      req.params.classroomId,
      req.params.date
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get classroom utilization for a date range
router.get('/classroom/:classroomId/utilization/:startDate/:endDate', async (req, res) => {
  try {
    const result = await classroomAvailabilityDb.getClassroomUtilization(
      req.params.classroomId,
      req.params.startDate,
      req.params.endDate
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all available classrooms for a specific date and time slot
router.get('/available/:date/:timeSlotId/:programId', async (req, res) => {
  try {
    const result = await classroomAvailabilityDb.getAvailableClassroomsForDate(
      req.params.date,
      req.params.timeSlotId,
      req.params.programId
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
