/**
 * Enrollments Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for enrollment and marks records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTIONS: 'enrollments', 'marks', 'marksDistribution'
 * 
 * @typedef {import('@types/index').Enrollment} Enrollment
 * @typedef {import('@types/index').EnrollmentStatus} EnrollmentStatus
 * @typedef {import('@types/index').Marks} Marks
 * @typedef {import('@types/index').MarksDistribution} MarksDistribution
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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

// ==================== MARKS OPERATIONS ====================

/**
 * Get marks by student, subject, and class
 * @param {string} studentId - Student ID
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getStudentMarks = async (studentId, subjectId, classId) => {
  try {
    const compositeKey = `${studentId}_${classId}_${subjectId}`;
    const docSnap = await getDoc(doc(db, 'studentMarks', compositeKey));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Marks not found' };
  } catch (error) {
    logger.error('[MarksDbService] Error getting student marks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all marks for a class and subject (returns object with composite keys)
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getAllClassSubjectMarks = async (subjectId, classId) => {
  try {
    const q = query(
      collection(db, 'studentMarks'), 
      where('subjectId', '==', subjectId),
      where('classId', '==', classId)
    );
    const querySnapshot = await getDocs(q);
    const marks = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    
    // Convert array to object with composite keys for easier lookup
    const marksObject = {};
    marks.forEach(mark => {
      const compositeKey = `${mark.studentId}_${mark.classId}_${mark.subjectId}`;
      marksObject[compositeKey] = mark;
    });
    
    return { success: true, data: marksObject };
  } catch (error) {
    logger.error('[MarksDbService] Error getting all class subject marks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update student marks
 * @param {string} studentId - Student ID
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @param {Object} marksData - Marks data
 * @returns {Promise<{success: boolean, id: string, error?: string}>}
 */
export const setStudentMarks = async (studentId, subjectId, classId, marksData) => {
  try {
    const compositeKey = `${studentId}_${classId}_${subjectId}`;
    await setDoc(
      doc(db, 'studentMarks', compositeKey),
      {
        ...marksData,
        studentId,
        subjectId,
        classId,
        createdAt: marksData.createdAt || Timestamp.now(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { success: true, id: compositeKey };
  } catch (error) {
    logger.error('[MarksDbService] Error setting student marks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update student marks
 * @param {string} studentId - Student ID
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateStudentMarks = async (studentId, subjectId, classId, updateData) => {
  try {
    const compositeKey = `${studentId}_${classId}_${subjectId}`;
    await updateDoc(doc(db, 'studentMarks', compositeKey), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[MarksDbService] Error updating student marks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete student marks
 * @param {string} studentId - Student ID
 * @param {string} subjectId - Subject ID
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteStudentMarks = async (studentId, subjectId, classId) => {
  try {
    const compositeKey = `${studentId}_${classId}_${subjectId}`;
    await deleteDoc(doc(db, 'studentMarks', compositeKey));
    return { success: true };
  } catch (error) {
    logger.error('[MarksDbService] Error deleting student marks:', error);
    return { success: false, error: error.message };
  }
};

// ==================== MARKS DISTRIBUTION OPERATIONS ====================

/**
 * Get marks distribution by subject
 * @param {string} subjectId - Subject ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getSubjectMarksDistribution = async (subjectId) => {
  try {
    const docSnap = await getDoc(doc(db, 'subjectMarksDistribution', subjectId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Marks distribution not found' };
  } catch (error) {
    logger.error('[MarksDbService] Error getting subject marks distribution:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update marks distribution for a subject
 * @param {string} subjectId - Subject ID
 * @param {Object} distributionData - Distribution data
 * @returns {Promise<{success: boolean, id: string, error?: string}>}
 */
export const setSubjectMarksDistribution = async (subjectId, distributionData) => {
  try {
    await setDoc(
      doc(db, 'subjectMarksDistribution', subjectId),
      {
        ...distributionData,
        subjectId,
        createdAt: distributionData.createdAt || Timestamp.now(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { success: true, id: subjectId };
  } catch (error) {
    logger.error('[MarksDbService] Error setting subject marks distribution:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update marks distribution
 * @param {string} subjectId - Subject ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSubjectMarksDistribution = async (subjectId, updateData) => {
  try {
    await updateDoc(doc(db, 'subjectMarksDistribution', subjectId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[MarksDbService] Error updating subject marks distribution:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete marks distribution
 * @param {string} subjectId - Subject ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteSubjectMarksDistribution = async (subjectId) => {
  try {
    await deleteDoc(doc(db, 'subjectMarksDistribution', subjectId));
    return { success: true };
  } catch (error) {
    logger.error('[MarksDbService] Error deleting subject marks distribution:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all marks distributions
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAllMarksDistributions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'subjectMarksDistribution'));
    const distributions = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: distributions };
  } catch (error) {
    logger.error('[EnrollmentsDbService] Error getting all marks distributions:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// ENROLLMENT OPERATIONS
// ============================================================================

/**
 * Get enrollment by user and class
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getEnrollment = async (userId, classId) => {
  try {
    const q = query(
      collection(db, 'enrollments'),
      where('userId', '==', userId),
      where('classId', '==', classId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Enrollment not found' };
    }
    
    const doc = querySnapshot.docs[0];
    return { 
      success: true, 
      data: { docId: doc.id, ...doc.data() }
    };
  } catch (error) {
    logger.error('[EnrollmentsDbService] Error getting enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or update enrollment
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @param {Object} enrollmentData - Enrollment data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const setEnrollment = async (userId, classId, enrollmentData) => {
  try {
    const docRef = doc(db, 'enrollments', `${userId}_${classId}`);
    await setDoc(docRef, {
      userId,
      classId,
      ...enrollmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[EnrollmentsDbService] Error setting enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all enrollments for a class
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getClassEnrollments = async (classId) => {
  try {
    const q = query(
      collection(db, 'enrollments'),
      where('classId', '==', classId)
    );
    const querySnapshot = await getDocs(q);
    const enrollments = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: enrollments };
  } catch (error) {
    logger.error('[EnrollmentsDbService] Error getting class enrollments:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete enrollment
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteEnrollment = async (userId, classId) => {
  try {
    const docRef = doc(db, 'enrollments', `${userId}_${classId}`);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    logger.error('[EnrollmentsDbService] Error deleting enrollment:', error);
    return { success: false, error: error.message };
  }
};
