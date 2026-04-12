/**
 * Personal Drive Controllers
 * 
 * PURPOSE: HTTP request handlers for personal file management operations
 * ARCHITECTURE: HTTP Routes → Controllers → Nextcloud Service → Nextcloud WebDAV API
 */

import {
  ensureFolder,
  uploadFile,
  listFolder,
  deleteNode,
  createShare,
  addComment
} from '../services/nextcloudService.js';

/**
 * Upload file to user's personal drive
 */
export const uploadFileController = async (req, res) => {
  try {
    const { folder = 'Uploads' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        timestamp: Date.now()
      });
    }
    
    // Get user's personal folder path
    const userFolder = `users/${req.user.id}/personal/${folder}`;
    
    // Ensure folder exists
    const folderResult = await ensureFolder(userFolder);
    if (!folderResult.success) {
      return res.status(400).json({
        success: false,
        error: folderResult.error?.message || folderResult.error || 'Failed to prepare upload folder',
        details: folderResult.error?.code || 'NEXTCLOUD_ENSURE_FOLDER_FAILED',
        timestamp: Date.now()
      });
    }
    
    // Upload file
    const filePath = `${userFolder}/${file.originalname}`;
    const uploadResult = await uploadFile(filePath, file.buffer);

    if (uploadResult.success) {
      return res.status(200).json({
        success: true,
        data: {
          fileId: uploadResult.payload?.fileId,
          filePath: filePath,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          url: uploadResult.payload?.url
        },
        message: 'File uploaded successfully',
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: uploadResult.error?.message || uploadResult.error || 'Failed to upload file',
        details: uploadResult.error?.code || 'NEXTCLOUD_UPLOAD_FAILED',
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
 * List files in user's personal drive
 */
export const listFilesController = async (req, res) => {
  try {
    const { folder = '' } = req.query;
    
    // Get user's personal folder path
    const userFolder = `users/${req.user.id}/personal/${folder}`;
    
    const result = await listFolder(userFolder);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          files: result.data?.files || [],
          path: userFolder
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
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required',
        timestamp: Date.now()
      });
    }

    // Ensure user can only delete their own files
    const userFolder = `users/${req.user.id}/personal/`;
    if (!filePath.startsWith(userFolder)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: Date.now()
      });
    }

    const result = await deleteNode(filePath);

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
    const { filePath, userIds, permissions = 'read', expiration } = req.body;

    if (!filePath || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'File path and user IDs are required',
        timestamp: Date.now()
      });
    }

    // Ensure user can only share their own files
    const userFolder = `users/${req.user.id}/personal/`;
    if (!filePath.startsWith(userFolder)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: Date.now()
      });
    }

    const shares = [];
    for (const userId of userIds) {
      const shareResult = await createShare({
        path: filePath,
        shareType: 0, // User share
        shareWith: userId,
        permissions: permissions === 'write' ? 15 : 1,
        expireDate: expiration
      });
      
      if (shareResult.success) {
        shares.push(shareResult.data);
      }
    }

    return res.status(200).json({
      success: true,
      data: { shares },
      message: 'File shared successfully',
      timestamp: Date.now()
    });

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
    const { filePath, comment } = req.body;

    if (!filePath || !comment) {
      return res.status(400).json({
        success: false,
        error: 'File path and comment are required',
        timestamp: Date.now()
      });
    }

    const result = await addComment({
      objectType: 'files',
      objectId: filePath,
      message: comment,
      actorId: req.user.id,
      actorDisplayName: req.user.displayName || req.user.email
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
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
    const { filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required',
        timestamp: Date.now()
      });
    }

    // Ensure user can only download their own files or shared files
    const userFolder = `users/${req.user.id}/personal/`;
    if (!filePath.startsWith(userFolder)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        timestamp: Date.now()
      });
    }

    // In a real implementation, you would stream the file from Nextcloud
    // For now, return a placeholder response
    return res.status(501).json({
      success: false,
      error: 'Download functionality requires Nextcloud WebDAV streaming implementation',
      timestamp: Date.now()
    });

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
