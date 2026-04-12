/**
 * Announcements Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for announcement operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getAnnouncements, 
  getAnnouncementById as getAnnouncementByIdFromDb, 
  createAnnouncement as createAnnouncementInDb, 
  updateAnnouncement as updateAnnouncementInDb, 
  deleteAnnouncement as deleteAnnouncementInDb,
  getAnnouncementsByProgram as getAnnouncementsByProgramFromDb,
  getAnnouncementsByClass as getAnnouncementsByClassFromDb
} from '../db/announcements-postgres.js';

/**
 * Get all announcements with business logic
 * 
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllAnnouncements = async (params = {}, user = null) => {
  try {
    // Add business logic here (authorization, validation, etc.)
    // Filter announcements based on user role and target audience
    const filteredParams = { ...params };
    
    // If user is a student, only show announcements targeted at students or all
    if (user && user.role?.code === 'STUDENT') {
      filteredParams.targetAudience = 'all'; // Could also include 'students'
    }
    
    // If user is an instructor, show announcements for their classes or all
    if (user && user.role?.code === 'INSTRUCTOR') {
      filteredParams.targetAudience = 'all'; // Could also include 'instructors'
    }
    
    const result = await getAnnouncements(filteredParams);
    return result;
    
  } catch (error) {
    console.error('Error in getAllAnnouncements:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve announcements',
      data: []
    };
  }
};

/**
 * Get announcement by ID with business logic
 * 
 * @param {number|string} announcementId - Announcement ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAnnouncementById = async (announcementId, user = null) => {
  try {
    if (!announcementId) {
      return {
        success: false,
        error: 'Announcement ID is required',
        data: null
      };
    }
    
    const result = await getAnnouncementByIdFromDb(announcementId);
    
    // Business rule: Check if user has access to this announcement
    if (result.success && result.data) {
      const announcement = result.data;
      
      // Check if announcement is active and published
      const now = new Date();
      if (!announcement.isActive) {
        return {
          success: false,
          error: 'Announcement is not active',
          data: null
        };
      }
      
      if (announcement.publishAt && new Date(announcement.publishAt) > now) {
        return {
          success: false,
          error: 'Announcement has not been published yet',
          data: null
        };
      }
      
      if (announcement.expiresAt && new Date(announcement.expiresAt) < now) {
        return {
          success: false,
          error: 'Announcement has expired',
          data: null
        };
      }
      
      // Check target audience
      if (user && user.role?.code === 'STUDENT' && announcement.targetAudience === 'instructors') {
        return {
          success: false,
          error: 'Access denied: Announcement is for instructors only',
          data: null
        };
      }
      
      if (user && user.role?.code === 'INSTRUCTOR' && announcement.targetAudience === 'students') {
        return {
          success: false,
          error: 'Access denied: Announcement is for students only',
          data: null
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in getAnnouncementById:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve announcement',
      data: null
    };
  }
};

/**
 * Create new announcement with business logic
 * 
 * @param {Object} announcementData - Announcement data
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createAnnouncement = async (announcementData, user = null) => {
  try {
    // Business validation
    if (!announcementData.titleEn) {
      return {
        success: false,
        error: 'Announcement title (English) is required',
        data: null
      };
    }
    
    if (!announcementData.descriptionEn) {
      return {
        success: false,
        error: 'Announcement description (English) is required',
        data: null
      };
    }
    
    // Validate priority
    const allowedPriorities = ['low', 'normal', 'high', 'urgent'];
    if (announcementData.priority && !allowedPriorities.includes(announcementData.priority)) {
      return {
        success: false,
        error: `Invalid priority. Allowed values: ${allowedPriorities.join(', ')}`,
        data: null
      };
    }
    
    // Validate target audience
    const allowedAudiences = ['all', 'students', 'instructors', 'hr', 'admin'];
    if (announcementData.targetAudience && !allowedAudiences.includes(announcementData.targetAudience)) {
      return {
        success: false,
        error: `Invalid target audience. Allowed values: ${allowedAudiences.join(', ')}`,
        data: null
      };
    }
    
    // Validate dates
    if (announcementData.publishAt && announcementData.expiresAt) {
      const publishDate = new Date(announcementData.publishAt);
      const expireDate = new Date(announcementData.expiresAt);
      
      if (publishDate >= expireDate) {
        return {
          success: false,
          error: 'Publish date must be before expiration date',
          data: null
        };
      }
    }
    
    // Business rule: Only admin, instructors, and HR can create announcements - DISABLED per user request
    // All authenticated users can now create announcements
    /*
    if (user) {
      // Check for admin/instructor/HR in multiple ways
      const isAdmin = user.role?.code === 'ADMIN' || 
                     user.isSuperAdmin || 
                     user.isAdmin ||
                     (user.roles && user.roles.some(r => r.code === 'ADMIN' || r.name === 'ADMIN'));
      
      const isInstructor = user.role?.code === 'INSTRUCTOR' || 
                          user.isInstructor ||
                          (user.roles && user.roles.some(r => r.code === 'INSTRUCTOR' || r.name === 'INSTRUCTOR'));
      
      const isHR = user.role?.code === 'HR' || 
                   user.isHR ||
                   (user.roles && user.roles.some(r => r.code === 'HR' || r.name === 'HR'));
      
      if (!isAdmin && !isInstructor && !isHR) {
        return {
          success: false,
          error: 'Only administrators, instructors, and HR can create announcements',
          data: null
        };
      }
    }
    */
    
    // Map targetAudience string to ID
    const targetAudienceMap = {
      'all': 1,
      'students': 2,
      'instructors': 3,
      'hr': 5, // Assuming HR has ID 5 in the database
      'admin': 4
    };
    
    // Prepare data for DB
    const dbData = {
      ...announcementData,
      targetAudienceId: targetAudienceMap[announcementData.targetAudience] || 1,
      priorityId: announcementData.priorityId || 2 // Use provided priorityId or default to 'normal'
    };
    
    const result = await createAnnouncementInDb(dbData, user);
    return result;
  } catch (error) {
    console.error('Error in createAnnouncement:', error);
    return {
      success: false,
      error: error.message || 'Failed to create announcement',
      data: null
    };
  }
};

/**
 * Update announcement with business logic
 * 
 * @param {number|string} announcementId - Announcement ID
 * @param {Object} updateData - Announcement data to update
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateAnnouncement = async (announcementId, updateData, user = null) => {
  try {
    if (!announcementId) {
      return {
        success: false,
        error: 'Announcement ID is required',
        data: null
      };
    }
    
    // Business rule: Only creator and admin can update announcements
    // This would typically involve checking the announcement's createdBy field
    
    // Business validation for updates
    const allowedPriorities = ['low', 'normal', 'high', 'urgent'];
    if (updateData.priority && !allowedPriorities.includes(updateData.priority)) {
      return {
        success: false,
        error: `Invalid priority. Allowed values: ${allowedPriorities.join(', ')}`,
        data: null
      };
    }
    
    const allowedAudiences = ['all', 'students', 'instructors', 'admin'];
    if (updateData.targetAudience && !allowedAudiences.includes(updateData.targetAudience)) {
      return {
        success: false,
        error: `Invalid target audience. Allowed values: ${allowedAudiences.join(', ')}`,
        data: null
      };
    }
    
    if (updateData.publishAt && updateData.expiresAt) {
      const publishDate = new Date(updateData.publishAt);
      const expireDate = new Date(updateData.expiresAt);
      
      if (publishDate >= expireDate) {
        return {
          success: false,
          error: 'Publish date must be before expiration date',
          data: null
        };
      }
    }
    
    const result = await updateAnnouncementInDb(announcementId, updateData, user);
    return result;
  } catch (error) {
    console.error('Error in updateAnnouncement:', error);
    return {
      success: false,
      error: error.message || 'Failed to update announcement',
      data: null
    };
  }
};

/**
 * Delete announcement with business logic
 * 
 * @param {number|string} announcementId - Announcement ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteAnnouncement = async (announcementId, user = null) => {
  try {
    if (!announcementId) {
      return {
        success: false,
        error: 'Announcement ID is required',
        data: null
      };
    }
    
    // Business rule: Only creator and admin can delete announcements
    // This would typically involve checking the announcement's createdBy field
    
    const result = await deleteAnnouncementInDb(announcementId, user);
    return result;
  } catch (error) {
    console.error('Error in deleteAnnouncement:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete announcement',
      data: null
    };
  }
};

/**
 * Get announcements by program with business logic
 * 
 * @param {number|string} programId - Program ID
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAnnouncementsByProgram = async (programId, params = {}, user = null) => {
  try {
    if (!programId) {
      return {
        success: false,
        error: 'Program ID is required',
        data: []
      };
    }
    
    // Business rule: Check if user has access to this program
    // This would typically involve checking enrollment or assignment
    
    const result = await getAnnouncementsByProgramFromDb(programId, params);
    return result;
  } catch (error) {
    console.error('Error in getAnnouncementsByProgram:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve announcements for program',
      data: []
    };
  }
};

/**
 * Get announcements by class with business logic
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAnnouncementsByClass = async (classId, params = {}, user = null) => {
  try {
    if (!classId) {
      return {
        success: false,
        error: 'Class ID is required',
        data: []
      };
    }
    
    // Business rule: Check if user has access to this class
    // This would typically involve checking enrollment or instructor assignment
    
    const result = await getAnnouncementsByClassFromDb(classId, params);
    return result;
  } catch (error) {
    console.error('Error in getAnnouncementsByClass:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve announcements for class',
      data: []
    };
  }
};

export default {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementsByProgram,
  getAnnouncementsByClass
};
