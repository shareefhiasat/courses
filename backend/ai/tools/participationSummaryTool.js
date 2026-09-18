/**
 * AI Query Tool: Participation Summary
 *
 * Summary of participation by type (positive/negative) and total points.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { programId, programName } = params;

  const scopeResult = await buildScopedFilter(req, { programId });
  if (!scopeResult.allowed) {
    return { success: false, error: scopeResult.reason };
  }

  const participations = await prisma.participation.findMany({
    where: { ...scopeResult.filter },
    select: {
      points: true,
      participationType: { select: { code: true, nameEn: true, nameAr: true, isPositive: true } },
    },
  });

  const typeBreakdown = {};
  let totalPositive = 0;
  let totalNegative = 0;
  let totalPoints = 0;

  for (const p of participations) {
    const code = p.participationType?.code || 'UNKNOWN';
    const name = p.participationType?.nameEn || p.participationType?.nameAr || code;
    const isPositive = p.participationType?.isPositive ?? false;
    if (!typeBreakdown[code]) {
      typeBreakdown[code] = { name, count: 0, points: 0, isPositive };
    }
    typeBreakdown[code].count++;
    typeBreakdown[code].points += p.points || 0;
    totalPoints += p.points || 0;
    if (isPositive) {
      totalPositive += p.points || 0;
    } else {
      totalNegative += p.points || 0;
    }
  }

  return {
    success: true,
    data: {
      totalParticipations: participations.length,
      totalPoints,
      totalPositive,
      totalNegative,
      typeBreakdown,
      target: programName || 'All Permitted Classes',
      targetAr: programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
