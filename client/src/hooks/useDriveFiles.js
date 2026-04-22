/**
 * useDriveFiles Hook
 *
 * Manages file listing, filtering, and actions for SmartDrive.
 * Integrates with backend /api/v1/drive endpoints.
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = '/api/v1/drive';

export function useDriveFiles(activeSpace = 'my-drive', folderId = null) {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = `${API_BASE}/files`;
      const params = new URLSearchParams();

      if (folderId) {
        params.append('folderId', folderId);
      }

      if (activeSpace === 'starred') {
        params.append('starred', 'true');
      } else if (activeSpace === 'shared') {
        endpoint = `${API_BASE}/shared`;
      } else if (activeSpace === 'trash') {
        params.append('deleted', 'true');
      } else if (activeSpace === 'recent') {
        params.append('limit', '20');
        params.append('sortBy', 'updatedAt');
        params.append('sortOrder', 'desc');
      }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const response = await axios.get(url);
      if (response.data.success) {
        setFiles(response.data.payload || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch files');
      }
    } catch (err) {
      console.error('[useDriveFiles] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [activeSpace, folderId]);

  const fetchFolders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (folderId) params.append('parentId', folderId);

      const url = `${API_BASE}/folders?${params.toString()}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setFolders(response.data.payload || []);
      }
    } catch (err) {
      console.error('[useDriveFiles] fetch folders failed:', err);
    }
  }, [folderId]);

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, [fetchFiles, fetchFolders]);

  const refreshFiles = useCallback(() => {
    fetchFiles();
    fetchFolders();
  }, [fetchFiles, fetchFolders]);

  // --------------------------------------------------------------------------
  // File Actions
  // --------------------------------------------------------------------------

  const starFile = useCallback(async (fileId) => {
    try {
      const response = await axios.patch(`${API_BASE}/files/${fileId}/star`);
      if (response.data.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] star failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const trashFile = useCallback(async (fileId) => {
    try {
      const response = await axios.delete(`${API_BASE}/files/${fileId}/trash`);
      if (response.data.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] trash failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const restoreFile = useCallback(async (fileId) => {
    try {
      const response = await axios.post(`${API_BASE}/files/${fileId}/restore`);
      if (response.data.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] restore failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const permanentDeleteFile = useCallback(async (fileId) => {
    try {
      const response = await axios.delete(`${API_BASE}/files/${fileId}/permanent`);
      if (response.data.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] permanent delete failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const downloadFile = useCallback(async (fileId) => {
    try {
      // Use proxy download endpoint for secure streaming.
      window.open(`${API_BASE}/files/${fileId}/download`, '_blank');
      return { success: true };
    } catch (err) {
      console.error('[useDriveFiles] download failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const shareFile = useCallback(async (fileId, shareData) => {
    try {
      const response = await axios.post(`${API_BASE}/shares`, {
        fileId,
        ...shareData,
      });
      if (response.data.success) {
        return { success: true, payload: response.data.payload };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] share failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const createPublicLink = useCallback(async (fileId, linkData) => {
    try {
      const response = await axios.post(`${API_BASE}/public-links`, {
        fileId,
        ...linkData,
      });
      if (response.data.success) {
        return { success: true, payload: response.data.payload };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] create public link failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    files,
    folders,
    loading,
    error,
    refreshFiles,
    starFile,
    trashFile,
    restoreFile,
    permanentDeleteFile,
    downloadFile,
    shareFile,
    createPublicLink,
  };
}

export default useDriveFiles;
