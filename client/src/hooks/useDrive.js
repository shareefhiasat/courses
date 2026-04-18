import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import enhancedDriveService from '../services/business/enhancedDriveService';

/**
 * Hook for drive operations (personal, shared, and workflow spaces)
 * Handles state for files, loading, errors, and CRUD operations
 */
export function useDrive() {
  const { user } = useAuth();
  const [personalFiles, setPersonalFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [sharedWithMeFiles, setSharedWithMeFiles] = useState([]);
  const [workflowFiles, setWorkflowFiles] = useState([]);
  const [publicFiles, setPublicFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  /**
   * Load personal files for the current user
   */
  const loadPersonalFiles = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.getPersonalFiles(user.id);
      if (response.success) {
        setPersonalFiles(response.data || []);
      } else {
        setError(response.error || 'Failed to load personal files');
      }
    } catch (err) {
      setError(err.message || 'Failed to load personal files');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Load shared files
   */
  const loadSharedFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.getSharedFiles();
      if (response.success) {
        setSharedFiles(response.data || []);
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
   * Load workflow files for the current user
   */
  const loadWorkflowFiles = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.getWorkflowFiles(user.id);
      if (response.success) {
        setWorkflowFiles(response.data || []);
      } else {
        setError(response.error || 'Failed to load workflow files');
      }
    } catch (err) {
      setError(err.message || 'Failed to load workflow files');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Load files shared with the current user
   */
  const loadSharedWithMeFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.getSharedWithMe();
      if (response.success) {
        setSharedWithMeFiles(response.data || []);
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
   * Load public files
   */
  const loadPublicFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.getPublicFiles();
      if (response.success) {
        setPublicFiles(response.data || []);
      } else {
        setError(response.error || 'Failed to load public files');
      }
    } catch (err) {
      setError(err.message || 'Failed to load public files');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload file to personal space
   */
  const uploadToPersonal = useCallback(async (file, options = {}) => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.uploadFile(user.id, file, 'private', options);
      if (response.success) {
        await loadPersonalFiles();
        return response.data;
      } else {
        setError(response.error || 'Upload failed');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadPersonalFiles]);

  /**
   * Upload file to shared space
   */
  const uploadToShared = useCallback(async (file, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.uploadFile(null, file, 'shared', options);
      if (response.success) {
        await loadSharedFiles();
        return response.data;
      } else {
        setError(response.error || 'Upload failed');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadSharedFiles]);

  /**
   * Upload file to workflow space
   */
  const uploadToWorkflow = useCallback(async (file, options = {}) => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.uploadFile(user.id, file, 'workflow', options);
      if (response.success) {
        await loadWorkflowFiles();
        return response.data;
      } else {
        setError(response.error || 'Upload failed');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadWorkflowFiles]);

  /**
   * Delete file from personal space
   */
  const deleteFromPersonal = useCallback(async (fileOrPath) => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    // Extract path from file object or use directly
    const filePath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.path;
    const fileName = filePath?.split('/').pop() || filePath;

    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.deleteFile(fileName, 'private', user.id);
      if (response.success) {
        await loadPersonalFiles();
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
  }, [user?.id, loadPersonalFiles]);

  /**
   * Delete file from shared space
   */
  const deleteFromShared = useCallback(async (fileOrPath) => {
    // Extract path from file object or use directly
    const filePath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.path;
    const fileName = filePath?.split('/').pop() || filePath;

    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.deleteFile(fileName, 'shared');
      if (response.success) {
        await loadSharedFiles();
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
  }, [loadSharedFiles]);

  /**
   * Delete file from workflow space
   */
  const deleteFromWorkflow = useCallback(async (fileOrPath) => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    // Extract path from file object or use directly
    const filePath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.path;
    const fileName = filePath?.split('/').pop() || filePath;

    try {
      setLoading(true);
      setError(null);
      const response = await enhancedDriveService.deleteFile(fileName, 'workflow', user.id);
      if (response.success) {
        await loadWorkflowFiles();
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
  }, [user?.id, loadWorkflowFiles]);

  /**
   * Get Collabora URL for editing
   */
  const getCollaboraUrl = useCallback(async (fileId) => {
    try {
      const response = await enhancedDriveService.getCollaboraUrl(fileId);
      if (response.success) {
        return response.data?.collaboraUrl;
      } else {
        setError(response.error || 'Failed to get Collabora URL');
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to get Collabora URL');
      return null;
    }
  }, []);

  /**
   * Load all tabs on mount to show counts immediately
   */
  useEffect(() => {
    loadPersonalFiles();
    loadSharedFiles();
    loadSharedWithMeFiles();
    loadWorkflowFiles();
    loadPublicFiles();
  }, [loadPersonalFiles, loadSharedFiles, loadSharedWithMeFiles, loadWorkflowFiles, loadPublicFiles]);

  /**
   * Reload files when active tab changes
   */
  useEffect(() => {
    if (activeTab === 'personal') {
      loadPersonalFiles();
    } else if (activeTab === 'public') {
      loadPublicFiles();
    } else if (activeTab === 'sharedWithMe') {
      loadSharedWithMeFiles();
    } else if (activeTab === 'workflow') {
      loadWorkflowFiles();
    }
  }, [activeTab, loadPersonalFiles, loadPublicFiles, loadSharedWithMeFiles, loadWorkflowFiles]);

  /**
   * Memoized file counts for each space
   */
  const fileCounts = useMemo(() => ({
    personal: personalFiles.length,
    public: publicFiles.length,
    sharedWithMe: sharedWithMeFiles.length,
    workflow: workflowFiles.length
  }), [personalFiles.length, publicFiles.length, sharedWithMeFiles.length, workflowFiles.length]);

  return {
    personalFiles,
    sharedFiles,
    sharedWithMeFiles,
    workflowFiles,
    publicFiles,
    loading,
    error,
    activeTab,
    setActiveTab,
    fileCounts,
    uploadToPersonal,
    uploadToShared,
    uploadToWorkflow,
    deleteFromPersonal,
    deleteFromShared,
    deleteFromWorkflow,
    getCollaboraUrl,
    refreshPersonal: loadPersonalFiles,
    refreshShared: loadSharedFiles,
    refreshSharedWithMe: loadSharedWithMeFiles,
    refreshWorkflow: loadWorkflowFiles,
    refreshPublic: loadPublicFiles,
  };
}
