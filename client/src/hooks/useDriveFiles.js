/**
 * useDriveFiles Hook
 *
 * Manages file listing, filtering, and actions for SmartDrive.
 * Integrates with backend /api/v1/drive endpoints.
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = '/api/v1/drive';

const normalizeFilesPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.files)) return payload.files;
  return [];
};

const normalizeDriveFile = (item) => {
  const file = item?.file || item;
  // Map backend isStarred to frontend starred
  if (file && file.isStarred !== undefined) {
    const normalized = { ...file, starred: file.isStarred };
    // Debug owner data
    console.log('[useDriveFiles] normalizeDriveFile:', {
      fileId: file.id,
      fileName: file.name,
      owner: file.owner,
      ownerId: file.ownerId
    });
    return normalized;
  }
  return file;
};

export function useDriveFiles(activeSpace = 'my-drive', folderId = null) {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFiles = useCallback(async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = `${API_BASE}/files`;
      const params = {
        page: 1,
        pageSize: 50,
        ...filterParams,
      };

      if (folderId && activeSpace === 'my-drive') {
        params.folderId = folderId;
      }

      if (activeSpace === 'my-drive') {
        params.ownedOnly = true;
        if (!folderId) params.rootOnly = true;
      } else if (activeSpace === 'starred') {
        params.starredOnly = true;
      } else if (activeSpace === 'shared') {
        endpoint = `${API_BASE}/shared`;
      } else if (activeSpace === 'trash') {
        params.deletedOnly = true;
      } else if (activeSpace === 'recent') {
        params.sortField = 'updatedAt';
        params.sortOrder = 'desc';
      }

      const response = await axios.get(endpoint, { params });
      if (response.data.success) {
        setFiles(normalizeFilesPayload(response.data.payload).map(normalizeDriveFile).filter(Boolean));
      } else {
        setError(response.data.error?.message || 'Failed to fetch files');
      }
    } catch (err) {
      console.error('[useDriveFiles] fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeSpace, folderId]);

  const fetchFolders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeSpace !== 'my-drive') {
        setFolders([]);
        return;
      }
      if (folderId) params.append('parentId', folderId);

      const url = `${API_BASE}/folders?${params.toString()}`;
      const response = await axios.get(url);
      if (response.data.success) {
        // Map backend isStarred to frontend starred for folders
        const folders = (response.data.payload || []).map(folder => ({
          ...folder,
          starred: folder.isStarred || false,
        }));
        setFolders(folders);
      }
    } catch (err) {
      console.error('[useDriveFiles] fetch folders failed:', err);
    }
  }, [activeSpace, folderId]);

  const getFolderDetails = useCallback(async (targetFolderId) => {
    if (!targetFolderId) {
      return { success: true, payload: { folder: null, breadcrumb: [] } };
    }

    try {
      const response = await axios.get(`${API_BASE}/folders/${targetFolderId}`);
      if (response.data.success) {
        return { success: true, payload: response.data.payload };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] get folder details failed:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, []);

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

  const starFolder = useCallback(async (folderId) => {
    try {
      const response = await axios.patch(`${API_BASE}/folders/${folderId}/star`);
      if (response.data.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] star folder failed:', err);
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
      // Transform shareData to match backend API contract
      const payload = {
        fileId: shareData.fileId || fileId,
        folderId: shareData.folderId || null,
        subjectType: shareData.subjectType, // 'USER' or 'ROLE'
        subjectId: shareData.subjectId, // userId (int) or role (string)
        permission: shareData.permission || 'VIEW',
        expiresAt: shareData.expiresAt || null,
      };

      const response = await axios.post(`${API_BASE}/shares`, payload);
      if (response.data.success) {
        return { success: true, payload: response.data.payload };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] share failed:', err);
      return { success: false, error: err.response?.data?.error || err.message };
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

  const createFolder = useCallback(async (name, parentId = null) => {
    try {
      const response = await axios.post(`${API_BASE}/folders`, {
        name,
        parentId,
      });
      if (response.data.success) {
        fetchFolders();
        return { success: true, payload: response.data.payload };
      }
      return { success: false, error: response.data.error };
    } catch (err) {
      console.error('[useDriveFiles] create folder failed:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, [fetchFolders]);

  return {
    files,
    folders,
    loading,
    error,
    fetchFiles,
    fetchFolders,
    getFolderDetails,
    refreshFiles,
    starFile,
    starFolder,
    trashFile,
    restoreFile,
    permanentDeleteFile,
    downloadFile,
    shareFile,
    createPublicLink,
    createFolder,
  };
}

export default useDriveFiles;
