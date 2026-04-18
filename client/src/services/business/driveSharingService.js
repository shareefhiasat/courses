/**
 * Drive Sharing Service
 * 
 * PURPOSE: Client-side service for file sharing operations
 * ARCHITECTURE: Frontend Service → API Service → Backend API
 */

import { apiService } from '../api/apiService.js';

const serviceName = 'driveSharingService';

/**
 * Share file with specific user
 */
export const shareFile = async (fileId, targetUserId, permissions = 1, expiresAt = null) => {
  try {
    const response = await apiService.post(`/drive/files/${encodeURIComponent(fileId)}/share`, {
      targetUserId,
      permissions,
      expiresAt
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

/**
 * Get file shares
 */
export const getFileShares = async (fileId) => {
  try {
    const response = await apiService.get(`/drive/files/${encodeURIComponent(fileId)}/shares`);
    return {
      success: true,
      data: response.data || [],
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get file shares error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get file shares',
      timestamp: Date.now()
    };
  }
};

/**
 * Update share permissions
 */
export const updateSharePermission = async (shareId, permissions) => {
  try {
    const response = await apiService.put(`/drive/shares/${shareId}`, {
      permissions
    });
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Update share permission error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to update share permission',
      timestamp: Date.now()
    };
  }
};

/**
 * Delete share
 */
export const deleteShare = async (shareId) => {
  try {
    const response = await apiService.delete(`/drive/shares/${shareId}`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Delete share error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete share',
      timestamp: Date.now()
    };
  }
};

export default {
  shareFile,
  getFileShares,
  updateSharePermission,
  deleteShare
};
