/**
 * AI Query Tool: Program Info
 *
 * Lists programs with class, student, and subject counts.
 */

import prisma from '../../db/prismaClient.js';
import { getScopedPrograms } from '../scope.js';

export async function execute(req, params = {}) {
  const programs = await getScopedPrograms(req);

  const programIds = programs.map((p) => p.id);

  if (programIds.length === 0) {
    return {
      success: true,
      data: {
        programs: [],
        count: 0,
      },
    };
  }

  const [classes, subjects, enrollments] = await Promise.all([
    prisma.class.groupBy({
      by: ['programId'],
      where: { programId: { in: programIds }, isActive: true },
      _count: { id: true },
    }),
    prisma.subject.groupBy({
      by: ['programId'],
      where: { programId: { in: programIds }, isActive: true },
      _count: { id: true },
    }),
    prisma.enrollment.groupBy({
      by: ['programId'],
      where: { programId: { in: programIds } },
      _count: { userId: true },
    }),
  ]);

  const classMap = Object.fromEntries(classes.map((c) => [c.programId, c._count.id]));
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.programId, s._count.id]));
  const enrollMap = Object.fromEntries(enrollments.map((e) => [e.programId, e._count.userId]));

  const programList = programs.map((p) => ({
    id: p.id,
    code: p.code,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    classCount: classMap[p.id] || 0,
    subjectCount: subjectMap[p.id] || 0,
    studentCount: enrollMap[p.id] || 0,
  }));

  return {
    success: true,
    data: {
      programs: programList,
      count: programList.length,
    },
  };
}

export default { execute };
