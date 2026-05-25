/**
 * Workflow Documents Controller - API Layer
 * 
 * PURPOSE: HTTP request handling for workflow document operations
 * ARCHITECTURE: HTTP Requests → Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  createWorkflowDocumentWithUpload,
  getWorkflowDocument,
  getSubmitterDocuments,
  getAssigneeDocuments,
  getDocumentsByFileId,
  updateStatus,
  addComment,
  resubmitWorkflowDocument,
  uploadSignedDocument,
  withdrawWorkflowDocument,
  getComplianceData,
  getAnalyticsData,
  listFileVersions,
  downloadFileVersion,
  createCustomWorkflowDocument
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
      submitterId: user.id,
      currentAssigneeId: null, // Will be assigned to HR role
      classId,
      instructorId: user.id,
      date,
      program,
      subject,
      createdBy: user.id,
      updatedBy: user.id
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
        }, user, { role: 'hr' });
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
    } else if (role === 'assignee' && (user.roles?.includes('hr') || user.roles?.includes('admin'))) {
      // Get documents assigned to this user (HR/Admin inbox)
      result = await getAssigneeDocuments(user.id, {
        status,
        workflowType,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      });
    } else {
      // Get documents submitted by this user
      result = await getSubmitterDocuments(user.id, {
        status,
        workflowType,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      });
    }

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total
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

    const result = await updateStatus(parseInt(id), status, user.id, reason);

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
      authorId: user.id,
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
 * POST /api/v1/workflow-documents/:id/approve
 * Approve workflow document
 */
export const approveWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { comment } = req.body;

    // Validate HR or Admin role
    if (!user || !user.roles || (!user.roles.includes('hr') && !user.roles.includes('admin'))) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'workflowAction',
        resource: `workflow-documents/${id}`,
        reason: 'HR or Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR or Admin role required.'
      });
    }

    // Update status to APPROVED
    const result = await updateStatus(parseInt(id), 'APPROVED', user.id, comment);

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
 * Reject workflow document
 */
export const rejectWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { comment } = req.body;

    // Validate HR or Admin role
    if (!user || !user.roles || (!user.roles.includes('hr') && !user.roles.includes('admin'))) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'workflowAction',
        resource: `workflow-documents/${id}`,
        reason: 'HR or Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR or Admin role required.'
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
    const result = await updateStatus(parseInt(id), 'REJECTED', user.id, comment);

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
 * Return workflow document for revision
 */
export const returnWorkflowDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { comment, targetUserId } = req.body;

    // Validate HR or Admin role
    if (!user || !user.roles || (!user.roles.includes('hr') && !user.roles.includes('admin'))) {
      await logPermissionDenial({
        userId: user?.id,
        action: 'workflowAction',
        resource: `workflow-documents/${id}`,
        reason: 'HR or Admin role required',
        userRole: user?.roles?.join(',') || 'none'
      });
      return res.status(403).json({
        success: false,
        error: 'Access denied. HR or Admin role required.'
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
    const result = await updateStatus(parseInt(id), 'REJECTED', user.id, comment);

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
      submitterId: user.id,
      comment,
      updatedBy: user.id
    });

    if (result.success) {
      // Emit notification to HR users
      try {
        await emit(EVENTS.WORKFLOW_RESUBMITTED, {
          workflowName: result.data.title,
          documentId: result.data.id,
          reviewCycleCount: result.data.reviewCycleCount
        }, user, { role: 'hr' });
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
      adminId: user.id,
      comment,
      updatedBy: user.id
    });

    if (result.success) {
      // Emit notification to HR users
      try {
        await emit(EVENTS.WORKFLOW_ASSIGNED, {
          workflowName: result.data.title,
          documentId: result.data.id
        }, user, { role: 'hr' });
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

    // Withdraw document
    const result = await withdrawWorkflowDocument({
      documentId: parseInt(id),
      submitterId: user.id,
      comment,
      updatedBy: user.id
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
    if (!user || !user.roles || (!user.roles.includes('hr') && !user.roles.includes('admin'))) {
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
    if (!user || !user.roles || (!user.roles.includes('hr') && !user.roles.includes('admin'))) {
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
    if (!user || !user.roles || !user.roles.some(role => ['instructor', 'hr', 'admin'].includes(role))) {
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

    // Validate reviewers is required
    if (!reviewers || !Array.isArray(reviewers) || reviewers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one reviewer role is required'
      });
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
  createCustomWorkflowDocumentController
};
