/**
 * Participation Types Database Service
 * 
 * PURPOSE: Database operations for participation types using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

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
    console.error('[ParticipationTypes DB] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Get all participation types
 * 
 * @param {object} params - Query parameters
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Participation types data
 */
export const getAllParticipationTypes = async (params = {}, user = null) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      isActive: true
    };

    // Build order clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get participation types
    const [participationTypes, total] = await Promise.all([
      prisma.participationTypes.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          },
          updater: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          },
          _count: {
            select: {
              participations: true
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.participationTypes.count({ where })
    ]);

    return {
      success: true,
      data: participationTypes,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };
  } catch (error) {
    console.error('[ParticipationTypes DB] Error getting participation types:', error);
    
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
      error: 'Failed to retrieve participation types',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Get participation type by ID
 * 
 * @param {number} id - Participation type ID
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Participation type data
 */
export const getParticipationTypeById = async (id, user = null) => {
  try {
    const participationType = await prisma.participationTypes.findFirst({
      where: {
        id: parseInt(id),
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        _count: {
          select: {
            participations: true
          }
        }
      }
    });

    if (!participationType) {
      return {
        success: false,
        error: 'Participation type not found',
        code: 'NOT_FOUND'
      };
    }

    return {
      success: true,
      data: participationType
    };
  } catch (error) {
    console.error('[ParticipationTypes DB] Error getting participation type by ID:', error);
    
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
      error: 'Failed to retrieve participation type',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Create new participation type
 * 
 * @param {object} participationTypeData - Participation type data
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Created participation type
 */
export const createParticipationType = async (participationTypeData, user = null) => {
  try {
    const creatorId = await getDatabaseUserId(user);
    
    const {
      code,
      nameEn,
      nameAr,
      description,
      isPositive
    } = participationTypeData;

    // Validate required fields
    if (!code || !nameEn) {
      return {
        success: false,
        error: 'Code and Name (English) are required',
        code: 'VALIDATION_ERROR'
      };
    }

    // Check if code already exists
    const existingType = await prisma.participationTypes.findUnique({
      where: { code }
    });

    if (existingType) {
      return {
        success: false,
        error: 'Participation type with this code already exists',
        code: 'DUPLICATE_CODE'
      };
    }

    const participationType = await prisma.participationTypes.create({
      data: {
        code,
        nameEn,
        nameAr: nameAr || null,
        description: description || null,
        isPositive: isPositive !== undefined ? isPositive : true,
        createdBy: creatorId || 1, // Default to system user if no creator
        updatedBy: creatorId || 1
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        _count: {
          select: {
            participations: true
          }
        }
      }
    });

    return {
      success: true,
      data: participationType,
      message: 'Participation type created successfully'
    };
  } catch (error) {
    console.error('[ParticipationTypes DB] Error creating participation type:', error);
    
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
      error: 'Failed to create participation type',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Update participation type
 * 
 * @param {number} id - Participation type ID
 * @param {object} updateData - Update data
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Updated participation type
 */
export const updateParticipationType = async (id, updateData, user = null) => {
  try {
    const updaterId = await getDatabaseUserId(user);
    const participationTypeId = parseInt(id);
    
    // Check if participation type exists
    const existingParticipationType = await prisma.participationTypes.findFirst({
      where: {
        id: participationTypeId,
        isActive: true
      }
    });

    if (!existingParticipationType) {
      return {
        success: false,
        error: 'Participation type not found',
        code: 'NOT_FOUND'
      };
    }

    const {
      nameEn,
      nameAr,
      description,
      isPositive,
      isActive
    } = updateData;

    const participationType = await prisma.participationTypes.update({
      where: { id: participationTypeId },
      data: {
        nameEn: nameEn !== undefined ? nameEn : undefined,
        nameAr: nameAr !== undefined ? nameAr : undefined,
        description: description !== undefined ? description : undefined,
        isPositive: isPositive !== undefined ? isPositive : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedBy: updaterId || 1
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        updater: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        _count: {
          select: {
            participations: true
          }
        }
      }
    });

    return {
      success: true,
      data: participationType,
      message: 'Participation type updated successfully'
    };
  } catch (error) {
    console.error('[ParticipationTypes DB] Error updating participation type:', error);
    
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
      error: 'Failed to update participation type',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Delete participation type (soft delete)
 * 
 * @param {number} id - Participation type ID
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Delete result
 */
export const deleteParticipationType = async (id, user = null) => {
  try {
    const updaterId = await getDatabaseUserId(user);
    const participationTypeId = parseInt(id);
    
    // Check if participation type exists
    const existingParticipationType = await prisma.participationTypes.findFirst({
      where: {
        id: participationTypeId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            participations: true
          }
        }
      }
    });

    if (!existingParticipationType) {
      return {
        success: false,
        error: 'Participation type not found',
        code: 'NOT_FOUND'
      };
    }

    // Check if participation type is in use
    if (existingParticipationType._count.participations > 0) {
      return {
        success: false,
        error: 'Cannot delete participation type that is in use',
        code: 'IN_USE'
      };
    }

    // Soft delete by setting isActive to false
    await prisma.participationTypes.update({
      where: { id: participationTypeId },
      data: {
        isActive: false,
        updatedBy: updaterId || 1
      }
    });

    return {
      success: true,
      message: 'Participation type deleted successfully'
    };
  } catch (error) {
    console.error('[ParticipationTypes DB] Error deleting participation type:', error);
    
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
      error: 'Failed to delete participation type',
      code: 'DATABASE_ERROR'
    };
  }
};

export default {
  getAllParticipationTypes,
  getParticipationTypeById,
  createParticipationType,
  updateParticipationType,
  deleteParticipationType
};
