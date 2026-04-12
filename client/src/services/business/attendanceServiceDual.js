/**
 * Dual Attendance Service - Handles both Regular and Standup Attendance
 * 
 * PURPOSE: Business logic layer for attendance operations with separate tables
 * - Regular attendance uses 'attendances' table for TODAY column
 * - Standup attendance uses 'standup_attendances' table for STANDUP column
 * ARCHITECTURE: Components -> Business Services -> Database Services -> PostgreSQL
 */

import { info, error, warn, debug } from '../utils/logger.js';
import attendanceDbService from '../db/attendanceDbService-postgres.js';
import api from '@services/api/index.js';
import { createStandupAttendance, deleteStandupAttendance } from './standupAttendanceService.js';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';

const serviceName = 'attendanceServiceDual';

/**
 * Create attendance record - routes to appropriate table based on attendance mode
 */
export const createAttendanceRecord = async (attendanceData, user = null, attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR) => {
  try {
    info(`${serviceName}:createAttendanceRecord`, { data: attendanceData, attendanceMode });
    
    // Business rules validation
    if (!attendanceData.userId) {
      return {
        success: false,
        error: 'Student ID is required',
        data: null
      };
    }
    
    if (!attendanceData.classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: null
      };
    }
    
    if (!attendanceData.date) {
      return {
        success: false,
        error: 'Date is required',
        data: null
      };
    }
    
    // Route to appropriate service based on attendance mode
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      // Use standup attendance service
      const standupData = {
        userId: attendanceData.userId,
        status: attendanceData.status,
        date: attendanceData.date,
        notes: attendanceData.notes || null
      };
      
      return await createStandupAttendance(standupData, user);
    } else {
      // Use regular attendance service
      return await createRegularAttendance(attendanceData, user);
    }
  } catch (err) {
    error(`${serviceName}:createAttendanceRecord:error`, { error: err.message, data: attendanceData, attendanceMode });
    return {
      success: false,
      error: err.message || 'Failed to mark attendance',
      data: null
    };
  }
};

/**
 * Create regular attendance record (for TODAY column)
 */
const createRegularAttendance = async (attendanceData, user = null) => {
  try {
    info(`${serviceName}:createRegularAttendance`, { data: attendanceData });
    
    // Map status strings to status codes (database uses codes, not IDs)
    let statusCode;
    const statusMap = {
      'present': 'PRESENT',
      'late': 'LATE',
      'absent': 'ABSENT',
      'absent_no_excuse': 'ABSENT',
      'absent_with_excuse': 'EXCUSED',
      'excused_leave': 'EXCUSED',
      'sick_leave': 'SICK_LEAVE',
      'early_departure': 'EARLY_DEPARTURE'
    };
    
    statusCode = statusMap[attendanceData.status] || statusMap['present'];
    
    // Prepare data for database
    const processedData = {
      userId: parseInt(attendanceData.userId),
      classId: parseInt(attendanceData.classId),
      status: statusCode,  // Use status code instead of statusId
      date: attendanceData.date.includes('T') ? new Date(attendanceData.date) : new Date(attendanceData.date + 'T00:00:00Z'),
      notes: attendanceData.notes || null,
      createdBy: user?.id || null
    };
    
    // Use actual database service
    const result = await attendanceDbService.create(processedData);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Attendance marked successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to mark attendance',
        data: null
      };
    }
    
  } catch (err) {
    error(`${serviceName}:createRegularAttendance:error`, { error: err.message, data: attendanceData });
    return {
      success: false,
      error: err.message || 'Failed to mark attendance',
      data: null
    };
  }
};

/**
 * Delete attendance record - routes to appropriate service based on attendance mode
 */
export const deleteAttendanceRecord = async (id, attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR) => {
  try {
    info(`${serviceName}:deleteAttendanceRecord`, { id, attendanceMode });
    
    if (!id) {
      return {
        success: false,
        error: 'Attendance ID is required',
        data: null
      };
    }
    
    // Route to appropriate service based on attendance mode
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      // Use standup attendance service
      return await deleteStandupAttendance(id);
    } else {
      // Use regular attendance service
      const result = await attendanceDbService.delete(id);
      info(`${serviceName}:deleteAttendanceRecord:success`, { id });
      
      return {
        success: result.success,
        message: result.success ? 'Attendance deleted successfully' : result.error,
        data: null
      };
    }
  } catch (err) {
    error(`${serviceName}:deleteAttendanceRecord:error`, { error: err.message, id, attendanceMode });
    return {
      success: false,
      error: err.message || 'Failed to delete attendance',
      data: null
    };
  }
};

/**
 * Get student's attendance for a specific date (both regular and standup)
 */
export const getStudentAttendanceByDate = async (studentId, date) => {
  try {
    info(`${serviceName}:getStudentAttendanceByDate`, { studentId, date });
    
    // Get regular attendance
    const regularResult = await attendanceDbService.getByStudent(studentId, { date });
    
    // Get standup attendance
    const standupResult = await import('./standupAttendanceService.js').then(
      service => service.getStandupAttendanceByUserAndDate(studentId, date)
    );
    
    return {
      success: true,
      data: {
        regular: regularResult.data || [],
        standup: standupResult.data || []
      },
      message: 'Student attendance retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getStudentAttendanceByDate:error`, { error: err.message, studentId, date });
    return {
      success: false,
      error: err.message || 'Failed to retrieve student attendance',
      data: { regular: [], standup: [] }
    };
  }
};

/**
 * Get class attendance for a specific date (both regular and standup)
 */
export const getClassAttendanceByDate = async (classId, date) => {
  try {
    info(`${serviceName}:getClassAttendanceByDate`, { classId, date });
    
    // Get regular attendance
    const regularResult = await attendanceDbService.getByClass(classId, { date });
    
    // Get standup attendance using API service directly
    const standupResult = await api.get(`/standup-attendance/class?classId=${classId}&date=${date}`)
      .catch(err => {
        // Treat 404 as "no data" (expected when no standup attendance exists yet)
        if (err.response?.status === 404) {
          return { success: true, data: [] };
        }
        throw err;
      });
    
    return {
      success: true,
      data: {
        regular: regularResult.data || [],
        standup: standupResult.data || []
      },
      message: 'Class attendance retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getClassAttendanceByDate:error`, { error: err.message, classId, date });
    return {
      success: false,
      error: err.message || 'Failed to retrieve class attendance',
      data: { regular: [], standup: [] }
    };
  }
};


