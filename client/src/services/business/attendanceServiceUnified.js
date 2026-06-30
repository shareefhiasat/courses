/**
 * Unified Attendance Service - Handles all attendance operations
 * 
 * PURPOSE: Single service for all attendance operations (regular and standup)
 * - Regular attendance uses 'attendances' table for TODAY column
 * - Standup attendance uses 'standup_attendances' table for STANDUP column
 * ARCHITECTURE: Components -> Unified Attendance Service -> Database Services -> PostgreSQL
 */

import { info, error, warn, debug } from '../utils/logger.js';
import attendanceDbService from '../db/attendanceDbService-postgres.js';
import api from '@services/api/index.js';
import { ATTENDANCE_STATUS, ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes.js';
import { getDatabaseUserId } from './authService.js';

const serviceName = 'attendanceServiceUnified';

// Status code to ID mapping (matches attendance_status_types table)
const STATUS_CODE_TO_ID = {
  'PRESENT': 1,
  'ABSENT': 2,
  'ABSENT_NO_EXCUSE': 2,
  'LATE': 3,
  'EXCUSED': 4,
  'ABSENT_WITH_EXCUSE': 11,
  'EXCUSED_LEAVE': 4,
  'SICK_LEAVE': 5,
  'EARLY_DEPARTURE': 6,
  'HUMAN_CASE': 6,
  'STANDUP_PRESENT': 7,
  'STANDUP_LATE': 8,
  'STANDUP_ABSENT': 9,
  'STANDUP_CLINIC': 10
};

// Standup status mapping - now maps to actual database status codes
const STANDUP_STATUS_MAP = {
  'standup_present': 'STANDUP_PRESENT',
  'standup_absent': 'STANDUP_ABSENT',
  'standup_excused': 'STANDUP_CLINIC',
  'standup_late': 'STANDUP_LATE'
};

// Maps regular attendance statuses to their standup equivalents
const REGULAR_TO_STANDUP_STATUS = {
  'PRESENT': 'STANDUP_PRESENT',
  'LATE': 'STANDUP_LATE',
  'ABSENT': 'STANDUP_ABSENT',
  'ABSENT_NO_EXCUSE': 'STANDUP_ABSENT',
  'ABSENT_WITH_EXCUSE': 'STANDUP_ABSENT',
  'EXCUSED': 'STANDUP_ABSENT',
  'HUMAN_CASE': 'STANDUP_CLINIC',
  'EARLY_DEPARTURE': 'STANDUP_CLINIC',
  'EXCUSED_LEAVE': 'STANDUP_CLINIC',
  'CLINIC': 'STANDUP_CLINIC'
};

/**
 * Convert status string to numeric ID
 */
const getStatusId = (status) => {
  // If already a number, return it
  if (typeof status === 'number') return status;
  
  // Handle standup status prefixes
  const normalizedStatus = STANDUP_STATUS_MAP[status] || status;
  
  // Convert to uppercase to match mapping
  const upperStatus = normalizedStatus?.toUpperCase();
  const statusId = STATUS_CODE_TO_ID[upperStatus];
  
  console.log(' [DEBUG] Status conversion:', {
    originalStatus: status,
    normalizedStatus,
    upperStatus,
    statusId
  });
  
  return statusId || 2; // Default to ABSENT if not found
};

/**
 * Check if attendance already exists for a student on a specific date
 */
export const checkAttendanceExists = async (studentId, date, classId = null, attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR, programId = null) => {
  try {
    info(`${serviceName}:checkAttendanceExists`, { studentId, date, classId, attendanceMode, programId });

    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      // Check standup attendance
      const result = await api.get(`/standup-attendance/user/${studentId}/date/${date}`)
        .catch(err => {
          if (err.response?.status === 404) {
            return { success: true, data: [] };
          }
          throw err;
        });
      
      const exists = result.success && result.data && result.data.length > 0;
      return {
        success: true,
        exists,
        attendance: exists ? result.data[0] : null,
        message: exists ? 'Attendance already exists' : 'No attendance found'
      };
    } else {
      // Check regular attendance
      const result = await attendanceDbService.getByStudent(studentId, { date, classId });
      
      const exists = result.success && result.data && result.data.length > 0;
      return {
        success: true,
        exists,
        attendance: exists ? result.data[0] : null,
        message: exists ? 'Attendance already exists' : 'No attendance found'
      };
    }
  } catch (err) {
    error(`${serviceName}:checkAttendanceExists:error`, { error: err.message, studentId, date });
    return {
      success: false,
      exists: false,
      attendance: null,
      error: err.message || 'Failed to check attendance existence'
    };
  }
};

/**
 * Create attendance record - routes to appropriate table based on attendance mode
 */
export const markAttendance = async (attendanceData, user = null, attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR) => {
  console.log(' [DEBUG] attendanceServiceUnified markAttendance START:', {
    attendanceMode,
    attendanceData,
    isStandup: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
  });

  try {
    info(`${serviceName}:markAttendance`, { data: attendanceData, attendanceMode });
    
    // Validate required fields
    if (!attendanceData.userId || !attendanceData.status || !attendanceData.date) {
      error('Missing required attendance data:', attendanceData);
      return {
        success: false,
        error: { message: 'Missing required fields: userId, status, or date' },
        timestamp: Date.now()
      };
    }

    // In standup mode, convert regular status to standup equivalent
    let effectiveStatus = attendanceData.status;
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      const upperStatus = attendanceData.status?.toUpperCase();
      // If already a standup status, keep it; otherwise convert from regular
      if (upperStatus && !upperStatus.startsWith('STANDUP_')) {
        effectiveStatus = REGULAR_TO_STANDUP_STATUS[upperStatus] || upperStatus;
        console.log(' [DEBUG] Standup status conversion:', {
          originalStatus: attendanceData.status,
          convertedStatus: effectiveStatus
        });
      }
    }

    // Convert status string to numeric ID
    const statusId = getStatusId(effectiveStatus);
    
    console.log(' [DEBUG] Status ID conversion:', {
      originalStatus: attendanceData.status,
      effectiveStatus,
      convertedStatusId: statusId
    });

    console.log(' [DEBUG] User and program/subject data:', {
      user,
      userUid: user?.uid,
      userId: user?.id,
      attendanceDataProgramId: attendanceData.programId,
      attendanceDataSubjectId: attendanceData.subjectId
    });

    // Log mode-specific behavior
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      info(' [STANDUP MODE] Marking standup attendance:', {
        studentId: attendanceData.userId,
        status: attendanceData.status,
        statusId: statusId,
        expectedStatus: attendanceData.status?.startsWith('standup_') ? attendanceData.status : `standup_${attendanceData.status}`
      });
    } else {
      info(' [REGULAR MODE] Marking regular attendance:', {
        studentId: attendanceData.userId,
        status: attendanceData.status,
        statusId: statusId,
        isStandupStatus: attendanceData.status?.startsWith('standup_')
      });
    }
    
    // Business rules validation
    if (!attendanceData.userId) {
      return {
        success: false,
        error: 'Student ID is required',
        data: null
      };
    }
    
    if (!attendanceData.classId && attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR) {
      return {
        success: false,
        error: 'Class ID is required for regular attendance',
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
    
    // Debug: Log attendance routing
    console.log('DEBUG markAttendance:', {
      attendanceMode,
      attendanceData,
      isStandup: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
    });

    // Route to appropriate service based on attendance mode
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      // Use standup attendance API
      console.log('DEBUG: Using standup attendance API');
      
      const result = await api.post('/standup-attendance', {
        userId: parseInt(attendanceData.userId),
        status: effectiveStatus?.toUpperCase(),
        statusId: statusId,
        date: attendanceData.date,
        notes: attendanceData.notes || null,
        programId: attendanceData.programId ? parseInt(attendanceData.programId) : null
      });

      // Clear cached standup-attendance GET responses so refetch gets fresh data
      api.clearCacheByPrefix('/standup-attendance');

      return {
        success: result.success || result.status === 201,
        data: result.data || result,
        message: result.message || 'Standup attendance marked successfully'
      };
    } else {
      // Use regular attendance service
      return await createRegularAttendance(attendanceData, user);
    }
  } catch (err) {
    error(`${serviceName}:markAttendance:error`, { error: err.message, data: attendanceData, attendanceMode });
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

    // Convert status string to numeric ID
    const statusId = getStatusId(attendanceData.status);

    // Get database user ID from Keycloak user (PostgreSQL uses integer user ID, not Firebase uid)
    const dbUserId = await getDatabaseUserId(user);

    console.log('🔧 [DEBUG] Database user ID lookup:', {
      userEmail: user?.email,
      userUid: user?.uid,
      dbUserId
    });

    // Prepare data for database
    const processedData = {
      userId: parseInt(attendanceData.userId),
      classId: parseInt(attendanceData.classId),
      status: attendanceData.status?.toUpperCase(),  // Send uppercase status code as expected by backend
      statusId: statusId,  // Also include statusId for compatibility
      date: attendanceData.date.includes('T') ? new Date(attendanceData.date) : new Date(attendanceData.date + 'T00:00:00Z'),
      notes: attendanceData.notes || null,
      createdBy: dbUserId,  // Use database user ID (integer) instead of Firebase uid (UUID string)
      programId: attendanceData.programId ? parseInt(attendanceData.programId) : null,
      subjectId: attendanceData.subjectId ? parseInt(attendanceData.subjectId) : null
    };

    console.log('🔧 [DEBUG] Data being sent to database:', {
      processedData,
      originalAttendanceData: attendanceData,
      user
    });
    
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
export const deleteAttendance = async (id, attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR) => {
  try {
    info(`${serviceName}:deleteAttendance`, { id, attendanceMode });
    
    if (!id) {
      return {
        success: false,
        error: 'Attendance ID is required',
        data: null
      };
    }
    
    // Route to appropriate service based on attendance mode
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      // Use standup attendance API
      const result = await api.delete(`/standup-attendance/${id}`);
      
      // Clear cached standup-attendance GET responses so refetch gets fresh data
      api.clearCacheByPrefix('/standup-attendance');
      
      return {
        success: result.success,
        message: result.success ? 'Standup attendance deleted successfully' : result.error,
        data: null
      };
    } else {
      // Use regular attendance service
      const result = await attendanceDbService.delete(id);
      info(`${serviceName}:deleteAttendance:success`, { id });
      
      return {
        success: result.success,
        message: result.success ? 'Attendance deleted successfully' : result.error,
        data: null
      };
    }
  } catch (err) {
    error(`${serviceName}:deleteAttendance:error`, { error: err.message, id, attendanceMode });
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
    const standupResult = await api.get(`/standup-attendance/user/${studentId}/date/${date}`)
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
    
    // Get standup attendance
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

/**
 * Legacy functions for backward compatibility
 */
export const getAttendanceByStudent = async (studentId, params = {}) => {
  try {
    info(`${serviceName}:getAttendanceByStudent`, { studentId, params });
    const result = await attendanceDbService.getByStudent(studentId, params);
    return {
      success: result.success,
      data: result.data || [],
      message: result.success ? 'Attendance records retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceByStudent:error`, { error: err.message, studentId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve attendance records',
      data: []
    };
  }
};

export const getAttendanceByClass = async (classId, params = {}) => {
  try {
    info(`${serviceName}:getAttendanceByClass`, { classId, params });
    const result = await attendanceDbService.getByClass(classId, params);
    return {
      success: result.success,
      data: result.data || [],
      message: result.success ? 'Class attendance retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceByClass:error`, { error: err.message, classId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve class attendance',
      data: []
    };
  }
};

export const rosterQuickAction = async (studentId, classId, status, user = null, notes = null, programId = null, subjectId = null, date = null, attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR) => {
  try {
    console.log(' [DEBUG] rosterQuickAction SERVICE called with:', {
      studentId,
      classId,
      status,
      user,
      programId,
      subjectId,
      date,
      attendanceMode,
      userId: user?.id
    });
    info(`${serviceName}:rosterQuickAction`, { studentId, classId, status, user, attendanceMode });

    // Use markAttendance with the provided attendance mode
    return await markAttendance({
      userId: studentId,
      classId: classId,
      status: status,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes,
      programId: programId,
      subjectId: subjectId
    }, user, attendanceMode);
  } catch (err) {
    error(`${serviceName}:rosterQuickAction:error`, { error: err.message, studentId, classId, status, attendanceMode });
    return {
      success: false,
      error: err.message || 'Failed to perform quick action',
      data: null
    };
  }
};

const markAllPresent = async (params) => {
  const { classId, date, studentIds, user } = params;
  const results = [];
  
  for (const studentId of studentIds) {
    const result = await markAttendance({
      userId: studentId,
      classId,
      date,
      status: ATTENDANCE_STATUS.PRESENT,
      notes: null
    }, user);
    
    results.push({
      studentId,
      success: result.success,
      error: result.error
    });
  }
  
  return {
    success: true,
    data: results,
    message: 'Bulk attendance marked successfully'
  };
};

const markAllAbsent = async (params) => {
  const { classId, date, studentIds, user } = params;
  const results = [];
  
  for (const studentId of studentIds) {
    const result = await markAttendance({
      userId: studentId,
      classId,
      date,
      status: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
      notes: null
    }, user);
    
    results.push({
      studentId,
      success: result.success,
      error: result.error
    });
  }
  
  return {
    success: true,
    data: results,
    message: 'Bulk attendance marked successfully'
  };
};
