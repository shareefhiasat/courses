/**
 * AI Query Tool: Quiz Summary
 *
 * Quiz stats: total quizzes, attempts, average scores, pass rate.
 */

import prisma from '../../db/prismaClient.js';
import { getRequestScope } from '../scope.js';

export async function execute(req, params = {}) {
  const { classId, programId, className, programName } = params;

  const scope = await getRequestScope(req);
  const where = {};

  if (classId) {
    where.activities = { some: { classId: parseInt(classId, 10) } };
  } else if (programId) {
    where.activities = { some: { class: { programId: parseInt(programId, 10) } } };
  } else if (!scope.unrestricted) {
    const conditions = [];
    if ((scope.classIds || []).length > 0) {
      conditions.push({ classId: { in: scope.classIds } });
    }
    if ((scope.programIds || []).length > 0) {
      conditions.push({ class: { programId: { in: scope.programIds } } });
    }
    if (conditions.length === 0) {
      return {
        success: true,
        data: {
          totalQuizzes: 0,
          totalAttempts: 0,
          avgScore: 0,
          passRate: 0,
          passedCount: 0,
          statusBreakdown: {},
          target: className || programName || 'All Permitted Classes',
          targetAr: className || programName || 'كافة الفصول المصرح بها',
        },
      };
    }
    where.activities = { some: { OR: conditions } };
  }

  const quizzes = await prisma.quiz.findMany({
    where,
    select: {
      id: true,
      titleEn: true,
      titleAr: true,
      isActive: true,
      passingScore: true,
      _count: { select: { attempts: true } },
    },
  });

  const quizIds = quizzes.map((q) => q.id);
  const attempts = quizIds.length > 0
    ? await prisma.quizAttempt.findMany({
        where: { quizId: { in: quizIds } },
        select: { score: true, passed: true },
      })
    : [];

  const totalAttempts = attempts.length;
  const passedCount = attempts.filter((a) => a.passed).length;
  const avgScore = totalAttempts > 0
    ? Math.round((attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts) * 100) / 100
    : 0;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

  const statusBreakdown = {};
  for (const q of quizzes) {
    const code = q.isActive ? 'active' : 'inactive';
    const name = q.isActive ? 'Active' : 'Inactive';
    if (!statusBreakdown[code]) {
      statusBreakdown[code] = { name, count: 0 };
    }
    statusBreakdown[code].count++;
  }

  return {
    success: true,
    data: {
      totalQuizzes: quizzes.length,
      totalAttempts,
      avgScore,
      passRate,
      passedCount,
      statusBreakdown,
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
