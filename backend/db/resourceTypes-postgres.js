import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all resource types from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllResourceTypes = async (params = {}) => {
  try {
    console.log('[ResourceTypes DB] Getting resource types with params:', params);
    
    const startTime = Date.now();
    
    // Build where clause
    const where = {};
    
    // Filter by active status
    if (params.isActive !== undefined && params.isActive !== null) {
      where.isActive = params.isActive === 'true' || params.isActive === true;
    }
    
    // Filter by search term
    if (params.search && params.search.trim()) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { nameEn: { contains: params.search, mode: 'insensitive' } },
        { nameAr: { contains: params.search, mode: 'insensitive' } }
      ];
    }
    
    // Build order clause
    const orderByClause = {};
    const sortBy = params.sortBy || 'code';
    const sortOrder = params.sortOrder || 'asc';
    orderByClause[sortBy] = sortOrder.toLowerCase();
    
    // Calculate pagination
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Execute query
    const resourceTypes = await prisma.resourceTypes.findMany({
      where,
      orderBy: orderByClause,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            resources: true
          }
        }
      }
    });
    
    // Get total count
    const total = await prisma.resourceTypes.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[ResourceTypes DB] ✅ Retrieved ${resourceTypes.length} resource types in ${executionTime}ms`);
    
    return {
      success: true,
      data: resourceTypes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    console.error('[ResourceTypes DB] ❌ Error getting resource types:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve resource types',
      data: []
    };
  }
};

/**
 * Get resource type by ID from PostgreSQL database
 * 
 * @param {number|string} resourceTypeId - Resource type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getResourceTypeById = async (resourceTypeId) => {
  try {
    console.log(`[ResourceTypes DB] Getting resource type: ${resourceTypeId}`);
    
    const startTime = Date.now();
    
    const resourceType = await prisma.resourceTypes.findUnique({
      where: { id: parseInt(resourceTypeId) },
      include: {
        _count: {
          select: {
            resources: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[ResourceTypes DB] ✅ Retrieved resource type in ${executionTime}ms`);
    
    if (!resourceType) {
      return {
        success: false,
        error: 'Resource type not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: resourceType
    };
    
  } catch (error) {
    console.error('[ResourceTypes DB] ❌ Error getting resource type:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve resource type',
      data: null
    };
  }
};

/**
 * Create resource type in PostgreSQL database
 * 
 * @param {Object} resourceTypeData - Resource type data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createResourceType = async (resourceTypeData, user = null) => {
  try {
    console.log('[ResourceTypes DB] Creating new resource type:', resourceTypeData);
    
    const startTime = Date.now();
    
    // Prepare data for creation
    const data = {
      code: resourceTypeData.code,
      nameEn: resourceTypeData.nameEn,
      nameAr: resourceTypeData.nameAr || resourceTypeData.nameEn,
      descriptionEn: resourceTypeData.descriptionEn,
      descriptionAr: resourceTypeData.descriptionAr || resourceTypeData.descriptionEn,
      icon: resourceTypeData.icon,
      color: resourceTypeData.color,
      isActive: resourceTypeData.isActive !== undefined ? resourceTypeData.isActive : true,
      createdBy: user?.id || 1
    };
    
    const newResourceType = await prisma.resourceTypes.create({
      data,
      include: {
        _count: {
          select: {
            resources: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[ResourceTypes DB] ✅ Created resource type in ${executionTime}ms`);
    
    return {
      success: true,
      data: newResourceType
    };
    
  } catch (error) {
    console.error('[ResourceTypes DB] ❌ Error creating resource type:', error);
    return {
      success: false,
      error: error.message || 'Failed to create resource type',
      data: null
    };
  }
};

/**
 * Update resource type in PostgreSQL database
 * 
 * @param {number|string} resourceTypeId - Resource type ID
 * @param {Object} updateData - Resource type data to update
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateResourceType = async (resourceTypeId, updateData, user = null) => {
  try {
    console.log(`[ResourceTypes DB] Updating resource type: ${resourceTypeId}`);
    
    const startTime = Date.now();
    
    // Prepare update data
    const data = {};
    
    // Only include fields that are provided
    if (updateData.code !== undefined) data.code = updateData.code;
    if (updateData.nameEn !== undefined) data.nameEn = updateData.nameEn;
    if (updateData.nameAr !== undefined) data.nameAr = updateData.nameAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.icon !== undefined) data.icon = updateData.icon;
    if (updateData.color !== undefined) data.color = updateData.color;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    
    // Add audit trail
    data.updatedBy = user?.id || 1;
    
    const updatedResourceType = await prisma.resourceTypes.update({
      where: { id: parseInt(resourceTypeId) },
      data,
      include: {
        _count: {
          select: {
            resources: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[ResourceTypes DB] ✅ Updated resource type in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedResourceType
    };
    
  } catch (error) {
    console.error('[ResourceTypes DB] ❌ Error updating resource type:', error);
    return {
      success: false,
      error: error.message || 'Failed to update resource type',
      data: null
    };
  }
};

/**
 * Delete resource type from PostgreSQL database
 * 
 * @param {number|string} resourceTypeId - Resource type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteResourceType = async (resourceTypeId) => {
  try {
    console.log(`[ResourceTypes DB] Deleting resource type: ${resourceTypeId}`);
    
    const startTime = Date.now();
    
    // Check if resource type is being used by any resources
    const resourcesCount = await prisma.resource.count({
      where: { typeId: parseInt(resourceTypeId) }
    });
    
    if (resourcesCount > 0) {
      return {
        success: false,
        error: `Cannot delete resource type. It is being used by ${resourcesCount} resource(s).`,
        data: null
      };
    }
    
    // Delete the resource type
    const deletedResourceType = await prisma.resourceTypes.delete({
      where: { id: parseInt(resourceTypeId) }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[ResourceTypes DB] ✅ Deleted resource type in ${executionTime}ms`);
    
    return {
      success: true,
      data: deletedResourceType
    };
    
  } catch (error) {
    console.error('[ResourceTypes DB] ❌ Error deleting resource type:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete resource type',
      data: null
    };
  }
};
