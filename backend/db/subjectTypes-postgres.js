/**
 * Subject Types Database Service
 * 
 * PURPOSE: Database operations for subject types using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all subject types from PostgreSQL database
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
export const getSubjectTypes = async (params = {}) => {
  try {
    console.log('[SubjectTypes DB] Getting subject types with params:', params);
    
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
    const [subjectTypes, total] = await Promise.all([
      prisma.subjectTypes.findMany({
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
      prisma.subjectTypes.count({ where })
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[SubjectTypes DB] ✅ Retrieved ${subjectTypes.length} subject types in ${duration}ms`);
    
    return {
      success: true,
      data: subjectTypes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
    
  } catch (error) {
    console.error('[SubjectTypes DB] ❌ Error getting subject types:', error);
    
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
      error: error.message || 'Failed to retrieve subject types'
    };
  }
};

/**
 * Get subject type by ID
 * 
 * @param {number} id - Subject type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getSubjectTypeById = async (id) => {
  try {
    console.log('[SubjectTypes DB] Getting subject type by ID:', id);
    
    const startTime = Date.now();
    
    const subjectType = await prisma.subjectTypes.findUnique({
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
    
    if (!subjectType) {
      console.log(`[SubjectTypes DB] ❌ Subject type not found: ${id}`);
      return {
        success: false,
        error: 'Subject type not found',
        code: 'NOT_FOUND'
      };
    }
    
    console.log(`[SubjectTypes DB] ✅ Retrieved subject type in ${duration}ms`);
    
    return {
      success: true,
      data: subjectType
    };
    
  } catch (error) {
    console.error('[SubjectTypes DB] ❌ Error getting subject type by ID:', error);
    
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
      error: error.message || 'Failed to retrieve subject type'
    };
  }
};

/**
 * Create new subject type
 * 
 * @param {Object} data - Subject type data
 * @param {string} data.code - Subject type code
 * @param {string} data.nameEn - Subject type name in English
 * @param {string} data.nameAr - Subject type name in Arabic (optional)
 * @param {string} data.description - Description (optional)
 * @param {boolean} data.isActive - Active status
 * @param {number} data.createdBy - User ID who created it
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createSubjectType = async (data) => {
  try {
    console.log('[SubjectTypes DB] Creating subject type:', data);
    
    const startTime = Date.now();
    
    const { code, nameEn, nameAr, description, isActive = true, createdBy } = data;
    
    // Check if code already exists
    const existing = await prisma.subjectTypes.findUnique({
      where: { code }
    });
    
    if (existing) {
      return {
        success: false,
        error: 'Subject type code already exists',
        code: 'DUPLICATE_CODE'
      };
    }
    
    const subjectType = await prisma.subjectTypes.create({
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
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            email: true
          }
        }
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[SubjectTypes DB] ✅ Created subject type in ${duration}ms`);
    
    return {
      success: true,
      data: subjectType,
      message: 'Subject type created successfully'
    };
    
  } catch (error) {
    console.error('[SubjectTypes DB] ❌ Error creating subject type:', error);
    
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
      error: error.message || 'Failed to create subject type'
    };
  }
};

/**
 * Update subject type
 * 
 * @param {number} id - Subject type ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateSubjectType = async (id, data) => {
  try {
    console.log('[SubjectTypes DB] Updating subject type:', id, data);
    
    const startTime = Date.now();
    
    const { code, nameEn, nameAr, description, isActive, updatedBy } = data;
    
    // Check if subject type exists
    const existing = await prisma.subjectTypes.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existing) {
      return {
        success: false,
        error: 'Subject type not found',
        code: 'NOT_FOUND'
      };
    }
    
    // Check if new code conflicts with existing
    if (code && code !== existing.code) {
      const codeConflict = await prisma.subjectTypes.findUnique({
        where: { code }
      });
      
      if (codeConflict) {
        return {
          success: false,
          error: 'Subject type code already exists',
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
    
    const subjectType = await prisma.subjectTypes.update({
      where: { id: parseInt(id) },
      data: updateData,
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
    
    const duration = Date.now() - startTime;
    console.log(`[SubjectTypes DB] ✅ Updated subject type in ${duration}ms`);
    
    return {
      success: true,
      data: subjectType,
      message: 'Subject type updated successfully'
    };
    
  } catch (error) {
    console.error('[SubjectTypes DB] ❌ Error updating subject type:', error);
    
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
      error: error.message || 'Failed to update subject type'
    };
  }
};

/**
 * Delete subject type (soft delete)
 * 
 * @param {number} id - Subject type ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteSubjectType = async (id) => {
  try {
    console.log('[SubjectTypes DB] Deleting subject type:', id);
    
    const startTime = Date.now();
    
    // Check if subject type exists
    const existing = await prisma.subjectTypes.findUnique({
      where: { id: parseInt(id) },
      include: {
        subjects: true
      }
    });
    
    if (!existing) {
      return {
        success: false,
        error: 'Subject type not found',
        code: 'NOT_FOUND'
      };
    }
    
    // Check if subject type is being used by subjects
    if (existing.subjects.length > 0) {
      return {
        success: false,
        error: 'Cannot delete subject type that is being used by subjects',
        code: 'HAS_DEPENDENCIES'
      };
    }
    
    const subjectType = await prisma.subjectTypes.delete({
      where: { id: parseInt(id) }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[SubjectTypes DB] ✅ Deleted subject type in ${duration}ms`);
    
    return {
      success: true,
      data: subjectType,
      message: 'Subject type deleted successfully'
    };
    
  } catch (error) {
    console.error('[SubjectTypes DB] ❌ Error deleting subject type:', error);
    
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
      error: error.message || 'Failed to delete subject type'
    };
  }
};
