/**
 * Business Service Layer - Attendance
 * Business logic for attendance operations
 * Uses db-services for data access
 */

import { httpsCallable } from 'firebase/functions';
import { doc, collection, query, where, getDocs, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { functions, db } from '../other/config.js';
import { 
  getAttendanceRecords, 
  getAttendanceRecord, 
  setAttendanceRecord, 
  updateAttendanceRecord, 
  deleteAttendanceRecord, 
  getAttendanceStats 
} from '../db-services/attendanceDbService.js';
import { addNotification } from '../notificationService.js';
import { sendEmail } from '../emailService.js';
import logger from '../../utils/logger';
import { getUserDisplayName } from '../userService.js';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes.js';
import { RECORD_TYPES } from '@utils/sharedTypes.js';

/**
 * Get absences from attendance collection
 * @param {string} studentId - Student ID
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
    const filters = {
      studentId,
      subjectId,
      semester,
      status: ['absent_no_excuse', 'absent_with_excuse', 'excused_leave']
    };

    const result = await getAttendanceRecords(filters);
    return result;
  } catch (error) {
    console.error('[AttendanceBusinessService] Error getting absences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create attendance session (QR-based)
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} Session information
 */
export async function createAttendanceSession({ classId, subjectId, scheduledAt, createdBy }) {
  try {
    // Use callable backend for QR rotation/session lifecycle
    const fn = httpsCallable(functions, 'attendanceCreateSession');
    logger.log('[AttendanceBusinessService] calling attendanceCreateSession', { classId, subjectId });
    
    const res = await fn({ classId, subjectId });
    logger.log('[AttendanceBusinessService] attendanceCreateSession result', res?.data);
    
    const { data } = res || {}; 
    return { 
      success: true, 
      data: { 
        id: data?.sessionId, 
        token: data?.token, 
        rotationSeconds: data?.rotationSeconds, 
        endAt: data?.endAt 
      }
    };
  } catch (error) {
    console.error('[AttendanceBusinessService] Error creating attendance session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark attendance via QR scan
 * @param {Object} scanData - Scan data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markAttendanceByQR({ classId, sessionId, uid, action, reason }) {
  try {
    // action: 'present' | 'participation' | 'penalty'
    const markRef = doc(db, 'classes', classId, 'sessions', sessionId, 'marks', uid);
    const base = {
      updatedAt: serverTimestamp(),
      history: [{ at: serverTimestamp(), action, reason: reason || null }],
    };
    
    if (action === 'present') base.status = 'present';
    if (action === RECORD_TYPES.PARTICIPATION) base.delta = (base.delta || 0) + 1;
    if (action === RECORD_TYPES.PENALTY) base.delta = (base.delta || 0) - 1;
    
    await setDoc(markRef, base, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('[AttendanceBusinessService] Error marking attendance by QR:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Finalize attendance session
 * @param {Object} finalizeData - Finalization data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function finalizeAttendanceSession({ classId, sessionId, absentUids }) {
  try {
    const sessRef = doc(db, 'classes', classId, 'sessions', sessionId);
    await updateDoc(sessRef, { status: 'confirmed', confirmedAt: serverTimestamp() });
    
    // Optionally set absent marks in batch on client-side UI; here we leave to UI for performance reasons.
    return { success: true };
  } catch (error) {
    console.error('[AttendanceBusinessService] Error finalizing session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List open attendance sessions
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export async function listOpenAttendanceSessions({ classId }) {
  try {
    const col = collection(db, 'classes', classId, 'sessions');
    const q = query(col, where('status', '==', 'open'));
    const snap = await getDocs(q);
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    console.error('[AttendanceBusinessService] Error listing open sessions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get attendance session details
 * @param {Object} sessionData - Session data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getAttendanceSession({ classId, sessionId }) {
  try {
    const ref = doc(db, 'classes', classId, 'sessions', sessionId);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      return { success: true, data: { id: snap.id, ...snap.data() } };
    } else {
      return { success: false, error: 'Session not found' };
    }
  } catch (error) {
    console.error('[AttendanceBusinessService] Error getting session:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark attendance manually with business logic
 * @param {Object} attendanceData - Attendance data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markAttendance({ 
  classId, 
  studentId, 
  date, 
  status, 
  markedBy, 
  performedBy,
  performedByName,
  performedByEmail,
  method = 'manual', 
  notes = '',
  studentInfo = null,
  className = '',
  sendNotification = true,
  previousStatus = null,
  delta = null,
  category = null
}) {
  try {
    const attendanceId = delta !== null 
      ? `${classId}_${studentId}_${date}_${category || 'delta'}_${Date.now()}`
      : `${classId}_${studentId}_${date}`;
    
    // Check if this is an update (status change) - only applicable for non-delta records
    let isUpdate = false;
    let oldStatus = null;
    let statusChanged = false;
    let existingHistory = [];

    if (delta === null) {
      const existingResult = await getAttendanceRecord(attendanceId);
      isUpdate = existingResult.success;
      oldStatus = existingResult.data?.status || null;
      statusChanged = isUpdate && oldStatus !== status;
      existingHistory = existingResult.data?.history || [];
    }
    
    const attendanceData = {
      classId,
      studentId,
      date,
      status,
      markedBy,
      performedBy,
      performedByName,
      performedByEmail,
      method,
      notes,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Include delta and category if provided
      ...(delta !== null && { delta }),
      ...(category !== null && { category }),
      // Track history of changes
      ...(statusChanged ? {
        history: [...existingHistory, {
          from: oldStatus,
          to: status,
          changedBy: markedBy,
          changedAt: new Date().toISOString(),
          notes
        }]
      } : {})
    };

    const result = await setAttendanceRecord(attendanceId, attendanceData);
    
    if (!result.success) {
      return result;
    }

    // Send notification to student if status is not 'present' or if status changed
    if (sendNotification && studentId && (status !== ATTENDANCE_STATUS.PRESENT || statusChanged)) {
      await sendAttendanceNotifications({
        studentId,
        status,
        statusChanged,
        previousStatus: statusChanged ? oldStatus : null,
        className,
        date,
        notes,
        method,
        studentInfo
      });
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
 * Send attendance notifications (in-app and email)
 * @param {Object} notificationData - Notification data
 */
async function sendAttendanceNotifications({
  studentId,
  status,
  statusChanged,
  previousStatus,
  className,
  date,
  notes,
  method,
  studentInfo
}) {
  try {
    const statusLabel = ATTENDANCE_STATUS_LABELS[status] || { en: status, ar: status };
    const formattedDate = new Date(date).toLocaleDateString('en-GB');
    
    // In-app notification
    await addNotification({
      userId: studentId,
      title: statusChanged ? '📋 Attendance Updated' : '📋 Attendance Recorded',
      message: `Your attendance for ${className || 'class'} on ${formattedDate}: ${statusLabel.en}${notes ? ` - ${notes}` : ''}`,
      type: RECORD_TYPES.ATTENDANCE,
      classId: className,
      metadata: {
        date,
        status,
        previousStatus: statusChanged ? previousStatus : null,
        className: className,
        method: method
      },
      data: { 
        classId: className, 
        date, 
        status,
        previousStatus: statusChanged ? previousStatus : null
      }
    });

    // Email notification for non-present statuses
    if (studentInfo?.email && status !== ATTENDANCE_STATUS.PRESENT) {
      try {
        await sendEmail({
          to: studentInfo.email,
          template: 'attendanceNotification',
          type: RECORD_TYPES.ATTENDANCE,
          classId: className,
          data: {
            studentName: studentInfo.displayName || studentInfo.email,
            className: className || 'Class',
            date: formattedDate,
            status: statusLabel.en,
            statusAr: statusLabel.ar,
            notes: notes || '',
            isUpdate: statusChanged,
            previousStatus: statusChanged ? (ATTENDANCE_STATUS_LABELS[oldStatus]?.en || oldStatus) : null
          },
          metadata: {
            classId: className,
            className,
            date,
            status,
            method
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

/**
 * Get attendance summary for a class
 * @param {string} classId - Class ID
 * @param {Object} dateRange - Optional date range
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export async function getClassAttendanceSummary(classId, dateRange = null) {
  try {
    const statsResult = await getAttendanceStats(classId, dateRange);
    
    if (!statsResult.success) {
      return statsResult;
    }

    const { data: stats } = statsResult;
    
    // Calculate additional metrics
    const attendanceRate = stats.total > 0 
      ? Math.round((stats.present / stats.total) * 100) 
      : 0;

    const summary = {
      ...stats,
      attendanceRate,
      averageAttendance: stats.total > 0 ? (stats.present / stats.total) : 0,
      needsAttention: stats.absent > 0,
      performance: attendanceRate >= 90 ? 'excellent' : attendanceRate >= 75 ? 'good' : 'needs_improvement'
    };

    return { success: true, data: summary };
  } catch (error) {
    console.error('[AttendanceBusinessService] Error getting class attendance summary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get student attendance report
 * @param {string} studentId - Student ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export async function getStudentAttendanceReport(studentId, filters = {}) {
  try {
    const recordsResult = await getAttendanceRecords({ studentId, ...filters });
    
    if (!recordsResult.success) {
      return recordsResult;
    }

    const { data: records } = recordsResult;
    
    // Calculate student-specific metrics
    const totalRecords = records.length;
    const presentRecords = records.filter(r => r.status === 'present').length;
    const lateRecords = records.filter(r => r.status === 'late').length;
    const absentRecords = records.filter(r => ['absent_no_excuse', 'absent_with_excuse'].includes(r.status)).length;
    
    const attendanceRate = totalRecords > 0 
      ? Math.round((presentRecords / totalRecords) * 100) 
      : 0;

    const report = {
      totalClasses: totalRecords,
      present: presentRecords,
      late: lateRecords,
      absent: absentRecords,
      attendanceRate,
      punctualityRate: totalRecords > 0 
        ? Math.round(((presentRecords + lateRecords) / totalRecords) * 100) 
        : 0,
      records: records.sort((a, b) => new Date(b.date) - new Date(a.date)),
      trends: calculateAttendanceTrends(records)
    };

    return { success: true, data: report };
  } catch (error) {
    console.error('[AttendanceBusinessService] Error getting student attendance report:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate attendance trends
 * @param {Array} records - Attendance records
 * @returns {Object} Trend data
 */
function calculateAttendanceTrends(records) {
  // Group by week for trend analysis
  const weeklyData = {};
  
  records.forEach(record => {
    const date = new Date(record.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { present: 0, total: 0 };
    }
    
    weeklyData[weekKey].total++;
    if (record.status === 'present') {
      weeklyData[weekKey].present++;
    }
  });

  const trends = Object.entries(weeklyData)
    .map(([week, data]) => ({
      week,
      attendanceRate: Math.round((data.present / data.total) * 100),
      present: data.present,
      total: data.total
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return trends;
}
