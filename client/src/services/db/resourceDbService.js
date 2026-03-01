/**
 * Resource Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for resource records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'resources'
 * 
 * @typedef {import('@types/index').Resource} Resource
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { serverTimestamp } from 'firebase/firestore';
import dbService from '@services/other/dbService';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get all resources
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getResources = async (options = {}) => {
  try {
    const { 
      limitCount = 100, 
      orderByField = 'createdAt', 
      orderDirection = 'desc',
      classId,
      subjectId,
      programId,
      type
    } = options;
    
    // Build query options for dbService
    const queryOptions = {
      orderBy: {
        field: orderByField,
        direction: orderDirection
      }
    };
    
    // Add filters (only one where clause supported by dbService)
    if (classId) {
      queryOptions.where = {
        field: 'classId',
        operator: '==',
        value: classId
      };
    } else if (subjectId) {
      queryOptions.where = {
        field: 'subjectId',
        operator: '==',
        value: subjectId
      };
    } else if (programId) {
      queryOptions.where = {
        field: 'programId',
        operator: '==',
        value: programId
      };
    } else if (type) {
      queryOptions.where = {
        field: 'type',
        operator: '==',
        value: type
      };
    }
    
    if (limitCount) {
      queryOptions.limit = limitCount;
    }
    
    const result = await dbService.getAll(COLLECTIONS.RESOURCES, queryOptions);
    
    // If we need additional filtering, do it client-side
    if (result.success && ((classId && subjectId) || (classId && programId) || (subjectId && programId) || (type && (classId || subjectId || programId)))) {
      const filteredData = result.data.filter(resource => {
        const matchesClass = !classId || resource.classId === classId;
        const matchesSubject = !subjectId || resource.subjectId === subjectId;
        const matchesProgram = !programId || resource.programId === programId;
        const matchesType = !type || resource.type === type;
        return matchesClass && matchesSubject && matchesProgram && matchesType;
      });
      return { success: true, data: filteredData };
    }
    
    return result;
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resources:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resource by ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getResource = async (resourceId) => {
  try {
    const result = await dbService.getById(COLLECTIONS.RESOURCES, resourceId);
    return result;
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create resource
 * @param {Object} resourceData - Resource data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createResource = async (resourceData) => {
  try {
    const result = await dbService.add(COLLECTIONS.RESOURCES, {
      ...resourceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return result;
  } catch (error) {
    logger.error('[ResourceDbService] Error creating resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update resource
 * @param {string} resourceId - Resource ID
 * @param {Object} resourceData - Updated resource data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateResource = async (resourceId, resourceData) => {
  try {
    const result = await dbService.update(COLLECTIONS.RESOURCES, resourceId, {
      ...resourceData,
      updatedAt: serverTimestamp()
    });
    return result;
  } catch (error) {
    logger.error('[ResourceDbService] Error updating resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete resource
 * @param {string} resourceId - Resource ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteResource = async (resourceId) => {
  try {
    const result = await dbService.delete(COLLECTIONS.RESOURCES, resourceId);
    return result;
  } catch (error) {
    logger.error('[ResourceDbService] Error deleting resource:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resources by class
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getResourcesByClass = async (classId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(COLLECTIONS.RESOURCES, {
      where: {
        field: 'classId',
        operator: '==',
        value: classId
      },
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resources by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resources by subject
 * @param {string} subjectId - Subject ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getResourcesBySubject = async (subjectId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(COLLECTIONS.RESOURCES, {
      where: {
        field: 'subjectId',
        operator: '==',
        value: subjectId
      },
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resources by subject:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resources by type
 * @param {string} type - Resource type
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getResourcesByType = async (type, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const result = await dbService.getAll(COLLECTIONS.RESOURCES, {
      where: {
        field: 'type',
        operator: '==',
        value: type
      },
      orderBy: {
        field: orderByField,
        direction: orderDirection
      },
      limit: limitCount
    });
    
    return result;
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resources by type:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search resources
 * @param {string} searchTerm - Search term
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const searchResources = async (searchTerm) => {
  try {
    // This would typically require a full-text search index
    // For now, get all resources and filter client-side
    const result = await getResources({ limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    const filteredResources = result.data.filter(resource => 
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return { success: true, data: filteredResources };
  } catch (error) {
    logger.error('[ResourceDbService] Error searching resources:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get resource count
 * @param {Object} filters - Filters to apply
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
export const getResourceCount = async (filters = {}) => {
  try {
    const { classId, subjectId, programId, type } = filters;
    
    // Since dbService only supports one where clause, we need to get all and filter
    const result = await dbService.getAll(COLLECTIONS.RESOURCES, { limit: 1000 });
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    // Apply filters client-side
    let filteredResources = result.data;
    
    if (classId) {
      filteredResources = filteredResources.filter(resource => resource.classId === classId);
    }
    if (subjectId) {
      filteredResources = filteredResources.filter(resource => resource.subjectId === subjectId);
    }
    if (programId) {
      filteredResources = filteredResources.filter(resource => resource.programId === programId);
    }
    if (type) {
      filteredResources = filteredResources.filter(resource => resource.type === type);
    }
    
    return { success: true, count: filteredResources.length };
  } catch (error) {
    logger.error('[ResourceDbService] Error getting resource count:', error);
    return { success: false, error: error.message };
  }
};
