/**
 * AI Query Tool: Student Count
 *
 * Counts enrolled students within user's permitted data scope.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { classId, programId, className, programName } = params;

  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return {
      success: false,
      error: scopeResult.reason,
    };
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      ...scopeResult.filter,
      class: { isActive: true },
    },
    select: {
      userId: true,
      classId: true,
      programId: true,
      class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  });

  const totalEnrollments = enrollments.length;
  const uniqueStudents = new Set(enrollments.map((e) => e.userId)).size;

  // Breakdown per class
  const classBreakdown = {};
  for (const enr of enrollments) {
    const cName = enr.class?.nameAr || enr.class?.nameEn || enr.class?.code || `Class ${enr.classId}`;
    classBreakdown[cName] = (classBreakdown[cName] || 0) + 1;
  }

  return {
    success: true,
    data: {
      totalEnrollments,
      uniqueStudents,
      classBreakdown,
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
