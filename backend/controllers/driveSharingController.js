/**
 * Drive Sharing Controller - Request/Response Layer
 * 
 * PURPOSE: Handle HTTP requests/responses for file sharing operations
 * ARCHITECTURE: Routes → Controllers → Services → Database
 */

import driveSharingService from '../services/driveSharingService.js';

/**
 * Share file with specific user
 * POST /api/v1/drive/files/:fileId/share
 */
async function shareFileWithUser(req, res) {
  try {
    const { fileId } = req.params;
    const { targetUserId, permissions = 1, expiresAt } = req.body;
    const currentUser = req.user;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'targetUserId is required',
        timestamp: Date.now()
      });
    }

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await driveSharingService.shareFileWithUser({
      fileId: decodedFileId,
      targetUserId: parseInt(targetUserId),
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sharedById: currentUser.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[driveSharing] Share file error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Get shares for a file
 * GET /api/v1/drive/files/:fileId/shares
 */
async function getFileShares(req, res) {
  try {
    const { fileId } = req.params;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await driveSharingService.getFileShares({
      fileId: decodedFileId,
      userId: currentUser.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[driveSharing] Get file shares error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Update share permission
 * PUT /api/v1/drive/shares/:shareId
 */
async function updateSharePermission(req, res) {
  try {
    const { shareId } = req.params;
    const { permissions } = req.body;
    const currentUser = req.user;

    if (!permissions) {
      return res.status(400).json({
        success: false,
        error: 'permissions is required',
        timestamp: Date.now()
      });
    }

    const result = await driveSharingService.updateSharePermission({
      shareId: parseInt(shareId),
      permissions,
      userId: currentUser.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[driveSharing] Update share permission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Delete share
 * DELETE /api/v1/drive/shares/:shareId
 */
async function deleteShare(req, res) {
  try {
    const { shareId } = req.params;
    const currentUser = req.user;

    const result = await driveSharingService.deleteShare({
      shareId: parseInt(shareId),
      userId: currentUser.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[driveSharing] Delete share error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

export {
  shareFileWithUser,
  getFileShares,
  updateSharePermission,
  deleteShare
};
