/**
 * Course Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for course records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'courses'
 * 
 * @typedef {import('@types/index').Course} Course
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get all courses - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getCourses = async () => {
  try {
    const result = await dbService.getAll(COLLECTIONS.COURSES, {
      orderBy: {
        field: 'order',
        direction: 'asc'
      }
    });
    return result;
  } catch (error) {
    logger.error('[CourseDbService] Error getting courses:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get course by ID - with performance monitoring and memoization
 * @param {string} courseId - Course ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getCourse = async (courseId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.COURSES, courseId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Course not found' };
  } catch (error) {
    logger.error('[CourseDbService] Error getting course:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create course
 * @param {Object} courseData - Course data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const create = async (courseData, user = null) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.COURSES));
    const finalData = {
      ...courseData,
      ...getCreateAuditData(user || { uid: 'system' })
    };
    await setDoc(docRef, finalData);
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[CourseDbService] Error creating course:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update course
 * @param {string} courseId - Course ID
 * @param {Object} courseData - Updated course data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const update = async (courseId, courseData, user = null) => {
  try {
    const finalData = {
      ...courseData,
      ...getUpdateAuditData(user || { uid: 'system' })
    };
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.COURSES, courseId), finalData);
    return { success: true };
  } catch (error) {
    logger.error('[CourseDbService] Error updating course:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set/update course
 * @param {string} courseId - Course ID
 * @param {Object} courseData - Course data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setCourse = async (courseId, courseData) => {
  try {
    await setDoc(
      doc(dbService.getDb(), COLLECTIONS.COURSES, courseId),
      {
        ...courseData,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    logger.error('[CourseDbService] Error setting course:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete course
 * @param {string} courseId - Course ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCourse = async (courseId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.COURSES, courseId));
    return { success: true };
  } catch (error) {
    logger.error('[CourseDbService] Error deleting course:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active courses
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActiveCourses = async () => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.COURSES), 
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: courses };
  } catch (error) {
    logger.error('[CourseDbService] Error getting active courses:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get courses by program
 * @param {string} programId - Program ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getCoursesByProgram = async (programId) => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.COURSES), 
      where('programId', '==', programId),
      orderBy('order', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: courses };
  } catch (error) {
    logger.error('[CourseDbService] Error getting courses by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search courses
 * @param {string} searchTerm - Search term
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const searchCourses = async (searchTerm) => {
  try {
    // This would typically require a full-text search index
    // For now, get all courses and filter client-side
    const result = await getCourses();
    if (!result.success) {
      return result;
    }
    
    const filteredCourses = result.data.filter(course => 
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { success: true, data: filteredCourses };
  } catch (error) {
    logger.error('[CourseDbService] Error searching courses:', error);
    return { success: false, error: error.message };
  }
};
