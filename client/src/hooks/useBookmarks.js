import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { 
  getUserBookmarks, 
  onBookmarksChange, 
  toggleBookmark, 
  isBookmarked,
  calculateBookmarkCount,
  getEmptyBookmarks
} from '@services/business/bookmarkService';
import logger from '@utils/logger';

/**
 * Custom hook for bookmark management
 * Provides bookmark state and operations for any component
 */

export const useBookmarks = (options = {}) => {
  const { user } = useAuth();
  const { 
    enableRealtime = true,
    autoMigrate = true 
  } = options;
  
  const [bookmarks, setBookmarks] = useState(getEmptyBookmarks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial bookmarks
  useEffect(() => {
    if (!user?.uid) {
      setBookmarks(getEmptyBookmarks());
      setLoading(false);
      return;
    }

    const loadBookmarks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userBookmarks = await getUserBookmarks(user.uid);
        setBookmarks(userBookmarks);
        
        logger.debug('[useBookmarks] Bookmarks loaded:', {
          userId: user.uid,
          totalBookmarks: Object.values(userBookmarks).reduce((sum, items) => sum + Object.keys(items).length, 0)
        });
        
      } catch (err) {
        logger.error('[useBookmarks] Failed to load bookmarks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [user?.uid]);

  // Set up real-time listener
  useEffect(() => {
    if (!user?.uid || !enableRealtime) return;

    const unsubscribe = onBookmarksChange(user.uid, (updatedBookmarks) => {
      setBookmarks(updatedBookmarks);
      logger.debug('[useBookmarks] Real-time bookmark update received');
    });

    return unsubscribe;
  }, [user?.uid, enableRealtime]);

  // Toggle bookmark function
  const handleToggleBookmark = useCallback(async (itemId, itemType, metadata = {}) => {
    if (!user?.uid) {
      logger.warn('[useBookmarks] Cannot toggle bookmark: no user');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await toggleBookmark(user.uid, itemId, itemType, metadata);
      
      if (result.success) {
        // Update local state immediately for better UX
        setBookmarks(prevBookmarks => {
          const nextBookmarks = { ...prevBookmarks };
          if (result.isBookmarked) {
            nextBookmarks[itemType][itemId] = {
              bookmarked: true,
              bookmarkedAt: Date.now(),
              ...metadata
            };
          } else {
            delete nextBookmarks[itemType][itemId];
          }
          return nextBookmarks;
        });
        
        logger.debug('[useBookmarks] Bookmark toggled successfully:', {
          itemId,
          itemType,
          isBookmarked: result.isBookmarked
        });
      }
      
      return result;
      
    } catch (err) {
      logger.error('[useBookmarks] Failed to toggle bookmark:', err);
      return { success: false, error: err.message };
    }
  }, [user?.uid]);

  // Check if item is bookmarked
  const checkIsBookmarked = useCallback((itemId, itemType) => {
    return !!bookmarks[itemType]?.[itemId];
  }, [bookmarks]);

  // Get bookmark count for specific type
  const getBookmarkCountForType = useCallback((itemType) => {
    return Object.keys(bookmarks[itemType] || {}).length;
  }, [bookmarks]);

  // Get total bookmark count
  const getTotalBookmarkCount = useCallback(() => {
    return Object.values(bookmarks).reduce((total, typeBookmarks) => {
      return total + Object.keys(typeBookmarks).length;
    }, 0);
  }, [bookmarks]);

  // Calculate bookmark count for filter chips
  const calculateFilterBookmarkCount = useCallback((items, mode, activityType = null) => {
    return calculateBookmarkCount(items, bookmarks, mode, activityType);
  }, [bookmarks]);

  // Get bookmarked items for a specific type
  const getBookmarkedItems = useCallback((itemType, allItems = []) => {
    const bookmarkedIds = Object.keys(bookmarks[itemType] || {});
    return allItems.filter(item => {
      const itemId = item.docId || item.id;
      return bookmarkedIds.includes(itemId);
    });
  }, [bookmarks]);

  // Clear all bookmarks (for testing/reset)
  const clearAllBookmarks = useCallback(async () => {
    if (!user?.uid) return { success: false, error: 'User not authenticated' };
    
    try {
      // This would need to be implemented in the service
      logger.warn('[useBookmarks] clearAllBookmarks not implemented yet');
      return { success: false, error: 'Not implemented' };
    } catch (err) {
      logger.error('[useBookmarks] Failed to clear bookmarks:', err);
      return { success: false, error: err.message };
    }
  }, [user?.uid]);

  // Memoized values
  const bookmarkCounts = useMemo(() => ({
    activities: getBookmarkCountForType('activities'),
    resources: getBookmarkCountForType('resources'),
    quizzes: getBookmarkCountForType('quizzes'),
    announcements: getBookmarkCountForType('announcements'),
    channels: getBookmarkCountForType('channels'),
    chats: getBookmarkCountForType('chats'),
    total: getTotalBookmarkCount()
  }), [getBookmarkCountForType, getTotalBookmarkCount]);

  return {
    // State
    bookmarks,
    loading,
    error,
    bookmarkCounts,
    
    // Actions
    toggleBookmark: handleToggleBookmark,
    isBookmarked: checkIsBookmarked,
    
    // Utilities
    getBookmarkCountForType,
    getTotalBookmarkCount,
    calculateFilterBookmarkCount,
    getBookmarkedItems,
    clearAllBookmarks
  };
};

export default useBookmarks;
