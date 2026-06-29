/**
 * Announcements Database Service
 * 
 * PURPOSE: Database operations for announcements using PostgreSQL
 * ARCHITECTURE: Business Services → DB Services → PostgreSQL
 */

import prisma from './prismaClient.js';
import { PRISMA_ERRORS, getPrismaErrorMessage, isPrismaError } from '../constants/prisma-errors.js';


/**
 * Get all announcements from PostgreSQL database
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with announcements data
 */
export const getAnnouncements = async (params = {}) => {
  try {
    console.log('[Announcements DB] Getting announcements with params:', params);
    
    const startTime = Date.now();
    
    const {
      page = 1,
      limit = 50,
      search = '',
      programId = '',
      classId = '',
      priority = '',
      targetAudience = '',
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
        { contentEn: { contains: search, mode: 'insensitive' } },
        { contentAr: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (programId) {
      where.programId = parseInt(programId);
    }
    
    if (classId) {
      where.classId = parseInt(classId);
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (targetAudience) {
      where.targetAudience = targetAudience;
    }
    
    // Allow overriding isActive filter if explicitly provided
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    
    // Add date filtering for published and not expired announcements
    const now = new Date();
    where.AND = [
      {
        OR: [
          { publishAt: null },
          { publishAt: { lte: now } }
        ]
      },
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } }
        ]
      }
    ];
    
    // Build order clause
    const orderByClause = {};
    orderByClause[sortBy] = sortOrder.toLowerCase();
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Execute query
    const announcements = await prisma.announcement.findMany({
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
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
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
        }
      }
    });
    
    // Get total count
    const total = await prisma.announcement.count({ where });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Announcements DB] ✅ Retrieved ${announcements.length} announcements in ${executionTime}ms`);
    
    return {
      success: true,
      data: announcements,
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };
    
  } catch (error) {
    console.error('[Announcements DB] ❌ Error getting announcements:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve announcements';
    
    return {
      success: false,
      error: errorMessage,
      data: []
    };
  }
};

/**
 * Get announcement by ID from PostgreSQL database
 * 
 * @param {number|string} announcementId - Announcement ID
 * @returns {Promise<Object>} - Result object with announcement data
 */
export const getAnnouncementById = async (announcementId) => {
  try {
    console.log(`[Announcements DB] Getting announcement by ID: ${announcementId}`);
    
    const startTime = Date.now();
    
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(announcementId) },
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
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
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
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Announcements DB] ✅ Retrieved announcement in ${executionTime}ms`);
    
    if (!announcement) {
      return {
        success: false,
        error: 'Announcement not found',
        data: null
      };
    }
    
    return {
      success: true,
      data: announcement
    };
    
  } catch (error) {
    console.error('[Announcements DB] ❌ Error getting announcement by ID:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to retrieve announcement';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Create new announcement in PostgreSQL database
 * 
 * @param {Object} announcementData - Announcement data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
/**
 * Get database user ID from Keycloak user object
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
    console.error('[Announcements DB] Error finding database user:', error);
    return null;
  }
};

export const createAnnouncement = async (announcementData, user = null) => {
  try {
    console.log(`[Announcements DB] Creating new announcement: ${announcementData.titleEn || announcementData.titleAr}`);
    
    const startTime = Date.now();
    
    // Get user ID for audit trail
    const createdBy = await getDatabaseUserId(user) || 1; // Default to admin user
    
    if (!user) {
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
    
    const newAnnouncement = await prisma.announcement.create({
      data: {
        titleEn: announcementData.titleEn,
        titleAr: announcementData.titleAr,
        descriptionEn: announcementData.descriptionEn,
        descriptionAr: announcementData.descriptionAr,
        priority: {
          connect: { id: announcementData.priorityId || 2 } // Default to 'normal' priority (ID 2)
        },
        targetAudience: {
          connect: { id: announcementData.targetAudienceId || 1 } // Default to 'all' (ID 1)
        },
        program: announcementData.programId ? {
          connect: { id: parseInt(announcementData.programId) }
        } : undefined,
        subject: announcementData.subjectId ? {
          connect: { id: parseInt(announcementData.subjectId) }
        } : undefined,
        class: announcementData.classId ? {
          connect: { id: parseInt(announcementData.classId) }
        } : undefined,
        creator: {
          connect: { id: createdBy }
        },
        updater: {
          connect: { id: createdBy }
        },
        isActive: announcementData.isActive !== undefined ? announcementData.isActive : true,
        publishAt: announcementData.publishAt ? new Date(announcementData.publishAt) : null,
        expiresAt: announcementData.expiresAt ? new Date(announcementData.expiresAt) : null
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
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
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
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Announcements DB] ✅ Created announcement in ${executionTime}ms`);
    
    return {
      success: true,
      data: newAnnouncement,
      message: 'Announcement created successfully'
    };
    
  } catch (error) {
    console.error('[Announcements DB] ❌ Error creating announcement:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to create announcement';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Update announcement in PostgreSQL database
 * 
 * @param {number|string} announcementId - Announcement ID
 * @param {Object} updateData - Announcement data to update
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const updateAnnouncement = async (announcementId, updateData, user = null) => {
  try {
    console.log(`[Announcements DB] Updating announcement: ${announcementId}`);
    
    const startTime = Date.now();
    
    // Prepare update data
    const data = {};
    
    // Only include fields that are provided
    if (updateData.titleEn !== undefined) data.titleEn = updateData.titleEn;
    if (updateData.titleAr !== undefined) data.titleAr = updateData.titleAr;
    if (updateData.descriptionEn !== undefined) data.descriptionEn = updateData.descriptionEn;
    if (updateData.descriptionAr !== undefined) data.descriptionAr = updateData.descriptionAr;
    if (updateData.priority !== undefined) data.priority = updateData.priority;
    if (updateData.targetAudienceId !== undefined) data.targetAudience = { connect: { id: parseInt(updateData.targetAudienceId) } };
    if (updateData.programId !== undefined && updateData.programId) {
      data.program = { connect: { id: parseInt(updateData.programId) } };
    } else if (updateData.programId !== undefined && !updateData.programId) {
      data.program = { disconnect: true };
    }
    if (updateData.subjectId !== undefined && updateData.subjectId) {
      data.subject = { connect: { id: parseInt(updateData.subjectId) } };
    } else if (updateData.subjectId !== undefined && !updateData.subjectId) {
      data.subject = { disconnect: true };
    }
    if (updateData.classId !== undefined && updateData.classId) {
      data.class = { connect: { id: parseInt(updateData.classId) } };
    } else if (updateData.classId !== undefined && !updateData.classId) {
      data.class = { disconnect: true };
    }
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updateData.publishAt !== undefined) data.publishAt = updateData.publishAt ? new Date(updateData.publishAt) : null;
    if (updateData.expiresAt !== undefined) data.expiresAt = updateData.expiresAt ? new Date(updateData.expiresAt) : null;
    
    // Add audit trail
    const updaterId = await getDatabaseUserId(user);
    if (updaterId) {
      data.updater = { connect: { id: updaterId } };
    }
    
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: parseInt(announcementId) },
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
        subject: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
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
        }
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Announcements DB] ✅ Updated announcement in ${executionTime}ms`);
    
    return {
      success: true,
      data: updatedAnnouncement,
      message: 'Announcement updated successfully'
    };
    
  } catch (error) {
    console.error('[Announcements DB] ❌ Error updating announcement:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to update announcement';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Delete announcement from PostgreSQL database
 * 
 * @param {number|string} announcementId - Announcement ID
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const deleteAnnouncement = async (announcementId, user = null, options = {}) => {
  try {
    console.log(`[Announcements DB] Deleting announcement: ${announcementId}`);
    
    const startTime = Date.now();
    
    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: parseInt(announcementId) }
    });
    
    if (!existingAnnouncement) {
      return {
        success: false,
        error: 'Announcement not found',
        data: null
      };
    }
    
    // Soft delete: set isActive = false
    await prisma.announcement.update({
      where: { id: parseInt(announcementId) },
      data: { isActive: false }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`[Announcements DB] ✅ Soft deleted announcement in ${executionTime}ms`);
    
    return {
      success: true,
      data: { id: parseInt(announcementId) },
      message: 'Announcement deleted successfully'
    };
    
  } catch (error) {
    console.error('[Announcements DB] ❌ Error deleting announcement:', error);
    
    const errorMessage = isPrismaError(error) 
      ? getPrismaErrorMessage(error) 
      : 'Failed to delete announcement';
    
    return {
      success: false,
      error: errorMessage,
      data: null
    };
  }
};

/**
 * Get announcements by program ID
 * 
 * @param {number|string} programId - Program ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAnnouncementsByProgram = async (programId, params = {}) => {
  try {
    console.log(`[Announcements DB] Getting announcements for program: ${programId}`);
    
    return await getAnnouncements({
      ...params,
      programId
    });
    
  } catch (error) {
    console.error('[Announcements DB] ❌ Error getting announcements by program:', error);
    
    return {
      success: false,
      error: 'Failed to retrieve announcements for program',
      data: []
    };
  }
};

/**
 * Get announcements by class ID
 * 
 * @param {number|string} classId - Class ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object with success status and data
 */
export const getAnnouncementsByClass = async (classId, params = {}) => {
  try {
    console.log(`[Announcements DB] Getting announcements for class: ${classId}`);
    
    return await getAnnouncements({
      ...params,
      classId
    });
    
  } catch (error) {
    console.error('[Announcements DB] ❌ Error getting announcements by class:', error);
    
    return {
      success: false,
      error: 'Failed to retrieve announcements for class',
      data: []
    };
  }
};

export default {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementsByProgram,
  getAnnouncementsByClass
};
