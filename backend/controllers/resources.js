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
import { asyncHandler, sendResult } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/resources
 * Get all resources
 */
export const getAllResourcesController = asyncHandler(async (req, res) => {
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
    res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/v1/resources/:id
 * Get resource by ID
 */
export const getResourceByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getResourceById(id, req.user);
  sendResult(res, result);
});

/**
 * POST /api/v1/resources
 * Create new resource
 */
export const createResourceController = asyncHandler(async (req, res) => {
  const result = await createResource(req.body, req.user);
  sendResult(res, result, { successStatus: 201 });
});

/**
 * PUT /api/v1/resources/:id
 * Update resource
 */
export const updateResourceController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await updateResource(id, req.body, req.user);
  sendResult(res, result);
});

/**
 * DELETE /api/v1/resources/:id
 * Delete resource
 */
export const deleteResourceController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteResource(id, req.user);
  sendResult(res, result);
});

/**
 * GET /api/v1/resources/class/:classId
 * Get resources by class
 */
export const getResourcesByClassController = asyncHandler(async (req, res) => {
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
    res.status(400).json({ success: false, error: result.error });
  }
});

export default {
  getAllResourcesController,
  getResourceByIdController,
  createResourceController,
  updateResourceController,
  deleteResourceController,
  getResourcesByClassController
};
