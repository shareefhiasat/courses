/**
 * Workflow Controllers
 * 
 * PURPOSE: HTTP request handlers for workflow operations
 * ARCHITECTURE: HTTP Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  createDocument,
  getDocuments,
  getDocumentById,
  sendDocument,
  approveDocument,
  returnDocument,
  closeDocument,
  getInboxItems,
  markInboxItemAsRead,
  getPrivateWorkspace,
  getDatabaseUserId
} from '../services/workflowService.js';

// ==================== DOCUMENT CONTROLLERS ====================

/**
 * Create a new workflow document
 */
export const createWorkflowDocumentController = async (req, res) => {
  try {
    const { title, description, documentType, nextcloudFileId, nextcloudFilePath } = req.body;

    // Validate required fields
    if (!title || !documentType) {
      return res.status(400).json({
        success: false,
        error: 'Title and document type are required',
        timestamp: Date.now()
      });
    }

    const result = await createDocument({
      title,
      description,
      documentType,
      nextcloudFileId,
      nextcloudFilePath
    }, req.user);

    if (result.success) {
      return res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Get workflow documents with filtering and pagination
 */
export const getWorkflowDocumentsController = async (req, res) => {
  try {
    const {
      page,
      limit,
      search,
      documentType,
      currentStatus,
      currentOwnerId,
      currentAssigneeId,
      createdBy,
      sortBy,
      sortOrder
    } = req.query;

    let resolvedCurrentOwnerId = currentOwnerId;
    let resolvedCurrentAssigneeId = currentAssigneeId;
    let resolvedCreatedBy = createdBy;

    const requiresCurrentUser = [currentOwnerId, currentAssigneeId, createdBy]
      .some((value) => String(value || '').toLowerCase() === 'me');

    if (requiresCurrentUser) {
      const databaseUserId = await getDatabaseUserId(req.user);
      if (!databaseUserId) {
        return res.status(401).json({
          success: false,
          error: 'User not found in database',
          timestamp: Date.now()
        });
      }

      if (String(currentOwnerId || '').toLowerCase() === 'me') {
        resolvedCurrentOwnerId = String(databaseUserId);
      }

      if (String(currentAssigneeId || '').toLowerCase() === 'me') {
        resolvedCurrentAssigneeId = String(databaseUserId);
      }

      if (String(createdBy || '').toLowerCase() === 'me') {
        resolvedCreatedBy = String(databaseUserId);
      }
    }

    const result = await getDocuments({
      page,
      limit,
      search,
      documentType,
      currentStatus,
      currentOwnerId: resolvedCurrentOwnerId,
      currentAssigneeId: resolvedCurrentAssigneeId,
      createdBy: resolvedCreatedBy,
      sortBy,
      sortOrder
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        },
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Get workflow document by ID
 */
export const getWorkflowDocumentByIdController = async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        timestamp: Date.now()
      });
    }

    const result = await getDocumentById(documentId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        timestamp: Date.now()
      });
    } else {
      return res.status(404).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

// ==================== WORKFLOW TRANSITION CONTROLLERS ====================

/**
 * Send document to another user
 */
export const sendWorkflowDocumentController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { receiverId, comment } = req.body;

    if (!documentId || !receiverId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID and receiver ID are required',
        timestamp: Date.now()
      });
    }

    const result = await sendDocument(documentId, { receiverId, comment }, req.user);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Approve document
 */
export const approveWorkflowDocumentController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { comment } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        timestamp: Date.now()
      });
    }

    const result = await approveDocument(documentId, { comment }, req.user);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Return document with feedback
 */
export const returnWorkflowDocumentController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { comment } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        timestamp: Date.now()
      });
    }

    const result = await returnDocument(documentId, { comment }, req.user);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Close document
 */
export const closeWorkflowDocumentController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { comment } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required',
        timestamp: Date.now()
      });
    }

    const result = await closeDocument(documentId, { comment }, req.user);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

// ==================== INBOX CONTROLLERS ====================

/**
 * Get inbox items for the current user
 */
export const getWorkflowInboxController = async (req, res) => {
  try {
    const {
      page,
      limit,
      isRead,
      action,
      sortBy,
      sortOrder
    } = req.query;

    // Convert Keycloak user to database user ID
    const databaseUserId = await getDatabaseUserId(req.user);
    
    if (!databaseUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not found in database',
        timestamp: Date.now()
      });
    }

    const result = await getInboxItems({
      userId: databaseUserId,
      page,
      limit,
      isRead,
      action,
      sortBy,
      sortOrder
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        },
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

/**
 * Mark inbox item as read
 */
export const markWorkflowInboxItemAsReadController = async (req, res) => {
  try {
    const { inboxItemId } = req.params;

    if (!inboxItemId) {
      return res.status(400).json({
        success: false,
        error: 'Inbox item ID is required',
        timestamp: Date.now()
      });
    }

    const result = await markInboxItemAsRead(inboxItemId, req.user);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: 'Inbox item marked as read',
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

// ==================== PRIVATE WORKSPACE CONTROLLERS ====================

/**
 * Get or create private workspace for the current user
 */
export const getPrivateWorkspaceController = async (req, res) => {
  try {
    const { nextcloudFolderId, nextcloudFolderPath } = req.body;

    const result = await getPrivateWorkspace(req.user.id, {
      nextcloudFolderId,
      nextcloudFolderPath
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: 'Private workspace retrieved successfully',
        timestamp: Date.now()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        timestamp: Date.now()
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
};

export default {
  // Documents
  createWorkflowDocumentController,
  getWorkflowDocumentsController,
  getWorkflowDocumentByIdController,
  
  // Workflow transitions
  sendWorkflowDocumentController,
  approveWorkflowDocumentController,
  returnWorkflowDocumentController,
  closeWorkflowDocumentController,
  
  // Inbox
  getWorkflowInboxController,
  markWorkflowInboxItemAsReadController,
  
  // Private workspace
  getPrivateWorkspaceController
};
