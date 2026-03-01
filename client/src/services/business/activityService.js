import { 
  getActivities as getActivitiesFromDb,
  createActivity as createActivityToDb,
  updateActivity as updateActivityInDb,
  deleteActivity as deleteActivityFromDb
} from '../db/activitiesDbService';
import { 
  getAnnouncements as getAnnouncementsFromDb,
  getAnnouncement as getAnnouncementFromDb,
  create as createAnnouncementToDb,
  update as updateAnnouncementInDb,
  deleteAnnouncement as deleteAnnouncementFromDb
} from '../db/announcementDbService';
import { 
  createResource as createResourceToDb,
  getResources as getResourcesFromDb,
  updateResource as updateResourceInDb,
  deleteResource as deleteResourceFromDb
} from '../db/resourceDbService';
import { 
  getLoginLogs as getLoginLogsFromDb,
  deleteAllActivityLogs as deleteAllActivityLogsFromDb
} from '../db/activityLogDbService';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { deleteCollection, deleteDocumentsByField } from './collectionManagementService';
import { ACTIVITY_TYPE_OPTIONS } from '@constants/activityTypes';
import { convertDatesToTimestamps, COMMON_DATE_FIELDS } from '@utils/date.js';
import { getUserById } from './userService';
import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS, RECORD_TYPES } from '@constants';
import logger from '@utils/logger';
import { handleServiceError, withRetry, measurePerformance, memoize, batchOperation } from '@utils/errorHandling';
import { validateEntity, validateBilingualField } from '@utils/validationHelpers';

const ACTIVITY_VALIDATION_RULES = [
  { field: 'type', required: true, type: 'string', label: 'Activity type' },
  { field: 'url', type: 'string', label: 'Activity URL' },
  { field: 'descriptionEn', type: 'string', label: 'Activity description' },
  { field: 'maxScore', type: 'number', positive: true, label: 'Max score' }
];
const validateActivityData = (data) => {
  logger.debug('[VALIDATION] Starting activity data validation');
  logger.debug('[VALIDATION] Data to validate:', JSON.stringify(data, null, 2));
  
  const bilingualErrors = validateBilingualField(data, 'title', 'Activity title');
  logger.debug('[VALIDATION] Bilingual field errors:', bilingualErrors);
  
  const entityErrors = validateEntity(data, ACTIVITY_VALIDATION_RULES);
  logger.debug('[VALIDATION] Entity validation errors:', entityErrors);
  
  const allErrors = [...bilingualErrors, ...entityErrors];
  logger.debug('[VALIDATION] All validation errors:', allErrors);
  
  return allErrors;
};

// Convert date fields to timestamps for Firestore using centralized utility

// Activities - with performance monitoring and error handling
export const getActivities = async () => {
  try {
    const result = await getActivitiesFromDb();
    return result;
  } catch (error) {
    logger.error('ACTIVITY: Failed to fetch activities', { error: error.message });
    return handleServiceError(error, { operation: 'getActivities' });
  }
};

export const addActivity = async (activityData, user) => {
  try {
    logger.info('ACTIVITY: Creating new activity', {
      title: activityData.titleEn,
      url: activityData.url,
      type: activityData.type,
      hasProgram: !!activityData.programId,
      hasSubject: !!activityData.subjectId,
      hasClass: !!activityData.classId
    });
    
    // Log the full activity data for debugging
    logger.debug('ACTIVITY: Full activity data being sent:', JSON.stringify(activityData, null, 2));
    
    // Validate input data
    const validationErrors = validateActivityData(activityData);
    if (validationErrors.length > 0) {
      logger.error('ACTIVITY: Validation failed with errors:', { errors: validationErrors, activityData });
      return { success: false, error: validationErrors.join(', ') };
    }
    
    logger.debug('[SERVICE] Processing activity data:', {
      title: activityData.title_en,
      url: activityData.url,
      type: activityData.type,
      hasProgram: !!activityData.programId,
      hasSubject: !!activityData.subjectId,
      hasClass: !!activityData.classId
    });
    
    const convertedData = activityData; // No date conversion - save as-is
    logger.debug('[SERVICE] Saving data directly without conversion');

    const result = await createActivityToDb(convertedData, user);

    if (!result.success) {
      logger.error('ACTIVITY: Database operation failed:', result.error);
      return { success: false, error: result.error };
    }

    logger.debug('[SERVICE] Activity saved to Firestore with ID:', result.id);

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

    return { success: true, id: result.id };
  } catch (error) {
    logger.error('ACTIVITY: Unexpected error in addActivity:', {
      message: error.message,
      stack: error.stack,
      activityData: JSON.stringify(activityData, null, 2)
    });
    return { success: false, error: error.message };
  }
};

export const updateActivity = async (id, activityData, user, emailOptions = { sendEmail: true }) => {
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
    
    // Validate input data
    const validationErrors = validateActivityData(activityData);
    if (validationErrors.length > 0) {
      logger.warn('ACTIVITY: Validation failed', { errors: validationErrors });
      return { success: false, error: validationErrors.join(', ') };
    }
    
    logger.debug('[SERVICE] updateActivity called with:', {
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
    logger.debug('[SERVICE] Saving data directly without conversion');

    const result = await updateActivityInDb(id, convertedData, user);

    // Send notifications for updated activity only if email is enabled
    if (activityData.classId && emailOptions.sendEmail) {
      try {
        // Use enrollment service to get students
        const { getStudentsByClass } = await import('./enrollmentService');
        const studentsResult = await getStudentsByClass(activityData.classId);
        
        if (studentsResult.success) {
          for (const student of studentsResult.data) {
            if (student.email) {
              await notificationGateway.send(NOTIFICATION_TRIGGERS.ACTIVITY_UPDATED, {
                userId: student.id,
                role: 'student',
                classId: activityData.classId,
                title: 'Activity Updated',
                message: `Activity "${activityData.titleEn || activityData.title}" has been updated.`,
                email: student.email,
                activityId: id,
                type: activityData.type,
                variables: {
                  activityTitle: activityData.titleEn || activityData.title,
                  activityType: activityData.type,
                  dueDate: activityData.dueDate,
                  classId: activityData.classId
                }
              });
            }
          }
        }
      } catch (notificationError) {
        logger.warn('Failed to send notifications for activity update:', notificationError);
      }
    }

    return result;
  } catch (error) {
    logger.error("Error updating activity:", error);
    return { success: false, error: error.message };
  }
};

export const deleteActivity = async (id, activityData = null) => {
  try {
    logger.info('ACTIVITY: Deleting activity', { activityId: id, hasActivityData: !!activityData });
    
    const result = await deleteActivityFromDb(id);
    
    // Log activity deletion if activity data is provided
    if (activityData && result.success) {
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ACTIVITY_DELETED, {
          activityId: id,
          activityTitle: activityData.titleEn || activityData.title,
          activityType: activityData.type
        });
      } catch (logError) {
        logger.warn('Failed to log activity deletion:', logError);
      }
    }
    
    logger.info('ACTIVITY: Successfully deleted activity', { activityId: id });
    return result;
  } catch (error) {
    logger.error('ACTIVITY: Failed to delete activity', { error: error.message, activityId: id });
    logger.error("Error deleting activity:", error);
    return { success: false, error: error.message };
  }
};

// Announcements
export const getAnnouncements = async () => {
  try {
    const result = await getAnnouncementsFromDb();
    return result;
  } catch (error) {
    logger.error('ANNOUNCEMENT: Failed to fetch announcements', { error: error.message });
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
        // Use enrollment service to get students
        const { getStudentsByClass } = await import('./enrollmentService');
        const studentsResult = await getStudentsByClass(announcementData.classId);
        
        if (studentsResult.success) {
          for (const student of studentsResult.data) {
            if (student.email) {
              await notificationGateway.send(NOTIFICATION_TRIGGERS.ANNOUNCEMENT_NEW, {
                userId: student.id,
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
        }
      } catch (notifyError) {
        logger.warn('Failed to send announcement notifications:', notifyError);
      }
    }

    return { success: true, id: result.id };
  } catch (error) {
    logger.error("Error adding announcement:", error);
    return { success: false, error: error.message };
  }
};

export const updateAnnouncement = async (id, announcementData, emailOptions = { sendEmail: true }) => {
  try {
    // Use database service to update announcement
    const updateData = {
      ...announcementData,
      updatedAt: new Date()
    };
    
    const result = await updateAnnouncementInDb(id, updateData);

    // Send notifications for updated announcement only if email is enabled
    if (announcementData.classId && emailOptions.sendEmail) {
      try {
        // Use enrollment service to get students
        const { getStudentsByClass } = await import('./enrollmentService');
        const studentsResult = await getStudentsByClass(announcementData.classId);
        
        if (studentsResult.success) {
          for (const student of studentsResult.data) {
            if (student.email) {
              await notificationGateway.send(NOTIFICATION_TRIGGERS.ANNOUNCEMENT_UPDATED, {
                userId: student.id,
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
        }
      } catch (notificationError) {
        logger.warn('Failed to send notifications for announcement update:', notificationError);
      }
    }

    return result;
  } catch (error) {
    logger.error("Error updating announcement:", error);
    return { success: false, error: error.message };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    // Use database service to delete announcement
    const result = await deleteAnnouncementFromDb(id);
    return result;
  } catch (error) {
    logger.error("Error deleting announcement:", error);
    return { success: false, error: error.message };
  }
};

// Resources - Enhanced with filtering and pagination
export const getResources = async (filters = {}, pagination = {}) => {
  try {
    // Use database service to get resources with filters
    const result = await getResourcesFromDb(filters);
    
    if (!result.success) {
      return result;
    }
    
    const {
      limit = 100,
      offset = 0
    } = pagination;

    // Apply pagination in memory
    const resources = result.data || [];
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
    // Use database service to get resource count
    const result = await getResourcesFromDb(filters);
    
    if (!result.success) {
      return { success: false, error: result.error, count: 0 };
    }
    
    return { success: true, count: (result.data || []).length };
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
    const convertedData = convertDatesToTimestamps(resourceData, COMMON_DATE_FIELDS.resources || ['dueDate'], new Date());
    const resourceWithTimestamps = {
      ...convertedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await createResourceToDb(resourceWithTimestamps);

    // Send notifications for new resource
    if (resourceData.classId) {
      try {
        // Use enrollment service to get students
        const { getStudentsByClass } = await import('./enrollmentService');
        const studentsResult = await getStudentsByClass(resourceData.classId);
        
        if (studentsResult.success) {
          for (const student of studentsResult.data) {
            if (student.email) {
              await notificationGateway.send(NOTIFICATION_TRIGGERS.RESOURCE_NEW, {
                userId: student.id,
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
        }
      } catch (notifyError) {
        logger.warn('Failed to send resource notifications:', notifyError);
      }
    }

    return { success: true, id: result.id };
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
    
    const convertedData = convertDatesToTimestamps(resourceData, COMMON_DATE_FIELDS.resources || ['dueDate'], new Date());
    const updateData = {
      ...convertedData,
      updatedAt: new Date()
    };
    
    // Use database service to update resource
    const result = await updateResourceInDb(id, updateData);

    // Send notifications for updated resource only if email is enabled
    if (resourceData.classId && emailOptions.sendEmail) {
      try {
        // Use enrollment service to get students
        const { getStudentsByClass } = await import('./enrollmentService');
        const studentsResult = await getStudentsByClass(resourceData.classId);
        
        if (studentsResult.success) {
          for (const student of studentsResult.data) {
            if (student.email) {
              await notificationGateway.send(NOTIFICATION_TRIGGERS.RESOURCE_UPDATED, {
                userId: student.id,
                role: 'student',
                classId: resourceData.classId,
                title: 'Resource Updated',
                message: `Resource "${resourceData.titleEn || resourceData.title}" has been updated.`,
                email: student.email,
                resourceId: id,
                url: resourceData.url,
                variables: {
                  resourceTitle: resourceData.titleEn || resourceData.title,
                  resourceUrl: resourceData.url,
                  resourceDescription: resourceData.descriptionEn || resourceData.description,
                  classId: resourceData.classId
                }
              });
            }
          }
        }
      } catch (notificationError) {
        logger.warn('Failed to send notifications for resource update:', notificationError);
      }
    }

    return result;
  } catch (error) {
    logger.error("Error updating resource:", error);
    return { success: false, error: error.message };
  }
};

export const deleteResource = async (id) => {
  try {
    // Use database service to delete resource
    const result = await deleteResourceFromDb(id);
    return result;
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
  const { userId, metadata = {} } = log;
  return logActivity(ACTIVITY_LOG_TYPES.LOGIN, metadata, userId);
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

