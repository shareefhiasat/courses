/**
 * Participations Database Service
 * 
 * PURPOSE: Database operations for participations using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';
import { USER_NAME_SELECT_WITH_ID } from '../utils/userNameFields.js';

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
    console.error('[Participations DB] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Get all participations with filtering and pagination
 * 
 * @param {object} params - Query parameters
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Participations data
 */
export const getAllParticipations = async (params = {}, user = null) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      classId,
      programId,
      subjectId,
      typeId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      isActive: true
    };

    if (userId) where.userId = parseInt(userId);
    if (classId) where.classId = parseInt(classId);
    if (programId) where.programId = parseInt(programId);
    if (subjectId) where.subjectId = parseInt(subjectId);
    if (typeId) where.typeId = parseInt(typeId);

    // Build order clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get participations with related data
    const [participations, total] = await Promise.all([
      prisma.participation.findMany({
        where,
        include: {
          user: {
            select: USER_NAME_SELECT_WITH_ID
          },
          class: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true
            }
          },
          participationType: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true,
              isPositive: true
            }
          },
          creator: {
            select: USER_NAME_SELECT_WITH_ID
          },
          updater: {
            select: USER_NAME_SELECT_WITH_ID
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.participation.count({ where })
    ]);

    return {
      success: true,
      data: participations,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };
  } catch (error) {
    console.error('[Participations DB] Error getting participations:', error);
    
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
      error: 'Failed to retrieve participations',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Get participation by ID
 * 
 * @param {number} id - Participation ID
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Participation data
 */
export const getParticipationById = async (id, user = null) => {
  try {
    const participation = await prisma.participation.findFirst({
      where: {
        id: parseInt(id),
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        participationType: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            isPositive: true
          }
        },
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
        }
      }
    });

    if (!participation) {
      return {
        success: false,
        error: 'Participation not found',
        code: 'NOT_FOUND'
      };
    }

    return {
      success: true,
      data: participation
    };
  } catch (error) {
    console.error('[Participations DB] Error getting participation by ID:', error);
    
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
      error: 'Failed to retrieve participation',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Create new participation
 * 
 * @param {object} participationData - Participation data
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Created participation
 */
export const createParticipation = async (participationData, user = null) => {
  try {
    const creatorId = await getDatabaseUserId(user);
    
    const {
      userId,
      classId,
      programId,
      subjectId,
      typeId,
      points,
      descriptionEn,
      descriptionAr,
      comment
    } = participationData;

    // Validate required fields
    if (!userId || !typeId) {
      return {
        success: false,
        error: 'User ID and Type ID are required',
        code: 'VALIDATION_ERROR'
      };
    }

    const participation = await prisma.participation.create({
      data: {
        userId: parseInt(userId),
        classId: classId ? parseInt(classId) : null,
        programId: programId ? parseInt(programId) : null,
        subjectId: subjectId ? parseInt(subjectId) : null,
        typeId: parseInt(typeId),
        points: points ? parseInt(points) : 0,
        descriptionEn: descriptionEn || null,
        descriptionAr: descriptionAr || null,
        comment: comment || null,
        createdBy: creatorId || 1, // Default to system user if no creator
        updatedBy: creatorId || 1
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        participationType: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            isPositive: true
          }
        },
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
        }
      }
    });

    return {
      success: true,
      data: participation,
      message: 'Participation created successfully'
    };
  } catch (error) {
    console.error('[Participations DB] Error creating participation:', error);
    
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
      error: 'Failed to create participation',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Update participation
 * 
 * @param {number} id - Participation ID
 * @param {object} updateData - Update data
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Updated participation
 */
export const updateParticipation = async (id, updateData, user = null) => {
  try {
    const updaterId = await getDatabaseUserId(user);
    
    const participationId = parseInt(id);
    
    // Check if participation exists
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        id: participationId,
        isActive: true
      }
    });

    if (!existingParticipation) {
      return {
        success: false,
        error: 'Participation not found',
        code: 'NOT_FOUND'
      };
    }

    const {
      points,
      descriptionEn,
      descriptionAr,
      comment,
      isActive
    } = updateData;

    const participation = await prisma.participation.update({
      where: { id: participationId },
      data: {
        points: points !== undefined ? parseInt(points) : undefined,
        descriptionEn: descriptionEn !== undefined ? descriptionEn : undefined,
        descriptionAr: descriptionAr !== undefined ? descriptionAr : undefined,
        comment: comment !== undefined ? comment : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedBy: updaterId || 1
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true
          }
        },
        participationType: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            isPositive: true
          }
        },
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
        }
      }
    });

    return {
      success: true,
      data: participation,
      message: 'Participation updated successfully'
    };
  } catch (error) {
    console.error('[Participations DB] Error updating participation:', error);
    
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
      error: 'Failed to update participation',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Delete participation (soft delete)
 * 
 * @param {number} id - Participation ID
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Delete result
 */
export const deleteParticipation = async (id, user = null) => {
  try {
    const updaterId = await getDatabaseUserId(user);
    const participationId = parseInt(id);
    
    // Check if participation exists
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        id: participationId,
        isActive: true
      }
    });

    if (!existingParticipation) {
      return {
        success: false,
        error: 'Participation not found',
        code: 'NOT_FOUND'
      };
    }

    // Soft delete by setting isActive to false
    await prisma.participation.update({
      where: { id: participationId },
      data: {
        isActive: false,
        updatedBy: updaterId || 1
      }
    });

    return {
      success: true,
      message: 'Participation deleted successfully'
    };
  } catch (error) {
    console.error('[Participations DB] Error deleting participation:', error);
    
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
      error: 'Failed to delete participation',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Get participations by student ID
 * 
 * @param {number} studentId - Student ID
 * @param {object} params - Query parameters
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Student participations
 */
export const getParticipationsByStudent = async (studentId, params = {}, user = null) => {
  return getAllParticipations({ ...params, userId: studentId }, user);
};

/**
 * Get participations by class ID
 * 
 * @param {number} classId - Class ID
 * @param {object} params - Query parameters
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Class participations
 */
export const getParticipationsByClass = async (classId, params = {}, user = null) => {
  return getAllParticipations({ ...params, classId }, user);
};

/**
 * Get participation statistics for a student
 * 
 * @param {number} studentId - Student ID
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Student participation stats
 */
export const getStudentParticipationStats = async (studentId, user = null) => {
  try {
    const stats = await prisma.participation.groupBy({
      by: ['typeId'],
      where: {
        userId: parseInt(studentId),
        isActive: true
      },
      _count: {
        id: true
      },
      _sum: {
        points: true
      }
    });

    // Get participation types for classification
    let participationTypes = [];
    if (stats.length > 0) {
      participationTypes = await prisma.participationTypes.findMany({
        where: {
          id: { in: stats.map(s => s.typeId) },
          isActive: true
        },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          isPositive: true
        }
      });
    }

    // Combine stats with type information
    const detailedStats = stats.map(stat => {
      const typeInfo = participationTypes.find(t => t.id === stat.typeId);
      return {
        typeId: stat.typeId,
        typeName: typeInfo?.nameEn || 'Unknown',
        typeNameAr: typeInfo?.nameAr || 'غير معروف',
        isPositive: typeInfo?.isPositive || false,
        count: stat._count.id,
        totalPoints: stat._sum.points || 0
      };
    });

    // Calculate totals
    const totalParticipations = detailedStats.reduce((sum, s) => sum + s.count, 0);
    const totalPoints = detailedStats.reduce((sum, s) => sum + s.totalPoints, 0);
    const positiveCount = detailedStats.filter(s => s.isPositive).reduce((sum, s) => sum + s.count, 0);
    const negativeCount = detailedStats.filter(s => !s.isPositive).reduce((sum, s) => sum + s.count, 0);

    return {
      success: true,
      data: {
        totalParticipations,
        totalPoints,
        positiveCount,
        negativeCount,
        breakdown: detailedStats
      }
    };
  } catch (error) {
    console.error('[Participations DB] Error getting student stats:', error);
    
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
      error: 'Failed to retrieve student statistics',
      code: 'DATABASE_ERROR'
    };
  }
};

/**
 * Get participation statistics for a class
 * 
 * @param {number} classId - Class ID
 * @param {object} user - User object from request
 * @returns {Promise<object>} - Class participation stats
 */
export const getClassParticipationStats = async (classId, user = null) => {
  try {
    const stats = await prisma.participation.groupBy({
      by: ['typeId'],
      where: {
        classId: parseInt(classId),
        isActive: true
      },
      _count: {
        id: true
      },
      _sum: {
        points: true
      }
    });

    // Get participation types for classification
    let participationTypes = [];
    if (stats.length > 0) {
      participationTypes = await prisma.participationTypes.findMany({
        where: {
          id: { in: stats.map(s => s.typeId) },
          isActive: true
        },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          isPositive: true
        }
      });
    }

    // Combine stats with type information
    const detailedStats = stats.map(stat => {
      const typeInfo = participationTypes.find(t => t.id === stat.typeId);
      return {
        typeId: stat.typeId,
        typeName: typeInfo?.nameEn || 'Unknown',
        typeNameAr: typeInfo?.nameAr || 'غير معروف',
        isPositive: typeInfo?.isPositive || false,
        count: stat._count.id,
        totalPoints: stat._sum.points || 0
      };
    });

    // Calculate totals
    const totalParticipations = detailedStats.reduce((sum, s) => sum + s.count, 0);
    const totalPoints = detailedStats.reduce((sum, s) => sum + s.totalPoints, 0);
    const positiveCount = detailedStats.filter(s => s.isPositive).reduce((sum, s) => sum + s.count, 0);
    const negativeCount = detailedStats.filter(s => !s.isPositive).reduce((sum, s) => sum + s.count, 0);

    return {
      success: true,
      data: {
        totalParticipations,
        totalPoints,
        positiveCount,
        negativeCount,
        breakdown: detailedStats
      }
    };
  } catch (error) {
    console.error('[Participations DB] Error getting class stats:', error);
    
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
      error: 'Failed to retrieve class statistics',
      code: 'DATABASE_ERROR'
    };
  }
};

export default {
  getAllParticipations,
  getParticipationById,
  createParticipation,
  updateParticipation,
  deleteParticipation,
  getParticipationsByStudent,
  getParticipationsByClass,
  getStudentParticipationStats,
  getClassParticipationStats
};
