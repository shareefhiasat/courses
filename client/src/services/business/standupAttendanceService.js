/**
 * Standup Attendance Service - Client Business Logic
 *
 * PURPOSE: Business logic layer for standup attendance operations
 * ARCHITECTURE: Components → Services → REST API → Backend → Prisma → PostgreSQL
 */

import { info, error, warn, debug } from '../utils/logger.js';
import api from '@services/api/index.js';

const serviceName = 'standupAttendanceService';

export const createStandupAttendance = async (attendanceData, user = null) => {
  try {
    info(`${serviceName}:createStandupAttendance`, { data: attendanceData });

    if (!attendanceData.userId || !attendanceData.status || !attendanceData.date) {
      return {
        success: false,
        error: 'userId, status, and date are required',
        data: null
      };
    }

    const result = await api.post('/standup-attendance', {
      userId: parseInt(attendanceData.userId),
      status: attendanceData.status,
      date: attendanceData.date,
      notes: attendanceData.notes || null,
      programId: attendanceData.programId ? parseInt(attendanceData.programId) : null
    });

    api.clearCacheByPrefix('/standup-attendance');

    return {
      success: result.success || result.status === 201,
      data: result.data || result,
      message: result.message || 'Standup attendance marked successfully'
    };
  } catch (err) {
    error(`${serviceName}:createStandupAttendance:error`, { error: err.message, data: attendanceData });
    return {
      success: false,
      error: err.message || 'Failed to mark standup attendance',
      data: null
    };
  }
};

export const getStandupAttendanceByUserAndDate = async (userId, date) => {
  try {
    info(`${serviceName}:getStandupAttendanceByUserAndDate`, { userId, date });
    const result = await api.get(`/standup-attendance/user/${userId}/date/${date}`);
    return {
      success: true,
      data: result.data || result,
      message: 'Standup attendance retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getStandupAttendanceByUserAndDate:error`, { error: err.message, userId, date });
    return {
      success: false,
      error: err.message || 'Failed to retrieve standup attendance',
      data: null
    };
  }
};

export const getStandupAttendanceByClassAndDate = async (classId, date) => {
  try {
    info(`${serviceName}:getStandupAttendanceByClassAndDate`, { classId, date });
    const result = await api.get(`/standup-attendance/class?classId=${classId}&date=${date}`);
    return {
      success: true,
      data: result.data || [],
      message: 'Standup attendance retrieved successfully'
    };
  } catch (err) {
    // Treat 404 as "no data" (expected when no standup attendance exists yet)
    if (err.response?.status === 404) {
      debug(`${serviceName}:getStandupAttendanceByClassAndDate:no_data`, { classId, date });
      return {
        success: true,
        data: [],
        message: 'No standup attendance data found'
      };
    }
    error(`${serviceName}:getStandupAttendanceByClassAndDate:error`, { error: err.message, classId, date });
    return {
      success: false,
      error: err.message || 'Failed to retrieve standup attendance',
      data: []
    };
  }
};

export const getStandupAttendanceByUser = async (userId) => {
  try {
    info(`${serviceName}:getStandupAttendanceByUser`, { userId });
    const result = await api.get(`/standup-attendance/user/${userId}`);
    return {
      success: true,
      data: result.data || [],
      message: 'Standup attendance retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getStandupAttendanceByUser:error`, { error: err.message, userId });
    return {
      success: false,
      error: err.message || 'Failed to retrieve standup attendance',
      data: []
    };
  }
};

export const getStandupAttendanceByProgramAndDate = async (programId, date) => {
  try {
    info(`${serviceName}:getStandupAttendanceByProgramAndDate`, { programId, date });
    const result = await api.get(`/standup-attendance/program?programId=${programId}&date=${date}`);
    return {
      success: true,
      data: result.data || [],
      message: 'Standup attendance retrieved successfully'
    };
  } catch (err) {
    // Treat 404 as "no data" (expected when no standup attendance exists yet)
    if (err.response?.status === 404) {
      debug(`${serviceName}:getStandupAttendanceByProgramAndDate:no_data`, { programId, date });
      return {
        success: true,
        data: [],
        message: 'No standup attendance data found'
      };
    }
    error(`${serviceName}:getStandupAttendanceByProgramAndDate:error`, { error: err.message, programId, date });
    return {
      success: false,
      error: err.message || 'Failed to retrieve standup attendance',
      data: []
    };
  }
};

export const deleteStandupAttendance = async (id) => {
  try {
    info(`${serviceName}:deleteStandupAttendance`, { id });
    const result = await api.delete(`/standup-attendance/${id}`);
    api.clearCacheByPrefix('/standup-attendance');
    return {
      success: true,
      message: 'Standup attendance deleted successfully'
    };
  } catch (err) {
    error(`${serviceName}:deleteStandupAttendance:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete standup attendance'
    };
  }
};

export const getStandupAttendanceByProgramForDateRange = async (programId, startDate, endDate) => {
  try {
    info(`${serviceName}:getStandupAttendanceByProgramForDateRange`, { programId, startDate, endDate });
    const result = await api.get(`/standup-attendance/program/range?programId=${programId}&startDate=${startDate}&endDate=${endDate}`);
    return {
      success: true,
      data: result.data || [],
      message: 'Standup attendance for date range retrieved successfully'
    };
  } catch (err) {
    // Treat 404 as "no data" (expected when no standup attendance exists yet)
    if (err.response?.status === 404) {
      debug(`${serviceName}:getStandupAttendanceByProgramForDateRange:no_data`, { programId, startDate, endDate });
      return {
        success: true,
        data: [],
        message: 'No standup attendance data found for date range'
      };
    }
    error(`${serviceName}:getStandupAttendanceByProgramForDateRange:error`, { error: err.message, programId, startDate, endDate });
    return {
      success: false,
      error: err.message || 'Failed to retrieve standup attendance for date range',
      data: []
    };
  }
};
