/**
 * Enrollments Database Service
 * 
 * PURPOSE: Database operations for enrollments using PostgreSQL
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
    console.error('[Enrollments DB] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Get default enrollment status ID
 * 
 * @returns {Promise<number>} - Default status ID
 */
const getDefaultStatusId = async () => {
  try {
    const defaultStatus = await prisma.enrollmentStatusTypes.findFirst({
      where: { code: 'ACTIVE' }
    });
    
    if (defaultStatus) return defaultStatus.id;
    
    // If no ACTIVE status, create it
    const newStatus = await prisma.enrollmentStatusTypes.create({
      data: {
        code: 'ACTIVE',
        nameEn: 'Active',
        nameAr: 'نشط'
      }
    });
    
    return newStatus.id;
  } catch (error) {
    console.error('[Enrollments DB] Error getting default status ID:', error);
    throw error;
  }
};

/**
 * Get all enrollments from PostgreSQL database
 * 
 * @param {object} params - Query parameters
 * @returns {Promise<object>} - Result object with enrollments data
 */
const getEnrollments = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[Enrollments DB] Getting enrollments with params:', params);
    
    const {
      page = 1,
      limit = 20,
      search,
      userId,
      classId,
      programId,
      subjectId,
      statusId,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = params;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { user: { displayName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { class: { nameEn: { contains: search, mode: 'insensitive' } } },
        { class: { code: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (userId) where.userId = parseInt(userId);
    if (classId) where.classId = parseInt(classId);
    if (programId) where.programId = parseInt(programId);
    if (subjectId) where.subjectId = parseInt(subjectId);
    if (statusId) where.statusId = parseInt(statusId);
    
    // Build order clause
    const orderByClause = {};
    orderByClause[orderBy] = orderDirection;
    
    // Get total count
    const total = await prisma.enrollment.count({ where });
    
    // Get paginated results with relationships
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        subject: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limitNum
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Enrollments DB] ✅ Retrieved ${enrollments.length} enrollments in ${duration}ms`);
    
    return { 
      success: true, 
      data: enrollments, 
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Enrollments DB] ❌ Error getting enrollments after ${duration}ms:`, error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to retrieve enrollments',
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Get enrollment by ID from PostgreSQL database
 * 
 * @param {number} id - Enrollment ID
 * @returns {Promise<object>} - Result object with enrollment data
 */
const getEnrollmentById = async (id) => {
  const startTime = Date.now();
  try {
    console.log(`[Enrollments DB] Getting enrollment by ID: ${id}`);
    
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        subject: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });
    
    if (!enrollment) {
      return {
        success: false,
        error: 'Enrollment not found',
        code: 'NOT_FOUND'
      };
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Enrollments DB] ✅ Retrieved enrollment in ${duration}ms`);
    
    return { success: true, data: enrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Enrollments DB] ❌ Error getting enrollment by ID after ${duration}ms:`, error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to retrieve enrollment',
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Create new enrollment in PostgreSQL database
 * 
 * @param {object} enrollmentData - Enrollment data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with created enrollment
 */
const create = async (enrollmentData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[Enrollments DB] Creating new enrollment:', enrollmentData);
    
    // Validate required fields
    const requiredFields = ['studentId', 'programId', 'subjectId', 'classId'];
    const missingFields = requiredFields.filter(field => !enrollmentData[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR'
      };
    }
    
    // Get or create default status
    const statusId = enrollmentData.statusId || await getDefaultStatusId();
    
    // Get database user ID for createdBy and updatedBy
    let createdBy = await getDatabaseUserId(user);
    let updatedBy = createdBy;
    
    // If no user found, use default admin user
    if (!createdBy) {
      const defaultUser = await prisma.user.findFirst({ 
        where: { email: 'admin@milmanylms.com' } 
      });
      if (defaultUser) {
        createdBy = defaultUser.id;
        updatedBy = defaultUser.id;
      } else {
        // Create default admin user if not exists
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
            isActive: true,
            roleId: adminRole.id
          }
        });
        createdBy = newAdmin.id;
        updatedBy = newAdmin.id;
      }
    }
    
    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classId: {
          userId: parseInt(enrollmentData.studentId),
          classId: parseInt(enrollmentData.classId)
        }
      }
    });
    
    if (existingEnrollment) {
      return {
        success: false,
        error: 'Enrollment already exists for this user and class',
        code: 'DUPLICATE_ENROLLMENT'
      };
    }
    
    // Validate that the class, program, and subject exist
    const [classExists, programExists, subjectExists] = await Promise.all([
      prisma.class.findUnique({ where: { id: parseInt(enrollmentData.classId) } }),
      prisma.program.findUnique({ where: { id: parseInt(enrollmentData.programId) } }),
      prisma.subject.findUnique({ where: { id: parseInt(enrollmentData.subjectId) } })
    ]);
    
    if (!classExists) {
      return {
        success: false,
        error: 'Class not found',
        code: 'CLASS_NOT_FOUND'
      };
    }
    
    if (!programExists) {
      return {
        success: false,
        error: 'Program not found',
        code: 'PROGRAM_NOT_FOUND'
      };
    }
    
    if (!subjectExists) {
      return {
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      };
    }
    
    // Create enrollment
    const newEnrollment = await prisma.enrollment.create({
      data: {
        userId: parseInt(enrollmentData.studentId),
        programId: parseInt(enrollmentData.programId),
        subjectId: parseInt(enrollmentData.subjectId),
        classId: parseInt(enrollmentData.classId),
        statusId: statusId,
        createdBy: createdBy,
        updatedBy: updatedBy
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        subject: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Enrollments DB] ✅ Created enrollment in ${duration}ms`);
    
    return { success: true, data: newEnrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Enrollments DB] ❌ Error creating enrollment after ${duration}ms:`, error);
    
    if (isPrismaError(error)) {
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to create enrollment',
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Update enrollment in PostgreSQL database
 * 
 * @param {number} id - Enrollment ID
 * @param {object} updateData - Update data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with updated enrollment
 */
const update = async (id, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[Enrollments DB] Updating enrollment ${id}:`, updateData);
    
    // Get database user ID for updatedBy
    const updatedBy = await getDatabaseUserId(user);
    
    // Build update data
    const data = {
      ...updateData,
      updatedBy: updatedBy
    };
    
    // Convert IDs to integers if present
    if (data.statusId) data.statusId = parseInt(data.statusId);
    
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: parseInt(id) },
      data,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        class: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        program: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        subject: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            code: true
          }
        },
        status: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
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
    
    const duration = Date.now() - startTime;
    console.log(`[Enrollments DB] ✅ Updated enrollment in ${duration}ms`);
    
    return { success: true, data: updatedEnrollment };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Enrollments DB] ❌ Error updating enrollment after ${duration}ms:`, error);
    
    if (isPrismaError(error)) {
      if (error.code === 'P2025') {
        return {
          success: false,
          error: 'Enrollment not found',
          code: 'NOT_FOUND'
        };
      }
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to update enrollment',
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Delete enrollment from PostgreSQL database
 * 
 * @param {number} id - Enrollment ID
 * @returns {Promise<object>} - Result object
 */
const deleteEnrollment = async (id) => {
  const startTime = Date.now();
  try {
    console.log(`[Enrollments DB] Deleting enrollment ${id}`);
    
    // Check if enrollment exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEnrollment) {
      return {
        success: false,
        error: 'Enrollment not found',
        code: 'NOT_FOUND'
      };
    }
    
    await prisma.enrollment.delete({
      where: { id: parseInt(id) }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Enrollments DB] ✅ Deleted enrollment in ${duration}ms`);
    
    return { 
      success: true, 
      message: 'Enrollment deleted successfully' 
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Enrollments DB] ❌ Error deleting enrollment after ${duration}ms:`, error);
    
    if (isPrismaError(error)) {
      if (error.code === 'P2025') {
        return {
          success: false,
          error: 'Enrollment not found',
          code: 'NOT_FOUND'
        };
      }
      return {
        success: false,
        error: getPrismaErrorMessage(error),
        code: PRISMA_ERRORS[error.code] || 'DATABASE_ERROR'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to delete enrollment',
      code: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Get enrollments by student ID
 * 
 * @param {number} studentId - Student ID
 * @param {object} params - Query parameters
 * @returns {Promise<object>} - Result object with enrollments data
 */
const getEnrollmentsByStudent = async (studentId, params = {}) => {
  return getEnrollments({ ...params, userId: studentId });
};

export default {
  getEnrollments,
  getEnrollmentById,
  create,
  update,
  deleteEnrollment,
  getEnrollmentsByStudent
};
