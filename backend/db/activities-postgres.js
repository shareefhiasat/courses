/**
 * Activities Database Service
 * 
 * PURPOSE: Database operations for activities using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import prisma from './prismaClient.js';
import { getDatabaseUserId } from '../utils/database/userResolver.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';


/**
 * Get all activities from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with activities data
 */
export const getActivities = async (params = {}) => {
  try {
    console.log('[Activities DB] Getting activities with params:', params);
    
    const startTime = Date.now();
    
    const {
      page = 1,
      limit = 50,
      search = '',
      classId = '',
      typeId = '',
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
        { descriptionAr: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (classId) {
      where.classId = parseInt(classId);
    }
    
    if (typeId) {
      where.typeId = parseInt(typeId);
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
    const activities = await prisma.activity.findMany({
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
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        type: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });
    
    // Get total count
    const total = await prisma.activity.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Activities DB] ✅ Retrieved ${activities.length} activities in ${executionTime}ms`);
    
    return {
      success: true,
      data: activities,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[Activities DB] ❌ Error getting activities:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve activities';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Get activity by ID from PostgreSQL database
 * 
 * @param {number|string} activityId - Activity ID
 * @returns {Promise<Object>} - Result object with activity data
 */
export const getActivityById = async (activityId) => {
  try {
    console.log(`[Activities DB] Getting activity by ID: ${activityId}`);
    
    const startTime = Date.now();
    
    const activity = await prisma.activity.findUnique({
      where: { id: parseInt(activityId) },
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
        },
        type: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Activities DB] ✅ Retrieved activity in ${executionTime}ms`);
    
    if (!activity) {
      return {
        success: false,
        error: 'Activity not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: activity
    };
    
  } catch (error) {
    console.error('[Activities DB] ❌ Error getting activity by ID:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve activity';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Create new activity in PostgreSQL database
 * 
 * @param {Object} activityData - Activity data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createActivity = async (activityData, user = null) => {
  try {
    console.log(`[Activities DB] Creating new activity: ${activityData.titleEn || activityData.titleAr}`);
    
    const startTime = Date.now();
    
    // Get user ID for audit trail - resolve Keycloak UUID to numeric DB user ID
    const createdBy = await getDatabaseUserId(user) || 1;
    
    const newActivity = await prisma.activity.create({
      data: {
        titleEn: activityData.titleEn,
        titleAr: activityData.titleAr,
        descriptionEn: activityData.descriptionEn,
        descriptionAr: activityData.descriptionAr,
        typeId: activityData.typeId,
        dueDate: activityData.dueDate ? new Date(activityData.dueDate) : null,
        maxScore: activityData.maxScore,
        weight: activityData.weight || 1.0,
        imageUrl: activityData.imageUrl,
        link: activityData.link,
        quizId: activityData.quizId,
        allowRetake: activityData.allowRetake || false,
        isActive: activityData.isActive !== undefined ? activityData.isActive : true,
        classId: activityData.classId,
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
        },
        type: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Activities DB] ✅ Created activity in ${executionTime}ms`);
    
    return {
      success: true,
      data: newActivity,
      message: 'Activity created successfully'
    };
    
  } catch (error) {
    console.error('[Activities DB] ❌ Error creating activity:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create activity';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Update activity in PostgreSQL database
 * 
 * @param {number|string} activityId - Activity ID
 * @param {Object} updateData - Activity data to update
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateActivity = async (activityId, updateData, user = null) => {
  try {
    console.log(`[Activities DB] Updating activity: ${activityId}`);
    
    const startTime = Date.now();
    
    // Prepare update data
    const data = {};
    
    // Only include fields that are provided
    if (updateData.titleEn !== undefined) data.titleEn = updateData.titleEn;
    if (updateData.titleAr !== undefined) data.titleAr = updateData.titleAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.typeId !== undefined) data.typeId = updateData.typeId;
    if (updateData.dueDate !== undefined) data.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    if (updateData.maxScore !== undefined) data.maxScore = updateData.maxScore;
    if (updateData.weight !== undefined) data.weight = updateData.weight;
    if (updateData.imageUrl !== undefined) data.imageUrl = updateData.imageUrl;
    if (updateData.link !== undefined) data.link = updateData.link;
    if (updateData.quizId !== undefined) data.quizId = updateData.quizId;
    if (updateData.allowRetake !== undefined) data.allowRetake = updateData.allowRetake;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updateData.classId !== undefined) data.classId = updateData.classId;
    
    // Add audit trail - resolve Keycloak UUID to numeric DB user ID
    const dbUserId = await getDatabaseUserId(user);
    data.updatedBy = dbUserId || 1;
    
    // Check if activity exists first
    const existingActivity = await prisma.activity.findUnique({
      where: { id: parseInt(activityId) },
      select: { id: true }
    });
    
    let updatedActivity;
    if (existingActivity) {
      // Update existing activity
      updatedActivity = await prisma.activity.update({
        where: { id: parseInt(activityId) },
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
          },
          type: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          }
        }
      });
    } else {
      // Activity doesn't exist - create it instead
      data.createdBy = dbUserId || 1;
      data.id = parseInt(activityId);
      updatedActivity = await prisma.activity.create({
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
          },
          type: {
            select: {
              id: true,
              code: true,
              nameEn: true,
              nameAr: true
            }
          }
        }
      });
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`[Activities DB] ✅ Updated activity in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedActivity,
      message: existingActivity ? 'Activity updated successfully' : 'Activity created successfully'
    };
    
  } catch (error) {
    console.error('[Activities DB] ❌ Error updating activity:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to update activity';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Delete activity from PostgreSQL database
 * 
 * @param {number|string} activityId - Activity ID
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteActivity = async (activityId, user = null) => {
  try {
    console.log(`[Activities DB] Deleting activity: ${activityId}`);
    
    const startTime = Date.now();
    
    // Check if activity exists
    const existingActivity = await prisma.activity.findUnique({
      where: { id: parseInt(activityId) }
    });
    
    if (!existingActivity) {
      return {
        success: false,
        error: 'Activity not found',
        data: null
      };
    }
    
    // Check if activity has any submissions
    const submissionCount = await prisma.submission.count({
      where: { activityId: parseInt(activityId) }
    });
    
    if (submissionCount > 0) {
      return {
        success: false,
        error: 'Cannot delete activity with existing submissions',
        data: null
      };
    }
    
    // Delete the activity
    await prisma.activity.delete({
      where: { id: parseInt(activityId) }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Activities DB] ✅ Deleted activity in ${executionTime}ms`);
    
    return {
      success: true,
      data: { id: parseInt(activityId) },
      message: 'Activity deleted successfully'
    };
    
  } catch (error) {
    console.error('[Activities DB] ❌ Error deleting activity:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to delete activity';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Get activities by class ID
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getActivitiesByClass = async (classId, params = {}) => {
  try {
    console.log(`[Activities DB] Getting activities for class: ${classId}`);
    
    return await getActivities({
      ...params,
      classId
    });
    
  } catch (error) {
    console.error('[Activities DB] ❌ Error getting activities by class:', error);
    
    return {
      success: false,
      error: 'Failed to retrieve activities for class',
      data: []
    };
  }
};

export default {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitiesByClass
};
