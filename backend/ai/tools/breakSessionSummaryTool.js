/**
 * AI Query Tool: Break Session Summary
 *
 * Summary of break sessions (tea, prayer, lunch) by type and count.
 */

import prisma from '../../db/prismaClient.js';

export async function execute(req, params = {}) {
  const breakSessions = await prisma.breakSession.findMany({
    where: { isActive: true },
    select: {
      id: true,
      date: true,
      breakType: true,
      descriptionEn: true,
      descriptionAr: true,
      notes: true,
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
      classroom: { select: { code: true, nameEn: true, nameAr: true } },
      timeSlot: { select: { labelEn: true, labelAr: true, startTime: true, endTime: true } },
    },
    orderBy: { date: 'asc' },
    take: 30,
  });

  const typeBreakdown = {};
  for (const b of breakSessions) {
    const code = b.breakType || 'UNKNOWN';
    if (!typeBreakdown[code]) {
      typeBreakdown[code] = { name: code, count: 0 };
    }
    typeBreakdown[code].count++;
  }

  return {
    success: true,
    data: {
      breakSessions: breakSessions.map((b) => ({
        id: b.id,
        date: b.date?.toISOString?.() || null,
        breakType: b.breakType,
        nameEn: b.descriptionEn,
        nameAr: b.descriptionAr,
        notes: b.notes,
        programName: b.program?.nameEn || b.program?.nameAr || b.program?.code || null,
        classroom: b.classroom?.nameEn || b.classroom?.nameAr || b.classroom?.code || null,
        timeSlot: b.timeSlot
          ? (b.timeSlot.labelEn || b.timeSlot.labelAr || `${b.timeSlot.startTime} - ${b.timeSlot.endTime}`)
          : null,
      })),
      count: breakSessions.length,
      typeBreakdown,
    },
  };
}

export default { execute };
