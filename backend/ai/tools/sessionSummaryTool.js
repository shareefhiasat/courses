/**
 * AI Query Tool: Session Summary
 *
 * Scheduled session counts by status and type.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { dateFrom, dateTo, classId, programId, className, programName, labelEn, labelAr } = params;

  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return { success: false, error: scopeResult.reason };
  }

  const where = { ...scopeResult.filter, isActive: true, deletedAt: null };
  if (dateFrom && dateTo) {
    where.startDateTime = { gte: dateFrom, lte: dateTo };
  }

  const sessions = await prisma.scheduledSession.findMany({
    where,
    select: {
      id: true,
      status: true,
      sessionType: true,
    },
  });

  const statusBreakdown = {};
  const typeBreakdown = {};

  for (const s of sessions) {
    const sCode = s.status || 'UNKNOWN';
    if (!statusBreakdown[sCode]) {
      statusBreakdown[sCode] = { name: sCode, count: 0 };
    }
    statusBreakdown[sCode].count++;

    const tCode = s.sessionType || 'UNKNOWN';
    if (!typeBreakdown[tCode]) {
      typeBreakdown[tCode] = { name: tCode, count: 0 };
    }
    typeBreakdown[tCode].count++;
  }

  return {
    success: true,
    data: {
      totalSessions: sessions.length,
      statusBreakdown,
      typeBreakdown,
      dateRange: { labelEn, labelAr },
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
