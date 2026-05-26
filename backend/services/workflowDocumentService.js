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
  resubmitWorkflowDocument as resubmitWorkflowDocumentDB,
  getComplianceData as getComplianceDataDB,
  getAnalyticsData as getAnalyticsDataDB,
  deleteWorkflowDocument as deleteWorkflowDocumentDB
} from '../db/workflowDocuments-postgres.js';
import { putObject, deleteObject, BUCKETS, ensureBuckets, getObjectMetadata, listObjectVersions, streamObjectVersion, copyObject } from './minioService.js';
import { byRole } from './notifications/recipients.js';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get appropriate assignee based on workflow type
 * ATTENDANCE_WEEKLY → Admin user
 * Other types → HR user (or null for manual assignment)
 */
async function getAssigneeForWorkflowType(workflowType) {
  if (workflowType === 'ATTENDANCE_WEEKLY') {
    // Assign to Admin for weekly summaries
    const adminUsers = await byRole('admin');
    if (adminUsers.length > 0) {
      // Return first admin user (could be enhanced with round-robin or workload-based selection)
      return adminUsers[0].userId;
    }
  }
  // For other types, return null (will be assigned to HR role via notification)
  return null;
}

/**
 * Create a new workflow document with file upload
 */
export async function createWorkflowDocumentWithUpload(data) {
  try {
    const {
      workflowType,
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
      program,
      subject,
      createdBy,
      updatedBy
    } = data;

    // Determine assignee based on workflow type
    const assigneeId = currentAssigneeId || await getAssigneeForWorkflowType(workflowType);

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
    const metadata = await getObjectMetadata(BUCKETS.WORKFLOW, objectKey);
    const minioVersionId = metadata.versionId;

    // Create File record and WorkflowDocument in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create File record
      const file = await tx.file.create({
        data: {
          id: uuidv4(),
          s3Key: objectKey,
          bucket: BUCKETS.WORKFLOW,
          name: fileName,
          mimeType: fileType,
          size: fileSize,
          ownerId: submitterId,
          folderId: null,
          folderPath: null,
          currentVersionId: minioVersionId,
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
          workflowType,
          title,
          description,
          status: 'SUBMITTED',
          fileId: file.id,
          submitterId,
          currentAssigneeId: assigneeId,
          classId,
          instructorId,
          date: date ? new Date(date) : null,
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
          class: true
        }
      });

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
    
    return { success: false, error: error.message };
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
export async function updateStatus(id, status, actorId, reason) {
  return await updateWorkflowDocumentStatus(id, status, actorId, reason);
}

/**
 * Add comment to workflow document
 */
export async function addComment(data) {
  return await addWorkflowComment(data);
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
      return { success: false, error: 'Document not found' };
    }

    const document = existingDoc.data;

    // Validate that user is the submitter
    if (document.submitterId !== submitterId) {
      return { success: false, error: 'Only the submitter can resubmit this document' };
    }

    // Validate that document is rejected
    if (document.status !== 'REJECTED') {
      return { success: false, error: 'Only rejected documents can be resubmitted' };
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
        bucket: BUCKETS.WORKFLOW,
        name: fileName,
        mimeType: fileType,
        size: buffer.length,
        ownerId: submitterId,
        folderId: null,
        folderPath: null,
        currentVersionId: minioVersionId,
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
    return { success: false, error: error.message };
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
      return { success: false, error: 'Document not found' };
    }

    const document = existingDoc.data;

    // Validate that document is ATTENDANCE_WEEKLY
    if (document.workflowType !== 'ATTENDANCE_WEEKLY') {
      return { success: false, error: 'Only weekly summary documents can have signed uploads' };
    }

    // Validate that user is Admin
    const adminUsers = await byRole('admin');
    const isAdmin = adminUsers.some(u => u.userId === adminId);
    if (!isAdmin) {
      return { success: false, error: 'Only Admin users can upload signed documents' };
    }

    // Get HR users for reassignment
    const hrUsers = await byRole('hr');
    if (hrUsers.length === 0) {
      return { success: false, error: 'No HR users found for reassignment' };
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
        bucket: BUCKETS.WORKFLOW,
        name: fileName,
        mimeType: fileType,
        size: buffer.length,
        ownerId: adminId,
        folderId: null,
        folderPath: null,
        currentVersionId: minioVersionId,
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
        uploadedById: adminId,
        changeNote: comment || 'Signed document uploaded by Admin',
        minioVersionId: minioVersionId,
        isCurrent: true,
      }
    });

    // Update File with current version
    await prisma.file.update({
      where: { id: file.id },
      data: { currentVersionId: fileVersion.id }
    });

    // Update document with new file, reassign to HR, update status
    const updated = await prisma.workflowDocument.update({
      where: { id: documentId },
      data: {
        fileId: file.id,
        currentAssigneeId: hrUsers[0].userId, // Reassign to first HR user
        status: 'UNDER_FINAL_HR_REVIEW',
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
      toStatus: 'UNDER_FINAL_HR_REVIEW',
      actorId: adminId,
      reason: comment || 'Signed document uploaded by Admin, reassigned to HR for final review'
    });

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
    return { success: false, error: error.message };
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
      return { success: false, error: 'Document not found' };
    }

    const document = existingDoc.data;

    // Validate that user is the submitter
    if (document.submitterId !== submitterId) {
      return { success: false, error: 'Only the submitter can withdraw this document' };
    }

    // Validate that document is in SUBMITTED status
    if (document.status !== 'SUBMITTED') {
      return { success: false, error: 'Only submitted documents can be withdrawn' };
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

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error in withdrawWorkflowDocument:', error);
    return { success: false, error: error.message };
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
    // Get file record
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    if (!file) {
      return { success: false, error: 'File not found' };
    }

    // Get MinIO versions
    const minioVersions = await listObjectVersions(file.bucket, file.s3Key);

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
    return { success: false, error: error.message };
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
      return { success: false, error: 'File not found' };
    }

    // Get version record
    const version = await prisma.fileVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) {
      return { success: false, error: 'Version not found' };
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
    return { success: false, error: error.message };
  }
}

/**
 * Create a custom workflow document with optional file copy from Smart Drive
 */
export async function createCustomWorkflowDocument(data) {
  try {
    const {
      workflowType,
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
      fileId: originalFileId
    } = data;

    let filePath = null;
    let fileId = null;
    let fileVersionId = null;

    // Copy file from Smart Drive to workflow bucket if attachFile is true
    if (attachFile && sourceBucket && sourcePath && fileName) {
      await ensureBuckets();

      // Generate structured file name for workflow bucket
      const timestamp = Date.now();
      const fileExtension = fileName.split('.').pop();
      const objectKey = `custom/${workflowType}/${timestamp}_${fileName}`;

      // Copy file from source bucket to workflow bucket
      await copyObject(sourceBucket, sourcePath, BUCKETS.WORKFLOW, objectKey);

      // Get object metadata to capture version ID
      const metadata = await getObjectMetadata(BUCKETS.WORKFLOW, objectKey);
      const minioVersionId = metadata.versionId;

      // Create File record
      const file = await prisma.file.create({
        data: {
          id: uuidv4(),
          s3Key: objectKey,
          bucket: BUCKETS.WORKFLOW,
          name: fileName,
          mimeType: 'application/octet-stream', // Default MIME type for custom files
          size: metadata.size,
          minioVersionId,
          uploadedBy: submitterId,
          createdBy,
          updatedBy
        }
      });

      filePath = objectKey;
      fileId = file.id;
    } else if (originalFileId) {
      // If using original file ID from Smart Drive, capture the current version
      const currentVersion = await prisma.fileVersion.findFirst({
        where: {
          fileId: originalFileId,
          isCurrent: true
        }
      });
      if (currentVersion) {
        fileVersionId = currentVersion.id;
        console.log('[createCustomWorkflowDocument] Captured current file version:', fileVersionId);
      }
    }

    // Get assignee based on reviewers (first reviewer in list)
    let currentAssigneeId = null;
    if (reviewers && reviewers.length > 0) {
      // For now, assign to first reviewer (could be enhanced with role-based assignment)
      try {
        const reviewerUsers = await byRole(reviewers[0]);
        if (reviewerUsers.length > 0) {
          currentAssigneeId = reviewerUsers[0].userId;
        }
      } catch (error) {
        console.error('[createCustomWorkflowDocument] Error getting reviewer users:', error);
        // Continue without assignee if role lookup fails
      }
    }

    // Create WorkflowDocument with DRAFT status if no reviewers, SUBMITTED if reviewers provided
    const documentStatus = (reviewers && reviewers.length > 0) ? 'SUBMITTED' : 'DRAFT';
    
    const documentResult = await createWorkflowDocument({
      workflowType,
      title,
      description,
      status: documentStatus,
      submitterId,
      currentAssigneeId,
      fileId: originalFileId || fileId, // Use original file ID if provided, otherwise use copied file ID
      fileVersionId, // Store the specific version ID to preserve snapshot
      filePath,
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
      error: error.message
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
      return { success: false, error: 'Workflow document not found' };
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
    return { success: false, error: error.message };
  }
}

export default {
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
  createCustomWorkflowDocument,
  deleteWorkflowDocument
};
