/**
 * Announcement Service - Interface Layer
 * 
 * PURPOSE: Public API for announcement operations
 * ARCHITECTURE: Frontend Components → Announcement Service → Announcement Business Service → Database Service
 */

import { info, error, warn, debug } from '../utils/logger.js';

// Import business service functions
import { 
  getAllAnnouncements as getAllAnnouncementsBusiness,
  getAnnouncementById as getAnnouncementByIdBusiness,
  createAnnouncement as createAnnouncementBusiness,
  updateAnnouncement as updateAnnouncementBusiness,
  deleteAnnouncement as deleteAnnouncementBusiness
} from './announcementsBusinessService.js';

const serviceName = 'announcementService';

/**
 * Get all announcements - public interface
 */
export const getAnnouncements = async (params = {}) => {
  try {
    info(`${serviceName}:getAnnouncements`, { params });
    
    // Use business service layer
    const result = await getAllAnnouncementsBusiness(params);
    return result;
  } catch (err) {
    error(`${serviceName}:getAnnouncements:error`, { error: err.message, params });
    return {
      success: false,
      error: err.message || 'Failed to load announcements',
      data: []
    };
  }
};

/**
 * Get announcement by ID - public interface
 */
export const getAnnouncementById = async (id) => {
  try {
    info(`${serviceName}:getAnnouncementById`, { id });
    
    // Use business service layer
    const result = await getAnnouncementByIdBusiness(id);
    return result;
  } catch (err) {
    error(`${serviceName}:getAnnouncementById:error`, { error: err.message, id });
    return {
      success: false,
      error: err.message || 'Failed to load announcement',
      data: null
    };
  }
};

/**
 * Create announcement - public interface
 */
export const createAnnouncement = async (announcementData, user = null) => {
  try {
    info(`${serviceName}:createAnnouncement`, { data: announcementData });
    
    // Use business service layer
    const result = await createAnnouncementBusiness(announcementData, user);
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

export const addAnnouncement = createAnnouncement;

/**
 * Update announcement - public interface
 */
export const updateAnnouncement = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:updateAnnouncement`, { id, data: updateData });
    
    // Use business service layer
    const result = await updateAnnouncementBusiness(id, updateData, user);
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
 * Delete announcement - public interface
 */
export const deleteAnnouncement = async (id, user = null) => {
  try {
    info(`${serviceName}:deleteAnnouncement`, { id });
    
    // Use business service layer
    const result = await deleteAnnouncementBusiness(id, user);
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
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
