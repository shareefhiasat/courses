/**
 * Export History Service - Frontend API Client
 *
 * PURPOSE: Make API calls to the export history backend endpoints
 * ARCHITECTURE: Frontend → API Routes → Controllers → Services → DB
 */

import { appConfig } from '@services/config/apiConfig.js';
import { getAuthToken } from '@utils/authHelpers';

async function apiRequest(endpoint, options = {}) {
  const baseUrl = appConfig.getApiBaseUrl();
  const version = appConfig.getApiVersion();

  const hasApi = baseUrl.includes('/api');
  const hasVersion = baseUrl.includes(`/${version}`) || baseUrl.includes('/v1');

  let url;
  if (hasVersion) {
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '').replace(/^\/+/, '');
    url = `${baseUrl}/${cleanEndpoint}`;
  } else if (hasApi) {
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '').replace(/^\/+/, '');
    url = `${baseUrl}/${version}/${cleanEndpoint}`;
  } else {
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '');
    url = `${baseUrl}/api/${version}${cleanEndpoint}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { ...options, headers };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
        code: response.status,
      };
    }

    return data;
  } catch (error) {
    console.error('[ExportHistoryService] API request error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Log an export event to the backend
 * @param {Object} payload - { exportType, format, filename, classId, subjectId, programId, reportDate, fileId, mimeType, metadata }
 * @returns {Promise<Object>} - { success, data }
 */
export const logExportHistory = async (payload) => {
  return apiRequest('/export-history', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Fetch export file blob (audit path — owner or super_admin)
 * @param {number|string} exportId
 * @param {{ disposition?: 'inline'|'attachment' }} options
 */
export async function fetchExportHistoryFile(exportId, { disposition = 'inline' } = {}) {
  const baseUrl = appConfig.getApiBaseUrl();
  const version = appConfig.getApiVersion();
  const hasApi = baseUrl.includes('/api');
  const hasVersion = baseUrl.includes(`/${version}`) || baseUrl.includes('/v1');

  let url;
  const endpoint = `/export-history/${exportId}/file?disposition=${disposition}`;
  if (hasVersion) {
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '').replace(/^\/+/, '');
    url = `${baseUrl}/${cleanEndpoint}`;
  } else if (hasApi) {
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '').replace(/^\/+/, '');
    url = `${baseUrl}/${version}/${cleanEndpoint}`;
  } else {
    const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '');
    url = `${baseUrl}/api/${version}${cleanEndpoint}`;
  }

  const headers = {};
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    let errorMsg = 'Failed to fetch export file';
    try {
      const data = await response.json();
      errorMsg = data.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.blob();
}

/**
 * Open export file in browser or trigger download
 * @param {Object} record - export history record
 * @param {Object} options - { isSuperAdmin, currentUserId, preferDownload }
 */
export async function openExportFile(record, { isSuperAdmin, currentUserId, preferDownload = false } = {}) {
  const isOwn = record.userId === currentUserId || record.user?.id === currentUserId;
  const useAuditPath = isSuperAdmin && !isOwn;

  if (useAuditPath) {
    const blob = await fetchExportHistoryFile(record.id, {
      disposition: preferDownload ? 'attachment' : 'inline',
    });
    openBlob(blob, record.filename, preferDownload || record.format !== 'pdf');
    return;
  }

  if (!record.fileId) {
    throw new Error('File not available');
  }

  const { apiService } = await import('@services/api/apiService.js');
  const response = await apiService.get(`/drive/files/${record.fileId}/download`, {
    responseType: 'blob',
  });

  const blob = response.data || response;
  openBlob(blob, record.filename, preferDownload || record.format !== 'pdf');
}

function openBlob(blob, filename, asDownload) {
  const blobUrl = window.URL.createObjectURL(blob);
  if (asDownload) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'export';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } else {
    window.open(blobUrl, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  }
}

/**
 * Get export history with optional filters
 * @param {Object} params - { exportType, format, userId, search, startDate, endDate, limit, offset }
 * @returns {Promise<Object>} - { success, data, total }
 */
export const getExportHistory = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.exportType) query.set('exportType', params.exportType);
  if (params.format) query.set('format', params.format);
  if (params.userId) query.set('userId', params.userId);
  if (params.search) query.set('search', params.search);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.limit) query.set('limit', params.limit);
  if (params.offset) query.set('offset', params.offset);

  const queryString = query.toString();
  const endpoint = `/export-history${queryString ? `?${queryString}` : ''}`;

  return apiRequest(endpoint, { method: 'GET' });
};
