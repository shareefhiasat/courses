import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { getUserById } from './userService';
import { notificationGateway } from './notificationGateway';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { convertDatesToTimestamps, COMMON_DATE_FIELDS } from '@utils/date.js';
import logger from '@utils/logger';
import { logActivity, ACTIVITY_LOG_TYPES } from '../other/activityLogger';
import { handleServiceError, withRetry } from '@utils/errorHandling';
import { validateEntity, validateBilingualField } from '@utils/validationHelpers';
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

const RESOURCE_VALIDATION_RULES = [
  { field: 'type', required: true, type: 'string', label: 'Resource type' },
  { field: 'url', type: 'string', label: 'Resource URL' },
  { field: 'description_en', type: 'string', label: 'Resource description' }
];
const validateResourceData = (data) => [
  ...validateBilingualField(data, 'title', 'Resource title'),
  ...validateEntity(data, RESOURCE_VALIDATION_RULES)
];

// Get all resources - with performance monitoring and memoization
export const getResources = async () => {
  try {
    logger.info('RESOURCE: Fetching all resources');
    
    const result = await getResourcesFromDb();
    
    if (result.success) {
      logger.info('RESOURCE: Successfully fetched resources', { count: result.data.length });
    } else {
      logger.warn('RESOURCE: Failed to fetch resources', { error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to fetch resources', { error: error.message });
    return handleServiceError(error, { operation: 'getResources' });
  }
};

// Get resources by class ID
export const getResourcesByClass = async (classId) => {
  try {
    if (!classId) {
      return { success: false, error: 'Class ID is required' };
    }
    
    logger.info('RESOURCE: Fetching resources by class', { classId });
    
    const result = await getResourcesByClassFromDb(classId);
    
    if (result.success) {
      logger.info('RESOURCE: Successfully fetched resources by class', { classId, count: result.data.length });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to fetch resources by class', { error: error.message, classId });
    return { success: false, error: error.message };
  }
};

// Add a new resource
export const addResource = async (resourceData) => {
  try {
    logger.info('RESOURCE: Creating new resource', {
      title: resourceData.title_en || resourceData.title,
      url: resourceData.url,
      type: resourceData.type,
      hasClassId: !!resourceData.classId,
      hasProgramId: !!resourceData.programId,
      hasSubjectId: !!resourceData.subjectId
    });
    
    // Validate input data
    const validationErrors = validateResourceData(resourceData);
    if (validationErrors.length > 0) {
      logger.warn('RESOURCE: Validation failed', { errors: validationErrors });
      return { success: false, error: validationErrors.join(', ') };
    }
    
    const convertedData = convertDatesToTimestamps(resourceData, COMMON_DATE_FIELDS.resources || ['dueDate'], Timestamp);
    const resourceWithTimestamps = {
      ...convertedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const result = await createResourceToDb(resourceWithTimestamps);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.RESOURCE_CREATED, {
          resourceId: result.id,
          title: resourceData.title_en || resourceData.title,
          type: resourceData.type
        });
      } catch (logError) {
        logger.warn('RESOURCE: Failed to log resource creation:', logError);
      }
      
      // Send notifications for new resource
      if (resourceData.classId) {
        try {
          // TODO: Implement notification logic
          logger.info('RESOURCE: Notifications would be sent for class', { classId: resourceData.classId });
        } catch (notifyError) {
          logger.warn('RESOURCE: Failed to send resource notifications:', notifyError);
        }
      }
      
      logger.info('RESOURCE: Successfully created resource', { resourceId: result.id });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to create resource', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Update a resource
export const updateResource = async (id, resourceData, emailOptions = { sendEmail: true }) => {
  try {
    if (!id) {
      return { success: false, error: 'Resource ID is required for update' };
    }
    
    logger.info('RESOURCE: Updating resource', { resourceId: id });
    
    // Validate input data
    const validationErrors = validateResourceData(resourceData);
    if (validationErrors.length > 0) {
      logger.warn('RESOURCE: Validation failed', { errors: validationErrors });
      return { success: false, error: validationErrors.join(', ') };
    }
    
    const convertedData = convertDatesToTimestamps(resourceData, COMMON_DATE_FIELDS.resources || ['dueDate'], Timestamp);
    const resourceWithTimestamps = {
      ...convertedData,
      updatedAt: serverTimestamp()
    };

    const result = await updateResourceInDb(id, resourceWithTimestamps);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.RESOURCE_UPDATED, {
          resourceId: id,
          title: resourceData.title_en || resourceData.title
        });
      } catch (logError) {
        logger.warn('RESOURCE: Failed to log resource update:', logError);
      }
      
      // TODO: Implement notification logic if needed
      if (resourceData.classId && emailOptions.sendEmail) {
        logger.info('RESOURCE: Update notifications would be sent for class', { classId: resourceData.classId });
      }
      
      logger.info('RESOURCE: Successfully updated resource', { resourceId: id });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to update resource', { error: error.message, resourceId: id });
    return { success: false, error: error.message };
  }
};

// Delete a resource
export const deleteResource = async (id) => {
  try {
    if (!id) {
      return { success: false, error: 'Resource ID is required' };
    }
    
    logger.info('RESOURCE: Deleting resource', { resourceId: id });
    
    // Get resource details for logging
    const resourceResult = await getResourceFromDb(id);
    
    const result = await deleteResourceFromDb(id);
    
    if (result.success) {
      // Log activity
      try {
        await logActivity(ACTIVITY_LOG_TYPES.RESOURCE_DELETED, {
          resourceId: id,
          title: resourceResult.success ? resourceResult.data.title : 'Unknown'
        });
      } catch (logError) {
        logger.warn('RESOURCE: Failed to log resource deletion:', logError);
      }
      
      logger.info('RESOURCE: Successfully deleted resource', { resourceId: id });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to delete resource', { error: error.message, resourceId: id });
    return { success: false, error: error.message };
  }
};

// Get resource by ID
export const getResourceById = async (id) => {
  try {
    if (!id) {
      return { success: false, error: 'Resource ID is required' };
    }
    
    logger.info('RESOURCE: Fetching resource by ID', { resourceId: id });
    
    const result = await getResourceFromDb(id);
    
    if (result.success) {
      logger.info('RESOURCE: Successfully fetched resource', { resourceId: id });
    } else {
      logger.warn('RESOURCE: Resource not found', { resourceId: id });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to fetch resource', { error: error.message, resourceId: id });
    return { success: false, error: error.message };
  }
};

// Get resources by subject ID
export const getResourcesBySubject = async (subjectId) => {
  try {
    if (!subjectId) {
      return { success: false, error: 'Subject ID is required' };
    }
    
    logger.info('RESOURCE: Fetching resources by subject', { subjectId });
    
    const result = await getResourcesBySubjectFromDb(subjectId);
    
    if (result.success) {
      logger.info('RESOURCE: Successfully fetched resources by subject', { subjectId, count: result.data.length });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to fetch resources by subject', { error: error.message, subjectId });
    return { success: false, error: error.message };
  }
};

// Get resources by type
export const getResourcesByType = async (resourceType) => {
  try {
    if (!resourceType) {
      return { success: false, error: 'Resource type is required' };
    }
    
    logger.info('RESOURCE: Fetching resources by type', { resourceType });
    
    const result = await getResourcesByTypeFromDb(resourceType);
    
    if (result.success) {
      logger.info('RESOURCE: Successfully fetched resources by type', { resourceType, count: result.data.length });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to fetch resources by type', { error: error.message, resourceType });
    return { success: false, error: error.message };
  }
};

// Search resources - with debouncing optimization
export const searchResources = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return handleServiceError(
      new Error('Search term is required'),
      { operation: 'searchResources', searchTerm }
    );
  }
  
  logger.info('RESOURCE: Searching resources', { searchTerm });
  
  const result = await searchResourcesFromDb(searchTerm.trim());
  
  if (result.success) {
    logger.info('RESOURCE: Successfully searched resources', { searchTerm, count: result.data.length });
  }
  
  return result;
};

// Get resource count
export const getResourceCount = async (filters = {}) => {
  try {
    logger.info('RESOURCE: Getting resource count', { filters });
    
    const result = await getResourceCountFromDb(filters);
    
    if (result.success) {
      logger.info('RESOURCE: Successfully got resource count', { count: result.count });
    }
    
    return result;
  } catch (error) {
    logger.error('RESOURCE: Failed to get resource count', { error: error.message });
    return { success: false, error: error.message, count: 0 };
  }
};

