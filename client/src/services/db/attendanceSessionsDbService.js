/**
 * Attendance Sessions Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for attendance session records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'classes/{classId}/sessions'
 * 
 * @typedef {import('@types/index').AttendanceSession} AttendanceSession
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../other/config';
import { getQatarTimestampString } from '@utils/qatarDate';
import logger from '@utils/logger';

/**
 * Get attendance sessions for a class
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAttendanceSessions = async (classId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'classes', classId, 'sessions'),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error getting attendance sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get open attendance sessions for a class
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getOpenAttendanceSessions = async (classId, options = {}) => {
  try {
    const { limitCount = 50 } = options;
    
    const q = query(
      collection(db, 'classes', classId, 'sessions'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error getting open attendance sessions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance session by ID
 * @param {string} classId - Class ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getAttendanceSession = async (classId, sessionId) => {
  try {
    const docSnap = await getDoc(doc(db, 'classes', classId, 'sessions', sessionId));
    
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Session not found' };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error getting attendance session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create attendance session
 * @param {string} classId - Class ID
 * @param {Object} sessionData - Session data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createAttendanceSession = async (classId, sessionData) => {
  try {
    const docRef = doc(collection(db, 'classes', classId, 'sessions'));
    const now = getQatarTimestampString();
    await setDoc(docRef, {
      ...sessionData,
      createdAt: now,
      updatedAt: now
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error creating attendance session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update attendance session
 * @param {string} classId - Class ID
 * @param {string} sessionId - Session ID
 * @param {Object} updateData - Update data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAttendanceSession = async (classId, sessionId, updateData) => {
  try {
    await updateDoc(doc(db, 'classes', classId, 'sessions', sessionId), {
      ...updateData,
      updatedAt: getQatarTimestampString()
    });
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error updating attendance session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete attendance session
 * @param {string} classId - Class ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAttendanceSession = async (classId, sessionId) => {
  try {
    await deleteDoc(doc(db, 'classes', classId, 'sessions', sessionId));
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error deleting attendance session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Close attendance session
 * @param {string} classId - Class ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const closeAttendanceSession = async (classId, sessionId) => {
  try {
    const now = getQatarTimestampString();
    await updateDoc(doc(db, 'classes', classId, 'sessions', sessionId), {
      status: 'closed',
      closedAt: now,
      updatedAt: now
    });
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error closing attendance session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all attendance sessions for HR dashboard
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAllAttendanceSessions = async () => {
  try {
    const q = query(collection(db, 'attendanceSessions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const sessions = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    return { success: true, data: sessions };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error getting all attendance sessions:', error);
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
    const q = query(collection(db, 'attendanceSessions', sessionId, 'marks'));
    const querySnapshot = await getDocs(q);
    
    const marks = querySnapshot.docs.map(doc => ({ 
      uid: doc.id, 
      ...doc.data() 
    }));
    
    // Count by status
    const counts = marks.reduce((acc, mark) => {
      const status = mark.status || 'present';
      acc[status] = (acc[status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});
    
    return { success: true, data: counts };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error getting attendance marks count:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update attendance mark status
 * @param {string} sessionId - Session ID
 * @param {string} uid - User ID
 * @param {Object} updateData - Update data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAttendanceMark = async (sessionId, uid, updateData) => {
  try {
    const markRef = doc(db, 'attendanceSessions', sessionId, 'marks', uid);
    await updateDoc(markRef, {
      ...updateData,
      updatedAt: getQatarTimestampString()
    });
    
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error updating attendance mark:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance marks for export
 * @param {string} sessionId - Session ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAttendanceMarksForExport = async (sessionId) => {
  try {
    const q = query(collection(db, 'attendanceSessions', sessionId, 'marks'));
    const querySnapshot = await getDocs(q);
    const marks = querySnapshot.docs.map(doc => ({ 
      uid: doc.id, 
      ...doc.data() 
    }));
    return { success: true, data: marks };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error getting attendance marks for export:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark attendance by QR scan
 * @param {string} sessionId - Session ID
 * @param {string} uid - User ID
 * @param {Object} markData - Mark data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markAttendanceByQR = async (sessionId, uid, markData) => {
  try {
    const markRef = doc(db, 'attendanceSessions', sessionId, 'marks', uid);
    const base = {
      ...markData,
      history: [{ at: markData.updatedAt, action: markData.action, reason: markData.reason || null }],
    };
    
    if (markData.action === 'present') base.status = 'present';
    if (markData.action === 'participation') base.delta = (base.delta || 0) + 1;
    if (markData.action === 'penalty') base.delta = (base.delta || 0) - 1;
    
    await setDoc(markRef, base, { merge: true });
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error marking attendance by QR:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Finalize attendance session
 * @param {string} classId - Class ID
 * @param {string} sessionId - Session ID
 * @param {Object} finalizeData - Finalization data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const finalizeAttendanceSession = async (classId, sessionId, finalizeData) => {
  try {
    const sessRef = doc(db, 'classes', classId, 'sessions', sessionId);
    await updateDoc(sessRef, {
      ...finalizeData,
      updatedAt: getQatarTimestampString()
    });
    
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error finalizing attendance session:', error);
    return { success: false, error: error.message };
  }
};
