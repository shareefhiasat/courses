import { info, error, warn, debug } from '@services/utils/logger.js';

const STORAGE_KEY = 'bookmarks';

const getStoredBookmarks = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getEmptyBookmarks();
  } catch {
    return getEmptyBookmarks();
  }
};

const setStoredBookmarks = (bookmarks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (err) {
    error('[bookmarkService] Failed to store bookmarks:', err);
  }
};

export const getBookmarks = async (options = {}) => {
  try {
    const bookmarks = getStoredBookmarks();
    return {
      success: true,
      data: bookmarks,
      total: Object.values(bookmarks).reduce((sum, items) => sum + Object.keys(items).length, 0)
    };
  } catch (error) {
    error('[bookmarkService] getBookmarks error:', error);
    return {
      success: false,
      error: error.message,
      data: getEmptyBookmarks()
    };
  }
};

export const getUserBookmarks = async (userId, options = {}) => {
  try {
    const bookmarks = getStoredBookmarks();
    return {
      success: true,
      data: bookmarks,
      total: Object.values(bookmarks).reduce((sum, items) => sum + Object.keys(items).length, 0)
    };
  } catch (error) {
    error('[bookmarkService] getUserBookmarks error:', error);
    return {
      success: false,
      error: error.message,
      data: getEmptyBookmarks()
    };
  }
};

export const onBookmarksChange = (userId, onUpdate, onError) => {
  // Listen for storage events from other tabs
  const handleStorageChange = (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const updatedBookmarks = JSON.parse(e.newValue);
        onUpdate(updatedBookmarks);
      } catch (err) {
        onError(err);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

export const toggleBookmark = async (userId, itemId, itemType, metadata = {}) => {
  try {
    const bookmarks = getStoredBookmarks();
    
    if (!bookmarks[itemType]) {
      bookmarks[itemType] = {};
    }
    
    const isBookmarked = !!bookmarks[itemType][itemId];
    
    if (isBookmarked) {
      delete bookmarks[itemType][itemId];
    } else {
      bookmarks[itemType][itemId] = {
        bookmarked: true,
        bookmarkedAt: Date.now(),
        userId,
        ...metadata
      };
    }
    
    setStoredBookmarks(bookmarks);
    
    debug('[bookmarkService] Bookmark toggled:', {
      itemId,
      itemType,
      isBookmarked: !isBookmarked
    });
    
    return {
      success: true,
      isBookmarked: !isBookmarked
    };
  } catch (error) {
    error('[bookmarkService] toggleBookmark error:', error);
    return {
      success: false,
      isBookmarked: false,
      error: error.message
    };
  }
};

export const isBookmarked = async (userId, itemId, itemType) => {
  try {
    const bookmarks = getStoredBookmarks();
    const bookmarked = !!bookmarks[itemType]?.[itemId];
    return {
      success: true,
      bookmarked
    };
  } catch (error) {
    error('[bookmarkService] isBookmarked error:', error);
    return {
      success: false,
      bookmarked: false,
      error: error.message
    };
  }
};
export const calculateBookmarkCount = (items = [], bookmarks = {}, mode = 'activities', activityType = null) => {
  try {
    const bookmarkedIds = new Set();
    
    if (mode === 'activities' || mode === 'quiz') {
      const activityBookmarks = bookmarks.activities || {};
      Object.keys(activityBookmarks).forEach(id => bookmarkedIds.add(id));
    } else if (mode === 'resources') {
      const resourceBookmarks = bookmarks.resources || {};
      Object.keys(resourceBookmarks).forEach(id => bookmarkedIds.add(id));
    } else if (mode === 'announcements') {
      const announcementBookmarks = bookmarks.announcements || {};
      Object.keys(announcementBookmarks).forEach(id => bookmarkedIds.add(id));
    }
    
    const count = items.filter(item => {
      const itemId = item.docId || item.id;
      return bookmarkedIds.has(itemId);
    }).length;
    
    return count;
  } catch (err) {
    console.warn('[bookmarkService] calculateBookmarkCount error:', err);
    return 0;
  }
};
export const getEmptyBookmarks = () => ({
  activities: {},
  resources: {},
  announcements: {},
  quizzes: {}
});

export default {
  getBookmarks,
  getUserBookmarks,
  onBookmarksChange,
  toggleBookmark,
  isBookmarked,
  calculateBookmarkCount,
  getEmptyBookmarks,
};
