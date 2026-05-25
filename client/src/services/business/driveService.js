import { apiService } from '../api/apiService';

/**
 * Drive service for private and shared space file operations
 * Service layer handles all API calls for drive functionality
 */

/**
 * Get private files for a user
 * @param {string} userId - User ID (Keycloak UUID)
 * @returns {Promise<Object>} Response with files data
 */
export async function getPrivateFiles(userId) {
  try {
    const response = await apiService.get(`/drive/private/${userId}/files`);
    return response;
  } catch (error) {
    console.error('[driveService] Get private files error:', error);
    throw error;
  }
}

/**
 * Upload file to private space
 * @param {string} userId - User ID (Keycloak UUID)
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Response with upload result
 */
export async function uploadFilePrivate(userId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiService.post(`/drive/private/${userId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('[driveService] Upload private file error:', error);
    throw error;
  }
}

/**
 * Delete file from private space
 * @param {string} userId - User ID (Keycloak UUID)
 * @param {string} fileId - File ID to delete
 * @returns {Promise<Object>} Response with delete result
 */
export async function deleteFilePrivate(userId, fileId) {
  try {
    const response = await apiService.delete(`/drive/private/${userId}/files/${fileId}`);
    return response;
  } catch (error) {
    console.error('[driveService] Delete private file error:', error);
    throw error;
  }
}

/**
 * Get shared files
 * @returns {Promise<Object>} Response with shared files data
 */
export async function getSharedFiles() {
  try {
    const response = await apiService.get('/drive/shared/files');
    return response;
  } catch (error) {
    console.error('[driveService] Get shared files error:', error);
    throw error;
  }
}

/**
 * Upload file to shared space
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Response with upload result
 */
export async function uploadFileShared(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiService.post('/drive/shared/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('[driveService] Upload shared file error:', error);
    throw error;
  }
}

/**
 * Delete file from shared space
 * @param {string} fileId - File ID to delete
 * @returns {Promise<Object>} Response with delete result
 */
export async function deleteFileShared(fileId) {
  try {
    const response = await apiService.delete(`/drive/shared/files/${fileId}`);
    return response;
  } catch (error) {
    console.error('[driveService] Delete shared file error:', error);
    throw error;
  }
}
