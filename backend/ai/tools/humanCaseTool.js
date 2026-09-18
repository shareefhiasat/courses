/**
 * AI Query Tool: Human Cases Count
 *
 * Counts and lists attendance records flagged as Human Case (حالة إنسانية).
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
    status: { code: ATTENDANCE_STATUS_CODES.HUMAN_CASE },
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
      humanCaseCount: records.length,
      sampleRecords: records.slice(0, 5).map((r) => ({
        studentName: r.user?.displayName || r.user?.displayNameAr || 'Unknown',
        studentNameAr: r.user?.displayNameAr || r.user?.displayName || 'Unknown',
        militaryNumber: r.user?.studentNumber,
        className: r.class?.nameEn || r.class?.nameAr || r.class?.code,
        classNameAr: r.class?.nameAr || r.class?.nameEn || r.class?.code,
        date: r.date?.toISOString().split('T')[0],
        notes: r.notes,
      })),
      dateRange: { labelEn, labelAr },
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
