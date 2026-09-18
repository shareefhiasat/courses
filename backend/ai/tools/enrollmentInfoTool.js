/**
 * AI Query Tool: Enrollment Info
 *
 * Enrollment breakdown by status within user's permitted scope.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { programId, programName } = params;

  const scopeResult = await buildScopedFilter(req, { programId });
  if (!scopeResult.allowed) {
    return { success: false, error: scopeResult.reason };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { ...scopeResult.filter, class: { isActive: true } },
    select: {
      status: { select: { code: true, nameEn: true, nameAr: true } },
    },
  });

  const statusBreakdown = {};
  for (const enr of enrollments) {
    const code = enr.status?.code || 'UNKNOWN';
    const name = enr.status?.nameEn || enr.status?.nameAr || code;
    if (!statusBreakdown[code]) {
      statusBreakdown[code] = { name, count: 0 };
    }
    statusBreakdown[code].count++;
  }

  return {
    success: true,
    data: {
      totalEnrollments: enrollments.length,
      statusBreakdown,
      target: programName || 'All Permitted Classes',
      targetAr: programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
