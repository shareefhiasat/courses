/**
 * Admin Scopes Database Service
 * 
 * PURPOSE: Database operations for admin scopes using PostgreSQL
 * ARCHITECTURE: Controllers → DB Services → PostgreSQL
 */

import prisma from './prismaClient.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';


/**
 * Get all admin scopes from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with admin scopes data
 */
export const getAdminScopes = async (params = {}) => {
  try {
    console.log('[AdminScopes DB] Getting admin scopes with params:', params);
    
    const {
      page = 1,
      limit = 50,
      userId = '',
      scopeType = '',
      programId = '',
      classroomId = '',
      instructorUserId = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (userId) {
      where.userId = parseInt(userId);
    }
    
    if (scopeType) {
      where.scopeType = scopeType;
    }
    
    if (programId) {
      where.programId = parseInt(programId);
    }
    
    if (classroomId) {
      where.classroomId = parseInt(classroomId);
    }
    
    if (instructorUserId) {
      where.instructorUserId = parseInt(instructorUserId);
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [scopes, total] = await Promise.all([
      prisma.adminScope.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
            }
          },
          program: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          },
          classroom: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          },
          instructor: {
            select: {
              id: true,
              email: true,
              firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
            }
          }
        }
      }),
      prisma.adminScope.count({ where })
    ]);
    
    return {
      success: true,
      data: scopes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    console.error('[AdminScopes DB] Error getting admin scopes:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Get admin scope by ID
 * 
 * @param {number} id - Admin scope ID
 * @returns {Promise<Object>} - Result object with admin scope data
 */
export const getAdminScopeById = async (id) => {
  try {
    console.log('[AdminScopes DB] Getting admin scope by ID:', id);
    
    const scope = await prisma.adminScope.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        instructor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        }
      }
    });
    
    if (!scope) {
      return {
        success: false,
        error: 'Admin scope not found',
        code: 'NOT_FOUND'
      };
    }
    
    return {
      success: true,
      data: scope
    };
  } catch (error) {
    console.error('[AdminScopes DB] Error getting admin scope by ID:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Get admin scopes by user ID
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result object with admin scopes data
 */
export const getAdminScopesByUserId = async (userId) => {
  try {
    console.log('[AdminScopes DB] Getting admin scopes by user ID:', userId);
    
    const scopes = await prisma.adminScope.findMany({
      where: {
        userId: parseInt(userId),
        isActive: true
      },
      include: {
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        instructor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: scopes
    };
  } catch (error) {
    console.error('[AdminScopes DB] Error getting admin scopes by user ID:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Create a new admin scope
 * 
 * @param {Object} data - Admin scope data
 * @returns {Promise<Object>} - Result object with created admin scope
 */
export const createAdminScope = async (data) => {
  try {
    console.log('[AdminScopes DB] Creating admin scope:', data);
    
    const scope = await prisma.adminScope.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        instructor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: scope
    };
  } catch (error) {
    console.error('[AdminScopes DB] Error creating admin scope:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Update an admin scope
 * 
 * @param {number} id - Admin scope ID
 * @param {Object} data - Updated admin scope data
 * @returns {Promise<Object>} - Result object with updated admin scope
 */
export const updateAdminScope = async (id, data) => {
  try {
    console.log('[AdminScopes DB] Updating admin scope:', id, data);
    
    const scope = await prisma.adminScope.update({
      where: { id: parseInt(id) },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        },
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        instructor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        }
      }
    });
    
    return {
      success: true,
      data: scope
    };
  } catch (error) {
    console.error('[AdminScopes DB] Error updating admin scope:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Delete an admin scope
 * 
 * @param {number} id - Admin scope ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteAdminScope = async (id) => {
  try {
    console.log('[AdminScopes DB] Deleting admin scope:', id);
    
    await prisma.adminScope.delete({
      where: { id: parseInt(id) }
    });
    
    return {
      success: true,
      message: 'Admin scope deleted successfully'
    };
  } catch (error) {
    console.error('[AdminScopes DB] Error deleting admin scope:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Check if user has admin scope for a specific resource
 * 
 * @param {number} userId - User ID
 * @param {string} scopeType - Scope type (PROGRAM, CLASSROOM, INSTRUCTOR)
 * @param {number|null} programId - Program ID (for PROGRAM scope)
 * @param {number|null} classroomId - Classroom ID (for CLASSROOM scope)
 * @param {number|null} instructorUserId - Instructor user ID (for INSTRUCTOR scope)
 * @returns {Promise<boolean>} - True if user has scope
 */
export const checkUserAdminScope = async (userId, scopeType, programId = null, classroomId = null, instructorUserId = null) => {
  try {
    const where = {
      userId: parseInt(userId),
      scopeType,
      isActive: true
    };
    
    if (scopeType === 'PROGRAM' && programId) {
      where.programId = parseInt(programId);
    } else if (scopeType === 'CLASSROOM' && classroomId) {
      where.classroomId = parseInt(classroomId);
    } else if (scopeType === 'INSTRUCTOR' && instructorUserId) {
      where.instructorUserId = parseInt(instructorUserId);
    }
    
    const scope = await prisma.adminScope.findFirst({ where });
    
    return !!scope;
  } catch (error) {
    console.error('[AdminScopes DB] Error checking user admin scope:', error);
    return false;
  }
};

/**
 * Get user's effective admin scope (union of all scopes)
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Result object with effective scope
 */
export const getUserEffectiveScope = async (userId) => {
  try {
    const scopes = await prisma.adminScope.findMany({
      where: {
        userId: parseInt(userId),
        isActive: true
      },
      include: {
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        instructor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            displayNameAr: true,
            displayName: true
          }
        }
      }
    });
    
    // Build effective scope (union)
    const effectiveScope = {
      programIds: new Set(),
      classroomIds: new Set(),
      instructorUserIds: new Set()
    };
    
    for (const scope of scopes) {
      if (scope.scopeType === 'PROGRAM' && scope.programId) {
        effectiveScope.programIds.add(scope.programId);
      } else if (scope.scopeType === 'CLASSROOM' && scope.classroomId) {
        effectiveScope.classroomIds.add(scope.classroomId);
      } else if (scope.scopeType === 'INSTRUCTOR' && scope.instructorUserId) {
        effectiveScope.instructorUserIds.add(scope.instructorUserId);
      }
    }
    
    return {
      success: true,
      data: {
        programIds: Array.from(effectiveScope.programIds),
        classroomIds: Array.from(effectiveScope.classroomIds),
        instructorUserIds: Array.from(effectiveScope.instructorUserIds),
        scopes
      }
    };
  } catch (error) {
    console.error('[AdminScopes DB] Error getting user effective scope:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }
};
