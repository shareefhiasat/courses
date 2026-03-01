/**
 * Program Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for program records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'programs'
 * 
 * @typedef {import('@types/index').Program} Program
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  where
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';

/**
 * Get all programs - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getPrograms = async () => {
  try {
    const result = await dbService.getAll(COLLECTIONS.PROGRAMS, {
      orderBy: {
        field: 'name',
        direction: 'asc'
      }
    });
    return result;
  } catch (error) {
    logger.error('[ProgramDbService] Error getting programs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get program by ID - with performance monitoring and memoization
 * @param {string} programId - Program ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getProgram = async (programId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.PROGRAMS, programId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Program not found' };
  } catch (error) {
    logger.error('[ProgramDbService] Error getting program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all programs sorted by name
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getProgramsSorted = async () => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.PROGRAMS), orderBy('nameEn', 'asc'));
    const querySnapshot = await getDocs(q);
    const programs = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: programs };
  } catch (error) {
    logger.error('[ProgramDbService] Error getting programs sorted:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active programs
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActivePrograms = async () => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.PROGRAMS), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    const programs = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: programs };
  } catch (error) {
    logger.error('[ProgramDbService] Error getting active programs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create program
 * @param {Object} programData - Program data
 * @param {Object} auditData - Audit data from getCreateAuditData
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createProgram = async (programData, auditData = null) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.PROGRAMS));
    const finalData = {
      ...programData,
      ...(auditData || {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    };
    await setDoc(docRef, finalData);
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[ProgramDbService] Error creating program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update program
 * @param {string} programId - Program ID
 * @param {Object} updateData - Data to update
 * @param {Object} auditData - Audit data from getUpdateAuditData
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProgram = async (programId, updateData, auditData = null) => {
  try {
    const finalData = {
      ...updateData,
      ...(auditData || {
        updatedAt: serverTimestamp()
      })
    };
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.PROGRAMS, programId), finalData);
    return { success: true };
  } catch (error) {
    logger.error('[ProgramDbService] Error updating program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete program
 * @param {string} programId - Program ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteProgram = async (programId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.PROGRAMS, programId));
    return { success: true };
  } catch (error) {
    logger.error('[ProgramDbService] Error deleting program:', error);
    return { success: false, error: error.message };
  }
};
