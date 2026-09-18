/**
 * AI Query Tool: Academic Closure Info
 *
 * Academic closure info by type and scope.
 */

import prisma from '../../db/prismaClient.js';

export async function execute(req, params = {}) {
  const now = new Date();

  const closures = await prisma.academicClosure.findMany({
    where: {
      OR: [
        { dateFrom: { gte: now } },
        { dateTo: { gte: now } },
      ],
    },
    select: {
      id: true,
      closureType: true,
      scopeType: true,
      dateFrom: true,
      dateTo: true,
      programId: true,
      classId: true,
      status: true,
      closedAt: true,
      reopenedAt: true,
    },
    orderBy: { dateFrom: 'asc' },
    take: 20,
  });

  const typeBreakdown = {};
  const scopeBreakdown = {};
  for (const c of closures) {
    const typeCode = c.closureType || 'UNKNOWN';
    if (!typeBreakdown[typeCode]) {
      typeBreakdown[typeCode] = { name: typeCode, count: 0 };
    }
    typeBreakdown[typeCode].count++;

    const scopeCode = c.scopeType || 'UNKNOWN';
    if (!scopeBreakdown[scopeCode]) {
      scopeBreakdown[scopeCode] = { name: scopeCode, count: 0 };
    }
    scopeBreakdown[scopeCode].count++;
  }

  return {
    success: true,
    data: {
      closures: closures.map((c) => ({
        id: c.id,
        closureType: c.closureType,
        scopeType: c.scopeType,
        dateFrom: c.dateFrom?.toISOString?.() || null,
        dateTo: c.dateTo?.toISOString?.() || null,
        programId: c.programId,
        classId: c.classId,
        status: c.status,
        closedAt: c.closedAt?.toISOString?.() || null,
        reopenedAt: c.reopenedAt?.toISOString?.() || null,
      })),
      count: closures.length,
      typeBreakdown,
      scopeBreakdown,
    },
  };
}

export default { execute };
