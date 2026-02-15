import { db } from '../other/config';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import logger from '@utils/logger';
import { 
  getCourses as getCoursesFromDb,
  getCourse as getCourseFromDb,
  createCourse as createCourseToDb,
  updateCourse as updateCourseInDb,
  setCourse as setCourseToDb,
  deleteCourse as deleteCourseFromDb,
  getActiveCourses as getActiveCoursesFromDb,
  getCoursesByProgram as getCoursesByProgramFromDb,
  searchCourses as searchCoursesFromDb
} from '../db/courseDbService';

/**
 * Course Service
 * Handles course/program management (for dynamic course list)
 */

// Get all courses
export const getCourses = async () => {
  try {
    return await getCoursesFromDb();
  } catch (error) {
    logger.error('Error getting courses:', error);
    return { success: false, error: error.message };
  }
};

// Set/update course
export const setCourse = async (courseId, data) => {
  try {
    return await setCourseToDb(courseId, data);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete course
export const deleteCourse = async (courseId) => {
  try {
    await deleteDoc(doc(db, "courses", courseId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get course by ID
export const getCourseById = async (courseId) => {
  try {
    const courseDoc = await getDoc(doc(db, "courses", courseId));
    if (courseDoc.exists()) {
      return { success: true, data: { docId: courseDoc.id, ...courseDoc.data() } };
    }
    return { success: false, error: "Course not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

