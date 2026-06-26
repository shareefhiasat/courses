/**
 * Data-scope enforcement for scheduling summary / effort APIs.
 */

import prisma from '../db/prismaClient.js';
import { getRequestScope, assertClassInScope, assertProgramInScope } from './scopeAccess.js';


/** Intersect filter-derived class IDs with scope constraint (null scopeClassIds = unrestricted). */
export function intersectClassIdLists(filterClassIds, scopeClassIds) {
  if (scopeClassIds === null || scopeClassIds === undefined) return filterClassIds;
  if (!scopeClassIds.length) return [];
  if (!filterClassIds) return scopeClassIds;
  return filterClassIds.filter((id) => scopeClassIds.includes(id));
}

async function expandScopeClassIds(scope) {
  const allowed = new Set((scope.classIds || []).map(Number));

  if (scope.programIds?.length) {
    const rows = await prisma.class.findMany({
      where: { programId: { in: scope.programIds }, isActive: true },
      select: { id: true },
    });
    rows.forEach((r) => allowed.add(r.id));
  }

  if (scope.subjectIds?.length) {
    const rows = await prisma.class.findMany({
      where: { subjectId: { in: scope.subjectIds }, isActive: true },
      select: { id: true },
    });
    rows.forEach((r) => allowed.add(r.id));
  }

  return [...allowed];
}

/**
 * Resolve effective class IDs for scheduling queries under data scope.
 * @returns {{ ok: boolean, scope: object, scopeClassIds: number[]|null }}
 */
export async function resolveSchedulingClassScope(req, params = {}) {
  const scope = await getRequestScope(req);
  if (scope.unrestricted) {
    return { ok: true, scope, scopeClassIds: null };
  }

  if (params.classId) {
    const check = await assertClassInScope(req, params.classId);
    if (!check.ok) return { ok: false, scope, scopeClassIds: [] };
    return { ok: true, scope, scopeClassIds: [parseInt(params.classId, 10)] };
  }

  if (params.programId) {
    const check = await assertProgramInScope(req, params.programId);
    if (!check.ok) return { ok: false, scope, scopeClassIds: [] };
  }

  if (params.subjectId) {
    const sid = parseInt(params.subjectId, 10);
    const inScope = scope.subjectIds?.includes(sid);
    if (!inScope) {
      const subject = await prisma.subject.findUnique({
        where: { id: sid },
        select: { id: true, programId: true },
      });
      if (!subject || !scope.programIds?.includes(subject.programId)) {
        return { ok: false, scope, scopeClassIds: [] };
      }
    }
  }

  let allowed = await expandScopeClassIds(scope);

  const filterWhere = { isActive: true };
  if (params.programId) filterWhere.programId = parseInt(params.programId, 10);
  if (params.subjectId) filterWhere.subjectId = parseInt(params.subjectId, 10);
  if (params.term) filterWhere.term = params.term;
  if (params.year) filterWhere.year = String(params.year);

  if (params.programId || params.subjectId || params.term || params.year) {
    const matched = await prisma.class.findMany({ where: filterWhere, select: { id: true } });
    const matchedIds = new Set(matched.map((c) => c.id));
    allowed = allowed.filter((id) => matchedIds.has(id));
  }

  return { ok: true, scope, scopeClassIds: allowed };
}

/** Whether the requester may view a teacher's effort row (scoped admin / instructor). */
export async function canAccessTeacherInScope(req, teacherUserId) {
  const scope = await getRequestScope(req);
  if (scope.unrestricted) return true;

  const tid = parseInt(teacherUserId, 10);
  if (req.user?.dbId === tid) return true;

  const orClauses = [];
  if (scope.classIds?.length) {
    orClauses.push({ id: { in: scope.classIds } });
  }
  if (scope.programIds?.length) {
    orClauses.push({ programId: { in: scope.programIds } });
  }
  if (scope.subjectIds?.length) {
    orClauses.push({ subjectId: { in: scope.subjectIds } });
  }
  if (!orClauses.length) return false;

  const taughtClass = await prisma.class.findFirst({
    where: { instructorId: tid, isActive: true, OR: orClauses },
    select: { id: true },
  });
  if (taughtClass) return true;

  const flexProgramIds = scope.programIds?.length
    ? scope.programIds
    : (await prisma.class.findMany({
        where: { id: { in: scope.classIds || [] } },
        select: { programId: true },
      })).map((c) => c.programId).filter(Boolean);

  if (!flexProgramIds.length) return false;

  const flexSession = await prisma.flexibleScheduleSession.findFirst({
    where: {
      instructorUserId: tid,
      isActive: true,
      programId: { in: [...new Set(flexProgramIds)] },
    },
    select: { id: true },
  });

  return Boolean(flexSession);
}

/**
 * Attach scopeClassIds to params after instructor self-scope.
 * @returns {{ denied: boolean, params: object }}
 */
export async function applySchedulingDataScope(req, params) {
  const resolved = await resolveSchedulingClassScope(req, params);
  if (!resolved.ok) return { denied: true, params };
  return {
    denied: false,
    params: {
      ...params,
      scopeClassIds: resolved.scopeClassIds,
      _scope: resolved.scope,
    },
  };
}

export default {
  intersectClassIdLists,
  resolveSchedulingClassScope,
  canAccessTeacherInScope,
  applySchedulingDataScope,
};
