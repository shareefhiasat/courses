/**
 * Announcements Business Service
 * 
 * PURPOSE: Business logic layer for announcement-related operations
 * This service orchestrates database operations and implements business rules
 * 
 * ARCHITECTURE: Frontend Components → Business Services → Database Services → PostgreSQL
 */

import announcementDbService from '../db/announcementDbService-postgres.js';
import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'announcementsBusinessService';

/**
 * Get all announcements with business logic
 */
export const getAllAnnouncements = async (params = {}) => {
  try {
    info(`${serviceName}:getAllAnnouncements`, { params });
    
    const result = await announcementDbService.getAll(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getAllAnnouncements:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to retrieve announcements',
      data: []
    };
  }
};

/**
 * Get announcement by ID with business validation
 */
export const getAnnouncementById = async (id) => {
  try {
    info(`${serviceName}:getAnnouncementById`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Announcement ID is required',
        data: null
      };
    }
    
    const result = await announcementDbService.getById(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getAnnouncementById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to retrieve announcement',
      data: null
    };
  }
};

/**
 * Create new announcement with business validation
 */
export const createAnnouncement = async (announcementData, user = null) => {
  try {
    info(`${serviceName}:createAnnouncement`, { data: announcementData });
    
    // Business rules validation
    if (!announcementData.title) {
      return {
        success: false,
        error: 'Announcement title is required',
        data: null
      };
    }
    
    if (!announcementData.descriptionEn && !announcementData.descriptionAr) {
      return {
        success: false,
        error: 'Announcement content is required',
        data: null
      };
    }
    
    // Set default values
    const processedData = {
      ...announcementData,
      isActive: announcementData.isActive !== undefined ? announcementData.isActive : true,
      createdAt: new Date(),
      createdBy: user?.id || 1
    };
    
    // Use database service
    const result = await announcementDbService.create(processedData);
    return result;
  } catch (err) {
    error(`${serviceName}:createAnnouncement:error`, { error: err.message, data: announcementData });
    return {
      success: false,
      error: err.message || 'Failed to create announcement',
      data: null
    };
  }
};

/**
 * Update announcement with business validation
 */
export const updateAnnouncement = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateAnnouncement`, { id, data: updateData });
    
    if (!id) {
      return {
        success: false,
        error: 'Announcement ID is required',
        data: null
      };
    }
    
    // Set updated timestamp
    updateData.updatedAt = new Date();
    updateData.updatedBy = user?.id || 1;
    
    // Use database service
    const result = await announcementDbService.update(id, updateData);
    return result;
  } catch (err) {
    error(`${serviceName}:updateAnnouncement:error`, { error: err.message, id, data: updateData });
    return {
      success: false,
      error: err.message || 'Failed to update announcement',
      data: null
    };
  }
};

/**
 * Delete announcement (soft delete) with business validation
 */
export const deleteAnnouncement = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteAnnouncement`, { id });
    
    if (!id) {
      return {
        success: false,
        error: 'Announcement ID is required',
        data: null
      };
    }
    
    const result = await announcementDbService.delete(id);
    return result;
  } catch (err) {
    error(`${serviceName}:deleteAnnouncement:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to delete announcement',
      data: null
    };
  }
};

export default {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
