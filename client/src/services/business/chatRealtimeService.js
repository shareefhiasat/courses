/**
 * Chat Realtime Service - Compatibility Layer
 * 
 * Replaces Firebase Storage/Firestore timestamp with PostgreSQL equivalents
 */

import { info, error, warn, debug } from '@services/utils/logger.js';
import { apiService as apiClient } from '@services/api/apiService.js';

/**
 * Get server timestamp (replaces Firebase serverTimestamp)
 * @returns {string} ISO timestamp
 */
export const getChatServerTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Upload chat file (replaces Firebase Storage upload)
 * @param {string} filePath - File path/key
 * @param {File|Blob} file - File to upload
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<{fileUrl: string, filePath: string}>}
 */
export const uploadChatFile = async (filePath, file, metadata = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filePath', filePath);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await apiClient.post('/drive/chat-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return {
      fileUrl: response.data?.data?.url || response.data?.url || '',
      filePath: response.data?.data?.path || filePath
    };
  } catch (err) {
    error('[chatRealtimeService] Error uploading file:', err);
    // Fallback: create object URL for local preview
    return {
      fileUrl: URL.createObjectURL(file),
      filePath
    };
  }
};

/**
 * Delete chat file (replaces Firebase Storage delete)
 * @param {string} filePath - File path to delete
 * @returns {Promise<boolean>}
 */
export const deleteChatFile = async (filePath) => {
  try {
    await apiClient.delete(`/drive/chat-file?filePath=${encodeURIComponent(filePath)}`);
    return true;
  } catch (err) {
    error('[chatRealtimeService] Error deleting file:', err);
    return false;
  }
};

export default {
  getChatServerTimestamp,
  uploadChatFile,
  deleteChatFile
};
