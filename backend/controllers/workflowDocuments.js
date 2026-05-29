/**
 * Workflow Documents Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for workflow document operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import { LMS_ROLES } from '../services/keycloakAdminService.js';
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
  deleteWorkflowDocument
} from '../services/workflowDocumentService.js';
import { emit } from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';
import { logPermissionDenial } from '../services/permissionDenialAuditService.js';

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
      updatedBy: user.dbId
    });

    if (result.success) {
      // Emit notification to HR users
      try {
        await emit(EVENTS.WORKFLOW_SUBMITTED, {
          title: result.data.document.title,
          workflowType: result.data.document.workflowType,
          documentId: result.data.document.id,
          classId: result.data.document.classId,
          date: result.data.document.date
        }, user, { role: LMS_ROLES.HR });
      } catch (notificationError) {
        console.error('Failed to emit notification:', notificationError);
        // Don't fail the request if notification fails
      }

      res.status(201).json({
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
        data: result.data
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
    const { role, status, workflowType, limit, offset, fileId } = req.query;

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
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      });
    } else {
      // Get documents submitted by this user
      result = await getSubmitterDocuments(user.dbId, {
        status,
        workflowType,
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
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        userDbId: user.dbId  // Include user's database ID for frontend filtering
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

    const result = await updateStatus(parseInt(id), status, user.dbId, reason);

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
        data: result.data
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
      res.status(201).json({
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

    // Validate HR, Admin, or Super Admin role
    const isSuperAdmin = user.roles && user.roles.includes(LMS_ROLES.SUPER_ADMIN);
    if (!user || !user.roles || (!user.roles.includes(LMS_ROLES.HR) && !user.roles.includes(LMS_ROLES.ADMIN) && !isSuperAdmin)) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'workflowAction',
        resource: `workflow-documents/${id}`,
        reason: 'HR, Admin, or Super Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR, Admin, or Super Admin role required.'
      });
    }

    // Update status to APPROVED
    const result = await updateStatus(parseInt(id), 'APPROVED', user.dbId, comment);

    if (result.success) {
      // Emit notification to submitter
      try {
        await emit(EVENTS.WORKFLOW_APPROVED, {
          workflowName: result.data.title,
          documentId: result.data.id
        }, user, { userId: result.data.submitterId });
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

    const document = documentResult.data.document;

    // Validate admin or instructor role (reviewers can reject)
    const isAdmin = user.roles && (user.roles.includes(LMS_ROLES.ADMIN) || user.roles.includes(LMS_ROLES.SUPER_ADMIN));
    const isInstructor = user.roles && user.roles.includes(LMS_ROLES.INSTRUCTOR);

    if (!isAdmin && !isInstructor) {
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

    // Update status to REJECTED
    const result = await updateStatus(parseInt(id), 'REJECTED', user.dbId, comment);

    if (result.success) {
      // Emit notification to submitter
      try {
        await emit(EVENTS.WORKFLOW_REJECTED, {
          workflowName: result.data.title,
          documentId: result.data.id,
          feedback: comment
        }, user, { userId: result.data.submitterId });
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

    // Validate HR, Admin, or Super Admin role
    const isSuperAdmin = user.roles && user.roles.includes(LMS_ROLES.SUPER_ADMIN);
    if (!user || !user.roles || (!user.roles.includes(LMS_ROLES.HR) && !user.roles.includes(LMS_ROLES.ADMIN) && !isSuperAdmin)) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'workflowAction',
        resource: `workflow-documents/${id}`,
        reason: 'HR, Admin, or Super Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR, Admin, or Super Admin role required.'
      });
    }

    // Comment is required for return
    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required for return'
      });
    }

    // Update status to REJECTED (same as reject, but with different target)
    const result = await updateStatus(parseInt(id), 'REJECTED', user.dbId, comment);

    if (result.success) {
      // Emit notification to target user (submitter or specified target)
      try {
        const targetId = targetUserId || result.data.submitterId;
        await emit(EVENTS.WORKFLOW_RETURNED, {
          workflowName: result.data.title,
          documentId: result.data.id,
          feedback: comment
        }, user, { userId: targetId });
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
      // Emit notification to HR users
      try {
        await emit(EVENTS.WORKFLOW_RESUBMITTED, {
          workflowName: result.data.title,
          documentId: result.data.id,
          reviewCycleCount: result.data.reviewCycleCount
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
        await emit(EVENTS.WORKFLOW_ASSIGNED, {
          workflowName: result.data.title,
          documentId: result.data.id
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
      title,
      description,
      reviewers,
      attachFile,
      sourceBucket,
      sourcePath,
      fileName,
      fileId
    } = req.body;

    if (!workflowType || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workflowType, title'
      });
    }

    // Reviewers are now optional - can be assigned later from file details tab

    // If attaching existing file, validate ownership (disable workflow on shared files)
    if (attachFile && fileId) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
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
      title,
      description,
      reviewers: reviewers || [],
      attachFile: attachFile || false,
      sourceBucket,
      sourcePath,
      fileName,
      fileId,
      submitterId: user.dbId,
      createdBy: user.dbId,
      updatedBy: user.dbId
    });

    if (result.success) {
      // Emit notification to reviewers
      try {
        if (result.data.document.currentAssigneeId) {
          await emit(EVENTS.WORKFLOW_SUBMITTED, {
            title: result.data.document.title,
            documentId: result.data.document.id,
            assigneeId: result.data.document.currentAssigneeId,
            submitterId: user.id
          });
        }
      } catch (notificationError) {
        console.error('Error emitting notification:', notificationError);
        // Don't fail the workflow creation if notification fails
      }

      return res.status(201).json({
        success: true,
        data: result.data
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
    if (!user || !user.roles || (!user.roles.includes('admin') && !user.roles.includes('instructor'))) {
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
  deleteWorkflowDocumentController
};
