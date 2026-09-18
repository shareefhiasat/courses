/**
 * Attendance Amendment Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for attendance amendment operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { amendAttendance, approveAttendanceExcuse, getAmendmentsForAttendance, getAllAmendments } from '../services/attendanceAmendmentService.js';
import { logPermissionDenial } from '../services/permissionDenialAuditService.js';

/**
 * POST /api/v1/attendance-amendment
 * Amend an attendance record
 */
export const amendAttendanceController = async (req, res) => {
  try {
    const { attendanceId, toStatusId, reason, workflowDocumentId } = req.body;
    const { user } = req;

    // Validate HR role
    if (!user || !user.roles || !user.roles.includes('hr')) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'amendAttendance',
        resource: `attendance/${attendanceId}`,
        reason: 'HR role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR role required.'
      });
    }

    // Validate required fields
    if (!attendanceId || !toStatusId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'attendanceId, toStatusId, and reason are required'
      });
    }

    // Amend attendance
    const result = await amendAttendance({
      attendanceId: parseInt(attendanceId),
      toStatusId: parseInt(toStatusId),
      reason,
      amendedBy: user.dbId,
      workflowDocumentId: workflowDocumentId ? parseInt(workflowDocumentId) : null
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in amendAttendanceController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/attendance-amendment/:attendanceId
 * Get amendments for a specific attendance record
 */
export const getAttendanceAmendmentsController = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { user } = req;

    // Validate HR role
    if (!user || !user.roles || !user.roles.includes('hr')) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'getAttendanceAmendments',
        resource: `attendance/${attendanceId}/amendments`,
        reason: 'HR role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR role required.'
      });
    }

    const result = await getAmendmentsForAttendance(parseInt(attendanceId));

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getAttendanceAmendmentsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/attendance-amendment
 * Get all attendance amendments with filters
 */
export const getAllAttendanceAmendmentsController = async (req, res) => {
  try {
    const { startDate, endDate, amendedBy, limit, offset } = req.query;
    const { user } = req;

    // Validate HR role
    if (!user || !user.roles || !user.roles.includes('hr')) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'getAllAttendanceAmendments',
        resource: 'attendance-amendment',
        reason: 'HR role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR role required.'
      });
    }

    const result = await getAllAmendments({
      startDate,
      endDate,
      amendedBy,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getAllAttendanceAmendmentsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/attendance-amendment/approve
 * Approve an attendance excuse (reduces deduction from 0.5 to 0.25)
 */
export const approveAttendanceExcuseController = async (req, res) => {
  try {
    const { attendanceId, reason, attachmentUrl, attachmentName, attachmentType } = req.body;
    const { user } = req;

    const canApprove = user?.roles?.some((r) => ['hr', 'admin'].includes(r));
    if (!canApprove) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'approveAttendanceExcuse',
        resource: `attendance/${attendanceId}`,
        reason: 'HR or Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({ success: false, error: 'Access denied. HR or Admin role required.' });
    }

    if (!attendanceId || !reason) {
      return res.status(400).json({ success: false, error: 'attendanceId and reason are required' });
    }

    const result = await approveAttendanceExcuse({
      attendanceId: parseInt(attendanceId),
      reason,
      attachmentUrl,
      attachmentName,
      attachmentType,
      amendedBy: user.dbId
    });

    if (result.success) {
      res.status(200).json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Error in approveAttendanceExcuseController:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export default {
  amendAttendanceController,
  approveAttendanceExcuseController,
  getAttendanceAmendmentsController,
  getAllAttendanceAmendmentsController
};
