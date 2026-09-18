/**
 * AI Query Tool: Marks Summary
 *
 * Aggregates student scores, averages, pass/fail counts for scoped classes.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { classId, programId, className, programName } = params;

  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return {
      success: false,
      error: scopeResult.reason,
    };
  }

  const marks = await prisma.studentMarks.findMany({
    where: {
      ...scopeResult.filter,
      class: { isActive: true },
    },
    select: {
      totalMarks: true,
      letterGrade: true,
      class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
  });

  if (marks.length === 0) {
    return {
      success: true,
      data: {
        totalRecords: 0,
        average: 0,
        passed: 0,
        failed: 0,
        target: className || programName || 'All Permitted Classes',
        targetAr: className || programName || 'كافة الفصول المصرح بها',
      },
    };
  }

  let totalSum = 0;
  let countWithMarks = 0;
  let passedCount = 0;
  let failedCount = 0;

  const FAIL_GRADES = ['f', 'fa', 'fb', 'wf'];

  for (const m of marks) {
    if (m.totalMarks != null && !isNaN(m.totalMarks)) {
      totalSum += Number(m.totalMarks);
      countWithMarks++;
    }
    const grade = (m.letterGrade || '').toLowerCase();
    if (grade) {
      if (FAIL_GRADES.includes(grade)) {
        failedCount++;
      } else {
        passedCount++;
      }
    } else if (m.totalMarks != null && !isNaN(m.totalMarks)) {
      if (Number(m.totalMarks) >= 60) {
        passedCount++;
      } else {
        failedCount++;
      }
    }
  }

  const average = countWithMarks > 0 ? (totalSum / countWithMarks).toFixed(2) : 0;

  return {
    success: true,
    data: {
      totalRecords: marks.length,
      average,
      passed: passedCount,
      failed: failedCount,
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
