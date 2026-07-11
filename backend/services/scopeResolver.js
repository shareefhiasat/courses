/**
 * Effective data scope for admin / HR / instructor users.
 * Super admin is always unrestricted.
 * Admin and HR are unrestricted by default, unless explicit UCA restrictions are configured.
 *
 * Layer 1 — UCA: academic boundary (programs/subjects/classes for operational data)
 * Layer 2 — Visibility profile: ALL | UCA | EXPLICIT per dimension (pickers, analytics, availability)
 */

import prisma from '../db/prismaClient.js';
import { LMS_ROLES as ROLES } from '../services/keycloakAdminService.js';

const DEFAULT_VISIBILITY = {
  programs: 'UCA',
  subjects: 'UCA',
  classes: 'UCA',
  instructors: 'ALL',
  rooms: 'ALL',
};

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

async function loadVisibilityContext(userId) {
  const [profile, instructorGrants, roomGrants, programGrants, subjectGrants, classGrants] = await Promise.all([
    prisma.userDataScopeProfile.findUnique({ where: { userId } }),
    prisma.userInstructorGrant.findMany({ where: { userId, isActive: true }, select: { instructorUserId: true } }),
    prisma.userRoomGrant.findMany({ where: { userId, isActive: true }, select: { classroomId: true } }),
    prisma.userProgramGrant.findMany({ where: { userId, isActive: true }, select: { programId: true } }),
    prisma.userSubjectGrant.findMany({ where: { userId, isActive: true }, select: { subjectId: true } }),
    prisma.userClassGrant.findMany({ where: { userId, isActive: true }, select: { classId: true } }),
  ]);

  const p = profile || {};
  return {
    visibility: {
      programs: p.programsMode || DEFAULT_VISIBILITY.programs,
      subjects: p.subjectsMode || DEFAULT_VISIBILITY.subjects,
      classes: p.classesMode || DEFAULT_VISIBILITY.classes,
      instructors: p.instructorsMode || DEFAULT_VISIBILITY.instructors,
      rooms: p.roomsMode || DEFAULT_VISIBILITY.rooms,
    },
    explicitGrants: {
      instructorIds: instructorGrants.map((g) => g.instructorUserId),
      roomIds: roomGrants.map((g) => g.classroomId),
      programIds: programGrants.map((g) => g.programId),
      subjectIds: subjectGrants.map((g) => g.subjectId),
      classIds: classGrants.map((g) => g.classId),
    },
  };
}

/**
 * @param {number} userId - DB user id
 * @param {string[]} roles - Keycloak roles
 */
export async function getEffectiveDataScope(userId, roles = []) {
  const normalized = normalizeRoles(roles);

  // Super Admin is always unrestricted, no exceptions
  if (hasRole(normalized, ROLES.SUPER_ADMIN)) {
    return {
      unrestricted: true,
      categoryIds: [],
      programIds: [],
      subjectIds: [],
      classIds: [],
      source: 'super_admin',
      visibility: {
        programs: 'ALL',
        subjects: 'ALL',
        classes: 'ALL',
        instructors: 'ALL',
        rooms: 'ALL',
      },
      explicitGrants: {
        instructorIds: [],
        roomIds: [],
        programIds: [],
        subjectIds: [],
        classIds: [],
      },
    };
  }

  // Admin and HR: unrestricted by default, unless explicit UCA restrictions exist
  if (hasRole(normalized, ROLES.ADMIN) || hasRole(normalized, ROLES.HR)) {
    // Check if any UCA entries exist for this user
    const existingAccesses = await prisma.userCategoryAccess.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ canView: true }, { canManage: true }],
      },
      select: { id: true },
    });

    // Also check visibility profile for explicit restrictions
    const profile = await prisma.userDataScopeProfile.findUnique({ where: { userId } });
    const hasVisibilityRestriction = profile && (
      profile.programsMode === 'UCA' || profile.programsMode === 'EXPLICIT' ||
      profile.subjectsMode === 'UCA' || profile.subjectsMode === 'EXPLICIT' ||
      profile.classesMode === 'UCA' || profile.classesMode === 'EXPLICIT'
    );

    if (existingAccesses.length === 0 && !hasVisibilityRestriction) {
      // No restrictions configured → unrestricted access
      return {
        unrestricted: true,
        categoryIds: [],
        programIds: [],
        subjectIds: [],
        classIds: [],
        source: hasRole(normalized, ROLES.ADMIN) ? 'admin_default' : 'hr_default',
        visibility: {
          programs: 'ALL',
          subjects: 'ALL',
          classes: 'ALL',
          instructors: 'ALL',
          rooms: 'ALL',
        },
        explicitGrants: {
          instructorIds: [],
          roomIds: [],
          programIds: [],
          subjectIds: [],
          classIds: [],
        },
      };
    }

    // Restrictions exist → fall through to UCA resolution below
  }

  if (!userId) {
    return {
      unrestricted: false,
      categoryIds: [],
      programIds: [],
      subjectIds: [],
      classIds: [],
      source: 'anonymous',
      visibility: { ...DEFAULT_VISIBILITY },
      explicitGrants: {
        instructorIds: [], roomIds: [], programIds: [], subjectIds: [], classIds: [],
      },
    };
  }

  const categoryIds = new Set();
  const programIds = new Set();
  const subjectIds = new Set();
  const classIds = new Set();

  const accesses = await prisma.userCategoryAccess.findMany({
    where: {
      userId,
      isActive: true,
      OR: [{ canView: true }, { canManage: true }],
    },
    include: {
      category: {
        include: {
          programs: { select: { id: true } },
        },
      },
    },
  });

  // For Admin/HR with restrictions: also include instructor taught classes if they are also instructors
  for (const access of accesses) {
    categoryIds.add(access.categoryId);

    if (access.classId) classIds.add(access.classId);
    if (access.subjectId) subjectIds.add(access.subjectId);
    if (access.programId) programIds.add(access.programId);

    if (!access.programId && !access.subjectId && !access.classId && access.category?.programs) {
      access.category.programs.forEach((prog) => programIds.add(prog.id));
    }
  }

  if (hasRole(normalized, ROLES.INSTRUCTOR)) {
    const taughtClasses = await prisma.class.findMany({
      where: { instructorId: userId },
      select: { id: true, programId: true, subjectId: true },
    });
    taughtClasses.forEach((c) => {
      classIds.add(c.id);
      if (c.programId) programIds.add(c.programId);
      if (c.subjectId) subjectIds.add(c.subjectId);
    });
  }

  const { visibility, explicitGrants } = await loadVisibilityContext(userId);
  const hasExplicitScope = categoryIds.size > 0 || programIds.size > 0 || subjectIds.size > 0 || classIds.size > 0;

  // Determine the source label
  const sourceLabel = hasRole(normalized, ROLES.ADMIN) ? 'admin_restricted' :
    hasRole(normalized, ROLES.HR) ? 'hr_restricted' :
    hasExplicitScope ? 'user_category_access' : 'empty';

  return {
    unrestricted: false,
    categoryIds: [...categoryIds],
    programIds: [...programIds],
    subjectIds: [...subjectIds],
    classIds: [...classIds],
    source: sourceLabel,
    canManageCategoryIds: accesses.filter((a) => a.canManage).map((a) => a.categoryId),
    visibility,
    explicitGrants,
  };
}

/** Academic writes always use UCA class/program ids (visibility ALL does not widen writes). */
export function canWriteInScope(scope) {
  if (!scope || scope.unrestricted) return true;
  return (scope.canManageCategoryIds || []).length > 0;
}

export function filterByDataScope(items, scope, fieldMap = {}) {
  return filterByDataScopeWithMode(items, scope, fieldMap, 'classes');
}

/** Filter list by visibility mode for a dimension (programs|subjects|classes|instructors|rooms). */
export function filterByDataScopeWithMode(items, scope, fieldMap = {}, dimension = 'classes') {
  if (!scope || scope.unrestricted) return items;

  const modeKey = {
    programs: 'programs',
    subjects: 'subjects',
    classes: 'classes',
    instructors: 'instructors',
    rooms: 'rooms',
  }[dimension] || 'classes';

  const mode = scope.visibility?.[modeKey] ?? DEFAULT_VISIBILITY[modeKey];
  if (mode === 'ALL') return items;

  const {
    idField = 'id',
    categoryField = 'categoryId',
    programField = 'programId',
    subjectField = 'subjectId',
    classField = 'classId',
    instructorField = 'instructorUserId',
    roomField = 'classroomId',
  } = fieldMap;

  if (mode === 'EXPLICIT') {
    const grants = scope.explicitGrants || {};
    const grantMap = {
      programs: grants.programIds,
      subjects: grants.subjectIds,
      classes: grants.classIds,
      instructors: grants.instructorIds,
      rooms: grants.roomIds,
    };
    const allowed = new Set(grantMap[modeKey] || []);
    return (items || []).filter((item) => {
      const id = item[idField] ?? item[instructorField] ?? item[roomField] ?? item[classField];
      return id != null && allowed.has(Number(id));
    });
  }

  const { categoryIds, programIds, subjectIds, classIds } = scope;
  return (items || []).filter((item) => {
    const classId = item[classField];
    const subjectId = item[subjectField];
    const programId = item[programField];
    const categoryId = item[categoryField];
    const id = item[idField];
    const instructorId = item[instructorField] ?? item.instructorId;
    const roomId = item[roomField];

    if (modeKey === 'instructors' && instructorId != null) {
      return classIds.length > 0 || programIds.length > 0; // UCA linkage checked by caller for instructors
    }
    if (modeKey === 'rooms' && roomId != null) {
      return classIds.includes(Number(roomId)); // rooms UCA handled in schedulingScope
    }

    if (classId != null && classIds.includes(Number(classId))) return true;
    if (subjectId != null && subjectIds.includes(Number(subjectId))) return true;
    if (programId != null && programIds.includes(Number(programId))) return true;
    if (categoryId != null && categoryIds.includes(Number(categoryId))) return true;
    if (id != null && classIds.includes(Number(id))) return true;
    return false;
  });
}

export default {
  getEffectiveDataScope,
  filterByDataScope,
  filterByDataScopeWithMode,
  canWriteInScope,
};
