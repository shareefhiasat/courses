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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get all programs - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getPrograms = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'programs'));
    const programs = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: programs };
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
    const docSnap = await getDoc(doc(db, 'programs', programId));
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
    const q = query(collection(db, 'programs'), orderBy('name_en', 'asc'));
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
    const q = query(collection(db, 'programs'), where('isActive', '==', true));
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
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createProgram = async (programData) => {
  try {
    const docRef = doc(collection(db, 'programs'));
    await setDoc(docRef, {
      ...programData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProgram = async (programId, updateData) => {
  try {
    await updateDoc(doc(db, 'programs', programId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
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
    await deleteDoc(doc(db, 'programs', programId));
    return { success: true };
  } catch (error) {
    logger.error('[ProgramDbService] Error deleting program:', error);
    return { success: false, error: error.message };
  }
};
