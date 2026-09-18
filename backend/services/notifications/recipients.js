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

import prisma from '../../db/prismaClient.js';
import log from './logger.js';


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
    log.error('Error resolving user by ID', { userId, error: 'Internal server error' });
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
    log.error('Error resolving users by IDs', { userIds, error: 'Internal server error' });
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
    // Find the role by code (case-insensitive to handle 'admin' vs 'ADMIN')
    const role = await prisma.userRoles.findFirst({
      where: { code: { equals: roleCode, mode: 'insensitive' } }
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
    log.error('Error resolving users by role', { roleCode, error: 'Internal server error' });
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
    log.error('Error resolving recipients by class', { classId, error: 'Internal server error' });
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
    log.error('Error resolving recipients by enrollment', { subjectId, programId, error: 'Internal server error' });
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
const PRIVILEGED_ROLES = ['admin', 'hr', 'super_admin'];

function hasOnlyInstructorRole(assignments) {
  const codes = new Set(assignments.map((a) => a.role?.code?.toLowerCase()).filter(Boolean));
  const hasInstructor = codes.has('instructor');
  const hasPrivileged = PRIVILEGED_ROLES.some((r) => codes.has(r));
  return hasInstructor && !hasPrivileged;
}

async function excludeInstructorOnlyRecipients(recipients) {
  if (!recipients?.length) return [];
  const userIds = recipients.map((r) => r.userId).filter(Boolean);
  if (!userIds.length) return recipients;

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId: { in: userIds } },
    include: { role: { select: { code: true } } },
  });

  const byUser = new Map();
  assignments.forEach((a) => {
    const list = byUser.get(a.userId) || [];
    list.push(a);
    byUser.set(a.userId, list);
  });

  return recipients.filter((r) => {
    const userAssignments = byUser.get(r.userId) || [];
    return !hasOnlyInstructorRole(userAssignments);
  });
}

export const resolveRecipients = async (criteria) => {
  const { userId, userIds, role, classId, subjectId, programId, scopedRole, scopedClassId, excludeInstructors } = criteria;
  let recipients;

  if (scopedRole && scopedClassId) {
    const roleUsers = await byRole(scopedRole);
    const { getEffectiveDataScope } = await import('../services/scopeResolver.js');
    const cls = await prisma.class.findUnique({
      where: { id: parseInt(scopedClassId, 10) },
      select: { id: true, programId: true, subjectId: true },
    });
    if (!cls) return [];
    const filtered = [];
    for (const u of roleUsers) {
      const assignments = await prisma.userRoleAssignment.findMany({
        where: { userId: u.userId },
        include: { role: true },
      });
      const roles = assignments.map((a) => a.role.code);
      const scope = await getEffectiveDataScope(u.userId, roles);
      if (scope.unrestricted
        || scope.classIds.includes(cls.id)
        || (cls.subjectId && scope.subjectIds.includes(cls.subjectId))
        || (cls.programId && scope.programIds.includes(cls.programId))) {
        filtered.push(u);
      }
    }
    recipients = filtered;
  } else if (userId) {
    recipients = await byUserId(userId);
  } else if (userIds && userIds.length > 0) {
    recipients = await byUserIds(userIds);
  } else if (role) {
    recipients = await byRole(role);
  } else if (classId) {
    recipients = await byClass(classId);
  } else if (subjectId || programId) {
    recipients = await byEnrollment({ subjectId, programId });
  }

  if (recipients === undefined) {
    log.warn('No valid recipient criteria provided', { criteria });
    return [];
  }

  if (excludeInstructors) {
    recipients = await excludeInstructorOnlyRecipients(recipients);
  }

  return recipients;
};

export default {
  byUserId,
  byUserIds,
  byRole,
  byClass,
  byEnrollment,
  resolveRecipients
};
