/**
 * Collaboration Controller - Request/Response Layer
 * 
 * PURPOSE: Handle HTTP requests/responses for collaboration operations
 * ARCHITECTURE: Routes → Controllers → Services → Database
 */

import collaboraService from '../services/collaboraService.js';
import fileCommentService from '../services/fileCommentService.js';
import { logFileActivity } from '../services/fileActivityService.js';

/**
 * Get Collabora edit URL for a file
 * GET /api/v1/drive/files/:fileId/collabora/edit
 */
async function getCollaboraEditUrl(req, res) {
  try {
    const { fileId } = req.params;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    // Validate access
    const validateResult = await collaboraService.validateCollaboraAccess({
      filePath: decodedFileId,
      userId: currentUser.id,
      mode: 'edit'
    });

    if (!validateResult.success) {
      return res.status(403).json(validateResult);
    }

    // Generate edit URL
    const result = await collaboraService.generateCollaboraEditUrl({
      filePath: fileId,
      userId: currentUser.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[collaboration] Get Collabora edit URL error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Get Collabora view URL for a file (read-only)
 * GET /api/v1/drive/files/:fileId/collabora/view
 */
async function getCollaboraViewUrl(req, res) {
  try {
    const { fileId } = req.params;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    // Validate access
    const validateResult = await collaboraService.validateCollaboraAccess({
      filePath: decodedFileId,
      userId: currentUser.id,
      mode: 'view'
    });

    if (!validateResult.success) {
      return res.status(403).json(validateResult);
    }

    // Generate view URL
    const result = await collaboraService.generateCollaboraViewUrl({
      filePath: decodedFileId,
      userId: currentUser.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[collaboration] Get Collabora view URL error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Add comment to file
 * POST /api/v1/drive/files/:fileId/comments
 */
async function addFileComment(req, res) {
  try {
    const { fileId } = req.params;
    const { comment } = req.body;
    const currentUser = req.user;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'comment is required',
        timestamp: Date.now()
      });
    }

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await fileCommentService.addFileComment({
      fileId: decodedFileId,
      userId: currentUser.id,
      comment
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log activity
    await logFileActivity({
      fileId: decodedFileId,
      userId: currentUser.id,
      action: 'comment',
      metadata: { commentLength: comment.length }
    });

    return res.json(result);
  } catch (error) {
    console.error('[collaboration] Add file comment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Get file comments
 * GET /api/v1/drive/files/:fileId/comments
 */
async function getFileComments(req, res) {
  try {
    const { fileId } = req.params;
    const currentUser = req.user;

    // Decode URL-encoded fileId
    const decodedFileId = decodeURIComponent(fileId);

    const result = await fileCommentService.getFileComments({
      fileId: decodedFileId,
      userId: currentUser.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[collaboration] Get file comments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Delete file comment
 * DELETE /api/v1/drive/comments/:commentId
 */
async function deleteFileComment(req, res) {
  try {
    const { commentId } = req.params;
    const currentUser = req.user;

    const result = await fileCommentService.deleteFileComment({
      commentId: parseInt(commentId),
      userId: currentUser.id
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[collaboration] Delete file comment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

/**
 * Handle Collabora webhook
 * POST /api/v1/drive/collabora/webhook
 */
async function handleCollaboraWebhook(req, res) {
  try {
    const webhookData = req.body;

    const result = await collaboraService.handleCollaboraWebhook(webhookData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('[collaboration] Handle Collabora webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

export {
  getCollaboraEditUrl,
  getCollaboraViewUrl,
  addFileComment,
  getFileComments,
  deleteFileComment,
  handleCollaboraWebhook
};
