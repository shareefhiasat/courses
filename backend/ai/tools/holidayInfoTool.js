/**
 * AI Query Tool: Holiday Info
 *
 * Lists upcoming/current holidays.
 */

import prisma from '../../db/prismaClient.js';

export async function execute(req, params = {}) {
  const now = new Date();

  const holidays = await prisma.holiday.findMany({
    where: {
      OR: [
        { startDate: { gte: now } },
        { endDate: { gte: now } },
      ],
    },
    select: {
      id: true,
      descriptionEn: true,
      descriptionAr: true,
      type: true,
      startDate: true,
      endDate: true,
      isRecurring: true,
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
    orderBy: { startDate: 'asc' },
    take: 20,
  });

  return {
    success: true,
    data: {
      holidays: holidays.map((h) => ({
        id: h.id,
        nameEn: h.descriptionEn,
        nameAr: h.descriptionAr,
        typeName: h.type,
        startDate: h.startDate?.toISOString?.() || null,
        endDate: h.endDate?.toISOString?.() || null,
        isRecurring: h.isRecurring,
        programName: h.program?.nameEn || h.program?.nameAr || h.program?.code || null,
      })),
      count: holidays.length,
    },
  };
}

export default { execute };
