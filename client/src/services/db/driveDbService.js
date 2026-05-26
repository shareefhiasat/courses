/**
 * Drive Database Service - MinIO API Client
 * 
 * PURPOSE: Handles all MinIO drive operations via REST API
 * ARCHITECTURE: Browser → API Server → MinIO Service → MinIO
 */

import BaseDbService from '@services/db/baseDbService.js';
import api from '@api';

class DriveDbService extends BaseDbService {
  constructor() {
    super('DriveDbService', 'drive');
  }

  /**
   * Initiate file upload - Get presigned URL
   */
  async initiateUpload(fileData) {
    try {
      const result = await api.post('/drive/upload/initiate', fileData);
      return result;
    } catch (error) {
      this.logError('initiateUpload', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete file upload
   */
  async completeUpload(fileId, versionId) {
    try {
      const result = await api.post(`/drive/upload/${fileId}/complete`, { versionId });
      return result;
    } catch (error) {
      this.logError('completeUpload', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload file directly to MinIO using presigned URL
   */
  async uploadToMinIO(presignedUrl, file, onProgress) {
    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    } catch (error) {
      this.logError('uploadToMinIO', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List files with filters
   */
  async listFiles(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.bucket) params.append('bucket', filters.bucket);
      if (filters.folderPath !== undefined) params.append('folderPath', filters.folderPath);
      if (filters.workflowStatus) params.append('workflowStatus', filters.workflowStatus);

      const result = await api.get(`/drive/files?${params.toString()}`);
      return result;
    } catch (error) {
      this.logError('listFiles', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get file by ID
   */
  async getFile(fileId) {
    try {
      const result = await api.get(`/drive/files/${fileId}`);
      return result;
    } catch (error) {
      this.logError('getFile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update file metadata
   */
  async updateFile(fileId, updates) {
    try {
      const result = await api.put(`/drive/files/${fileId}`, updates);
      return result;
    } catch (error) {
      this.logError('updateFile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId) {
    try {
      const result = await api.delete(`/drive/files/${fileId}`);
      return result;
    } catch (error) {
      this.logError('deleteFile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate public link (v2 endpoint)
   */
  async generatePublicLink(fileId, expiryDays = 7) {
    try {
      const result = await api.post(`/drive/public-links`, { fileId, expiryDays });
      return result;
    } catch (error) {
      this.logError('generatePublicLink', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload new version
   */
  async uploadNewVersion(fileId, versionData) {
    try {
      const result = await api.post(`/drive/files/${fileId}/versions`, versionData);
      return result;
    } catch (error) {
      this.logError('uploadNewVersion', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file versions
   */
  async getVersions(fileId) {
    try {
      const result = await api.get(`/drive/files/${fileId}/versions`);
      return result;
    } catch (error) {
      this.logError('getVersions', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Restore version
   */
  async restoreVersion(versionId) {
    try {
      const result = await api.post(`/drive/versions/${versionId}/restore`);
      return result;
    } catch (error) {
      this.logError('restoreVersion', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Share file
   */
  async shareFile(fileId, shareData) {
    try {
      const result = await api.post(`/drive/files/${fileId}/share`, shareData);
      return result;
    } catch (error) {
      this.logError('shareFile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unshare file
   */
  async unshareFile(shareId) {
    try {
      const result = await api.delete(`/drive/shares/${shareId}`);
      return result;
    } catch (error) {
      this.logError('unshareFile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get shared files
   */
  async getSharedFiles() {
    try {
      const result = await api.get('/drive/shared');
      return result;
    } catch (error) {
      this.logError('getSharedFiles', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Add comment
   */
  async addComment(fileId, comment) {
    try {
      const result = await api.post(`/drive/files/${fileId}/comments`, { comment });
      return result;
    } catch (error) {
      this.logError('addComment', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comments
   */
  async getComments(fileId) {
    try {
      const result = await api.get(`/drive/files/${fileId}/comments`);
      return result;
    } catch (error) {
      this.logError('getComments', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get file by public token
   */
  async getPublicFile(token) {
    try {
      const result = await api.get(`/p/${token}`);
      return result;
    } catch (error) {
      this.logError('getPublicFile', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get storage usage
   */
  async getStorageUsage() {
    try {
      const result = await api.get('/drive/storage');
      return result;
    } catch (error) {
      this.logError('getStorageUsage', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create folder
   */
  async createFolder({ name, bucket, folderPath }) {
    try {
      const result = await api.post('/drive/folders', { name, bucket, folderPath });
      return result;
    } catch (error) {
      this.logError('createFolder', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle star on file
   */
  async toggleStar(fileId) {
    try {
      const result = await api.patch(`/drive/files/${fileId}/star`);
      return result;
    } catch (error) {
      this.logError('toggleStar', error);
      return { success: false, error: error.message };
    }
  }
}

export default new DriveDbService();
