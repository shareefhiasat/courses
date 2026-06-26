/**
 * Priority Types Database Service
 * Handles database operations for priority types
 */

import prisma from './prismaClient.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';


/**
 * Get all priority types
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAllPriorityTypes = async (params = {}) => {
  try {
    console.log('[PriorityTypes DB] Getting priority types with params:', params);
    
    const startTime = Date.now();
    
    const priorityTypes = await prisma.priorityTypes.findMany({
      where: {
        isActive: true,
        ...params
      },
      orderBy: {
        level: 'asc'
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[PriorityTypes DB] ✅ Retrieved ${priorityTypes.length} priority types in ${duration}ms`);
    
    return {
      success: true,
      data: priorityTypes,
      total: priorityTypes.length,
      page: 1,
      limit: 50,
      totalPages: 1
    };
  } catch (error) {
    console.error('[PriorityTypes DB] Error getting priority types:', error);
    return {
      success: false,
      error: error.message || 'Failed to get priority types',
      data: null
    };
  }
};

/**
 * Get priority type by ID
 * @param {number} id - Priority type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getPriorityTypeById = async (id) => {
  try {
    const priorityType = await prisma.priorityTypes.findUnique({
      where: { id: parseInt(id) },
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
        }
      }
    });
    
    if (!priorityType) {
      return {
        success: false,
        error: 'Priority type not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: priorityType
    };
  } catch (error) {
    console.error('[PriorityTypes DB] Error getting priority type by ID:', error);
    return {
      success: false,
      error: error.message || 'Failed to get priority type',
      data: null
    };
  }
};

/**
 * Create new priority type
 * @param {Object} priorityTypeData - Priority type data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createPriorityType = async (priorityTypeData, user = null) => {
  try {
    const newPriorityType = await prisma.priorityTypes.create({
      data: {
        code: priorityTypeData.code,
        nameEn: priorityTypeData.nameEn,
        nameAr: priorityTypeData.nameAr,
        description: priorityTypeData.description,
        sortOrder: priorityTypeData.sortOrder || 0,
        isActive: priorityTypeData.isActive !== undefined ? priorityTypeData.isActive : true,
        createdBy: 1, // Default to admin user
        updatedBy: 1
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
        }
      }
    });
    
    return {
      success: true,
      data: newPriorityType
    };
  } catch (error) {
    console.error('[PriorityTypes DB] Error creating priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to create priority type',
      data: null
    };
  }
};

/**
 * Update priority type
 * @param {number} id - Priority type ID
 * @param {Object} updateData - Update data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updatePriorityType = async (id, updateData, user = null) => {
  try {
    const updatedPriorityType = await prisma.priorityTypes.update({
      where: { id: parseInt(id) },
      data: {
        code: updateData.code,
        nameEn: updateData.nameEn,
        nameAr: updateData.nameAr,
        description: updateData.description,
        sortOrder: updateData.sortOrder,
        isActive: updateData.isActive,
        updatedBy: 1
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
        }
      }
    });
    
    return {
      success: true,
      data: updatedPriorityType
    };
  } catch (error) {
    console.error('[PriorityTypes DB] Error updating priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to update priority type',
      data: null
    };
  }
};

/**
 * Delete priority type (soft delete)
 * @param {number} id - Priority type ID
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deletePriorityType = async (id, user = null) => {
  try {
    const deletedPriorityType = await prisma.priorityTypes.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
        updatedBy: 1
      }
    });
    
    return {
      success: true,
      data: deletedPriorityType
    };
  } catch (error) {
    console.error('[PriorityTypes DB] Error deleting priority type:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete priority type',
      data: null
    };
  }
};
