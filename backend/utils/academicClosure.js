/**
 * Academic Closure Gatekeeper
 *
 * Checks if a period is closed before allowing workflow creation or attendance updates.
 */

import prisma from '../db/prismaClient.js';

/**
 * Check if a date range is closed for a given scope.
 * Returns the closure record if closed, null otherwise.
 *
 * @param {{ dateFrom: string|Date, dateTo: string|Date, scopeType?: string, programId?: number, classId?: number }} params
 * @returns {Promise<object|null>}
 */
export async function checkAcademicClosure({ dateFrom, dateTo, scopeType = 'PROGRAM', programId, classId }) {
  if (!dateFrom || !dateTo) return null;

  const from = dateFrom instanceof Date ? dateFrom : new Date(dateFrom);
  const to = dateTo instanceof Date ? dateTo : new Date(dateTo);

  const where = {
    status: 'CLOSED',
    dateFrom: { lte: from },
    dateTo: { gte: to },
  };

  if (scopeType === 'GLOBAL') {
    where.scopeType = 'GLOBAL';
  } else if (scopeType === 'PROGRAM' && programId) {
    where.OR = [
      { scopeType: 'GLOBAL' },
      { scopeType: 'PROGRAM', programId: Number(programId) },
    ];
  } else if (scopeType === 'CLASS' && classId) {
    where.OR = [
      { scopeType: 'GLOBAL' },
      { scopeType: 'PROGRAM', programId: Number(programId) },
      { scopeType: 'CLASS', classId: Number(classId) },
    ];
  }

  const closure = await prisma.academicClosure.findFirst({
    where,
    orderBy: { closedAt: 'desc' },
  });

  return closure;
}

export default checkAcademicClosure;
