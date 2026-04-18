/**
 * Personal Drive Service
 * 
 * PURPOSE: Frontend service for personal file management with Nextcloud WebDAV
 * ARCHITECTURE: UI Components → Business Service → Backend API → Nextcloud WebDAV
 */

import { apiService } from '../api/apiService';

const serviceName = 'personalDriveService';

// ==================== FILE OPERATIONS ====================

/**
 * Upload file to user's personal drive or shared space
 * 
 * @param {File} file - File to upload
 * @param {Object} options - Upload options (folder, spaceType, onProgress)
 * @returns {Promise<Object>} - Result object
 */
export const uploadFileToPersonalDrive = async (file, options = {}) => {
  try {
    console.log(`[${serviceName}] Uploading file to personal drive:`, file.name, 'spaceType:', options.spaceType);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', options.folder || 'Uploads');
    formData.append('spaceType', options.spaceType || 'private');
    
    const response = await apiService.post('/workflow/workspace/upload', formData, {
      // Don't set Content-Type - axios will set it automatically with the correct boundary
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      }
    });
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ File uploaded successfully:`, response.data);
    } else {
      console.error(`[${serviceName}] ❌ Failed to upload file:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error uploading file:`, error);
    return {
      success: false,
      error: error.message || 'Failed to upload file',
      data: null
    };
  }
};

/**
 * List files in user's personal drive or shared space
 * 
 * @param {string} folder - Folder path (optional)
 * @param {string} spaceType - 'private' or 'shared' (optional)
 * @returns {Promise<Object>} - Result object
 */
export const listPersonalDriveFiles = async (folder = '', spaceType = 'private') => {
  try {
    console.log(`[${serviceName}] Listing files in folder:`, folder, 'spaceType:', spaceType);
    
    const response = await apiService.get('/workflow/workspace/files', {
      params: { folder, spaceType }
    });
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Retrieved ${response.data?.files?.length || 0} files`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to list files:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error listing files:`, error);
    return {
      success: false,
      error: error.message || 'Failed to list files',
      data: { files: [] }
    };
  }
};

/**
 * Delete file from personal drive
 * 
 * @param {string} filePath - File path to delete
 * @returns {Promise<Object>} - Result object
 */
export const deletePersonalDriveFile = async (filePath) => {
  try {
    console.log(`[${serviceName}] Deleting file:`, filePath);
    
    const response = await apiService.delete('/workflow/workspace/files', {
      data: { filePath }
    });
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ File deleted successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to delete file:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error deleting file:`, error);
    return {
      success: false,
      error: error.message || 'Failed to delete file'
    };
  }
};

/**
 * Share file with other users
 * 
 * @param {string} filePath - File path to share
 * @param {Array<string>} userIds - User IDs to share with
 * @param {Object} options - Share options (permissions, expiration)
 * @returns {Promise<Object>} - Result object
 */
export const sharePersonalDriveFile = async (filePath, userIds, options = {}) => {
  try {
    console.log(`[${serviceName}] Sharing file:`, filePath, 'with users:', userIds);
    
    const response = await apiService.post('/workflow/workspace/share', {
      filePath,
      userIds,
      permissions: options.permissions || 'read',
      expiration: options.expiration
    });
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ File shared successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to share file:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error sharing file:`, error);
    return {
      success: false,
      error: error.message || 'Failed to share file'
    };
  }
};

/**
 * Add comment to file
 * 
 * @param {string} filePath - File path
 * @param {string} comment - Comment text
 * @returns {Promise<Object>} - Result object
 */
export const addFileComment = async (filePath, comment) => {
  try {
    console.log(`[${serviceName}] Adding comment to file:`, filePath);
    
    const response = await apiService.post('/workflow/workspace/comment', {
      filePath,
      comment
    });
    
    if (response.success) {
      console.log(`[${serviceName}] ✅ Comment added successfully`);
    } else {
      console.error(`[${serviceName}] ❌ Failed to add comment:`, response.error);
    }
    
    return response;
    
  } catch (error) {
    console.error(`[${serviceName}] Error adding comment:`, error);
    return {
      success: false,
      error: error.message || 'Failed to add comment'
    };
  }
};

/**
 * Download file from personal drive
 * 
 * @param {string} filePath - File path to download
 * @returns {Promise<Object>} - Result object
 */
export const downloadPersonalDriveFile = async (filePath) => {
  try {
    console.log(`[${serviceName}] Downloading file:`, filePath);
    
    const response = await apiService.get('/workflow/workspace/download', {
      params: { filePath },
      responseType: 'blob'
    });
    
    if (response.success || response instanceof Blob) {
      console.log(`[${serviceName}] ✅ File downloaded successfully`);
      
      // Create download link
      const url = window.URL.createObjectURL(response instanceof Blob ? response : response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } else {
      console.error(`[${serviceName}] ❌ Failed to download file:`, response.error);
      return response;
    }
    
  } catch (error) {
    console.error(`[${serviceName}] Error downloading file:`, error);
    return {
      success: false,
      error: error.message || 'Failed to download file'
    };
  }
};

export default {
  uploadFileToPersonalDrive,
  listPersonalDriveFiles,
  deletePersonalDriveFile,
  sharePersonalDriveFile,
  addFileComment,
  downloadPersonalDriveFile
};
