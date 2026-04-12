/**
 * Requirement Types Database Service
 * 
 * PURPOSE: Database operations for requirement types using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all requirement types from PostgreSQL database
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
export const getRequirementTypes = async (params = {}) => {
  try {
    console.log('[RequirementTypes DB] Getting requirement types with params:', params);
    
    const startTime = Date.now();
    
    // Extract query parameters
    const {
      page = 1,
      limit = 50,
      search = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    // Build order clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const [requirementTypes, total] = await Promise.all([
      prisma.requirementTypes.findMany({
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
              email: true
            }
          },
          updater: {
            select: {
              id: true,
              displayName: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.requirementTypes.count({ where })
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[RequirementTypes DB] ✅ Retrieved ${requirementTypes.length} requirement types in ${duration}ms`);
    
    return {
      success: true,
      data: requirementTypes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
    
  } catch (error) {
    console.error('[RequirementTypes DB] ❌ Error getting requirement types:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to retrieve requirement types'
    };
  }
};

/**
 * Get requirement type by ID
 * 
 * @param {number} id - Requirement type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getRequirementTypeById = async (id) => {
  try {
    console.log('[RequirementTypes DB] Getting requirement type by ID:', id);
    
    const startTime = Date.now();
    
    const requirementType = await prisma.requirementTypes.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        subjects: {
          select: {
            id: true,
            code: true,
            nameEn: true
          }
        }
      }
    });
    
    const duration = Date.now() - startTime;
    
    if (!requirementType) {
      console.log(`[RequirementTypes DB] ❌ Requirement type not found: ${id}`);
      return {
        success: false,
        error: 'Requirement type not found',
        code: 'NOT_FOUND'
      };
    }
    
    console.log(`[RequirementTypes DB] ✅ Retrieved requirement type in ${duration}ms`);
    
    return {
      success: true,
      data: requirementType
    };
    
  } catch (error) {
    console.error('[RequirementTypes DB] ❌ Error getting requirement type by ID:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to retrieve requirement type'
    };
  }
};

/**
 * Create new requirement type
 * 
 * @param {Object} data - Requirement type data
 * @param {string} data.code - Requirement type code
 * @param {string} data.nameEn - Requirement type name in English
 * @param {string} data.nameAr - Requirement type name in Arabic (optional)
 * @param {string} data.description - Description (optional)
 * @param {boolean} data.isActive - Active status
 * @param {number} data.createdBy - User ID who created it
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createRequirementType = async (data) => {
  try {
    console.log('[RequirementTypes DB] Creating requirement type:', data);
    
    const startTime = Date.now();
    
    const { code, nameEn, nameAr, description, isActive = true, createdBy } = data;
    
    // Check if code already exists
    const existing = await prisma.requirementTypes.findUnique({
      where: { code }
    });
    
    if (existing) {
      return {
        success: false,
        error: 'Requirement type code already exists',
        code: 'DUPLICATE_CODE'
      };
    }
    
    const requirementType = await prisma.requirementTypes.create({
      data: {
        code,
        nameEn,
        nameAr,
        description,
        isActive,
        createdBy: createdBy ? parseInt(createdBy) : null
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[RequirementTypes DB] ✅ Created requirement type in ${duration}ms`);
    
    return {
      success: true,
      data: requirementType,
      message: 'Requirement type created successfully'
    };
    
  } catch (error) {
    console.error('[RequirementTypes DB] ❌ Error creating requirement type:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create requirement type'
    };
  }
};

/**
 * Update requirement type
 * 
 * @param {number} id - Requirement type ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateRequirementType = async (id, data) => {
  try {
    console.log('[RequirementTypes DB] Updating requirement type:', id, data);
    
    const startTime = Date.now();
    
    const { code, nameEn, nameAr, description, isActive, updatedBy } = data;
    
    // Check if requirement type exists
    const existing = await prisma.requirementTypes.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existing) {
      return {
        success: false,
        error: 'Requirement type not found',
        code: 'NOT_FOUND'
      };
    }
    
    // Check if new code conflicts with existing
    if (code && code !== existing.code) {
      const codeConflict = await prisma.requirementTypes.findUnique({
        where: { code }
      });
      
      if (codeConflict) {
        return {
          success: false,
          error: 'Requirement type code already exists',
          code: 'DUPLICATE_CODE'
        };
      }
    }
    
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (updatedBy !== undefined) updateData.updatedBy = parseInt(updatedBy);
    
    const requirementType = await prisma.requirementTypes.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[RequirementTypes DB] ✅ Updated requirement type in ${duration}ms`);
    
    return {
      success: true,
      data: requirementType,
      message: 'Requirement type updated successfully'
    };
    
  } catch (error) {
    console.error('[RequirementTypes DB] ❌ Error updating requirement type:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to update requirement type'
    };
  }
};

/**
 * Delete requirement type (soft delete)
 * 
 * @param {number} id - Requirement type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteRequirementType = async (id) => {
  try {
    console.log('[RequirementTypes DB] Deleting requirement type:', id);
    
    const startTime = Date.now();
    
    // Check if requirement type exists
    const existing = await prisma.requirementTypes.findUnique({
      where: { id: parseInt(id) },
      include: {
        subjects: true
      }
    });
    
    if (!existing) {
      return {
        success: false,
        error: 'Requirement type not found',
        code: 'NOT_FOUND'
      };
    }
    
    // Check if requirement type is being used by subjects
    if (existing.subjects.length > 0) {
      return {
        success: false,
        error: 'Cannot delete requirement type that is being used by subjects',
        code: 'HAS_DEPENDENCIES'
      };
    }
    
    const requirementType = await prisma.requirementTypes.delete({
      where: { id: parseInt(id) }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[RequirementTypes DB] ✅ Deleted requirement type in ${duration}ms`);
    
    return {
      success: true,
      data: requirementType,
      message: 'Requirement type deleted successfully'
    };
    
  } catch (error) {
    console.error('[RequirementTypes DB] ❌ Error deleting requirement type:', error);
    
    if (isPrismaError(error)) {
      const errorMessage = getPrismaErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
        code: error.code
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to delete requirement type'
    };
  }
};
