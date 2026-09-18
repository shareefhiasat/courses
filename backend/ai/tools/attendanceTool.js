/**
 * AI Query Tool: Attendance Summary
 *
 * Computes attendance breakdown (present, absent, excused, human case)
 * respecting date ranges, specific class/program, and user data scope.
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
      userId: true,
      status: { select: { code: true } },
      class: { select: { id: true, nameEn: true, nameAr: true, code: true } },
    },
  });

  const counts = {
    present: 0,
    absent: 0,
    excused: 0,
    humanCase: 0,
    total: records.length,
  };

  for (const rec of records) {
    const code = rec.status?.code;
    if (code === ATTENDANCE_STATUS_CODES.PRESENT) counts.present++;
    else if (code === ATTENDANCE_STATUS_CODES.ABSENT) counts.absent++;
    else if (code === ATTENDANCE_STATUS_CODES.LEAVE) counts.excused++;
    else if (code === ATTENDANCE_STATUS_CODES.HUMAN_CASE) counts.humanCase++;
  }

  const attendanceRate = counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0;

  return {
    success: true,
    data: {
      counts,
      attendanceRate,
      dateRange: { labelEn, labelAr },
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
