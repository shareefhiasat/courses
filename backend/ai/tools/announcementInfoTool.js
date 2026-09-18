/**
 * AI Query Tool: Announcement Info
 *
 * Recent announcements count and list with titles/dates.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { classId, programId, className, programName } = params;

  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return { success: false, error: scopeResult.reason };
  }

  const announcements = await prisma.announcement.findMany({
    where: { ...scopeResult.filter, isActive: true },
    select: {
      id: true,
      titleEn: true,
      titleAr: true,
      descriptionEn: true,
      descriptionAr: true,
      createdAt: true,
      publishAt: true,
      expiresAt: true,
      targetAudience: { select: { code: true, nameEn: true, nameAr: true } },
      class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  return {
    success: true,
    data: {
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.titleEn || a.titleAr,
        createdAt: a.createdAt?.toISOString?.() || null,
        audience: a.targetAudience?.nameEn || a.targetAudience?.nameAr || null,
        className: a.class?.nameEn || a.class?.nameAr || a.class?.code || null,
        programName: a.program?.nameEn || a.program?.nameAr || a.program?.code || null,
      })),
      count: announcements.length,
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
