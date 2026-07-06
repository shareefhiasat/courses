/**
 * Scoped user read access — self, full matrix view, or instructor class scope.
 */

import prisma from '../db/prismaClient.js';
import { getRequestScope } from './scopeAccess.js';
import { resolveUserWhereFromParam } from './database/userResolver.js';

export function isSelfUserParam(authUser, idParam) {
  if (!authUser || idParam == null || idParam === '') return false;

  const where = resolveUserWhereFromParam(idParam);
  if (!where) return false;

  if (where.id != null && authUser.dbId != null && Number(authUser.dbId) === Number(where.id)) {
    return true;
  }

  const kcId = authUser.keycloakId || authUser.id;
  if (where.keycloakId && kcId && String(kcId) === String(where.keycloakId)) {
    return true;
  }

  return false;
}

export async function getScopedUserIds(scope, requesterDbId) {
  const classIds = (scope?.classIds || []).map(Number).filter((id) => !Number.isNaN(id));
  const userIds = new Set();

  if (requesterDbId != null) {
    userIds.add(Number(requesterDbId));
  }

  if (!classIds.length) {
    return [...userIds];
  }

  const [enrollments, taughtClasses] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classId: { in: classIds } },
      select: { userId: true },
    }),
    prisma.class.findMany({
      where: { id: { in: classIds }, instructorId: { not: null } },
      select: { instructorId: true },
    }),
  ]);

  enrollments.forEach((e) => userIds.add(e.userId));
  taughtClasses.forEach((c) => {
    if (c.instructorId) userIds.add(c.instructorId);
  });

  return [...userIds];
}

export async function isUserInRequesterScope(req, targetUserId) {
  if (!req?.user || targetUserId == null) return false;

  const tid = Number(targetUserId);
  if (Number.isNaN(tid)) return false;

  if (req.user.dbId != null && Number(req.user.dbId) === tid) {
    return true;
  }

  const scope = await getRequestScope(req);
  if (scope.unrestricted) return true;

  const classIds = (scope.classIds || []).map(Number).filter((id) => !Number.isNaN(id));
  if (!classIds.length) return false;

  const [enrollment, taughtClass] = await Promise.all([
    prisma.enrollment.findFirst({
      where: { userId: tid, classId: { in: classIds } },
      select: { id: true },
    }),
    prisma.class.findFirst({
      where: { instructorId: tid, id: { in: classIds } },
      select: { id: true },
    }),
  ]);

  return !!(enrollment || taughtClass);
}

export async function attachEnrolledClasses(users, classIds = []) {
  const list = Array.isArray(users) ? users : [];
  if (!list.length) return list;

  const ids = list.map((u) => u.id).filter((id) => id != null);
  const scopedClassIds = (classIds || []).map(Number).filter((id) => !Number.isNaN(id));

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: { in: ids },
      ...(scopedClassIds.length ? { classId: { in: scopedClassIds } } : {}),
    },
    select: { userId: true, classId: true },
  });

  const enrolledMap = new Map();
  enrollments.forEach((e) => {
    if (!enrolledMap.has(e.userId)) enrolledMap.set(e.userId, []);
    enrolledMap.get(e.userId).push(String(e.classId));
  });

  return list.map((u) => ({
    ...u,
    enrolledClasses: enrolledMap.get(u.id) || [],
  }));
}

export default {
  isSelfUserParam,
  getScopedUserIds,
  isUserInRequesterScope,
  attachEnrolledClasses,
};
