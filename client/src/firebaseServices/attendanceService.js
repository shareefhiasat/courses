import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

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
      return { success: true, id: attendanceDocId, action: 'updated' };
    } else {
      // Create new attendance record
      const newDocRef = await addDoc(collection(db, 'attendance'), {
        ...attendanceData,
        date: today,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
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

    // Create attendance record
    const attendanceData = {
      studentId,
      classId,
      status,
      method: 'roster_quick_action',
      notes: notes || `Quick ${status}`,
      timestamp: serverTimestamp(),
      performedBy: user?.uid || null,
      performedByName: user?.displayName || user?.email || 'Unknown',
      performedByEmail: user?.email || null
    };

    const docRef = doc(db, 'attendance', `${classId}_${studentId}_${new Date().toISOString().split('T')[0]}`);
    await setDoc(docRef, attendanceData);

    return { success: true, data: attendanceData };
  } catch (error) {
    console.error('Error in roster quick action:', error);
    return { success: false, error: error.message };
  }
};
