const API_BASE = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('keycloak_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const getWorkflowTypeConfigs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/workflow-type-configs${query ? `?${query}` : ''}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return { success: false, data: [] };
  return await res.json();
};

export const createWorkflowTypeConfig = async (data) => {
  const res = await fetch(`${API_BASE}/workflow-type-configs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) return { success: false, error: 'Failed to create' };
  return await res.json();
};

export const updateWorkflowTypeConfig = async (id, data) => {
  const res = await fetch(`${API_BASE}/workflow-type-configs/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) return { success: false, error: 'Failed to update' };
  return await res.json();
};

export const deleteWorkflowTypeConfig = async (id) => {
  const res = await fetch(`${API_BASE}/workflow-type-configs/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) return { success: false, error: 'Failed to delete' };
  return await res.json();
};

export default {
  getWorkflowTypeConfigs,
  createWorkflowTypeConfig,
  updateWorkflowTypeConfig,
  deleteWorkflowTypeConfig,
};
