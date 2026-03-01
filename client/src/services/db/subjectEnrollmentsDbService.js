/**
 * Subject Enrollments Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for subject enrollment records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'subjectEnrollments'
 * 
 * @typedef {import('@types/index').SubjectEnrollment} SubjectEnrollment
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
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import { COLLECTIONS } from '@constants/collections';
import logger from '@utils/logger';

/**
 * Get subject enrollments with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getSubjectEnrollments = async (filters = {}) => {
  try {
    const { subjectId, studentId, semester, academicYear, status } = filters;
    
    let q = collection(dbService.getDb(), COLLECTIONS.SUBJECT_ENROLLMENTS);
    
    // Add filters
    if (subjectId) q = query(q, where('subjectId', '==', subjectId));
    if (studentId) q = query(q, where('studentId', '==', studentId));
    if (semester) q = query(q, where('semester', '==', semester));
    if (academicYear) q = query(q, where('academicYear', '==', academicYear));
    if (status) q = query(q, where('status', '==', status));
    
    // Add ordering
    q = query(q, orderBy('enrolledAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const enrollments = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: enrollments };
  } catch (error) {
    // Check if this is a missing collection error
    if (error.message.includes('Missing or insufficient permissions') || 
        error.code === 'permission-denied' ||
        error.message.includes('No document to update')) {
      logger.warn('[SubjectEnrollmentsDbService] SubjectEnrollments collection not available:', { error: error.message });
      return {
        success: true,
        data: []
      };
    }
    
    logger.error('[SubjectEnrollmentsDbService] Error getting subject enrollments:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get subject enrollment by ID
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getSubjectEnrollment = async (enrollmentId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.SUBJECT_ENROLLMENTS, enrollmentId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Subject enrollment not found' };
  } catch (error) {
    logger.error('[SubjectEnrollmentsDbService] Error getting subject enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create subject enrollment
 * @param {Object} enrollmentData - Enrollment data
 * @param {Object} auditData - Audit data from getCreateAuditData
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createSubjectEnrollment = async (enrollmentData, auditData = null) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.SUBJECT_ENROLLMENTS));
    const finalData = {
      ...enrollmentData,
      ...(auditData || {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    };
    await setDoc(docRef, finalData);
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[SubjectEnrollmentsDbService] Error creating subject enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add student to subject (convenience function)
 * @param {Object} enrollmentData - Enrollment data
 * @param {Object} auditData - Audit data from getCreateAuditData
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const enrollStudentInSubject = async (enrollmentData, auditData = null) => {
  try {
    const docRef = await addDoc(collection(dbService.getDb(), COLLECTIONS.SUBJECT_ENROLLMENTS), {
      ...enrollmentData,
      ...(auditData || {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[SubjectEnrollmentsDbService] Error enrolling student in subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update subject enrollment
 * @param {string} enrollmentId - Enrollment ID
 * @param {Object} enrollmentData - Updated enrollment data
 * @param {Object} auditData - Audit data from getUpdateAuditData
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSubjectEnrollment = async (enrollmentId, enrollmentData, auditData = null) => {
  try {
    const finalData = {
      ...enrollmentData,
      ...(auditData || {
        updatedAt: serverTimestamp()
      })
    };
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.SUBJECT_ENROLLMENTS, enrollmentId), finalData);
    return { success: true };
  } catch (error) {
    logger.error('[SubjectEnrollmentsDbService] Error updating subject enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete subject enrollment
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteSubjectEnrollment = async (enrollmentId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.SUBJECT_ENROLLMENTS, enrollmentId));
    return { success: true };
  } catch (error) {
    logger.error('[SubjectEnrollmentsDbService] Error deleting subject enrollment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get enrollments by subject
 * @param {string} subjectId - Subject ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getEnrollmentsBySubject = async (subjectId) => {
  return await getSubjectEnrollments({ subjectId });
};

/**
 * Get enrollments by student
 * @param {string} studentId - Student ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getEnrollmentsByStudent = async (studentId) => {
  return await getSubjectEnrollments({ studentId });
};
