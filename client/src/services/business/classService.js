import logger from '@utils/logger';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../other/config';
import { getClasses as getClassesFromDb, createClass as createClassToDb, updateClass as updateClassInDb, deleteClass as deleteClassFromDb, getClass as getClassByIdFromDb } from '../db/classDbService';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

/**
 * Class Service
 * Handles class/course management
 */

// Get all classes - with performance monitoring and memoization
export const getClasses = withPerformanceMonitoring(
  memoize(async () => {
    try {
      return await getClassesFromDb();
    } catch (error) {
      logger.error('CLASS: Failed to fetch classes', { error: error.message });
      return { success: false, error: error.message };
    }
  }),
  'getClasses'
);

// Add new class
export const addClass = async (data) => {
  try {
    logger.info('CLASS: Creating new class', { className: data.name, classCode: data.code });
    
    const result = await createClassToDb(data);
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.CLASS_CREATED, {
        classId: result.id,
        className: data.name,
        classCode: data.code
      });
    } catch (logError) {
      logger.warn('CLASS: Failed to log class creation:', logError);
    }
    
    logger.info('CLASS: Successfully created class', { classId: result.id, className: data.name });
    return result;
  } catch (error) {
    logger.error('CLASS: Failed to create class', { error: error.message, classData: { name: data.name, code: data.code } });
    return { success: false, error: error.message };
  }
};

// Update class
export const updateClass = async (id, data) => {
  try {
    logger.info('CLASS: Updating class', { classId: id, updateFields: Object.keys(data) });
    
    const result = await updateClassInDb(id, data);
    
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
    return result;
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
    const activityQuery = query(collection(db, RECORD_TYPES.ACTIVITY), where("classId", "==", id));
    const activitySnap = await getDocs(activityQuery);
    activitySnap.docs.forEach((d) => {
      deletions.push(deleteDoc(doc(db, RECORD_TYPES.ACTIVITY, d.id)));
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
    return await getClassByIdFromDb(id);
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
    logger.error('Error updating class schedule:', error);
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
    logger.error('Error fetching classes:', error);
    return { success: false, error: error.message };
  }
};

// Alias for getClassById for consistency with other services
export const fetchClass = getClassById;

