import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { getUserById } from './userService';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { ATTENDANCE_METHODS } from '@constants/attendanceMethods';
import logger from '@utils/logger';
import { formatQatarDateOnly, formatQatarTimeOnly, getQatarNow, getQatarTimestampString } from '@utils/qatarDate';
import { 
  getAttendanceRecords as getAttendanceRecordsFromDb,
  getAttendanceRecord as getAttendanceRecordFromDb,
  setAttendanceRecord as setAttendanceRecordToDb,
  updateAttendanceRecord as updateAttendanceRecordInDb,
  deleteAttendanceRecord as deleteAttendanceRecordFromDb,
  getAttendanceStats as getAttendanceStatsFromDb
} from '../db/attendanceDbService';
import {
  getOpenAttendanceSessions as getOpenAttendanceSessionsFromDb,
  getAttendanceMarksCount as getAttendanceMarksCountFromDb,
  updateAttendanceMark as updateAttendanceMarkFromDb,
  getAllAttendanceSessions as getAllSessionsFromDb
} from '../db/attendanceSessionsDbService';

/**
 * Centralized Attendance Service - DRY Firebase attendance operations
 * This CONSOLIDATES functions from both attendance.js and attendanceService.js
 */

// ===== ATTENDANCE SESSIONS OPERATIONS =====

// Get attendance marks count for real-time updates
export const listenAttendanceMarksCount = (sessionId, callback) => {
  try {
    // This function uses onSnapshot which is a Firebase-specific real-time listener
    // For now, we'll keep this as is since real-time updates require Firebase directly
    // In a future refactor, we could move this to a separate real-time service layer
    const { onSnapshot, collection } = require('firebase/firestore');
    const { db } = require('../other/config');
    
    const unsubscribe = onSnapshot(
      collection(db, 'attendanceSessions', sessionId, 'marks'),
      (snapshot) => {
        callback(snapshot.size);
      },
      (error) => {
        logger.error('Error listening to attendance marks:', error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    logger.error('Error setting up attendance marks listener:', error);
    return () => {};
  }
};

// Get attendance marks for export
export const getAttendanceMarksForExport = async (sessionId) => {
  try {
    const { getAttendanceMarksForExport: getMarksForExportFromDb } = await import('../db/attendanceSessionsDbService');
    const result = await getMarksForExportFromDb(sessionId);
    return result;
  } catch (error) {
    logger.error('Error getting attendance marks for export:', error);
    return { success: false, error: error.message };
  }
};

// ===== BASIC ATTENDANCE OPERATIONS (from attendanceService.js) =====

// Check today's attendance status for a student
export const getTodayAttendanceStatus = async (classId, studentIdentifier) => {
  try {
    const today = formatQatarDateOnly(getQatarNow());
    // Try to get student number if studentId was passed
    let studentNumber = studentIdentifier;
    
    // If studentIdentifier looks like a Firebase UID (long string), we need to find the studentNumber
    if (studentIdentifier.length > 20) {
      // This is likely a studentId, fetch the user to get studentNumber
      try {
        const userResponse = await getUserById(studentIdentifier);
        if (userResponse.success && userResponse.data?.studentNumber) {
          studentNumber = userResponse.data.studentNumber;
        } else {
          logger.warn('Could not find studentNumber for studentId:', studentIdentifier);
          return { success: false, data: null };
        }
      } catch (error) {
        logger.error('Error fetching user for studentNumber:', error);
        return { success: false, data: null };
      }
    }
    
    const attendanceDocId = `${classId}_${studentNumber}_${today}`;
    const existingRecord = await getAttendanceRecordFromDb(attendanceDocId);
    
    if (existingRecord.success && existingRecord.data) {
      return existingRecord;
    }
    return { success: false, data: null };
  } catch (error) {
    logger.error('Error checking today\'s attendance:', error);
    return { success: false, error: error.message };
  }
};

// Check if student already marked today (by any status)
export const isStudentMarkedToday = async (classId, studentIdentifier) => {
  try {
    const today = formatQatarDateOnly(getQatarNow());
    const attendanceDocId = `${classId}_${studentIdentifier}_${today}`;
    const existingRecord = await getAttendanceRecordFromDb(attendanceDocId);
    
    return existingRecord.success && existingRecord.data;
  } catch (error) {
    logger.error('Error checking if student marked today:', error);
    return false;
  }
};

// Mark attendance (centralized - CONSOLIDATED from both files)
export const markAttendance = async (attendanceData) => {
  try {
    logger.info('[AttendanceService] markAttendance called with:', {
      attendanceData,
      hasTime: !!attendanceData.time,
      hasDate: !!attendanceData.date,
      studentId: attendanceData.studentId,
      status: attendanceData.status
    });

    // Validate required fields and provide defaults
    const validatedData = {
      ...attendanceData,
      markedBy: attendanceData.markedBy || 'unknown',
      performedBy: attendanceData.performedBy || 'unknown',
      performedByName: attendanceData.performedByName || 'Unknown User',
      performedByEmail: attendanceData.performedByEmail || 'unknown@example.com',
      // Add time field if not present - use simple 24-hour Qatar time format
      time: attendanceData.time || (() => {
        const qatarTime = getQatarNow();
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(qatarTime.getHours())}:${pad(qatarTime.getMinutes())}:${pad(qatarTime.getSeconds())}`;
      })() // Get current Qatar time in HH:MM:SS 24-hour format
    };

    // Use the date passed from caller, or default to today's Qatar date
    const date = validatedData.date || formatQatarDateOnly(getQatarNow());
    const today = date; // Use the passed date for consistency
    const attendanceDocId = `${validatedData.classId}_${validatedData.studentId}_${today}`;

    logger.info('[AttendanceService] Validated attendance data:', {
      attendanceDocId,
      studentId: validatedData.studentId,
      status: validatedData.status,
      date: validatedData.date,
      time: validatedData.time,
      method: validatedData.method
    });
    
    // Ensure we have programId and subjectId from class data
    // These should be passed from the calling code, but we validate here
    const { programId = null, subjectId = null } = validatedData;
    
    // Check if record exists using DB service
    const existingRecord = await getAttendanceRecordFromDb(attendanceDocId);
    
    if (existingRecord.success && existingRecord.data) {
      // Update existing attendance using DB service
      const updateResult = await updateAttendanceRecordInDb(attendanceDocId, {
        ...validatedData,
        programId,
        subjectId,
        date: date, // Use the passed date (ISO format)
        time: validatedData.time, // Ensure time is included
        updatedAt: getQatarTimestampString()
      });
      
      if (!updateResult.success) {
        return updateResult;
      }
      
      // Notify via gateway on update if not present
      if (validatedData.status !== 'present') {
        try {
          const { data: student } = await getUserById(validatedData.studentId);
          if (student) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED, {
              userId: validatedData.studentId,
              role: 'student',
              classId: validatedData.classId,
              title: 'Attendance Updated',
              message: `Your attendance status has been updated to: ${validatedData.status}`,
              type: RECORD_TYPES.ATTENDANCE,
              email: student.email,
              templateId: 'attendanceNotification',
              variables: {
                studentName: student.displayName || student.name || 'Student',
                status: validatedData.status,
                date: today
              }
            });
          }
        } catch (e) { logger.warn('Notify failed', e); }
      }

      return { success: true, id: attendanceDocId, action: 'updated' };
    } else {
      // Create new attendance record using DB service
      const createResult = await setAttendanceRecordToDb(attendanceDocId, {
        ...validatedData,
        programId,
        subjectId,
        date: date, // Use the passed date (ISO format)
        time: validatedData.time, // Ensure time is included
        createdAt: getQatarTimestampString(),
        updatedAt: getQatarTimestampString()
      });
      
      if (!createResult.success) {
        return createResult;
      }

      // Notify via gateway on new record if absent/late
      if (validatedData.status !== 'present') {
        try {
          const { data: student } = await getUserById(validatedData.studentId);
          if (student) {
            await notificationGateway.send(validatedData.status === 'absent' ? NOTIFICATION_TRIGGERS.ATTENDANCE_ABSENT : NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED, {
              userId: validatedData.studentId,
              role: 'student',
              classId: validatedData.classId,
              title: validatedData.status === 'absent' ? 'Absence Recorded' : 'Attendance Recorded',
              message: `You were marked ${validatedData.status} for today's class.`,
              type: RECORD_TYPES.ATTENDANCE,
              email: student.email,
              templateId: 'attendanceNotification',
              variables: {
                studentName: student.displayName || student.name || 'Student',
                status: validatedData.status,
                date: today
              }
            });
          }
        } catch (e) { logger.warn('Notify failed', e); }
      }

      return { success: true, id: attendanceDocId, action: 'created' };
    }
  } catch (error) {
    logger.error('Error marking attendance:', error);
    return { success: false, error: error.message };
  }
};

// ===== ADVANCED ATTENDANCE OPERATIONS (from attendance.js) =====

/**
 * Get attendance records for a specific class and date - with performance monitoring
 */
export const getAttendanceByClass = async (classId, date) => {
  try {
    return await getAttendanceRecordsFromDb({ classId, date });
  } catch (error) {
    logger.error('Error fetching class attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance records for a specific student - with performance monitoring
 */
export const getAttendanceByStudent = async (studentId, startDate = null, endDate = null) => {
  try {
    return await getAttendanceRecordsFromDb({ studentId, startDate, endDate });
  } catch (error) {
    logger.error('Error fetching student attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance statistics for a class - with performance monitoring
 * Returns detailed breakdown by all status types for HR analytics
 */
export const getAttendanceStats = async (classId, startDate = null, endDate = null) => {
  try {
    return await getAttendanceStatsFromDb(classId, startDate, endDate);
  } catch (error) {
    logger.error('Error calculating attendance stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Quick mark attendance (simplified version)
 */
export const quickMarkAttendance = async ({
  studentId,
  classId,
  programId = null,
  subjectId = null,
  status,
  note = '',
  user = null
}) => {
  try {
    const attendanceData = {
      classId,
      studentId,
      studentNumber: studentId,
      programId,
      subjectId,
      status,
      note,
      markedBy: user?.uid || 'system',
      markedByName: user?.displayName || 'System',
      createdBy: user?.uid || 'system',
      performedBy: user?.uid || 'system',
      performedByName: user?.displayName || user?.email || 'System',
      performedByEmail: user?.email || null,
      timestamp: getQatarTimestampString()
    };
    
    return await markAttendance(attendanceData);
  } catch (error) {
    logger.error('Error quick marking attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete an attendance record
 */
export const deleteAttendance = async (attendanceId) => {
  try {
    if (!attendanceId) {
      return { success: false, error: 'Attendance ID is required' };
    }
    
    return await deleteAttendanceRecordFromDb(attendanceId);
  } catch (error) {
    logger.error('Error deleting attendance:', error);
    return { success: false, error: error.message };
  }
};

// ===== QUICK ACTION METHODS =====

// Get attendance history for a student in a class
export const getStudentAttendanceHistory = async (classId, studentId, limit = 30) => {
  try {
    // Use the DB service to get attendance records
    const result = await getAttendanceRecordsFromDb({ 
      classId, 
      studentId, 
      limit 
    });
    
    if (result.success) {
      // Sort by date descending (the DB service should handle this, but ensure consistency)
      const sortedData = result.data.sort((a, b) => {
        const dateA = a.date?.seconds || a.date;
        const dateB = b.date?.seconds || b.date;
        return dateB - dateA;
      });
      
      return { success: true, data: sortedData.slice(0, limit) };
    }
    return result;
  } catch (error) {
    logger.error('Error fetching attendance history:', error);
    return { success: false, error: error.message };
  }
};

// Get all attendance for a class on a specific date
export const getClassAttendanceByDate = async (classId, date) => {
  return await getAttendanceByClass(classId, date);
};

// ===== QUICK ACTION METHODS =====

/**
 * Quick attendance action for roster (used in StudentRoster.jsx)
 * @param {string} studentId - Student ID
 * @param {string} classId - Class ID
 * @param {string} status - Attendance status
 * @param {Object} user - User performing the action
 * @param {string} notes - Optional notes
 * @param {string} programId - Program ID (optional)
 * @param {string} subjectId - Subject ID (optional)
 * @returns {Promise<Object>} Result of the operation
 */
export const rosterQuickAction = async (studentId, classId, status, user, notes = '', programId = null, subjectId = null, date = null) => {
  try {
    // Import attendance types for validation
    const { ATTENDANCE_STATUS } = await import('@constants/attendanceTypes');
    
    // Validate status
    if (!Object.values(ATTENDANCE_STATUS).includes(status)) {
      return { 
        success: false, 
        error: `Invalid attendance status: ${status}. Valid statuses: ${Object.values(ATTENDANCE_STATUS).join(', ')}` 
      };
    }

    // Use the date passed from caller, or default to today's Qatar date in ISO format
    const today = date || getQatarNow().toISOString().split('T')[0]; // ISO format
    const attendanceDocId = `${classId}_${studentId}_${today}`;

    // Check if attendance record already exists using DB service
    const existingRecord = await getAttendanceRecordFromDb(attendanceDocId);

    // Create complete attendance record
    const attendanceData = {
      studentId,
      studentNumber: studentId, // Add studentNumber for consistency
      classId,
      programId,
      subjectId,
      status,
      date: today,                    // ✅ Add missing date field
      method: ATTENDANCE_METHODS.ROSTER_QUICK_ACTION,
      notes: notes || `Quick ${status}`,
      markedBy: user?.uid || null,
      markedByName: user?.displayName || user?.email || 'Unknown',
      markedByEmail: user?.email || null,
      createdBy: user?.uid || null,
      performedBy: user?.uid || null,
      performedByName: user?.displayName || user?.email || 'Unknown',
      performedByEmail: user?.email || null,
      updatedAt: getQatarTimestampString()
    };

    let result;
    if (existingRecord.success && existingRecord.data) {
      // Update existing attendance record using DB service
      const updateResult = await updateAttendanceRecordInDb(attendanceDocId, attendanceData);
      if (updateResult.success) {
        result = { success: true, data: { id: attendanceDocId, ...attendanceData, action: 'updated' } };
        logger.log('Updated existing attendance record:', attendanceDocId);
      } else {
        result = updateResult;
      }
    } else {
      // Create new attendance record using DB service
      const createResult = await setAttendanceRecordToDb(attendanceDocId, {
        ...attendanceData,
        createdAt: getQatarTimestampString(),   // ✅ Add createdAt only for new records
      });
      if (createResult.success) {
        result = { success: true, data: { id: attendanceDocId, ...attendanceData, action: 'created' } };
        logger.log('Created new attendance record:', attendanceDocId);
      } else {
        result = createResult;
      }
    }

    return result;
  } catch (error) {
    logger.error('Error in roster quick action:', error);
    return { success: false, error: error.message };
  }
};

// ===== ABSENCE TRACKING =====

/**
 * Get student absences
 * @param {string} studentId - Optional student ID filter
 * @param {string} subjectId - Optional subject ID filter  
 * @param {string} semester - Optional semester filter
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAbsences = async (
  studentId = null,
  subjectId = null,
  semester = null
) => {
  try {
    // Use the DB service to get attendance records with absence statuses
    const result = await getAttendanceRecordsFromDb({
      studentId,
      subjectId,
      semester,
      status: ['absent_no_excuse', 'absent_with_excuse', 'excused_leave']
    });
    
    if (result.success) {
      // Sort by date descending
      const sortedData = result.data.sort((a, b) => {
        const dateA = a.date?.seconds || a.date;
        const dateB = b.date?.seconds || b.date;
        return dateB - dateA;
      });
      
      return { success: true, data: sortedData };
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== ATTENDANCE SESSIONS =====

/**
 * Create attendance session
 * @param {Object} params - Session parameters
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export async function createSession({ classId, subjectId, scheduledAt, createdBy }) {
  try {
    // Import functions dynamically to avoid circular dependencies
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    const fn = httpsCallable(functions, 'attendanceCreateSession');
    logger.log('[Attendance/api] calling attendanceCreateSession', { classId, subjectId });
    
    const { data } = await fn({ classId, subjectId, scheduledAt, createdBy });
    return { success: true, data: { id: data?.sessionId, token: data?.token, rotationSeconds: data?.rotationSeconds, endAt: data?.endAt } };
  } catch (error) {
    logger.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List open attendance sessions
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export async function listOpenSessions({ classId }) {
  try {
    // Use the DB service to get open attendance sessions
    const result = await getOpenAttendanceSessionsFromDb(classId);
    return result;
  } catch (error) {
    logger.error('Error listing open sessions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Listen to attendance session changes
 * @param {string} sessionId - Session ID
 * @param {Function} cb - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenAttendanceSession(sessionId, cb) {
  try {
    // This function uses onSnapshot which is a Firebase-specific real-time listener
    // For now, we'll keep this as is since real-time updates require Firebase directly
    const { onSnapshot, doc } = require('firebase/firestore');
    const { db } = require('../other/config');
    
    const ref = doc(db, 'attendanceSessions', sessionId);
    return onSnapshot(ref, (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null));
  } catch (error) {
    logger.error('Error listening to session:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

/**
 * Close attendance session
 * @param {string} sessionId - Session ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function closeAttendanceSession(sessionId) {
  try {
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    const fn = httpsCallable(functions, 'attendanceCloseSession');
    logger.log('[Attendance/api] calling attendanceCloseSession', { sid: sessionId });
    
    const res = await fn({ sid: sessionId });
    return { success: true, data: res?.data };
  } catch (error) {
    logger.error('Error closing session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Scan attendance (QR code scanning)
 * @param {Object} payload - Scan payload
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function scanAttendance(payload) {
  try {
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    const fn = httpsCallable(functions, 'attendanceScan');
    logger.log('[Attendance/api] calling attendanceScan', payload);
    
    const { data } = await fn(payload);
    if (!data?.success) {
      throw new Error(data?.error || 'Scan failed');
    }
    return { success: true, data: data.data };
  } catch (error) {
    logger.error('Error scanning attendance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all attendance sessions for HR dashboard
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAllAttendanceSessions = async () => {
  try {
    const result = await getAllSessionsFromDb();
    
    if (result.success) {
      return { success: true, data: { sessions: result.data } };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('Error getting all attendance sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update attendance mark status
 * @param {string} sessionId - Session ID
 * @param {string} uid - User ID
 * @param {string} status - New status
 * @param {string} reason - Reason for status change
 * @param {string} feedback - Feedback
 * @param {string} updatedBy - User who made the update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAttendanceMark = async (sessionId, uid, status, reason = null, feedback = null, updatedBy = null) => {
  try {
    const updateData = {
      status,
      reason: reason || null,
      feedback: feedback || null,
      updatedBy
    };
    
    const result = await updateAttendanceMarkFromDb(sessionId, uid, updateData);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('Error updating attendance mark:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance marks count for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getAttendanceMarksCount = async (sessionId) => {
  try {
    const result = await getAttendanceMarksCountFromDb(sessionId);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('Error getting attendance marks count:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate simple device hash for attendance tracking
 * @returns {string} Device hash
 */
export function simpleDeviceHash() {
  try {
    const s = [navigator.userAgent, navigator.platform, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');
    let h = 0; 
    for (let i = 0; i < s.length; i++) { 
      h = (h << 5) - h + s.charCodeAt(i); 
      h |= 0; 
    }
    return h.toString(36);
  } catch (error) {
    logger.error('Error generating device hash:', error);
    return 'unknown';
  }
}

