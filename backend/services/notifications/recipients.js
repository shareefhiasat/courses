/**
 * Recipients Resolver
 * 
 * Resolves notification recipients based on various criteria:
 * - byUserId: single user
 * - byUserIds: multiple users
 * - byRole: users with a specific Keycloak role
 * - byClass: students enrolled in a class
 * - byEnrollment: students enrolled in a subject/program
 */

import { PrismaClient } from '@prisma/client';
import log from './logger.js';

const prisma = new PrismaClient();

/**
 * Resolve recipients by single user ID
 * @param {number} userId - User ID in database
 * @returns {Promise<Array>} Array of recipient objects
 */
export const byUserId = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    if (!user) {
      log.warn('User not found', { userId });
      return [];
    }
    
    return [{ userId: user.id, email: user.email, preferredLang: 'en' }];
  } catch (error) {
    log.error('Error resolving user by ID', { userId, error: error.message });
    return [];
  }
};

/**
 * Resolve recipients by multiple user IDs
 * @param {Array<number>} userIds - Array of user IDs
 * @returns {Promise<Array>} Array of recipient objects
 */
export const byUserIds = async (userIds) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    return users.map(user => ({
      userId: user.id,
      email: user.email,
      preferredLang: 'en'
    }));
  } catch (error) {
    log.error('Error resolving users by IDs', { userIds, error: error.message });
    return [];
  }
};

/**
 * Resolve recipients by Keycloak role
 * @param {string} roleCode - Role code (e.g., 'student', 'instructor', 'admin', 'hr')
 * @returns {Promise<Array>} Array of recipient objects
 */
export const byRole = async (roleCode) => {
  try {
    // Find the role by code
    const role = await prisma.userRoles.findUnique({
      where: { code: roleCode }
    });
    
    if (!role) {
      log.warn('Role not found', { roleCode });
      return [];
    }
    
    // Find users with this role
    const roleAssignments = await prisma.userRoleAssignment.findMany({
      where: { roleId: role.id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
    
    return roleAssignments.map(ra => ({
      userId: ra.user.id,
      email: ra.user.email,
      preferredLang: 'en'
    }));
  } catch (error) {
    log.error('Error resolving users by role', { roleCode, error: error.message });
    return [];
  }
};

/**
 * Resolve recipients by class enrollment
 * @param {number} classId - Class ID
 * @returns {Promise<Array>} Array of recipient objects
 */
export const byClass = async (classId) => {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });
    
    if (!classData) {
      log.warn('Class not found', { classId });
      return [];
    }
    
    return classData.enrollments.map(e => ({
      userId: e.user.id,
      email: e.user.email,
      preferredLang: 'en'
    }));
  } catch (error) {
    log.error('Error resolving recipients by class', { classId, error: error.message });
    return [];
  }
};

/**
 * Resolve recipients by subject/program enrollment
 * @param {Object} options - Enrollment criteria
 * @param {number} options.subjectId - Subject ID (optional)
 * @param {number} options.programId - Program ID (optional)
 * @returns {Promise<Array>} Array of recipient objects
 */
export const byEnrollment = async ({ subjectId, programId }) => {
  try {
    const where = {};
    
    if (subjectId) {
      where.subjectId = subjectId;
    }
    
    if (programId) {
      where.programId = programId;
    }
    
    if (Object.keys(where).length === 0) {
      log.warn('No enrollment criteria provided');
      return [];
    }
    
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
    
    return enrollments.map(e => ({
      userId: e.user.id,
      email: e.user.email,
      preferredLang: 'en'
    }));
  } catch (error) {
    log.error('Error resolving recipients by enrollment', { subjectId, programId, error: error.message });
    return [];
  }
};

/**
 * Universal recipient resolver
 * @param {Object} criteria - Recipient criteria
 * @param {number} criteria.userId - Single user ID
 * @param {Array<number>} criteria.userIds - Multiple user IDs
 * @param {string} criteria.role - Role code
 * @param {number} criteria.classId - Class ID
 * @param {number} criteria.subjectId - Subject ID (with enrollment)
 * @param {number} criteria.programId - Program ID (with enrollment)
 * @returns {Promise<Array>} Array of recipient objects
 */
export const resolveRecipients = async (criteria) => {
  const { userId, userIds, role, classId, subjectId, programId } = criteria;
  
  if (userId) {
    return await byUserId(userId);
  }
  
  if (userIds && userIds.length > 0) {
    return await byUserIds(userIds);
  }
  
  if (role) {
    return await byRole(role);
  }
  
  if (classId) {
    return await byClass(classId);
  }
  
  if (subjectId || programId) {
    return await byEnrollment({ subjectId, programId });
  }
  
  log.warn('No valid recipient criteria provided', { criteria });
  return [];
};

export default {
  byUserId,
  byUserIds,
  byRole,
  byClass,
  byEnrollment,
  resolveRecipients
};
