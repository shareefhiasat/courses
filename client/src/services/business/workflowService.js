/**
 * Workflow Business Service
 * 
 * PURPOSE: Frontend service for workflow API operations
 * ARCHITECTURE: UI Components → Business Services → Backend API
 */

import { apiService } from '../api/apiService';

// Base API URL (apiService already includes /api/v1)
const API_BASE = '/workflow-documents';

const serviceName = 'workflowService';

// ==================== DOCUMENT OPERATIONS ====================

/**
 * Create a new workflow document
 * 
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} - Result object
 */
export const createWorkflowDocument = async (documentData) => {
  try {
    console.log(`[${serviceName}] Creating workflow document:`, documentData);
    
    const response = await apiService.post(`${API_BASE}/documents`, documentData);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Created workflow document:`, response.data);
    } else {
      console.error(`[${serviceName}] ❌ Failed to create workflow document:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error creating workflow document:`, error);
    return {
      success: false,
      error: error.message || 'Failed to create workflow document',
      data: null
    };
  }
};

/**
 * Get workflow documents with filtering and pagination
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object
 */
export const getWorkflowDocuments = async (params = {}) => {
  try {
    console.log(`[${serviceName}] Getting workflow documents with params:`, params);

    // Backend only accepts: role, status, workflowType, limit, offset
    // Filter out unsupported params like createdBy, sortBy, sortOrder
    const { role, status, workflowType, limit, offset } = params;
    const supportedParams = {};
    if (role) supportedParams.role = role;
    if (status) supportedParams.status = status;
    if (workflowType) supportedParams.workflowType = workflowType;
    if (limit) supportedParams.limit = limit;
    if (offset) supportedParams.offset = offset;

    const response = await apiService.get(`${API_BASE}`, { params: supportedParams });

    if (response.success) {
      console.log(`[${serviceName}] ✅ Retrieved ${response.data?.length || 0} workflow documents`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to get workflow documents:`, response.error);
    }

    return response;

  } catch (error) {
    console.error(`[${serviceName}] Error getting workflow documents:`, error);
    // Gracefully handle 404 and other errors - return empty data instead of breaking
    if (error.response?.status === 404) {
      console.warn(`[${serviceName}] Endpoint not available (404), returning empty documents`);
      return {
        success: true,
        data: [],
        error: null
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to retrieve workflow documents',
      data: []
    };
  }
};

/**
 * Get workflow document by ID
 * 
 * @param {number|string} documentId - Document ID
 * @returns {Promise<Object>} - Result object
 */
export const getWorkflowDocumentById = async (documentId) => {
  try {
    console.log(`[${serviceName}] Getting workflow document by ID: ${documentId}`);
    
    const response = await apiService.get(`${API_BASE}/documents/${documentId}`);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Retrieved workflow document: ${response.data?.id}`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to get workflow document:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error getting workflow document by ID:`, error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve workflow document',
      data: null
    };
  }
};

// ==================== WORKFLOW TRANSITIONS ====================

/**
 * Send document to another user
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} sendData - Send data
 * @returns {Promise<Object>} - Result object
 */
export const sendWorkflowDocument = async (documentId, sendData) => {
  try {
    console.log(`[${serviceName}] Sending workflow document:`, { documentId, sendData });

    const response = await apiService.post(`/workflow-documents/${documentId}/send`, sendData);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Document sent successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to send document:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error sending workflow document:`, error);
    return {
      success: false,
      error: error.message || 'Failed to send document',
      data: null
    };
  }
};

/**
 * Approve document
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} approveData - Approve data
 * @returns {Promise<Object>} - Result object
 */
export const approveWorkflowDocument = async (documentId, approveData) => {
  try {
    console.log(`[${serviceName}] Approving workflow document:`, { documentId, approveData });
    
    const response = await apiService.post(`/workflow/documents/${documentId}/approve`, approveData);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Document approved successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to approve document:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error approving workflow document:`, error);
    return {
      success: false,
      error: error.message || 'Failed to approve document',
      data: null
    };
  }
};

/**
 * Return document with feedback
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} returnData - Return data
 * @returns {Promise<Object>} - Result object
 */
export const returnWorkflowDocument = async (documentId, returnData) => {
  try {
    console.log(`[${serviceName}] Returning workflow document:`, { documentId, returnData });
    
    const response = await apiService.post(`/workflow/documents/${documentId}/return`, returnData);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Document returned successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to return document:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error returning workflow document:`, error);
    return {
      success: false,
      error: error.message || 'Failed to return document',
      data: null
    };
  }
};

/**
 * Close document
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} closeData - Close data
 * @returns {Promise<Object>} - Result object
 */
export const closeWorkflowDocument = async (documentId, closeData) => {
  try {
    console.log(`[${serviceName}] Closing workflow document:`, { documentId, closeData });
    
    const response = await apiService.post(`/workflow/documents/${documentId}/close`, closeData);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Document closed successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to close document:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error closing workflow document:`, error);
    return {
      success: false,
      error: error.message || 'Failed to close document',
      data: null
    };
  }
};

/**
 * Reject document
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} rejectData - Reject data (reason, etc.)
 * @returns {Promise<Object>} - Result object
 */
export const rejectWorkflowDocument = async (documentId, rejectData) => {
  try {
    console.log(`[${serviceName}] Rejecting workflow document:`, { documentId, rejectData });
    
    const response = await apiService.post(`${API_BASE}/${documentId}/reject`, rejectData);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Document rejected successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to reject document:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error rejecting workflow document:`, error);
    return {
      success: false,
      error: error.message || 'Failed to reject document',
      data: null
    };
  }
};

/**
 * Hard delete workflow document
 * 
 * @param {number|string} documentId - Document ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteWorkflowDocument = async (documentId) => {
  try {
    console.log(`[${serviceName}] Hard deleting workflow document:`, documentId);
    console.log(`[${serviceName}] API endpoint: ${API_BASE}/${documentId}`);
    
    const response = await apiService.delete(`${API_BASE}/${documentId}`);
    
    console.log(`[${serviceName}] Delete response:`, response);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Document deleted successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to delete document:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error deleting workflow document:`, error);
    console.error(`[${serviceName}] Error status:`, error.response?.status);
    console.error(`[${serviceName}] Error data:`, error.response?.data);
    return {
      success: false,
      error: error.message || 'Failed to delete document',
      data: null
    };
  }
};

// ==================== COMMENTS ====================

/**
 * Get comments for a workflow document
 * 
 * @param {number|string} documentId - Document ID
 * @returns {Promise<Object>} - Result object
 */
export const getWorkflowComments = async (documentId) => {
  try {
    console.log(`[${serviceName}] Getting comments for workflow document:`, documentId);
    
    const response = await apiService.get(`${API_BASE}/${documentId}/comments`);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Retrieved ${response.data?.length || 0} comments`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to get comments:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error getting workflow comments:`, error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve comments',
      data: []
    };
  }
};

/**
 * Add a comment to a workflow document
 * 
 * @param {number|string} documentId - Document ID
 * @param {Object} commentData - Comment data (content, mentions, etc.)
 * @returns {Promise<Object>} - Result object
 */
export const addWorkflowComment = async (documentId, commentData) => {
  try {
    console.log(`[${serviceName}] Adding comment to workflow document:`, { documentId, commentData });
    
    const response = await apiService.post(`${API_BASE}/${documentId}/comments`, commentData);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Comment added successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to add comment:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error adding workflow comment:`, error);
    return {
      success: false,
      error: error.message || 'Failed to add comment',
      data: null
    };
  }
};

/**
 * Delete a workflow comment
 * 
 * @param {number|string} documentId - Document ID
 * @param {number|string} commentId - Comment ID
 * @returns {Promise<Object>} - Result object
 */
export const deleteWorkflowComment = async (documentId, commentId) => {
  try {
    console.log(`[${serviceName}] Deleting comment:`, { documentId, commentId });
    
    const response = await apiService.delete(`${API_BASE}/${documentId}/comments/${commentId}`);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Comment deleted successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to delete comment:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error deleting workflow comment:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete comment',
      data: null
    };
  }
};

// ==================== INBOX OPERATIONS ====================

/**
 * Get workflow inbox items for the current user
 *
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Result object
 */
export const getWorkflowInbox = async (params = {}) => {
  try {
    console.log(`[${serviceName}] Getting workflow inbox with params:`, params);

    // Backend getMyTasks accepts no query parameters
    // Remove all params like page, limit, action, sortBy, sortOrder
    const response = await apiService.get('/workflows/my-tasks');

    if (response.success) {
      console.log(`[${serviceName}] ✅ Retrieved workflow inbox:`, response.data?.payload?.length || 0, 'items');
    } else {
      console.error(`[${serviceName}] ❌ Failed to get workflow inbox:`, response.error);
    }

    return response;

  } catch (error) {
    console.error(`[${serviceName}] Error getting workflow inbox:`, error);
    // Gracefully handle 404 and other errors - return empty data instead of breaking
    if (error.response?.status === 404) {
      console.warn(`[${serviceName}] Endpoint not available (404), returning empty inbox`);
      return {
        success: true,
        data: { items: [], total: 0 },
        error: null
      };
    }
    return {
      success: false,
      error: error.message || 'Failed to get workflow inbox',
      data: null
    };
  }
};

/**
 * Mark inbox item as read
 * 
 * @param {number|string} inboxItemId - Inbox item ID
 * @returns {Promise<Object>} - Result object
 */
export const markWorkflowInboxItemAsRead = async (inboxItemId) => {
  try {
    console.log(`[${serviceName}] Marking inbox item as read:`, inboxItemId);
    
    const response = await apiService.post(`${API_BASE}/inbox/${inboxItemId}/read`);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Marked inbox item as read:`, inboxItemId);
    } else {
      console.error(`[${serviceName}] ❌ Failed to mark inbox item as read:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error marking inbox item as read:`, error);
    return {
      success: false,
      error: error.message || 'Failed to mark inbox item as read',
      data: null
    };
  }
};

// ==================== PRIVATE WORKSPACE ====================

/**
 * Get or create private workspace for the current user
 * 
 * @param {Object} workspaceData - Workspace data
 * @returns {Promise<Object>} - Result object
 */
export const getPrivateWorkspace = async (workspaceData = {}) => {
  try {
    console.log(`[${serviceName}] Getting private workspace:`, workspaceData);
    
    const response = await apiService.post('/workflow/workspace', workspaceData);
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Retrieved private workspace`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to get private workspace:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error getting private workspace:`, error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve private workspace'
    };
  }
};

export default {
  // Documents
  createWorkflowDocument,
  getWorkflowDocuments,
  getWorkflowDocumentById,
  deleteWorkflowDocument,
  
  // Workflow transitions
  sendWorkflowDocument,
  approveWorkflowDocument,
  rejectWorkflowDocument,
  returnWorkflowDocument,
  closeWorkflowDocument,
  
  // Comments
  getWorkflowComments,
  addWorkflowComment,
  deleteWorkflowComment,
  
  // Inbox
  getWorkflowInbox,
  markWorkflowInboxItemAsRead,
  
  // Private workspace
  getPrivateWorkspace
};
