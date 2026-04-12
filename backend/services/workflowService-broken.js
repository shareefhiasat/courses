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
import { ensureUser, ensureFolder, moveNode, createShare, addComment } from './nextcloudService.js';
import { send } from './notificationGateway.js';

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
    // Create the workflow document in database
    const result = await createWorkflowDocument(documentData, user);
    
    if (!result.success) {
      return result;
    }
    
    const document = result.data;
    
    // If Nextcloud integration is enabled, create folder structure
    if (process.env.NEXTCLOUD_BASE_URL && documentData.documentType) {
      try {
        // Create folder structure based on document type
        const folderPath = `Workflows/${documentData.documentType}/${document.id}`;
        await ensureFolder(folderPath);
        
        // Update document with Nextcloud path
        await updateWorkflowDocument(document.id, {
          nextcloudFilePath: folderPath
        }, user);
        
        createDocument - Nextcloud folder created`, { folderPath });
      } catch (nextcloudError) {
        warn(`${serviceName}:createDocument - Nextcloud folder creation failed`, { 
          error: nextcloudError.message 
        });
        // Don't fail the whole operation if Nextcloud fails
      }
    }
    
    return {
      success: true,
      data: document,
      message: 'Workflow document created successfully'
    };
    
  } catch (err) {
    error(`${serviceName}:createDocument:error`, { error: err.message, documentData, user: user?.email });
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
    getDocuments`, { params });
    
    const result = await getWorkflowDocuments(params);
    
    if (result.success) {
      getDocuments - Retrieved ${result.data.length} documents`);
    }
    
    return result;
    
  } catch (err) {
    error(`${serviceName}:getDocuments:error`, { error: err.message, params });
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
    getDocumentById`, { documentId });
    
    const result = await getWorkflowDocumentById(documentId);
    
    if (result.success) {
      getDocumentById - Retrieved document: ${result.data.id}`);
    }
    
    return result;
    
  } catch (err) {
    error(`${serviceName}:getDocumentById:error`, { error: err.message, documentId });
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
    sendDocument`, { documentId, sendData, user: user?.email });
    
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
      receiverId: sendData.receiverId,
      action: 'send',
      comment: sendData.comment,
      stateBefore: previousStatus,
      stateAfter: 'sent'
    }, user);
    
    if (!actionResult.success) {
      return actionResult;
    }
    
    // Update document status and assignee
    const updateResult = await updateWorkflowDocument(documentId, {
      currentStatus: 'sent',
      currentAssigneeId: sendData.receiverId
    }, user);
    
    if (!updateResult.success) {
      return updateResult;
    }
    
    // Create inbox item for receiver
    await createInboxItem(parseInt(documentId), sendData.receiverId, 'review');
    
    // Send notification
    try {
      await send('workflow_document_sent', {
        document: documentResult.data,
        action: 'sent',
        sender: user,
        receiver: { id: sendData.receiverId },
        comment: sendData.comment
      });
    } catch (notificationError) {
      warn(`${serviceName}:sendDocument - Notification failed`, { 
        error: notificationError.message 
      });
    }
    
    // Move file in Nextcloud if applicable
    if (process.env.NEXTCLOUD_BASE_URL && document.nextcloudFilePath) {
      try {
        const newPath = `Workflows/${document.documentType}/pending/${document.id}`;
        await moveNode(document.nextcloudFilePath, newPath);
        
        await updateWorkflowDocument(documentId, {
          nextcloudFilePath: newPath
        }, user);
        
        sendDocument - Nextcloud file moved`, { newPath });
      } catch (nextcloudError) {
        warn(`${serviceName}:sendDocument - Nextcloud file move failed`, { 
          error: nextcloudError.message 
        });
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
    error(`${serviceName}:sendDocument:error`, { error: err.message, documentId, sendData, user: user?.email });
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
    approveDocument`, { documentId, approveData, user: user?.email });
    
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
      receiverId: document.createdBy, // Send back to creator
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
      currentOwnerId: document.createdBy,
      currentAssigneeId: document.createdBy
    }, user);
    
    if (!updateResult.success) {
      return updateResult;
    }
    
    // Create inbox item for creator
    await createInboxItem(parseInt(documentId), document.createdBy, 'approved');
    
    // Send notification
    try {
      await send('workflow_document_approved', {
        document: documentResult.data,
        action: 'approved',
        sender: user,
        receiver: { id: document.createdBy },
        comment: approveData.comment
      });
    } catch (notificationError) {
      warn(`${serviceName}:approveDocument - Notification failed`, { 
        error: notificationError.message 
      });
    }
    
    // Move file in Nextcloud if applicable
    if (process.env.NEXTCLOUD_BASE_URL && document.nextcloudFilePath) {
      try {
        const newPath = `Workflows/${document.documentType}/approved/${document.id}`;
        await moveNode(document.nextcloudFilePath, newPath);
        
        await updateWorkflowDocument(documentId, {
          nextcloudFilePath: newPath
        }, user);
        
        approveDocument - Nextcloud file moved`, { newPath });
      } catch (nextcloudError) {
        warn(`${serviceName}:approveDocument - Nextcloud file move failed`, { 
          error: nextcloudError.message 
        });
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
    error(`${serviceName}:approveDocument:error`, { error: err.message, documentId, approveData, user: user?.email });
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
    returnDocument`, { documentId, returnData, user: user?.email });
    
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
      receiverId: document.createdBy, // Return to creator
      action: 'return',
      comment: returnData.comment,
      stateBefore: previousStatus,
      stateAfter: 'revise_needed'
    }, user);
    
    if (!actionResult.success) {
      return actionResult;
    }
    
    // Update document status
    const updateResult = await updateWorkflowDocument(documentId, {
      currentStatus: 'revise_needed',
      currentOwnerId: document.createdBy,
      currentAssigneeId: document.createdBy
    }, user);
    
    if (!updateResult.success) {
      return updateResult;
    }
    
    // Create inbox item for creator
    await createInboxItem(parseInt(documentId), document.createdBy, 'revise');
    
    // Send notification
    try {
      await send('workflow_document_returned', {
        document: documentResult.data,
        action: 'returned',
        sender: user,
        receiver: { id: document.createdBy },
        comment: returnData.comment
      });
    } catch (notificationError) {
      warn(`${serviceName}:returnDocument - Notification failed`, { 
        error: notificationError.message 
      });
    }
    
    // Move file in Nextcloud if applicable
    if (process.env.NEXTCLOUD_BASE_URL && document.nextcloudFilePath) {
      try {
        const newPath = `Workflows/${document.documentType}/returned/${document.id}`;
        await moveNode(document.nextcloudFilePath, newPath);
        
        await updateWorkflowDocument(documentId, {
          nextcloudFilePath: newPath
        }, user);
        
        returnDocument - Nextcloud file moved`, { newPath });
      } catch (nextcloudError) {
        warn(`${serviceName}:returnDocument - Nextcloud file move failed`, { 
          error: nextcloudError.message 
        });
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
    error(`${serviceName}:returnDocument:error`, { error: err.message, documentId, returnData, user: user?.email });
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
    closeDocument`, { documentId, closeData, user: user?.email });
    
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
    
    // Send notification
    try {
      await send('workflow_document_closed', {
        document: documentResult.data,
        action: 'closed',
        sender: user,
        receiver: { id: document.createdBy },
        comment: closeData.comment
      });
    } catch (notificationError) {
      warn(`${serviceName}:closeDocument - Notification failed`, { 
        error: notificationError.message 
      });
    }
    
    // Move file in Nextcloud if applicable
    if (process.env.NEXTCLOUD_BASE_URL && document.nextcloudFilePath) {
      try {
        const newPath = `Workflows/${document.documentType}/closed/${document.id}`;
        await moveNode(document.nextcloudFilePath, newPath);
        
        await updateWorkflowDocument(documentId, {
          nextcloudFilePath: newPath
        }, user);
        
        closeDocument - Nextcloud file moved`, { newPath });
      } catch (nextcloudError) {
        warn(`${serviceName}:closeDocument - Nextcloud file move failed`, { 
          error: nextcloudError.message 
        });
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
    error(`${serviceName}:closeDocument:error`, { error: err.message, documentId, closeData, user: user?.email });
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
    getInboxItems`, { params });
    
    const result = await getWorkflowInboxItems(params);
    
    if (result.success) {
      getInboxItems - Retrieved ${result.data.length} inbox items`);
    }
    
    return result;
    
  } catch (err) {
    error(`${serviceName}:getInboxItems:error`, { error: err.message, params });
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
    markInboxItemAsRead`, { inboxItemId, user: user?.email });
    
    const result = await markWorkflowInboxItemAsRead(inboxItemId, user);
    
    if (result.success) {
      markInboxItemAsRead - Inbox item marked as read`);
    }
    
    return result;
    
  } catch (err) {
    error(`${serviceName}:markInboxItemAsRead:error`, { error: err.message, inboxItemId, user: user?.email });
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
    getPrivateWorkspace`, { userId, workspaceData });
    
    // Default workspace path if not provided
    const defaultWorkspaceData = {
      nextcloudFolderId: `workspace_${userId}`,
      nextcloudFolderPath: `Private Workspaces/${userId}`,
      ...workspaceData
    };
    
    const result = await getOrCreatePrivateWorkspaceLink(userId, defaultWorkspaceData);
    
    if (result.success) {
      // Ensure Nextcloud folder exists
      if (process.env.NEXTCLOUD_BASE_URL) {
        try {
          await ensureFolder(defaultWorkspaceData.nextcloudFolderPath);
          getPrivateWorkspace - Nextcloud folder ensured`, { 
            path: defaultWorkspaceData.nextcloudFolderPath 
          });
        } catch (nextcloudError) {
          warn(`${serviceName}:getPrivateWorkspace - Nextcloud folder creation failed`, { 
            error: nextcloudError.message 
          });
        }
      }
    }
    
    return result;
    
  } catch (err) {
    error(`${serviceName}:getPrivateWorkspace:error`, { error: err.message, userId, workspaceData });
    return {
      success: false,
      error: err.message || 'Failed to get private workspace'
    };
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Create inbox item for a user
 * 
 * @param {number} documentId - Document ID
 * @param {number} userId - User ID
 * @param {string} action - Action type
 * @returns {Promise<Object>} - Result object
 */
const createInboxItem = async (documentId, userId, action) => {
  try {
    // Check if inbox item already exists
    const existingItem = await prisma.workflowInboxItem.findUnique({
      where: { documentId_userId: { documentId, userId } }
    });
    
    if (existingItem) {
      // Update existing item
      await prisma.workflowInboxItem.update({
        where: { id: existingItem.id },
        data: {
          action,
          isRead: false,
          createdAt: new Date()
        }
      });
    } else {
      // Create new item
      await prisma.workflowInboxItem.create({
        data: {
          documentId,
          userId,
          action,
          isRead: false
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Workflow Service] Error creating inbox item:', error);
    return { success: false, error: error.message };
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
  getPrivateWorkspace
};
