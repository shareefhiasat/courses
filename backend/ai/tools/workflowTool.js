/**
 * AI Query Tool: Workflow Status & Approvals
 *
 * Retrieves counts of pending/approved/rejected workflows and specific approval dates/times.
 */

import prisma from '../../db/prismaClient.js';
import { buildScopedFilter } from '../scope.js';

export async function execute(req, params = {}) {
  const { workflowId, classId, programId, className, programName, dateFrom, dateTo, labelEn, labelAr } = params;

  // If asking about a specific workflow document ID
  if (workflowId) {
    const doc = await prisma.workflowDocument.findUnique({
      where: { id: parseInt(workflowId, 10) },
      include: {
        submitter: { select: { id: true, displayName: true, displayNameAr: true } },
        currentAssignee: { select: { id: true, displayName: true, displayNameAr: true } },
        class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { id: true, displayName: true, displayNameAr: true } } },
        },
      },
    });

    if (!doc) {
      return {
        success: false,
        error: `Workflow document #${workflowId} was not found.`,
      };
    }

    // Verify scope if doc has classId
    if (doc.classId) {
      const scopeResult = await buildScopedFilter(req, { classId: doc.classId });
      if (!scopeResult.allowed) {
        return {
          success: false,
          error: `Workflow document #${workflowId} is outside your permitted scope.`,
        };
      }
    }

    const latestApproval = doc.statusHistory.find((h) => h.toStatus === 'APPROVED');

    return {
      success: true,
      data: {
        isSingleDocument: true,
        id: doc.id,
        title: doc.title,
        status: doc.status,
        workflowType: doc.workflowType,
        className: doc.class?.nameAr || doc.class?.nameEn || doc.class?.code,
        submitter: doc.submitter?.displayNameAr || doc.submitter?.displayName,
        currentAssignee: doc.currentAssignee?.displayNameAr || doc.currentAssignee?.displayName,
        createdAt: doc.createdAt?.toISOString().replace('T', ' ').substring(0, 16),
        approvedAt: latestApproval ? latestApproval.createdAt?.toISOString().replace('T', ' ').substring(0, 16) : null,
        approvedBy: latestApproval ? (latestApproval.actor?.displayNameAr || latestApproval.actor?.displayName) : null,
      },
    };
  }

  // Summary across scoped documents
  const scopeResult = await buildScopedFilter(req, { classId, programId });
  if (!scopeResult.allowed) {
    return {
      success: false,
      error: scopeResult.reason,
    };
  }

  const where = {
    ...scopeResult.filter,
  };

  if (dateFrom && dateTo) {
    where.createdAt = {
      gte: dateFrom,
      lte: dateTo,
    };
  }

  const docs = await prisma.workflowDocument.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      workflowType: true,
      createdAt: true,
      updatedAt: true,
      class: { select: { id: true, code: true, nameEn: true, nameAr: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const statusCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
    total: docs.length,
  };

  for (const d of docs) {
    const s = d.status;
    if (s === 'SUBMITTED' || s === 'UNDER_REVIEW' || s === 'UNDER_HR_REVIEW' || s === 'UNDER_ADMIN_REVIEW') {
      statusCounts.pending++;
    } else if (s === 'APPROVED') {
      statusCounts.approved++;
    } else if (s === 'REJECTED') {
      statusCounts.rejected++;
    } else if (s === 'DRAFT') {
      statusCounts.draft++;
    }
  }

  return {
    success: true,
    data: {
      isSingleDocument: false,
      statusCounts,
      recentDocuments: docs.slice(0, 5).map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        type: d.workflowType,
        className: d.class?.nameAr || d.class?.nameEn || d.class?.code,
        createdAt: d.createdAt?.toISOString().split('T')[0],
      })),
      dateRange: { labelEn, labelAr },
      target: className || programName || 'All Permitted Classes',
      targetAr: className || programName || 'كافة الفصول المصرح بها',
    },
  };
}

export default { execute };
