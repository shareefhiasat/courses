import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, setDoc, serverTimestamp, deleteDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../other/config';
import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { getUserById } from './userService';
import { RECORD_TYPES } from '@utils/sharedTypes';

/**
 * Centralized Attendance Service - DRY Firebase attendance operations
 * This CONSOLIDATES functions from both attendance.js and attendanceService.js
 */

// ===== BASIC ATTENDANCE OPERATIONS (from attendanceService.js) =====

// Check today's attendance status for a student
export const getTodayAttendanceStatus = async (classId, studentId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocId = `${classId}_${studentId}_${today}`;
    const existingDoc = await getDoc(doc(db, 'attendance', attendanceDocId));
    
    if (existingDoc.exists()) {
      return { success: true, data: { id: existingDoc.id, ...existingDoc.data() } };
    }
    return { success: false, data: null };
  } catch (error) {
    console.error('Error checking today\'s attendance:', error);
    return { success: false, error: error.message };
  }
};

// Check if student already marked today (by any status)
export const isStudentMarkedToday = async (classId, studentIdentifier) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocId = `${classId}_${studentIdentifier}_${today}`;
    const existingDoc = await getDoc(doc(db, 'attendance', attendanceDocId));
    
    return existingDoc.exists();
  } catch (error) {
    console.error('Error checking if student marked today:', error);
    return false;
  }
};

// Mark attendance (centralized - CONSOLIDATED from both files)
export const markAttendance = async (attendanceData) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendanceDocId = `${attendanceData.classId}_${attendanceData.studentNumber}_${today}`;
    
    const docRef = doc(db, 'attendance', attendanceDocId);
    const existingDoc = await getDoc(docRef);
    
    if (existingDoc.exists()) {
      // Update existing attendance
      await updateDoc(docRef, {
        ...attendanceData,
        updatedAt: serverTimestamp()
      });
      
      // Notify via gateway on update if not present
      if (attendanceData.status !== 'present') {
        try {
          const { data: student } = await getUserById(attendanceData.studentId);
          if (student) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED, {
              userId: attendanceData.studentId,
              role: 'student',
              classId: attendanceData.classId,
              title: 'Attendance Updated',
              message: `Your attendance status has been updated to: ${attendanceData.status}`,
              type: RECORD_TYPES.ATTENDANCE,
              email: student.email,
              templateId: 'attendanceNotification',
              variables: {
                studentName: student.displayName || student.name || 'Student',
                status: attendanceData.status,
                date: today
              }
            });
          }
        } catch (e) { console.warn('Notify failed', e); }
      }

      return { success: true, id: attendanceDocId, action: 'updated' };
    } else {
      // Create new attendance record
      const newDocRef = await addDoc(collection(db, 'attendance'), {
        ...attendanceData,
        date: today,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Notify via gateway on new record if absent/late
      if (attendanceData.status !== 'present') {
        try {
          const { data: student } = await getUserById(attendanceData.studentId);
          if (student) {
            await notificationGateway.send(attendanceData.status === 'absent' ? NOTIFICATION_TRIGGERS.ATTENDANCE_ABSENT : NOTIFICATION_TRIGGERS.ATTENDANCE_RECORDED, {
              userId: attendanceData.studentId,
              role: 'student',
              classId: attendanceData.classId,
              title: attendanceData.status === 'absent' ? 'Absence Recorded' : 'Attendance Recorded',
              message: `You were marked ${attendanceData.status} for today's class.`,
              type: RECORD_TYPES.ATTENDANCE,
              email: student.email,
              templateId: 'attendanceNotification',
              variables: {
                studentName: student.displayName || student.name || 'Student',
                status: attendanceData.status,
                date: today
              }
            });
          }
        } catch (e) { console.warn('Notify failed', e); }
      }

      return { success: true, id: newDocRef.id, action: 'created' };
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    return { success: false, error: error.message };
  }
};

// ===== ADVANCED ATTENDANCE OPERATIONS (from attendance.js) =====

/**
 * Get attendance records for a specific class and date
 */
export const getAttendanceByClass = async (classId, date) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('classId', '==', classId),
      where('date', '==', date)
    );
    
    const querySnapshot = await getDocs(q);
    const attendanceRecords = [];
    querySnapshot.forEach((doc) => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: attendanceRecords };
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance records for a specific student
 */
export const getAttendanceByStudent = async (studentId, startDate = null, endDate = null) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    let q = query(attendanceRef, where('studentId', '==', studentId));
    
    if (startDate || endDate) {
      // Add date range filters if provided
      const constraints = [];
      if (startDate) constraints.push(where('date', '>=', startDate));
      if (endDate) constraints.push(where('date', '<=', endDate));
      q = query(attendanceRef, where('studentId', '==', studentId), ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    const attendanceRecords = [];
    querySnapshot.forEach((doc) => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: attendanceRecords };
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance statistics for a class
 * Returns detailed breakdown by all status types for HR analytics
 */
export const getAttendanceStats = async (classId, startDate = null, endDate = null) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    let q = query(attendanceRef, where('classId', '==', classId));
    
    if (startDate || endDate) {
      const constraints = [];
      if (startDate) constraints.push(where('date', '>=', startDate));
      if (endDate) constraints.push(where('date', '<=', endDate));
      q = query(attendanceRef, where('classId', '==', classId), ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    const attendanceRecords = [];
    querySnapshot.forEach((doc) => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });
    
    // Calculate statistics
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.status === 'present').length,
      late: attendanceRecords.filter(r => r.status === 'late').length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      excused: attendanceRecords.filter(r => r.status === 'excused').length,
      absent_no_excuse: attendanceRecords.filter(r => r.status === 'absent_no_excuse').length,
      absent_with_excuse: attendanceRecords.filter(r => r.status === 'absent_with_excuse').length,
      excused_leave: attendanceRecords.filter(r => r.status === 'excused_leave').length,
      human_case: attendanceRecords.filter(r => r.status === 'human_case').length
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Quick mark attendance (simplified version)
 */
export const quickMarkAttendance = async ({
  studentId,
  classId,
  status,
  note = '',
  user = null
}) => {
  try {
    const attendanceData = {
      classId,
      studentId,
      studentNumber: studentId,
      status,
      note,
      markedBy: user?.uid || 'system',
      markedByName: user?.displayName || 'System',
      timestamp: new Date().toISOString()
    };
    
    return await markAttendance(attendanceData);
  } catch (error) {
    console.error('Error quick marking attendance:', error);
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
    
    const docRef = doc(db, 'attendance', attendanceId);
    await deleteDoc(docRef);
    
    return { success: true, message: 'Attendance record deleted successfully' };
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return { success: false, error: error.message };
  }
};

// ===== QUICK ACTION METHODS =====

// Get attendance history for a student in a class
export const getStudentAttendanceHistory = async (classId, studentId, limit = 30) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('classId', '==', classId),
      where('studentId', '==', studentId),
      where('studentNumber', '==', studentId)
    );
    
    const querySnapshot = await getDocs(q);
    const attendanceRecords = [];
    querySnapshot.forEach((doc) => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date descending and limit
    attendanceRecords.sort((a, b) => {
      const dateA = a.date?.seconds || a.date;
      const dateB = b.date?.seconds || b.date;
      return dateB - dateA;
    });
    
    return { success: true, data: attendanceRecords.slice(0, limit) };
  } catch (error) {
    console.error('Error fetching attendance history:', error);
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
 * @returns {Promise<Object>} Result of the operation
 */
export const rosterQuickAction = async (studentId, classId, status, user, notes = '') => {
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

    const today = new Date().toISOString().split('T')[0];

    // Create complete attendance record (same structure as manual scan)
    const attendanceData = {
      studentId,
      studentNumber: studentId, // Add studentNumber for consistency
      classId,
      status,
      date: today,                    // ✅ Add missing date field
      method: 'roster_quick_action',
      notes: notes || `Quick ${status}`,
      markedBy: user?.uid || null,
      markedByName: user?.displayName || user?.email || 'Unknown',
      markedByEmail: user?.email || null,
      createdAt: serverTimestamp(),   // ✅ Add missing timestamps
      updatedAt: serverTimestamp()
    };

    // Use addDoc like manual scan for consistency
    const newDocRef = await addDoc(collection(db, 'attendance'), attendanceData);

    return { success: true, data: { id: newDocRef.id, ...attendanceData } };
  } catch (error) {
    console.error('Error in roster quick action:', error);
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
    let q;
    const conditions = [];

    if (studentId) {
      conditions.push(where("studentId", "==", studentId));
    }
    if (subjectId) {
      conditions.push(where("subjectId", "==", subjectId));
    }
    if (semester) {
      conditions.push(where("semester", "==", semester));
    }

    // Filter for absence statuses
    conditions.push(where("status", "in", ['absent_no_excuse', 'absent_with_excuse', 'excused_leave']));

    if (conditions.length > 0) {
      q = query(
        collection(db, "attendance"),
        ...conditions,
        orderBy("date", "desc")
      );
    } else {
      q = query(collection(db, "attendance"), orderBy("date", "desc"));
    }

    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
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
    console.log('[Attendance/api] calling attendanceCreateSession', { classId, subjectId });
    
    const { data } = await fn({ classId, subjectId, scheduledAt, createdBy });
    return { success: true, data: { id: data?.sessionId, token: data?.token, rotationSeconds: data?.rotationSeconds, endAt: data?.endAt } };
  } catch (error) {
    console.error('Error creating session:', error);
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
    const col = collection(db, 'classes', classId, 'sessions');
    const q = query(col, where('status', '==', 'open'));
    const snap = await getDocs(q);
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    console.error('Error listing open sessions:', error);
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
    const ref = doc(db, 'attendanceSessions', sessionId);
    return onSnapshot(ref, (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null));
  } catch (error) {
    console.error('Error listening to session:', error);
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
    console.log('[Attendance/api] calling attendanceCloseSession', { sid: sessionId });
    
    const res = await fn({ sid: sessionId });
    return { success: true, data: res?.data };
  } catch (error) {
    console.error('Error closing session:', error);
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
    console.log('[Attendance/api] calling attendanceScan', payload);
    
    const { data } = await fn(payload);
    if (!data?.success) {
      throw new Error(data?.error || 'Scan failed');
    }
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error scanning attendance:', error);
    return { success: false, error: error.message };
  }
}

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
    console.error('Error generating device hash:', error);
    return 'unknown';
  }
}
