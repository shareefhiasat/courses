import { 
  getActivities as getActivitiesFromDb,
  createActivity as createActivityToDb,
  updateActivity as updateActivityInDb,
  deleteActivity as deleteActivityFromDb
} from '../db/activitiesDbService';
import { 
  getAnnouncements as getAnnouncementsFromDb,
  getAnnouncement as getAnnouncementFromDb,
  createAnnouncement as createAnnouncementToDb,
  updateAnnouncement as updateAnnouncementInDb,
  deleteAnnouncement as deleteAnnouncementFromDb,
  getAnnouncementsByClass as getAnnouncementsByClassFromDb,
  getAnnouncementsByProgram as getAnnouncementsByProgramFromDb,
  getActiveAnnouncements as getActiveAnnouncementsFromDb,
  searchAnnouncements as searchAnnouncementsFromDb
} from '../db/announcementDbService';
import { 
  getResources as getResourcesFromDb,
  getResource as getResourceFromDb,
  createResource as createResourceToDb,
  updateResource as updateResourceInDb,
  deleteResource as deleteResourceFromDb,
  getResourcesByClass as getResourcesByClassFromDb,
  getResourcesBySubject as getResourcesBySubjectFromDb,
  getResourcesByType as getResourcesByTypeFromDb,
  searchResources as searchResourcesFromDb,
  getResourceCount as getResourceCountFromDb
} from '../db/resourceDbService';
import { 
  getActivityLogs as getActivityLogsFromDb,
  getActivityLog as getActivityLogFromDb,
  createActivityLog as createActivityLogToDb,
  getActivityLogsByUser as getActivityLogsByUserFromDb,
  getActivityLogsByType as getActivityLogsByTypeFromDb,
  getActivityLogsByDateRange as getActivityLogsByDateRangeFromDb,
  getLoginLogs as getLoginLogsFromDb,
  deleteActivityLog as deleteActivityLogFromDb,
  deleteAllActivityLogs as deleteAllActivityLogsFromDb,
  searchActivityLogs as searchActivityLogsFromDb
} from '../db/activityLogDbService';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { deleteCollection, deleteDocumentsByField } from './collectionManagementService';
import { ACTIVITY_TYPE_OPTIONS } from '@constants/activityTypes';
import { convertDatesToTimestamps, COMMON_DATE_FIELDS } from '@utils/date.js';
import { getUserById } from './userService';
import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS, RECORD_TYPES } from '@constants';
import logger from '@utils/logger';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '../other/config';

// Convert date fields to timestamps for Firestore using centralized utility

// Activities
export const getActivities = async () => {
  try {
    logger.info('ACTIVITY: Fetching all activities');
    
    const result = await getActivitiesFromDb();
    if (result.success) {
      logger.info('ACTIVITY: Successfully fetched activities', { count: result.data.length });
    }
    return result;
  } catch (error) {
    logger.error('ACTIVITY: Failed to fetch activities', { error: error.message });
    logger.error("Error getting activities:", error);
    return { success: false, error: error.message };
  }
};

export const addActivity = async (activityData) => {
  const maxRetries = 3;
  let lastError;
  
  logger.info('ACTIVITY: Creating new activity', {
    title: activityData.title_en,
    url: activityData.url,
    type: activityData.type,
    hasProgram: !!activityData.programId,
    hasSubject: !!activityData.subjectId,
    hasClass: !!activityData.classId
  });
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log(`🔍 [SERVICE] addActivity called (attempt ${attempt}/${maxRetries}):`, {
        title: activityData.title_en,
        url: activityData.url,
        type: activityData.type,
        hasProgram: !!activityData.programId,
        hasSubject: !!activityData.subjectId,
        hasClass: !!activityData.classId
      });
      
      const convertedData = activityData; // No date conversion - save as-is
      logger.log('🔍 [SERVICE] Saving data directly without conversion');
      
      // Add a small delay for retries
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const activityDataWithTimestamps = {
        ...convertedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const result = await createActivityToDb(activityDataWithTimestamps);

      logger.log('🔍 [SERVICE] Activity saved to Firestore with ID:', result.id);

      // TODO: Fix notification gateway - temporarily disabled
      // Send notifications for new activity
      // if (activityData.classId) {
      //   try {
      //     const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', activityData.classId)));
      //     const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
          
      //     for (const studentId of studentIds) {
      //       const { data: student } = await getUserById(studentId);
      //       if (student && student.email) {
      //         await notificationGateway.send(NOTIFICATION_TRIGGERS.ACTIVITY_NEW, {
      //           userId: studentId,
      //           role: 'student',
      //           classId: activityData.classId,
      //           title: 'New Activity Assigned',
      //           message: `A new activity "${activityData.title}" has been assigned to your class.`,
      //           type: RECORD_TYPES.ACTIVITY,
      //           email: student.email,
      //           templateId: 'activityNew',
      //           variables: {
      //             studentName: student.displayName || student.name || 'Student',
      //             activityTitle: activityData.title,
      //             dueDate: activityData.dueDate ? new Date(activityData.dueDate).toLocaleDateString() : 'N/A'
      //           }
      //         });
      //       }
      //     }
      //   } catch (notifyError) {
      //     logger.warn('Failed to send activity notifications:', notifyError);
      //   }
      // }

      return { success: true, id: docRef.id };
    } catch (error) {
      lastError = error;
      logger.error(`🔍 [SERVICE] Error in addActivity (attempt ${attempt}/${maxRetries}):`, error);
      logger.error('🔍 [SERVICE] Error details:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      // Check if it's a network error that might be worth retrying
      const isNetworkError = error.message.includes('WebChannel') || 
                            error.message.includes('network') ||
                            error.code === 'unavailable' ||
                            error.code === 'deadline-exceeded';
      
      if (isNetworkError && attempt < maxRetries) {
        logger.log(`🔍 [SERVICE] Network error detected, retrying... (${attempt}/${maxRetries})`);
        continue;
      }
      
      // If it's the last attempt or not a network error, break
      if (attempt === maxRetries || !isNetworkError) {
        break;
      }
    }
  }
  
  // If we get here, all attempts failed
  logger.error('🔍 [SERVICE] All retry attempts failed');
  return { success: false, error: lastError?.message || 'Failed to save activity after multiple attempts' };
};

export const updateActivity = async (id, activityData, emailOptions = { sendEmail: true }) => {
  try {
    logger.info('ACTIVITY: Updating activity', {
      activityId: id,
      title: activityData.title_en,
      url: activityData.url,
      type: activityData.type,
      hasDates: {
        dueDate: !!activityData.dueDate,
        startDate: !!activityData.startDate,
        endDate: !!activityData.endDate
      }
    });
    
    logger.log('🔍 [SERVICE] updateActivity called with:', {
      id,
      title: activityData.title_en,
      url: activityData.url,
      type: activityData.type,
      hasDates: {
        dueDate: !!activityData.dueDate,
        startDate: !!activityData.startDate,
        endDate: !!activityData.endDate
      }
    });
    
    const convertedData = activityData; // No date conversion - save as-is
    logger.log('🔍 [SERVICE] Saving data directly without conversion');
    
    await updateDoc(doc(db, RECORD_TYPES.ACTIVITY, id), {
      ...convertedData,
      updatedAt: serverTimestamp()
    });

    // Send notifications for updated activity only if email is enabled
    if (activityData.classId && emailOptions.sendEmail) {
      try {
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', activityData.classId)));
        const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
        
        for (const studentId of studentIds) {
          const { data: student } = await getUserById(studentId);
          if (student && student.email) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.ACTIVITY_UPDATED, {
              userId: studentId,
              role: 'student',
              classId: activityData.classId,
              title: 'Activity Updated',
              message: `Activity "${activityData.title_en || activityData.title}" has been updated.`,
              email: student.email,
              activityId: id,
              type: activityData.type,
              variables: {
                activityTitle: activityData.title_en || activityData.title,
                activityType: activityData.type,
                dueDate: activityData.dueDate,
                classId: activityData.classId
              }
            });
          }
        }
      } catch (notificationError) {
        logger.warn('Failed to send notifications for activity update:', notificationError);
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Error updating activity:", error);
    return { success: false, error: error.message };
  }
};

export const deleteActivity = async (id, activityData = null) => {
  try {
    logger.info('ACTIVITY: Deleting activity', { activityId: id, hasActivityData: !!activityData });
    
    await deleteDoc(doc(db, RECORD_TYPES.ACTIVITY, id));
    
    // Log activity deletion if activity data is provided
    if (activityData) {
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ACTIVITY_DELETED, {
          activityId: id,
          activityTitle: activityData.title_en || activityData.title,
          activityType: activityData.type
        });
      } catch (logError) {
        logger.warn('Failed to log activity deletion:', logError);
      }
    }
    
    logger.info('ACTIVITY: Successfully deleted activity', { activityId: id });
    return { success: true };
  } catch (error) {
    logger.error('ACTIVITY: Failed to delete activity', { error: error.message, activityId: id });
    logger.error("Error deleting activity:", error);
    return { success: false, error: error.message };
  }
};

// Announcements
export const getAnnouncements = async () => {
  try {
    logger.info('ANNOUNCEMENT: Fetching all announcements');
    
    const result = await getAnnouncementsFromDb();
    console.log('🔍 DEBUG: Raw announcements result from DB:', result);
    
    if (result.success) {
      logger.info('ANNOUNCEMENT: Successfully fetched announcements', { count: result.data.length });
      console.log('🔍 DEBUG: Announcements data:', result.data);
      console.log('🔍 DEBUG: Announcements count:', result.data.length);
      console.log('🔍 DEBUG: First announcement sample:', result.data[0]);
    } else {
      console.log('🔍 DEBUG: Failed to fetch announcements:', result.error);
    }
    return result;
  } catch (error) {
    logger.error('ANNOUNCEMENT: Failed to fetch announcements', { error: error.message });
    console.log('🔍 DEBUG: Exception in getAnnouncements:', error);
    logger.error("Error getting announcements:", error);
    return { success: false, error: error.message };
  }
};

export const addAnnouncement = async (announcementData) => {
  try {
    logger.info('ANNOUNCEMENT: Creating new announcement', {
      title: announcementData.title,
      hasClassId: !!announcementData.classId,
      hasProgramId: !!announcementData.programId,
      hasSubjectId: !!announcementData.subjectId
    });
    
    const result = await createAnnouncementToDb(announcementData);
    
    // Log activity
    try {
      await logActivity(ACTIVITY_LOG_TYPES.ANNOUNCEMENT_CREATED, {
        announcementId: result.id,
        title: announcementData.title,
        classId: announcementData.classId
      });
    } catch (logError) {
      logger.warn('ANNOUNCEMENT: Failed to log announcement creation:', logError);
    }

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
        logger.warn('Failed to send announcement notifications:', notifyError);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error("Error adding announcement:", error);
    return { success: false, error: error.message };
  }
};

export const updateAnnouncement = async (id, announcementData, emailOptions = { sendEmail: true }) => {
  try {
    await updateDoc(doc(db, "announcements", id), {
      ...announcementData,
      updatedAt: serverTimestamp()
    });

    // Send notifications for updated announcement only if email is enabled
    if (announcementData.classId && emailOptions.sendEmail) {
      try {
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', announcementData.classId)));
        const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
        
        for (const studentId of studentIds) {
          const { data: student } = await getUserById(studentId);
          if (student && student.email) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.ANNOUNCEMENT_UPDATED, {
              userId: studentId,
              role: 'student',
              classId: announcementData.classId,
              title: 'Announcement Updated',
              message: announcementData.title,
              email: student.email,
              announcementId: id,
              variables: {
                announcementTitle: announcementData.title,
                announcementContent: announcementData.content,
                classId: announcementData.classId
              }
            });
          }
        }
      } catch (notificationError) {
        logger.warn('Failed to send notifications for announcement update:', notificationError);
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Error updating announcement:", error);
    return { success: false, error: error.message };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    await deleteDoc(doc(db, "announcements", id));
    return { success: true };
  } catch (error) {
    logger.error("Error deleting announcement:", error);
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
    logger.error("Error getting resources:", error);
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
    logger.error("Error getting resource count:", error);
    return { success: false, error: error.message, count: 0 };
  }
};

// Legacy function for backward compatibility (gets all resources)
export const getAllResources = async () => {
  try {
    return await getResourcesFromDb();
  } catch (error) {
    logger.error("Error getting all resources:", error);
    return { success: false, error: error.message };
  }
};

export const addResource = async (resourceData) => {
  try {
    const convertedData = convertDatesToTimestamps(resourceData, COMMON_DATE_FIELDS.resources || ['dueDate'], Timestamp);
    const resourceWithTimestamps = {
      ...convertedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const result = await createResourceToDb(resourceWithTimestamps);

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
        logger.warn('Failed to send resource notifications:', notifyError);
      }
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error("Error adding resource:", error);
    return { success: false, error: error.message };
  }
};

export const updateResource = async (id, resourceData, emailOptions = { sendEmail: true }) => {
  try {
    if (!id) {
      throw new Error('Resource ID is required for update');
    }
    
    const convertedData = convertDatesToTimestamps(resourceData, COMMON_DATE_FIELDS.resources || ['dueDate'], Timestamp);
    await updateDoc(doc(db, "resources", id), {
      ...convertedData,
      updatedAt: serverTimestamp()
    });

    // Send notifications for updated resource only if email is enabled
    if (resourceData.classId && emailOptions.sendEmail) {
      try {
        const enrollmentsSnap = await getDocs(query(collection(db, 'enrollments'), where('classId', '==', resourceData.classId)));
        const studentIds = enrollmentsSnap.docs.map(d => d.data().userId);
        
        for (const studentId of studentIds) {
          const { data: student } = await getUserById(studentId);
          if (student && student.email) {
            await notificationGateway.send(NOTIFICATION_TRIGGERS.RESOURCE_UPDATED, {
              userId: studentId,
              role: 'student',
              classId: resourceData.classId,
              title: 'Resource Updated',
              message: `Resource "${resourceData.title_en || resourceData.title}" has been updated.`,
              email: student.email,
              resourceId: id,
              url: resourceData.url,
              variables: {
                resourceTitle: resourceData.title_en || resourceData.title,
                resourceUrl: resourceData.url,
                resourceDescription: resourceData.description_en || resourceData.description,
                classId: resourceData.classId
              }
            });
          }
        }
      } catch (notificationError) {
        logger.warn('Failed to send notifications for resource update:', notificationError);
      }
    }

    return { success: true };
  } catch (error) {
    logger.error("Error updating resource:", error);
    return { success: false, error: error.message };
  }
};

export const deleteResource = async (id) => {
  try {
    await deleteDoc(doc(db, "resources", id));
    return { success: true };
  } catch (error) {
    logger.error("Error deleting resource:", error);
    return { success: false, error: error.message };
  }
};

// ===== ACTIVITY LOGS (Re-exports from activityLogger) =====

// Re-export activity logging functions from activityLogger for unified access
export { logActivity, ACTIVITY_LOG_TYPES };

// Legacy compatibility functions
export const addActivityLog = async (log = {}) => {
  return logActivity(log.type, log.metadata || {}, log.userId);
};

export const addLoginLog = async (log = {}) => {
  return logActivity(ACTIVITY_LOG_TYPES.LOGIN, log.metadata || {}, log.userId);
};

export const getLoginLogs = async () => {
  try {
    return await getLoginLogsFromDb();
  } catch (error) {
    logger.error("Error getting login logs:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete all login logs from the activityLogs collection with progress tracking
 * @param {Function} onProgress - Progress callback (processed, total, percentage)
 * @returns {Promise<{success: boolean, deletedCount?: number, error?: string}>}
 */
export const deleteAllLoginLogs = async (onProgress = null) => {
  try {
    return await deleteAllActivityLogsFromDb({
      batchSize: 400,
      delayBetweenBatches: 100,
      maxRetries: 3,
      onProgress
    });
  } catch (error) {
    logger.error('Error deleting all login logs:', error);
    return { success: false, error: error.message };
  }
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

