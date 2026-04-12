/**
 * Classes Database Service
 * 
 * PURPOSE: Database operations for classes using PostgreSQL
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
    console.error('[Classes DB] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Get all classes from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with classes data
 */
export const getClasses = async (params = {}) => {
  try {
    console.log('[Classes DB] Getting classes with params:', params);
    
    const startTime = Date.now();
    
    const {
      page = 1,
      limit = 50,
      search = '',
      programId = '',
      subjectId = '',
      instructorId = '',
      term = '',
      year = '',
      isActive = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build where clause
    const where = { isActive: true }; // Default to active records only
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (programId) {
      where.programId = parseInt(programId);
    }
    
    if (subjectId) {
      where.subjectId = parseInt(subjectId);
    }
    
    if (instructorId) {
      where.instructorId = parseInt(instructorId);
    }
    
    if (term) {
      where.term = term;
    }
    
    if (year) {
      where.year = year;
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
    const classes = await prisma.class.findMany({
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
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        subject: {
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
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    // Get total count
    const total = await prisma.class.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Classes DB] ✅ Retrieved ${classes.length} classes in ${executionTime}ms`);
    
    return {
      success: true,
      data: classes,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[Classes DB] ❌ Error getting classes:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve classes';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Get class by ID from PostgreSQL database
 * 
 * @param {number|string} classId - Class ID
 * @returns {Promise<Object>} - Result object with class data
 */
export const getClassById = async (classId) => {
  try {
    console.log(`[Classes DB] Getting class by ID: ${classId}`);
    
    const startTime = Date.now();
    
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
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
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        subject: {
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
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Classes DB] ✅ Retrieved class in ${executionTime}ms`);
    
    if (!classData) {
      return {
        success: false,
        error: 'Class not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: classData
    };
    
  } catch (error) {
    console.error('[Classes DB] ❌ Error getting class by ID:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve class';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Create new class in PostgreSQL database
 * 
 * @param {Object} classData - Class data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createClass = async (classData, user = null) => {
  try {
    console.log(`[Classes DB] Creating new class: ${classData.code || classData.nameEn}`);
    
    const startTime = Date.now();
    
    // Get user ID for audit trail
    let createdBy = 1; // Default to admin user
    
    if (user && user.id) {
      createdBy = user.id;
    } else {
      // Try to find an existing user or create a default one
      const defaultUser = await prisma.user.findFirst({ 
        where: { email: 'admin@milmanylms.com' } 
      });
      if (defaultUser) {
        createdBy = defaultUser.id;
      } else {
        // Find the ADMIN role (should exist from seed)
        const adminRole = await prisma.userRoles.findFirst({ 
          where: { code: 'ADMIN' } 
        });
        
        if (!adminRole) {
          throw new Error('ADMIN role not found. Please run: pnpm db:seed:roles');
        }
        
        const newAdmin = await prisma.user.create({
          data: {
            displayName: 'System Administrator',
            firstName: 'System',
            lastName: 'Administrator',
            email: 'admin@milmanylms.com',
            roleId: adminRole.id
          }
        });
        createdBy = newAdmin.id;
      }
    }
    
    const newClass = await prisma.class.create({
      data: {
        code: classData.code,
        nameEn: classData.nameEn,
        nameAr: classData.nameAr,
        descriptionEn: classData.descriptionEn,
        descriptionAr: classData.descriptionAr,
        maxCapacity: classData.maxCapacity,
        isActive: classData.isActive !== undefined ? classData.isActive : true,
        programId: classData.programId,
        subjectId: classData.subjectId,
        instructorId: classData.instructorId || null,
        createdBy: await getDatabaseUserId(user) || createdBy,
        updatedBy: await getDatabaseUserId(user) || createdBy,
        // Add new fields
        term: classData.term || null,
        year: classData.year || null,
        locationEn: classData.locationEn || null,
        locationAr: classData.locationAr || null,
        ownerEmail: classData.ownerEmail || null
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
        },
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        subject: {
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
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Classes DB] ✅ Created class in ${executionTime}ms`);
    
    return {
      success: true,
      data: newClass,
      message: 'Class created successfully'
    };
    
  } catch (error) {
    console.error('[Classes DB] ❌ Error creating class:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create class';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Update class in PostgreSQL database
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} updateData - Class data to update
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateClass = async (classId, updateData, user = null) => {
  try {
    console.log(`[Classes DB] Updating class: ${classId}`);
    
    const startTime = Date.now();
    
    // Prepare update data
    const data = {};
    
    // Only include fields that are provided
    if (updateData.code !== undefined) data.code = updateData.code;
    if (updateData.nameEn !== undefined) data.nameEn = updateData.nameEn;
    if (updateData.nameAr !== undefined) data.nameAr = updateData.nameAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.maxCapacity !== undefined) data.maxCapacity = updateData.maxCapacity;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updateData.programId !== undefined) data.programId = updateData.programId;
    if (updateData.subjectId !== undefined) data.subjectId = updateData.subjectId;
    if (updateData.instructorId !== undefined) data.instructorId = updateData.instructorId;
    
    // Add disabledStudents field
    if (updateData.disabledStudents !== undefined) data.disabledStudents = updateData.disabledStudents;
    
    // Add new fields
    if (updateData.term !== undefined) data.term = updateData.term;
    if (updateData.year !== undefined) data.year = updateData.year;
    if (updateData.locationEn !== undefined) data.locationEn = updateData.locationEn;
    if (updateData.locationAr !== undefined) data.locationAr = updateData.locationAr;
    if (updateData.ownerEmail !== undefined) data.ownerEmail = updateData.ownerEmail;
    
    // Add audit trail
    const dbUserId = await getDatabaseUserId(user);
    data.updatedBy = dbUserId || 1;
    
    const updatedClass = await prisma.class.update({
      where: { id: parseInt(classId) },
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
        },
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        subject: {
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
            displayName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Classes DB] ✅ Updated class in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedClass,
      message: 'Class updated successfully'
    };
    
  } catch (error) {
    console.error('[Classes DB] ❌ Error updating class:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to update class';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Delete class from PostgreSQL database
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteClass = async (classId, user = null) => {
  try {
    console.log(`[Classes DB] Deleting class: ${classId}`);
    
    const startTime = Date.now();
    
    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    });
    
    if (!existingClass) {
      return {
        success: false,
        error: 'Class not found',
        data: null
      };
    }
    
    // Check if class has any dependencies (enrollments, activities, attendances)
    const enrollmentCount = await prisma.enrollment.count({
      where: { classId: parseInt(classId) }
    });
    
    const activityCount = await prisma.activity.count({
      where: { classId: parseInt(classId) }
    });
    
    const attendanceCount = await prisma.attendance.count({
      where: { classId: parseInt(classId) }
    });
    
    if (enrollmentCount > 0 || activityCount > 0 || attendanceCount > 0) {
      return {
        success: false,
        error: 'Cannot delete class with existing enrollments, activities, or attendances',
        data: null
      };
    }
    
    // Delete the class
    await prisma.class.delete({
      where: { id: parseInt(classId) }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Classes DB] ✅ Deleted class in ${executionTime}ms`);
    
    return {
      success: true,
      data: { id: parseInt(classId) },
      message: 'Class deleted successfully'
    };
    
  } catch (error) {
    console.error('[Classes DB] ❌ Error deleting class:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to delete class';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Get classes by program ID
 * 
 * @param {number|string} programId - Program ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getClassesByProgram = async (programId, params = {}) => {
  try {
    console.log(`[Classes DB] Getting classes for program: ${programId}`);
    
    return await getClasses({
      ...params,
      programId
    });
    
  } catch (error) {
    console.error('[Classes DB] ❌ Error getting classes by program:', error);
    
    return {
      success: false,
      error: 'Failed to retrieve classes for program',
      data: []
    };
  }
};

/**
 * Get classes by subject ID
 * 
 * @param {number|string} subjectId - Subject ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getClassesBySubject = async (subjectId, params = {}) => {
  try {
    console.log(`[Classes DB] Getting classes for subject: ${subjectId}`);
    
    return await getClasses({
      ...params,
      subjectId
    });
    
  } catch (error) {
    console.error('[Classes DB] ❌ Error getting classes by subject:', error);
    
    return {
      success: false,
      error: 'Failed to retrieve classes for subject',
      data: []
    };
  }
};

/**
 * Get classes by instructor ID
 * 
 * @param {number|string} instructorId - Instructor ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getClassesByInstructor = async (instructorId, params = {}) => {
  try {
    console.log(`[Classes DB] Getting classes for instructor: ${instructorId}`);
    
    return await getClasses({
      ...params,
      instructorId
    });
    
  } catch (error) {
    console.error('[Classes DB] ❌ Error getting classes by instructor:', error);
    
    return {
      success: false,
      error: 'Failed to retrieve classes for instructor',
      data: []
    };
  }
};

export default {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassesByProgram,
  getClassesBySubject,
  getClassesByInstructor
};
