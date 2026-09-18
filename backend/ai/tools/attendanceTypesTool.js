/**
 * AI Query Tool: Attendance Types
 *
 * Lists all active attendance status types in the system.
 */

import prisma from '../../db/prismaClient.js';

export async function execute(req, params = {}) {
  const types = await prisma.attendanceStatusTypes.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      description: true,
      color: true,
      isActive: true,
    },
    orderBy: { code: 'asc' },
  });

  return {
    success: true,
    data: {
      types,
      count: types.length,
    },
  };
}

export default { execute };
