/**
 * Resources Database Service
 * 
 * PURPOSE: Database operations for resources using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import prisma from './prismaClient.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';


/**
 * Get database user ID from Keycloak user object
 * 
 * @param {object} user - User object from request
 * @returns {Promise<number|null>} - Database user ID or null
 */
const getDatabaseUserId = async (user) => {
  if (!user) return null;
  
  try {
    // Try to find user by email (primary method)
    if (user.email) {
      const emailUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
      });
      
      if (emailUser) return emailUser.id;
    }
    
    // If no email, try display name as fallback
    if (user.displayName) {
      const nameUser = await prisma.user.findFirst({
        where: { displayName: user.displayName },
        select: { id: true }
      });
      
      if (nameUser) return nameUser.id;
    }
    
    return null;
  } catch (error) {
    console.error('[Resources DB] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Get all resources from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with resources data
 */
export const getResources = async (params = {}) => {
  try {
    console.log('[Resources DB] Getting resources with params:', params);
    
    const startTime = Date.now();
    
    const {
      page = 1,
      limit = 50,
      search = '',
      classId = '',
      isRequired = null,
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = { isActive: true }; // Default to active records only
    
    if (search) {
      where.OR = [
        { titleEn: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
        { descriptionEn: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (classId) {
      where.classId = parseInt(classId);
    }
    
    if (isRequired !== null) {
      where.isRequired = isRequired === 'true' || isRequired === true;
    }
    
    // Allow overriding isActive filter if explicitly provided
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    // Build order clause
    const orderByClause = {};
    orderByClause[sortBy] = sortOrder.toLowerCase();
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Execute query
    const resources = await prisma.resource.findMany({
      where,
      orderBy: orderByClause,
      skip,
      take: limitNum,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        subject: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        category: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        resourceType: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      }
    });
    
    // Get total count
    const total = await prisma.resource.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Resources DB] ✅ Retrieved ${resources.length} resources in ${executionTime}ms`);
    
    return {
      success: true,
      data: resources,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[Resources DB] ❌ Error getting resources:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve resources';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Get resource by ID from PostgreSQL database
 * 
 * @param {number|string} resourceId - Resource ID
 * @returns {Promise<Object>} - Result object with resource data
 */
export const getResourceById = async (resourceId) => {
  try {
    console.log(`[Resources DB] Getting resource by ID: ${resourceId}`);
    
    const startTime = Date.now();
    
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(resourceId) },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Resources DB] ✅ Retrieved resource in ${executionTime}ms`);
    
    if (!resource) {
      return {
        success: false,
        error: 'Resource not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: resource
    };
    
  } catch (error) {
    console.error('[Resources DB] ❌ Error getting resource by ID:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve resource';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Create new resource in PostgreSQL database
 * 
 * @param {Object} resourceData - Resource data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createResource = async (resourceData, user = null) => {
  try {
    console.log(`[Resources DB] Creating new resource: ${resourceData.titleEn || resourceData.titleAr}`);
    
    const startTime = Date.now();
    
    // Get user ID for audit trail
    const createdBy = await getDatabaseUserId(user) || 1;
    
    if (createdBy !== 1) {
      console.log('[Resources DB] Using authenticated user for audit trail:', user.displayName);
    } else {
      console.warn('[Resources DB] No user provided, using default admin');
    }
    
    const newResource = await prisma.resource.create({
      data: {
        titleEn: resourceData.titleEn,
        titleAr: resourceData.titleAr,
        descriptionEn: resourceData.descriptionEn,
        descriptionAr: resourceData.descriptionAr,
        resourceType: resourceData.typeId ? {
          connect: { id: parseInt(resourceData.typeId) }
        } : {
          connect: { id: 1 } // Default to first resource type if none specified
        },
        category: resourceData.categoryId && resourceData.categoryId !== '' ? {
          connect: { id: parseInt(resourceData.categoryId) }
        } : undefined,
        url: resourceData.url,
        downloadCount: 0,
        dueDate: resourceData.dueDate,
        isRequired: resourceData.isRequired !== undefined ? resourceData.isRequired : false,
        isActive: resourceData.isActive !== undefined ? resourceData.isActive : true,
        featured: resourceData.featured !== undefined ? resourceData.featured : false,
        program: resourceData.programId ? {
          connect: { id: parseInt(resourceData.programId) }
        } : undefined,
        subject: resourceData.subjectId ? {
          connect: { id: parseInt(resourceData.subjectId) }
        } : undefined,
        class: resourceData.classId ? {
          connect: { id: parseInt(resourceData.classId) }
        } : undefined,
        creator: {
          connect: { id: createdBy }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        subject: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Resources DB] ✅ Created resource in ${executionTime}ms`);
    
    return {
      success: true,
      data: newResource,
      message: 'Resource created successfully'
    };
    
  } catch (error) {
    console.error('[Resources DB] ❌ Error creating resource:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create resource';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Update resource in PostgreSQL database
 * 
 * @param {number|string} resourceId - Resource ID
 * @param {Object} updateData - Resource data to update
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateResource = async (resourceId, updateData, user = null) => {
  try {
    console.log(`[Resources DB] Updating resource: ${resourceId}`);
    
    const startTime = Date.now();
    
    // Prepare update data
    const data = {};
    
    // Only include fields that are provided
    if (updateData.titleEn !== undefined) data.titleEn = updateData.titleEn;
    if (updateData.titleAr !== undefined) data.titleAr = updateData.titleAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.url !== undefined) data.url = updateData.url;
    if (updateData.typeId !== undefined) {
      data.resourceType = updateData.typeId ? {
        connect: { id: parseInt(updateData.typeId) }
      } : {
        disconnect: true
      };
    }
    if (updateData.categoryId !== undefined) {
      data.category = updateData.categoryId ? {
        connect: { id: parseInt(updateData.categoryId) }
      } : {
        disconnect: true
      };
    }
    if (updateData.dueDate !== undefined) data.dueDate = updateData.dueDate;
    if (updateData.isRequired !== undefined) data.isRequired = updateData.isRequired;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updateData.featured !== undefined) data.featured = updateData.featured;
    if (updateData.programId !== undefined) {
      data.program = updateData.programId ? {
        connect: { id: parseInt(updateData.programId) }
      } : {
        disconnect: true
      };
    }
    if (updateData.subjectId !== undefined) {
      data.subject = updateData.subjectId ? {
        connect: { id: parseInt(updateData.subjectId) }
      } : {
        disconnect: true
      };
    }
    if (updateData.classId !== undefined) {
      data.class = updateData.classId ? {
        connect: { id: parseInt(updateData.classId) }
      } : {
        disconnect: true
      };
    }
    
    const updatedResource = await prisma.resource.update({
      where: { id: parseInt(resourceId) },
      data,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        },
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        subject: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        category: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        resourceType: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            program: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            },
            subject: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Resources DB] ✅ Updated resource in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedResource,
      message: 'Resource updated successfully'
    };
    
  } catch (error) {
    console.error('[Resources DB] ❌ Error updating resource:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to update resource';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Delete resource from PostgreSQL database
 * 
 * @param {number|string} resourceId - Resource ID
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteResource = async (resourceId, user = null) => {
  try {
    console.log(`[Resources DB] Deleting resource: ${resourceId}`);
    
    const startTime = Date.now();
    
    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id: parseInt(resourceId) }
    });
    
    if (!existingResource) {
      return {
        success: false,
        error: 'Resource not found',
        data: null
      };
    }
    
    // Delete the resource (no dependencies to check)
    await prisma.resource.delete({
      where: { id: parseInt(resourceId) }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Resources DB] ✅ Deleted resource in ${executionTime}ms`);
    
    return {
      success: true,
      data: { id: parseInt(resourceId) },
      message: 'Resource deleted successfully'
    };
    
  } catch (error) {
    console.error('[Resources DB] ❌ Error deleting resource:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to delete resource';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Get resources by class ID
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getResourcesByClass = async (classId, params = {}) => {
  try {
    console.log(`[Resources DB] Getting resources for class: ${classId}`);
    
    return await getResources({
      ...params,
      classId
    });
    
  } catch (error) {
    console.error('[Resources DB] ❌ Error getting resources by class:', error);
    
    return {
      success: false,
      error: 'Failed to retrieve resources for class',
      data: []
    };
  }
};

export default {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getResourcesByClass
};
