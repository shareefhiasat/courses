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

/**
 * Course Service
 * Handles course/program management (for dynamic course list)
 */

// Get all courses
export const getCourses = async () => {
  try {
    const q = query(collection(db, "courses"), orderBy("order", "asc"));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Set/update course
export const setCourse = async (courseId, data) => {
  try {
    await setDoc(doc(db, "courses", courseId), data, { merge: true });
    return { success: true };
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
