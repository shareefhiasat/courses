import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { 
  getAnnouncements as getAnnouncementsFromDb,
  createAnnouncement,
  updateAnnouncement as updateAnnouncementInDb,
  deleteAnnouncement as deleteAnnouncementFromDb
} from '../db/announcementDbService';
import logger from '@utils/logger';
import { withPerformanceMonitoring, memoize } from '@utils/performance';

/**
 * Announcement Service
 * Handles all Firebase operations for announcements
 * Extracted from activityService.js for better modularity
 */

/**
 * Get all announcements ordered by creation date - with performance monitoring and memoization
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAnnouncements = withPerformanceMonitoring(
  memoize(async () => {
    try {
      const result = await getAnnouncementsFromDb();
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      logger.error("Error getting announcements:", error);
      return { success: false, error: error.message };
    }
  }),
  'getAnnouncements'
);

/**
 * Add a new announcement
 * @param {Object} announcementData - Announcement data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const addAnnouncement = async (announcementData) => {
  try {
    const result = await createAnnouncement(announcementData);
    
    if (result.success) {
      // Log announcement creation (non-blocking)
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ANNOUNCEMENT_CREATED, {
          announcementId: result.id,
          announcementTitle: announcementData.title,
          target: announcementData.target,
          programId: announcementData.programId,
          subjectId: announcementData.subjectId,
          classId: announcementData.classId
        });
      } catch (logError) {
        logger.warn('Failed to log announcement creation:', logError);
      }
      
      return { success: true, id: result.id };
    }
    
    return { success: false, error: result.error };
  } catch (error) {
    logger.error("Error adding announcement:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing announcement
 * @param {string} id - Announcement document ID
 * @param {Object} announcementData - Updated announcement data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAnnouncement = async (id, announcementData) => {
  try {
    const result = await updateAnnouncementInDb(id, announcementData);
    
    if (result.success) {
      // Log announcement update
      try {
        await logActivity(ACTIVITY_LOG_TYPES.ANNOUNCEMENT_UPDATED, {
          announcementId: id,
          announcementTitle: announcementData.title
        });
      } catch (logError) {
        logger.warn('Failed to log announcement update:', logError);
      }
      
      return { success: true };
    }
    
    return { success: false, error: result.error };
  } catch (error) {
    logger.error("Error updating announcement:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete an announcement
 * @param {string} id - Announcement document ID
 * @param {Object} announcementData - Announcement data for logging (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAnnouncement = async (id, announcementData = null) => {
  try {
    const result = await deleteAnnouncementFromDb(id);
    
    if (result.success) {
      // Log announcement deletion
      if (announcementData) {
        try {
          await logActivity(ACTIVITY_LOG_TYPES.ANNOUNCEMENT_DELETED, {
            announcementId: id,
            announcementTitle: announcementData.title
          });
        } catch (logError) {
          logger.warn('Failed to log announcement deletion:', logError);
        }
      }
      
      return { success: true };
    }
    
    return { success: false, error: result.error };
  } catch (error) {
    logger.error("Error deleting announcement:", error);
    return { success: false, error: error.message };
  }
};

