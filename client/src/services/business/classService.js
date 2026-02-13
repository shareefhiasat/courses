import { db } from '../other/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';

/**
 * Class Service
 * Handles class/course management
 */

// Get all classes
export const getClasses = async () => {
  try {
    logger.info('CLASS: Fetching all classes');
    
    const qs = await getDocs(collection(db, "classes"));
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    
    logger.info('CLASS: Successfully fetched classes', { count: items.length });
    return { success: true, data: items };
  } catch (error) {
    logger.error('CLASS: Failed to fetch classes', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Add new class
export const addClass = async (data) => {
  try {
    logger.info('CLASS: Creating new class', { className: data.name, classCode: data.code });
    
    const ref = await addDoc(collection(db, "classes"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.CLASS_CREATED, {
        classId: ref.id,
        className: data.name,
        classCode: data.code
      });
    } catch (logError) {
      logger.warn('CLASS: Failed to log class creation:', logError);
    }
    
    logger.info('CLASS: Successfully created class', { classId: ref.id, className: data.name });
    return { success: true, id: ref.id };
  } catch (error) {
    logger.error('CLASS: Failed to create class', { error: error.message, classData: { name: data.name, code: data.code } });
    return { success: false, error: error.message };
  }
};

// Update class
export const updateClass = async (id, data) => {
  try {
    logger.info('CLASS: Updating class', { classId: id, updateFields: Object.keys(data) });
    
    await updateDoc(doc(db, "classes", id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.CLASS_UPDATED, {
        classId: id,
        updateFields: Object.keys(data)
      });
    } catch (logError) {
      logger.warn('CLASS: Failed to log class update:', logError);
    }
    
    logger.info('CLASS: Successfully updated class', { classId: id });
    return { success: true };
  } catch (error) {
    logger.error('CLASS: Failed to update class', { error: error.message, classId: id });
    return { success: false, error: error.message };
  }
};

// Delete class with cascade
export const deleteClass = async (id) => {
  try {
    logger.info('CLASS: Deleting class', { classId: id });
    
    // Cascade delete: enrollments, attendance, activities linked to this class
    const deletions = [];
    let deletedCount = 0;

    // Delete enrollments for this class
    const enrollmentQuery = query(collection(db, "enrollments"), where("classId", "==", id));
    const enrollmentSnap = await getDocs(enrollmentQuery);
    enrollmentSnap.docs.forEach((d) => {
      deletions.push(deleteDoc(doc(db, "enrollments", d.id)));
      deletedCount++;
    });

    // Delete attendance records for this class
    const attendanceQuery = query(collection(db, "attendance"), where("classId", "==", id));
    const attendanceSnap = await getDocs(attendanceQuery);
    attendanceSnap.docs.forEach((d) => {
      deletions.push(deleteDoc(doc(db, "attendance", d.id)));
      deletedCount++;
    });

    // Delete activities for this class
    const activityQuery = query(collection(db, "activities"), where("classId", "==", id));
    const activitySnap = await getDocs(activityQuery);
    activitySnap.docs.forEach((d) => {
      deletions.push(deleteDoc(doc(db, "activities", d.id)));
      deletedCount++;
    });

    await Promise.allSettled(deletions);
    await deleteDoc(doc(db, "classes", id));
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.CLASS_DELETED, {
        classId: id,
        cascadeDeletedCount: deletedCount
      });
    } catch (logError) {
      logger.warn('CLASS: Failed to log class deletion:', logError);
    }
    
    logger.info('CLASS: Successfully deleted class', { classId: id, cascadeDeletedCount: deletedCount });
    return { success: true };
  } catch (error) {
    logger.error('CLASS: Failed to delete class', { error: error.message, classId: id });
    return { success: false, error: error.message };
  }
};

// Get class by ID
export const getClassById = async (id) => {
  try {
    const classDoc = await getDoc(doc(db, "classes", id));
    if (classDoc.exists()) {
      return { success: true, data: { docId: classDoc.id, ...classDoc.data() } };
    }
    return { success: false, error: "Class not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update class schedule
 * @param {string} classId - Class ID
 * @param {Object} schedule - Schedule data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateClassSchedule = async (classId, schedule) => {
  try {
    await updateDoc(doc(db, 'classes', classId), {
      schedule: schedule,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating class schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all classes
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAllClasses = async () => {
  try {
    const classesSnap = await getDocs(collection(db, 'classes'));
    const data = classesSnap.docs.map(d => {
      const docData = d.data();
      const docId = d.id;
      return {
        ...docData,
        docId,
        id: docData?.id || docId
      };
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { success: false, error: error.message };
  }
};

// Alias for getClassById for consistency with other services
export const fetchClass = getClassById;
