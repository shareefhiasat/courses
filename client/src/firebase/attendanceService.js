import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Centralized Attendance Service - DRY Firebase attendance operations
 */

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

// Mark attendance (centralized)
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

// Get attendance statistics for a class
export const getClassAttendanceStats = async (classId, startDate, endDate) => {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('classId', '==', classId)
    );
    
    const querySnapshot = await getDocs(q);
    const attendanceRecords = [];
    querySnapshot.forEach((doc) => {
      attendanceRecords.push({ id: doc.id, ...doc.data() });
    });
    
    // Filter by date range if provided
    const filteredRecords = attendanceRecords.filter(record => {
      if (!startDate && !endDate) return true;
      const recordDate = record.date;
      if (startDate && recordDate < startDate) return false;
      if (endDate && recordDate > endDate) return false;
      return true;
    });
    
    // Calculate statistics
    const stats = {
      total: filteredRecords.length,
      present: filteredRecords.filter(r => r.status === 'present').length,
      late: filteredRecords.filter(r => r.status === 'late').length,
      absent: filteredRecords.filter(r => r.status === 'absent').length,
      excused: filteredRecords.filter(r => r.status === 'excused').length,
      human_case: filteredRecords.filter(r => r.status === 'human_case').length
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error calculating attendance stats:', error);
    return { success: false, error: error.message };
  }
};
