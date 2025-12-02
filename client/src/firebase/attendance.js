import { doc, setDoc, updateDoc, serverTimestamp, collection, addDoc, getDocs, query, where, getDoc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config';
import { addNotification } from './notifications';
import { sendEmail } from './firestore';

/**
 * Attendance Status Types
 * These are the official attendance statuses used throughout the system
 */
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT_NO_EXCUSE: 'absent_no_excuse',      // غياب بدون عذر
  ABSENT_WITH_EXCUSE: 'absent_with_excuse',  // غياب بعذر
  LATE: 'late',                               // تأخر على الحصة
  EXCUSED_LEAVE: 'excused_leave',            // استئذان
  HUMAN_CASE: 'human_case'                   // حالة إنسانية
};

export const ATTENDANCE_STATUS_LABELS = {
  present: { en: 'Present', ar: 'حاضر', color: '#22c55e' },
  absent_no_excuse: { en: 'Absent (No Excuse)', ar: 'غياب بدون عذر', color: '#ef4444' },
  absent_with_excuse: { en: 'Absent (Excused)', ar: 'غياب بعذر', color: '#f97316' },
  late: { en: 'Late', ar: 'متأخر', color: '#eab308' },
  excused_leave: { en: 'Excused Leave', ar: 'استئذان', color: '#3b82f6' },
  human_case: { en: 'Human Case', ar: 'حالة إنسانية', color: '#8b5cf6' }
};

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

export async function scanAttendance(payload) {
  const fn = httpsCallable(functions, 'attendanceScan');
  // payload may include: sid, token, deviceHash, classId, status, reason, note
  console.log('[Attendance/api] calling attendanceScan', payload);
  try {
    const res = await fn(payload);
    console.log('[Attendance/api] attendanceScan result', res?.data);
    return res?.data;
  } catch (error) {
    // Map common Cloud Function errors to clearer messages
    const msg = error?.message || '';
    if (msg.includes('auth_required')) {
      throw new Error('You must be logged in to record attendance. Please sign in and try again.');
    }
    if (msg.includes('sid_and_token_required')) {
      throw new Error('Attendance link is invalid or incomplete (missing session information).');
    }
    if (msg.includes('invalid_token')) {
      throw new Error('This attendance link has expired or is invalid. Please scan a fresh QR code.');
    }
    if (msg.includes('session_not_found')) {
      throw new Error('This attendance session no longer exists. Ask your instructor to start a new session.');
    }
    if (msg.includes('session_closed')) {
      throw new Error('This attendance session is already closed.');
    }
    if (msg.includes('device_change_blocked')) {
      throw new Error('Attendance blocked: you are trying to scan from a different device than before for this session.');
    }
    console.error('attendanceScan failed:', error);
    throw new Error('Failed to record attendance. Please try again or contact support.');
  }
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
 * @param {Object} params
 * @param {string} params.classId - Class ID
 * @param {string} params.studentId - Student user ID
 * @param {string} params.date - Date string (YYYY-MM-DD)
 * @param {string} params.status - One of ATTENDANCE_STATUS values
 * @param {string} params.markedBy - User ID who marked attendance
 * @param {string} params.method - 'qr' | 'manual'
 * @param {string} params.notes - Optional notes
 * @param {Object} params.studentInfo - Optional { email, displayName } for notifications
 * @param {string} params.className - Optional class name for notifications
 * @param {boolean} params.sendNotification - Whether to send notification (default: true)
 * @param {string} params.previousStatus - Previous status if this is an update
 */
export async function markAttendance({ 
  classId, 
  studentId, 
  date, 
  status, 
  markedBy, 
  method = 'manual', 
  notes = '',
  studentInfo = null,
  className = '',
  sendNotification = true,
  previousStatus = null
}) {
  try {
    const attendanceRef = collection(db, 'attendance');
    const attendanceId = `${classId}_${studentId}_${date}`;
    const docRef = doc(attendanceRef, attendanceId);
    
    // Check if this is an update (status change)
    const existingDoc = await getDoc(docRef);
    const isUpdate = existingDoc.exists();
    const oldStatus = existingDoc.exists() ? existingDoc.data().status : null;
    const statusChanged = isUpdate && oldStatus !== status;
    
    await setDoc(docRef, {
      classId,
      studentId,
      date,
      status,
      markedBy,
      method,
      notes,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Track history of changes
      ...(statusChanged ? {
        history: [...(existingDoc.data().history || []), {
          from: oldStatus,
          to: status,
          changedBy: markedBy,
          changedAt: new Date().toISOString(),
          notes
        }]
      } : {})
    }, { merge: true });

    // Send notification to student if status is not 'present' or if status changed
    if (sendNotification && studentId && (status !== ATTENDANCE_STATUS.PRESENT || statusChanged)) {
      try {
        const statusLabel = ATTENDANCE_STATUS_LABELS[status] || { en: status, ar: status };
        const formattedDate = new Date(date).toLocaleDateString('en-GB');
        
        // In-app notification
        await addNotification({
          userId: studentId,
          title: statusChanged ? '📋 Attendance Updated' : '📋 Attendance Recorded',
          message: `Your attendance for ${className || 'class'} on ${formattedDate}: ${statusLabel.en}${notes ? ` - ${notes}` : ''}`,
          type: 'attendance',
          data: { 
            classId, 
            date, 
            status,
            previousStatus: statusChanged ? oldStatus : null
          }
        });

        // Email notification for non-present statuses
        if (studentInfo?.email && status !== ATTENDANCE_STATUS.PRESENT) {
          try {
            await sendEmail({
              to: studentInfo.email,
              template: 'attendanceNotification',
              data: {
                studentName: studentInfo.displayName || studentInfo.email,
                className: className || 'Class',
                date: formattedDate,
                status: statusLabel.en,
                statusAr: statusLabel.ar,
                notes: notes || '',
                isUpdate: statusChanged,
                previousStatus: statusChanged ? (ATTENDANCE_STATUS_LABELS[oldStatus]?.en || oldStatus) : null
              }
            });
          } catch (emailError) {
            console.warn('Failed to send attendance email:', emailError);
          }
        }
      } catch (notifyError) {
        console.warn('Failed to send attendance notification:', notifyError);
      }
    }

    return { success: true, isUpdate, statusChanged };
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
 * Returns detailed breakdown by all status types for HR analytics
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

    // Detailed stats by all status types
    const stats = {
      totalRecords: records.length,
      // Core statuses
      present: records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length,
      late: records.filter(r => r.status === ATTENDANCE_STATUS.LATE).length,
      // Absence types
      absentNoExcuse: records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE).length,
      absentWithExcuse: records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE).length,
      excusedLeave: records.filter(r => r.status === ATTENDANCE_STATUS.EXCUSED_LEAVE).length,
      humanCase: records.filter(r => r.status === ATTENDANCE_STATUS.HUMAN_CASE).length,
      // Legacy support (count old 'absent' and 'excused' statuses)
      legacyAbsent: records.filter(r => r.status === 'absent').length,
      legacyExcused: records.filter(r => r.status === 'excused').length,
      // Computed totals
      totalAbsent: 0,
      totalExcused: 0,
      attendanceRate: 0,
      // By student breakdown
      byStudent: {}
    };

    // Calculate totals
    stats.totalAbsent = stats.absentNoExcuse + stats.legacyAbsent;
    stats.totalExcused = stats.absentWithExcuse + stats.excusedLeave + stats.humanCase + stats.legacyExcused;

    // Calculate attendance rate (present + late counts as attended)
    if (stats.totalRecords > 0) {
      const attended = stats.present + stats.late;
      stats.attendanceRate = ((attended / stats.totalRecords) * 100).toFixed(2);
    }

    // Group by student for detailed analytics
    records.forEach(r => {
      if (!stats.byStudent[r.studentId]) {
        stats.byStudent[r.studentId] = {
          present: 0,
          late: 0,
          absentNoExcuse: 0,
          absentWithExcuse: 0,
          excusedLeave: 0,
          humanCase: 0,
          total: 0
        };
      }
      const s = stats.byStudent[r.studentId];
      s.total++;
      switch (r.status) {
        case ATTENDANCE_STATUS.PRESENT: s.present++; break;
        case ATTENDANCE_STATUS.LATE: s.late++; break;
        case ATTENDANCE_STATUS.ABSENT_NO_EXCUSE: s.absentNoExcuse++; break;
        case ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE: s.absentWithExcuse++; break;
        case ATTENDANCE_STATUS.EXCUSED_LEAVE: s.excusedLeave++; break;
        case ATTENDANCE_STATUS.HUMAN_CASE: s.humanCase++; break;
        case 'absent': s.absentNoExcuse++; break; // Legacy
        case 'excused': s.absentWithExcuse++; break; // Legacy
      }
    });

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
