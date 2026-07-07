import { error } from '../utils/logger.js';

const serviceName = 'adminReviewService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('keycloak_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getAdminReviewDocuments = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE}/workflow-documents${query ? `?${query}` : ''}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getAdminReviewDocuments:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export const approveWorkflowDoc = async (docId, comment = '') => {
  try {
    const response = await fetch(`${API_BASE}/workflow-documents/${docId}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ comment }),
    });
    if (!response.ok) return { success: false, error: 'Failed to approve' };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:approveWorkflowDoc:error`, { error: err.message });
    return { success: false, error: 'Internal error' };
  }
};

export const rejectWorkflowDoc = async (docId, reason = '') => {
  try {
    const response = await fetch(`${API_BASE}/workflow-documents/${docId}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) return { success: false, error: 'Failed to reject' };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:rejectWorkflowDoc:error`, { error: err.message });
    return { success: false, error: 'Internal error' };
  }
};

export const returnWorkflowDoc = async (docId, comment = '') => {
  try {
    const response = await fetch(`${API_BASE}/workflow-documents/${docId}/return`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ comment }),
    });
    if (!response.ok) return { success: false, error: 'Failed to return' };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:returnWorkflowDoc:error`, { error: err.message });
    return { success: false, error: 'Internal error' };
  }
};

export default {
  getAdminReviewDocuments,
  approveWorkflowDoc,
  rejectWorkflowDoc,
  returnWorkflowDoc,
};
