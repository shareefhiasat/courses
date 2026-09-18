/**
 * AI Query Tool: Activity Info
 *
 * Lists class activities with type and submission counts.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { classId, programId, className, programName } = params;

  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return { success: false, error: scopeResult.reason };
  }

  const activities = await prisma.activity.findMany({
    where: { ...scopeResult.filter },
    select: {
      id: true,
      titleEn: true,
      titleAr: true,
      type: { select: { code: true, nameEn: true, nameAr: true } },
      dueDate: true,
      maxScore: true,
      class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { dueDate: 'desc' },
    take: 20,
  });

  return {
    success: true,
    data: {
      activities: activities.map((a) => ({
        id: a.id,
        title: a.titleEn || a.titleAr,
        typeCode: a.type?.code,
        typeName: a.type?.nameEn || a.type?.nameAr,
        dueDate: a.dueDate?.toISOString?.() || null,
        maxScore: a.maxScore,
        className: a.class?.nameEn || a.class?.nameAr || a.class?.code,
        submissionCount: a._count?.submissions || 0,
      })),
      count: activities.length,
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
