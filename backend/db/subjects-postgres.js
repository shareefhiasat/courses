/**
 * Subjects Database Service
 * 
 * PURPOSE: Database operations for subjects using PostgreSQL
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
    console.error('[Subjects DB] Error getting database user ID:', error);
    return null;
  }
};

/**
 * Get all subjects from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.search - Search term for name/code
 * @param {string} params.programId - Filter by program ID
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.sortBy - Sort field (default: createdAt)
 * @param {string} params.sortOrder - Sort order (default: desc)
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getSubjects = async (params = {}) => {
  try {
    console.log('[Subjects DB] Getting subjects with params:', params);
    
    const startTime = Date.now();
    
    // Extract query parameters
    const {
      page = 1,
      limit = 50,
      search = '',
      programId = '',
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
    const subjects = await prisma.subject.findMany({
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
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        subjectType: {
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
    const total = await prisma.subject.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Subjects DB] ✅ Retrieved ${subjects.length} subjects in ${executionTime}ms`);
    
    // Debug logging to see the actual data structure
    console.log('🔍 Subjects DB debug:', {
      subjectsLength: subjects.length,
      firstSubject: subjects[0],
      subjectsData: subjects
    });
    
    return {
      success: true,
      data: subjects,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[Subjects DB] ❌ Error getting subjects:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve subjects';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Get subject by ID from PostgreSQL database
 * 
 * @param {number|string} subjectId - Subject ID
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getSubjectById = async (subjectId) => {
  try {
    console.log(`[Subjects DB] Getting subject by ID: ${subjectId}`);
    
    const startTime = Date.now();
    
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) },
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
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        subjectType: {
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
    console.log(`[Subjects DB] ✅ Retrieved subject in ${executionTime}ms`);
    
    if (!subject) {
      return {
        success: false,
        error: 'Subject not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: subject
    };
    
  } catch (error) {
    console.error('[Subjects DB] ❌ Error getting subject by ID:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve subject';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Resolve user ID for audit trail from various user object formats
 * @param {Object} user - User object (may contain id, uid, sub, keycloakId, or email)
 * @returns {Promise<number>} Database user ID
 */
async function resolveUserIdForAudit(user) {
  let createdBy = 1; // Default to admin user
  
  console.log('🔍 Backend received user:', user);
  console.log('🔍 User ID types:', {
    'user.id': user?.id,
    'user.id type': typeof user?.id,
    'user.uid': user?.uid,
    'user.sub': user?.sub,
    'user.keycloakId': user?.keycloakId,
    'user.email': user?.email
  });
  
  if (user && user.id) {
    createdBy = user.id;
    console.log('🔍 Using user.id for createdBy:', createdBy);
  } else if (user && user.uid) {
    // Try to find user by Keycloak UID (from frontend)
    const uidUser = await prisma.user.findFirst({ 
      where: { keycloakId: user.uid } 
    });
    if (uidUser) {
      createdBy = uidUser.id;
      console.log('🔍 Found user by uid/keycloakId:', createdBy);
    }
  } else if (user && user.sub) {
    // Try to find user by Keycloak ID
    const keycloakUser = await prisma.user.findFirst({ 
      where: { keycloakId: user.sub } 
    });
    if (keycloakUser) {
      createdBy = keycloakUser.id;
      console.log('🔍 Found user by sub/keycloakId:', createdBy);
    }
  } else if (user && user.email) {
    // Try to find user by email
    const emailUser = await prisma.user.findFirst({ 
      where: { email: user.email } 
    });
    if (emailUser) {
      createdBy = emailUser.id;
      console.log('🔍 Found user by email:', createdBy);
    }
  } else {
    // Try to find an existing user or create a default one
    console.log('🔍 No valid user found, using default admin');
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
  
  return createdBy;
}

/**
 * Create new subject in PostgreSQL database
 * 
 * @param {Object} subjectData - Subject data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const createSubject = async (subjectData, user = null) => {
  try {
    console.log(`[Subjects DB] Creating new subject: ${subjectData.code || subjectData.nameEn}`);
    
    const startTime = Date.now();
    
    // Get user ID for audit trail
    const createdBy = await resolveUserIdForAudit(user);
    
    const newSubject = await prisma.subject.create({
      data: {
        code: subjectData.code,
        nameEn: subjectData.nameEn,
        nameAr: subjectData.nameAr,
        descriptionEn: subjectData.descriptionEn,
        descriptionAr: subjectData.descriptionAr,
        credits: subjectData.credits || 3,
        typeId: subjectData.typeId || 1,
        requirementTypeId: subjectData.requirementTypeId || 1,
        isActive: subjectData.isActive !== undefined ? subjectData.isActive : true,
        programId: subjectData.programId,
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
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        subjectType: {
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
    console.log(`[Subjects DB] ✅ Created subject in ${executionTime}ms`);
    
    return {
      success: true,
      data: newSubject,
      message: 'Subject created successfully'
    };
    
  } catch (error) {
    console.error('[Subjects DB] ❌ Error creating subject:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create subject';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Update subject in PostgreSQL database
 * 
 * @param {number|string} subjectId - Subject ID
 * @param {Object} updateData - Subject data to update
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateSubject = async (subjectId, updateData, user = null) => {
  try {
    console.log(`[Subjects DB] Updating subject: ${subjectId}`);
    
    const startTime = Date.now();
    
    // Prepare update data
    const data = {};
    
    // Only include fields that are provided
    if (updateData.code !== undefined) data.code = updateData.code;
    if (updateData.nameEn !== undefined) data.nameEn = updateData.nameEn;
    if (updateData.nameAr !== undefined) data.nameAr = updateData.nameAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.credits !== undefined) data.credits = updateData.credits;
    if (updateData.typeId !== undefined) data.typeId = updateData.typeId;
    if (updateData.requirementTypeId !== undefined) data.requirementTypeId = updateData.requirementTypeId;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updateData.programId !== undefined) data.programId = updateData.programId;
    
    // Add audit trail with user lookup
    const dbUserId = await getDatabaseUserId(user);
    data.updatedBy = dbUserId || 1; // Default to admin user if not found
    
    console.log('🔍 Backend update received user:', user);
    console.log('🔍 Using database user ID for updatedBy:', data.updatedBy);
    
    const updatedSubject = await prisma.subject.update({
      where: { id: parseInt(subjectId) },
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
        program: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
          }
        },
        subjectType: {
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
    console.log(`[Subjects DB] ✅ Updated subject in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedSubject,
      message: 'Subject updated successfully'
    };
    
  } catch (error) {
    console.error('[Subjects DB] ❌ Error updating subject:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to update subject';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Delete subject from PostgreSQL database
 * 
 * @param {number|string} subjectId - Subject ID
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteSubject = async (subjectId, user = null) => {
  try {
    console.log(`[Subjects DB] Deleting subject: ${subjectId}`);
    
    const startTime = Date.now();
    
    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) }
    });
    
    if (!existingSubject) {
      return {
        success: false,
        error: 'Subject not found',
        data: null
      };
    }
    
    // Check if subject has any dependencies (classes)
    const classCount = await prisma.class.count({
      where: { subjectId: parseInt(subjectId) }
    });
    
    if (classCount > 0) {
      return {
        success: false,
        error: 'Cannot delete subject with existing classes',
        data: null
      };
    }
    
    // Delete the subject
    await prisma.subject.delete({
      where: { id: parseInt(subjectId) }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Subjects DB] ✅ Deleted subject in ${executionTime}ms`);
    
    return {
      success: true,
      data: { id: parseInt(subjectId) },
      message: 'Subject deleted successfully'
    };
    
  } catch (error) {
    console.error('[Subjects DB] ❌ Error deleting subject:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to delete subject';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Get subjects by program ID
 * 
 * @param {number|string} programId - Program ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getSubjectsByProgram = async (programId, params = {}) => {
  try {
    console.log(`[Subjects DB] Getting subjects for program: ${programId}`);
    
    return await getSubjects({
      ...params,
      programId
    });
    
  } catch (error) {
    console.error('[Subjects DB] ❌ Error getting subjects by program:', error);
    
    return {
      success: false,
      error: 'Failed to retrieve subjects for program',
      data: []
    };
  }
};

export default {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByProgram
};
