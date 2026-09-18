/**
 * AI Query Tool: Penalty Summary
 *
 * Summary of penalties by type and total points within user's permitted scope.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { programId, programName } = params;

  const scopeResult = await buildScopedFilter(req, { programId });
  if (!scopeResult.allowed) {
    return { success: false, error: scopeResult.reason };
  }

  const penalties = await prisma.penalty.findMany({
    where: { ...scopeResult.filter },
    select: {
      points: true,
      penaltyType: { select: { code: true, nameEn: true, nameAr: true } },
    },
  });

  const typeBreakdown = {};
  let totalPoints = 0;
  for (const p of penalties) {
    const code = p.penaltyType?.code || 'UNKNOWN';
    const name = p.penaltyType?.nameEn || p.penaltyType?.nameAr || code;
    if (!typeBreakdown[code]) {
      typeBreakdown[code] = { name, count: 0, points: 0 };
    }
    typeBreakdown[code].count++;
    typeBreakdown[code].points += p.points || 0;
    totalPoints += p.points || 0;
  }

  return {
    success: true,
    data: {
      totalPenalties: penalties.length,
      totalPoints,
      typeBreakdown,
      target: programName || 'All Permitted Classes',
      targetAr: programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
