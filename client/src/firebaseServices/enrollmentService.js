import { db } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp, 
  arrayUnion, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Enrollment Service
 * Handles student/instructor enrollment management
 */

// Get all enrollments
export const getEnrollments = async () => {
  try {
    const qs = await getDocs(collection(db, "enrollments"));
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add new enrollment
export const addEnrollment = async (data) => {
  try {
    const { userId, classId } = data || {};
    if (!userId || !classId)
      return { success: false, error: "userId and classId are required" };
    const detId = `${userId}_${classId}`;
    // Write deterministic enrollment doc
    await setDoc(
      doc(db, "enrollments", detId),
      { ...data, createdAt: Timestamp.now() },
      { merge: true }
    );
    // Keep users/{uid}.enrolledClasses in sync
    try {
      await updateDoc(doc(db, "users", userId), {
        enrolledClasses: arrayUnion(classId),
      });
    } catch {}

    // Update student progress
    try {
      const progressRef = doc(db, "studentProgress", userId);
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        await updateDoc(progressRef, {
          enrolledClasses: increment(1),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn("Failed to update student progress:", e);
    }

    return { success: true, id: detId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete enrollment
export const deleteEnrollment = async (id) => {
  try {
    const enrollmentDoc = await getDoc(doc(db, "enrollments", id));
    if (enrollmentDoc.exists()) {
      const enrollmentData = enrollmentDoc.data();
      const userId = enrollmentData.userId;
      const classId = enrollmentData.classId;

      // Cascade delete: attendance records for this enrollment
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("studentId", "==", userId),
        where("classId", "==", classId)
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const attendanceDeletions = attendanceSnap.docs.map((d) =>
        deleteDoc(doc(db, "attendance", d.id))
      );
      await Promise.allSettled(attendanceDeletions);
    }

    await deleteDoc(doc(db, "enrollments", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get enrollments by user ID
export const getEnrollmentsByUser = async (userId) => {
  try {
    const q = query(collection(db, "enrollments"), where("userId", "==", userId));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get enrollments by class ID
export const getEnrollmentsByClass = async (classId) => {
  try {
    const q = query(collection(db, "enrollments"), where("classId", "==", classId));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get students enrolled in a class with their user data
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getStudentsByClass = async (classId) => {
  try {
    // Get enrollments for this class
    const q = query(collection(db, "enrollments"), where("classId", "==", classId));
    const enrollmentsSnap = await getDocs(q);
    const enrollmentIds = enrollmentsSnap.docs.map(d => d.data().userId).filter(Boolean);
    
    if (enrollmentIds.length === 0) {
      return { success: true, data: [] };
    }
    
    // Fetch user data for all enrolled students
    const studentsData = await Promise.all(
      enrollmentIds.map(async (studentId) => {
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          return { id: studentId, ...data, displayName: data.displayName || data.email };
        }
        return null;
      })
    );
    
    // Filter out null values
    const students = studentsData.filter(Boolean);
    return { success: true, data: students };
  } catch (error) {
    console.error('Error fetching students by class:', error);
    return { success: false, error: error.message };
  }
};
