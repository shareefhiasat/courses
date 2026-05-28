/**
 * Workflow Document Type Definitions
 * 
 * PURPOSE: Centralized type definitions for workflow-related entities
 * ARCHITECTURE: Single source of truth for workflow data structures
 */

/**
 * @typedef {Object} WorkflowDocument
 * @property {string} id - Unique identifier
 * @property {string} title - Document title
 * @property {string} description - Document description
 * @property {string} workflowType - Type of workflow (e.g., 'ATTENDANCE_WEEKLY', 'ATTENDANCE_MONTHLY')
 * @property {string} status - Current status (DRAFT, SUBMITTED, UNDER_REVIEW, UNDER_ADMIN_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED)
 * @property {string} submitterId - ID of the user who submitted the document
 * @property {Object} submitter - Submitter user details
 * @property {string} submitter.displayName - Submitter display name
 * @property {string} submitter.email - Submitter email
 * @property {Array<WorkflowHistoryEntry>} statusHistory - History of status changes
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 * @property {Object} metadata - Additional metadata
 * @property {string} fileUrl - URL to the associated file
 * @property {string} fileName - Name of the associated file
 * @property {string} fileType - MIME type of the file
 */

/**
 * @typedef {Object} WorkflowHistoryEntry
 * @property {string} id - Unique identifier
 * @property {string} fromStatus - Previous status
 * @property {string} toStatus - New status
 * @property {string} actorId - ID of the user who made the change
 * @property {Object} actor - Actor user details
 * @property {string} actor.name - Actor name
 * @property {string} actor.firstName - Actor first name
 * @property {string} reason - Reason for status change
 * @property {string} createdAt - ISO timestamp of the change
 */

/**
 * @typedef {Object} WorkflowAction
 * @property {string} type - Action type (approve, reject, return, resubmit, withdraw, upload_signed)
 * @property {string} comment - Action comment
 * @property {Object} file - File attachment (for resubmit/upload_signed)
 * @property {string} file.name - File name
 * @property {string} file.type - File type
 * @property {string} file.data - Base64 file data
 */

/**
 * @typedef {Object} LegacyWorkflow
 * @property {string} id - Unique identifier
 * @property {string} title - Workflow title
 * @property {string} status - Status (draft, sent, returned, revise_needed, approved, closed)
 * @property {string} initiatedById - ID of the user who initiated the workflow
 * @property {string} assignedUserId - ID of the assigned user
 * @property {string} assignedRole - Role assigned to handle the workflow
 * @property {Array<LegacyWorkflowAction>} actions - Workflow actions
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * @typedef {Object} LegacyWorkflowAction
 * @property {string} id - Unique identifier
 * @property {string} action - Action type (sent, review, approve, revise, approved, return, close)
 * @property {string} actorId - ID of the user who performed the action
 * @property {string} comment - Action comment
 * @property {string} createdAt - ISO timestamp of the action
 */

/**
 * @typedef {Object} SmartDriveFile
 * @property {string} id - Unique identifier
 * @property {string} name - File name
 * @property {string} type - File type
 * @property {number} size - File size in bytes
 * @property {string} url - File URL
 * @property {string} status - Workflow status (pending, in_progress, completed, rejected, needs_feedback)
 * @property {Object} workflowCounts - Workflow status counts
 * @property {number} workflowCounts.pending - Count of pending workflows
 * @property {number} workflowCounts.in_progress - Count of in-progress workflows
 * @property {number} workflowCounts.completed - Count of completed workflows
 * @property {number} workflowCounts.rejected - Count of rejected workflows
 * @property {number} workflowCounts.needs_feedback - Count of workflows needing feedback
 * @property {boolean} starred - Whether the file is starred
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * @typedef {Object} WorkflowDocumentCreateRequest
 * @property {string} title - Document title
 * @property {string} description - Document description
 * @property {string} workflowType - Type of workflow
 * @property {string} fileId - ID of the associated file
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} WorkflowDocumentUpdateRequest
 * @property {string} title - Document title (optional)
 * @property {string} description - Document description (optional)
 * @property {Object} metadata - Additional metadata (optional)
 */

/**
 * @typedef {Object} WorkflowStatusUpdateRequest
 * @property {string} status - New status
 * @property {string} comment - Reason for status change
 * @property {Object} file - File attachment (for resubmit/upload_signed)
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {Object} data - Response data
 * @property {string} error - Error message (if unsuccessful)
 */

export default {
  WorkflowDocument,
  WorkflowHistoryEntry,
  WorkflowAction,
  LegacyWorkflow,
  LegacyWorkflowAction,
  SmartDriveFile,
  WorkflowDocumentCreateRequest,
  WorkflowDocumentUpdateRequest,
  WorkflowStatusUpdateRequest,
  ApiResponse
};
