import { doc, setDoc, updateDoc, serverTimestamp, collection, addDoc, getDocs, query, where, getDoc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config';

// Minimal helper scaffolding for Attendance sessions and marks
// Collections:
// - classes/{classId}/sessions/{sessionId}
// - classes/{classId}/sessions/{sessionId}/marks/{uid}

export async function createSession({ classId, subjectId, scheduledAt, createdBy }) {
  // Use callable backend for QR rotation/session lifecycle
  const fn = httpsCallable(functions, 'attendanceCreateSession');
  console.log('[Attendance/api] calling attendanceCreateSession', { classId, subjectId });
  const res = await fn({ classId, subjectId });
  console.log('[Attendance/api] attendanceCreateSession result', res?.data);
  const { data } = res || {}; 
  return { id: data?.sessionId, token: data?.token, rotationSeconds: data?.rotationSeconds, endAt: data?.endAt };
}

export async function markScan({ classId, sessionId, uid, action, reason }) {
  // action: 'present' | 'participation' | 'penalty'
  const markRef = doc(db, 'classes', classId, 'sessions', sessionId, 'marks', uid);
  const base = {
    updatedAt: serverTimestamp(),
    history: [{ at: serverTimestamp(), action, reason: reason || null }],
  };
  if (action === 'present') base.status = 'present';
  if (action === 'participation') base.delta = (base.delta || 0) + 1;
  if (action === 'penalty') base.delta = (base.delta || 0) - 1;
  await setDoc(markRef, base, { merge: true });
}

export async function finalizeSession({ classId, sessionId, absentUids }) {
  const sessRef = doc(db, 'classes', classId, 'sessions', sessionId);
  await updateDoc(sessRef, { status: 'confirmed', confirmedAt: serverTimestamp() });
  // Optionally set absent marks in batch on client-side UI; here we leave to UI for performance reasons.
}

export async function listOpenSessions({ classId }) {
  const col = collection(db, 'classes', classId, 'sessions');
  const q = query(col, where('status', '==', 'open'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSession({ classId, sessionId }) {
  const ref = doc(db, 'classes', classId, 'sessions', sessionId);
  const s = await getDoc(ref);
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// -----------------------------
// New: QR Attendance callables
// -----------------------------
export function listenAttendanceSession(sessionId, cb) {
  const ref = doc(db, 'attendanceSessions', sessionId);
  return onSnapshot(ref, (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null));
}

export async function closeAttendanceSession(sessionId) {
  const fn = httpsCallable(functions, 'attendanceCloseSession');
  console.log('[Attendance/api] calling attendanceCloseSession', { sid: sessionId });
  const res = await fn({ sid: sessionId });
  console.log('[Attendance/api] attendanceCloseSession result', res?.data);
  return res?.data;
}

export async function scanAttendance({ sid, token, deviceHash, classId }) {
  const fn = httpsCallable(functions, 'attendanceScan');
  const payload = { sid, token, deviceHash };
  if (classId) payload.classId = classId;
  console.log('[Attendance/api] calling attendanceScan', payload);
  const res = await fn(payload);
  console.log('[Attendance/api] attendanceScan result', res?.data);
  return res?.data;
}

export function simpleDeviceHash() {
  try {
    const s = [navigator.userAgent, navigator.platform, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|');
    let h = 0; for (let i=0;i<s.length;i++){ h = (h<<5)-h + s.charCodeAt(i); h|=0; }
    return String(h);
  } catch { return '0'; }
}

// -----------------------------
// Manual Attendance Management
// -----------------------------

/**
 * Mark attendance manually for a student
 */
export async function markAttendance({ classId, studentId, date, status, markedBy, method = 'manual', notes = '' }) {
  try {
    const attendanceRef = collection(db, 'attendance');
    const attendanceId = `${classId}_${studentId}_${date}`;
    const docRef = doc(attendanceRef, attendanceId);
    
    await setDoc(docRef, {
      classId,
      studentId,
      date,
      status, // 'present' | 'absent' | 'late' | 'excused'
      markedBy,
      method, // 'qr' | 'manual'
      notes,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    const code = error?.code || '';
    if (code === 'permission-denied') {
      console.warn('Permission denied marking attendance. Check Firestore rules for attendance collection.');
      return { success: false, error: 'Permission denied. You may not have access to mark attendance.', code: 'permission-denied' };
    }
    console.error('Error marking attendance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get attendance records for a specific class and date
 */
export async function getAttendanceByClass(classId, date) {
  try {
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('classId', '==', classId),
      where('date', '==', date)
    );
    
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: records };
  } catch (error) {
    console.error('Error getting attendance:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get attendance records for a specific student
 */
export async function getAttendanceByStudent(studentId, startDate = null, endDate = null) {
  try {
    const attendanceRef = collection(db, 'attendance');
    let q = query(attendanceRef, where('studentId', '==', studentId));
    
    if (startDate) {
      q = query(q, where('date', '>=', startDate));
    }
    if (endDate) {
      q = query(q, where('date', '<=', endDate));
    }
    
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: records };
  } catch (error) {
    console.error('Error getting student attendance:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get attendance statistics for a class
 */
export async function getAttendanceStats(classId, startDate = null, endDate = null) {
  try {
    const attendanceRef = collection(db, 'attendance');
    let q = query(attendanceRef, where('classId', '==', classId));
    
    if (startDate) {
      q = query(q, where('date', '>=', startDate));
    }
    if (endDate) {
      q = query(q, where('date', '<=', endDate));
    }
    
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => doc.data());

    const stats = {
      totalRecords: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
      attendanceRate: 0
    };

    if (stats.totalRecords > 0) {
      stats.attendanceRate = ((stats.present / stats.totalRecords) * 100).toFixed(2);
    }

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    return { success: false, error: error.message, data: null };
  }
}

/**
 * Get attendance history for date range
 */
export async function getAttendanceHistory(classId = null, studentId = null, startDate, endDate) {
  try {
    const attendanceRef = collection(db, 'attendance');
    let constraints = [];
    
    if (classId) constraints.push(where('classId', '==', classId));
    if (studentId) constraints.push(where('studentId', '==', studentId));
    if (startDate) constraints.push(where('date', '>=', startDate));
    if (endDate) constraints.push(where('date', '<=', endDate));
    
    const q = query(attendanceRef, ...constraints);
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: records };
  } catch (error) {
    console.error('Error getting attendance history:', error);
    return { success: false, error: error.message, data: [] };
  }
}
