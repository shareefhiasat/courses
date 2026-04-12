/**
 * Announcements Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for announcement operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getAllAnnouncements, 
  getAnnouncementById, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement, 
  getAnnouncementsByProgram,
  getAnnouncementsByClass
} from '../services/announcements.js';

/**
 * GET /api/v1/announcements
 * Get all announcements
 */
export const getAllAnnouncementsController = async (req, res) => {
  try {
    const result = await getAllAnnouncements(req.query, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getAllAnnouncementsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/announcements/:id
 * Get announcement by ID
 */
export const getAnnouncementByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getAnnouncementById(id, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getAnnouncementByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/announcements
 * Create new announcement
 */
export const createAnnouncementController = async (req, res) => {
  try {
    const result = await createAnnouncement(req.body, req.user);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in createAnnouncementController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/announcements/:id
 * Update announcement
 */
export const updateAnnouncementController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateAnnouncement(id, req.body, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in updateAnnouncementController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/announcements/:id
 * Delete announcement
 */
export const deleteAnnouncementController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteAnnouncement(id, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in deleteAnnouncementController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/announcements/program/:programId
 * Get announcements by program
 */
export const getAnnouncementsByProgramController = async (req, res) => {
  try {
    const { programId } = req.params;
    
    const result = await getAnnouncementsByProgram(programId, req.query, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getAnnouncementsByProgramController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/announcements/class/:classId
 * Get announcements by class
 */
export const getAnnouncementsByClassController = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const result = await getAnnouncementsByClass(classId, req.query, req.user);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error in getAnnouncementsByClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  getAllAnnouncementsController,
  getAnnouncementByIdController,
  createAnnouncementController,
  updateAnnouncementController,
  deleteAnnouncementController,
  getAnnouncementsByProgramController,
  getAnnouncementsByClassController
};
