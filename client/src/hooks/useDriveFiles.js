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
  // Handle direct array response (from /drive/shared endpoint)
  if (Array.isArray(payload)) return payload;
  // Handle object with files property
  if (Array.isArray(payload?.files)) return payload.files;
  // Handle response.data being an array
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  return [];
};

const normalizeFoldersPayload = (payload) => {
  if (Array.isArray(payload?.folders)) return payload.folders;
  return [];
};

const normalizeDriveFile = (item) => {
  const file = item?.file || item;
  // For shared files, preserve the permission from the share record
  const permission = item?.permission || file?.permission;
  console.log('[normalizeDriveFile] item.permission:', item?.permission, 'file.permission:', file?.permission, 'final permission:', permission);
  // Map backend isStarred to frontend starred
  if (file && file.isStarred !== undefined) {
    const normalized = { ...file, starred: file.isStarred };
    if (permission) normalized.permission = permission;
    console.log('[normalizeDriveFile] normalized file with permission:', normalized.permission);
    return normalized;
  }
  if (permission) {
    const result = { ...file, permission };
    console.log('[normalizeDriveFile] file with permission added:', result.permission);
    return result;
  }
  console.log('[normalizeDriveFile] returning file without permission');
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
        pageSize: 500,
        _t: Date.now(), // Cache buster
        ...filterParams,
      };

      if (folderId && activeSpace === 'my-drive') {
        params.folderId = folderId;
      }

      // Space-specific defaults (only if not overridden by filters)
      if (activeSpace === 'my-drive') {
        // Only set ownedOnly if not already set by filters
        if (!params.sharedOnly && !params.ownedOnly) params.ownedOnly = 'true';
        if (!folderId) params.rootOnly = 'true';
      } else if (activeSpace === 'starred') {
        // Only set starredOnly if not already set by filters
        if (!params.starredOnly) params.starredOnly = 'true';
      } else if (activeSpace === 'shared') {
        endpoint = `${API_BASE}/shared`;
      } else if (activeSpace === 'shared-by-me') {
        endpoint = `${API_BASE}/shared-by-me`;
      } else if (activeSpace === 'trash') {
        // Only set deletedOnly if not already set by filters
        if (!params.deletedOnly) params.deletedOnly = 'true';
      } else if (activeSpace === 'recent') {
        // Only set sort if not already set by filters
        if (!params.sortField) params.sortField = 'updatedAt';
        if (!params.sortOrder) params.sortOrder = 'desc';
      }

      console.log('[useDriveFiles] fetchFiles endpoint:', endpoint, 'params:', params);
      const response = await apiService.get(endpoint, { params });
      console.log('[useDriveFiles] fetchFiles response:', response);
      if (response.success) {
        // For shared endpoints, data might be in response.data instead of response.payload
        const payload = response.payload || response.data;
        console.log('[useDriveFiles] payload:', payload);
        const files = normalizeFilesPayload(payload).map(normalizeDriveFile).filter(Boolean);
        console.log('[useDriveFiles] normalized files:', files);
        const folders = normalizeFoldersPayload(payload).map(f => ({ ...f, starred: f.isStarred || false })).filter(Boolean);
        // Deduplicate by ID to prevent duplicate key errors
        const uniqueFiles = Array.from(new Map(files.map(f => [f.id, f])).values());
        const uniqueFolders = Array.from(new Map(folders.map(f => [f.id, f])).values());
        setFiles(uniqueFiles);
        // Only set folders if they're present in the response (don't overwrite with empty array)
        if (uniqueFolders.length > 0) {
          setFolders(uniqueFolders);
        }
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
      console.log('[useDriveFiles] fetchFolders called with activeSpace:', activeSpace, 'folderId:', folderId);
      const params = new URLSearchParams();
      if (activeSpace !== 'my-drive') {
        setFolders([]);
        console.log('[useDriveFiles] skipping folders fetch, not my-drive');
        return;
      }
      if (folderId) params.append('parentId', folderId);
      params.append('_t', Date.now()); // Cache buster

      const url = `${API_BASE}/folders?${params.toString()}`;
      console.log('[useDriveFiles] fetching folders from:', url);
      const response = await apiService.get(url);
      console.log('[useDriveFiles] folders response:', response);
      if (response.success) {
        // Map backend isStarred to frontend starred for folders
        const folders = (response.payload || []).map(folder => ({
          ...folder,
          starred: folder.isStarred || false,
        }));
        console.log('[useDriveFiles] setting folders:', folders);
        setFolders(folders);
      }
    } catch (err) {
      console.error('[useDriveFiles] fetch folders failed:', err);
    }
  }, [activeSpace, folderId]);

  const fetchFolderTree = useCallback(async () => {
    try {
      console.log('[useDriveFiles] fetchFolderTree called with activeSpace:', activeSpace);
      if (activeSpace !== 'my-drive') {
        console.log('[useDriveFiles] skipping folder tree fetch, not my-drive');
        return [];
      }
      const url = `${API_BASE}/folders/tree`;
      console.log('[useDriveFiles] fetching folder tree from:', url);
      const response = await apiService.get(url);
      console.log('[useDriveFiles] folder tree response:', response);
      if (response.success) {
        return response.payload || [];
      }
      return [];
    } catch (err) {
      console.error('[useDriveFiles] fetch folder tree failed:', err);
      return [];
    }
  }, [activeSpace]);

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
    console.log('[useDriveFiles] useEffect triggered, activeSpace:', activeSpace, 'folderId:', folderId);
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
    // Optimistic toggle for instant UI feedback
    let newStarred = false;
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      newStarred = !file?.starred;
      return prev.map(f => f.id === fileId ? { ...f, starred: newStarred } : f);
    });

    try {
      const response = await apiService.patch(`${API_BASE}/files/${fileId}/star`);
      if (response.success) {
        refreshFiles();
        return { success: true, newStarred };
      }
      // Revert on failure
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, starred: !newStarred } : f));
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] star failed:', err);
      // Revert on error
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, starred: !newStarred } : f));
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const starFolder = useCallback(async (folderId) => {
    // Optimistic toggle for instant UI feedback
    let newStarred = false;
    setFolders(prev => {
      const folder = prev.find(f => f.id === folderId);
      newStarred = !folder?.starred;
      return prev.map(f => f.id === folderId ? { ...f, starred: newStarred } : f);
    });

    try {
      const response = await apiService.patch(`${API_BASE}/folders/${folderId}/star`);
      if (response.success) {
        refreshFiles();
        return { success: true, newStarred };
      }
      // Revert on failure
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, starred: !newStarred } : f));
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] star folder failed:', err);
      // Revert on error
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, starred: !newStarred } : f));
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
      // Use apiService to get auth headers automatically
      const response = await apiService.get(`${API_BASE}/files/${fileId}/download`, {
        responseType: 'blob'
      });

      console.log('[useDriveFiles] Download response:', { success: response.success, hasData: !!response.data, error: response.error, responseType: typeof response });

      if (!response.success && !response.data) {
        throw new Error(response.error || 'Download failed');
      }

      const blob = response.data || response;
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a hidden anchor tag to trigger download from blob
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = ''; // Let browser determine filename from Content-Disposition
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);

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
        refreshFiles();
        return { success: true, payload: response.data?.payload };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('[useDriveFiles] share failed:', err);
      return { success: false, error: err.message };
    }
  }, [refreshFiles]);

  const createPublicLink = useCallback(async (fileId, linkData) => {
    try {
      const response = await apiService.post(`${API_BASE}/public-links`, {
        fileId,
        ...linkData,
      });
      if (response.success) {
        return { success: true, payload: response.data?.payload || response.data || response.payload };
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
    fetchFolderTree,
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
    shareFolder,
  };
}

export default useDriveFiles;
