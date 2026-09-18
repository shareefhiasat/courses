/**
 * AI Query Scope Helpers
 *
 * Utilities to ensure that all entity matching and database queries
 * strictly respect the user's Category, Program, Subject, and Class data scope.
 */

import prisma from '../db/prismaClient.js';
import { getRequestScope, assertClassInScope, assertProgramInScope } from '../utils/scopeAccess.js';

/**
 * Get all classes accessible by the current user within their data scope.
 */
export async function getScopedClasses(req) {
  const scope = await getRequestScope(req);

  if (scope.unrestricted) {
    return prisma.class.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        nameEn: true,
        nameAr: true,
        programId: true,
        subjectId: true,
        program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
        subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      },
    });
  }

  const whereConditions = [];

  if (scope.classIds && scope.classIds.length > 0) {
    whereConditions.push({ id: { in: scope.classIds } });
  }
  if (scope.programIds && scope.programIds.length > 0) {
    whereConditions.push({ programId: { in: scope.programIds } });
  }
  if (scope.subjectIds && scope.subjectIds.length > 0) {
    whereConditions.push({ subjectId: { in: scope.subjectIds } });
  }
  if (scope.categoryIds && scope.categoryIds.length > 0) {
    whereConditions.push({ program: { categoryId: { in: scope.categoryIds } } });
  }

  if (whereConditions.length === 0) {
    return [];
  }

  return prisma.class.findMany({
    where: {
      isActive: true,
      OR: whereConditions,
    },
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      programId: true,
      subjectId: true,
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  });
}

/**
 * Get all programs accessible by the current user within their data scope.
 */
export async function getScopedPrograms(req) {
  const scope = await getRequestScope(req);

  if (scope.unrestricted) {
    return prisma.program.findMany({
      where: { isActive: true },
      select: { id: true, code: true, nameEn: true, nameAr: true },
    });
  }

  const whereConditions = [];

  if (scope.programIds && scope.programIds.length > 0) {
    whereConditions.push({ id: { in: scope.programIds } });
  }
  if (scope.categoryIds && scope.categoryIds.length > 0) {
    whereConditions.push({ categoryId: { in: scope.categoryIds } });
  }

  if (whereConditions.length === 0) {
    return [];
  }

  return prisma.program.findMany({
    where: {
      isActive: true,
      OR: whereConditions,
    },
    select: { id: true, code: true, nameEn: true, nameAr: true },
  });
}

/**
 * Build Prisma WHERE filter for classId/programId based on scope.
 */
export async function buildScopedFilter(req, { classId, programId } = {}) {
  const scope = await getRequestScope(req);

  // If specific classId is requested, assert it
  if (classId) {
    const classCheck = await assertClassInScope(req, classId);
    if (!classCheck.ok) {
      return { allowed: false, reason: 'Requested class is outside your permitted data scope.' };
    }
    return { allowed: true, filter: { classId: parseInt(classId, 10) } };
  }

  // If specific programId is requested, assert it
  if (programId) {
    const progCheck = await assertProgramInScope(req, programId);
    if (!progCheck.ok) {
      return { allowed: false, reason: 'Requested program is outside your permitted data scope.' };
    }
    return { allowed: true, filter: { class: { programId: parseInt(programId, 10) } } };
  }

  // If unrestricted, no scope constraint needed
  if (scope.unrestricted) {
    return { allowed: true, filter: {} };
  }

  // Construct bounded filter
  const scopedClasses = await getScopedClasses(req);
  const classIds = scopedClasses.map((c) => c.id);

  if (classIds.length === 0) {
    return { allowed: false, reason: 'No accessible classes found in your assigned data scope.' };
  }

  return { allowed: true, filter: { classId: { in: classIds } }, classIds };
}

export { assertClassInScope, assertProgramInScope, getRequestScope };

export default {
  getScopedClasses,
  getScopedPrograms,
  buildScopedFilter,
  assertClassInScope,
  assertProgramInScope,
  getRequestScope,
};
