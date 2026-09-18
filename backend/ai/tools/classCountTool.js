/**
 * AI Query Tool: Class Count
 *
 * Counts active classes within user's permitted data scope.
 */

import prisma from '../../db/prismaClient.js';
import { getScopedClasses } from '../scope.js';

export async function execute(req, params = {}) {
  const { programId, programName, list } = params;

  let classes = await getScopedClasses(req);

  if (programId) {
    classes = classes.filter((c) => c.programId === parseInt(programId, 10));
  }

  const totalCount = classes.length;

  if (list) {
    const sorted = [...classes].sort((a, b) => {
      const aProg = a.program?.nameEn || a.program?.code || '';
      const bProg = b.program?.nameEn || b.program?.code || '';
      if (aProg !== bProg) return aProg.localeCompare(bProg);
      const aName = a.nameEn || a.code || '';
      const bName = b.nameEn || b.code || '';
      return aName.localeCompare(bName);
    });
    const listItems = sorted.slice(0, 50).map((c) => ({
      name: c.nameAr || c.nameEn || c.code,
      code: c.code,
      program: c.program?.nameAr || c.program?.nameEn || c.program?.code || '-',
      subject: c.subject?.nameAr || c.subject?.nameEn || c.subject?.code || '-',
    }));
    return {
      success: true,
      data: {
        totalCount,
        classes: listItems,
        target: programName || 'All Permitted Programs',
        targetAr: programName || 'كافة البرامج المصرح بها',
      },
    };
  }

  const programBreakdown = {};
  for (const c of classes) {
    const pName = c.program?.nameAr || c.program?.nameEn || c.program?.code || `Program ${c.programId}`;
    programBreakdown[pName] = (programBreakdown[pName] || 0) + 1;
  }

  return {
    success: true,
    data: {
      totalCount,
      programBreakdown,
      target: programName || 'All Permitted Programs',
      targetAr: programName || 'كافة البرامج المصرح بها',
    },
  };
}

export default { execute };
