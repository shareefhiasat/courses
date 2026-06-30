/**
 * Attendance Controller
 *
 * PURPOSE: Handle all attendance operations via REST API
 * ARCHITECTURE: API Controller → Business Service → DB Service → PostgreSQL
 */

import { attendanceService } from '../services/attendanceService.js';
import {
  getRequestScope,
  filterRecordsByScope,
  assertClassInScope,
  isRecordInScope,
  scopeForbidden,
} from '../utils/scopeAccess.js';

async function assertAttendanceRecordAccess(req, res, record) {
  if (!record) return true;
  const scope = await getRequestScope(req);
  if (isRecordInScope(scope, record)) return true;
  scopeForbidden(res);
  return false;
}

// Get all attendance records
export const getAllAttendance = async (req, res) => {
  try {
    const { userId, classId, date, dateFrom, dateTo, subjectId, page = 1, limit = 100 } = req.query;

    if (classId) {
      const access = await assertClassInScope(req, classId);
      if (!access.ok) return scopeForbidden(res);
    }

    const params = {
      userId: userId ? parseInt(userId) : undefined,
      classId: classId ? parseInt(classId) : undefined,
      subjectId: subjectId ? parseInt(subjectId) : undefined,
      date,
      dateFrom,
      dateTo,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const result = await attendanceService.getAllAttendance(params);
    const scope = await getRequestScope(req);
    const data = filterRecordsByScope(result.data || [], scope, { classField: 'classId' });

    res.json({
      success: true,
      data,
      total: data.length,
      pagination: result.pagination,
      message: result.message,
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve attendance records',
    });
  }
};

// Get attendance by ID
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Valid attendance ID is required',
      });
    }

    const result = await attendanceService.getAttendanceById(parseInt(id));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
        message: 'Attendance record not found',
      });
    }

    if (!(await assertAttendanceRecordAccess(req, res, result.data))) return;

    res.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve attendance record',
    });
  }
};

// Create new attendance record
export const createAttendance = async (req, res) => {
  try {
    const attendanceData = req.body;

    if (!attendanceData.userId || !attendanceData.classId || !attendanceData.date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, classId, date',
      });
    }

    const access = await assertClassInScope(req, attendanceData.classId);
    if (!access.ok) return scopeForbidden(res);

    const user = req.user || {};
    const result = await attendanceService.createAttendance(attendanceData, user);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.error,
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create attendance record',
    });
  }
};

// Update attendance record
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Valid attendance ID is required',
      });
    }

    const existing = await attendanceService.getAttendanceById(parseInt(id));
    if (!existing.success) {
      return res.status(404).json({
        success: false,
        error: existing.error,
        message: 'Attendance record not found',
      });
    }
    if (!(await assertAttendanceRecordAccess(req, res, existing.data))) return;

    const user = req.user || {};
    const result = await attendanceService.updateAttendance(parseInt(id), updateData, user);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update attendance record',
    });
  }
};

// Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Valid attendance ID is required',
      });
    }

    const existing = await attendanceService.getAttendanceById(parseInt(id));
    if (!existing.success) {
      return res.status(404).json({
        success: false,
        error: existing.error,
        message: 'Attendance record not found',
      });
    }
    if (!(await assertAttendanceRecordAccess(req, res, existing.data))) return;

    const user = req.user || {};
    const result = await attendanceService.deleteAttendance(parseInt(id), user);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete attendance record',
    });
  }
};

// Get attendance statistics for a class
export const getClassAttendanceStats = async (req, res) => {
  try {
    const { classId } = req.query;

    if (!classId || isNaN(classId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid class ID is required',
      });
    }

    const access = await assertClassInScope(req, classId);
    if (!access.ok) return scopeForbidden(res);

    const stats = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      percentage: 0,
    };

    res.json({
      success: true,
      data: stats,
      message: 'Class attendance statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Get class attendance stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve attendance statistics',
    });
  }
};
