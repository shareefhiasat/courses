import { useState, useCallback, useEffect, useRef } from 'react';
import fileCommentService from '../services/business/fileCommentService';
import fileVersionService from '../services/business/fileVersionService';
import driveSharingService from '../services/business/driveSharingService';

/**
 * Hook for file sidebar operations
 * Handles lazy loading per tab and polling for activities
 */
export function useFileSidebar(fileId, activeTab, isOpen) {
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [versions, setVersions] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const pollIntervalRef = useRef(null);

  /**
   * Load comments
   */
  const loadComments = useCallback(async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    const result = await fileCommentService.getFileComments(fileId);
    
    if (result.success) {
      setComments(result.data || []);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [fileId]);

  /**
   * Load activities
   */
  const loadActivities = useCallback(async () => {
    if (!fileId) return;
    
    const result = await fileCommentService.getFileActivities(fileId);
    
    if (result.success) {
      setActivities(result.data || []);
    }
  }, [fileId]);

  /**
   * Load versions
   */
  const loadVersions = useCallback(async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    const result = await fileVersionService.getFileVersions(fileId);
    
    if (result.success) {
      setVersions(result.data || []);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [fileId]);

  /**
   * Load shares
   */
  const loadShares = useCallback(async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    const result = await driveSharingService.getFileShares(fileId);
    
    if (result.success) {
      setShares(result.data || []);
    } else {
      // Handle 404 gracefully - file might not have shares yet
      if (result.error?.includes('404')) {
        setShares([]);
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  }, [fileId]);

  /**
   * Add comment
   */
  const addComment = useCallback(async (comment) => {
    if (!fileId || !comment) return { success: false };
    
    const result = await fileCommentService.addFileComment(fileId, comment);
    
    if (result.success) {
      await loadComments();
      await loadActivities();
    }
    
    return result;
  }, [fileId, loadComments, loadActivities]);

  /**
   * Delete comment
   */
  const deleteComment = useCallback(async (commentId) => {
    const result = await fileCommentService.deleteFileComment(commentId);
    
    if (result.success) {
      await loadComments();
      await loadActivities();
    }
    
    return result;
  }, [loadComments, loadActivities]);

  /**
   * Restore version
   */
  const restoreVersion = useCallback(async (versionId) => {
    if (!fileId) return { success: false };
    
    const result = await fileVersionService.restoreFileVersion(fileId, versionId);
    
    if (result.success) {
      await loadVersions();
      await loadActivities();
    }
    
    return result;
  }, [fileId, loadVersions, loadActivities]);

  /**
   * Add share
   */
  const addShare = useCallback(async (targetUserId, permissions = 1) => {
    if (!fileId) return { success: false };
    
    const result = await driveSharingService.shareFile(fileId, targetUserId, permissions);
    
    if (result.success) {
      await loadShares();
      await loadActivities();
    }
    
    return result;
  }, [fileId, loadShares, loadActivities]);

  /**
   * Update share permission
   */
  const updateSharePermission = useCallback(async (shareId, permissions) => {
    const result = await driveSharingService.updateSharePermission(shareId, permissions);
    
    if (result.success) {
      await loadShares();
    }
    
    return result;
  }, [loadShares]);

  /**
   * Delete share
   */
  const deleteShare = useCallback(async (shareId) => {
    const result = await driveSharingService.deleteShare(shareId);
    
    if (result.success) {
      await loadShares();
      await loadActivities();
    }
    
    return result;
  }, [loadShares, loadActivities]);

  /**
   * Load data based on active tab
   */
  useEffect(() => {
    if (!isOpen || !fileId) return;

    switch (activeTab) {
      case 'activity':
        loadComments();
        loadActivities();
        break;
      case 'versions':
        loadVersions();
        break;
      case 'sharing':
        loadShares();
        break;
      default:
        break;
    }
  }, [activeTab, fileId, isOpen, loadComments, loadActivities, loadVersions, loadShares]);

  /**
   * Poll activities every 30s when activity tab is open
   */
  useEffect(() => {
    if (isOpen && activeTab === 'activity' && fileId) {
      pollIntervalRef.current = setInterval(() => {
        loadActivities();
        loadComments();
      }, 30000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, activeTab, fileId, loadActivities, loadComments]);

  return {
    comments,
    activities,
    versions,
    shares,
    loading,
    error,
    addComment,
    deleteComment,
    restoreVersion,
    addShare,
    updateSharePermission,
    deleteShare,
    refresh: {
      comments: loadComments,
      activities: loadActivities,
      versions: loadVersions,
      shares: loadShares
    }
  };
}
