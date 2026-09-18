/**
 * Workflow Document Service - Business Logic Layer
 * 
 * PURPOSE: Business logic for workflow document operations
 * ARCHITECTURE: Controllers → Services → DB Services → Prisma → PostgreSQL
 */

import {
  createWorkflowDocument,
  createWorkflowStatusHistory,
  getWorkflowDocumentById,
  getWorkflowDocumentsBySubmitter,
  getWorkflowDocumentsByFileId,
  getWorkflowDocumentsByAssignee,
  updateWorkflowDocumentStatus,
  addWorkflowComment,
  getCommentsByWorkflowDocument as getCommentsByWorkflowDocumentFromDB,
  deleteWorkflowComment as deleteWorkflowCommentFromDB,
  resubmitWorkflowDocument as resubmitWorkflowDocumentDB,
  getComplianceData as getComplianceDataDB,
  getAnalyticsData as getAnalyticsDataDB,
  deleteWorkflowDocument as deleteWorkflowDocumentDB
} from '../db/workflowDocuments-postgres.js';
import prisma from '../db/prismaClient.js';
import { putObject, deleteObject, BUCKETS, ensureBuckets, getObjectMetadata, listObjectVersions, streamObjectVersion, copyObject } from './minioService.js';
import { BUCKET_TYPES } from '../constants/driveConstants.js';
import { ENROLLMENT_STATUS_CODES } from '../constants/enrollmentConstants.js';
import { byRole } from './notifications/recipients.js';
import { v4 as uuidv4 } from 'uuid';
import { buildTaxonomyFields, resolveApprovalFlow } from '../utils/workflowTaxonomy.js';
import { applyExcuseApprovalSideEffects } from './workflowExcuseApprovalService.js';
import { createShare } from './fileShareService.js';
import notificationGateway from './notifications/index.js';
import { EVENTS } from './notifications/constants.js';
import { buildNotificationNameVars } from '../utils/localizedUserName.js';
import { getEffectiveDataScope } from './scopeResolver.js';
import { LMS_ROLES } from './keycloakAdminService.js';
import { ATTENDANCE_STATUS_CODES, normalizeAttendanceStatus } from '../constants/attendanceConstants.js';


/**
 * Get appropriate assignee based on approval flow.
 */
async function getAssigneeForApprovalFlow(approvalFlow) {
  if (approvalFlow === 'ADMIN_ONLY' || approvalFlow === 'ADMIN_THEN_HR') {
    const adminUsers = await byRole('admin');
    if (adminUsers.length > 0) {
      return adminUsers[0].userId;
    }
  }

  const hrUsers = await byRole('hr');
  if (hrUsers.length > 0) {
    return hrUsers[0].userId;
  }

  return null;
}

/**
 * Map an approval flow to the first reviewer role.
 * Returns the Keycloak role code (lowercase) that should receive the share.
 */
function getRoleForApprovalFlow(approvalFlow) {
  switch (approvalFlow) {
    case 'ADMIN_ONLY':
    case 'ADMIN_THEN_HR':
      return 'admin';
    case 'HR_ONLY':
    case 'HR_THEN_ADMIN':
    case 'INSTRUCTOR_THEN_HR':
    default:
      return 'hr';
  }
}

/**
 * Users with the given role who have data scope on classId (UCA or instructor assignment).
 */
async function getScopedUsersForRoleAndClass(roleCode, classId) {
  const roleUsers = await byRole(roleCode);
  if (!classId || roleUsers.length === 0) return roleUsers;

  const cls = await prisma.class.findUnique({
    where: { id: parseInt(classId, 10) },
    select: { id: true, programId: true, subjectId: true },
  });
  if (!cls) return [];

  const scoped = [];
  for (const u of roleUsers) {
    const userRoles = await prisma.userRoleAssignment.findMany({
      where: { userId: u.userId },
      include: { role: true },
    });
    const roles = userRoles.map((ra) => ra.role.code);
    const scope = await getEffectiveDataScope(u.userId, roles);
    if (scope.unrestricted) {
      scoped.push(u);
      continue;
    }
    const inScope =
      scope.classIds.includes(cls.id)
      || (cls.subjectId && scope.subjectIds.includes(cls.subjectId))
      || (cls.programId && scope.programIds.includes(cls.programId));
    if (inScope) scoped.push(u);
  }
  return scoped;
}

/**
 * Auto-share a workflow file with scoped users on the workflow class, or role fallback.
 */
export async function shareWorkflowFile({
  fileId,
  submitterId,
  approvalFlow,
  specificUserIds,
  classId,
  workflowCategory,
  attendanceSubtype,
}) {
  if (!fileId) {
    console.warn('[shareWorkflowFile] No fileId provided, skipping auto-share');
    return;
  }

  const actor = { userId: submitterId, roles: [] };
  const permission = 'DOWNLOAD';
  const isDailyAttendance = workflowCategory === 'ATTENDANCE' && attendanceSubtype === 'DAILY';
  const rolesToShare = isDailyAttendance
    ? ['admin', 'hr']
    : [getRoleForApprovalFlow(approvalFlow)];

  try {
    if (specificUserIds && specificUserIds.length > 0) {
      // Override: share with specific users
      for (const userId of specificUserIds) {
        const result = await createShare({
          fileId,
          subjectType: 'USER',
          subjectUserId: userId,
          permission,
          skipNotification: true,
        }, actor);
        if (!result.success) {
          console.warn(`[shareWorkflowFile] Failed to share with user ${userId}:`, result.error);
        }
      }
    } else if (classId) {
      for (const role of rolesToShare) {
        const scopedUsers = await getScopedUsersForRoleAndClass(role, classId);
        if (scopedUsers.length > 0) {
          for (const u of scopedUsers) {
            const result = await createShare({
              fileId,
              subjectType: 'USER',
              subjectUserId: u.userId,
              permission,
              skipNotification: true,
            }, actor);
            if (!result.success) {
              console.warn(`[shareWorkflowFile] Failed to share with scoped user ${u.userId}:`, result.error);
            }
          }
        } else {
          const result = await createShare({
            fileId,
            subjectType: 'ROLE',
            subjectRole: role,
            permission,
            skipNotification: true,
          }, actor);
          if (!result.success) {
            console.warn(`[shareWorkflowFile] Failed to share with role ${role}:`, result.error);
          }
        }
      }
    } else {
      for (const role of rolesToShare) {
        const result = await createShare({
          fileId,
          subjectType: 'ROLE',
          subjectRole: role,
          permission,
          skipNotification: true,
        }, actor);
        if (!result.success) {
          console.warn(`[shareWorkflowFile] Failed to share with role ${role}:`, result.error);
        }
      }
    }
  } catch (err) {
    console.error('[shareWorkflowFile] Auto-share failed (non-blocking):', err);
  }
}

/**
 * Replace/upload a new file (e.g. watermarked warning letter) for a workflow document.
 * Used during approve/reject of ATTENDANCE_WARNING workflows.
 *
 * @param {Object} params
 * @param {Object} params.document - The workflow document being updated
 * @param {string} params.fileData - Base64-encoded file content
 * @param {string} params.fileName - File name including extension
 * @param {string} params.fileType - MIME type
 * @param {number} params.actorId - ID of the user uploading the file
 * @param {string} params.status - Status used for the watermark/object key (APPROVED, REJECTED, etc.)
 * @returns {Promise<{success: boolean, fileId?: string, fileVersionId?: string, objectKey?: string, error?: string}>}
 */
export async function replaceWorkflowDocumentFile({
  document,
  fileData,
  fileName,
  fileType,
  actorId,
  status,
}) {
  try {
    if (!fileData || !fileName || !fileType) {
      return { success: false, error: 'Missing file data' };
    }

    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || 'pdf';
    const statusSlug = status ? String(status).toLowerCase() : 'approved';
    const objectKey = `attendance/warning/${document.program || 'ALL'}/${document.subject || 'ALL'}/${document.classId || 0}/${document.targetStudentId || 0}/${timestamp}_${statusSlug}.pdf`;

    const buffer = Buffer.from(fileData, 'base64');
    await ensureBuckets();
    await putObject(BUCKETS.WORKFLOW, objectKey, buffer, buffer.length, { 'Content-Type': fileType });

    const metadata = await getObjectMetadata(BUCKETS.WORKFLOW, objectKey);
    const minioVersionId = metadata.versionId;

    const file = await prisma.file.create({
      data: {
        id: uuidv4(),
        s3Key: objectKey,
        bucket: BUCKET_TYPES.WORKFLOW,
        name: fileName,
        mimeType: fileType,
        size: buffer.length,
        ownerId: actorId,
        folderId: null,
        folderPath: null,
        currentVersionId: null,
        isActive: true,
        isStarred: false,
        isDeleted: false,
      },
    });

    const fileVersion = await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        versionNumber: 1,
        s3Key: objectKey,
        size: buffer.length,
        uploadedById: actorId,
        changeNote: `Warning letter ${statusSlug} and attached by ${actorId}`,
        minioVersionId,
        isCurrent: true,
      },
    });

    await prisma.file.update({
      where: { id: file.id },
      data: { currentVersionId: fileVersion.id },
    });

    // Share with the appropriate approval-flow role
    await shareWorkflowFile({
      fileId: file.id,
      submitterId: actorId,
      approvalFlow: resolveApprovalFlow(document),
      classId: document.classId,
      workflowCategory: document.workflowCategory,
      attendanceSubtype: document.attendanceSubtype,
    });

    return {
      success: true,
      fileId: file.id,
      fileVersionId: fileVersion.id,
      objectKey,
    };
  } catch (err) {
    console.error('[replaceWorkflowDocumentFile] error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Statuses considered "in-progress" — a new workflow should not be created
 * while one of these exists for the same dedup scope.
 */
const IN_PROGRESS_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'UNDER_HR_REVIEW',
  'UNDER_ADMIN_REVIEW',
  'AMENDED',
];

/**
 * Check whether an in-progress workflow already exists for the same scope.
 * Dedup rules:
 *   ATTENDANCE/DAILY          → classId + date (special: DRAFT allowed, only block on non-DRAFT in-progress)
 *   ATTENDANCE/WEEKLY_SUMMARY → classId + dateFrom + dateTo
 *   ATTENDANCE/EXCUSE         → classId + targetStudentId + dateFrom + dateTo
 *   ATTENDANCE/WARNING        → classId + targetStudentId
 *   PENALTY                   → classId + targetStudentId
 *   BEHAVIOR                  → classId + targetStudentId
 *   DISCONTINUATION           → classId + targetStudentId
 *   MARKS (general/marksReportType metadata) → program + dateFrom + dateTo + marksReportType + academicTermId
 *   GENERAL                   → exempt (no dedup)
 *
 * @returns {Promise<{isDuplicate: boolean, existingDocument?: object, existingDraft?: object}>}
 */
export async function checkDuplicateWorkflow({
  workflowCategory,
  attendanceSubtype,
  classId,
  date,
  dateFrom,
  dateTo,
  targetStudentId,
  program,
  metadata,
}) {
  if (workflowCategory === 'GENERAL' && metadata?.marksReportType) {
    const where = {
      workflowCategory: 'GENERAL',
      status: { in: [...IN_PROGRESS_STATUSES, 'APPROVED'] },
    };
    if (program) where.program = program;
    if (dateFrom) where.dateFrom = new Date(dateFrom);
    if (dateTo) where.dateTo = new Date(dateTo);

    const existingDocs = await prisma.workflowDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    const existing = existingDocs.find((d) => {
      const meta = d.metadata || {};
      return (
        meta.marksReportType === metadata.marksReportType &&
        meta.academicTermId === metadata.academicTermId
      );
    });

    if (!existing) return { isDuplicate: false };

    if (existing.status === 'DRAFT') {
      return { isDuplicate: true, existingDraft: existing };
    }
    if (existing.status === 'APPROVED') {
      return { isDuplicate: true, existingApproved: existing };
    }
    return { isDuplicate: true, existingDocument: existing };
  }

  if (workflowCategory === 'GENERAL') {
    return { isDuplicate: false };
  }

  // For ATTENDANCE/DAILY, only one DRAFT is allowed at a time.
  // If a DRAFT exists → block with existingDraft (user must reject it first).
  // If a non-DRAFT in-progress exists → hard block with existingDocument.
  // If an APPROVED exists → block (no new workflow once approved).
  if (workflowCategory === 'ATTENDANCE' && attendanceSubtype === 'DAILY') {
    const where = {
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'DAILY',
      status: { in: [...IN_PROGRESS_STATUSES, 'APPROVED'] },
    };
    if (classId) where.classId = Number(classId);
    if (date) where.date = new Date(date);

    const existing = await prisma.workflowDocument.findFirst({
      where,
      include: {
        file: true,
        submitter: true,
        class: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!existing) return { isDuplicate: false };

    if (existing.status === 'DRAFT') {
      return { isDuplicate: true, existingDraft: existing };
    }

    if (existing.status === 'APPROVED') {
      return { isDuplicate: true, existingApproved: existing };
    }

    return { isDuplicate: true, existingDocument: existing };
  }

  const where = {
    status: { in: [...IN_PROGRESS_STATUSES, ...(workflowCategory === 'ATTENDANCE' && attendanceSubtype === 'WEEKLY_SUMMARY' ? ['APPROVED'] : [])] },
  };

  if (classId) {
    where.classId = Number(classId);
  }

  if (workflowCategory === 'ATTENDANCE') {
    where.workflowCategory = 'ATTENDANCE';
    if (attendanceSubtype) {
      where.attendanceSubtype = attendanceSubtype;
    }

    if (attendanceSubtype === 'WEEKLY_SUMMARY') {
      if (dateFrom) where.dateFrom = new Date(dateFrom);
      if (dateTo) where.dateTo = new Date(dateTo);
    } else if (attendanceSubtype === 'EXCUSE') {
      if (targetStudentId) where.targetStudentId = Number(targetStudentId);
      if (dateFrom) where.dateFrom = new Date(dateFrom);
      if (dateTo) where.dateTo = new Date(dateTo);
    } else if (attendanceSubtype === 'WARNING') {
      if (targetStudentId) where.targetStudentId = Number(targetStudentId);
    }
  } else {
    where.workflowCategory = workflowCategory;
    if (targetStudentId) {
      where.targetStudentId = Number(targetStudentId);
    }
  }

  const existing = await prisma.workflowDocument.findFirst({
    where,
    include: {
      file: true,
      submitter: true,
      class: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return { isDuplicate: true, existingDocument: existing };
  }

  return { isDuplicate: false };
}

/** @deprecated use getAssigneeForApprovalFlow */
async function getAssigneeForWorkflowType(workflowType) {
  const taxonomy = buildTaxonomyFields({ workflowType });
  return getAssigneeForApprovalFlow(taxonomy.approvalFlow);
}

/**
 * Create a new workflow document with file upload
 */
export async function createWorkflowDocumentWithUpload(data) {
  try {
    const {
      workflowType,
      workflowCategory,
      attendanceSubtype,
      approvalFlow,
      title,
      description,
      fileData,
      fileName,
      fileType,
      submitterId,
      currentAssigneeId,
      classId,
      instructorId,
      date,
      dateFrom,
      dateTo,
      metadata: workflowMetadata,
      attendanceIds,
      program,
      subject,
      createdBy,
      updatedBy,
      specificUserIds,
      targetStudentId,
    } = data;

    const taxonomy = buildTaxonomyFields({
      workflowType,
      workflowCategory,
      attendanceSubtype,
      approvalFlow,
    });

    // Check for duplicate in-progress workflow before doing any work
    const dedupCheck = await checkDuplicateWorkflow({
      workflowCategory: taxonomy.workflowCategory,
      attendanceSubtype: taxonomy.attendanceSubtype,
      classId,
      date,
      dateFrom,
      dateTo,
      targetStudentId,
    });
    if (dedupCheck.isDuplicate) {
      const errorKey = dedupCheck.existingDraft
        ? 'workflow_error_draft_exists'
        : dedupCheck.existingApproved
        ? 'workflow_error_approved_exists'
        : 'workflow_error_in_progress_exists';
      return {
        success: false,
        code: 409,
        errorKey,
        error: dedupCheck.existingDraft
          ? 'A draft workflow already exists for this class and date. Reject it first to create a new one.'
          : dedupCheck.existingApproved
          ? 'An approved workflow already exists for this class and date. No new workflow can be created.'
          : 'An in-progress workflow already exists for this scope',
        existingDocument: dedupCheck.existingDocument,
        existingDraft: dedupCheck.existingDraft,
        existingApproved: dedupCheck.existingApproved,
      };
    }

    const assigneeId = currentAssigneeId || await getAssigneeForApprovalFlow(taxonomy.approvalFlow);

    // Generate structured file name
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const objectKey = `attendance/${program}/${subject}/${classId}/${date}/${instructorId}/${timestamp}_v1.${fileExtension}`;

    // Decode base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    const fileSize = buffer.length;

    // Ensure bucket exists with versioning
    await ensureBuckets();

    // Upload to MinIO using centralized service
    await putObject(BUCKETS.WORKFLOW, objectKey, buffer, fileSize, {
      'Content-Type': fileType,
    });

    // Get object metadata to capture version ID
    const objectMetadata = await getObjectMetadata(BUCKETS.WORKFLOW, objectKey);
    const minioVersionId = objectMetadata.versionId;

    // Create File record and WorkflowDocument in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create File record
      const file = await tx.file.create({
        data: {
          id: uuidv4(),
          s3Key: objectKey,
          bucket: BUCKET_TYPES.WORKFLOW,
          name: fileName,
          mimeType: fileType,
          size: fileSize,
          ownerId: submitterId,
          folderId: null,
          folderPath: null,
          currentVersionId: null,
          isActive: true,
          isStarred: false,
          isDeleted: false,
        },
      });

      // Create FileVersion record with metadata
      const fileVersion = await tx.fileVersion.create({
        data: {
          fileId: file.id,
          versionNumber: 1,
          s3Key: objectKey,
          size: fileSize,
          uploadedById: submitterId,
          changeNote: 'Initial upload for workflow document',
          minioVersionId: minioVersionId,
          isCurrent: true,
        },
      });

      // Update File with current version
      const updatedFile = await tx.file.update({
        where: { id: file.id },
        data: {
          currentVersionId: fileVersion.id,
        },
      });

      // Create WorkflowDocument record
      const document = await tx.workflowDocument.create({
        data: {
          workflowType: taxonomy.workflowType,
          approvalFlow: taxonomy.approvalFlow,
          workflowCategory: taxonomy.workflowCategory,
          attendanceSubtype: taxonomy.attendanceSubtype,
          title,
          description,
          status: 'SUBMITTED',
          fileId: file.id,
          submitterId,
          currentAssigneeId: assigneeId,
          classId,
          instructorId,
          targetStudentId: targetStudentId ? Number(targetStudentId) : null,
          date: date ? new Date(date) : null,
          dateFrom: dateFrom ? new Date(dateFrom) : null,
          dateTo: dateTo ? new Date(dateTo) : null,
          metadata: workflowMetadata || undefined,
          program,
          subject,
          reviewCycleCount: 0,
          createdBy,
          updatedBy
        },
        include: {
          file: true,
          submitter: true,
          currentAssignee: true,
          instructor: true,
          class: true,
          targetStudent: true
        }
      });

      // Link attendance records when provided
      if (attendanceIds?.length) {
        await tx.workflowDocumentAttendance.createMany({
          data: attendanceIds.map((attendanceId) => ({
            workflowDocumentId: document.id,
            attendanceId,
          })),
          skipDuplicates: true,
        });
      }

      // Create initial status history
      await tx.workflowStatusHistory.create({
        data: {
          workflowDocumentId: document.id,
          fromStatus: null,
          toStatus: 'SUBMITTED',
          actorId: submitterId,
          reason: 'Initial submission'
        }
      });

      return { document, file };
    });

    // Auto-share the workflow file with the approval-flow role or specific users
    await shareWorkflowFile({
      fileId: result.file.id,
      submitterId,
      approvalFlow: taxonomy.approvalFlow,
      specificUserIds,
      classId: data.classId,
      workflowCategory: taxonomy.workflowCategory,
      attendanceSubtype: taxonomy.attendanceSubtype,
    });

    // Notify the appropriate reviewers
    try {
      const isWeekly = taxonomy.attendanceSubtype === 'WEEKLY_SUMMARY';
      const targetRole = isWeekly ? LMS_ROLES.ADMIN : LMS_ROLES.HR;
      const submitter = result.document.submitter;
      const cls = result.document.class;

      await notificationGateway.emit(
        EVENTS.WORKFLOW_SUBMITTED,
        {
          ...buildNotificationNameVars(submitter, 'Unknown User'),
          workflowName: result.document.title,
          documentId: result.document.id,
          workflowType: result.document.workflowType,
          workflowCategory: result.document.workflowCategory,
          attendanceSubtype: result.document.attendanceSubtype,
          classId: result.document.classId,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          date: result.document.date,
          dateFrom: result.document.dateFrom,
          dateTo: result.document.dateTo,
          program: result.document.program,
          senderName: submitter?.displayName || 'Unknown',
          senderId: submitterId,
        },
        { dbId: submitterId },
        { role: targetRole, excludeInstructors: isWeekly }
      );
    } catch (notificationError) {
      console.error('[createWorkflowDocumentWithUpload] Failed to emit notification:', notificationError);
    }

    return { 
      success: true, 
      data: {
        document: result.document,
        objectKey
      }
    };
  } catch (error) {
    console.error('Error in createWorkflowDocumentWithUpload:', error);
    
    // Attempt to rollback MinIO upload if transaction failed
    try {
      const timestamp = Date.now();
      const fileExtension = fileName.split('.').pop();
      const objectKey = `attendance/${program}/${subject}/${classId}/${date}/${instructorId}/${timestamp}_v1.${fileExtension}`;
      await deleteObject(BUCKETS.WORKFLOW, objectKey);
    } catch (rollbackError) {
      console.error('Failed to rollback MinIO upload:', rollbackError);
    }
    
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get workflow document by ID
 */
export async function getWorkflowDocument(id) {
  return await getWorkflowDocumentById(id);
}

/**
 * Get workflow documents for submitter
 */
export async function getSubmitterDocuments(submitterId, filters) {
  return await getWorkflowDocumentsBySubmitter(submitterId, filters);
}

/**
 * Get workflow documents for assignee (HR/Admin inbox)
 */
export async function getAssigneeDocuments(assigneeId, filters) {
  return await getWorkflowDocumentsByAssignee(assigneeId, filters);
}

/**
 * Get workflow documents by file ID
 */
export async function getDocumentsByFileId(fileId) {
  return await getWorkflowDocumentsByFileId(fileId);
}

/**
 * Update workflow document status
 */
export async function updateStatus(id, status, actorId, reason, snapshotData = null, filedFileId = null) {
  const result = await updateWorkflowDocumentStatus(id, status, actorId, reason, snapshotData, filedFileId);

  if (result.success && status === 'APPROVED') {
    try {
      await applyExcuseApprovalSideEffects(id, actorId);
    } catch (excuseError) {
      console.error('[updateStatus] Excuse approval side effects failed:', excuseError);
    }
  }

  return result;
}

/**
 * Add comment to workflow document
 */
export async function addComment(data) {
  const result = await addWorkflowComment(data);

  // Emit notification to the other party (submitter or assignee)
  if (result.success) {
    try {
      const { workflowDocumentId, authorId, comment, action } = data;
      const doc = await prisma.workflowDocument.findUnique({
        where: { id: parseInt(workflowDocumentId) },
        select: {
          id: true,
          title: true,
          submitterId: true,
          currentAssigneeId: true,
          classId: true,
          class: { select: { id: true, nameEn: true, nameAr: true, code: true } },
        },
      });

      if (doc) {
        const author = await prisma.user.findUnique({
          where: { id: authorId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true, profileImageUrl: true, keycloakId: true }
        });

        const commentPreview = comment && comment.length > 80 ? comment.substring(0, 80) + '...' : comment;
        const payload = {
          ...buildNotificationNameVars(author, 'Unknown User'),
          workflowName: doc.title,
          documentId: doc.id,
          commentPreview,
          action: action || 'COMMENT',
          className: doc.class?.nameEn || null,
          classNameAr: doc.class?.nameAr || doc.class?.nameEn || null,
          senderName: author?.displayName || 'Unknown',
          senderId: authorId,
        };

        // Notify submitter if the commenter is not the submitter
        if (doc.submitterId && doc.submitterId !== authorId) {
          await notificationGateway.emit(
            EVENTS.WORKFLOW_COMMENT_ADDED,
            { ...payload, recipientType: 'user', recipientUserId: doc.submitterId },
            { id: authorId },
            { userId: doc.submitterId }
          );
        }

        // Notify current assignee if the commenter is not the assignee
        if (doc.currentAssigneeId && doc.currentAssigneeId !== authorId) {
          await notificationGateway.emit(
            EVENTS.WORKFLOW_COMMENT_ADDED,
            { ...payload, recipientType: 'user', recipientUserId: doc.currentAssigneeId },
            { id: authorId },
            { userId: doc.currentAssigneeId }
          );
        }
      }
    } catch (notificationError) {
      console.error('[workflowDocumentService.addComment] Failed to emit notification:', notificationError);
    }
  }

  return result;
}

/**
 * Get comments for workflow document
 */
export async function getCommentsByWorkflowDocument(workflowDocumentId) {
  return await getCommentsByWorkflowDocumentFromDB(workflowDocumentId);
}

/**
 * Delete workflow comment
 */
export async function deleteComment(commentId, userId, userRoles) {
  try {
    console.log('[deleteComment] Called with:', { commentId, userId, userRoles });

    // Get the comment to check ownership
    const comment = await prisma.workflowComment.findUnique({
      where: { id: parseInt(commentId) },
      select: {
        id: true,
        authorId: true,
        workflowDocument: {
          select: {
            submitterId: true
          }
        }
      }
    });

    console.log('[deleteComment] Comment found:', comment);

    if (!comment) {
      return { success: false, errorKey: 'workflow_error_comment_not_found', error: 'Comment not found' };
    }

    // Check if user is Super Admin
    const isSuperAdmin = userRoles.includes('super_admin');
    console.log('[deleteComment] Permission check:', { commentAuthorId: comment.authorId, userId, isSuperAdmin, userRoles });

    // Only comment author or Super Admin can delete
    if (comment.authorId !== userId && !isSuperAdmin) {
      return { success: false, errorKey: 'workflow_error_comment_delete_permission', error: 'Insufficient permissions to delete comment' };
    }

    return await deleteWorkflowCommentFromDB(commentId);
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Resubmit workflow document with new file
 */
export async function resubmitWorkflowDocument(data) {
  try {
    const {
      documentId,
      fileData,
      fileName,
      fileType,
      submitterId,
      comment,
      updatedBy
    } = data;

    // Get existing document
    const existingDoc = await getWorkflowDocumentById(documentId);
    if (!existingDoc.success) {
      return { success: false, errorKey: 'workflow_error_document_not_found', error: 'Document not found' };
    }

    const document = existingDoc.data;

    // Validate that user is the submitter
    if (document.submitterId !== submitterId) {
      return { success: false, errorKey: 'workflow_error_only_submitter_resubmit', error: 'Only the submitter can resubmit this document' };
    }

    // Validate that document is rejected
    if (document.status !== 'REJECTED') {
      return { success: false, errorKey: 'workflow_error_only_rejected_can_resubmit', error: 'Only rejected documents can be resubmitted' };
    }

    // Generate structured file name with version
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const version = document.reviewCycleCount + 1;
    const objectKey = `attendance/${document.program}/${document.subject}/${document.classId}/${document.date}/${document.instructorId}/${timestamp}_v${version}.${fileExtension}`;

    // Upload file to MinIO
    const buffer = Buffer.from(fileData, 'base64');
    await ensureBuckets();
    await putObject(BUCKETS.WORKFLOW, objectKey, buffer, fileType);

    // Get object metadata to capture version ID
    const metadata = await getObjectMetadata(BUCKETS.WORKFLOW, objectKey);
    const minioVersionId = metadata.versionId;

    // Create new file record with version metadata
    const file = await prisma.file.create({
      data: {
        id: uuidv4(),
        s3Key: objectKey,
        bucket: BUCKET_TYPES.WORKFLOW,
        name: fileName,
        mimeType: fileType,
        size: buffer.length,
        ownerId: submitterId,
        folderId: null,
        folderPath: null,
        currentVersionId: null,
        isActive: true,
        isStarred: false,
        isDeleted: false,
      }
    });

    // Get existing file's max version number to increment
    const existingFile = await prisma.file.findUnique({
      where: { id: document.fileId },
      include: { versions: true }
    });

    const maxVersion = existingFile?.versions?.length > 0 
      ? Math.max(...existingFile.versions.map(v => v.versionNumber))
      : 0;

    // Create FileVersion record with metadata
    const fileVersion = await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        versionNumber: maxVersion + 1,
        s3Key: objectKey,
        size: buffer.length,
        uploadedById: submitterId,
        changeNote: comment || 'Resubmitted document',
        minioVersionId: minioVersionId,
        isCurrent: true,
      }
    });

    // Update File with current version
    await prisma.file.update({
      where: { id: file.id },
      data: { currentVersionId: fileVersion.id }
    });

    // Resubmit document (update file, increment cycle, reset status)
    const result = await resubmitWorkflowDocumentDB({
      documentId,
      fileId: file.id,
      submitterId,
      comment,
      updatedBy
    });

    if (result.success) {
      return {
        success: true,
        data: {
          ...result.data,
          objectKey
        }
      };
    } else {
      // Rollback file creation if document update failed
      try {
        await deleteObject(BUCKETS.WORKFLOW, objectKey);
        await prisma.file.delete({ where: { id: file.id } });
      } catch (rollbackError) {
        console.error('Failed to rollback file creation:', rollbackError);
      }
      return result;
    }
  } catch (error) {
    console.error('Error in resubmitWorkflowDocument:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Upload signed document by Admin (for weekly summaries)
 * Creates new version and reassigns to HR for final review
 */
export async function uploadSignedDocument(data) {
  try {
    const {
      documentId,
      fileData,
      fileName,
      fileType,
      adminId,
      comment,
      updatedBy
    } = data;

    // Get existing document
    const existingDoc = await getWorkflowDocumentById(documentId);
    if (!existingDoc.success) {
      return { success: false, errorKey: 'workflow_error_document_not_found', error: 'Document not found' };
    }

    const document = existingDoc.data;

    // Validate that document is an attendance daily or weekly workflow
    const isAttendanceDoc = document.workflowCategory === 'ATTENDANCE'
      && (document.attendanceSubtype === 'DAILY' || document.attendanceSubtype === 'WEEKLY_SUMMARY');
    const isLegacyWeekly = document.workflowType === 'ATTENDANCE_WEEKLY';
    if (!isAttendanceDoc && !isLegacyWeekly) {
      return { success: false, errorKey: 'workflow_error_only_attendance_signed_upload', error: 'Only daily or weekly attendance documents can have signed uploads' };
    }

    // Validate that user is Admin or HR
    const adminUsers = await byRole('admin');
    const hrUsersForPerm = await byRole('hr');
    const isAdmin = adminUsers.some(u => u.userId === adminId);
    const isHR = hrUsersForPerm.some(u => u.userId === adminId);
    if (!isAdmin && !isHR) {
      return { success: false, errorKey: 'workflow_error_only_admin_hr_signed_upload', error: 'Only Admin or HR users can upload signed documents' };
    }

    const isApprovedDoc = document.status === 'APPROVED';

    // Get HR users for reassignment (only needed for pre-approval weekly flow)
    let hrUsers = hrUsersForPerm;
    if (!isApprovedDoc && hrUsers.length === 0) {
      return { success: false, errorKey: 'workflow_error_no_hr_users', error: 'No HR users found for reassignment' };
    }

    // Generate structured file name with version
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const version = document.reviewCycleCount + 1;
    const objectKey = `attendance/${document.program}/${document.subject}/${document.classId}/${document.date}/${document.instructorId}/${timestamp}_signed_v${version}.${fileExtension}`;

    // Upload file to MinIO
    const buffer = Buffer.from(fileData, 'base64');
    await ensureBuckets();
    await putObject(BUCKETS.WORKFLOW, objectKey, buffer, fileType);

    // Get object metadata to capture version ID
    const metadata = await getObjectMetadata(BUCKETS.WORKFLOW, objectKey);
    const minioVersionId = metadata.versionId;

    // Create new file record with version metadata
    const file = await prisma.file.create({
      data: {
        id: uuidv4(),
        s3Key: objectKey,
        bucket: BUCKET_TYPES.WORKFLOW,
        name: fileName,
        mimeType: fileType,
        size: buffer.length,
        ownerId: adminId,
        folderId: null,
        folderPath: null,
        currentVersionId: null,
        isActive: true,
        isStarred: false,
        isDeleted: false,
      }
    });

    // Get existing file's max version number to increment (guard: doc may have no file yet)
    const existingFile = document.fileId
      ? await prisma.file.findUnique({
          where: { id: document.fileId },
          include: { versions: true }
        })
      : null;

    const maxVersion = existingFile?.versions?.length > 0
      ? Math.max(...existingFile.versions.map(v => v.versionNumber))
      : 0;

    // Create FileVersion record with metadata
    const fileVersion = await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        versionNumber: maxVersion + 1,
        s3Key: objectKey,
        size: buffer.length,
        uploadedById: adminId,
        changeNote: comment || 'Signed document uploaded',
        minioVersionId: minioVersionId,
        isCurrent: true,
      }
    });

    // Update File with current version
    await prisma.file.update({
      where: { id: file.id },
      data: { currentVersionId: fileVersion.id }
    });

    let updated;
    if (isApprovedDoc) {
      // Post-approval: attach signed copy without changing status/assignee/original file
      updated = await prisma.workflowDocument.update({
        where: { id: documentId },
        data: {
          signedFileId: file.id,
          signedAt: new Date(),
          signedById: adminId,
          updatedBy,
          updatedAt: new Date()
        },
        include: {
          file: true,
          signedFile: true,
          submitter: true,
          currentAssignee: true,
          class: true
        }
      });

      // Record audit history (status unchanged)
      await createWorkflowStatusHistory({
        workflowDocumentId: documentId,
        fromStatus: document.status,
        toStatus: document.status,
        actorId: adminId,
        reason: comment || 'Signed copy uploaded for approved document'
      });
    } else {
      // Pre-approval (legacy weekly flow): replace file, reassign to HR, move to UNDER_HR_REVIEW
      updated = await prisma.workflowDocument.update({
        where: { id: documentId },
        data: {
          fileId: file.id,
          currentAssigneeId: hrUsers[0].userId, // Reassign to first HR user
          status: 'UNDER_HR_REVIEW',
          reviewCycleCount: document.reviewCycleCount + 1,
          updatedBy,
          updatedAt: new Date()
        },
        include: {
          file: true,
          submitter: true,
          currentAssignee: true,
          class: true
        }
      });

      // Record status history
      await createWorkflowStatusHistory({
        workflowDocumentId: documentId,
        fromStatus: document.status,
        toStatus: 'UNDER_HR_REVIEW',
        actorId: adminId,
        reason: comment || 'Signed document uploaded by Admin, reassigned to HR for final review'
      });
    }

    // Add comment if provided
    if (comment) {
      await addWorkflowComment({
        workflowDocumentId: documentId,
        authorId: adminId,
        comment,
        action: 'SIGNED_UPLOAD'
      });
    }

    return {
      success: true,
      data: {
        ...updated,
        objectKey
      }
    };
  } catch (error) {
    console.error('Error in uploadSignedDocument:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Withdraw workflow document (revert to DRAFT status)
 * Only submitter can withdraw, only if status is SUBMITTED
 */
export async function withdrawWorkflowDocument(data) {
  try {
    const { documentId, submitterId, comment, updatedBy } = data;

    // Get existing document
    const existingDoc = await getWorkflowDocumentById(documentId);
    if (!existingDoc.success) {
      return { success: false, errorKey: 'workflow_error_document_not_found', error: 'Document not found' };
    }

    const document = existingDoc.data;

    // Validate that user is the submitter
    if (document.submitterId !== submitterId) {
      return { success: false, errorKey: 'workflow_error_only_submitter_withdraw', error: 'Only the submitter can withdraw this document' };
    }

    // Validate that document is in SUBMITTED status
    if (document.status !== 'SUBMITTED') {
      return { success: false, errorKey: 'workflow_error_only_submitted_can_withdraw', error: 'Only submitted documents can be withdrawn' };
    }

    // Update document status to DRAFT
    const updated = await prisma.workflowDocument.update({
      where: { id: documentId },
      data: {
        status: 'DRAFT',
        currentAssigneeId: null, // Clear assignee
        updatedBy,
        updatedAt: new Date()
      },
      include: {
        file: true,
        submitter: true,
        currentAssignee: true,
        class: true
      }
    });

    // Record status history
    await createWorkflowStatusHistory({
      workflowDocumentId: documentId,
      fromStatus: document.status,
      toStatus: 'DRAFT',
      actorId: submitterId,
      reason: comment || 'Document withdrawn by submitter'
    });

    // Add comment if provided
    if (comment) {
      await addWorkflowComment({
        workflowDocumentId: documentId,
        authorId: submitterId,
        comment,
        action: 'WITHDRAWN'
      });
    }

    // Emit notification to assignee/reviewers that document was withdrawn
    try {
      const withdrawer = await prisma.user.findUnique({
        where: { id: submitterId },
        select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
      });
      const payload = {
        ...buildNotificationNameVars(withdrawer, 'Unknown User'),
        workflowName: updated.title,
        documentId: updated.id,
        actorName: withdrawer?.displayName || 'Unknown',
        senderName: withdrawer?.displayName || 'Unknown',
        senderId: submitterId,
        className: updated.class?.nameEn || null,
        classNameAr: updated.class?.nameAr || updated.class?.nameEn || null,
      };

      // Notify the previous assignee (now cleared) — use the document's previous assignee
      if (document.currentAssigneeId) {
        await notificationGateway.emit(
          EVENTS.WORKFLOW_WITHDRAWN,
          { ...payload, recipientType: 'user', recipientUserId: document.currentAssigneeId },
          { id: submitterId },
          { userId: document.currentAssigneeId }
        );
      }

      // Also notify HR role users
      await notificationGateway.emit(
        EVENTS.WORKFLOW_WITHDRAWN,
        { ...payload, recipientType: 'role', recipientRole: LMS_ROLES.HR },
        { id: submitterId },
        { role: LMS_ROLES.HR }
      );
    } catch (notificationError) {
      console.error('[workflowDocumentService.withdrawWorkflowDocument] Failed to emit notification:', notificationError);
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error in withdrawWorkflowDocument:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get compliance data for calendar view
 */
export async function getComplianceData(filters) {
  return await getComplianceDataDB(filters);
}

/**
 * Get analytics data for workflow dashboard
 */
export async function getAnalyticsData(filters) {
  return await getAnalyticsDataDB(filters);
}

/**
 * List all versions of a workflow document file
 */
export async function listFileVersions(fileId) {
  try {
    console.log('[listFileVersions] Called with fileId:', fileId);

    // Get file record — fileId may be the File UUID or a WorkflowDocument ID
    let file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            uploadedBy: {
              select: {
                id: true,
                keycloakId: true,
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
                displayNameAr: true,
                displayName: true,
                email: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    });

    console.log('[listFileVersions] File lookup result:', file ? 'Found' : 'Not found');

    // If not found directly, try looking up via WorkflowDocument.fileId
    if (!file) {
      console.log('[listFileVersions] Trying to find via WorkflowDocument.fileId');
      const wdoc = await prisma.workflowDocument.findFirst({
        where: { fileId },
        include: {
          file: {
            include: {
              versions: {
                orderBy: { versionNumber: 'desc' },
                include: {
                  uploadedBy: {
                    select: {
                      id: true,
                      keycloakId: true,
                      firstName: true,
                      lastName: true,
                      firstNameAr: true,
                      lastNameAr: true,
                      displayNameAr: true,
                      displayName: true,
                      email: true,
                      profileImageUrl: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      console.log('[listFileVersions] WorkflowDocument lookup result:', wdoc ? 'Found' : 'Not found');

      if (wdoc?.file) {
        file = wdoc.file;
      }
    }

    if (!file) {
      console.error('[listFileVersions] File not found for fileId:', fileId);
      return { success: false, errorKey: 'workflow_error_file_not_found', error: 'File not found' };
    }

    // Get MinIO versions - handle invalid bucket names
    let minioVersions = [];
    try {
      minioVersions = await listObjectVersions(file.bucket, file.s3Key);
    } catch (error) {
      if (error.message && error.message.includes('Invalid bucket name')) {
        console.warn('[listFileVersions] Invalid bucket name, skipping MinIO versions:', file.bucket);
        // Continue without MinIO versions
      } else {
        throw error;
      }
    }

    return {
      success: true,
      data: {
        file,
        versions: file.versions,
        minioVersions
      }
    };
  } catch (error) {
    console.error('Error listing file versions:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Download a specific version of a workflow document file
 */
export async function downloadFileVersion(fileId, versionId, req, res) {
  try {
    // Get file record
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return { success: false, errorKey: 'workflow_error_file_not_found', error: 'File not found' };
    }

    // Get version record
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) {
      return { success: false, errorKey: 'workflow_error_version_not_found', error: 'Version not found' };
    }

    // Stream the specific version from MinIO
    await streamObjectVersion({
      bucket: file.bucket,
      objectKey: file.s3Key,
      versionId: version.minioVersionId,
      req,
      res,
      filename: file.name,
      mimeType: file.mimeType
    });

    return { success: true };
  } catch (error) {
    console.error('Error downloading file version:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Create a custom workflow document with optional file copy from Smart Drive
 */
export async function createCustomWorkflowDocument(data) {
  try {
    const {
      workflowType,
      workflowCategory,
      attendanceSubtype,
      approvalFlow,
      title,
      description,
      reviewers,
      attachFile,
      sourceBucket,
      sourcePath,
      fileName,
      submitterId,
      createdBy,
      updatedBy,
      fileId: originalFileId,
      dateFrom,
      dateTo,
      metadata: workflowMetadata,
      attendanceIds = [],
      classId,
      program,
      subject,
      instructorId,
      date,
      specificUserIds,
      targetStudentId,
      targetStudentIds = [],
    } = data;

    const resolvedTargetStudentIds = (targetStudentIds?.length
      ? targetStudentIds
      : (targetStudentId ? [targetStudentId] : [])
    ).map(Number).filter(Boolean);
    const primaryTargetStudentId = resolvedTargetStudentIds[0] || null;

    const taxonomy = buildTaxonomyFields({
      workflowType,
      workflowCategory,
      attendanceSubtype,
      approvalFlow,
    });

    // Marks reports use metadata for deduplication
    const marksDedupMetadata = taxonomy.marksReportType
      ? {
          marksReportType: taxonomy.marksReportType,
          ...((workflowMetadata || {})),
        }
      : (workflowMetadata || {});

    // Check for duplicate in-progress workflow before doing any work
    const dedupCheck = await checkDuplicateWorkflow({
      workflowCategory: taxonomy.workflowCategory,
      attendanceSubtype: taxonomy.attendanceSubtype,
      classId,
      date,
      dateFrom,
      dateTo,
      targetStudentId: primaryTargetStudentId,
      program,
      metadata: marksDedupMetadata,
    });
    if (dedupCheck.isDuplicate) {
      const existing = dedupCheck.existingDocument || dedupCheck.existingDraft || dedupCheck.existingApproved;
      const className = existing?.class
        ? (existing.class.nameEn || existing.class.nameAr || existing.class.code)
        : '';
      const isWeekly = attendanceSubtype === 'WEEKLY_SUMMARY';
      const scopeLabel = isWeekly
        ? (className ? `weekly summary for class ${className}` : 'weekly summary for this scope')
        : (className ? `workflow for class ${className}` : 'workflow for this scope');
      const dateLabel = isWeekly && dateFrom && dateTo
        ? `from ${new Date(dateFrom).toLocaleDateString()} to ${new Date(dateTo).toLocaleDateString()}`
        : (date ? `on ${new Date(date).toLocaleDateString()}` : 'for this date');
      const status = existing?.status;

      let errorKey;
      let errorMsg;
      if (status === 'DRAFT') {
        errorKey = 'workflow_error_draft_exists';
        errorMsg = `A ${scopeLabel} already exists ${dateLabel} with status DRAFT. Reject the existing workflow first before creating a new one.`;
      } else if (status === 'APPROVED') {
        errorKey = 'workflow_error_approved_exists';
        errorMsg = `An approved ${scopeLabel} already exists ${dateLabel} with status APPROVED. No new workflow can be created unless the existing one is rejected.`;
      } else if (status) {
        errorKey = 'workflow_error_in_progress_exists';
        errorMsg = `A ${scopeLabel} already exists ${dateLabel} with status ${status}. You cannot create two weekly workflows for the same class + same week while the first one is still ${status}.`;
      } else {
        errorKey = 'workflow_error_in_progress_exists';
        errorMsg = `A ${scopeLabel} already exists ${dateLabel}. You cannot create two weekly workflows for the same class + same week while the first one is still in progress.`;
      }

      return {
        success: false,
        code: 409,
        errorKey,
        error: errorMsg,
        existingDocument: dedupCheck.existingDocument,
        existingDraft: dedupCheck.existingDraft,
        existingApproved: dedupCheck.existingApproved,
      };
    }

    let filePath = null;
    let fileId = null;
    let fileVersionId = null;

    // Link existing Smart Drive file when fileId is provided (preferred path)
    if (attachFile && originalFileId) {
      const currentVersion = await prisma.fileVersion.findFirst({
        where: {
          fileId: originalFileId,
          isCurrent: true,
        },
      });
      if (currentVersion) {
        fileVersionId = currentVersion.id;
        filePath = currentVersion.s3Key;
        console.log('[createCustomWorkflowDocument] Linked Smart Drive file version:', fileVersionId);
      }
    } else if (attachFile && sourceBucket && sourcePath && fileName) {
      await ensureBuckets();

      // Generate structured file name for workflow bucket
      const timestamp = Date.now();
      const fileExtension = fileName.split('.').pop();
      const objectKey = `custom/${taxonomy.workflowCategory}/${timestamp}_${fileName}`;

      // Copy file from source bucket to workflow bucket
      await copyObject(sourceBucket, sourcePath, BUCKETS.WORKFLOW, objectKey);

      // Get object metadata to capture version ID
      const objectMetadata = await getObjectMetadata(BUCKETS.WORKFLOW, objectKey);
      const minioVersionId = objectMetadata.versionId;

      // Create File record
      const file = await prisma.file.create({
        data: {
          id: uuidv4(),
          s3Key: objectKey,
          bucket: BUCKET_TYPES.WORKFLOW,
          name: fileName,
          mimeType: 'application/octet-stream', // Default MIME type for custom files
          size: objectMetadata.size,
          minioVersionId,
          uploadedBy: submitterId,
          createdBy,
          updatedBy
        }
      });

      filePath = objectKey;
      fileId = file.id;
    }

    let resolvedProgram = data.program || null;
    let resolvedSubject = data.subject || null;
    let resolvedInstructorId = data.instructorId || null;
    let attendanceDate = date;

    if (classId) {
      const cls = await prisma.class.findUnique({
        where: { id: Number(classId) },
        include: {
          program: { select: { code: true } },
          subject: { select: { code: true } },
        },
      });

      if (cls) {
        resolvedProgram = resolvedProgram || cls.program?.code || String(cls.programId);
        resolvedSubject = resolvedSubject || cls.subject?.code || String(cls.subjectId);
        resolvedInstructorId = resolvedInstructorId || cls.instructorId || submitterId;
      }
    }

    let currentAssigneeId = null;
    if (data.currentAssigneeId) {
      currentAssigneeId = Number(data.currentAssigneeId);
    } else if (reviewers && reviewers.length > 0) {
      const firstReviewer = reviewers[0];
      const looksLikeUserId = typeof firstReviewer === 'number' || /^\d+$/.test(String(firstReviewer));
      if (looksLikeUserId) {
        currentAssigneeId = Number(firstReviewer);
      } else {
        try {
          const reviewerUsers = await byRole(firstReviewer);
          if (reviewerUsers.length > 0) {
            currentAssigneeId = reviewerUsers[0].userId;
          }
        } catch (error) {
          console.error('[createCustomWorkflowDocument] Error getting reviewer users:', error);
        }
      }
    }
    if (!currentAssigneeId) {
      currentAssigneeId = resolvedInstructorId || await getAssigneeForApprovalFlow(taxonomy.approvalFlow);
    }

    const isUserIdReviewer = reviewers && reviewers.length > 0 && (typeof reviewers[0] === 'number' || /^\d+$/.test(String(reviewers[0])));
    const documentStatus = data.status || (isUserIdReviewer ? 'DRAFT' : ((reviewers && reviewers.length > 0) ? 'SUBMITTED' : 'DRAFT'));

    if (taxonomy.attendanceSubtype === 'DAILY' && dateFrom && !attendanceDate) {
      attendanceDate = dateFrom;
    }
    
    const documentResult = await createWorkflowDocument({
      workflowType: taxonomy.workflowType,
      workflowCategory: taxonomy.workflowCategory,
      attendanceSubtype: taxonomy.attendanceSubtype,
      approvalFlow: taxonomy.approvalFlow,
      title,
      description,
      status: documentStatus,
      submitterId,
      currentAssigneeId,
      fileId: originalFileId || fileId,
      fileVersionId,
      filePath,
      date: attendanceDate,
      dateFrom,
      dateTo,
      metadata: {
        ...(workflowMetadata || {}),
        ...(taxonomy.marksReportType ? { marksReportType: taxonomy.marksReportType } : {}),
        shareTargetMode: specificUserIds?.length ? 'users' : 'role',
        specificUserIds: specificUserIds?.length ? specificUserIds.map(Number) : [],
        targetStudentIds: resolvedTargetStudentIds,
      },
      attendanceIds,
      classId: classId ? Number(classId) : null,
      instructorId: resolvedInstructorId,
      targetStudentId: primaryTargetStudentId,
      program: resolvedProgram,
      subject: resolvedSubject,
      createdBy,
      updatedBy
    });

    if (!documentResult.success) {
      return {
        success: false,
        error: documentResult.error || 'Failed to create workflow document'
      };
    }

    const document = documentResult.data;

    console.log('[createCustomWorkflowDocument] Document created:', {
      id: document.id,
      title: document.title,
      status: document.status
    });

    // Auto-share the workflow file with the approval-flow role or specific users
    const sharedFileId = originalFileId || fileId;
    if (sharedFileId) {
      await shareWorkflowFile({
        fileId: sharedFileId,
        submitterId,
        approvalFlow: taxonomy.approvalFlow,
        specificUserIds,
        classId: data.classId,
        workflowCategory: taxonomy.workflowCategory,
        attendanceSubtype: taxonomy.attendanceSubtype,
      });
    }

    return {
      success: true,
      data: {
        document,
        file: fileId ? { id: fileId, path: filePath } : null
      }
    };
  } catch (error) {
    console.error('Error creating custom workflow document:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Hard delete a workflow document
 * This permanently deletes the workflow document and its associated data
 */
export async function deleteWorkflowDocument(id) {
  try {
    console.log('[deleteWorkflowDocument] Deleting workflow document:', id);

    // Get document details before deletion for cleanup
    const document = await getWorkflowDocumentById(id);
    if (!document.success) {
      return { success: false, errorKey: 'workflow_error_workflow_document_not_found', error: 'Workflow document not found' };
    }

    const docData = document.data;

    // Delete from database
    const result = await deleteWorkflowDocumentDB(id);
    if (!result.success) {
      return result;
    }

    // Delete file from MinIO if it exists
    if (docData.file && docData.file.s3Key) {
      try {
        await deleteObject(BUCKETS.WORKFLOW, docData.file.s3Key);
        console.log('[deleteWorkflowDocument] File deleted from MinIO:', docData.file.s3Key);
      } catch (error) {
        console.error('[deleteWorkflowDocument] Error deleting file from MinIO:', error);
        // Continue even if file deletion fails
      }
    }

    console.log('[deleteWorkflowDocument] Document deleted successfully:', id);
    return { success: true, data: { id } };
  } catch (error) {
    console.error('[deleteWorkflowDocument] Error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Batch-lookup workflow documents linked to attendance records via the junction table.
 * Returns a map of attendanceId → workflow document summary.
 *
 * @param {number[]} attendanceIds - Array of attendance record IDs
 * @returns {Promise<{success: boolean, data?: Object}>}
 */
function parseDayRange(dateInput) {
  const day = new Date(dateInput);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
}

/**
 * Enrich workflow documents with share-target users from metadata.
 */
export async function enrichWorkflowDocuments(documents = []) {
  if (!documents.length) return documents;

  const allUserIds = new Set();
  for (const doc of documents) {
    const meta = doc.metadata && typeof doc.metadata === 'object' ? doc.metadata : {};
    if (meta.shareTargetMode === 'users' && Array.isArray(meta.specificUserIds)) {
      meta.specificUserIds.forEach((id) => allUserIds.add(Number(id)));
    }
  }

  let usersById = {};
  if (allUserIds.size > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: [...allUserIds] } },
      select: {
        id: true,
        displayName: true,
        displayNameAr: true,
        firstName: true,
        lastName: true,
        firstNameAr: true,
        lastNameAr: true,
        email: true,
        profileImageUrl: true,
        roleAssignments: { include: { role: true } },
      },
    });
    usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  }

  return documents.map((doc) => {
    const meta = doc.metadata && typeof doc.metadata === 'object' ? doc.metadata : {};
    if (meta.shareTargetMode !== 'users' || !Array.isArray(meta.specificUserIds)) {
      return doc;
    }
    const shareTargetUsers = meta.specificUserIds
      .map((id) => usersById[Number(id)])
      .filter(Boolean);
    return { ...doc, shareTargetUsers };
  });
}

/**
 * Workflows related to a student on a specific class day (daily, excuse, linked attendance).
 */
export async function getWorkflowsByStudentDay({ userId, classId, date }) {
  try {
    if (!userId || !classId || !date) {
      return { success: false, error: 'userId, classId, and date are required' };
    }

    const { dayStart, dayEnd } = parseDayRange(date);
    const parsedUserId = Number(userId);
    const parsedClassId = Number(classId);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: parsedUserId,
        classId: parsedClassId,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true },
    });
    const attendanceIds = attendances.map((a) => a.id);

    const orClauses = [
      {
        classId: parsedClassId,
        date: { gte: dayStart, lte: dayEnd },
      },
      {
        classId: parsedClassId,
        targetStudentId: parsedUserId,
        OR: [
          { date: { gte: dayStart, lte: dayEnd } },
          { dateFrom: { lte: dayEnd }, dateTo: { gte: dayStart } },
        ],
      },
    ];

    if (attendanceIds.length > 0) {
      orClauses.push({
        linkedAttendances: { some: { attendanceId: { in: attendanceIds } } },
      });
    }

    const documents = await prisma.workflowDocument.findMany({
      where: { OR: orClauses },
      include: {
        submitter: true,
        currentAssignee: true,
        class: true,
        targetStudent: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await enrichWorkflowDocuments(documents);
    return { success: true, data: enriched };
  } catch (error) {
    console.error('[getWorkflowsByStudentDay] Error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function getLinkedWorkflowsByAttendanceIds(attendanceIds) {
  try {
    if (!attendanceIds || attendanceIds.length === 0) {
      return { success: true, data: {} };
    }

    const links = await prisma.workflowDocumentAttendance.findMany({
      where: { attendanceId: { in: attendanceIds } },
      include: {
        workflowDocument: {
          select: {
            id: true,
            title: true,
            status: true,
            workflowCategory: true,
            attendanceSubtype: true,
            workflowType: true,
          },
        },
      },
    });

    const map = {};
    for (const link of links) {
      const wf = link.workflowDocument;
      if (!wf) continue;
      // Keep the most recent workflow per attendance record
      if (!map[link.attendanceId] || link.workflowDocument.id > map[link.attendanceId].id) {
        map[link.attendanceId] = {
          id: wf.id,
          title: wf.title,
          status: wf.status,
          workflowCategory: wf.workflowCategory,
          attendanceSubtype: wf.attendanceSubtype,
          workflowType: wf.workflowType,
        };
      }
    }

    return { success: true, data: map };
  } catch (error) {
    console.error('[getLinkedWorkflowsByAttendanceIds] Error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Check if an attendance record is linked to any in-progress workflow document.
 * Used by validation guards to prevent modification/deletion.
 *
 * @param {number} attendanceId
 * @returns {Promise<{blocked: boolean, workflow?: object}>}
 */
export async function checkAttendanceWorkflowLock(attendanceId) {
  try {
    const links = await prisma.workflowDocumentAttendance.findMany({
      where: { attendanceId: parseInt(attendanceId) },
      include: {
        workflowDocument: {
          select: { id: true, title: true, status: true, workflowCategory: true, attendanceSubtype: true },
        },
      },
    });

    const inProgress = links.find(l =>
      l.workflowDocument && IN_PROGRESS_STATUSES.includes(l.workflowDocument.status)
    );

    if (inProgress) {
      return { blocked: true, workflow: inProgress.workflowDocument };
    }
    return { blocked: false };
  } catch (error) {
    console.error('[checkAttendanceWorkflowLock] Error:', error);
    return { blocked: false };
  }
}

/**
 * Check if a weekly summary workflow is in progress for the week containing the given date.
 * Used to prevent attendance changes once a weekly summary has been initiated.
 * If classId is provided, only checks for that specific class.
 *
 * @param {string|Date} date
 * @param {number} [classId] - Optional class ID for per-class locking
 * @returns {Promise<{blocked: boolean, workflow?: object}>}
 */
export async function checkWeeklyWorkflowLock(date, classId = null) {
  try {
    if (!date) return { blocked: false };
    const d = new Date(date);
    const where = {
      workflowCategory: 'ATTENDANCE',
      attendanceSubtype: 'WEEKLY_SUMMARY',
      status: { not: 'REJECTED' },
      dateFrom: { lte: d },
      dateTo: { gte: d },
    };
    if (classId) {
      where.classId = Number(classId);
    }
    const existing = await prisma.workflowDocument.findFirst({
      where,
      select: { id: true, title: true, status: true, dateFrom: true, dateTo: true, classId: true },
    });
    if (existing) {
      return { blocked: true, workflow: existing };
    }
    return { blocked: false };
  } catch (error) {
    console.error('[checkWeeklyWorkflowLock] Error:', error);
    return { blocked: false };
  }
}

/**
 * Check if a student has any in-progress workflow for a given category (PENALTY/BEHAVIOR).
 * Used by validation guards since penalties/behaviors have no junction table.
 *
 * @param {number} targetStudentId
 * @param {string} workflowCategory - 'PENALTY' or 'BEHAVIOR'
 * @returns {Promise<{blocked: boolean, workflow?: object}>}
 */
export async function checkStudentCategoryWorkflowLock(targetStudentId, workflowCategory) {
  try {
    const existing = await prisma.workflowDocument.findFirst({
      where: {
        targetStudentId: Number(targetStudentId),
        workflowCategory,
        status: { in: IN_PROGRESS_STATUSES },
      },
      select: { id: true, title: true, status: true, workflowCategory: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return { blocked: true, workflow: existing };
    }
    return { blocked: false };
  } catch (error) {
    console.error('[checkStudentCategoryWorkflowLock] Error:', error);
    return { blocked: false };
  }
}

function startOfDay(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfNextDay(dateInput) {
  const d = startOfDay(dateInput);
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Get workflow documents for operations board with filters.
 */
export async function getBoardWorkflowDocuments(filters = {}) {
  try {
    const {
      date,
      dateFrom,
      dateTo,
      classId,
      programId,
      subjectId,
      status,
      workflowType,
      workflowCategory,
      attendanceSubtype,
      search,
      limit = 200,
      offset = 0,
    } = filters;

    console.log('[getBoardWorkflowDocuments] filters:', JSON.stringify(filters));

    const where = {
      ...(workflowCategory && { workflowCategory }),
      ...(attendanceSubtype && { attendanceSubtype }),
      ...(workflowType && { workflowType }),
      ...(status && { status }),
      ...(classId && { classId: parseInt(classId, 10) }),
    };

    if (dateFrom && dateTo) {
      where.date = {
        gte: startOfDay(dateFrom),
        lt: startOfNextDay(dateTo),
      };
    } else if (date) {
      where.date = {
        gte: startOfDay(date),
        lt: startOfNextDay(date),
      };
    }

    if ((programId || subjectId)) {
      if (attendanceSubtype === 'WEEKLY_SUMMARY') {
        // Per-class weekly summaries have classId set — filter via class relation
        // Also keep program string field as fallback for legacy documents
        where.OR = [
          {
            class: {
              ...(programId && { programId: parseInt(programId, 10) }),
              ...(subjectId && { subjectId: parseInt(subjectId, 10) }),
            },
          },
          ...(programId ? [{ program: String(programId) }] : []),
        ];
      } else {
        where.class = {
          ...(programId && { programId: parseInt(programId, 10) }),
          ...(subjectId && { subjectId: parseInt(subjectId, 10) }),
        };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.workflowDocument.findMany({
      where,
      select: {
        id: true,
        workflowType: true,
        approvalFlow: true,
        workflowCategory: true,
        attendanceSubtype: true,
        title: true,
        description: true,
        status: true,
        fileId: true,
        fileVersionId: true,
        submitterId: true,
        currentAssigneeId: true,
        classId: true,
        instructorId: true,
        targetStudentId: true,
        date: true,
        dateFrom: true,
        dateTo: true,
        program: true,
        subject: true,
        metadata: true,
        snapshotFileId: true,
        snapshotDate: true,
        snapshotWeekFrom: true,
        snapshotWeekTo: true,
        reviewCycleCount: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
        submitter: { include: { roleAssignments: { include: { role: true } } } },
        currentAssignee: { include: { roleAssignments: { include: { role: true } } } },
        instructor: {
          select: {
            id: true,
            displayName: true,
            displayNameAr: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            email: true,
            keycloakId: true,
            profileImageUrl: true,
            roleAssignments: { include: { role: true } },
          },
        },
        file: true,
        snapshotFile: true,
        signedFileId: true,
        signedAt: true,
        signedFile: true,
        class: {
          select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true,
            programId: true,
            subjectId: true,
            instructorId: true,
            program: { select: { id: true, code: true, nameEn: true, nameAr: true } },
            subject: { select: { id: true, code: true, nameEn: true, nameAr: true } },
            instructor: {
              select: {
                id: true,
                displayName: true,
                displayNameAr: true,
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
                email: true,
                keycloakId: true,
                profileImageUrl: true,
                roleAssignments: { include: { role: true } },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            workflowDocumentId: true,
            fromStatus: true,
            toStatus: true,
            actorId: true,
            reason: true,
            createdAt: true,
            actor: { select: { id: true, displayName: true, displayNameAr: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true } },
            workflowDocument: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            workflowDocumentId: true,
            authorId: true,
            comment: true,
            action: true,
            createdAt: true,
            author: { select: { id: true, displayName: true, firstName: true, lastName: true } },
            workflowDocument: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: parseInt(offset, 10),
      take: parseInt(limit, 10),
    });

    console.log('[getBoardWorkflowDocuments] count:', documents.length, 'firstId:', documents[0]?.id);
    const enriched = await enrichWorkflowDocuments(documents);
    return { success: true, data: enriched, total: enriched.length };
  } catch (error) {
    console.error('[getBoardWorkflowDocuments] Error:', error);
    return { success: false, error: 'Internal server error', data: [] };
  }
}

/**
 * Auto-create DRAFT daily attendance workflows for scheduled classes on a date.
 */
export async function ensureDailyWorkflows({ date, classIds = [], actorId = null }) {
  try {
    if (!date) {
      return { success: false, error: 'date is required' };
    }

    const dayStart = startOfDay(date);
    const dayEnd = startOfNextDay(date);

    let targetClassIds = classIds.map((id) => parseInt(id, 10)).filter(Boolean);

    if (targetClassIds.length === 0) {
      const sessions = await prisma.scheduledSession.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          status: { not: 'cancelled' },
          startDateTime: { gte: dayStart, lt: dayEnd },
        },
        select: { classId: true },
        distinct: ['classId'],
      });
      targetClassIds = sessions.map((s) => s.classId).filter(Boolean);
    }

    const created = [];
    const skipped = [];

    for (const cid of targetClassIds) {
      const dup = await checkDuplicateWorkflow({
        workflowCategory: 'ATTENDANCE',
        attendanceSubtype: 'DAILY',
        classId: cid,
        date: dayStart,
      });

      if (dup.isDuplicate) {
        skipped.push({ classId: cid, existingId: dup.existingDocument?.id || dup.existingDraft?.id || dup.existingApproved?.id });
        continue;
      }

      const cls = await prisma.class.findUnique({
        where: { id: cid },
        include: {
          program: { select: { code: true } },
          subject: { select: { code: true } },
        },
      });

      if (!cls || !cls.instructorId) {
        skipped.push({ classId: cid, reason: 'no_class_or_instructor' });
        continue;
      }

      const title = `Daily Attendance — ${cls.code || cls.nameEn} — ${dayStart.toISOString().slice(0, 10)}`;
      const docResult = await createWorkflowDocument({
        workflowType: 'ATTENDANCE_DAILY',
        workflowCategory: 'ATTENDANCE',
        attendanceSubtype: 'DAILY',
        title,
        description: 'Auto-created daily attendance workflow',
        status: 'DRAFT',
        submitterId: cls.instructorId,
        currentAssigneeId: cls.instructorId,
        classId: cid,
        instructorId: cls.instructorId,
        date: dayStart,
        program: cls.program?.code || null,
        subject: cls.subject?.code || null,
        createdBy: actorId || cls.instructorId,
        updatedBy: actorId || cls.instructorId,
      });

      if (docResult.success) {
        await createWorkflowStatusHistory({
          workflowDocumentId: docResult.data.id,
          fromStatus: null,
          toStatus: 'DRAFT',
          actorId: actorId || cls.instructorId,
          reason: 'Auto-created for scheduled class',
        });
        created.push(docResult.data);
      } else {
        skipped.push({ classId: cid, reason: docResult.error });
      }
    }

    return { success: true, data: { created, skipped, date: dayStart.toISOString() } };
  } catch (error) {
    console.error('[ensureDailyWorkflows] Error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Backfill admin/HR role shares for workflow files created before auto-share existed.
 */
export async function ensureWorkflowOversightFileShares(fileId) {
  if (!fileId) return false;
  try {
    const doc = await prisma.workflowDocument.findFirst({
      where: { OR: [{ fileId }, { snapshotFileId: fileId }, { signedFileId: fileId }] },
      select: {
        id: true,
        submitterId: true,
        status: true,
        workflowCategory: true,
        attendanceSubtype: true,
        approvalFlow: true,
        classId: true,
      },
    });
    if (!doc) return false;
    const status = String(doc.status || '').toUpperCase();
    if (!['DRAFT', 'SUBMITTED', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      return false;
    }
    await shareWorkflowFile({
      fileId,
      submitterId: doc.submitterId,
      approvalFlow: doc.approvalFlow,
      classId: doc.classId,
      workflowCategory: doc.workflowCategory,
      attendanceSubtype: doc.attendanceSubtype,
    });
    console.log('[ensureWorkflowOversightFileShares] Ensured shares for workflow file:', { fileId, workflowDocumentId: doc.id });
    return true;
  } catch (error) {
    console.error('[ensureWorkflowOversightFileShares] Error:', error);
    return false;
  }
}

const QATAR_OFFSET_MS = 3 * 60 * 60 * 1000;

function getQatarDayRange(dateInput) {
  const d = new Date(dateInput);
  const qatarTime = new Date(d.getTime() + QATAR_OFFSET_MS);
  const y = qatarTime.getUTCFullYear();
  const m = qatarTime.getUTCMonth();
  const day = qatarTime.getUTCDate();
  const dayStart = new Date(Date.UTC(y, m, day, -3, 0, 0));
  const dayEnd = new Date(Date.UTC(y, m, day + 1, -3, 0, 0));
  return { dayStart, dayEnd };
}

async function validateDailyAttendanceTaken(classId, date, cls = null) {
  const parsedClassId = parseInt(classId, 10);
  if (!parsedClassId || !date) {
    return { ok: true };
  }

  const { dayStart, dayEnd } = getQatarDayRange(date);

  const [enrolledCount, attendances, classInfo] = await Promise.all([
    prisma.enrollment.count({
      where: {
        classId: parsedClassId,
        status: { code: ENROLLMENT_STATUS_CODES.ACTIVE },
      },
    }),
    prisma.attendance.findMany({
      where: {
        classId: parsedClassId,
        date: { gte: dayStart, lt: dayEnd },
      },
      include: { status: true },
    }),
    cls || prisma.class.findUnique({
      where: { id: parsedClassId },
      select: { id: true, nameEn: true, nameAr: true, code: true },
    }),
  ]);

  if (enrolledCount === 0) {
    return { ok: true };
  }

  const className = cls?.nameEn || classInfo?.nameEn || classInfo?.code || '';
  const classNameAr = cls?.nameAr || classInfo?.nameAr || className;
  const dateString = dayStart.toISOString().slice(0, 10);

  if (attendances.length < enrolledCount) {
    return {
      ok: false,
      reason: 'incomplete',
      missing: enrolledCount - attendances.length,
      enrolled: enrolledCount,
      taken: attendances.length,
      classId: parsedClassId,
      className,
      classNameAr,
      date: dateString,
    };
  }

  const notYetCount = attendances.filter((a) => !a.status || !a.status.code).length;
  if (notYetCount > 0) {
    return {
      ok: false,
      reason: 'not_yet',
      missing: notYetCount,
      enrolled: enrolledCount,
      taken: attendances.length - notYetCount,
      classId: parsedClassId,
      className,
      classNameAr,
      date: dateString,
    };
  }

  const lateCount = attendances.filter((a) => normalizeAttendanceStatus(a.status.code) === ATTENDANCE_STATUS_CODES.LATE).length;
  if (lateCount > 0) {
    return {
      ok: false,
      reason: 'late',
      lateCount,
      enrolled: enrolledCount,
      taken: attendances.length,
      classId: parsedClassId,
      className,
      classNameAr,
      date: dateString,
    };
  }

  return { ok: true };
}

export async function validateWorkflowAttendanceBeforeApproval(document) {
  if (document.workflowCategory !== 'ATTENDANCE') {
    return { ok: true };
  }

  if (document.attendanceSubtype === 'DAILY') {
    if (!document.classId || !document.date) {
      return { ok: true };
    }
    return validateDailyAttendanceTaken(document.classId, document.date, document.class);
  }

  if (document.attendanceSubtype === 'WEEKLY_SUMMARY') {
    const linkedIds = document.metadata?.linkedDailyDocumentIds;
    if (Array.isArray(linkedIds) && linkedIds.length > 0) {
      const dailyDocs = await prisma.workflowDocument.findMany({
        where: { id: { in: linkedIds.map((id) => parseInt(id, 10)).filter(Boolean) } },
        select: {
          id: true,
          classId: true,
          date: true,
          class: { select: { nameEn: true, nameAr: true, code: true } },
        },
      });
      for (const doc of dailyDocs) {
        if (!doc.classId || !doc.date) continue;
        const res = await validateDailyAttendanceTaken(doc.classId, doc.date, doc.class);
        if (!res.ok) return res;
      }
    }
    return { ok: true };
  }

  return { ok: true };
}

export default {
  createWorkflowDocumentWithUpload,
  getWorkflowDocument,
  getSubmitterDocuments,
  getAssigneeDocuments,
  getDocumentsByFileId,
  updateStatus,
  addComment,
  getCommentsByWorkflowDocument,
  deleteComment,
  resubmitWorkflowDocument,
  uploadSignedDocument,
  withdrawWorkflowDocument,
  getComplianceData,
  getAnalyticsData,
  listFileVersions,
  downloadFileVersion,
  createCustomWorkflowDocument,
  deleteWorkflowDocument,
  getLinkedWorkflowsByAttendanceIds,
  getWorkflowsByStudentDay,
  enrichWorkflowDocuments,
  checkAttendanceWorkflowLock,
  checkStudentCategoryWorkflowLock,
  getBoardWorkflowDocuments,
  ensureDailyWorkflows,
  ensureWorkflowOversightFileShares,
  shareWorkflowFile,
  validateWorkflowAttendanceBeforeApproval,
};
