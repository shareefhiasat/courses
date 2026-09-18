/**
 * AI Query Tool: Marks Distribution
 *
 * Marks distribution weights for a subject within user's permitted scope.
 */

import prisma from '../../db/prismaClient.js';
import { getRequestScope } from '../scope.js';

export async function execute(req, params = {}) {
  const { subjectId, subjectName } = params;

  const scope = await getRequestScope(req);
  const where = {};

  if (subjectId) {
    where.subjectId = parseInt(subjectId, 10);
  } else if (!scope.unrestricted) {
    const subjectIds = new Set(scope.subjectIds || []);

    if ((scope.programIds || []).length > 0) {
      const programSubjects = await prisma.subject.findMany({
        where: { programId: { in: scope.programIds } },
        select: { id: true },
      });
      programSubjects.forEach((s) => subjectIds.add(s.id));
    }

    if ((scope.classIds || []).length > 0) {
      const classes = await prisma.class.findMany({
        where: { id: { in: scope.classIds } },
        select: { subjectId: true },
      });
      classes.forEach((c) => { if (c.subjectId) subjectIds.add(c.subjectId); });
    }

    if (subjectIds.size === 0) {
      return {
        success: true,
        data: {
          distributions: [],
          count: 0,
          target: subjectName || 'All Permitted Subjects',
          targetAr: subjectName || 'كافة المواد المصرح بها',
        },
      };
    }

    where.subjectId = { in: [...subjectIds] };
  }

  const distributions = await prisma.marksDistribution.findMany({
    where,
    select: {
      id: true,
      midTermExam: true,
      finalExam: true,
      homework: true,
      labsProjectResearch: true,
      quizzes: true,
      participation: true,
      attendance: true,
      subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  });

  return {
    success: true,
    data: {
      distributions,
      count: distributions.length,
      target: subjectName || 'All Permitted Subjects',
      targetAr: subjectName || 'كافة المواد المصرح بها',
    },
  };
}

export default { execute };
