/**
 * Subject Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for subject records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'subjects'
 * 
 * @typedef {import('@types/index').Subject} Subject
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get all subjects - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubjects = async () => {
  try {
    const result = await dbService.getAll(COLLECTIONS.SUBJECTS, {
      orderBy: {
        field: 'nameEn',
        direction: 'asc'
      }
    });
    return result;
  } catch (error) {
    logger.error('[SubjectDbService] Error getting subjects:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get subject by ID - with performance monitoring and memoization
 * @param {string} subjectId - Subject ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getSubject = async (subjectId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.SUBJECTS, subjectId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Subject not found' };
  } catch (error) {
    logger.error('[SubjectDbService] Error getting subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create subject
 * @param {Object} subjectData - Subject data
 * @param {Object} auditData - Audit data from getCreateAuditData
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createSubject = async (subjectData, auditData = null) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.SUBJECTS));
    const finalData = {
      ...subjectData,
      ...(auditData || {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    };
    await setDoc(docRef, finalData);
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[SubjectDbService] Error creating subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update subject
 * @param {string} subjectId - Subject ID
 * @param {Object} subjectData - Updated subject data
 * @param {Object} auditData - Audit data from getUpdateAuditData
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSubject = async (subjectId, subjectData, auditData = null) => {
  try {
    const finalData = {
      ...subjectData,
      ...(auditData || {
        updatedAt: serverTimestamp()
      })
    };
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.SUBJECTS, subjectId), finalData);
    return { success: true };
  } catch (error) {
    logger.error('[SubjectDbService] Error updating subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete subject
 * @param {string} subjectId - Subject ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteSubject = async (subjectId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.SUBJECTS, subjectId));
    return { success: true };
  } catch (error) {
    logger.error('[SubjectDbService] Error deleting subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get subjects by program
 * @param {string} programId - Program ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubjectsByProgram = async (programId) => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.SUBJECTS), 
      where('programId', '==', programId),
      orderBy('nameEn', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const subjects = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: subjects };
  } catch (error) {
    logger.error('[SubjectDbService] Error getting subjects by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active subjects
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActiveSubjects = async () => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.SUBJECTS), 
      where('isActive', '==', true),
      orderBy('nameEn', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const subjects = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: subjects };
  } catch (error) {
    logger.error('[SubjectDbService] Error getting active subjects:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search subjects by name
 * @param {string} searchTerm - Search term
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const searchSubjects = async (searchTerm) => {
  try {
    // This would typically require a full-text search index
    // For now, get all subjects and filter client-side
    const result = await getSubjects();
    if (!result.success) {
      return result;
    }
    
    const filteredSubjects = result.data.filter(subject => 
      subject.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { success: true, data: filteredSubjects };
  } catch (error) {
    logger.error('[SubjectDbService] Error searching subjects:', error);
    return { success: false, error: error.message };
  }
};
