/**
 * AI Query Tool: Standup Attendance
 *
 * Standup/morning assembly attendance summary.
 */

import prisma from '../../db/prismaClient.js';
import { getRequestScope } from '../scope.js';

export async function execute(req, params = {}) {
  const { dateFrom, dateTo, programId, programName, labelEn, labelAr } = params;

  const scope = await getRequestScope(req);

  // Build scope filter for program-scoped standup records
  const where = {};
  if (!scope.unrestricted) {
    let programIds = scope.programIds || [];
    if (programIds.length === 0 && (scope.classIds || []).length > 0) {
      const classes = await prisma.class.findMany({
        where: { id: { in: scope.classIds } },
        select: { programId: true },
      });
      programIds = [...new Set(classes.map((c) => c.programId).filter(Boolean))];
    }
    if (programId) {
      const pId = parseInt(programId, 10);
      if (!programIds.includes(pId)) {
        return { success: false, error: 'Requested program is outside your permitted data scope.' };
      }
      where.programId = pId;
    } else if (programIds.length > 0) {
      where.programId = { in: programIds };
    } else {
      return { success: true, data: { counts: { present: 0, absent: 0, late: 0, excused: 0, total: 0 }, attendanceRate: 0, dateRange: { labelEn, labelAr }, target: programName || 'All Permitted Programs', targetAr: programName || 'كافة البرامج المصرح بها' } };
    }
  } else if (programId) {
    where.programId = parseInt(programId, 10);
  }

  if (dateFrom && dateTo) {
    where.date = { gte: dateFrom, lte: dateTo };
  }

  const records = await prisma.standupAttendance.findMany({
    where,
    select: {
      userId: true,
      date: true,
      status: { select: { code: true, nameEn: true, nameAr: true } },
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  });

  const counts = { present: 0, absent: 0, late: 0, excused: 0, total: records.length };

  for (const rec of records) {
    const status = (rec.status?.code || '').toLowerCase();
    if (status === 'present') counts.present++;
    else if (status === 'absent') counts.absent++;
    else if (status === 'late') counts.late++;
    else if (status === 'excused' || status === 'leave') counts.excused++;
  }

  const attendanceRate = counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0;

  return {
    success: true,
    data: {
      counts,
      attendanceRate,
      dateRange: { labelEn, labelAr },
      target: programName || 'All Permitted Programs',
      targetAr: programName || 'كافة البرامج المصرح بها',
    },
  };
}

export default { execute };
