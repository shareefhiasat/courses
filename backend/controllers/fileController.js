import * as fileService from '../services/fileService.js';
import * as fileVersionService from '../services/fileVersionService.js';
import * as fileShareService from '../services/fileShareService.js';
import { addFileComment, getFileComments, deleteFileComment } from '../services/fileCommentService.js';
import { generatePresignedGetUrl } from '../services/minioService.js';
import { getBucketSize } from '../services/minioService.js';

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

    res.json(result);
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
    const { fileId } = req.params;

    const result = await fileService.getFileById(fileId, userId);

    if (!result.success) {
      return res.status(result.error.code === 'FILE_NOT_FOUND' ? 404 : 403).json(result);
    }

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
    const { fileId } = req.params;

    const result = await fileVersionService.getFileVersions(fileId, userId);

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

    const result = await fileShareService.unshareFile(shareId, userId);

    if (!result.success) {
      return res.status(403).json(result);
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
    const { fileId } = req.params;
    const { comment, content } = req.body;

    console.log('💬 [ADD COMMENT]', { userId, fileId, comment: comment || content });

    const result = await addFileComment({ fileId, userId, comment: comment || content });

    if (!result.success) {
      console.error('❌ [ADD COMMENT] Failed:', result.error);
      return res.status(400).json(result);
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
      : 500 * 1024 * 1024; // Default 500 MB

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
    const { fileId } = req.params;

    const result = await fileService.softDeleteFile(fileId, userId);

    if (!result.success) {
      return res.status(403).json(result);
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
    const result = await fileService.getPreviewUrl(fileId, actorUserId);
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
    console.log('[fileController.proxyDownload] Request received:', { fileId, actorUserId });
    // Permission check happens inside a later PR via permissionService; for
    // now we rely on the service's ownership/share check.
    await fileService.streamFile({ fileId, req, res, actorUserId });
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

