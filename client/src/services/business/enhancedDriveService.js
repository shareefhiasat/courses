/**
 * Enhanced Drive Service
 * 
 * PURPOSE: Unified service for all drive operations (personal, shared, workflow)
 * ARCHITECTURE: Frontend Service → API Service → Backend API → Nextcloud
 */

import { apiService } from '../api/apiService.js';

const serviceName = 'enhancedDriveService';

/**
 * Get personal files for a user
 */
export const getPersonalFiles = async (userId) => {
  try {
    const response = await apiService.get(`/drive/private/${userId}/files`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get personal files error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load personal files',
      timestamp: Date.now()
    };
  }
};

/**
 * Get shared files
 */
export const getSharedFiles = async () => {
  try {
    const response = await apiService.get('/drive/shared/files');
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get shared files error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load shared files',
      timestamp: Date.now()
    };
  }
};

/**
 * Get workflow files for a user
 */
export const getWorkflowFiles = async (userId) => {
  try {
    const response = await apiService.get(`/drive/workflow/${userId}/files`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get workflow files error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load workflow files',
      timestamp: Date.now()
    };
  }
};

/**
 * Get files shared with the current user
 */
export const getSharedWithMe = async () => {
  try {
    const response = await apiService.get('/drive/shared-with-me/files');
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get shared with me error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load shared files',
      timestamp: Date.now()
    };
  }
};

/**
 * Get public files
 */
export const getPublicFiles = async () => {
  try {
    const response = await apiService.get('/drive/public/files');
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get public files error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load public files',
      timestamp: Date.now()
    };
  }
};

/**
 * Upload file to drive (personal, shared, or workflow)
 */
export const uploadFile = async (userId, file, spaceType = 'private', options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    if (options.folder) {
      formData.append('folder', options.folder);
    }

    let endpoint;
    if (spaceType === 'shared') {
      endpoint = '/drive/shared/upload';
    } else if (spaceType === 'workflow') {
      endpoint = `/drive/workflow/${userId}/upload`;
    } else {
      endpoint = `/drive/private/${userId}/upload`;
    }

    const response = await apiService.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: options.onProgress
    });

    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Upload file error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to upload file',
      timestamp: Date.now()
    };
  }
};

/**
 * Delete file from drive
 */
export const deleteFile = async (fileId, spaceType, userId) => {
  try {
    let endpoint;
    if (spaceType === 'shared') {
      endpoint = `/drive/shared/files/${fileId}`;
    } else {
      endpoint = `/drive/private/${userId}/files/${fileId}`;
    }
    
    const response = await apiService.delete(endpoint);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Delete file error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete file',
      timestamp: Date.now()
    };
  }
};

/**
 * Get Collabora editing URL for a file
 */
export const getCollaboraUrl = async (fileId) => {
  try {
    const response = await apiService.get(`/drive/collabora/${fileId}`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get Collabora URL error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get Collabora URL',
      timestamp: Date.now()
    };
  }
};

/**
 * Share file with other users
 */
export const shareFile = async (fileId, userIds, permissions = 'read') => {
  try {
    const response = await apiService.post('/drive/share', {
      fileId,
      userIds,
      permissions
    });
    
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Share file error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to share file',
      timestamp: Date.now()
    };
  }
};

export default {
  getPersonalFiles,
  getSharedFiles,
  getSharedWithMe,
  getWorkflowFiles,
  getPublicFiles,
  uploadFile,
  deleteFile,
  getCollaboraUrl,
  shareFile
};
