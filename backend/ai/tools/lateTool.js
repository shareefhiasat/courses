/**
 * AI Query Tool: Late Records Summary (ADMIN ONLY)
 *
 * Retrieves late attendance counts and late occurrences.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';
import { ATTENDANCE_STATUS_CODES } from '../../constants/attendanceConstants.js';

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
    status: { code: ATTENDANCE_STATUS_CODES.LATE },
  };

  if (dateFrom && dateTo) {
    where.date = {
      gte: dateFrom,
      lte: dateTo,
    };
  }

  const records = await prisma.attendance.findMany({
    where,
    select: {
      id: true,
      date: true,
      notes: true,
      user: {
        select: {
          id: true,
          displayName: true,
          displayNameAr: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
          studentNumber: true,
        },
      },
      class: {
        select: { id: true, code: true, nameEn: true, nameAr: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  return {
    success: true,
    data: {
      lateCount: records.length,
      sampleRecords: records.slice(0, 5).map((r) => ({
        studentName: r.user?.displayName || `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim(),
        studentNameAr: r.user?.displayNameAr || `${r.user?.firstNameAr || ''} ${r.user?.lastNameAr || ''}`.trim(),
        militaryNumber: r.user?.studentNumber,
        className: r.class?.nameAr || r.class?.nameEn || r.class?.code,
        date: r.date?.toISOString().split('T')[0],
      })),
      dateRange: { labelEn, labelAr },
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
