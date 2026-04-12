/**
 * Programs Database Service
 * 
 * PURPOSE: Database operations for programs using PostgreSQL
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
    console.error('[Programs DB] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Get all programs from PostgreSQL database
 * 
 * @param {object} params - Query parameters
 * @returns {Promise<object>} - Result object with programs data
 */
const getPrograms = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[Programs DB] Getting programs with params:', params);
    
    const {
      page = 1,
      limit = 20,
      search,
      status,
      orderBy = 'nameEn',
      orderDirection = 'asc'
    } = params;
    
    // Build where clause
    const where = { isActive: true }; // Default to active records only
    
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Allow overriding status filter if explicitly provided
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    
    // Build order clause
    const orderByClause = {};
    orderByClause[orderBy] = orderDirection;
    
    // Get total count
    const total = await prisma.program.count({ where });
    
    // Get paginated results with user relationships
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const programs = await prisma.program.findMany({
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
        }
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB] ✅ Retrieved ${programs.length} programs in ${duration}ms`);
    
    return {
      success: true,
      data: programs,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB] ❌ Error getting programs:', error);
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

/**
 * Get program by ID from PostgreSQL database
 * 
 * @param {string} programId - Program ID
 * @param {object} params - Additional parameters
 * @returns {Promise<object>} - Result object with program data
 */
const getProgramById = async (programId, params = {}) => {
  const startTime = Date.now();
  try {
    console.log(`[Programs DB] Getting program by ID: ${programId}`);
    
    const program = await prisma.program.findUnique({
      where: { id: parseInt(programId) },
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
    
    if (program) {
      console.log(`[Programs DB] ✅ Retrieved program in ${duration}ms`);
      return { success: true, data: program };
    } else {
      console.log(`[Programs DB] ⚠️ Program not found in ${duration}ms`);
      return { success: false, error: 'Program not found' };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB] ❌ Error getting program:', error);
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

/**
 * Create new program in PostgreSQL database
 * 
 * @param {object} programData - Program data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with created program
 */
const create = async (programData, user = null) => {
  const startTime = Date.now();
  try {
    console.log('[Programs DB] Creating new program:', programData.nameEn || 'unnamed');
    
    // Check for duplicate code
    const existingProgram = await prisma.program.findUnique({
      where: { code: programData.code }
    });
    
    if (existingProgram) {
      return { 
        success: false, 
        error: 'A program with this code already exists',
        duration: `${Date.now() - startTime}ms`
      };
    }
    
    // Get or create a default user for createdBy
    let createdBy = 1; // Default user ID
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
    
    const newProgram = await prisma.program.create({
      data: {
        code: programData.code,
        nameEn: programData.nameEn,
        nameAr: programData.nameAr,
        descriptionEn: programData.descriptionEn || programData.description, // Use descriptionEn or fallback
        descriptionAr: programData.descriptionAr, // Arabic description
        durationYears: programData.durationYears,
        minGPA: programData.minGPA,
        totalCreditHours: programData.totalCreditHours,
        isActive: programData.isActive,
        createdBy: await getDatabaseUserId(user) || createdBy,
        updatedBy: await getDatabaseUserId(user) || createdBy
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
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB] ✅ Created program in ${duration}ms`);
    
    return { success: true, data: newProgram };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB] ❌ Error creating program:', error);
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

/**
 * Update program in PostgreSQL database
 * 
 * @param {string} programId - Program ID
 * @param {object} updateData - Update data
 * @param {object} user - User object (optional)
 * @returns {Promise<object>} - Result object with updated program
 */
const update = async (programId, updateData, user = null) => {
  const startTime = Date.now();
  try {
    console.log(`[Programs DB] Updating program: ${programId}`);
    
    // Check for duplicate code (if code is being updated)
    if (updateData.code) {
      const existingProgram = await prisma.program.findFirst({
        where: { 
          code: updateData.code,
          id: { not: parseInt(programId) }
        }
      });
      
      if (existingProgram) {
        return { 
          success: false, 
          error: 'A program with this code already exists',
          duration: `${Date.now() - startTime}ms`
        };
      }
    }
    
    const updatedProgram = await prisma.program.update({
      where: { id: parseInt(programId) },
      data: {
        code: updateData.code,
        nameEn: updateData.nameEn,
        nameAr: updateData.nameAr,
        descriptionEn: updateData.descriptionEn || updateData.description, // Use descriptionEn or fallback
        descriptionAr: updateData.descriptionAr, // Arabic description
        durationYears: updateData.durationYears,
        minGPA: updateData.minGPA,
        totalCreditHours: updateData.totalCreditHours,
        isActive: updateData.isActive,
        updatedBy: await getDatabaseUserId(user) || 1
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
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB] ✅ Updated program in ${duration}ms`);
    
    return { success: true, data: updatedProgram };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB] ❌ Error updating program:', error);
    
    if (isPrismaError(error, PRISMA_ERRORS.RECORD_NOT_FOUND)) {
      return { 
        success: false, 
        error: 'Program not found',
        duration: `${duration}ms`
      };
    }
    
    if (isPrismaError(error, PRISMA_ERRORS.UNIQUE_CONSTRAINT_FAILED)) {
      return { 
        success: false, 
        error: 'Program code already exists',
        duration: `${duration}ms`
      };
    }
    
    return { 
      success: false, 
      error: getPrismaErrorMessage(error),
      duration: `${duration}ms`
    };
  }
};

/**
 * Delete program from PostgreSQL database (soft delete - set isActive to false)
 * 
 * @param {string} programId - Program ID
 * @returns {Promise<object>} - Result object
 */
const deleteProgram = async (programId) => {
  const startTime = Date.now();
  try {
    console.log(`[Programs DB] Soft deleting program: ${programId}`);
    
    const deletedProgram = await prisma.program.update({
      where: { id: parseInt(programId) },
      data: { isActive: false }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB] ✅ Soft deleted program in ${duration}ms`);
    
    return { success: true, data: deletedProgram };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB] ❌ Error soft deleting program:', error);
    
    if (isPrismaError(error, PRISMA_ERRORS.RECORD_NOT_FOUND)) {
      return { 
        success: false, 
        error: 'Program not found',
        duration: `${duration}ms`
      };
    }
    
    return { 
      success: false, 
      error: getPrismaErrorMessage(error),
      duration: `${duration}ms`
    };
  }
};

/**
 * Hard delete program from PostgreSQL database
 * 
 * @param {string} programId - Program ID
 * @returns {Promise<object>} - Result object
 */
const hardDeleteProgram = async (programId) => {
  const startTime = Date.now();
  try {
    console.log(`[Programs DB] Hard deleting program: ${programId}`);
    
    // First check if there are subjects associated with this program
    const subjectCount = await prisma.subject.count({
      where: { programId: parseInt(programId) }
    });
    
    if (subjectCount > 0) {
      console.log(`[Programs DB] ⚠️ Cannot hard delete program: ${subjectCount} subjects reference this program`);
      return { 
        success: false, 
        error: `Cannot delete program: ${subjectCount} subject(s) are associated with this program. Please delete or reassign the subjects first.`,
        subjectCount: subjectCount,
        duration: `${Date.now() - startTime}ms`
      };
    }
    
    const deletedProgram = await prisma.program.delete({
      where: { id: parseInt(programId) }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Programs DB] ✅ Hard deleted program in ${duration}ms`);
    
    return { success: true, data: deletedProgram };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Programs DB] ❌ Error hard deleting program:', error);
    
    // Handle specific error codes
    if (error.code === 'P2025') {
      return { 
        success: false, 
        error: 'Program not found',
        duration: `${duration}ms`
      };
    }
    
    // Handle foreign key constraint violation
    if (error.code === 'P2002' || error.message.includes('Foreign key constraint')) {
      return { 
        success: false, 
        error: 'Cannot delete program: It is referenced by subjects. Please delete or reassign the subjects first.',
        duration: `${duration}ms`
      };
    }
    
    // Handle Prisma foreign key constraint specifically
    if (error.message.includes('subjects_programId_fkey')) {
      return { 
        success: false, 
        error: 'Cannot delete program: It has associated subjects. Please delete the subjects first or reassign them to another program.',
        duration: `${duration}ms`
      };
    }
    
    return { 
      success: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

export default {
  getPrograms,
  getProgramById,
  create,
  update,
  deleteProgram,
  hardDeleteProgram
};
