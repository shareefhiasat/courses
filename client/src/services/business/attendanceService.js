/**
 * Attendance Service - Pure ES6
 * 
 * PURPOSE:
 * Business logic layer for attendance-related operations
 * This service orchestrates database operations and implements business rules
 * 
 * ARCHITECTURE:
 * Frontend Components → Business Services → Database Services → PostgreSQL
 */

import { info, error, warn, debug } from '../utils/logger.js';
import attendanceDbService from '../db/attendanceDbService-postgres.js';

const serviceName = 'attendanceService';

const getAllAttendance = async (params = {}) => {
  try {
    info(`${serviceName}:getAllAttendance`, { params });
    
    const result = await attendanceDbService.getAll(params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      pagination: result.pagination || { page: 1, limit: 10, total: 0 },
      message: result.success ? 'Attendance records retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getAllAttendance:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve attendance records',
      data: []
    };
  }
};

const getAttendanceById = async (id) => {
  try {
    info(`${serviceName}:getAttendanceById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Attendance ID is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: null,
      message: 'Attendance record retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve attendance record',
      data: null
    };
  }
};

const createAttendance = async (attendanceData, user = null) => {
  try {
    info(`${serviceName}:createAttendance`, { data: attendanceData });
    
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
    
    // Map status strings to status codes (database uses codes, not IDs)
    let statusCode;
    const statusMap = {
      'present': 'PRESENT',
      'late': 'LATE',
      'absent': 'ABSENT',
      'absent_no_excuse': 'ABSENT',
      'absent_with_excuse': 'EXCUSED',
      'excused_leave': 'EXCUSED',
      'human_case': 'HUMAN_CASE',
      'standup_present': 'STANDUP_PRESENT',
      'standup_late': 'STANDUP_LATE',
      'standup_absent': 'STANDUP_ABSENT',
      'standup_excused': 'STANDUP_CLINIC',
      'sick_leave': 'SICK_LEAVE'
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
    error(`${serviceName}:createAttendance:error`, { error: err.message, data: attendanceData });
    return {
      success: false,
      error: err.message || 'Failed to mark attendance',
      data: null
    };
  }
};

const updateAttendance = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateAttendance`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Attendance ID is required',
        data: null
      };
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    updateData.updatedBy = user?.id || null;
    
    // Mock implementation - replace with actual database call
    const updatedAttendance = {
      id: parseInt(id),
      ...updateData
    };
    
    return {
      success: true,
      data: updatedAttendance,
      message: 'Attendance updated successfully'
    };
  } catch (err) {
    error(`${serviceName}:updateAttendance:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update attendance',
      data: null
    };
  }
};

const deleteAttendance = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteAttendance`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Attendance ID is required',
        data: null
      };
    }
    
    const result = await attendanceDbService.delete(id);
    info(`${serviceName}:deleteAttendance:success`, { id });
    
    return {
      success: result.success,
      message: result.success ? 'Attendance deleted successfully' : result.error,
      data: null
    };
  } catch (err) {
    error(`${serviceName}:deleteAttendance:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete attendance',
      data: null
    };
  }
};

const getAttendanceByStudent = async (studentId, params = {}) => {
  try {
    info(`${serviceName}:getAttendanceByStudent`, { studentId, params });
    
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID is required',
        data: []
      };
    }
    
    const result = await attendanceDbService.getByStudent(studentId, params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
      message: result.success ? 'Student attendance retrieved successfully' : result.error
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceByStudent:error`, { error: err.message, studentId, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve student attendance',
      data: []
    };
  }
};

const getAttendanceByClass = async (classId, params = {}) => {
  try {
    info(`${serviceName}:getAttendanceByClass`, { classId, params });

    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: []
      };
    }

    const result = await attendanceDbService.getByClass(classId, params);
    return {
      success: result.success,
      data: result.data || [],
      total: result.total || 0,
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

const getAttendanceByDate = async (date, params = {}) => {
  try {
    info(`${serviceName}:getAttendanceByDate`, { date, params });
    
    if (!date) {
      return {
        success: false,
        error: 'Date is required',
        data: []
      };
    }
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: [],
      total: 0,
      message: 'Attendance by date retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceByDate:error`, { error: err.message, date, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve attendance by date',
      data: []
    };
  }
};

const getAttendanceStats = async (params = {}) => {
  try {
    info(`${serviceName}:getAttendanceStats`, { params });
    
    // Mock implementation - replace with actual database call
    return {
      success: true,
      data: {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0
      },
      message: 'Attendance statistics retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceStats:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve attendance statistics',
      data: null
    };
  }
};

const markAttendance = async (attendanceData, user = null) => {
  return await createAttendance(attendanceData, user);
};

const bulkMarkAttendance = async (attendanceRecords, user = null) => {
  try {
    info(`${serviceName}:bulkMarkAttendance`, { count: attendanceRecords?.length });
    
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return {
        success: false,
        error: 'Attendance records array is required',
        data: null
      };
    }
    
    // Mock implementation - replace with actual database call
    const results = attendanceRecords.map(record => ({
      id: Date.now() + Math.random(),
      ...record,
      markedAt: new Date(),
      markedBy: user?.id || null
    }));
    
    return {
      success: true,
      data: results,
      total: results.length,
      message: 'Bulk attendance marked successfully'
    };
  } catch (err) {
    error(`${serviceName}:bulkMarkAttendance:error`, { error: err.message });
    return {
      success: false,
      error: err.message || 'Failed to mark bulk attendance',
      data: null
    };
  }
};

// Export these functions for components
export { markAttendance, bulkMarkAttendance };

// Additional functions for components
export const getTodayAttendanceStatus = async (studentId) => {
  try {
    info(`${serviceName}:getTodayAttendanceStatus`, { studentId });
    
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID is required',
        data: null
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const attendance = await getAttendanceByStudent(studentId, { date: today });
    
    return {
      success: true,
      data: {
        isMarked: attendance.data.length > 0,
        attendance: attendance.data[0] || null
      },
      message: 'Today\'s attendance status retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getTodayAttendanceStatus:error`, { error: err.message, studentId });
    return {
      success: false,
      error: err.message || 'Failed to get today\'s attendance status',
      data: null
    };
  }
};

export const isStudentMarkedToday = async (studentId) => {
  const result = await getTodayAttendanceStatus(studentId);
  return result.data?.isMarked || false;
};

export const rosterQuickAction = async (studentId, classId, status, user = null, notes = null, programId = null, subjectId = null, date = null) => {
  return await markAttendance({
    userId: studentId,
    classId: classId,
    status: status,
    date: date || new Date().toISOString().split('T')[0],
    notes: notes,
    method: 'manual',
    programId: programId,
    subjectId: subjectId
  }, user);
};

// Session management functions
export const createSession = async (sessionData, user = null) => {
  try {
    info(`${serviceName}:createSession`, { data: sessionData });
    
    // Mock implementation - return session ID directly as expected by AttendancePage
    const sessionId = 'session-' + Date.now();
    return {
      id: sessionId,
      success: true,
      data: {
        id: sessionId,
        ...sessionData,
        createdAt: new Date(),
        createdBy: user?.id
      },
      message: 'Attendance session created successfully'
    };
  } catch (err) {
    error(`${serviceName}:createSession:error`, { error: err.message, data: sessionData });
    return {
      success: false,
      error: err.message || 'Failed to create attendance session',
      data: null
    };
  }
};

export const listOpenSessions = async (params = {}) => {
  try {
    info(`${serviceName}:listOpenSessions`, { params });
    
    // Mock implementation
    return {
      success: true,
      data: [],
      total: 0,
      message: 'Open sessions retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:listOpenSessions:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve open sessions',
      data: []
    };
  }
};

export const listenAttendanceSession = (sessionId, callback) => {
  try {
    info(`${serviceName}:listenAttendanceSession`, { sessionId });
    
    // Mock implementation - would normally set up real-time listener
    // For now, return an unsubscribe function
    const unsubscribe = () => {
      info(`${serviceName}:listenAttendanceSession:unsubscribe`, { sessionId });
    };
    
    // Simulate session data
    if (callback) {
      setTimeout(() => {
        callback({
          sessionId,
          status: 'open',
          token: 'mock-token-' + Date.now()
        });
      }, 100);
    }
    
    return unsubscribe;
  } catch (err) {
    error(`${serviceName}:listenAttendanceSession:error`, { error: err.message, sessionId });
    return () => {}; // Return empty unsubscribe function on error
  }
};

export const closeAttendanceSession = async (sessionId, user = null) => {
  try {
    info(`${serviceName}:closeAttendanceSession`, { sessionId });
    
    // Mock implementation
    return {
      success: true,
      message: 'Attendance session closed successfully'
    };
  } catch (err) {
    error(`${serviceName}:closeAttendanceSession:error`, { error: err.message, sessionId });
    return {
      success: false,
      error: err.message || 'Failed to close attendance session'
    };
  }
};

// Add aliases for commonly expected function names
export const getAttendanceRecords = getAllAttendance;
export const getAttendanceRecord = getAttendanceById;
export const addAttendance = createAttendance;
export const updateAttendanceData = updateAttendance;
export const removeAttendance = deleteAttendance;
export { deleteAttendance };
export { getAttendanceByStudent };
export { getAttendanceByClass };
export const getStudentAttendance = getAttendanceByStudent;
export const getClassAttendance = getAttendanceByClass;
export const getDateAttendance = getAttendanceByDate;

// Export functions for attendance marks export
export const getAttendanceMarksForExport = async (params = {}) => {
  try {
    info(`${serviceName}:getAttendanceMarksForExport`, { params });
    
    // Mock implementation
    return {
      success: true,
      data: [],
      message: 'Attendance marks for export retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceMarksForExport:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to get attendance marks for export',
      data: []
    };
  }
};

export const getAllAttendanceSessions = async (params = {}) => {
  try {
    info(`${serviceName}:getAllAttendanceSessions`, { params });
    
    // Mock implementation
    return {
      success: true,
      data: [],
      total: 0,
      message: 'All attendance sessions retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getAllAttendanceSessions:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to get all attendance sessions',
      data: []
    };
  }
};

export const updateAttendanceMark = async (id, updateData, user = null) => {
  return await updateAttendance(id, updateData, user);
};

export const getAttendanceMarksCount = async (params = {}) => {
  try {
    info(`${serviceName}:getAttendanceMarksCount`, { params });
    
    // Mock implementation
    return {
      success: true,
      data: 0,
      message: 'Attendance marks count retrieved successfully'
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceMarksCount:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to get attendance marks count',
      data: 0
    };
  }
};

// Realtime service functions needed by AttendancePage
export const getAttendanceConfigDoc = async () => {
  try {
    info(`${serviceName}:getAttendanceConfigDoc`);
    
    // Mock implementation - would normally fetch from Firestore/config database
    return {
      rotationSeconds: 30,
      sessionMinutes: 15,
      strictDeviceBinding: true,
      lateMode: false
    };
  } catch (err) {
    error(`${serviceName}:getAttendanceConfigDoc:error`, { error: err.message });
    throw err;
  }
};

export const saveAttendanceConfigDoc = async (config) => {
  try {
    info(`${serviceName}:saveAttendanceConfigDoc`, { config });
    
    // Mock implementation - would normally save to Firestore/config database
    return {
      success: true,
      message: 'Attendance configuration saved successfully'
    };
  } catch (err) {
    error(`${serviceName}:saveAttendanceConfigDoc:error`, { error: err.message });
    throw err;
  }
};

export const closeAttendanceSessionLocal = async (sessionId) => {
  try {
    info(`${serviceName}:closeAttendanceSessionLocal`, { sessionId });
    
    // Mock implementation - would normally update local state
    return {
      success: true,
      message: 'Attendance session closed locally'
    };
  } catch (err) {
    error(`${serviceName}:closeAttendanceSessionLocal:error`, { error: err.message, sessionId });
    throw err;
  }
};

export const updateAttendanceSessionLateMode = async (sessionId, lateMode) => {
  try {
    info(`${serviceName}:updateAttendanceSessionLateMode`, { sessionId, lateMode });
    
    // Mock implementation - would normally update session in database
    return {
      success: true,
      message: 'Late mode updated successfully'
    };
  } catch (err) {
    error(`${serviceName}:updateAttendanceSessionLateMode:error`, { error: err.message, sessionId, lateMode });
    throw err;
  }
};

export const listenAttendanceMarksCount = (sessionId, callback) => {
  try {
    info(`${serviceName}:listenAttendanceMarksCount`, { sessionId });
    
    // Mock implementation - would normally set up real-time listener
    // For now, return an unsubscribe function
    const unsubscribe = () => {
      info(`${serviceName}:listenAttendanceMarksCount:unsubscribe`, { sessionId });
    };
    
    // Simulate initial count
    if (callback) callback(0);
    
    return unsubscribe;
  } catch (err) {
    error(`${serviceName}:listenAttendanceMarksCount:error`, { error: err.message, sessionId });
    return () => {}; // Return empty unsubscribe function on error
  }
};

// Default export
const attendanceService = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceByDate,
  getAttendanceStats,
  markAttendance,
  bulkMarkAttendance,
  getTodayAttendanceStatus,
  isStudentMarkedToday,
  rosterQuickAction,
  createSession,
  listOpenSessions,
  listenAttendanceSession,
  closeAttendanceSession,
  getAttendanceRecords,
  getAttendanceRecord,
  addAttendance,
  updateAttendanceData,
  removeAttendance,
  getStudentAttendance,
  getClassAttendance,
  getDateAttendance,
  getAttendanceMarksForExport,
  getAllAttendanceSessions,
  updateAttendanceMark,
  getAttendanceMarksCount,
  getAttendanceConfigDoc,
  saveAttendanceConfigDoc,
  closeAttendanceSessionLocal,
  updateAttendanceSessionLateMode,
  listenAttendanceMarksCount
};

export default attendanceService;
