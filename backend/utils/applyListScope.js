/**
 * Apply effective data scope to list API results.
 */

import { getRequestScope, filterRecordsByScope } from './scopeAccess.js';

/** Common field maps for hierarchy filtering */
export const SCOPE_FIELD_MAPS = {
  program: { idField: 'id', categoryField: 'categoryId' },
  subject: { idField: 'id', subjectField: 'id', programField: 'programId', categoryField: 'categoryId' },
  class: {
    idField: 'id',
    classField: 'id',
    subjectField: 'subjectId',
    programField: 'programId',
    categoryField: 'categoryId',
  },
  classLinked: {
    classField: 'classId',
    subjectField: 'subjectId',
    programField: 'programId',
    categoryField: 'categoryId',
  },
  enrollment: {
    classField: 'classId',
    programField: 'programId',
    categoryField: 'categoryId',
  },
  activity: {
    classField: 'classId',
    subjectField: 'subjectId',
    programField: 'programId',
    categoryField: 'categoryId',
  },
};

/**
 * @param {object} req
 * @param {{ success?: boolean, data?: unknown[] }} result
 * @param {keyof SCOPE_FIELD_MAPS | object} fieldMapKey
 */
export async function applyListScope(req, result, fieldMapKey = 'classLinked') {
  if (!result || result.success === false || !req?.user) return result;

  const scope = await getRequestScope(req);
  if (scope.unrestricted) return result;

  const fieldMap = typeof fieldMapKey === 'string'
    ? SCOPE_FIELD_MAPS[fieldMapKey] || SCOPE_FIELD_MAPS.classLinked
    : fieldMapKey;

  const items = Array.isArray(result.data) ? result.data : [];
  const data = filterRecordsByScope(items, scope, fieldMap);

  return {
    ...result,
    data,
    total: data.length,
    totalPages: result.limit ? Math.ceil(data.length / result.limit) : result.totalPages,
  };
}

/** Filter a plain array (e.g. prisma direct queries). */
export async function scopeArray(req, items, fieldMapKey = 'classLinked') {
  if (!req?.user) return items || [];
  const scope = await getRequestScope(req);
  if (scope.unrestricted) return items || [];
  const fieldMap = SCOPE_FIELD_MAPS[fieldMapKey] || SCOPE_FIELD_MAPS.classLinked;
  return filterRecordsByScope(items || [], scope, fieldMap);
}

export default { applyListScope, scopeArray, SCOPE_FIELD_MAPS };
