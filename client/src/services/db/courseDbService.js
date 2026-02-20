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
 * Get all courses - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getCourses = async () => {
  try {
    const q = query(collection(db, 'courses'), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: courses };
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
    const docSnap = await getDoc(doc(db, 'courses', courseId));
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
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createCourse = async (courseData) => {
  try {
    const docRef = doc(collection(db, 'courses'));
    await setDoc(docRef, {
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateCourse = async (courseId, courseData) => {
  try {
    await updateDoc(doc(db, 'courses', courseId), {
      ...courseData,
      updatedAt: serverTimestamp()
    });
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
      doc(db, 'courses', courseId),
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
    await deleteDoc(doc(db, 'courses', courseId));
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
      collection(db, 'courses'), 
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
      collection(db, 'courses'), 
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
