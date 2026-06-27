/**
 * Handles post-approval side effects for attendance excuse workflows.
 */

import prisma from '../db/prismaClient.js';
import { amendAttendance } from './attendanceAmendmentService.js';

const EXCUSE_TARGET_STATUS_CODES = ['ABSENT_WITH_EXCUSE', 'EXCUSED_LEAVE'];

async function resolveExcuseTargetStatusId(excuseType) {
  const code = excuseType === 'bereavement' ? 'EXCUSED_LEAVE' : 'ABSENT_WITH_EXCUSE';
  const status = await prisma.attendanceStatusTypes.findFirst({
    where: { code },
  });
  if (status) return status.id;

  const fallback = await prisma.attendanceStatusTypes.findFirst({
    where: { code: { in: EXCUSE_TARGET_STATUS_CODES } },
  });
  return fallback?.id || null;
}

export async function applyExcuseApprovalSideEffects(workflowDocumentId, actorId) {
  const document = await prisma.workflowDocument.findUnique({
    where: { id: workflowDocumentId },
    include: {
      linkedAttendances: {
        include: {
          attendance: {
            include: { status: true },
          },
        },
      },
    },
  });

  if (!document) {
    return { success: false, error: 'Document not found' };
  }

  if (
    document.workflowCategory !== 'ATTENDANCE' ||
    document.attendanceSubtype !== 'EXCUSE' ||
    document.status !== 'APPROVED'
  ) {
    return { success: true, skipped: true };
  }

  const metadata = document.metadata && typeof document.metadata === 'object'
    ? document.metadata
    : {};
  const excuseType = metadata.excuseType || 'with_excuse';
  const targetStatusId = await resolveExcuseTargetStatusId(excuseType);

  if (!targetStatusId) {
    return { success: false, error: 'Excuse target status not configured' };
  }

  const amendedIds = [];
  for (const link of document.linkedAttendances) {
    const attendance = link.attendance;
    if (!attendance) continue;

    const result = await amendAttendance({
      attendanceId: attendance.id,
      toStatusId: targetStatusId,
      reason: `Excuse approved via workflow #${document.id}`,
      amendedBy: actorId,
      workflowDocumentId: document.id,
    });

    if (result.success) {
      amendedIds.push(attendance.id);
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { excuseApprovedAt: new Date() },
      });
    }
  }

  await prisma.workflowDocument.update({
    where: { id: document.id },
    data: {
      metadata: {
        ...metadata,
        excuseType,
        approvedAt: new Date().toISOString(),
        approvedBy: actorId,
        linkedAttendanceIds: amendedIds,
      },
    },
  });

  return { success: true, amendedCount: amendedIds.length };
}

export async function linkAttendancesToWorkflow(workflowDocumentId, attendanceIds = []) {
  if (!attendanceIds.length) {
    return { success: true, data: [] };
  }

  await prisma.workflowDocumentAttendance.createMany({
    data: attendanceIds.map((attendanceId) => ({
      workflowDocumentId,
      attendanceId,
    })),
    skipDuplicates: true,
  });

  const links = await prisma.workflowDocumentAttendance.findMany({
    where: { workflowDocumentId },
    include: {
      attendance: {
        include: { user: true, status: true, class: true },
      },
    },
  });

  return { success: true, data: links };
}

export default {
  applyExcuseApprovalSideEffects,
  linkAttendancesToWorkflow,
};
