/**
 * Data-scope helpers for API controllers (category → program → subject → class).
 */

import { PrismaClient } from '@prisma/client';
import { getEffectiveDataScope, filterByDataScope } from '../services/scopeResolver.js';

const prisma = new PrismaClient();

export async function getRequestScope(req) {
  if (req.dataScope) return req.dataScope;
  if (!req.user) {
    return {
      unrestricted: false,
      categoryIds: [],
      programIds: [],
      subjectIds: [],
      classIds: [],
      source: 'anonymous',
    };
  }
  return getEffectiveDataScope(req.user.dbId, req.user.roles || []);
}

export function isRecordInScope(scope, record = {}) {
  if (!scope || scope.unrestricted) return true;
  const classId = record.classId ?? record.id;
  const { categoryIds, programIds, subjectIds, classIds } = scope;
  if (classId != null && classIds.includes(Number(classId))) return true;
  if (record.subjectId != null && subjectIds.includes(Number(record.subjectId))) return true;
  if (record.programId != null && programIds.includes(Number(record.programId))) return true;
  if (record.categoryId != null && categoryIds.includes(Number(record.categoryId))) return true;
  return false;
}

export function filterRecordsByScope(items, scope, fieldMap) {
  return filterByDataScope(items, scope, fieldMap);
}

export async function assertClassInScope(req, classId) {
  const scope = await getRequestScope(req);
  if (scope.unrestricted) return { ok: true, scope };

  const cid = parseInt(classId, 10);
  if (Number.isNaN(cid)) return { ok: false, scope, reason: 'invalid_class' };
  if (scope.classIds.includes(cid)) return { ok: true, scope };

  const cls = await prisma.class.findUnique({
    where: { id: cid },
    select: { id: true, programId: true, subjectId: true, categoryId: true },
  });
  if (!cls) return { ok: false, scope, reason: 'class_not_found' };
  if (isRecordInScope(scope, cls)) return { ok: true, scope };

  return { ok: false, scope, reason: 'out_of_scope' };
}

export async function assertProgramInScope(req, programId) {
  const scope = await getRequestScope(req);
  if (scope.unrestricted) return { ok: true, scope };

  const pid = parseInt(programId, 10);
  if (Number.isNaN(pid)) return { ok: false, scope, reason: 'invalid_program' };
  if (scope.programIds.includes(pid)) return { ok: true, scope };

  const program = await prisma.program.findUnique({
    where: { id: pid },
    select: { id: true, categoryId: true },
  });
  if (!program) return { ok: false, scope, reason: 'program_not_found' };
  if (program.categoryId != null && scope.categoryIds.includes(program.categoryId)) {
    return { ok: true, scope };
  }

  return { ok: false, scope, reason: 'out_of_scope' };
}

export function scopeForbidden(res, message = 'Access denied: outside your data scope') {
  return res.status(403).json({ success: false, error: message });
}

export default {
  getRequestScope,
  isRecordInScope,
  filterRecordsByScope,
  assertClassInScope,
  assertProgramInScope,
  scopeForbidden,
};
