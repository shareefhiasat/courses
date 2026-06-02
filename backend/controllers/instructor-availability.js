import express from 'express';
const router = express.Router();
import * as instructorAvailabilityDb from '../db/instructor-availability-postgres.js';

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
      ...req.query,
      programId: req.query.programId,
      subjectId: req.query.subjectId,
      classId: req.query.classId,
    };
    const result = await instructorAvailabilityDb.getInstructorAvailabilities(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update instructor availability by ID
router.put('/:id', async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.updateInstructorAvailability(req.params.id, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete instructor availability by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.deleteInstructorAvailability(req.params.id);
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
