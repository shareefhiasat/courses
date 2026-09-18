/**
 * AI Query Tool: Submission Summary
 *
 * Submission counts by status within user's permitted scope.
 */

import prisma from '../../db/prismaClient.js';
import { getRequestScope } from '../scope.js';

export async function execute(req, params = {}) {
  const { classId, programId, className, programName } = params;

  const scope = await getRequestScope(req);
  const where = {};

  if (classId) {
    where.activity = { classId: parseInt(classId, 10) };
  } else if (programId) {
    where.activity = { class: { programId: parseInt(programId, 10) } };
  } else if (!scope.unrestricted) {
    const activityConditions = [];
    if ((scope.classIds || []).length > 0) {
      activityConditions.push({ classId: { in: scope.classIds } });
    }
    if ((scope.programIds || []).length > 0) {
      activityConditions.push({ class: { programId: { in: scope.programIds } } });
    }
    if (activityConditions.length === 0) {
      return {
        success: true,
        data: {
          totalSubmissions: 0,
          statusBreakdown: {},
          target: className || programName || 'All Permitted Classes',
          targetAr: className || programName || 'كافة الفصول المصرح بها',
        },
      };
    }
    where.activity = { OR: activityConditions };
  }

  const submissions = await prisma.submission.findMany({
    where,
    select: {
      status: { select: { code: true, nameEn: true, nameAr: true } },
    },
  });

  const statusBreakdown = {};
  for (const s of submissions) {
    const code = s.status?.code || 'UNKNOWN';
    const name = s.status?.nameEn || s.status?.nameAr || code;
    if (!statusBreakdown[code]) {
      statusBreakdown[code] = { name, count: 0 };
    }
    statusBreakdown[code].count++;
  }

  return {
    success: true,
    data: {
      totalSubmissions: submissions.length,
      statusBreakdown,
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
