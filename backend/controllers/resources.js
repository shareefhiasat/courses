/**
 * Resources Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for resource operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getAllResources, 
  getResourceById, 
  createResource, 
  updateResource, 
  deleteResource, 
  getResourcesByClass
} from '../services/resources.js';

/**
 * GET /api/v1/resources
 * Get all resources
 */
export const getAllResourcesController = async (req, res) => {
  try {
    const result = await getAllResources(req.query, req.user);
    
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
    console.error('Error in getAllResourcesController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/resources/:id
 * Get resource by ID
 */
export const getResourceByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getResourceById(id, req.user);
    
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
    console.error('Error in getResourceByIdController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/resources
 * Create new resource
 */
export const createResourceController = async (req, res) => {
  try {
    const result = await createResource(req.body, req.user);
    
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
    console.error('Error in createResourceController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PUT /api/v1/resources/:id
 * Update resource
 */
export const updateResourceController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await updateResource(id, req.body, req.user);
    
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
    console.error('Error in updateResourceController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/resources/:id
 * Delete resource
 */
export const deleteResourceController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteResource(id, req.user);
    
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
    console.error('Error in deleteResourceController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/resources/class/:classId
 * Get resources by class
 */
export const getResourcesByClassController = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const result = await getResourcesByClass(classId, req.query, req.user);
    
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
    console.error('Error in getResourcesByClassController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export default {
  getAllResourcesController,
  getResourceByIdController,
  createResourceController,
  updateResourceController,
  deleteResourceController,
  getResourcesByClassController
};
