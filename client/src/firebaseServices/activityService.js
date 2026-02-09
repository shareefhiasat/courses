import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "./config";
import { logActivity, ACTIVITY_TYPES } from './activityLogger';
import { deleteCollection, deleteDocumentsByField } from './collectionManagementService';
import { ACTIVITY_TYPE_OPTIONS } from '@constants/activityTypes';

// Convert date fields to timestamps for Firestore
const convertDatesToTimestamps = (data) => {
  const converted = { ...data };
  
  // Convert date fields to Firestore timestamps
  if (data.dueDate) {
    converted.dueDate = new Timestamp(data.dueDate);
  }
  if (data.startDate) {
    converted.startDate = new Timestamp(data.startDate);
  }
  if (data.endDate) {
    converted.endDate = new Timestamp(data.endDate);
  }
  
  return converted;
};

// Activities
export const getActivities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "activities"));
    const activities = [];
    querySnapshot.forEach((d) => {
      const activityData = { docId: d.id, ...d.data() };
      if (activityData.createdAt?.toDate) {
        activityData.createdAt = activityData.createdAt.toDate();
      }
      activities.push(activityData);
    });
    return { success: true, data: activities };
  } catch (error) {
    console.error("Error getting activities:", error);
    return { success: false, error: error.message };
  }
};

export const addActivity = async (activityData) => {
  try {
    const convertedData = convertDatesToTimestamps(activityData);
    const docRef = await addDoc(collection(db, "activities"), {
      ...convertedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Send notifications for new activity
    if (activityData.classId) {
      try {
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', activityData.classId)));
        const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
        
        for (const studentId of studentIds) {
          const { data: student } = await getUserById(studentId);
          if (student && student.email) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.ACTIVITY_NEW, {
              userId: studentId,
              role: 'student',
              classId: activityData.classId,
              title: 'New Activity Assigned',
              message: `A new activity "${activityData.title}" has been assigned to your class.`,
              type: RECORD_TYPES.ACTIVITY,
              email: student.email,
              templateId: 'activityNew',
              variables: {
                studentName: student.displayName || student.name || 'Student',
                activityTitle: activityData.title,
                dueDate: activityData.dueDate ? new Date(activityData.dueDate).toLocaleDateString() : 'N/A'
              }
            });
          }
        }
      } catch (notifyError) {
        console.warn('Failed to send activity notifications:', notifyError);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding activity:", error);
    return { success: false, error: error.message };
  }
};

export const updateActivity = async (id, activityData) => {
  try {
    const convertedData = convertDatesToTimestamps(activityData);
    await updateDoc(doc(db, "activities", id), {
      ...convertedData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating activity:", error);
    return { success: false, error: error.message };
  }
};

export const deleteActivity = async (id) => {
  try {
    await deleteDoc(doc(db, "activities", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting activity:", error);
    return { success: false, error: error.message };
  }
};

// Announcements
export const getAnnouncements = async () => {
  try {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const announcements = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      announcements.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate()
      });
    });
    return { success: true, data: announcements };
  } catch (error) {
    console.error("Error getting announcements:", error);
    return { success: false, error: error.message };
  }
};

export const addAnnouncement = async (announcementData) => {
  try {
    const docRef = await addDoc(collection(db, "announcements"), {
      ...announcementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Send notifications for new announcement
    if (announcementData.classId) {
      try {
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', announcementData.classId)));
        const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
        
        for (const studentId of studentIds) {
          const { data: student } = await getUserById(studentId);
          if (student && student.email) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW, {
              userId: studentId,
              role: 'student',
              classId: announcementData.classId,
              title: 'New Announcement',
              message: announcementData.title,
              type: 'announcement',
              email: student.email,
              templateId: 'announcementNew',
              variables: {
                studentName: student.displayName || student.name || 'Student',
                announcementTitle: announcementData.title,
                announcementContent: announcementData.content
              }
            });
          }
        }
      } catch (notifyError) {
        console.warn('Failed to send announcement notifications:', notifyError);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding announcement:", error);
    return { success: false, error: error.message };
  }
};

export const updateAnnouncement = async (id, announcementData) => {
  try {
    await updateDoc(doc(db, "announcements", id), announcementData);
    return { success: true };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: error.message };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    await deleteDoc(doc(db, "announcements", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: error.message };
  }
};

// Resources - Enhanced with filtering and pagination
export const getResources = async (filters = {}, pagination = {}) => {
  try {
    const {
      programId,
      subjectId, 
      classId,
      category,
      isPublic = null // null = all, true = public only, false = assigned only
    } = filters;
    
    const {
      limit = 100,
      offset = 0
    } = pagination;

    // Build query constraints
    const constraints = [orderBy("createdAt", "desc")];
    
    // Add filters
    if (programId) {
      constraints.push(where("programId", "==", programId));
    }
    if (subjectId) {
      constraints.push(where("subjectId", "==", subjectId));
    }
    if (classId) {
      constraints.push(where("classId", "==", classId));
    }
    if (category) {
      constraints.push(where("category", "==", category));
    }
    if (isPublic === true) {
      // Public resources have no program/subject/class assignments
      constraints.push(where("programId", "==", null));
      constraints.push(where("subjectId", "==", null));
      constraints.push(where("classId", "==", null));
    } else if (isPublic === false) {
      // Assigned resources have at least one assignment
      constraints.push(
        where("programId", "!=", null)
      );
    }

    const q = query(collection(db, "resources"), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const resources = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      resources.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });

    // Apply pagination in memory (Firestore doesn't support offset directly with complex queries)
    const startIndex = offset || 0;
    const endIndex = startIndex + (limit || resources.length);
    const paginatedResources = resources.slice(startIndex, endIndex);

    return { 
      success: true, 
      data: paginatedResources,
      total: resources.length, // Return total count for pagination UI
      hasMore: endIndex < resources.length
    };
  } catch (error) {
    console.error("Error getting resources:", error);
    return { success: false, error: error.message };
  }
};

// Get resource count for analytics dashboard (optimized for performance)
export const getResourceCount = async (filters = {}) => {
  try {
    const {
      programId,
      subjectId, 
      classId
    } = filters;

    // For counting, we need to query in parts due to Firestore limitations
    const constraints = [];
    
    // Add filters
    if (programId) {
      constraints.push(where("programId", "==", programId));
    }
    if (subjectId) {
      constraints.push(where("subjectId", "==", subjectId));
    }
    if (classId) {
      constraints.push(where("classId", "==", classId));
    }

    // If no filters, get total count
    if (constraints.length === 0) {
      const q = query(collection(db, "resources"));
      const querySnapshot = await getDocs(q);
      return { success: true, count: querySnapshot.size };
    }

    // With filters, apply them
    const q = query(collection(db, "resources"), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return { success: true, count: querySnapshot.size };
  } catch (error) {
    console.error("Error getting resource count:", error);
    return { success: false, error: error.message, count: 0 };
  }
};

// Legacy function for backward compatibility (gets all resources)
export const getAllResources = async () => {
  try {
    const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      resources.push({
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });
    return { success: true, data: resources };
  } catch (error) {
    console.error("Error getting all resources:", error);
    return { success: false, error: error.message };
  }
};

export const addResource = async (resourceData) => {
  try {
    const convertedData = convertDatesToTimestamps(resourceData);
    const docRef = await addDoc(collection(db, "resources"), {
      ...convertedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Send notifications for new resource
    if (resourceData.classId) {
      try {
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', resourceData.classId)));
        const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
        
        for (const studentId of studentIds) {
          const { data: student } = await getUserById(studentId);
          if (student && student.email) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.RESOURCE_NEW, {
              userId: studentId,
              role: 'student',
              classId: resourceData.classId,
              title: 'New Resource Available',
              message: `A new resource "${resourceData.title}" has been uploaded to your class.`,
              type: RECORD_TYPES.RESOURCE || 'resource',
              email: student.email,
              templateId: 'resourceNew',
              variables: {
                studentName: student.displayName || student.name || 'Student',
                resourceTitle: resourceData.title,
                resourceType: resourceData.type || 'document'
              }
            });
          }
        }
      } catch (notifyError) {
        console.warn('Failed to send resource notifications:', notifyError);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding resource:", error);
    return { success: false, error: error.message };
  }
};

export const updateResource = async (id, resourceData) => {
  try {
    const convertedData = convertDatesToTimestamps(resourceData);
    await updateDoc(doc(db, "resources", id), {
      ...convertedData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating resource:", error);
    return { success: false, error: error.message };
  }
};

export const deleteResource = async (id) => {
  try {
    await deleteDoc(doc(db, "resources", id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting resource:", error);
    return { success: false, error: error.message };
  }
};

// ===== ACTIVITY LOGS (Re-exports from activityLogger) =====

// Re-export activity logging functions from activityLogger for unified access
export { logActivity, ACTIVITY_TYPES };

// Legacy compatibility functions
export const addActivityLog = async (log = {}) => {
  return logActivity(log.type, log.metadata || {}, log.userId);
};

export const addLoginLog = async (log = {}) => {
  return logActivity(ACTIVITY_TYPES.LOGIN, log.metadata || {}, log.userId);
};

export const getLoginLogs = async () => {
  try {
    const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"));
    const qs = await getDocs(q);
    const items = [];
    qs.forEach((d) => items.push({ docId: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    console.error("Error getting login logs:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete all login logs from the activityLogs collection with progress tracking
 * @param {Function} onProgress - Progress callback (processed, total, percentage)
 * @returns {Promise<{success: boolean, deletedCount?: number, error?: string}>}
 */
export const deleteAllLoginLogs = async (onProgress = null) => {
  return await deleteCollection('activityLogs', onProgress, {
    batchSize: 400,
    delayBetweenBatches: 100,
    maxRetries: 3
  });
};

/**
 * Delete login logs by type with progress tracking
 * @param {string} logType - Type of logs to delete (e.g., 'login', 'logout', etc.)
 * @param {Function} onProgress - Progress callback (processed, total, percentage)
 * @returns {Promise<{success: boolean, deletedCount?: number, error?: string}>}
 */
export const deleteLoginLogsByType = async (logType, onProgress = null) => {
  return await deleteDocumentsByField('activityLogs', 'type', logType, onProgress);
};

// Get activity types from centralized constants
export const getActivityTypes = () => {
  return { success: true, data: ACTIVITY_TYPE_OPTIONS };
};
