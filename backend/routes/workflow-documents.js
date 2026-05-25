/**
 * Workflow Documents API Routes
 * 
 * PURPOSE: Route definitions for workflow document operations
 * ARCHITECTURE: Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import {
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
} from '../controllers/workflowDocuments.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkflowDocument:
 *       type: object
 *       required:
 *         - workflowType
 *         - title
 *         - classId
 *         - date
 *         - program
 *         - subject
 *       properties:
 *         id:
 *           type: integer
 *           description: Workflow document unique identifier
 *           example: 1
 *         workflowType:
 *           type: string
 *           enum: [ATTENDANCE_DAILY, ATTENDANCE_WEEKLY, GENERAL]
 *           description: Type of workflow document
 *           example: ATTENDANCE_DAILY
 *         title:
 *           type: string
 *           description: Document title
 *           example: "Daily Attendance Report - 2026-05-23"
 *         description:
 *           type: string
 *           description: Optional description
 *           example: "Attendance for Mathematics class"
 *         status:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED]
 *           description: Document status
 *           example: SUBMITTED
 *         fileId:
 *           type: string
 *           description: Reference to File model (UUID)
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         submitterId:
 *           type: integer
 *           description: User ID of submitter
 *           example: 5
 *         currentAssigneeId:
 *           type: integer
 *           description: User ID of current assignee
 *           example: 10
 *         classId:
 *           type: integer
 *           description: Class ID
 *           example: 15
 *         instructorId:
 *           type: integer
 *           description: Instructor ID
 *           example: 5
 *         date:
 *           type: string
 *           format: date
 *           description: Attendance date
 *           example: "2026-05-23"
 *         program:
 *           type: string
 *           description: Program name
 *           example: "Batch24"
 *         subject:
 *           type: string
 *           description: Subject name
 *           example: "Mathematics"
 */

/**
 * @swagger
 * /api/v1/workflow-documents:
 *   post:
 *     summary: Create a new workflow document
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workflowType
 *               - title
 *               - classId
 *               - date
 *               - program
 *               - subject
 *               - fileData
 *               - fileName
 *               - fileType
 *             properties:
 *               workflowType:
 *                 type: string
 *                 enum: [ATTENDANCE_DAILY, ATTENDANCE_WEEKLY, GENERAL]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               classId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               program:
 *                 type: string
 *               subject:
 *                 type: string
 *               fileData:
 *                 type: string
 *                 description: Base64 encoded file data
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *                 description: MIME type
 *     responses:
 *       201:
 *         description: Workflow document created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/', createWorkflowDocumentController);

/**
 * @swagger
 * /api/v1/workflow-documents:
 *   get:
 *     summary: Get workflow documents for current user
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [submitter, assignee]
 *         description: Filter by role (submitter or assignee)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED]
 *         description: Filter by status
 *       - in: query
 *         name: workflowType
 *         schema:
 *           type: string
 *           enum: [ATTENDANCE_DAILY, ATTENDANCE_WEEKLY, GENERAL]
 *         description: Filter by workflow type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Workflow documents retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/', getWorkflowDocumentsController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}:
 *   get:
 *     summary: Get workflow document by ID
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     responses:
 *       200:
 *         description: Workflow document retrieved successfully
 *       404:
 *         description: Workflow document not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getWorkflowDocumentController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}/status:
 *   patch:
 *     summary: Update workflow document status
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, AMENDED, CLOSED]
 *               reason:
 *                 type: string
 *                 description: Reason for status change
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/status', updateWorkflowDocumentStatusController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}/comments:
 *   post:
 *     summary: Add comment to workflow document
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Comment text
 *               action:
 *                 type: string
 *                 description: Optional action (e.g., APPROVED, REJECTED, AMENDED, COMMENT)
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/:id/comments', addWorkflowCommentController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}/approve:
 *   post:
 *     summary: Approve workflow document
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Optional comment for approval
 *     responses:
 *       200:
 *         description: Document approved successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/:id/approve', approveWorkflowDocumentController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}/reject:
 *   post:
 *     summary: Reject workflow document
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Required comment for rejection
 *     responses:
 *       200:
 *         description: Document rejected successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/:id/reject', rejectWorkflowDocumentController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}/return:
 *   post:
 *     summary: Return workflow document for revision
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Required comment for return
 *               targetUserId:
 *                 type: integer
 *                 description: Optional target user ID (defaults to submitter)
 *     responses:
 *       200:
 *         description: Document returned successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/:id/return', returnWorkflowDocumentController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}/resubmit:
 *   post:
 *     summary: Resubmit workflow document with new file
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileData
 *               - fileName
 *               - fileType
 *             properties:
 *               fileData:
 *                 type: string
 *                 description: Base64 encoded file data
 *               fileName:
 *                 type: string
 *                 description: File name
 *               fileType:
 *                 type: string
 *                 description: MIME type
 *               comment:
 *                 type: string
 *                 description: Optional comment for resubmission
 *     responses:
 *       200:
 *         description: Document resubmitted successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/:id/resubmit', resubmitWorkflowDocumentController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}/upload-signed:
 *   post:
 *     summary: Upload signed document by Admin (for weekly summaries)
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileData
 *               - fileName
 *               - fileType
 *             properties:
 *               fileData:
 *                 type: string
 *                 description: Base64 encoded file data
 *               fileName:
 *                 type: string
 *                 description: File name
 *               fileType:
 *                 type: string
 *                 description: MIME type
 *               comment:
 *                 type: string
 *                 description: Optional comment for upload
 *     responses:
 *       200:
 *         description: Signed document uploaded successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/:id/upload-signed', uploadSignedDocumentController);

/**
 * @swagger
 * /api/v1/workflow-documents/{id}/withdraw:
 *   post:
 *     summary: Withdraw workflow document (revert to DRAFT status)
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workflow document ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Optional comment for withdrawal
 *     responses:
 *       200:
 *         description: Document withdrawn successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/:id/withdraw', withdrawWorkflowDocumentController);

/**
 * @swagger
 * /api/v1/workflow-documents/compliance:
 *   get:
 *     summary: Get compliance data for calendar view
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (ISO format)
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *         description: Filter by program
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: integer
 *         description: Filter by instructor ID
 *       - in: query
 *         name: workflowType
 *         schema:
 *           type: string
 *         description: Filter by workflow type
 *     responses:
 *       200:
 *         description: Compliance data retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/compliance', getComplianceDataController);

/**
 * @swagger
 * /api/v1/workflow-documents/analytics:
 *   get:
 *     summary: Get analytics data for workflow dashboard
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (ISO format)
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *         description: Filter by program
 *       - in: query
 *         name: workflowType
 *         schema:
 *           type: string
 *         description: Filter by workflow type
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', getAnalyticsDataController);

/**
 * @swagger
 * /api/v1/workflow-documents/{fileId}/versions:
 *   get:
 *     summary: List all versions of a workflow document file
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File versions retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/:fileId/versions', listFileVersionsController);

/**
 * @swagger
 * /api/v1/workflow-documents/{fileId}/versions/{versionId}/download:
 *   get:
 *     summary: Download a specific version of a workflow document file
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Version ID
 *     responses:
 *       200:
 *         description: File version downloaded successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/:fileId/versions/:versionId/download', downloadFileVersionController);

/**
 * @swagger
 * /api/v1/workflow-documents/custom:
 *   post:
 *     summary: Create a custom workflow document with optional file copy from Smart Drive
 *     tags: [Workflow Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workflowType
 *               - title
 *             properties:
 *               workflowType:
 *                 type: string
 *                 enum: [GENERAL_APPROVAL, BUDGET_REQUEST, POLICY_REVIEW, CUSTOM]
 *                 description: Type of custom workflow
 *                 example: GENERAL_APPROVAL
 *               title:
 *                 type: string
 *                 description: Workflow title
 *                 example: "Budget Approval Request"
 *               description:
 *                 type: string
 *                 description: Optional description
 *                 example: "Request for Q3 budget approval"
 *               reviewers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of reviewer roles
 *                 example: ["hr", "admin"]
 *               attachFile:
 *                 type: boolean
 *                 description: Whether to attach a file from Smart Drive
 *                 example: true
 *               sourceBucket:
 *                 type: string
 *                 description: Source bucket for file copy
 *                 example: "lms-private"
 *               sourcePath:
 *                 type: string
 *                 description: Source path for file copy
 *                 example: "user123/document.pdf"
 *               fileName:
 *                 type: string
 *                 description: Original file name
 *                 example: "document.pdf"
 *     responses:
 *       201:
 *         description: Custom workflow document created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/custom', createCustomWorkflowDocumentController);

export default router;
