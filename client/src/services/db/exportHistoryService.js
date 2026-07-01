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
 * @param {Object} payload - { exportType, format, filename, classId, subjectId, programId, reportDate, metadata }
 * @returns {Promise<Object>} - { success, data }
 */
export const logExportHistory = async (payload) => {
  return apiRequest('/export-history', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

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
