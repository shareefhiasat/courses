/**
 * Category Types Database Service
 * 
 * PURPOSE: Database operations for category types using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all category types from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.search - Search term for name/code
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.sortBy - Sort field (default: createdAt)
 * @param {string} params.sortOrder - Sort order (default: desc)
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getCategoryTypes = async (params = {}) => {
  try {
    console.log('[CategoryTypes DB] Getting category types with params:', params);
    
    const startTime = Date.now();
    
    const {
      page = 1,
      limit = 50,
      search = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    const where = { isActive: true }; // Default to active records only
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Allow overriding isActive filter if explicitly provided
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [categoryTypes, total] = await Promise.all([
      prisma.categoryTypes.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
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
      }),
      prisma.categoryTypes.count({ where })
    ]);

    const duration = Date.now() - startTime;
    console.log(`[CategoryTypes DB] ✅ Retrieved ${categoryTypes.length} category types in ${duration}ms`);
    
    return {
      success: true,
      data: categoryTypes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('[CategoryTypes DB] ❌ Error getting category types:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get a single category type by ID
 * 
 * @param {number} id - Category type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getCategoryTypeById = async (id) => {
  try {
    console.log('[CategoryTypes DB] Getting category type by ID:', id);
    
    const categoryType = await prisma.categoryTypes.findUnique({
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
    
    if (!categoryType) {
      return {
        success: false,
        error: 'Category type not found'
      };
    }
    
    return {
      success: true,
      data: categoryType
    };
  } catch (error) {
    console.error('[CategoryTypes DB] ❌ Error getting category type by ID:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a new category type
 * 
 * @param {Object} data - Category type data
 * @param {number} userId - User ID creating the category type
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createCategoryType = async (data, userId) => {
  try {
    console.log('[CategoryTypes DB] Creating category type:', data);
    
    const categoryType = await prisma.categoryTypes.create({
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameAr: data.nameAr || null,
        descriptionEn: data.descriptionEn || null,
        descriptionAr: data.descriptionAr || null,
        icon: data.icon || null,
        color: data.color || null,
        isActive: data.isActive !== false,
        createdBy: parseInt(userId)
      },
      include: {
        creator: {
          select: {
            id: true,
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
    
    console.log('[CategoryTypes DB] ✅ Category type created:', categoryType.id);
    
    return {
      success: true,
      data: categoryType
    };
  } catch (error) {
    console.error('[CategoryTypes DB] ❌ Error creating category type:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update an existing category type
 * 
 * @param {number} id - Category type ID
 * @param {Object} data - Category type data to update
 * @param {number} userId - User ID updating the category type
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateCategoryType = async (id, data, userId) => {
  try {
    console.log('[CategoryTypes DB] Updating category type:', id, data);
    
    const categoryType = await prisma.categoryTypes.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.nameEn && { nameEn: data.nameEn }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
        ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedBy: parseInt(userId)
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
    
    console.log('[CategoryTypes DB] ✅ Category type updated:', categoryType.id);
    
    return {
      success: true,
      data: categoryType
    };
  } catch (error) {
    console.error('[CategoryTypes DB] ❌ Error updating category type:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a category type (soft delete - set isActive to false)
 * 
 * @param {number} id - Category type ID
 * @returns {Promise<Object>} - Result object with success status
 */
export const deleteCategoryType = async (id) => {
  try {
    console.log('[CategoryTypes DB] Deleting category type:', id);
    
    await prisma.categoryTypes.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
    
    console.log('[CategoryTypes DB] ✅ Category type deleted:', id);
    
    return {
      success: true,
      data: { id: parseInt(id) }
    };
  } catch (error) {
    console.error('[CategoryTypes DB] ❌ Error deleting category type:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Hard delete a category type
 * 
 * @param {number} id - Category type ID
 * @returns {Promise<Object>} - Result object with success status
 */
export const hardDeleteCategoryType = async (id) => {
  try {
    console.log('[CategoryTypes DB] Hard deleting category type:', id);
    
    await prisma.categoryTypes.delete({
      where: { id: parseInt(id) }
    });
    
    console.log('[CategoryTypes DB] ✅ Category type hard deleted:', id);
    
    return {
      success: true,
      data: { id: parseInt(id) }
    };
  } catch (error) {
    console.error('[CategoryTypes DB] ❌ Error hard deleting category type:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getCategoryTypes,
  getCategoryTypeById,
  createCategoryType,
  updateCategoryType,
  deleteCategoryType,
  hardDeleteCategoryType
};
