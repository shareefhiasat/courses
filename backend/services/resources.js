/**
 * Resources Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for resource operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import { 
  getResources, 
  getResourceById as getResourceByIdFromDb, 
  createResource as createResourceInDb, 
  updateResource as updateResourceInDb, 
  deleteResource as deleteResourceInDb,
  getResourcesByClass as getResourcesByClassFromDb
} from '../db/resources-postgres.js';
import prisma from '../db/prismaClient.js';
import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';
import { buildNotificationNameVars } from '../utils/localizedUserName.js';

/**
 * Get all resources with business logic
 * 
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllResources = async (params = {}, user = null) => {
  try {
    // Add business logic here (authorization, validation, etc.)
    const result = await getResources(params);
    
    return result;
    
  } catch (error) {
    console.error('Error in getAllResources:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve resources',
      data: []
    };
  }
};

/**
 * Get resource by ID with business logic
 * 
 * @param {number|string} resourceId - Resource ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getResourceById = async (resourceId, user = null) => {
  try {
    if (!resourceId) {
      return {
        success: false,
        error: 'Resource ID is required',
        data: null
      };
    }
    
    const result = await getResourceByIdFromDb(resourceId);
    return result;
  } catch (error) {
    console.error('Error in getResourceById:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve resource',
      data: null
    };
  }
};

/**
 * Create new resource with business logic
 * 
 * @param {Object} resourceData - Resource data
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createResource = async (resourceData, user = null) => {
  try {
    // Business validation
    if (!resourceData.titleEn) {
      return {
        success: false,
        error: 'Resource title (English) is required',
        data: null
      };
    }
    
    // classId is optional - resources can be general or class-specific
    
    // Validate file information if provided
    if (resourceData.fileUrl && !resourceData.fileName) {
      return {
        success: false,
        error: 'File name is required when file URL is provided',
        data: null
      };
    }
    
    // Validate file size if provided (max 50MB)
    if (resourceData.fileSize !== undefined && resourceData.fileSize > 50 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size cannot exceed 50MB',
        data: null
      };
    }
    
    // Validate file type if provided
    const allowedFileTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mp3'];
    if (resourceData.fileType && !allowedFileTypes.includes(resourceData.fileType.toLowerCase())) {
      return {
        success: false,
        error: `File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`,
        data: null
      };
    }
    
    const result = await createResourceInDb(resourceData, user);
    
    // Send notification if resource is tied to a class
    if (result.success && result.data?.classId) {
      try {
        const creator = user?.dbId ? await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true }
        }) : null;
        
        await notificationGateway.emit(
          EVENTS.RESOURCE_ADDED,
          {
            ...buildNotificationNameVars(creator, 'Unknown User'),
            resourceTitle: result.data.titleEn || 'New Resource',
            resourceType: result.data.type || 'Resource'
          },
          { id: user?.dbId },
          { classId: result.data.classId }
        );
      } catch (notifError) {
        console.error('[resources] Error sending added notification:', notifError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in createResource:', error);
    return {
      success: false,
      error: error.message || 'Failed to create resource',
      data: null
    };
  }
};

/**
 * Update resource with business logic
 * 
 * @param {number|string} resourceId - Resource ID
 * @param {Object} updateData - Resource data to update
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateResource = async (resourceId, updateData, user = null) => {
  try {
    if (!resourceId) {
      return {
        success: false,
        error: 'Resource ID is required',
        data: null
      };
    }
    
    // Business validation for updates
    if (updateData.fileUrl && !updateData.fileName) {
      return {
        success: false,
        error: 'File name is required when file URL is provided',
        data: null
      };
    }
    
    if (updateData.fileSize !== undefined && updateData.fileSize > 50 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size cannot exceed 50MB',
        data: null
      };
    }
    
    const result = await updateResourceInDb(resourceId, updateData, user);
    
    // Send notification if resource is tied to a class
    if (result.success && result.data?.classId) {
      try {
        const updater = user?.dbId ? await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true }
        }) : null;
        
        await notificationGateway.emit(
          EVENTS.RESOURCE_UPDATED,
          {
            ...buildNotificationNameVars(updater, 'Unknown User'),
            resourceTitle: result.data.titleEn || 'Resource',
            resourceType: result.data.type || 'Resource'
          },
          { id: user?.dbId },
          { classId: result.data.classId }
        );
      } catch (notifError) {
        console.error('[resources] Error sending updated notification:', notifError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in updateResource:', error);
    return {
      success: false,
      error: error.message || 'Failed to update resource',
      data: null
    };
  }
};

/**
 * Delete resource with business logic
 * 
 * @param {number|string} resourceId - Resource ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteResource = async (resourceId, user = null) => {
  try {
    if (!resourceId) {
      return {
        success: false,
        error: 'Resource ID is required',
        data: null
      };
    }
    
    // Business rule: Check if user has permission to delete
    // This would typically involve checking user role and ownership
    
    // Get resource before deletion to check classId
    const existingResource = await getResourceByIdFromDb(resourceId);
    
    const result = await deleteResourceInDb(resourceId, user);
    
    // Send notification if resource was tied to a class
    if (result.success && existingResource.data?.classId) {
      try {
        const deleter = user?.dbId ? await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true }
        }) : null;
        
        await notificationGateway.emit(
          EVENTS.RESOURCE_DELETED,
          {
            ...buildNotificationNameVars(deleter, 'Unknown User'),
            resourceTitle: existingResource.data.titleEn || 'Resource',
            resourceType: existingResource.data.type || 'Resource'
          },
          { id: user?.dbId },
          { classId: existingResource.data.classId }
        );
      } catch (notifError) {
        console.error('[resources] Error sending deleted notification:', notifError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in deleteResource:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete resource',
      data: null
    };
  }
};

/**
 * Get resources by class with business logic
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} params - Query parameters
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getResourcesByClass = async (classId, params = {}, user = null) => {
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
    
    const result = await getResourcesByClassFromDb(classId, params);
    return result;
  } catch (error) {
    console.error('Error in getResourcesByClass:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve resources for class',
      data: []
    };
  }
};

export default {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getResourcesByClass
};
