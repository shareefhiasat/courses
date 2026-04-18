/**
 * File Comment Service
 * 
 * PURPOSE: Client-side service for file comments and activity operations
 * ARCHITECTURE: Frontend Service → API Service → Backend API
 */

import { apiService } from '../api/apiService.js';

const serviceName = 'fileCommentService';

/**
 * Get file comments
 */
export const getFileComments = async (fileId) => {
  try {
    const response = await apiService.get(`/drive/files/${encodeURIComponent(fileId)}/comments`);
    return {
      success: true,
      data: response.data || [],
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get file comments error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get file comments',
      timestamp: Date.now()
    };
  }
};

/**
 * Add file comment
 */
export const addFileComment = async (fileId, comment) => {
  try {
    const response = await apiService.post(`/drive/files/${encodeURIComponent(fileId)}/comments`, {
      comment
    });
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Add file comment error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to add comment',
      timestamp: Date.now()
    };
  }
};

/**
 * Delete file comment
 */
export const deleteFileComment = async (commentId) => {
  try {
    const response = await apiService.delete(`/drive/comments/${commentId}`);
    return {
      success: true,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Delete file comment error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete comment',
      timestamp: Date.now()
    };
  }
};

/**
 * Get file activities
 */
export const getFileActivities = async (fileId, limit = 50) => {
  try {
    const response = await apiService.get(`/drive/files/${encodeURIComponent(fileId)}/activities`, {
      params: { limit }
    });
    return {
      success: true,
      data: response.data || [],
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get file activities error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get file activities',
      timestamp: Date.now()
    };
  }
};

/**
 * Get file activity statistics
 */
export const getFileActivityStats = async (fileId) => {
  try {
    const response = await apiService.get(`/drive/files/${encodeURIComponent(fileId)}/activity-stats`);
    return {
      success: true,
      data: response.data || {},
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`[${serviceName}] Get file activity stats error:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get activity stats',
      timestamp: Date.now()
    };
  }
};

export default {
  getFileComments,
  addFileComment,
  deleteFileComment,
  getFileActivities,
  getFileActivityStats
};
