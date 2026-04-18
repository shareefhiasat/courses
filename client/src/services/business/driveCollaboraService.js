/**
 * Drive Collabora Service
 * 
 * PURPOSE: Client-side service for Collabora integration
 * ARCHITECTURE: Frontend Service → API Service → Backend API
 */

import { apiService } from '../api/apiService.js';

const serviceName = 'driveCollaboraService';

/**
 * Get Collabora edit URL for a file
 */
export const getCollaboraEditUrl = async (fileId) => {
  try {
    const response = await apiService.get(`/drive/files/${encodeURIComponent(fileId)}/collabora/edit`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get Collabora edit URL error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get Collabora edit URL',
      timestamp: Date.now()
    };
  }
};

/**
 * Get Collabora view URL for a file (read-only)
 */
export const getCollaboraViewUrl = async (fileId) => {
  try {
    const response = await apiService.get(`/drive/files/${encodeURIComponent(fileId)}/collabora/view`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get Collabora view URL error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get Collabora view URL',
      timestamp: Date.now()
    };
  }
};

export default {
  getCollaboraEditUrl,
  getCollaboraViewUrl
};
