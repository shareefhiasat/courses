import express from 'express';
const router = express.Router();
import instructorAvailabilityDb from '../db/instructor-availability-postgres.js';

/**
 * Instructor Availability Routes
 */

// Create instructor availability
router.post('/', async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.createInstructorAvailability(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get instructor availability by user ID
router.get('/instructor/:instructorUserId', async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.getInstructorAvailabilityByUserId(req.params.instructorUserId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all instructor availabilities
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
    };
    const result = await instructorAvailabilityDb.getAllInstructorAvailabilities(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update instructor availability
router.put('/instructor/:instructorUserId', async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.updateInstructorAvailability(req.params.instructorUserId, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete instructor availability
router.delete('/instructor/:instructorUserId', async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.deleteInstructorAvailability(req.params.instructorUserId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if instructor is available on a specific date
router.get('/instructor/:instructorUserId/check/:date', async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.checkInstructorAvailability(
      req.params.instructorUserId,
      req.params.date
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get instructor workload for a date range
router.get('/instructor/:instructorUserId/workload/:startDate/:endDate', async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.getInstructorWorkload(
      req.params.instructorUserId,
      req.params.startDate,
      req.params.endDate
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
