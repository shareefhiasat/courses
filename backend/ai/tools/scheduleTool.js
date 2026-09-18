/**
 * AI Query Tool: Schedule Summary
 *
 * Retrieves scheduled calendar lectures and time slots for scoped classes.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { dateFrom, dateTo, classId, programId, className, programName, labelEn, labelAr } = params;

  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return {
      success: false,
      error: scopeResult.reason,
    };
  }

  const where = {
    ...scopeResult.filter,
    isActive: true,
  };

  if (dateFrom && dateTo) {
    where.startDateTime = {
      gte: dateFrom,
      lte: dateTo,
    };
  }

  const sessions = await prisma.scheduledSession.findMany({
    where,
    select: {
      id: true,
      startDateTime: true,
      endDateTime: true,
      sessionType: true,
      status: true,
      class: {
        select: {
          id: true,
          code: true,
          nameEn: true,
          nameAr: true,
          subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
        },
      },
      instructor: {
        select: {
          id: true,
          displayName: true,
          displayNameAr: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
        },
      },
      classroom: {
        select: { id: true, code: true, nameEn: true, nameAr: true, roomNumber: true },
      },
    },
    orderBy: { startDateTime: 'asc' },
    take: 20,
  });

  return {
    success: true,
    data: {
      sessionCount: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        className: s.class?.nameAr || s.class?.nameEn || s.class?.code,
        subjectName: s.class?.subject?.nameAr || s.class?.subject?.nameEn || s.class?.subject?.code,
        instructorName: s.instructor?.displayNameAr || s.instructor?.displayName || `${s.instructor?.firstName || ''} ${s.instructor?.lastName || ''}`.trim() || 'Not assigned',
        room: s.classroom?.nameAr || s.classroom?.nameEn || s.classroom?.code || s.classroom?.roomNumber || 'TBD',
        startTime: s.startDateTime?.toISOString().replace('T', ' ').substring(0, 16),
        status: s.status,
      })),
      dateRange: { labelEn, labelAr },
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
