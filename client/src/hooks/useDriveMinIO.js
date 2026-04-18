import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import driveDbService from '../services/db/driveDbService';

/**
 * Hook for MinIO drive operations (private, shared, and workflow buckets)
 * Handles state for files, loading, errors, and CRUD operations
 */
export function useDriveMinIO() {
  const { user } = useAuth();
  const [privateFiles, setPrivateFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [workflowFiles, setWorkflowFiles] = useState([]);
  const [sharedWithMeFiles, setSharedWithMeFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('private');
  const [storageUsage, setStorageUsage] = useState(0);
  const [storageLimit, setStorageLimit] = useState(500 * 1024 * 1024); // 500 MB default

  /**
   * Load files from a specific bucket
   */
  const loadFiles = useCallback(async (bucket, setter) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveDbService.listFiles({ bucket });
      if (response.success) {
        setter(response.payload || []);
      } else {
        setError(response.error || `Failed to load ${bucket} files`);
      }
    } catch (err) {
      setError(err.message || `Failed to load ${bucket} files`);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load private files
   */
  const loadPrivateFiles = useCallback(() => {
    return loadFiles('lms-private', setPrivateFiles);
  }, [loadFiles]);

  /**
   * Load shared files
   */
  const loadSharedFiles = useCallback(() => {
    return loadFiles('lms-shared', setSharedFiles);
  }, [loadFiles]);

  /**
   * Load workflow files
   */
  const loadWorkflowFiles = useCallback(() => {
    return loadFiles('lms-workflow', setWorkflowFiles);
  }, [loadFiles]);

  /**
   * Load files shared with me
   */
  const loadSharedWithMe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveDbService.getSharedFiles();
      if (response.success) {
        setSharedWithMeFiles(response.payload || []);
      } else {
        setError(response.error || 'Failed to load shared files');
      }
    } catch (err) {
      setError(err.message || 'Failed to load shared files');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload file to MinIO
   */
  const uploadFile = useCallback(async (file, bucket, options = {}) => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      // Step 1: Initiate upload
      const initiateResponse = await driveDbService.initiateUpload({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        bucket,
        folderPath: options.folderPath,
        workflowStatus: options.workflowStatus
      });

      if (!initiateResponse.success) {
        throw new Error(initiateResponse.error || 'Failed to initiate upload');
      }

      const { fileId, presignedUrl } = initiateResponse.payload;

      // Step 2: Upload to MinIO
      await driveDbService.uploadToMinIO(presignedUrl, file, (progress) => {
        setUploadProgress(progress);
      });

      // Step 3: Complete upload
      const completeResponse = await driveDbService.completeUpload(fileId);

      if (!completeResponse.success) {
        throw new Error(completeResponse.error || 'Failed to complete upload');
      }

      // Refresh the appropriate file list
      if (bucket === 'lms-private') await loadPrivateFiles();
      else if (bucket === 'lms-shared') await loadSharedFiles();
      else if (bucket === 'lms-workflow') await loadWorkflowFiles();

      return completeResponse.payload;
    } catch (err) {
      setError(err.message || 'Upload failed');
      return null;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }, [user?.id, loadPrivateFiles, loadSharedFiles, loadWorkflowFiles]);

  /**
   * Delete file
   */
  const deleteFile = useCallback(async (fileId, bucket) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveDbService.deleteFile(fileId);
      
      if (response.success) {
        // Refresh the appropriate file list
        if (bucket === 'lms-private') await loadPrivateFiles();
        else if (bucket === 'lms-shared') await loadSharedFiles();
        else if (bucket === 'lms-workflow') await loadWorkflowFiles();
        return true;
      } else {
        setError(response.error || 'Delete failed');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Delete failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPrivateFiles, loadSharedFiles, loadWorkflowFiles]);

  /**
   * Update file metadata
   */
  const updateFile = useCallback(async (fileId, updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveDbService.updateFile(fileId, updates);
      
      if (response.success) {
        // Refresh all lists as we don't know which bucket it belongs to
        await Promise.all([
          loadPrivateFiles(),
          loadSharedFiles(),
          loadWorkflowFiles()
        ]);
        return response.payload;
      } else {
        setError(response.error || 'Update failed');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Update failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadPrivateFiles, loadSharedFiles, loadWorkflowFiles]);

  /**
   * Share file with another user
   */
  const shareFile = useCallback(async (fileId, sharedWithId, permission = 'VIEW', expiresAt = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveDbService.shareFile(fileId, {
        sharedWithId,
        permission,
        expiresAt
      });
      
      if (response.success) {
        return response.payload;
      } else {
        setError(response.error || 'Share failed');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Share failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Unshare file
   */
  const unshareFile = useCallback(async (shareId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveDbService.unshareFile(shareId);
      
      if (response.success) {
        await loadSharedWithMe();
        return true;
      } else {
        setError(response.error || 'Unshare failed');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Unshare failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSharedWithMe]);

  /**
   * Generate public link
   */
  const generatePublicLink = useCallback(async (fileId, expiryDays = 7) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveDbService.generatePublicLink(fileId, expiryDays);
      
      if (response.success) {
        return response.payload;
      } else {
        setError(response.error || 'Failed to generate public link');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to generate public link');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload new version
   */
  const uploadNewVersion = useCallback(async (fileId, file, changeNote = '') => {
    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      const response = await driveDbService.uploadNewVersion(fileId, {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        changeNote
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to initiate version upload');
      }

      const { presignedUrl } = response.payload;

      // Upload to MinIO
      await driveDbService.uploadToMinIO(presignedUrl, file, (progress) => {
        setUploadProgress(progress);
      });

      return response.payload;
    } catch (err) {
      setError(err.message || 'Version upload failed');
      return null;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }, []);

  /**
   * Get file versions
   */
  const getVersions = useCallback(async (fileId) => {
    try {
      const response = await driveDbService.getVersions(fileId);
      if (response.success) {
        return response.payload || [];
      } else {
        setError(response.error || 'Failed to get versions');
        return [];
      }
    } catch (err) {
      setError(err.message || 'Failed to get versions');
      return [];
    }
  }, []);

  /**
   * Restore version
   */
  const restoreVersion = useCallback(async (versionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveDbService.restoreVersion(versionId);
      
      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Restore failed');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Restore failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add comment to file
   */
  const addComment = useCallback(async (fileId, comment) => {
    try {
      const response = await driveDbService.addComment(fileId, comment);
      if (response.success) {
        return response.payload;
      } else {
        setError(response.error || 'Failed to add comment');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to add comment');
      return null;
    }
  }, []);

  /**
   * Get file comments
   */
  const getComments = useCallback(async (fileId) => {
    try {
      const response = await driveDbService.getComments(fileId);
      if (response.success) {
        return response.payload || [];
      } else {
        setError(response.error || 'Failed to get comments');
        return [];
      }
    } catch (err) {
      setError(err.message || 'Failed to get comments');
      return [];
    }
  }, []);

  /**
   * Fetch storage usage
   */
  const fetchStorageUsage = useCallback(async () => {
    try {
      const response = await driveDbService.getStorageUsage();
      if (response.success) {
        setStorageUsage(response.payload.totalUsage);
        setStorageLimit(response.payload.storageLimit);
      }
    } catch (err) {
      console.error('[useDriveMinIO] Error fetching storage usage:', err);
    }
  }, []);

  /**
   * Load all files on mount
   */
  useEffect(() => {
    loadPrivateFiles();
    loadSharedFiles();
    loadWorkflowFiles();
    loadSharedWithMe();
    fetchStorageUsage();
  }, [loadPrivateFiles, loadSharedFiles, loadWorkflowFiles, loadSharedWithMe, fetchStorageUsage]);

  /**
   * Memoized file counts for each bucket
   */
  const fileCounts = useMemo(() => ({
    private: privateFiles.length,
    shared: sharedFiles.length,
    workflow: workflowFiles.length,
    sharedWithMe: sharedWithMeFiles.length
  }), [privateFiles.length, sharedFiles.length, workflowFiles.length, sharedWithMeFiles.length]);

  return {
    // File lists
    privateFiles,
    sharedFiles,
    workflowFiles,
    sharedWithMeFiles,
    
    // State
    loading,
    uploadProgress,
    error,
    activeTab,
    setActiveTab,
    fileCounts,
    storageUsage,
    storageLimit,
    
    // File operations
    uploadFile,
    deleteFile,
    updateFile,
    
    // Sharing
    shareFile,
    unshareFile,
    generatePublicLink,
    
    // Versioning
    uploadNewVersion,
    getVersions,
    restoreVersion,
    
    // Comments
    addComment,
    getComments,
    
    // Storage
    fetchStorageUsage,
    
    // Refresh functions
    refreshPrivate: loadPrivateFiles,
    refreshShared: loadSharedFiles,
    refreshWorkflow: loadWorkflowFiles,
    refreshSharedWithMe: loadSharedWithMe,
  };
}
