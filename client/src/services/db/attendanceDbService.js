/**
 * Attendance Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for attendance records. This is the database layer
 * and should NOT contain business logic. All business logic should be in the
 * corresponding business service layer.
 * 
 * USAGE:
 * Import these functions in business services or other db-services only.
 * Do NOT import directly in UI components - use business services instead.
 * 
 * ARCHITECTURE:
 * - CRUD operations for attendance records
 * - Query operations for reporting and analytics
 * - Real-time listeners for live updates
 * - No business logic or validation (handled by business layer)
 * 
 * COLLECTION: 'attendance'
 * 
 * EXAMPLES:
 * ```javascript
 * // In business service:
 * import { createAttendance, getAttendanceByStudent } from '@services/db/attendanceDbService';
 * 
 * const result = await createAttendance(attendanceData);
 * if (result.success) {
 *   // Handle success, send notifications, etc.
 * }
 * ```
 * 
 * @typedef {import('@types/index').AttendanceRecord} AttendanceRecord
 * @typedef {import('@types/index').AttendanceStatus} AttendanceStatus
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 * 
 * @author Service Layer Architecture
 * @since v2.0.0
 */

import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  getDoc, 
  onSnapshot, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../other/config.js';
import logger from '@utils/logger';

/**
 * Get attendance records with filters - with performance monitoring
 * @param {Object} filters - Query filters
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAttendanceRecords = async (filters = {}) => {
  try {
    const { studentId, classId, subjectId, semester, status, date, limit } = filters;
    
    let q;
    const conditions = [];
    const attendanceRef = collection(db, 'attendance');

    // Apply filters
    if (studentId) {
      conditions.push(where('studentId', '==', studentId));
    }
    if (classId) {
      conditions.push(where('classId', '==', classId));
    }
    if (subjectId) {
      conditions.push(where('subjectId', '==', subjectId));
    }
    if (semester) {
      conditions.push(where('semester', '==', semester));
    }
    if (status) {
      if (Array.isArray(status)) {
        conditions.push(where('status', 'in', status));
      } else {
        conditions.push(where('status', '==', status));
      }
    }
    if (date) {
      conditions.push(where('date', '==', date));
    }

    // Build query
    if (conditions.length > 0) {
      q = query(attendanceRef, ...conditions, orderBy('date', 'desc'));
    } else {
      q = query(attendanceRef, orderBy('date', 'desc'));
    }

    // Apply limit if specified
    if (limit) {
      q = query(q, orderBy('date', 'desc'), limit(limit));
    }

    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({ 
      docId: doc.id, 
      id: doc.id, 
      ...doc.data() 
    }));

    return { success: true, data: records };
  } catch (error) {
    logger.error('[AttendanceDbService] Error getting attendance records:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single attendance record by ID
 * @param {string} attendanceId - Attendance record ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getAttendanceRecord = async (attendanceId) => {
  try {
    const docRef = doc(db, 'attendance', attendanceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        success: true, 
        data: { docId: docSnap.id, id: docSnap.id, ...docSnap.data() } 
      };
    } else {
      return { success: false, error: 'Attendance record not found' };
    }
  } catch (error) {
    logger.error('[AttendanceDbService] Error getting attendance record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update attendance record
 * @param {string} attendanceId - Attendance record ID
 * @param {Object} attendanceData - Attendance data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setAttendanceRecord = async (attendanceId, attendanceData) => {
  try {
    const docRef = doc(db, 'attendance', attendanceId);
    const dataWithTimestamp = {
      ...attendanceData,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(docRef, dataWithTimestamp, { merge: true });
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceDbService] Error setting attendance record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update attendance record
 * @param {string} attendanceId - Attendance record ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAttendanceRecord = async (attendanceId, updateData) => {
  try {
    const docRef = doc(db, 'attendance', attendanceId);
    const dataWithTimestamp = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, dataWithTimestamp);
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceDbService] Error updating attendance record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete attendance record
 * @param {string} attendanceId - Attendance record ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAttendanceRecord = async (attendanceId) => {
  try {
    const docRef = doc(db, 'attendance', attendanceId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceDbService] Error deleting attendance record:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance statistics for a class
 * @param {string} classId - Class ID
 * @param {string} dateRange - Date range filter
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getAttendanceStats = async (classId, dateRange = null) => {
  try {
    const conditions = [where('classId', '==', classId)];
    
    if (dateRange) {
      conditions.push(where('date', '>=', dateRange.from));
      conditions.push(where('date', '<=', dateRange.to));
    }

    const q = query(collection(db, 'attendance'), ...conditions, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const records = querySnapshot.docs.map(doc => ({ 
      docId: doc.id, 
      ...doc.data() 
    }));

    // Calculate statistics
    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      late: records.filter(r => r.status === 'late').length,
      absent: records.filter(r => ['absent_no_excuse', 'absent_with_excuse'].includes(r.status)).length,
      excused: records.filter(r => r.status === 'excused_leave').length,
      humanCase: records.filter(r => r.status === 'human_case').length
    };

    return { success: true, data: stats };
  } catch (error) {
    logger.error('[AttendanceDbService] Error getting attendance stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for attendance records
 * @param {Object} filters - Query filters
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onAttendanceRecordsChange = (filters = {}, callback) => {
  try {
    const { studentId, classId, subjectId, status } = filters;
    
    let q;
    const conditions = [];
    const attendanceRef = collection(db, 'attendance');

    // Apply filters
    if (studentId) {
      conditions.push(where('studentId', '==', studentId));
    }
    if (classId) {
      conditions.push(where('classId', '==', classId));
    }
    if (subjectId) {
      conditions.push(where('subjectId', '==', subjectId));
    }
    if (status) {
      if (Array.isArray(status)) {
        conditions.push(where('status', 'in', status));
      } else {
        conditions.push(where('status', '==', status));
      }
    }

    // Build query
    if (conditions.length > 0) {
      q = query(attendanceRef, ...conditions, orderBy('date', 'desc'));
    } else {
      q = query(attendanceRef, orderBy('date', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({ 
        docId: doc.id, 
        id: doc.id, 
        ...doc.data() 
      }));
      callback(records);
    });

    return unsubscribe;
  } catch (error) {
    logger.error('[AttendanceDbService] Error setting up listener:', error);
    return () => {}; // Return empty function as fallback
  }
};

