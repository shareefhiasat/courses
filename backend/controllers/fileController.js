import * as fileService from '../services/fileService.js';
import * as fileVersionService from '../services/fileVersionService.js';
import * as fileShareService from '../services/fileShareService.js';
import { addFileComment, getFileComments, deleteFileComment } from '../services/fileCommentService.js';
import { PrismaClient } from '@prisma/client';
import { generatePresignedGetUrl, generatePresignedPutUrl, getBucketSize } from '../services/minioService.js';
import { DEFAULT_STORAGE_LIMIT } from '../constants/driveConstants.js';
import notificationGateway from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';

const prisma = new PrismaClient();

export const downloadFile = async (req, res) => {
  try {
    const { s3Key } = req.params;
    console.log('[fileController] downloadFile called with s3Key:', s3Key);

    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: 'Missing s3Key parameter',
      });
    }

    // Extract bucket from s3Key (format: bucket/userId/fileId/name)
    const parts = s3Key.split('/');
    const bucket = parts[0];
    console.log('[fileController] Extracted bucket:', bucket);

    // Generate presigned URL for download
    const presignedUrl = await generatePresignedGetUrl(bucket, s3Key);
    console.log('[fileController] Generated presigned URL');

    // Redirect to the presigned URL
    return res.redirect(presignedUrl);
  } catch (error) {
    console.error('[fileController] Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate download URL',
    });
  }
};

export const initiateUpload = async (req, res) => {
  try {
    const { name, mimeType, size, bucket, folderId, folderPath, workflowStatus } = req.body;

    console.log('📤 [UPLOAD INITIATE]', { userId: req.user?.dbId, name, mimeType, size, bucket, folderId, folderPath });

    if (!name || !mimeType || !size) {
      console.error('❌ [UPLOAD INITIATE] Missing required fields:', { name, mimeType, size, bucket });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, mimeType, size',
      });
    }

    const result = await fileService.initiateUpload(req.user, {
      name,
      mimeType,
      size,
      bucket: bucket || 'PRIVATE',
      folderId: folderId || null,
      folderPath,
      workflowStatus,
    });

    if (!result.success) {
      console.error('❌ [UPLOAD INITIATE] Service failed:', result.error);
      return res.status(400).json(result);
    }

    console.log('✅ [UPLOAD INITIATE] Success:', result.payload?.fileId);
    res.json(result);
  } catch (error) {
    console.error('[fileController] Initiate upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to initiate upload',
    });
  }
};

export const completeUpload = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { versionId, checksum } = req.body || {};

    if (!versionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing versionId in body (returned by /upload/initiate)',
      });
    }

    const result = await fileService.completeUpload(fileId, versionId, { checksum });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Check if this is a new version (versionNumber > 1)
    const isNewVersion = result.payload?.version?.versionNumber > 1;

    // Emit notification for file upload if uploaded to shared folder
    if (result.success && result.payload) {
      try {
        const file = await prisma.file.findUnique({
          where: { id: fileId },
          include: {
            user: { select: { displayName: true, firstName: true, lastName: true } }
          }
        });

        if (file && file.folderId) {
          // Get all users who have access to this folder
          const folderShares = await prisma.folderShare.findMany({
            where: { folderId: file.folderId },
            select: { sharedWithId: true }
          });

          const recipientIds = folderShares.map(s => s.sharedWithId).filter(id => id !== req.user?.dbId);

          if (recipientIds.length > 0) {
            await notificationGateway.emit(
              EVENTS.DRIVE_FILE_UPLOADED,
              {
                fileName: file.name,
                folderName: file.folderId ? (await prisma.folder.findUnique({ where: { id: file.folderId } }))?.name : 'root',
                uploadedBy: file.user?.displayName || `${file.user?.firstName} ${file.user?.lastName}`
              },
              req.user,
              { userIds: recipientIds }
            );
          }
        }
      } catch (notifError) {
        console.error('[fileController] Failed to emit file upload notification:', notifError);
      }
    }

    // Include version information in response
    res.json({
      ...result,
      isNewVersion,
      versionNumber: result.payload?.version?.versionNumber,
      versionId: result.payload?.version?.id,
    });
  } catch (error) {
    console.error('[fileController] Complete upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to complete upload',
    });
  }
};

export const getFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const roles = req.user?.roles || [];
    const { fileId } = req.params;

    const result = await fileService.getFileById(fileId, userId, roles);

    if (!result.success) {
      return res.status(result.error.code === 'FILE_NOT_FOUND' ? 404 : 403).json(result);
    }

    // Add delete permission check to response
    const deleteCheck = await fileService.canDeleteFile(fileId, userId, roles);
    result.payload.canDelete = deleteCheck.canDelete;
    result.payload.deleteReason = deleteCheck.reason;

    res.json(result);
  } catch (error) {
    console.error('[fileController] Get file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve file',
    });
  }
};

export const listFiles = async (req, res) => {
  try {
    const {
      bucket,
      folderPath,
      folderId,
      search,
      mimeTypePrefix,
      modifiedAfter,
      sortField = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      pageSize = 50,
      includeDeleted = false,
      deletedOnly = false,
      starredOnly = false,
      rootOnly = false,
      ownedOnly = false,
      sharedOnly = false,
      hasWorkflow = false,
    } = req.query;

    const result = await fileService.listFiles(req.user, {
      bucket,
      folderPath,
      folderId: folderId || undefined,
      search,
      mimeTypePrefix,
      modifiedAfter: modifiedAfter ? new Date(modifiedAfter) : undefined,
      sortField,
      sortOrder,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      includeDeleted: includeDeleted === 'true',
      deletedOnly: deletedOnly === 'true',
      starredOnly: starredOnly === 'true',
      rootOnly: rootOnly === 'true',
      ownedOnly: ownedOnly === 'true',
      sharedOnly: sharedOnly === 'true',
      hasWorkflow: hasWorkflow === 'true',
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] List files error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to list files',
    });
  }
};

export const updateFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId } = req.params;
    const updates = req.body;

    const result = await fileService.updateFile(fileId, userId, updates);

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Update file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update file',
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId } = req.params;

    const result = await fileService.deleteFile(fileId, userId);

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Delete file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete file',
    });
  }
};

export const generatePublicLink = async (req, res) => {
  try {
    const keycloakId = req.user?.id; // This is the Keycloak UUID (sub)
    const { fileId } = req.params;
    const { expiryDays } = req.body;

    console.log('[fileController] generatePublicLink called with:', { keycloakId, fileId, expiryDays });

    const result = await fileService.generatePublicLink(fileId, keycloakId, expiryDays);

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Generate public link error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate public link',
    });
  }
};

export const uploadNewVersion = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId } = req.params;
    const { name, mimeType, size, changeNote } = req.body;

    const result = await fileVersionService.uploadNewVersion(fileId, userId, {
      name,
      mimeType,
      size,
      changeNote,
    });

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Upload new version error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to upload new version',
    });
  }
};

export const getVersions = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const roles = req.user?.roles || [];
    const { fileId } = req.params;

    const result = await fileVersionService.getFileVersions(fileId, userId, roles);

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Get versions error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get file versions',
    });
  }
};

export const restoreVersion = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { versionId } = req.params;

    const result = await fileVersionService.restoreVersion(versionId, userId);

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Restore version error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to restore version',
    });
  }
};

export const shareFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId } = req.params;
    const { sharedWithId, permission, expiresAt } = req.body;

    const result = await fileShareService.shareFile(fileId, userId, {
      sharedWithId,
      permission,
      expiresAt,
    });

    if (!result.success) {
      return res.status(403).json(result);
    }

    // Emit notification for file share
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          user: { select: { displayName: true, firstName: true, lastName: true } }
        }
      });

      if (file) {
        await notificationGateway.emit(
          EVENTS.DRIVE_FILE_SHARED,
          {
            fileName: file.name,
            sharedBy: file.user?.displayName || `${file.user?.firstName} ${file.user?.lastName}`
          },
          req.user,
          { userId: sharedWithId }
        );
      }
    } catch (notifError) {
      console.error('[fileController] Failed to emit file share notification:', notifError);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Share file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to share file',
    });
  }
};

export const unshareFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { shareId } = req.params;

    // Get share details before revoking
    const existingShare = await prisma.fileShare.findUnique({
      where: { id: shareId },
      include: {
        file: {
          include: {
            user: { select: { displayName: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    const result = await fileShareService.unshareFile(shareId, userId);

    if (!result.success) {
      return res.status(403).json(result);
    }

    // Emit notification for permission revocation
    if (existingShare) {
      try {
        await notificationGateway.emit(
          EVENTS.DRIVE_PERMISSION_REVOKED,
          {
            itemName: existingShare.file.name,
            revokedBy: existingShare.file.user?.displayName || `${existingShare.file.user?.firstName} ${existingShare.file.user?.lastName}`
          },
          req.user,
          { userId: existingShare.sharedWithId }
        );
      } catch (notifError) {
        console.error('[fileController] Failed to emit permission revocation notification:', notifError);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Unshare file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to unshare file',
    });
  }
};

export const getSharedFiles = async (req, res) => {
  try {
    const userId = req.user?.dbId;

    const result = await fileShareService.getSharedFiles(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Get shared files error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get shared files',
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const roles = req.user?.roles || [];
    const { fileId } = req.params;
    const { comment, content } = req.body;

    console.log('💬 [ADD COMMENT]', { userId, fileId, comment: comment || content });

    // Check COMMENT permission before allowing comment
    const { requireFilePermission } = await import('../services/permissionService.js');
    await requireFilePermission(fileId, { userId, roles }, 'COMMENT');

    const result = await addFileComment({ fileId, userId, comment: comment || content });

    if (!result.success) {
      console.error('❌ [ADD COMMENT] Failed:', result.error);
      return res.status(400).json(result);
    }

    // Emit notification for comment added
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: {
          user: { select: { displayName: true, firstName: true, lastName: true } }
        }
      });

      // Get all users who have access to this file (owner + shared users)
      const shares = await prisma.fileShare.findMany({
        where: { fileId },
        select: { sharedWithId: true }
      });

      const recipientIds = [file.userId, ...shares.map(s => s.sharedWithId)].filter(id => id !== userId);

      if (file && recipientIds.length > 0) {
        const commentText = comment || content;
        await notificationGateway.emit(
          EVENTS.DRIVE_COMMENT_ADDED,
          {
            fileName: file.name,
            commenter: file.user?.displayName || `${file.user?.firstName} ${file.user?.lastName}`,
            commentText: commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText
          },
          req.user,
          { userIds: recipientIds }
        );
      }
    } catch (notifError) {
      console.error('[fileController] Failed to emit comment notification:', notifError);
    }

    console.log('✅ [ADD COMMENT] Success:', result.payload?.id);
    res.json(result);
  } catch (error) {
    console.error('[fileController] Add comment error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to add comment',
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId } = req.params;

    const result = await getFileComments({ fileId, userId });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Get comments error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get comments',
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId, commentId } = req.params;

    console.log('🗑️ [DELETE COMMENT]', { userId, fileId, commentId, commentIdType: typeof commentId });

    // commentId is a UUID string, not a number
    const result = await deleteFileComment({ commentId, userId });

    if (!result.success) {
      console.error('❌ [DELETE COMMENT] Failed:', result.error);
      return res.status(400).json(result);
    }

    console.log('✅ [DELETE COMMENT] Success:', commentId);
    res.json(result);
  } catch (error) {
    console.error('[fileController] Delete comment error:', error);
    console.error('[fileController] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete comment',
    });
  }
};

export const getStorageUsage = async (req, res) => {
  try {
    console.log('[fileController] getStorageUsage called');
    
    const buckets = ['lms-private', 'lms-shared', 'lms-workflow'];
    let totalUsage = 0;
    const bucketUsages = {};

    for (const bucket of buckets) {
      try {
        const bucketSize = await getBucketSize(bucket);
        bucketUsages[bucket] = bucketSize;
        totalUsage += bucketSize;
        console.log(`[fileController] Bucket ${bucket} size:`, bucketSize);
      } catch (error) {
        console.error(`[fileController] Error getting size for bucket ${bucket}:`, error);
        bucketUsages[bucket] = 0;
      }
    }

    const storageLimit = process.env.STORAGE_LIMIT_MB 
      ? parseInt(process.env.STORAGE_LIMIT_MB) * 1024 * 1024 
      : DEFAULT_STORAGE_LIMIT;

    res.json({
      success: true,
      payload: {
        totalUsage,
        storageLimit,
        bucketUsages,
        usagePercentage: (totalUsage / storageLimit) * 100
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[fileController] Get storage usage error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get storage usage',
    });
  }
};

export const toggleStarFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId } = req.params;

    const result = await fileService.toggleStarFile(fileId, userId);

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Toggle star file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to toggle star status',
    });
  }
};

export const softDeleteFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const roles = req.user?.roles || [];
    const { fileId } = req.params;

    // Get file details before deletion
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        owner: { select: { displayName: true, firstName: true, lastName: true } }
      }
    });

    const result = await fileService.softDeleteFile(fileId, userId, roles);

    if (!result.success) {
      return res.status(403).json(result);
    }

    // Emit notification for file deletion
    if (file) {
      try {
        // Get all users who have access to this file (owner + shared users)
        const shares = await prisma.fileShare.findMany({
          where: { fileId },
          select: { sharedWithId: true }
        });

        const recipientIds = [file.ownerId, ...shares.map(s => s.sharedWithId)].filter(id => id !== userId);

        if (recipientIds.length > 0) {
          await notificationGateway.emit(
            EVENTS.DRIVE_FILE_DELETED,
            {
              fileName: file.name,
              deletedBy: file.owner?.displayName || `${file.owner?.firstName} ${file.owner?.lastName}`
            },
            req.user,
            { userIds: recipientIds }
          );
        }
      } catch (notifError) {
        console.error('[fileController] Failed to emit file deletion notification:', notifError);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Soft delete file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete file',
    });
  }
};

export const restoreFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId } = req.params;

    const result = await fileService.restoreFile(fileId, userId);

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Restore file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to restore file',
    });
  }
};

export const permanentDeleteFile = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { fileId } = req.params;

    const result = await fileService.permanentDeleteFile(fileId, userId);

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Permanent delete file error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to permanently delete file',
    });
  }
};

/**
 * Inline preview URL (images/pdf) or a flag telling the client to use /download.
 */
export const getPreview = async (req, res) => {
  try {
    const actorUserId = req.user?.dbId;
    const { fileId } = req.params;
    const { versionId } = req.query;
    const result = await fileService.getPreviewUrl(fileId, actorUserId, versionId);
    if (!result.success) {
      const status = result.error?.code === 'FILE_NOT_FOUND' ? 404 : 403;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (error) {
    console.error('[fileController.getPreview]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Secure proxy download — streams the object from MinIO through the API so
 * presigned URLs are never exposed for sensitive files.
 */
export const proxyDownload = async (req, res) => {
  try {
    const actorUserId = req.user?.dbId;
    const { fileId } = req.params;
    const { versionId } = req.query;
    console.log('[fileController.proxyDownload] Request received:', { fileId, actorUserId, versionId });
    // Permission check happens inside a later PR via permissionService; for
    // now we rely on the service's ownership/share check.
    await fileService.streamFile({ fileId, req, res, actorUserId, versionId });
  } catch (error) {
    console.error('[fileController.proxyDownload]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

export const createFolder = async (req, res) => {
  try {
    const userId = req.user?.dbId;
    const { name, parentId, isPrivate } = req.body || {};

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name',
      });
    }

    const result = await fileService.createFolder(userId, { name, parentId, isPrivate });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[fileController] Create folder error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create folder',
    });
  }
};

