/**
 * AI Query Tool: Subject Info
 *
 * Lists subjects with credits and program info, optionally filtered by program.
 */

import prisma from '../../db/prismaClient.js';
import { getScopedPrograms } from '../scope.js';

export async function execute(req, params = {}) {
  const { programId, programName } = params;

  const scopedPrograms = await getScopedPrograms(req);
  const scopedProgramIds = scopedPrograms.map((p) => p.id);

  if (scopedProgramIds.length === 0) {
    return { success: true, data: { subjects: [], count: 0 } };
  }

  const where = { isActive: true, programId: { in: scopedProgramIds } };
  if (programId) {
    where.programId = parseInt(programId, 10);
  }

  const subjects = await prisma.subject.findMany({
    where,
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      credits: true,
      descriptionEn: true,
      descriptionAr: true,
      program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
    orderBy: { code: 'asc' },
  });

  return {
    success: true,
    data: {
      subjects,
      count: subjects.length,
      target: programName || 'All Permitted Programs',
      targetAr: programName || 'كافة البرامج المصرح بها',
    },
  };
}

export default { execute };
