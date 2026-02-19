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
import { withPerformanceMonitoring, memoize } from '@utils/performance';

/**
 * Get all subjects - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubjects = withPerformanceMonitoring(
  memoize(async () => {
    try {
      const q = query(collection(db, 'subjects'), orderBy('name_en', 'asc'));
      const querySnapshot = await getDocs(q);
      const subjects = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      return { success: true, data: subjects };
    } catch (error) {
      logger.error('[SubjectDbService] Error getting subjects:', error);
      return { success: false, error: error.message };
    }
  }),
  'getSubjects'
);

/**
 * Get subject by ID - with performance monitoring and memoization
 * @param {string} subjectId - Subject ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getSubject = withPerformanceMonitoring(
  memoize(async (subjectId) => {
    try {
      const docSnap = await getDoc(doc(db, 'subjects', subjectId));
      if (docSnap.exists()) {
        return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
      }
      return { success: false, error: 'Subject not found' };
    } catch (error) {
      logger.error('[SubjectDbService] Error getting subject:', error);
      return { success: false, error: error.message };
    }
  }),
  'getSubject'
);

/**
 * Create subject
 * @param {Object} subjectData - Subject data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createSubject = async (subjectData) => {
  try {
    const docRef = doc(collection(db, 'subjects'));
    await setDoc(docRef, {
      ...subjectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSubject = async (subjectId, subjectData) => {
  try {
    await updateDoc(doc(db, 'subjects', subjectId), {
      ...subjectData,
      updatedAt: serverTimestamp()
    });
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
    await deleteDoc(doc(db, 'subjects', subjectId));
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
      collection(db, 'subjects'), 
      where('programId', '==', programId),
      orderBy('name_en', 'asc')
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
      collection(db, 'subjects'), 
      where('isActive', '==', true),
      orderBy('name_en', 'asc')
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
      subject.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { success: true, data: filteredSubjects };
  } catch (error) {
    logger.error('[SubjectDbService] Error searching subjects:', error);
    return { success: false, error: error.message };
  }
};
