/**
 * AI Query Tool: Notes & Comments Summary (ADMIN ONLY)
 *
 * Retrieves internal remarks, comments, and rejection reasons
 * for workflows and attendance within permitted data scope.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { workflowId, classId, programId, className, programName } = params;

  // 1. If asking about a specific workflow document ID
  if (workflowId) {
    const doc = await prisma.workflowDocument.findUnique({
      where: { id: parseInt(workflowId, 10) },
      include: {
        comments: {
          include: {
            author: { select: { id: true, displayName: true, displayNameAr: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: {
          where: { reason: { not: null } },
          include: {
            actor: { select: { id: true, displayName: true, displayNameAr: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!doc) {
      return {
        success: false,
        error: `Workflow document #${workflowId} was not found.`,
      };
    }

    if (doc.classId) {
      const scopeResult = await buildScopedFilter(req, { classId: doc.classId });
      if (!scopeResult.allowed) {
        return {
          success: false,
          error: `Workflow document #${workflowId} is outside your permitted scope.`,
        };
      }
    }

    const comments = (doc.comments || []).map((c) => ({
      author: c.author?.displayNameAr || c.author?.displayName || 'System',
      comment: c.comment,
      action: c.action,
      date: c.createdAt?.toISOString().replace('T', ' ').substring(0, 16),
    }));

    const statusReasons = (doc.statusHistory || []).map((h) => ({
      actor: h.actor?.displayNameAr || h.actor?.displayName || 'System',
      reason: h.reason,
      status: h.toStatus,
      date: h.createdAt?.toISOString().replace('T', ' ').substring(0, 16),
    }));

    return {
      success: true,
      data: {
        isSpecificDoc: true,
        workflowId: doc.id,
        title: doc.title,
        comments,
        statusReasons,
      },
    };
  }

  // 2. Otherwise, fetch recent workflow comments & attendance notes in scope
  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return {
      success: false,
      error: scopeResult.reason,
    };
  }

  const [workflowComments, attendanceNotes] = await Promise.all([
    prisma.workflowComment.findMany({
      where: {
        workflowDocument: scopeResult.filter,
      },
      include: {
        author: { select: { id: true, displayName: true, displayNameAr: true } },
        workflowDocument: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.attendance.findMany({
      where: {
        ...scopeResult.filter,
        notes: { not: null },
      },
      select: {
        id: true,
        date: true,
        notes: true,
        user: { select: { id: true, displayName: true, displayNameAr: true } },
        class: { select: { id: true, nameEn: true, nameAr: true, code: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ]);

  return {
    success: true,
    data: {
      isSpecificDoc: false,
      workflowComments: workflowComments.map((wc) => ({
        workflowId: wc.workflowDocument?.id,
        workflowTitle: wc.workflowDocument?.title,
        author: wc.author?.displayNameAr || wc.author?.displayName || 'System',
        comment: wc.comment,
        date: wc.createdAt?.toISOString().split('T')[0],
      })),
      attendanceNotes: attendanceNotes.map((an) => ({
        studentName: an.user?.displayNameAr || an.user?.displayName || 'Student',
        className: an.class?.nameAr || an.class?.nameEn || an.class?.code,
        notes: an.notes,
        date: an.date?.toISOString().split('T')[0],
      })),
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
