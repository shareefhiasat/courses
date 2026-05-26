/**
 * Version Controller - Request/Response Layer
 * 
 * PURPOSE: Handle HTTP requests/responses for file version/revision operations
 * ARCHITECTURE: Routes → Controllers → Services → Database
 */

import fileVersionService from '../services/fileVersionService.js';
import fileActivityService from '../services/fileActivityService.js';

/**
 * Get file versions
 * GET /api/v1/drive/files/:fileId/versions
 */
async function getFileVersions(req, res) {
  try {
    const { fileId } = req.params;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await fileVersionService.getFileVersions({
      fileId: decodedFileId,
      userId: currentUser.dbId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[version] Get file versions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Restore file version
 * POST /api/v1/drive/files/:fileId/versions/:versionId/restore
 */
async function restoreFileVersion(req, res) {
  try {
    const { fileId, versionId } = req.params;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await fileVersionService.restoreFileVersion({
      fileId: decodedFileId,
      versionId,
      userId: currentUser.dbId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log activity
    await fileActivityService.logFileActivity({
      fileId: decodedFileId,
      userId: currentUser.dbId,
      action: 'restore',
      metadata: { versionId }
    });

    return res.json(result);
  } catch (error) {
    console.error('[version] Restore file version error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Enable file versioning
 * POST /api/v1/drive/files/:fileId/enable-versioning
 */
async function enableFileVersioning(req, res) {
  try {
    const { fileId } = req.params;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await fileVersionService.enableFileVersioning({
      filePath: decodedFileId,
      userId: currentUser.dbId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[version] Enable file versioning error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Get file activities
 * GET /api/v1/drive/files/:fileId/activities
 */
async function getFileActivities(req, res) {
  try {
    const { fileId } = req.params;
    const { limit } = req.query;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await fileActivityService.getFileActivities({
      fileId: decodedFileId,
      userId: currentUser.dbId,
      limit: limit ? parseInt(limit) : 50
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[version] Get file activities error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Get file activity statistics
 * GET /api/v1/drive/files/:fileId/activity-stats
 */
async function getFileActivityStats(req, res) {
  try {
    const { fileId } = req.params;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await fileActivityService.getFileActivityStats({
      fileId: decodedFileId,
      userId: currentUser.dbId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[version] Get file activity stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

export {
  getFileVersions,
  restoreFileVersion,
  enableFileVersioning,
  getFileActivities,
  getFileActivityStats
};
