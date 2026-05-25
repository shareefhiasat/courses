/**
 * Workflow Documents API Client
 * 
 * PURPOSE: API client for workflow document operations
 * ARCHITECTURE: Frontend Services → API Client → Backend API
 */

import { apiService } from './apiService';

/**
 * Create a new workflow document
 */
export const createWorkflowDocument = async (data) => {
  return await apiService.post('/workflow-documents', data);
};

/**
 * Create a custom workflow document from existing file
 * @param {Object} data - Workflow data
 * @param {string} data.workflowType - Type of workflow
 * @param {string} data.title - Workflow title
 * @param {string} data.description - Workflow description
 * @param {Array<number>} data.reviewers - Array of reviewer user IDs
 * @param {boolean} data.attachFile - Whether to attach the file
 * @param {string} data.sourceBucket - Source MinIO bucket
 * @param {string} data.sourcePath - Source file path in bucket
 * @param {string} data.fileName - File name
 */
export const createCustomWorkflowDocument = async (data) => {
  console.log('🟢 [workflow-documents-api] Creating custom workflow:', {
    data,
    workflowType: data.workflowType,
    title: data.title,
    hasFile: !!data.sourcePath,
    reviewersCount: data.reviewers?.length
  });
  
  try {
    console.log('🟢 [workflow-documents-api] Calling apiService.post...');
    const result = await apiService.post('/workflow-documents/custom', data);
    console.log('🟢 [workflow-documents-api] Raw API response:', result);
    console.log('✅ [workflow-documents-api] Custom workflow created successfully:', {
      documentId: result.data?.document?.id,
      success: result.success,
      fullResult: result
    });
    return result;
  } catch (error) {
    console.error('❌ [workflow-documents-api] Failed to create custom workflow:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      fullError: error
    });
    throw error;
  }
};

/**
 * Get workflow document by ID
 */
export const getWorkflowDocument = async (id) => {
  return await apiService.get(`/workflow-documents/${id}`);
};

/**
 * Get workflow documents for current user
 */
export const getWorkflowDocuments = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.workflowType) params.append('workflowType', filters.workflowType);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  
  const queryString = params.toString();
  const url = queryString ? `/workflow-documents?${queryString}` : '/workflow-documents';
  
  return await apiService.get(url);
};

/**
 * Update workflow document status
 */
export const updateWorkflowDocumentStatus = async (id, data) => {
  return await apiService.patch(`/workflow-documents/${id}/status`, data);
};

/**
 * Add comment to workflow document
 */
export const addWorkflowComment = async (id, data) => {
  return await apiService.post(`/workflow-documents/${id}/comments`, data);
};

/**
 * Approve workflow document
 */
export const approveWorkflowDocument = async (id, data = {}) => {
  return await apiService.post(`/workflow-documents/${id}/approve`, data);
};

/**
 * Reject workflow document
 */
export const rejectWorkflowDocument = async (id, data) => {
  return await apiService.post(`/workflow-documents/${id}/reject`, data);
};

/**
 * Return workflow document for revision
 */
export const returnWorkflowDocument = async (id, data) => {
  return await apiService.post(`/workflow-documents/${id}/return`, data);
};

/**
 * Resubmit workflow document with new file
 */
export const resubmitWorkflowDocument = async (id, data) => {
  return await apiService.post(`/workflow-documents/${id}/resubmit`, data);
};

/**
 * Upload signed document by Admin (for weekly summaries)
 */
export const uploadSignedDocument = async (id, data) => {
  return await apiService.post(`/workflow-documents/${id}/upload-signed`, data);
};

/**
 * Withdraw workflow document (revert to DRAFT status)
 */
export const withdrawWorkflowDocument = async (id, data) => {
  return await apiService.post(`/workflow-documents/${id}/withdraw`, data);
};

/**
 * Get compliance data for calendar view
 */
export const getComplianceData = async (params) => {
  return await apiService.get('/workflow-documents/compliance', { params });
};

/**
 * Get analytics data for workflow dashboard
 */
export const getAnalyticsData = async (params) => {
  return await apiService.get('/workflow-documents/analytics', { params });
};

/**
 * List all versions of a workflow document file
 */
export const listFileVersions = async (fileId) => {
  return await apiService.get(`/workflow-documents/${fileId}/versions`);
};

/**
 * Download a specific version of a workflow document file
 */
export const downloadFileVersion = async (fileId, versionId) => {
  return await apiService.get(`/workflow-documents/${fileId}/versions/${versionId}/download`, {
    responseType: 'blob'
  });
};

export default {
  createWorkflowDocument,
  createCustomWorkflowDocument,
  getWorkflowDocument,
  getWorkflowDocuments,
  updateWorkflowDocumentStatus,
  addWorkflowComment,
  approveWorkflowDocument,
  rejectWorkflowDocument,
  returnWorkflowDocument,
  resubmitWorkflowDocument,
  uploadSignedDocument,
  withdrawWorkflowDocument,
  getComplianceData,
  getAnalyticsData,
  listFileVersions,
  downloadFileVersion
};
