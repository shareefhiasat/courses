/**
 * AI Query Tool: Export History
 *
 * Recent export history records.
 */

import prisma from '../../db/prismaClient.js';

export async function execute(req, params = {}) {
  const rawUserId = req.user?.dbId ?? req.user?.id;
  const userId = parseInt(rawUserId, 10);
  const where = Number.isNaN(userId) ? {} : { userId };

  const exports = await prisma.exportHistory.findMany({
    where,
    select: {
      id: true,
      exportType: true,
      format: true,
      filename: true,
      createdAt: true,
      classId: true,
      subjectId: true,
      programId: true,
      reportDate: true,
      fileId: true,
      mimeType: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    success: true,
    data: {
      exports: exports.map((e) => ({
        id: e.id,
        exportType: e.exportType,
        format: e.format,
        filename: e.filename,
        createdAt: e.createdAt?.toISOString?.() || null,
        classId: e.classId,
        subjectId: e.subjectId,
        programId: e.programId,
        reportDate: e.reportDate,
        fileId: e.fileId,
        mimeType: e.mimeType,
      })),
      count: exports.length,
    },
  };
}

export default { execute };
