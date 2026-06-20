/**
 * Effective data scope for admin / HR / instructor users.
 * Super admin is always unrestricted.
 */

import { PrismaClient } from '@prisma/client';
import { LMS_ROLES as ROLES } from '../services/keycloakAdminService.js';

const prisma = new PrismaClient();

function normalizeRoles(roles = []) {
  return roles.map((r) => {
    const lower = String(r).toLowerCase();
    if (lower === 'super-admin' || lower === 'superadmin' || lower === 'super_admin') return ROLES.SUPER_ADMIN;
    if (lower === 'admin') return ROLES.ADMIN;
    if (lower === 'hr') return ROLES.HR;
    if (lower === 'instructor') return ROLES.INSTRUCTOR;
    if (lower === 'student') return ROLES.STUDENT;
    return lower;
  });
}

function hasRole(roles, role) {
  return roles.includes(role);
}

/**
 * @param {number} userId - DB user id
 * @param {string[]} roles - Keycloak roles
 */
export async function getEffectiveDataScope(userId, roles = []) {
  const normalized = normalizeRoles(roles);

  if (hasRole(normalized, ROLES.SUPER_ADMIN)) {
    return {
      unrestricted: true,
      categoryIds: [],
      programIds: [],
      subjectIds: [],
      classIds: [],
      source: 'super_admin',
    };
  }

  // HR always sees all data (attendance daily screen, reports, etc.)
  if (hasRole(normalized, ROLES.HR)) {
    return {
      unrestricted: true,
      categoryIds: [],
      programIds: [],
      subjectIds: [],
      classIds: [],
      source: 'hr',
    };
  }

  if (!userId) {
    return {
      unrestricted: false,
      categoryIds: [],
      programIds: [],
      subjectIds: [],
      classIds: [],
      source: 'anonymous',
    };
  }

  const categoryIds = new Set();
  const programIds = new Set();
  const subjectIds = new Set();
  const classIds = new Set();

  const accesses = await prisma.userCategoryAccess.findMany({
    where: { userId, isActive: true, canView: true },
    include: {
      category: {
        include: {
          programs: { select: { id: true } },
        },
      },
    },
  });

  for (const access of accesses) {
    categoryIds.add(access.categoryId);

    if (access.classId) {
      classIds.add(access.classId);
    }
    if (access.subjectId) {
      subjectIds.add(access.subjectId);
    }
    if (access.programId) {
      programIds.add(access.programId);
    }

    // Category-wide access expands to all programs in category when not narrowed
    if (!access.programId && !access.subjectId && !access.classId && access.category?.programs) {
      access.category.programs.forEach((p) => programIds.add(p.id));
    }
  }

  if (hasRole(normalized, ROLES.INSTRUCTOR)) {
    const taughtClasses = await prisma.class.findMany({
      where: { instructorId: userId },
      select: { id: true, programId: true, subjectId: true, categoryId: true },
    });
    taughtClasses.forEach((c) => {
      classIds.add(c.id);
      if (c.programId) programIds.add(c.programId);
      if (c.subjectId) subjectIds.add(c.subjectId);
      if (c.categoryId) categoryIds.add(c.categoryId);
    });
  }

  const isAdminLike = hasRole(normalized, ROLES.ADMIN);
  const hasExplicitScope = categoryIds.size > 0 || programIds.size > 0 || subjectIds.size > 0 || classIds.size > 0;

  // Backward compatibility: admin without UCA rows keeps full access until scoped
  if (isAdminLike && !hasExplicitScope) {
    return {
      unrestricted: true,
      categoryIds: [],
      programIds: [],
      subjectIds: [],
      classIds: [],
      source: 'admin_legacy_unrestricted',
    };
  }

  return {
    unrestricted: false,
    categoryIds: [...categoryIds],
    programIds: [...programIds],
    subjectIds: [...subjectIds],
    classIds: [...classIds],
    source: hasExplicitScope ? 'user_category_access' : 'empty',
  };
}

/**
 * Filter array of records that have id + optional hierarchy fields.
 */
export function filterByDataScope(items, scope, fieldMap = {}) {
  if (!scope || scope.unrestricted) return items;

  const {
    idField = 'id',
    categoryField = 'categoryId',
    programField = 'programId',
    subjectField = 'subjectId',
    classField = 'classId',
  } = fieldMap;

  const { categoryIds, programIds, subjectIds, classIds } = scope;

  return (items || []).filter((item) => {
    const classId = item[classField];
    const subjectId = item[subjectField];
    const programId = item[programField];
    const categoryId = item[categoryField];
    const id = item[idField];

    if (classId != null && classIds.includes(classId)) return true;
    if (subjectId != null && subjectIds.includes(subjectId)) return true;
    if (programId != null && programIds.includes(programId)) return true;
    if (categoryId != null && categoryIds.includes(categoryId)) return true;
    if (id != null && classIds.includes(id)) return true;
    return false;
  });
}

export default {
  getEffectiveDataScope,
  filterByDataScope,
};
