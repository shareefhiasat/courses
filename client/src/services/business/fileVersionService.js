/**
 * File Version Service
 * 
 * PURPOSE: Client-side service for file version/revision operations
 * ARCHITECTURE: Frontend Service → API Service → Backend API
 */

import { apiService } from '../api/apiService.js';

const serviceName = 'fileVersionService';

/**
 * Get file versions
 */
export const getFileVersions = async (fileId) => {
  try {
    const response = await apiService.get(`/drive/files/${encodeURIComponent(fileId)}/versions`);
    return {
      success: true,
      data: response.data || [],
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get file versions error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get file versions',
      timestamp: Date.now()
    };
  }
};

/**
 * Restore file version
 */
export const restoreFileVersion = async (fileId, versionId) => {
  try {
    const response = await apiService.post(`/drive/files/${encodeURIComponent(fileId)}/versions/${versionId}/restore`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Restore file version error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to restore file version',
      timestamp: Date.now()
    };
  }
};

/**
 * Enable file versioning
 */
export const enableFileVersioning = async (fileId) => {
  try {
    const response = await apiService.post(`/drive/files/${encodeURIComponent(fileId)}/enable-versioning`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Enable file versioning error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to enable file versioning',
      timestamp: Date.now()
    };
  }
};

export default {
  getFileVersions,
  restoreFileVersion,
  enableFileVersioning
};
