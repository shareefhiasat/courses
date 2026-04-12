/**
 * Workflow Business Service
 * 
 * PURPOSE: Business logic layer for workflow operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import {
  createWorkflowDocument,
  getWorkflowDocuments,
  getWorkflowDocumentById,
  updateWorkflowDocument,
  createWorkflowAction,
  getWorkflowInboxItems,
  markWorkflowInboxItemAsRead,
  getOrCreatePrivateWorkspaceLink
} from '../db/workflow-postgres.js';

// Re-export database utility functions
import { getDatabaseUserId } from '../db/workflow-postgres.js';
import { ensureUser, ensureFolder, moveNode, createShare, addComment } from './nextcloudService.js';

// Export utility functions
export { getDatabaseUserId };

const prisma = new PrismaClient();

// ==================== DOCUMENT OPERATIONS ====================

/**
 * Create a new workflow document and optionally create Nextcloud folder
 * 
 * @param {Object} documentData - Document data
 * @param {Object} user - User creating the document
 * @returns {Promise<Object>} - Result object
 */
export const createDocument = async (documentData, user) => {
  try {
    // Get database user ID
    const userId = await getDatabaseUserId(user);
    if (!userId) {
      return {
        success: false,
        error: 'User not found in database',
        data: null
      };
    }

    // Add database user IDs to document data
    const docDataWithUsers = {
      ...documentData,
      currentOwnerId: userId,
      currentAssigneeId: userId
    };

    // Create the workflow document in database
    const result = await createWorkflowDocument(docDataWithUsers, user);
    
    if (!result.success) {
      return result;
    }
    
    const document = result.data;
    
    // If Nextcloud integration is enabled, create folder structure
    if (process.env.NEXTCLOUD_BASE_URL) {
      try {
        // Create folder structure based on document type
        const folderPath = `Workflows/${documentData.documentType}/${document.id}`;
        await ensureFolder(folderPath);
        
        // Update document with Nextcloud path
        await updateWorkflowDocument(document.id, {
          nextcloudFilePath: folderPath
        }, user);
      } catch (nextcloudError) {
        // Don't fail the whole operation if Nextcloud fails
      }
    }
    
    return {
      success: true,
      data: document,
      message: 'Workflow document created successfully'
    };
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to create workflow document',
      data: null
    };
  }
};

/**
 * Get workflow documents with filtering
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object
 */
export const getDocuments = async (params = {}) => {
  try {
    const result = await getWorkflowDocuments(params);
    return result;
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to retrieve workflow documents',
      data: []
    };
  }
};

/**
 * Get workflow document by ID with full details
 * 
 * @param {number|string} documentId - Document ID
 * @returns {Promise<Object>} - Result object
 */
export const getDocumentById = async (documentId) => {
  try {
    const result = await getWorkflowDocumentById(documentId);
    return result;
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to retrieve workflow document',
      data: null
    };
  }
};

// ==================== WORKFLOW TRANSITIONS ====================

/**
 * Send document to another user
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} sendData - Send data (receiverId, comment, etc.)
 * @param {Object} user - User sending the document
 * @returns {Promise<Object>} - Result object
 */
export const sendDocument = async (documentId, sendData, user) => {
  try {
    const actorDbUserId = await getDatabaseUserId(user);
    if (!actorDbUserId) {
      return {
        success: false,
        error: 'User not found in database'
      };
    }

    // Get current document
    const documentResult = await getWorkflowDocumentById(documentId);
    if (!documentResult.success) {
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    const document = documentResult.data;
    const previousStatus = document.currentStatus;
    
    // Validate transition
    if (document.currentStatus !== 'draft' && document.currentStatus !== 'returned') {
      return {
        success: false,
        error: 'Document cannot be sent in current status'
      };
    }
    
    // Create workflow action
    const actionResult = await createWorkflowAction({
      documentId: parseInt(documentId),
      receiverId: sendData.receiverId,
      action: 'send',
      comment: sendData.comment,
      stateBefore: previousStatus,
      stateAfter: 'pending'
    }, user);
    
    if (!actionResult.success) {
      return actionResult;
    }
    
    // Update document status and assignee
    const updateResult = await updateWorkflowDocument(documentId, {
      currentStatus: 'pending',
      currentOwnerId: actorDbUserId,
      currentAssigneeId: Number(sendData.receiverId)
    }, user);
    
    if (!updateResult.success) {
      return updateResult;
    }
    
    // Create inbox item for receiver
    await createInboxItem(parseInt(documentId), sendData.receiverId, 'review');
    
    // Move file in Nextcloud if applicable
    if (process.env.NEXTCLOUD_BASE_URL && document.nextcloudFilePath) {
      try {
        const newPath = `Workflows/${document.documentType}/pending/${document.id}`;
        await moveNode(document.nextcloudFilePath, newPath);
        
        await updateWorkflowDocument(documentId, {
          nextcloudFilePath: newPath
        }, user);
      } catch (nextcloudError) {
        // Continue even if Nextcloud fails
      }
    }
    
    return {
      success: true,
      data: {
        document: updateResult.data,
        action: actionResult.data
      },
      message: 'Document sent successfully'
    };
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to send document',
      data: null
    };
  }
};

/**
 * Approve document
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} approveData - Approve data (comment, etc.)
 * @param {Object} user - User approving the document
 * @returns {Promise<Object>} - Result object
 */
export const approveDocument = async (documentId, approveData, user) => {
  try {
    const actorDbUserId = await getDatabaseUserId(user);
    if (!actorDbUserId) {
      return {
        success: false,
        error: 'User not found in database'
      };
    }

    // Get current document
    const documentResult = await getWorkflowDocumentById(documentId);
    if (!documentResult.success) {
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    const document = documentResult.data;
    const previousStatus = document.currentStatus;
    
    // Validate transition
    if (document.currentStatus !== 'pending') {
      return {
        success: false,
        error: 'Document cannot be approved in current status'
      };
    }
    
    const creatorId = document.creator?.id || document.createdBy;

    // Create workflow action
    const actionResult = await createWorkflowAction({
      documentId: parseInt(documentId),
      receiverId: creatorId,
      action: 'approve',
      comment: approveData.comment,
      stateBefore: previousStatus,
      stateAfter: 'approved'
    }, user);
    
    if (!actionResult.success) {
      return actionResult;
    }
    
    // Update document status
    const updateResult = await updateWorkflowDocument(documentId, {
      currentStatus: 'approved',
      currentOwnerId: actorDbUserId,
      currentAssigneeId: creatorId
    }, user);
    
    if (!updateResult.success) {
      return updateResult;
    }
    
    // Create inbox item for creator
    await createInboxItem(parseInt(documentId), creatorId, 'approved');
    
    // Send notification
    try {
      await send('workflow_document_approved', {
        document: documentResult.data,
        action: 'approved',
        sender: user,
        receiver: { id: creatorId },
        comment: approveData.comment
      });
    } catch (notificationError) {
      // Continue even if notification fails
    }
    
    // Move file in Nextcloud if applicable
    if (process.env.NEXTCLOUD_BASE_URL && document.nextcloudFilePath) {
      try {
        const newPath = `Workflows/${document.documentType}/approved/${document.id}`;
        await moveNode(document.nextcloudFilePath, newPath);
        
        await updateWorkflowDocument(documentId, {
          nextcloudFilePath: newPath
        }, user);
      } catch (nextcloudError) {
        // Continue even if Nextcloud fails
      }
    }
    
    return {
      success: true,
      data: {
        document: updateResult.data,
        action: actionResult.data
      },
      message: 'Document approved successfully'
    };
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to approve document',
      data: null
    };
  }
};

/**
 * Return document with feedback
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} returnData - Return data (comment, etc.)
 * @param {Object} user - User returning the document
 * @returns {Promise<Object>} - Result object
 */
export const returnDocument = async (documentId, returnData, user) => {
  try {
    const actorDbUserId = await getDatabaseUserId(user);
    if (!actorDbUserId) {
      return {
        success: false,
        error: 'User not found in database'
      };
    }

    // Get current document
    const documentResult = await getWorkflowDocumentById(documentId);
    if (!documentResult.success) {
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    const document = documentResult.data;
    const previousStatus = document.currentStatus;
    
    // Validate transition
    if (document.currentStatus !== 'pending') {
      return {
        success: false,
        error: 'Document cannot be returned in current status'
      };
    }
    
    const creatorId = document.creator?.id || document.createdBy;

    // Create workflow action
    const actionResult = await createWorkflowAction({
      documentId: parseInt(documentId),
      receiverId: creatorId,
      action: 'return',
      comment: returnData.comment,
      stateBefore: previousStatus,
      stateAfter: 'returned'
    }, user);
    
    if (!actionResult.success) {
      return actionResult;
    }
    
    // Update document status
    const updateResult = await updateWorkflowDocument(documentId, {
      currentStatus: 'returned',
      currentOwnerId: actorDbUserId,
      currentAssigneeId: creatorId
    }, user);
    
    if (!updateResult.success) {
      return updateResult;
    }
    
    // Create inbox item for creator
    await createInboxItem(parseInt(documentId), creatorId, 'revise');
    
    // Send notification
    try {
      await send('workflow_document_returned', {
        document: documentResult.data,
        action: 'returned',
        sender: user,
        receiver: { id: creatorId },
        comment: returnData.comment
      });
    } catch (notificationError) {
      // Continue even if notification fails
    }
    
    // Move file in Nextcloud if applicable
    if (process.env.NEXTCLOUD_BASE_URL && document.nextcloudFilePath) {
      try {
        const newPath = `Workflows/${document.documentType}/returned/${document.id}`;
        await moveNode(document.nextcloudFilePath, newPath);
        
        await updateWorkflowDocument(documentId, {
          nextcloudFilePath: newPath
        }, user);
      } catch (nextcloudError) {
        // Continue even if Nextcloud fails
      }
    }
    
    return {
      success: true,
      data: {
        document: updateResult.data,
        action: actionResult.data
      },
      message: 'Document returned successfully'
    };
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to return document',
      data: null
    };
  }
};

/**
 * Close document
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} closeData - Close data (comment, etc.)
 * @param {Object} user - User closing the document
 * @returns {Promise<Object>} - Result object
 */
export const closeDocument = async (documentId, closeData, user) => {
  try {
    // Get current document
    const documentResult = await getWorkflowDocumentById(documentId);
    if (!documentResult.success) {
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    const document = documentResult.data;
    const previousStatus = document.currentStatus;
    
    // Create workflow action
    const actionResult = await createWorkflowAction({
      documentId: parseInt(documentId),
      receiverId: document.createdBy, // Notify creator
      action: 'close',
      comment: closeData.comment,
      stateBefore: previousStatus,
      stateAfter: 'closed'
    }, user);
    
    if (!actionResult.success) {
      return actionResult;
    }
    
    // Update document status
    const updateResult = await updateWorkflowDocument(documentId, {
      currentStatus: 'closed',
      currentOwnerId: null,
      currentAssigneeId: null
    }, user);
    
    if (!updateResult.success) {
      return updateResult;
    }
    
    // Move file in Nextcloud if applicable
    if (process.env.NEXTCLOUD_BASE_URL && document.nextcloudFilePath) {
      try {
        const newPath = `Workflows/${document.documentType}/closed/${document.id}`;
        await moveNode(document.nextcloudFilePath, newPath);
        
        await updateWorkflowDocument(documentId, {
          nextcloudFilePath: newPath
        }, user);
      } catch (nextcloudError) {
        // Continue even if Nextcloud fails
      }
    }
    
    return {
      success: true,
      data: {
        document: updateResult.data,
        action: actionResult.data
      },
      message: 'Document closed successfully'
    };
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to close document',
      data: null
    };
  }
};

// ==================== INBOX OPERATIONS ====================

/**
 * Get inbox items for a user
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object
 */
export const getInboxItems = async (params = {}) => {
  try {
    const result = await getWorkflowInboxItems(params);
    return result;
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to retrieve inbox items',
      data: []
    };
  }
};

/**
 * Mark inbox item as read
 * 
 * @param {number|string} inboxItemId - Inbox item ID
 * @param {Object} user - User marking as read
 * @returns {Promise<Object>} - Result object
 */
export const markInboxItemAsRead = async (inboxItemId, user) => {
  try {
    const result = await markWorkflowInboxItemAsRead(inboxItemId, user);
    return result;
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to mark inbox item as read'
    };
  }
};

// ==================== PRIVATE WORKSPACE ====================

/**
 * Get or create private workspace for a user
 * 
 * @param {number|string} userId - User ID
 * @param {Object} workspaceData - Workspace data
 * @returns {Promise<Object>} - Result object
 */
export const getPrivateWorkspace = async (userId, workspaceData = {}) => {
  try {
    // Default workspace path if not provided
    const defaultWorkspaceData = {
      nextcloudFolderId: `workspace_${userId}`,
      nextcloudFolderPath: `Private Workspaces/${userId}`,
      ...workspaceData
    };
    
    const result = await getOrCreatePrivateWorkspaceLink(userId, defaultWorkspaceData);
    
    if (result.success && !result.data.nextcloudFolderId) {
      // Ensure Nextcloud folder exists
      if (process.env.NEXTCLOUD_BASE_URL) {
        try {
          await ensureFolder(defaultWorkspaceData.nextcloudFolderPath);
        } catch (nextcloudError) {
          // Continue even if Nextcloud fails
        }
      }
    }
    
    return result;
    
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to get private workspace',
      data: null
    };
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Create inbox item for workflow document
 * 
 * @param {number} documentId - Document ID
 * @param {number} userId - User ID
 * @param {string} action - Action type
 * @returns {Promise<Object>} - Result object
 */
const createInboxItem = async (documentId, userId, action) => {
  try {
    const inboxItem = await prisma.workflowInboxItem.create({
      data: {
        documentId: Number(documentId),
        userId: Number(userId),
        action,
        isRead: false
      }
    });

    return {
      success: true,
      data: inboxItem
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to create inbox item'
    };
  }
};

export default {
  // Documents
  createDocument,
  getDocuments,
  getDocumentById,
  
  // Workflow transitions
  sendDocument,
  approveDocument,
  returnDocument,
  closeDocument,
  
  // Inbox
  getInboxItems,
  markInboxItemAsRead,
  
  // Private workspace
  getPrivateWorkspace,
  
  // Utilities
  getDatabaseUserId
};
