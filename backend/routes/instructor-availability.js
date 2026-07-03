import express from 'express';
const router = express.Router();
import * as instructorAvailabilityDb from '../db/instructor-availability-postgres.js';
import { validateInstructorAvailabilityChange } from '../services/availabilityGuardService.js';
import { screenOps } from '../middleware/requirePermission.js';
import { resolveSchedulingClassScope, filterInstructorAvailabilityByScope, canAccessTeacherInScope } from '../utils/schedulingScope.js';
import { scopeForbidden } from '../utils/scopeAccess.js';

const availOps = screenOps('instructor-availability-view');
const setupOps = screenOps('instructor-availability-setup');

/**
 * Instructor Availability Routes
 */

// Validate instructor availability change (live preview)
router.post('/validate-change', setupOps.update, async (req, res) => {
  try {
    const result = await validateInstructorAvailabilityChange(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Create instructor availability
router.post('/', setupOps.create, async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.createInstructorAvailability(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get instructor availability by user ID
router.get('/instructor/:instructorUserId', availOps.view, async (req, res) => {
  try {
    const inScope = await canAccessTeacherInScope(req, req.params.instructorUserId);
    if (!inScope) return scopeForbidden(res);
    const result = await instructorAvailabilityDb.getInstructorAvailabilityByUserId(req.params.instructorUserId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all instructor availabilities
router.get('/', availOps.view, async (req, res) => {
  try {
    const filters = {
      ...req.query,
      programId: req.query.programId,
      subjectId: req.query.subjectId,
      classId: req.query.classId,
    };
    const result = await instructorAvailabilityDb.getInstructorAvailabilities(filters);
    if (result.success && Array.isArray(result.data)) {
      const resolved = await resolveSchedulingClassScope(req, {
        programId: filters.programId ? parseInt(filters.programId, 10) : null,
        subjectId: filters.subjectId ? parseInt(filters.subjectId, 10) : null,
        classId: filters.classId ? parseInt(filters.classId, 10) : null,
      });
      if (!resolved.ok) {
        result.data = [];
        result.total = 0;
      } else if (!resolved.scope.unrestricted) {
        result.data = await filterInstructorAvailabilityByScope(
          result.data,
          resolved.scope,
          resolved.scopeClassIds,
        );
        result.total = result.data.length;
      }
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Update instructor availability by ID
router.put('/:id', setupOps.update, async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.updateInstructorAvailability(req.params.id, req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Delete instructor availability by ID
router.delete('/:id', setupOps.delete, async (req, res) => {
  try {
    const result = await instructorAvailabilityDb.deleteInstructorAvailability(req.params.id);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
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
    res.status(500).json({ success: false, error: "Internal server error" });
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
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
