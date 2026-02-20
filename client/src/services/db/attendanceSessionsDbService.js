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
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../other/config';
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
    await setDoc(docRef, {
      ...sessionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
      updatedAt: serverTimestamp()
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
    await updateDoc(doc(db, 'classes', classId, 'sessions', sessionId), {
      status: 'closed',
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    logger.error('[AttendanceSessionsDbService] Error updating attendance mark:', error);
    return { success: false, error: error.message };
  }
};
