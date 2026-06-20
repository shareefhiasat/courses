/**
 * Schedule Sessions Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for schedule session operations with conflict detection
 * ARCHITECTURE: HTTP Requests → Controllers → Conflict Detection Service → DB Services → PostgreSQL
 */

import {
  getScheduleSessions,
  getScheduleSessionById,
  getScheduleSessionsByDateRange,
  createScheduleSession,
  updateScheduleSession,
  deleteScheduleSession,
  cancelScheduleSession,
  bulkCreateScheduleSessions
} from '../db/schedule-sessions-postgres.js';
import { detectConflicts, getLocalizedConflictMessage } from '../services/conflict-detection.js';
import { applyListScope } from '../utils/applyListScope.js';

/**
 * GET /api/v1/schedule-sessions
 * Get all schedule sessions
 */
export const getAllScheduleSessionsController = async (req, res) => {
  try {
    const result = await applyListScope(req, await getScheduleSessions(req.query), 'classLinked');
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getAllScheduleSessionsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/schedule-sessions/range
 * Get schedule sessions by date range
 */
export const getScheduleSessionsByRangeController = async (req, res) => {
  try {
    const result = await applyListScope(req, await getScheduleSessionsByDateRange(req.query), 'classLinked');
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getScheduleSessionsByRangeController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/schedule-sessions/:id
 * Get schedule session by ID
 */
export const getScheduleSessionByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getScheduleSessionById(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in getScheduleSessionByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/schedule-sessions/check-conflicts
 * Check for scheduling conflicts without creating session
 */
export const checkConflictsController = async (req, res) => {
  try {
    const conflictResult = await detectConflicts(req.body);
    
    res.status(200).json({
      success: true,
      ...conflictResult
    });
  } catch (error) {
    console.error('Error in checkConflictsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/schedule-sessions
 * Create new schedule session with conflict detection
 */
export const createScheduleSessionController = async (req, res) => {
  try {
    const { instructorUserId, date, timeSlotId, classroomId, programId } = req.body;
    
    // Check for conflicts before creating
    const conflictResult = await detectConflicts({
      instructorUserId,
      date,
      timeSlotId,
      classroomId,
      programId
    });
    
    if (conflictResult.hasConflicts) {
      // Get user's preferred language from headers or default to 'en'
      const lang = req.headers['accept-language']?.split(',')[0] || 'en';
      
      const localizedConflicts = conflictResult.conflicts.map(conflict => ({
        ...conflict,
        message: getLocalizedConflictMessage(conflict, lang)
      }));
      
      return res.status(409).json({
        success: false,
        error: 'Scheduling conflict detected',
        code: 'CONFLICT',
        conflicts: localizedConflicts
      });
    }
    
    // No conflicts, proceed with creation
    const result = await createScheduleSession(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in createScheduleSessionController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/schedule-sessions/:id
 * Update schedule session with conflict detection
 */
export const updateScheduleSessionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructorUserId, date, timeSlotId, classroomId, programId } = req.body;
    
    // Check for conflicts (excluding current session)
    const conflictResult = await detectConflicts({
      instructorUserId,
      date,
      timeSlotId,
      classroomId,
      programId,
      excludeSessionId: id
    });
    
    if (conflictResult.hasConflicts) {
      const lang = req.headers['accept-language']?.split(',')[0] || 'en';
      
      const localizedConflicts = conflictResult.conflicts.map(conflict => ({
        ...conflict,
        message: getLocalizedConflictMessage(conflict, lang)
      }));
      
      return res.status(409).json({
        success: false,
        error: 'Scheduling conflict detected',
        code: 'CONFLICT',
        conflicts: localizedConflicts
      });
    }
    
    const result = await updateScheduleSession(id, req.body);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in updateScheduleSessionController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/schedule-sessions/:id/cancel
 * Cancel a schedule session
 */
export const cancelScheduleSessionController = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;
    
    const result = await cancelScheduleSession(id, cancelReason);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in cancelScheduleSessionController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/schedule-sessions/:id
 * Delete a schedule session
 */
export const deleteScheduleSessionController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteScheduleSession(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in deleteScheduleSessionController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/schedule-sessions/bulk
 * Bulk create schedule sessions
 */
export const bulkCreateScheduleSessionsController = async (req, res) => {
  try {
    const { sessions } = req.body;
    
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({
        success: false,
        error: 'sessions array is required'
      });
    }
    
    // Check conflicts for all sessions
    const conflictResults = await Promise.all(
      sessions.map(session => detectConflicts(session))
    );
    
    const hasAnyConflicts = conflictResults.some(result => result.hasConflicts);
    
    if (hasAnyConflicts) {
      const lang = req.headers['accept-language']?.split(',')[0] || 'en';
      
      const allConflicts = conflictResults
        .filter(result => result.hasConflicts)
        .flatMap((result, index) => 
          result.conflicts.map(conflict => ({
            ...conflict,
            message: getLocalizedConflictMessage(conflict, lang),
            sessionIndex: index
          }))
        );
      
      return res.status(409).json({
        success: false,
        error: 'Scheduling conflicts detected',
        code: 'CONFLICT',
        conflicts: allConflicts
      });
    }
    
    const result = await bulkCreateScheduleSessions(sessions);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        count: result.count,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Error in bulkCreateScheduleSessionsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
