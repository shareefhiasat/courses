import {
  createStandupAttendance as createStandupAttendanceSvc,
  getStandupAttendanceByUserAndDate as getStandupAttendanceByUserAndDateSvc,
  getAllStandupAttendanceByDate as getAllStandupAttendanceByDateSvc,
  getStandupAttendanceByClassAndDate as getStandupAttendanceByClassAndDateSvc,
  getStandupAttendanceByUser as getStandupAttendanceByUserSvc,
  getStandupAttendanceByProgramAndDate as getStandupAttendanceByProgramAndDateSvc,
  getStandupAttendanceByProgramForDateRange as getStandupAttendanceByProgramForDateRangeSvc,
  deleteStandupAttendance as deleteStandupAttendanceSvc,
} from '../services/standupAttendanceService.js';
import {
  getRequestScope,
  filterRecordsByScope,
  assertClassInScope,
  assertProgramInScope,
  isRecordInScope,
  scopeForbidden,
} from '../utils/scopeAccess.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function filterStandupResult(req, result) {
  if (!result?.success || !result.data) return result;
  const scope = req.dataScope;
  if (!scope || scope.unrestricted) return result;
  const data = Array.isArray(result.data)
    ? filterRecordsByScope(result.data, scope, { programField: 'programId', classField: 'classId' })
    : (isRecordInScope(scope, result.data) ? result.data : null);
  return { ...result, data };
}

// Create standup attendance
export const createStandupAttendance = async (req, res) => {
  try {
    const { userId, status, date, notes, programId } = req.body;
    const user = req.user;

    if (!userId || !status || !date) {
      return res.status(400).json({
        success: false,
        error: 'User ID, status, and date are required',
      });
    }

    if (programId) {
      const access = await assertProgramInScope(req, programId);
      if (!access.ok) return scopeForbidden(res);
    }

    const result = await createStandupAttendanceSvc(userId, status, date, notes, user, programId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create standup attendance controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get standup attendance by user and date
export const getStandupAttendanceByUserAndDate = async (req, res) => {
  try {
    const { userId, date } = req.params;

    if (!userId || !date) {
      return res.status(400).json({ success: false, error: 'User ID and date are required' });
    }

    const scope = await getRequestScope(req);
    req.dataScope = scope;
    const result = filterStandupResult(req, await getStandupAttendanceByUserAndDateSvc(userId, date));

    if (result.success) {
      if (result.data == null && !scope.unrestricted) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get standup attendance controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all standup attendance for a date (HR / super admin see all; others scoped)
export const getAllStandupAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const scope = await getRequestScope(req);
    req.dataScope = scope;
    const result = filterStandupResult(req, await getAllStandupAttendanceByDateSvc(date));

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get all standup attendance controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get standup attendance by class and date
export const getStandupAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.query;

    if (!classId || !date) {
      return res.status(400).json({ success: false, error: 'Class ID and date are required' });
    }

    const access = await assertClassInScope(req, classId);
    if (!access.ok) return scopeForbidden(res);

    const result = await getStandupAttendanceByClassAndDateSvc(classId, date);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get standup attendance by class and date controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all standup attendance for a user
export const getStandupAttendanceByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const scope = await getRequestScope(req);
    req.dataScope = scope;
    const result = filterStandupResult(req, await getStandupAttendanceByUserSvc(userId));

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get standup attendance by user controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all standup attendance for a program and date
export const getStandupAttendanceByProgramAndDate = async (req, res) => {
  try {
    const { programId, date } = req.query;

    if (!programId || !date) {
      return res.status(400).json({ success: false, error: 'Program ID and date are required' });
    }

    const access = await assertProgramInScope(req, programId);
    if (!access.ok) return scopeForbidden(res);

    const result = await getStandupAttendanceByProgramAndDateSvc(programId, date);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get standup attendance by program and date controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get all standup attendance for a program within a date range
export const getStandupAttendanceByProgramForDateRange = async (req, res) => {
  try {
    const { programId, startDate, endDate } = req.query;

    if (!programId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Program ID, start date, and end date are required',
      });
    }

    const access = await assertProgramInScope(req, programId);
    if (!access.ok) return scopeForbidden(res);

    const result = await getStandupAttendanceByProgramForDateRangeSvc(programId, startDate, endDate);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get standup attendance by program for date range controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Delete standup attendance by ID
export const deleteStandupAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Attendance ID is required' });
    }

    const scope = await getRequestScope(req);
    if (!scope.unrestricted) {
      const record = await prisma.standupAttendance.findUnique({ where: { id: parseInt(id, 10) } });
      if (!record || !isRecordInScope(scope, record)) {
        return scopeForbidden(res);
      }
    }

    const result = await deleteStandupAttendanceSvc(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Delete standup attendance controller error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
