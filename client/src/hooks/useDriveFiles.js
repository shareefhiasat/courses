/**
 * useDriveFiles Hook
 *
 * Manages file listing, filtering, and actions for SmartDrive.
 * Integrates with backend /api/v1/drive endpoints.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@services/api/apiService';

const API_BASE = '/drive';

const normalizeFilesPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.files)) return payload.files;
  return [];
};

const normalizeFoldersPayload = (payload) => {
  if (Array.isArray(payload?.folders)) return payload.folders;
  return [];
};

const normalizeDriveFile = (item) => {
  const file = item?.file || item;
  // Map backend isStarred to frontend starred
  if (file && file.isStarred !== undefined) {
    const normalized = { ...file, starred: file.isStarred };
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
        if (!params.sharedOnly) params.ownedOnly = 'true';
        if (!folderId) params.rootOnly = 'true';
      } else if (activeSpace === 'starred') {
        params.starredOnly = 'true';
      } else if (activeSpace === 'shared') {
        endpoint = `${API_BASE}/shared`;
      } else if (activeSpace === 'shared-by-me') {
        endpoint = `${API_BASE}/shared-by-me`;
      } else if (activeSpace === 'trash') {
        params.deletedOnly = 'true';
      } else if (activeSpace === 'recent') {
        params.sortField = 'updatedAt';
        params.sortOrder = 'desc';
      }

      const response = await apiService.get(endpoint, { params });
      if (response.success) {
        const payload = response.payload;
        const files = normalizeFilesPayload(payload).map(normalizeDriveFile).filter(Boolean);
        const folders = normalizeFoldersPayload(payload).map(f => ({ ...f, starred: f.isStarred || false })).filter(Boolean);
        // Deduplicate by ID to prevent duplicate key errors
        const uniqueFiles = Array.from(new Map(files.map(f => [f.id, f])).values());
        const uniqueFolders = Array.from(new Map(folders.map(f => [f.id, f])).values());
        setFiles(uniqueFiles);
        setFolders(uniqueFolders);
      } else {
        setError(response.error?.message || 'Failed to fetch files');
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
      const response = await apiService.get(url);
      if (response.success) {
        // Map backend isStarred to frontend starred for folders
        const folders = (response.payload || []).map(folder => ({
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
      const response = await apiService.get(`${API_BASE}/folders/${targetFolderId}`);
      console.log('[useDriveFiles] getFolderDetails response:', response);
      if (response.success) {
        return { success: true, payload: response.payload };
      }
      return { success: false, error: response.error };
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
      const response = await apiService.patch(`${API_BASE}/files/${fileId}/star`);
      if (response.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] star failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const starFolder = useCallback(async (folderId) => {
    try {
      const response = await apiService.patch(`${API_BASE}/folders/${folderId}/star`);
      if (response.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] star folder failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const trashFile = useCallback(async (fileId) => {
    try {
      const response = await apiService.delete(`${API_BASE}/files/${fileId}/trash`);
      if (response.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] trash failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const restoreFile = useCallback(async (fileId) => {
    try {
      const response = await apiService.post(`${API_BASE}/files/${fileId}/restore`);
      if (response.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] restore failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const permanentDeleteFile = useCallback(async (fileId) => {
    try {
      const response = await apiService.delete(`${API_BASE}/files/${fileId}/permanent`);
      if (response.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.error };
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

      const response = await apiService.post(`${API_BASE}/shares`, payload);
      if (response.success) {
        return { success: true, payload: response.data?.payload };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] share failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const createPublicLink = useCallback(async (fileId, linkData) => {
    try {
      const response = await apiService.post(`${API_BASE}/public-links`, {
        fileId,
        ...linkData,
      });
      if (response.success) {
        return { success: true, payload: response.data?.payload };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] create public link failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const createFolder = useCallback(async (name, parentId = null) => {
    try {
      const response = await apiService.post(`${API_BASE}/folders`, {
        name,
        parentId,
      });
      if (response.success) {
        fetchFolders();
        return { success: true, payload: response.data?.payload };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] create folder failed:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, [fetchFolders]);

  const renameFolder = useCallback(async (folderId, newName) => {
    try {
      const response = await apiService.patch(`${API_BASE}/folders/${folderId}`, {
        name: newName,
      });
      if (response.success) {
        fetchFolders();
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] rename folder failed:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, [fetchFolders]);

  const renameFile = useCallback(async (fileId, newName) => {
    try {
      const response = await apiService.put(`${API_BASE}/files/${fileId}`, {
        name: newName,
      });
      if (response.success) {
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] rename file failed:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, [refreshFiles]);

  const deleteFolder = useCallback(async (folderId) => {
    try {
      const response = await apiService.delete(`${API_BASE}/folders/${folderId}/trash`);
      if (response.success) {
        fetchFolders();
        refreshFiles();
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] delete folder failed:', err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  }, [fetchFolders, refreshFiles]);

  const downloadFolder = useCallback(async (folderId) => {
    try {
      window.open(`${API_BASE}/folders/${folderId}/download`, '_blank');
      return { success: true };
    } catch (err) {
      console.error('[useDriveFiles] download folder failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const shareFolder = useCallback(async (folderId, shareData) => {
    try {
      const payload = {
        folderId,
        subjectType: shareData.subjectType,
        subjectId: shareData.subjectId,
        permission: shareData.permission || 'VIEW',
        expiresAt: shareData.expiresAt || null,
      };
      const response = await apiService.post(`${API_BASE}/shares`, payload);
      if (response.success) {
        return { success: true, payload: response.data?.payload };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] share folder failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

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
    renameFolder,
    renameFile,
    deleteFolder,
    downloadFolder,
    shareFolder,
  };
}

export default useDriveFiles;
