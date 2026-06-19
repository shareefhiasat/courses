/**
 * Behaviors Database Service
 * 
 * PURPOSE: Database operations for behaviors using PostgreSQL
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
    console.error('[Behaviors DB] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Get all behaviors with pagination and filtering
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getBehaviors = async (params = {}) => {
  try {
    console.log('[Behaviors DB] Getting behaviors with params:', params);
    
    const startTime = Date.now();
    
    // Extract query parameters
    const {
      page = 1,
      limit = 50,
      search = '',
      classId = '',
      studentId = '',
      userId = '',
      typeId = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = { isActive: true }; // Default to active records only
    
    if (search) {
      where.OR = [
        { descriptionEn: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (classId) {
      where.classId = parseInt(classId);
    }
    
    if (studentId || userId) {
      where.userId = parseInt(studentId || userId);
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
    const behaviors = await prisma.behavior.findMany({
      where,
      orderBy: orderByClause,
      skip,
      take: limitNum,
      include: {
        user: {
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
        behaviorType: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            category: true,
            points: true,
            color: true
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
    
    // Get total count for pagination
    const total = await prisma.behavior.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Behaviors DB] ✅ Retrieved ${behaviors.length} behaviors in ${executionTime}ms`);
    
    return {
      success: true,
      data: behaviors,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    };
    
  } catch (error) {
    console.error('[Behaviors DB] ❌ Error getting behaviors:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        data: []
      };
    }
    
    return {
      success: false,
      error: 'Failed to retrieve behaviors',
      data: []
    };
  }
};

/**
 * Get behavior by ID
 * 
 * @param {number} id - Behavior ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getBehaviorById = async (id) => {
  try {
    console.log(`[Behaviors DB] Getting behavior by ID: ${id}`);
    
    const startTime = Date.now();
    
    const behavior = await prisma.behavior.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
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
        behaviorType: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            category: true,
            points: true,
            color: true
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
    
    const executionTime = Date.now() - startTime;
    console.log(`[Behaviors DB] ✅ Retrieved behavior in ${executionTime}ms`);
    
    if (!behavior) {
      return {
        success: false,
        error: 'Behavior not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: behavior
    };
    
  } catch (error) {
    console.error('[Behaviors DB] ❌ Error getting behavior by ID:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        data: null
      };
    }
    
    return {
      success: false,
      error: 'Failed to retrieve behavior',
      data: null
    };
  }
};

/**
 * Create new behavior
 * 
 * @param {Object} behaviorData - Behavior data
 * @param {Object} user - User object from request
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createBehavior = async (behaviorData, user = null) => {
  try {
    console.log('[Behaviors DB] Creating behavior:', behaviorData);
    
    const startTime = Date.now();
    
    const createdBy = await getDatabaseUserId(user);
    
    const newBehavior = await prisma.behavior.create({
      data: {
        userId: behaviorData.userId,
        classId: behaviorData.classId,
        programId: behaviorData.programId,
        subjectId: behaviorData.subjectId,
        typeId: behaviorData.typeId,
        points: behaviorData.points || 0,
        descriptionEn: behaviorData.descriptionEn,
        descriptionAr: behaviorData.descriptionAr,
        comment: behaviorData.comment,
        isActive: behaviorData.isActive !== undefined ? behaviorData.isActive : true,
        createdBy: createdBy || 1 // Default to admin if no user context
      },
      include: {
        user: {
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
        behaviorType: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            category: true,
            points: true,
            color: true
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
    
    const executionTime = Date.now() - startTime;
    console.log(`[Behaviors DB] ✅ Created behavior in ${executionTime}ms`);
    
    return {
      success: true,
      data: newBehavior,
      message: 'Behavior created successfully'
    };
    
  } catch (error) {
    console.error('[Behaviors DB] ❌ Error creating behavior:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        data: null
      };
    }
    
    return {
      success: false,
      error: 'Failed to create behavior',
      data: null
    };
  }
};

/**
 * Update behavior
 * 
 * @param {number} id - Behavior ID
 * @param {Object} updateData - Update data
 * @param {Object} user - User object from request
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateBehavior = async (id, updateData, user = null) => {
  try {
    console.log(`[Behaviors DB] Updating behavior ${id}:`, updateData);
    
    const startTime = Date.now();
    
    const updatedBy = await getDatabaseUserId(user);
    
    // Build update data object
    const data = {};
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.comment !== undefined) data.comment = updateData.comment;
    if (updateData.typeId !== undefined) data.typeId = updateData.typeId;
    if (updateData.points !== undefined) data.points = updateData.points;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updatedBy) data.updatedBy = updatedBy;
    
    const updatedBehavior = await prisma.behavior.update({
      where: { id: parseInt(id) },
      data,
      include: {
        user: {
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
        behaviorType: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            category: true,
            points: true,
            color: true
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
    
    const executionTime = Date.now() - startTime;
    console.log(`[Behaviors DB] ✅ Updated behavior in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedBehavior,
      message: 'Behavior updated successfully'
    };
    
  } catch (error) {
    console.error('[Behaviors DB] ❌ Error updating behavior:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        data: null
      };
    }
    
    return {
      success: false,
      error: 'Failed to update behavior',
      data: null
    };
  }
};

/**
 * Delete behavior (soft delete)
 * 
 * @param {number} id - Behavior ID
 * @param {Object} user - User object from request
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteBehavior = async (id, user = null) => {
  try {
    console.log(`[Behaviors DB] Deleting behavior ${id}`);
    
    const startTime = Date.now();
    
    const updatedBy = await getDatabaseUserId(user);
    
    const deletedBehavior = await prisma.behavior.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
        updatedBy: updatedBy || 1
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Behaviors DB] ✅ Deleted behavior in ${executionTime}ms`);
    
    return {
      success: true,
      data: deletedBehavior,
      message: 'Behavior deleted successfully'
    };
    
  } catch (error) {
    console.error('[Behaviors DB] ❌ Error deleting behavior:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        data: null
      };
    }
    
    return {
      success: false,
      error: 'Failed to delete behavior',
      data: null
    };
  }
};

/**
 * Get behaviors by student ID
 * 
 * @param {number} studentId - Student user ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getBehaviorsByStudent = async (studentId, params = {}) => {
  try {
    console.log(`[Behaviors DB] Getting behaviors for student: ${studentId}`);
    
    // Add student filter to params and reuse getBehaviors
    const enhancedParams = {
      ...params,
      studentId
    };
    
    return await getBehaviors(enhancedParams);
    
  } catch (error) {
    console.error('[Behaviors DB] ❌ Error getting behaviors by student:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        data: []
      };
    }
    
    return {
      success: false,
      error: 'Failed to retrieve student behaviors',
      data: []
    };
  }
};

/**
 * Get behaviors by class ID
 * 
 * @param {number} classId - Class ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getBehaviorsByClass = async (classId, params = {}) => {
  try {
    console.log(`[Behaviors DB] Getting behaviors for class: ${classId}`);
    
    // Add class filter to params and reuse getBehaviors
    const enhancedParams = {
      ...params,
      classId
    };
    
    return await getBehaviors(enhancedParams);
    
  } catch (error) {
    console.error('[Behaviors DB] ❌ Error getting behaviors by class:', error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        data: []
      };
    }
    
    return {
      success: false,
      error: 'Failed to retrieve class behaviors',
      data: []
    };
  }
};

export default {
  getBehaviors,
  getBehaviorById,
  createBehavior,
  updateBehavior,
  deleteBehavior,
  getBehaviorsByStudent,
  getBehaviorsByClass
};
