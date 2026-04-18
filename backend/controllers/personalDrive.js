/**
 * Personal Drive Controllers
 *
 * PURPOSE: HTTP request handlers for personal file management operations
 * ARCHITECTURE: HTTP Routes → Controllers → MinIO Service → MinIO API
 */

import * as fileService from '../services/fileService.js';

/**
 * Upload file to user's personal drive or shared space
 */
export const uploadFileController = async (req, res) => {
  try {
    const { folder = 'Uploads', spaceType = 'private' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        timestamp: Date.now()
      });
    }

    // Check permissions for shared space
    if (spaceType === 'shared') {
      if (!req.user.roles.includes('admin') && !req.user.roles.includes('hr') && !req.user.roles.includes('instructor')) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions for shared space',
          timestamp: Date.now()
        });
      }
    }

    let bucket;
    let folderPath;

    if (spaceType === 'shared') {
      bucket = 'lms-shared';
      folderPath = folder;
    } else {
      bucket = 'lms-private';
      folderPath = `users/${req.user.id}/personal/${folder}`;
    }

    // Initiate upload
    const initiateResult = await fileService.initiateUpload({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      bucket,
      folderPath
    });

    if (initiateResult.success) {
      return res.status(200).json({
        success: true,
        data: {
          fileId: initiateResult.payload.fileId,
          presignedUrl: initiateResult.payload.presignedUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          spaceType
        },
        message: 'Upload initiated successfully',
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: initiateResult.error || 'Failed to initiate upload',
        timestamp: Date.now()
      });
    }

  } catch (err) {
    console.error('[personalDrive] Upload error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * List files in user's personal drive or shared space
 */
export const listFilesController = async (req, res) => {
  try {
    const { folder = '', spaceType = 'private' } = req.query;

    let bucket;
    let folderPath;

    if (spaceType === 'shared') {
      bucket = 'lms-shared';
      folderPath = folder;
    } else {
      bucket = 'lms-private';
      folderPath = `users/${req.user.id}/personal/${folder}`;
    }

    const result = await fileService.listFiles({ bucket, folderPath });

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          files: result.payload || [],
          folderPath,
          spaceType
        },
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to list files',
        timestamp: Date.now()
      });
    }

  } catch (err) {
    console.error('[personalDrive] List error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Delete file from personal drive
 */
export const deleteFileController = async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required',
        timestamp: Date.now()
      });
    }

    const result = await fileService.deleteFile(fileId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to delete file',
        timestamp: Date.now()
      });
    }

  } catch (err) {
    console.error('[personalDrive] Delete error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Share file with other users
 */
export const shareFileController = async (req, res) => {
  try {
    const { fileId, sharedWithId, permission = 'VIEW', expiresAt } = req.body;

    if (!fileId || !sharedWithId) {
      return res.status(400).json({
        success: false,
        error: 'File ID and user ID are required',
        timestamp: Date.now()
      });
    }

    const result = await fileService.shareFile(fileId, sharedWithId, permission, expiresAt);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.payload,
        message: 'File shared successfully',
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to share file',
        timestamp: Date.now()
      });
    }

  } catch (err) {
    console.error('[personalDrive] Share error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Add comment to file
 */
export const addCommentController = async (req, res) => {
  try {
    const { fileId, comment } = req.body;

    if (!fileId || !comment) {
      return res.status(400).json({
        success: false,
        error: 'File ID and comment are required',
        timestamp: Date.now()
      });
    }

    const result = await fileService.addComment(fileId, comment, req.user.id);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.payload,
        message: 'Comment added successfully',
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to add comment',
        timestamp: Date.now()
      });
    }

  } catch (err) {
    console.error('[personalDrive] Comment error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Download file from personal drive
 */
export const downloadFileController = async (req, res) => {
  try {
    const { fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required',
        timestamp: Date.now()
      });
    }

    const result = await fileService.getFile(fileId);

    if (result.success) {
      // Return presigned URL for download
      return res.status(200).json({
        success: true,
        data: {
          fileId: result.payload.id,
          fileName: result.payload.name,
          downloadUrl: result.payload.downloadUrl,
          mimeType: result.payload.mimeType,
          size: result.payload.size
        },
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to get file',
        timestamp: Date.now()
      });
    }

  } catch (err) {
    console.error('[personalDrive] Download error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

export default {
  uploadFileController,
  listFilesController,
  deleteFileController,
  shareFileController,
  addCommentController,
  downloadFileController
};
