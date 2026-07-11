/**
 * Workflow Documents Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for workflow document operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { getRequestScope, filterRecordsByScope, isRecordInScope } from '../utils/scopeAccess.js';
import prisma from '../db/prismaClient.js';
import { LMS_ROLES } from '../services/keycloakAdminService.js';
import { approveWorkflow, rejectWorkflow, returnWorkflow, submitWorkflow, resubmitWorkflow } from '../workflows/workflowService.js';
import { resolveApprovalFlow } from '../utils/workflowTaxonomy.js';

import {
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
  getBoardWorkflowDocuments,
  ensureDailyWorkflows,
} from '../services/workflowDocumentService.js';
import { emit } from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';
import { buildNotificationNameVars } from '../utils/localizedUserName.js';
import { logPermissionDenial } from '../services/permissionDenialAuditService.js';
import { validateWorkflowBoardStatusTransition } from '../utils/workflowBoardTransitions.js';

/**
 * Convert MinIO image keys in comment author objects to proxy URLs.
 */
const mapCommentAuthorImages = (comments) => {
  if (!comments) return comments;
  return comments.map(c => {
    if (!c.author?.profileImageUrl) return c;
    const url = c.author.profileImageUrl;
    if (url.startsWith('http') || url.startsWith('/api/')) return c;
    return { ...c, author: { ...c.author, profileImageUrl: `/api/v1/user-images/proxy/${c.author.keycloakId}/profile` } };
  });
};

/**
 * Convert MinIO image key in a user object to a proxy URL.
 */
const mapUserImage = (user) => {
  if (!user?.profileImageUrl) return user;
  const url = user.profileImageUrl;
  if (url.startsWith('http') || url.startsWith('/api/')) return user;
  return { ...user, profileImageUrl: `/api/v1/user-images/proxy/${user.keycloakId}/profile` };
};

/**
 * Map profileImageUrl for submitter, currentAssignee, instructor, and statusHistory actors.
 */
const mapDocumentUserImages = (document) => {
  if (!document) return document;
  return {
    ...document,
    submitter: mapUserImage(document.submitter),
    currentAssignee: mapUserImage(document.currentAssignee),
    instructor: mapUserImage(document.instructor),
    statusHistory: (document.statusHistory || []).map(h => ({
      ...h,
      actor: mapUserImage(h.actor),
    })),
  };
};

/**
 * POST /api/v1/workflow-documents
 * Create a new workflow document
 */
export const createWorkflowDocumentController = async (req, res) => {
  try {
    const { user } = req;
    
    // Validate instructor role
    if (!user || !user.roles || !user.roles.includes('instructor')) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'createWorkflowDocument',
        resource: `workflow-documents`,
        reason: 'Instructor role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Instructor role required.'
      });
    }

    // Validate required fields
    const {
      workflowType,
      title,
      classId,
      date,
      program,
      subject,
      fileData,
      fileName,
      fileType
    } = req.body;

    if (!workflowType || !title || !classId || !date || !program || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workflowType, title, classId, date, program, subject'
      });
    }

    if (!fileData || !fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'Missing file data: fileData, fileName, fileType required'
      });
    }

    // Create workflow document
    const result = await createWorkflowDocumentWithUpload({
      workflowType,
      title,
      description: req.body.description,
      fileData,
      fileName,
      fileType,
      submitterId: user.dbId,
      currentAssigneeId: null, // Will be assigned to HR role
      classId,
      instructorId: user.dbId,
      date,
      program,
      subject,
      createdBy: user.dbId,
      updatedBy: user.dbId,
      specificUserIds: req.body.specificUserIds,
      targetStudentId: req.body.targetStudentId,
    });

    if (result.success) {
      // Emit notification to HR users
      try {
        const submitter = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.document.classId ? await prisma.class.findUnique({
          where: { id: result.data.document.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }) : null;

        await emit(EVENTS.WORKFLOW_SUBMITTED, {
          ...buildNotificationNameVars(submitter, 'Unknown User'),
          title: result.data.document.title,
          workflowType: result.data.document.workflowType,
          documentId: result.data.document.id,
          classId: result.data.document.classId,
          date: result.data.document.date,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          submitterName: submitter?.displayName || 'Unknown',
          senderName: submitter?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          recipientType: 'role',
          recipientRole: LMS_ROLES.HR,
        }, user, { role: LMS_ROLES.HR });
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
      }

      res.status(201).json({
        success: true,
        data: result.data
      });
    } else if (result.code === 409) {
      res.status(409).json({
        success: false,
        error: result.error,
        existingWorkflow: result.existingDocument
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in createWorkflowDocumentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/workflow-documents/:id
 * Get workflow document by ID
 */
export const getWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getWorkflowDocument(parseInt(id));

    if (result.success) {
      res.status(200).json({
        success: true,
        data: mapDocumentUserImages(result.data)
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getWorkflowDocumentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/workflow-documents
 * Get workflow documents for current user (submitter or assignee)
 */
export const getWorkflowDocumentsController = async (req, res) => {
  try {
    const { user } = req;
    const { role, status, workflowType, workflowCategory, attendanceSubtype, approvalFlow, limit, offset, fileId } = req.query;

    let result;

    // If fileId is provided, query by file ID
    if (fileId) {
      result = await getDocumentsByFileId(fileId);
    } else if (role === 'assignee' && (user.roles?.includes(LMS_ROLES.HR) || user.roles?.includes(LMS_ROLES.ADMIN))) {
      // Get documents assigned to this user (HR/Admin inbox)
      // Also include documents with null currentAssigneeId for HR/Admin to see unassigned submissions
      result = await getAssigneeDocuments(user.dbId, {
        status,
        workflowType,
        workflowCategory,
        attendanceSubtype,
        approvalFlow,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      });
    } else {
      // Get documents submitted by this user
      result = await getSubmitterDocuments(user.dbId, {
        status,
        workflowType,
        workflowCategory,
        attendanceSubtype,
        approvalFlow,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      });
    }

    console.log('[getWorkflowDocumentsController] user.dbId:', user.dbId, 'role:', role, 'status:', status, 'user.roles:', user.roles);
    console.log('[getWorkflowDocumentsController] result:', result.success ? `success, ${result.data?.length} docs` : 'failed');
    if (result.success && result.data) {
      console.log('[getWorkflowDocumentsController] document statuses:', result.data.map(d => ({ id: d.id, status: d.status })));
    }

    if (result.success) {
      let data = result.data || [];
      const scope = await getRequestScope(req);
      if (!scope.unrestricted && Array.isArray(data)) {
        data = filterRecordsByScope(data, scope, {
          classField: 'classId',
          programField: 'programId',
          subjectField: 'subjectId',
        });
      }
      data = await enrichWorkflowDocuments(data);
      data = data.map(mapDocumentUserImages);
      res.status(200).json({
        success: true,
        data,
        total: data.length,
        userDbId: user.dbId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getWorkflowDocumentsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * PATCH /api/v1/workflow-documents/:id/status
 * Update workflow document status
 */
export const updateWorkflowDocumentStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const existing = await getWorkflowDocument(parseInt(id));
    if (!existing.success) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    const previousStatus = existing.data.status;

    const transitionCheck = validateWorkflowBoardStatusTransition(user, previousStatus, status);
    if (!transitionCheck.ok) {
      return res.status(403).json({
        success: false,
        error: transitionCheck.error,
      });
    }

    const result = await updateStatus(parseInt(id), status, user.dbId, reason);

    if (result.success) {
      if (global.chatWSBroadcast) {
        global.chatWSBroadcast('board:workflow_updated', {
          documentId: result.data.id,
          status: result.data.status,
          classId: result.data.classId,
          date: result.data.date,
          title: result.data.title,
        });
      }

      // Notify on board status transitions that skip approve/return endpoints
      try {
        const actor = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.classId ? await prisma.class.findUnique({
          where: { id: result.data.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true, subjectId: true }
        }) : null;
        const basePayload = {
          ...buildNotificationNameVars(actor, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          senderName: actor?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          classId: result.data.classId || null,
          subjectId: cls?.subjectId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          previousStatus,
          newStatus: status,
        };

        if (status === 'SUBMITTED' && ['DRAFT', 'TAKEN'].includes(previousStatus)) {
          // Instructor submitted — notify Admins and HR that a draft is ready for review pipeline
          await emit(EVENTS.WORKFLOW_SUBMITTED, {
            ...basePayload,
            recipientType: 'role',
            recipientRole: LMS_ROLES.ADMIN,
          }, user, { role: LMS_ROLES.ADMIN });
          await emit(EVENTS.WORKFLOW_SUBMITTED, {
            ...basePayload,
            recipientType: 'role',
            recipientRole: LMS_ROLES.HR,
          }, user, { role: LMS_ROLES.HR });
        } else if (status === 'UNDER_ADMIN_REVIEW' && previousStatus === 'SUBMITTED') {
          await emit(EVENTS.WORKFLOW_SENT_FOR_APPROVAL, {
            ...basePayload,
            recipientType: 'role',
            recipientRole: LMS_ROLES.ADMIN,
          }, user, { role: LMS_ROLES.ADMIN });
        } else if (status === 'UNDER_HR_REVIEW') {
          await emit(EVENTS.WORKFLOW_SENT_FOR_REVIEW, {
            ...basePayload,
            recipientType: 'role',
            recipientRole: LMS_ROLES.HR,
          }, user, { role: LMS_ROLES.HR });
        } else if (status === 'SUBMITTED' && previousStatus === 'UNDER_ADMIN_REVIEW' && result.data.submitterId) {
          await emit(EVENTS.WORKFLOW_RETURNED, {
            ...basePayload,
            feedback: reason || '',
            recipientType: 'user',
            recipientUserId: result.data.submitterId,
          }, user, { userId: result.data.submitterId });
          await emit(EVENTS.WORKFLOW_RETURNED, {
            ...basePayload,
            feedback: reason || '',
            recipientType: 'role',
            recipientRole: LMS_ROLES.ADMIN,
          }, user, { role: LMS_ROLES.ADMIN });
        }
      } catch (notificationError) {
        console.error('Failed to emit status-change notification:', notificationError);
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in updateWorkflowDocumentStatusController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/workflow-documents/:id/comments
 * Get comments for workflow document
 */
export const getWorkflowCommentsController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getCommentsByWorkflowDocument(parseInt(id));

    if (result.success) {
      res.status(200).json({
        success: true,
        data: mapCommentAuthorImages(result.data)
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getWorkflowCommentsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/:id/comments
 * Add comment to workflow document
 */
export const addWorkflowCommentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { comment, action } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required'
      });
    }

    const result = await addComment({
      workflowDocumentId: parseInt(id),
      authorId: user.dbId,
      comment,
      action
    });

    if (result.success) {
      const normalizedData = mapCommentAuthorImages([result.data])[0];
      res.status(201).json({
        success: true,
        data: normalizedData
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in addWorkflowCommentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/workflow-documents/:id/comments/:commentId
 * Delete comment from workflow document
 */
export const deleteWorkflowCommentController = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.dbId;
    const userRoles = req.user?.roles || [];

    const result = await deleteComment(commentId, userId, userRoles);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in deleteWorkflowCommentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/:id/approve
 * Approve workflow document (HR, Admin, or Super Admin can approve)
 */
export const approveWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { comment } = req.body;

    // Get current document to determine workflow type and status
    const document = await prisma.workflowDocument.findUnique({
      where: { id: parseInt(id) },
      select: {
        workflowType: true,
        approvalFlow: true,
        workflowCategory: true,
        attendanceSubtype: true,
        status: true,
        updatedBy: true,
        submitterId: true,
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const isSuperAdmin = user.roles && user.roles.includes(LMS_ROLES.SUPER_ADMIN);
    const isHR = user.roles && user.roles.includes(LMS_ROLES.HR);
    const isAdmin = user.roles && user.roles.includes(LMS_ROLES.ADMIN);
    const isInstructor = user.roles && user.roles.includes(LMS_ROLES.INSTRUCTOR);
    // Instructor may send SUBMITTED → Admin (first approve step). Admin/HR/SuperAdmin for later stages.
    const instructorCanSendToAdmin = isInstructor && document.status === 'SUBMITTED';
    const adminCanAdvance = isAdmin && ['SUBMITTED', 'UNDER_ADMIN_REVIEW'].includes(document.status);
    const hrCanAdvance = isHR && document.status === 'UNDER_HR_REVIEW';

    if (!user || !user.roles || (!isSuperAdmin && !instructorCanSendToAdmin && !adminCanAdvance && !hrCanAdvance)) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'workflowAction',
        resource: `workflow-documents/${id}`,
        reason: 'Insufficient role for this approval stage',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to approve at this stage.'
      });
    }

    // Prevent approval if document is already approved
    if (document.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'This document has already been approved.'
      });
    }

    // Prevent duplicate approval by the same user on the same status
    // Super Admin can override this to simulate all workflow steps
    // Admin can advance through multiple stages (SUBMITTED → UNDER_ADMIN_REVIEW → UNDER_HR_REVIEW)
    if (!isSuperAdmin && !adminCanAdvance && document.updatedBy === user.dbId && document.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        error: 'You have already approved this document at this stage.'
      });
    }

    // Use XState workflow service to determine next status
    const { status } = document;
    const machineKey = resolveApprovalFlow(document);
    let nextStatus;
    
    try {
      nextStatus = approveWorkflow(machineKey, status);
      console.log('[approveWorkflowDocumentController] XState transition:', {
        machineKey,
        currentStatus: status,
        nextStatus
      });
    } catch (error) {
      console.error('[approveWorkflowDocumentController] Invalid transition:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Update status
    const result = await updateStatus(parseInt(id), nextStatus, user.dbId, comment);

    if (result.success) {
      if (global.chatWSBroadcast) {
        global.chatWSBroadcast('board:workflow_updated', {
          documentId: result.data.id,
          status: result.data.status,
          classId: result.data.classId,
          date: result.data.date,
          title: result.data.title,
        });
      }
      // Emit notification to submitter
      const notifyResults = [];
      try {
        const approver = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.classId ? await prisma.class.findUnique({
          where: { id: result.data.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }) : null;

        const submitterResult = await emit(EVENTS.WORKFLOW_APPROVED, {
          ...buildNotificationNameVars(approver, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          approverName: approver?.displayName || 'Unknown',
          senderName: approver?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          recipientType: 'user',
          recipientUserId: result.data.submitterId,
        }, user, { userId: result.data.submitterId });
        if (submitterResult?.success) notifyResults.push({ target: 'Submitter', count: submitterResult.results.length });

        // Notify next-stage reviewer role if not final approval
        if (nextStatus === 'UNDER_HR_REVIEW') {
          const hrResult = await emit(EVENTS.WORKFLOW_SENT_FOR_REVIEW, {
            ...buildNotificationNameVars(approver, 'Unknown User'),
            workflowName: result.data.title,
            documentId: result.data.id,
            senderName: approver?.displayName || 'Unknown',
            senderId: user?.dbId || null,
            className: cls?.nameEn || null,
            classNameAr: cls?.nameAr || cls?.nameEn || null,
            recipientType: 'role',
            recipientRole: LMS_ROLES.HR,
          }, user, { role: LMS_ROLES.HR });
          if (hrResult?.success) notifyResults.push({ target: 'HR', count: hrResult.results.length });
        } else if (nextStatus === 'UNDER_ADMIN_REVIEW') {
          const adminResult = await emit(EVENTS.WORKFLOW_SENT_FOR_REVIEW, {
            ...buildNotificationNameVars(approver, 'Unknown User'),
            workflowName: result.data.title,
            documentId: result.data.id,
            senderName: approver?.displayName || 'Unknown',
            senderId: user?.dbId || null,
            className: cls?.nameEn || null,
            classNameAr: cls?.nameAr || cls?.nameEn || null,
            recipientType: 'role',
            recipientRole: LMS_ROLES.ADMIN,
          }, user, { role: LMS_ROLES.ADMIN });
          if (adminResult?.success) notifyResults.push({ target: 'Admin', count: adminResult.results.length });
        } else if (nextStatus === 'APPROVED') {
          // Notify all parties: HR + Admin watchers (submitter already notified above)
          const hrWatchResult = await emit(EVENTS.WORKFLOW_APPROVED, {
            ...buildNotificationNameVars(approver, 'Unknown User'),
            workflowName: result.data.title,
            documentId: result.data.id,
            approverName: approver?.displayName || 'Unknown',
            senderName: approver?.displayName || 'Unknown',
            senderId: user?.dbId || null,
            className: cls?.nameEn || null,
            classNameAr: cls?.nameAr || cls?.nameEn || null,
            recipientType: 'role',
            recipientRole: LMS_ROLES.HR,
          }, user, { role: LMS_ROLES.HR });
          if (hrWatchResult?.success) notifyResults.push({ target: 'HR (Watchers)', count: hrWatchResult.results.length });

          const adminWatchResult = await emit(EVENTS.WORKFLOW_APPROVED, {
            ...buildNotificationNameVars(approver, 'Unknown User'),
            workflowName: result.data.title,
            documentId: result.data.id,
            approverName: approver?.displayName || 'Unknown',
            senderName: approver?.displayName || 'Unknown',
            senderId: user?.dbId || null,
            className: cls?.nameEn || null,
            classNameAr: cls?.nameAr || cls?.nameEn || null,
            recipientType: 'role',
            recipientRole: LMS_ROLES.ADMIN,
          }, user, { role: LMS_ROLES.ADMIN });
          if (adminWatchResult?.success) notifyResults.push({ target: 'Admin (Watchers)', count: adminWatchResult.results.length });
        }
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
      }

      res.status(200).json({
        success: true,
        data: result.data,
        notificationsSent: notifyResults
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in approveWorkflowDocumentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/:id/reject
 * Reject workflow document (only owner or super admin can reject)
 */
export const rejectWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { comment } = req.body;

    // Get the document first to check ownership
    const documentResult = await getWorkflowDocument(parseInt(id));
    if (!documentResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = documentResult.data;

    // Validate HR, Admin, or Super Admin role (reviewers can reject)
    const isHR = user.roles && user.roles.includes(LMS_ROLES.HR);
    const isAdmin = user.roles && (user.roles.includes(LMS_ROLES.ADMIN) || user.roles.includes(LMS_ROLES.SUPER_ADMIN));
    const isInstructor = user.roles && user.roles.includes(LMS_ROLES.INSTRUCTOR);

    if (!isHR && !isAdmin && !isInstructor) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'workflowAction',
        resource: `workflow-documents/${id}`,
        reason: 'Admin or Instructor role required for rejection',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or Instructor role required for rejection.'
      });
    }

    // Comment is required for reject
    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required for rejection'
      });
    }

    // Use XState workflow service to determine next status
    let nextStatus;
    try {
      nextStatus = rejectWorkflow(resolveApprovalFlow(document), document.status);
      console.log('[rejectWorkflowDocumentController] XState transition:', {
        workflowType: document.workflowType,
        currentStatus: document.status,
        nextStatus
      });
    } catch (error) {
      console.error('[rejectWorkflowDocumentController] Invalid transition:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Update status to REJECTED
    const result = await updateStatus(parseInt(id), nextStatus, user.dbId, comment);

    if (result.success) {
      if (global.chatWSBroadcast) {
        global.chatWSBroadcast('board:workflow_updated', {
          documentId: result.data.id,
          status: result.data.status,
          classId: result.data.classId,
          date: result.data.date,
          title: result.data.title,
        });
      }
      const notifyResults = [];
      // Emit notification to submitter
      try {
        const rejecter = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.classId ? await prisma.class.findUnique({
          where: { id: result.data.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }) : null;

        const submitterResult = await emit(EVENTS.WORKFLOW_REJECTED, {
          ...buildNotificationNameVars(rejecter, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          feedback: comment,
          rejecterName: rejecter?.displayName || 'Unknown',
          senderName: rejecter?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          recipientType: 'user',
          recipientUserId: result.data.submitterId,
        }, user, { userId: result.data.submitterId });
        if (submitterResult?.success) notifyResults.push({ target: 'Submitter', count: submitterResult.results.length });

        const everReachedHR = (document.statusHistory || []).some(
          (h) => h.toStatus === 'UNDER_HR_REVIEW' || h.fromStatus === 'UNDER_HR_REVIEW',
        ) || document.status === 'UNDER_HR_REVIEW';
        const isAdminBoardReject = isAdmin && !isHR && document.status === 'UNDER_ADMIN_REVIEW';

        if (everReachedHR) {
          const hrResult = await emit(EVENTS.WORKFLOW_REJECTED, {
          ...buildNotificationNameVars(rejecter, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          feedback: comment,
          rejecterName: rejecter?.displayName || 'Unknown',
          senderName: rejecter?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          recipientType: 'role',
          recipientRole: LMS_ROLES.HR,
          }, user, { role: LMS_ROLES.HR });
          if (hrResult?.success) notifyResults.push({ target: 'HR (Watchers)', count: hrResult.results.length });
        }

        if (!isAdminBoardReject) {
          const adminResult = await emit(EVENTS.WORKFLOW_REJECTED, {
          ...buildNotificationNameVars(rejecter, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          feedback: comment,
          rejecterName: rejecter?.displayName || 'Unknown',
          senderName: rejecter?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          recipientType: 'role',
          recipientRole: LMS_ROLES.ADMIN,
          }, user, { role: LMS_ROLES.ADMIN });
          if (adminResult?.success) notifyResults.push({ target: 'Admin (Watchers)', count: adminResult.results.length });
        }
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
      }

      res.status(200).json({
        success: true,
        data: result.data,
        notificationsSent: notifyResults
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in rejectWorkflowDocumentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/:id/return
 * Return workflow document for revision (HR, Admin, or Super Admin can return)
 */
export const returnWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { comment, targetUserId } = req.body;

    // Get current document first so we can check submitter/assignee
    const document = await getWorkflowDocument(parseInt(id));
    if (!document.success) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Validate HR, Admin, Super Admin, submitter, or current assignee
    const isSuperAdmin = user.roles && user.roles.includes(LMS_ROLES.SUPER_ADMIN);
    const isHR = user.roles && user.roles.includes(LMS_ROLES.HR);
    const isAdmin = user.roles && user.roles.includes(LMS_ROLES.ADMIN);
    const isSubmitter = document.data.submitterId === user.dbId;
    const isCurrentAssignee = document.data.currentAssigneeId === user.dbId;

    if (!user || !user.roles || (!isHR && !isAdmin && !isSuperAdmin && !isSubmitter && !isCurrentAssignee)) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'workflowAction',
        resource: `workflow-documents/${id}`,
        reason: 'HR, Admin, Super Admin, submitter, or current assignee role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to return this document.'
      });
    }

    // Comment is required for return
    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required for return'
      });
    }

    const currentStatus = document.data.status;
    const machineKey = resolveApprovalFlow(document.data);
    
    // Prevent return if document is already approved, rejected, or in draft
    if (currentStatus === 'APPROVED' || currentStatus === 'REJECTED' || currentStatus === 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: `This document is ${currentStatus.toLowerCase()} and cannot be returned.`
      });
    }
    
    // Use XState workflow service to determine previous status
    let previousStatus;
    try {
      previousStatus = returnWorkflow(machineKey, currentStatus);
      console.log('[returnWorkflowDocumentController] XState transition:', {
        machineKey,
        currentStatus,
        previousStatus
      });
    } catch (error) {
      console.error('[returnWorkflowDocumentController] Invalid transition:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Update status to previous stage
    const result = await updateStatus(parseInt(id), previousStatus, user.dbId, comment);

    if (result.success) {
      if (global.chatWSBroadcast) {
        global.chatWSBroadcast('board:workflow_updated', {
          documentId: result.data.id,
          status: result.data.status,
          classId: result.data.classId,
          date: result.data.date,
          title: result.data.title,
        });
      }
      // Emit notification to submitter
      const notifyResults = [];
      try {
        const returner = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.classId ? await prisma.class.findUnique({
          where: { id: result.data.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }) : null;

        const submitterResult = await emit(EVENTS.WORKFLOW_RETURNED, {
          ...buildNotificationNameVars(returner, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          feedback: comment,
          previousStatus: currentStatus,
          newStatus: previousStatus,
          returnerName: returner?.displayName || 'Unknown',
          senderName: returner?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          recipientType: 'user',
          recipientUserId: result.data.submitterId,
        }, user, { userId: result.data.submitterId });
        if (submitterResult?.success) notifyResults.push({ target: 'Submitter', count: submitterResult.results.length });

        // Stage-aware role notifications
        if (previousStatus === 'SUBMITTED' || previousStatus === 'UNDER_ADMIN_REVIEW') {
          const adminResult = await emit(EVENTS.WORKFLOW_RETURNED, {
            ...buildNotificationNameVars(returner, 'Unknown User'),
            workflowName: result.data.title,
            documentId: result.data.id,
            feedback: comment,
            previousStatus: currentStatus,
            newStatus: previousStatus,
            returnerName: returner?.displayName || 'Unknown',
            senderName: returner?.displayName || 'Unknown',
            senderId: user?.dbId || null,
            className: cls?.nameEn || null,
            classNameAr: cls?.nameAr || cls?.nameEn || null,
            recipientType: 'role',
            recipientRole: LMS_ROLES.ADMIN,
          }, user, { role: LMS_ROLES.ADMIN });
          if (adminResult?.success) notifyResults.push({ target: 'Admin', count: adminResult.results.length });
        }
        if (previousStatus === 'UNDER_HR_REVIEW' || currentStatus === 'UNDER_HR_REVIEW') {
          const hrResult = await emit(EVENTS.WORKFLOW_RETURNED, {
            ...buildNotificationNameVars(returner, 'Unknown User'),
            workflowName: result.data.title,
            documentId: result.data.id,
            feedback: comment,
            previousStatus: currentStatus,
            newStatus: previousStatus,
            returnerName: returner?.displayName || 'Unknown',
            senderName: returner?.displayName || 'Unknown',
            senderId: user?.dbId || null,
            className: cls?.nameEn || null,
            classNameAr: cls?.nameAr || cls?.nameEn || null,
            recipientType: 'role',
            recipientRole: LMS_ROLES.HR,
          }, user, { role: LMS_ROLES.HR });
          if (hrResult?.success) notifyResults.push({ target: 'HR', count: hrResult.results.length });
        }
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
      }

      res.status(200).json({
        success: true,
        data: result.data,
        notificationsSent: notifyResults
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in returnWorkflowDocumentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/:id/resubmit
 * Resubmit workflow document with new file
 */
export const resubmitWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { fileData, fileName, fileType, comment } = req.body;

    // Validate required fields
    if (!fileData || !fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'Missing file data: fileData, fileName, fileType required'
      });
    }

    // Resubmit document
    const result = await resubmitWorkflowDocument({
      documentId: parseInt(id),
      fileData,
      fileName,
      fileType,
      submitterId: user.dbId,
      comment,
      updatedBy: user.dbId
    });

    if (result.success) {
      if (global.chatWSBroadcast) {
        global.chatWSBroadcast('board:workflow_updated', {
          documentId: result.data.id,
          status: result.data.status,
          classId: result.data.classId,
          date: result.data.date,
          title: result.data.title,
        });
      }
      // Emit notification to HR users
      try {
        const submitter = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.classId ? await prisma.class.findUnique({
          where: { id: result.data.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }) : null;

        await emit(EVENTS.WORKFLOW_RESUBMITTED, {
          ...buildNotificationNameVars(submitter, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          reviewCycleCount: result.data.reviewCycleCount,
          submitterName: submitter?.displayName || 'Unknown',
          senderName: submitter?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          recipientType: 'role',
          recipientRole: LMS_ROLES.HR,
        }, user, { role: LMS_ROLES.HR });
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in resubmitWorkflowDocumentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/:id/upload-signed
 * Upload signed document by Admin (for weekly summaries)
 */
export const uploadSignedDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { fileData, fileName, fileType, comment } = req.body;

    // Validate required fields
    if (!fileData || !fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'Missing file data: fileData, fileName, fileType required'
      });
    }

    // Upload signed document
    const result = await uploadSignedDocument({
      documentId: parseInt(id),
      fileData,
      fileName,
      fileType,
      adminId: user.dbId,
      comment,
      updatedBy: user.dbId
    });

    if (result.success) {
      // Emit notification to HR users
      try {
        const admin = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.classId ? await prisma.class.findUnique({
          where: { id: result.data.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }) : null;

        await emit(EVENTS.WORKFLOW_ASSIGNED, {
          ...buildNotificationNameVars(admin, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          adminName: admin?.displayName || 'Unknown',
          senderName: admin?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          recipientType: 'role',
          recipientRole: LMS_ROLES.HR,
        }, user, { role: LMS_ROLES.HR });
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in uploadSignedDocumentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/:id/withdraw
 * Withdraw workflow document (revert to DRAFT status)
 */
export const withdrawWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { comment } = req.body;

    console.log('[withdrawWorkflowDocumentController] Document ID:', id, 'User DB ID:', user.dbId, 'Comment:', comment);

    // Withdraw document
    const result = await withdrawWorkflowDocument({
      documentId: parseInt(id),
      submitterId: user.dbId,
      comment,
      updatedBy: user.dbId
    });

    console.log('[withdrawWorkflowDocumentController] Result:', result);

    if (result.success) {
      // Emit notification to HR users as watchers
      try {
        const withdrawer = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.classId ? await prisma.class.findUnique({
          where: { id: result.data.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }) : null;

        const notifyResults = [];

        const hrResult = await emit(EVENTS.WORKFLOW_WITHDRAWN, {
          ...buildNotificationNameVars(withdrawer, 'Unknown User'),
          workflowName: result.data.title,
          documentId: result.data.id,
          withdrawerName: withdrawer?.displayName || 'Unknown',
          senderName: withdrawer?.displayName || 'Unknown',
          senderId: user?.dbId || null,
          className: cls?.nameEn || null,
          classNameAr: cls?.nameAr || cls?.nameEn || null,
          recipientType: 'role',
          recipientRole: LMS_ROLES.HR,
        }, user, { role: LMS_ROLES.HR });
        if (hrResult?.success) notifyResults.push({ target: 'HR (Watchers)', count: hrResult.results.length });
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
      }

      res.status(200).json({
        success: true,
        data: result.data,
        notificationsSent: notifyResults
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in withdrawWorkflowDocumentController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/workflow-documents/compliance
 * Get compliance data for calendar view
 */
export const getComplianceDataController = async (req, res) => {
  try {
    const { startDate, endDate, program, instructorId, workflowType } = req.query;

    // Validate HR or Admin role
    const { user } = req;
    if (!user || !user.roles || (!user.roles.includes(LMS_ROLES.HR) && !user.roles.includes(LMS_ROLES.ADMIN))) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'getComplianceData',
        resource: 'workflow-documents/compliance',
        reason: 'HR or Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR or Admin role required.'
      });
    }

    // Get compliance data
    const result = await getComplianceData({
      startDate,
      endDate,
      program,
      instructorId: instructorId ? parseInt(instructorId) : undefined,
      workflowType
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getComplianceDataController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/workflow-documents/analytics
 * Get analytics data for workflow dashboard
 */
export const getAnalyticsDataController = async (req, res) => {
  try {
    const { startDate, endDate, program, workflowType } = req.query;

    // Validate HR or Admin role
    const { user } = req;
    if (!user || !user.roles || (!user.roles.includes(LMS_ROLES.HR) && !user.roles.includes(LMS_ROLES.ADMIN))) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'getAnalyticsData',
        resource: 'workflow-documents/analytics',
        reason: 'HR or Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR or Admin role required.'
      });
    }

    // Get analytics data
    const result = await getAnalyticsData({
      startDate,
      endDate,
      program,
      workflowType
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getAnalyticsDataController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/workflow-documents/:fileId/versions
 * List all versions of a workflow document file
 */
export const listFileVersionsController = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file versions
    const result = await listFileVersions(fileId);

    if (result.success) {
      // Normalize uploadedBy profileImageUrl in versions
      const normalizedData = {
        ...result.data,
        versions: (result.data.versions || []).map(v => ({
          ...v,
          uploadedBy: mapUserImage(v.uploadedBy),
        })),
      };
      res.status(200).json({
        success: true,
        data: normalizedData
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in listFileVersionsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/workflow-documents/:fileId/versions/:versionId/download
 * Download a specific version of a workflow document file
 */
export const downloadFileVersionController = async (req, res) => {
  try {
    const { fileId, versionId } = req.params;

    // Download file version
    const result = await downloadFileVersion(fileId, versionId, req, res);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in downloadFileVersionController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/custom
 * Create a custom workflow document with optional file copy from Smart Drive
 */
export const createCustomWorkflowDocumentController = async (req, res) => {
  try {
    const { user } = req;
    
    // Validate user has permission (instructor, hr, or admin)
    if (!user || !user.roles || !user.roles.some(role => [LMS_ROLES.INSTRUCTOR, LMS_ROLES.HR, LMS_ROLES.ADMIN].includes(role))) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'createCustomWorkflowDocument',
        resource: `workflow-documents/custom`,
        reason: 'Instructor, HR, or Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Instructor, HR, or Admin role required.'
      });
    }

    // Validate required fields
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
      fileId,
      date,
      dateFrom,
      dateTo,
      metadata,
      attendanceIds,
      specificUserIds,
      targetStudentId,
      targetStudentIds,
    } = req.body;

    if ((!workflowType && !workflowCategory) || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workflowCategory (or workflowType), title'
      });
    }

    const resolvedCategory = workflowCategory || (workflowType?.startsWith('ATTENDANCE') ? 'ATTENDANCE' : 'GENERAL');
    const resolvedSubtype = attendanceSubtype || null;

    if (resolvedCategory === 'ATTENDANCE' && resolvedSubtype === 'DAILY') {
      if (!req.body.classId) {
        return res.status(400).json({
          success: false,
          error: 'Class is required for daily attendance approval'
        });
      }
      if (!dateFrom) {
        return res.status(400).json({
          success: false,
          error: 'Attendance date is required for daily attendance approval'
        });
      }
    }

    if (resolvedCategory === 'ATTENDANCE' && resolvedSubtype === 'WEEKLY_SUMMARY') {
      if (!req.body.classId) {
        return res.status(400).json({
          success: false,
          error: 'Class is required for weekly attendance summary'
        });
      }
      if (!dateFrom || !dateTo) {
        return res.status(400).json({
          success: false,
          error: 'Week start and end dates are required for weekly summary'
        });
      }
    }

    // Reviewers are now optional - can be assigned later from file details tab

    // If attaching existing file, validate ownership (disable workflow on shared files)
    if (attachFile && fileId) {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: { ownerId: true, isDeleted: true }
      });

      if (!file || file.isDeleted) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      if (file.ownerId !== user.dbId) {
        await logPermissionDenial({
          userId: user?.id,
          action: 'createCustomWorkflowDocument',
          resource: `workflow-documents/custom`,
          reason: 'Workflow initiation disabled on shared files',
          userRole: user?.roles?.join(',') || 'none'
        });
        return res.status(403).json({
          success: false,
          error: 'Access denied. Workflow initiation is disabled on shared files. Only the file owner can initiate a workflow.'
        });
      }
    }

    // Validate user has database ID
    if (!user.dbId) {
      console.error('[createCustomWorkflowDocument] User missing database ID:', {
        keycloakId: user.id,
        email: user.email
      });
      return res.status(400).json({
        success: false,
        error: 'User account not properly configured'
      });
    }

    // Create custom workflow document
    const result = await createCustomWorkflowDocument({
      workflowType,
      workflowCategory,
      attendanceSubtype,
      approvalFlow,
      title,
      description,
      reviewers: reviewers || [],
      attachFile: attachFile || false,
      sourceBucket,
      sourcePath,
      fileName,
      fileId,
      date: date || dateFrom,
      dateFrom,
      dateTo,
      metadata,
      attendanceIds: attendanceIds || [],
      classId: req.body.classId || null,
      program: req.body.program || null,
      subject: req.body.subject || null,
      submitterId: user.dbId,
      createdBy: user.dbId,
      updatedBy: user.dbId,
      specificUserIds,
      targetStudentId: targetStudentIds?.length ? targetStudentIds[0] : targetStudentId,
      targetStudentIds: targetStudentIds?.length ? targetStudentIds : (targetStudentId ? [targetStudentId] : []),
    });

    if (result.success) {
      // Emit notification to reviewers
      try {
        const submitter = await prisma.user.findUnique({
          where: { id: user.dbId },
          select: { id: true, displayName: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, displayNameAr: true }
        });
        const cls = result.data.document.classId ? await prisma.class.findUnique({
          where: { id: result.data.document.classId },
          select: { id: true, nameEn: true, nameAr: true, code: true }
        }) : null;

        if (result.data.document.currentAssigneeId) {
          await emit(EVENTS.WORKFLOW_SUBMITTED, {
            ...buildNotificationNameVars(submitter, 'Unknown User'),
            title: result.data.document.title,
            documentId: result.data.document.id,
            assigneeId: result.data.document.currentAssigneeId,
            submitterId: user.id,
            submitterName: submitter?.displayName || 'Unknown',
            senderName: submitter?.displayName || 'Unknown',
            senderId: user?.dbId || null,
            className: cls?.nameEn || null,
            classNameAr: cls?.nameAr || cls?.nameEn || null,
            recipientType: 'user',
            recipientUserId: result.data.document.currentAssigneeId,
          }, user, { userId: result.data.document.currentAssigneeId });
        }
      } catch (notificationError) {
        console.error('Error emitting notification:', notificationError);
      }

      return res.status(201).json({
        success: true,
        data: result.data
      });
    } else if (result.code === 409) {
      return res.status(409).json({
        success: false,
        error: result.error,
        existingWorkflow: result.existingDocument,
        existingDraft: result.existingDraft || null,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to create custom workflow document'
      });
    }
  } catch (error) {
    console.error('Error creating custom workflow document:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/v1/workflow-documents/:id
 * Hard delete a workflow document
 */
export const deleteWorkflowDocumentController = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Convert ID to integer
    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document ID'
      });
    }

    // Validate admin or instructor role
    if (!user || !user.roles || (!user.roles.includes('admin') && !user.roles.includes('super_admin') && !user.roles.includes('instructor'))) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'deleteWorkflowDocument',
        resource: `workflow-documents/${id}`,
        reason: 'Admin or instructor role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or instructor role required.'
      });
    }

    const result = await deleteWorkflowDocument(documentId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(404).json({
        success: false,
        error: result.error || 'Failed to delete workflow document'
      });
    }
  } catch (error) {
    console.error('Error deleting workflow document:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/v1/workflow-documents/linked-by-attendance
 * Batch-lookup workflow documents linked to attendance records via junction table.
 * Returns a map of attendanceId → workflow document summary.
 */
/**
 * GET /api/v1/workflow-documents/by-context
 * Workflows for a student on a specific class day.
 */
export const getWorkflowsByContextController = async (req, res) => {
  try {
    const { userId, classId, date } = req.query;
    if (!userId || !classId || !date) {
      return res.status(400).json({
        success: false,
        error: 'userId, classId, and date are required',
      });
    }

    const result = await getWorkflowsByStudentDay({
      userId: parseInt(userId, 10),
      classId: parseInt(classId, 10),
      date,
    });

    if (result.success) {
      const data = (result.data || []).map(mapDocumentUserImages);
      return res.status(200).json({ success: true, data });
    }
    return res.status(500).json({ success: false, error: result.error });
  } catch (error) {
    console.error('Error in getWorkflowsByContextController:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getLinkedWorkflowsController = async (req, res) => {
  try {
    const { attendanceIds } = req.body;

    if (!Array.isArray(attendanceIds) || attendanceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'attendanceIds array is required'
      });
    }

    const result = await getLinkedWorkflowsByAttendanceIds(attendanceIds);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch linked workflows'
      });
    }
  } catch (error) {
    console.error('Error in getLinkedWorkflowsController:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/v1/workflow-documents/board
 * Operations board workflow list with filters
 */
export const getBoardWorkflowDocumentsController = async (req, res) => {
  try {
    const { date, classId, programId, subjectId, status, workflowType, workflowCategory, attendanceSubtype, search, limit, offset } = req.query;
    const result = await getBoardWorkflowDocuments({
      date,
      classId,
      programId,
      subjectId,
      status,
      workflowType,
      workflowCategory: workflowCategory || 'ATTENDANCE',
      attendanceSubtype: attendanceSubtype || 'DAILY',
      search,
      limit,
      offset,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    let data = result.data || [];
    const scope = await getRequestScope(req);
    if (!scope.unrestricted) {
      data = data.map((d) => ({
        ...d,
        programId: d.class?.programId ?? d.programId,
        subjectId: d.class?.subjectId ?? d.subjectId,
      }));
      data = filterRecordsByScope(data, scope, {
        classField: 'classId',
        programField: 'programId',
        subjectField: 'subjectId',
      });
    }

    return res.status(200).json({ success: true, data, total: data.length });
  } catch (error) {
    console.error('Error in getBoardWorkflowDocumentsController:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * POST /api/v1/workflow-documents/ensure-daily
 * Auto-create DRAFT daily attendance workflows for scheduled classes
 */
export const ensureDailyWorkflowsController = async (req, res) => {
  try {
    const { date, classIds } = req.body;
    const { user } = req;

    if (!date) {
      return res.status(400).json({ success: false, error: 'date is required' });
    }

    const result = await ensureDailyWorkflows({
      date,
      classIds: classIds || [],
      actorId: user?.dbId || null,
    });

    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    console.error('Error in ensureDailyWorkflowsController:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export default {
  createWorkflowDocumentController,
  getWorkflowDocumentController,
  getWorkflowDocumentsController,
  updateWorkflowDocumentStatusController,
  addWorkflowCommentController,
  approveWorkflowDocumentController,
  rejectWorkflowDocumentController,
  returnWorkflowDocumentController,
  resubmitWorkflowDocumentController,
  uploadSignedDocumentController,
  withdrawWorkflowDocumentController,
  getComplianceDataController,
  getAnalyticsDataController,
  listFileVersionsController,
  downloadFileVersionController,
  createCustomWorkflowDocumentController,
  deleteWorkflowDocumentController,
  getLinkedWorkflowsController,
  getWorkflowsByContextController,
  getBoardWorkflowDocumentsController,
  ensureDailyWorkflowsController,
};
