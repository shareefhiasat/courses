/**
 * Class Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for class records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'classes'
 * 
 * @typedef {import('@types/index').Class} Class
 * @typedef {import('@types/index').ClassSchedule} ClassSchedule
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get all classes - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getClasses = async () => {
  try {
    const result = await dbService.getAll(COLLECTIONS.CLASSES);
    return result;
  } catch (error) {
    logger.error('[ClassDbService] Error getting classes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get class by ID - with performance monitoring and memoization
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getClass = async (classId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.CLASSES, classId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Class not found' };
  } catch (error) {
    logger.error('[ClassDbService] Error getting class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get classes by program
 * @param {string} programId - Program ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getClassesByProgram = async (programId) => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.CLASSES), where('programId', '==', programId));
    const querySnapshot = await getDocs(q);
    const classes = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: classes };
  } catch (error) {
    logger.error('[ClassDbService] Error getting classes by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get classes by instructor
 * @param {string} instructorId - Instructor ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getClassesByInstructor = async (instructorId) => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.CLASSES), where('instructorId', '==', instructorId));
    const querySnapshot = await getDocs(q);
    const classes = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: classes };
  } catch (error) {
    logger.error('[ClassDbService] Error getting classes by instructor:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create class
 * @param {Object} classData - Class data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const create = async (classData, user = null) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.CLASSES));
    const finalData = {
      ...classData,
      ...getCreateAuditData(user || { uid: 'system' })
    };
    await setDoc(docRef, finalData);
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[ClassDbService] Error creating class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update class
 * @param {string} classId - Class ID
 * @param {Object} updateData - Data to update
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const update = async (classId, updateData, user = null) => {
  try {
    console.log('🔧 [ClassDbService] update called:', {
      classId,
      updateDataKeys: Object.keys(updateData),
      updateDataSample: updateData,
      user: user?.email || 'unknown'
    });
    
    const finalData = {
      ...updateData,
      ...getUpdateAuditData(user || { uid: 'system' })
    };
    
    console.log(' [ClassDbService] final data for Firestore:', finalData);
    
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.CLASSES, classId), finalData);
    
    console.log(' [ClassDbService] Firestore update successful for classId:', classId);
    
    return { success: true };
  } catch (error) {
    console.error(' [ClassDbService] Firestore update error:', error);
    logger.error('[ClassDbService] Error updating class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete class
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.CLASSES, classId));
    return { success: true };
  } catch (error) {
    logger.error('[ClassDbService] Error deleting class:', error);
    return { success: false, error: error.message };
  }
};
