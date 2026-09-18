/**
 * AI Query Tool: Behavior Summary
 *
 * Summary of behaviors by type and total points within user's permitted scope.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { programId, programName } = params;

  const scopeResult = await buildScopedFilter(req, { programId });
  if (!scopeResult.allowed) {
    return { success: false, error: scopeResult.reason };
  }

  const behaviors = await prisma.behavior.findMany({
    where: { ...scopeResult.filter },
    select: {
      points: true,
      behaviorType: { select: { code: true, nameEn: true, nameAr: true } },
    },
  });

  const typeBreakdown = {};
  let totalPoints = 0;
  for (const b of behaviors) {
    const code = b.behaviorType?.code || 'UNKNOWN';
    const name = b.behaviorType?.nameEn || b.behaviorType?.nameAr || code;
    if (!typeBreakdown[code]) {
      typeBreakdown[code] = { name, count: 0, points: 0 };
    }
    typeBreakdown[code].count++;
    typeBreakdown[code].points += b.points || 0;
    totalPoints += b.points || 0;
  }

  return {
    success: true,
    data: {
      totalBehaviors: behaviors.length,
      totalPoints,
      typeBreakdown,
      target: programName || 'All Permitted Classes',
      targetAr: programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
