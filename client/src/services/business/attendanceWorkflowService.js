import { error } from '../utils/logger.js';

const serviceName = 'attendanceWorkflowService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('keycloak_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getInboxDocuments = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE}/workflow-documents${query ? `?${query}` : ''}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getInboxDocuments:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export const getOutboxDocuments = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE}/workflow-documents${query ? `?${query}` : ''}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return { success: false, data: [] };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:getOutboxDocuments:error`, { error: err.message });
    return { success: false, data: [] };
  }
};

export const approveDocument = async (docId, comment = '') => {
  try {
    const response = await fetch(`${API_BASE}/workflow-documents/${docId}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ comment }),
    });
    if (!response.ok) return { success: false, error: 'Failed to approve' };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:approveDocument:error`, { error: err.message });
    return { success: false, error: 'Internal error' };
  }
};

export const rejectDocument = async (docId, reason = '') => {
  try {
    const response = await fetch(`${API_BASE}/workflow-documents/${docId}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) return { success: false, error: 'Failed to reject' };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:rejectDocument:error`, { error: err.message });
    return { success: false, error: 'Internal error' };
  }
};

export const returnDocument = async (docId, comment = '') => {
  try {
    const response = await fetch(`${API_BASE}/workflow-documents/${docId}/return`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ comment }),
    });
    if (!response.ok) return { success: false, error: 'Failed to return' };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:returnDocument:error`, { error: err.message });
    return { success: false, error: 'Internal error' };
  }
};

export const withdrawDocument = async (docId) => {
  try {
    const response = await fetch(`${API_BASE}/workflow-documents/${docId}/withdraw`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) return { success: false, error: 'Failed to withdraw' };
    return await response.json();
  } catch (err) {
    error(`${serviceName}:withdrawDocument:error`, { error: err.message });
    return { success: false, error: 'Internal error' };
  }
};

export default {
  getInboxDocuments,
  getOutboxDocuments,
  approveDocument,
  rejectDocument,
  returnDocument,
  withdrawDocument,
};
