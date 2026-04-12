/**
 * Target Audience Types Database Service
 * 
 * PURPOSE: Database operations for target audience types using PostgreSQL
 * ARCHITECTURE: Business Services → Database Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { isPrismaError, getPrismaErrorMessage } from '../constants/prisma-errors.js';

const prisma = new PrismaClient();

/**
 * Get all target audience types
 */
export const getTargetAudienceTypes = async (params = {}) => {
  const startTime = Date.now();
  
  try {
    const { page = 1, limit = 50, isActive = true } = params;
    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;
    
    // Build where clause
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    // Execute query
    const targetAudienceTypes = await prisma.targetAudienceType.findMany({
      where,
      orderBy: { nameEn: 'asc' },
      skip,
      take: limitNum,
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
    
    // Get total count
    const total = await prisma.targetAudienceType.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[TargetAudienceTypes DB] ✅ Retrieved ${targetAudienceTypes.length} target audience types in ${executionTime}ms`);
    
    return {
      success: true,
      data: targetAudienceTypes,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[TargetAudienceTypes DB] ❌ Error getting target audience types:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve target audience types';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Get target audience type by ID
 */
export const getTargetAudienceTypeById = async (targetAudienceTypeId) => {
  const startTime = Date.now();
  
  try {
    const targetAudienceType = await prisma.targetAudienceType.findUnique({
      where: { id: parseInt(targetAudienceTypeId) },
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
        announcements: {
          select: {
            id: true,
            titleEn: true,
            titleAr: true,
            isActive: true,
            createdAt: true
          },
          take: 5 // Just show sample announcements
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[TargetAudienceTypes DB] ✅ Retrieved target audience type in ${executionTime}ms`);
    
    if (!targetAudienceType) {
      return {
        success: false,
        error: 'Target audience type not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: targetAudienceType
    };
    
  } catch (error) {
    console.error('[TargetAudienceTypes DB] ❌ Error getting target audience type:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve target audience type';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Create new target audience type
 */
export const createTargetAudienceType = async (targetAudienceTypeData, createdBy) => {
  const startTime = Date.now();
  
  try {
    const newTargetAudienceType = await prisma.targetAudienceType.create({
      data: {
        code: targetAudienceTypeData.code,
        nameEn: targetAudienceTypeData.nameEn,
        nameAr: targetAudienceTypeData.nameAr || null,
        description: targetAudienceTypeData.description || null,
        isActive: targetAudienceTypeData.isActive !== undefined ? targetAudienceTypeData.isActive : true,
        createdBy: createdBy,
        updatedBy: createdBy
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
    
    const executionTime = Date.now() - startTime;
    console.log(`[TargetAudienceTypes DB] ✅ Created target audience type in ${executionTime}ms`);
    
    return {
      success: true,
      data: newTargetAudienceType
    };
    
  } catch (error) {
    console.error('[TargetAudienceTypes DB] ❌ Error creating target audience type:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create target audience type';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Update target audience type
 */
export const updateTargetAudienceType = async (targetAudienceTypeId, updateData, updatedBy) => {
  const startTime = Date.now();
  
  try {
    const data = { ...updateData };
    data.updatedBy = updatedBy;
    data.updatedAt = new Date();
    
    const updatedTargetAudienceType = await prisma.targetAudienceType.update({
      where: { id: parseInt(targetAudienceTypeId) },
      data,
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
    
    const executionTime = Date.now() - startTime;
    console.log(`[TargetAudienceTypes DB] ✅ Updated target audience type in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedTargetAudienceType
    };
    
  } catch (error) {
    console.error('[TargetAudienceTypes DB] ❌ Error updating target audience type:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to update target audience type';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Delete target audience type (soft delete)
 */
export const deleteTargetAudienceType = async (targetAudienceTypeId) => {
  const startTime = Date.now();
  
  try {
    // Check if target audience type is being used by announcements
    const announcementsCount = await prisma.announcement.count({
      where: { targetAudienceId: parseInt(targetAudienceTypeId) }
    });
    
    if (announcementsCount > 0) {
      return {
        success: false,
        error: `Cannot delete target audience type. It is being used by ${announcementsCount} announcements.`,
        data: null
      };
    }
    
    const deletedTargetAudienceType = await prisma.targetAudienceType.delete({
      where: { id: parseInt(targetAudienceTypeId) }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[TargetAudienceTypes DB] ✅ Deleted target audience type in ${executionTime}ms`);
    
    return {
      success: true,
      data: deletedTargetAudienceType
    };
    
  } catch (error) {
    console.error('[TargetAudienceTypes DB] ❌ Error deleting target audience type:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to delete target audience type';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

export default {
  getTargetAudienceTypes,
  getTargetAudienceTypeById,
  createTargetAudienceType,
  updateTargetAudienceType,
  deleteTargetAudienceType
};
