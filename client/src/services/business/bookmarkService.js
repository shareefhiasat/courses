import { 
  getUserBookmarksFromDb, 
  saveUserBookmarksToDb, 
  onUserBookmarksChange,
  updateBookmarkTypeInDb,
  batchUpdateBookmarkTypes,
  getUserBookmarkMetadata,
  deleteAllUserBookmarks
} from '@services/db/bookmarkDbService';
import { MODE_TYPES } from '@utils/sharedTypes';
import logger from '@utils/logger';

/**
 * Bookmark Service - Business logic layer
 * Handles bookmark operations, validation, and business rules
 * Uses bookmarkDb for all database operations
 */

export const BOOKMARK_TYPES = {
  ACTIVITIES: 'activities',
  RESOURCES: 'resources', 
  QUIZZES: 'quizzes',
  ANNOUNCEMENTS: 'announcements',
  CHANNELS: 'channels', // Future support
  CHATS: 'chats' // Future support
};

export const BOOKMARK_COLLECTIONS = {
  [BOOKMARK_TYPES.ACTIVITIES]: 'userBookmarks',
  [BOOKMARK_TYPES.RESOURCES]: 'userBookmarks', 
  [BOOKMARK_TYPES.QUIZZES]: 'userBookmarks',
  [BOOKMARK_TYPES.ANNOUNCEMENTS]: 'userBookmarks',
  [BOOKMARK_TYPES.CHANNELS]: 'userBookmarks',
  [BOOKMARK_TYPES.CHATS]: 'userBookmarks'
};

/**
 * Get user bookmarks with business logic validation
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Bookmarks object
 */
export const getUserBookmarks = async (userId) => {
  try {
    if (!userId) {
      logger.warn('[BookmarkService] No userId provided for getUserBookmarks');
      return getEmptyBookmarks();
    }

    // Use database layer for data retrieval
    const bookmarks = await getUserBookmarksFromDb(userId);

    logger.debug('[BookmarkService] Loaded and validated bookmarks:', {
      userId,
      totalBookmarks: Object.values(bookmarks).reduce((sum, items) => sum + Object.keys(items).length, 0)
    });

    return bookmarks;
  } catch (error) {
    logger.error('[BookmarkService] Failed to get user bookmarks:', error);
    return getEmptyBookmarks();
  }
};

/**
 * Set up real-time bookmark listener with business logic
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function (bookmarks) => void
 * @returns {Function} Unsubscribe function
 */
export const onBookmarksChange = (userId, callback) => {
  if (!userId) {
    logger.warn('[BookmarkService] No userId provided for onBookmarksChange');
    return () => {};
  }

  try {
    // Use database layer for real-time listener
    return onUserBookmarksChange(userId, (bookmarks) => {
      logger.debug('[BookmarkService] Real-time bookmark update received and processed');
      callback(bookmarks);
    });
  } catch (error) {
    logger.error('[BookmarkService] Failed to set up real-time listener:', error);
    return () => {};
  }
};

/**
 * Validate bookmark metadata
 * @param {Object} metadata - Metadata to validate
 * @returns {boolean} Whether metadata is valid
 */
const validateBookmarkMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return true; // Empty metadata is valid
  
  // Define allowed metadata fields
  const allowedFields = ['mode', 'activityType', 'bookmarkedAt', 'migrated', 'category', 'difficulty'];
  const metadataKeys = Object.keys(metadata);
  
  // Check for disallowed fields
  const hasDisallowedFields = metadataKeys.some(key => !allowedFields.includes(key));
  if (hasDisallowedFields) {
    return false;
  }
  
  // Validate field types and sizes
  if (metadata.mode && typeof metadata.mode !== 'string') return false;
  if (metadata.activityType && typeof metadata.activityType !== 'string') return false;
  if (metadata.bookmarkedAt && (typeof metadata.bookmarkedAt !== 'number' || metadata.bookmarkedAt < 0)) return false;
  if (metadata.category && typeof metadata.category !== 'string') return false;
  if (metadata.difficulty && typeof metadata.difficulty !== 'string') return false;
  
  // Check metadata size (prevent large objects)
  const metadataSize = JSON.stringify(metadata).length;
  if (metadataSize > 1000) { // 1KB limit
    return false;
  }
  
  return true;
};

/**
 * Toggle bookmark for an item with business logic validation
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID to bookmark
 * @param {string} itemType - Item type (activities, resources, quizzes, announcements, etc.)
 * @param {Object} metadata - Optional metadata about the bookmark
 * @returns {Promise<Object>} Result object
 */
export const toggleBookmark = async (userId, itemId, itemType, metadata = {}) => {
  try {
    if (!userId || !itemId || !itemType) {
      throw new Error('Missing required parameters: userId, itemId, itemType');
    }

    if (!Object.values(BOOKMARK_TYPES).includes(itemType)) {
      throw new Error(`Invalid itemType: ${itemType}. Must be one of: ${Object.values(BOOKMARK_TYPES).join(', ')}`);
    }

    // Validate metadata
    if (!validateBookmarkMetadata(metadata)) {
      throw new Error('Invalid bookmark metadata: contains disallowed fields or invalid data types');
    }

    // Get current bookmarks
    const currentBookmarks = await getUserBookmarks(userId);
    const bookmarkObject = currentBookmarks[itemType]?.[itemId];
    // Handle both old format (boolean true) and new format (object with bookmarked field)
    const isBookmarked = bookmarkObject === true || (bookmarkObject?.bookmarked !== false && bookmarkObject !== undefined);
    
        
    // Prepare next bookmarks state with business logic
    const nextBookmarks = { ...currentBookmarks };
    
    if (isBookmarked) {
      // Remove bookmark
      delete nextBookmarks[itemType][itemId];
      logger.debug('[BookmarkService] Removed bookmark:', { userId, itemId, itemType });
    } else {
      // Add bookmark with metadata and business rules
      nextBookmarks[itemType][itemId] = {
        bookmarked: true,
        bookmarkedAt: Date.now(), // Business layer uses client timestamp
        ...metadata
      };
      logger.debug('[BookmarkService] Added bookmark:', { userId, itemId, itemType });
    }

    // Use database layer for saving
    await saveUserBookmarksToDb(userId, nextBookmarks);
    
    
    return {
      success: true,
      isBookmarked: !isBookmarked,
      bookmarks: nextBookmarks,
      timestamp: Date.now()
    };

  } catch (error) {
    logger.error('[BookmarkService] Failed to toggle bookmark:', error);
    return {
      success: false,
      error: error.message,
      timestamp: Date.now()
    };
  }
};

/**
 * Check if an item is bookmarked
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID
 * @param {string} itemType - Item type
 * @returns {Promise<boolean>} Whether the item is bookmarked
 */
export const isBookmarked = async (userId, itemId, itemType) => {
  try {
    const bookmarks = await getUserBookmarks(userId);
    return !!bookmarks[itemType]?.[itemId];
  } catch (error) {
    logger.error('[BookmarkService] Failed to check bookmark status:', error);
    return false;
  }
};

/**
 * Get bookmark count for a specific type
 * @param {Object} bookmarks - Bookmarks object
 * @param {string} itemType - Item type
 * @returns {number} Bookmark count
 */
export const getBookmarkCount = (bookmarks, itemType) => {
  if (!bookmarks || !bookmarks[itemType]) return 0;
  return Object.keys(bookmarks[itemType]).length;
};

/**
 * Get total bookmark count across all types
 * @param {Object} bookmarks - Bookmarks object
 * @returns {number} Total bookmark count
 */
export const getTotalBookmarkCount = (bookmarks) => {
  if (!bookmarks) return 0;
  return Object.values(bookmarks).reduce((total, typeBookmarks) => {
    return total + Object.keys(typeBookmarks).length;
  }, 0);
};

/**
 * Get empty bookmarks object structure
 * @returns {Object} Empty bookmarks object
 */
export const getEmptyBookmarks = () => ({
  activities: {},
  resources: {},
  quizzes: {},
  announcements: {},
  channels: {},
  chats: {}
});

/**
 * Calculate bookmark counts for filter chips
 * @param {Array} items - Items to count
 * @param {Object} bookmarks - Bookmarks object
 * @param {string} mode - Current mode (activities, resources, announcements)
 * @param {string} activityType - Activity type (for activities mode)
 * @returns {number} Bookmark count for current context
 */
export const calculateBookmarkCount = (items, bookmarks, mode, activityType = null) => {
  if (!items || !bookmarks) return 0;
  
  let count = 0;
  
  items.forEach(item => {
    const itemId = item.docId || item.id;
    
    if (mode === MODE_TYPES.ACTIVITIES && activityType === 'quiz') {
      if (bookmarks.quizzes?.[itemId]) count++;
    } else if (mode === MODE_TYPES.ANNOUNCEMENTS) {
      if (bookmarks.announcements?.[itemId]) count++;
    } else {
      if (bookmarks[mode]?.[itemId]) count++;
    }
  });
  
  return count;
};

/**
 * Migrate legacy bookmarks to new format using database layer
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Migration result
 */
export const migrateLegacyBookmarks = async (userId) => {
  try {
    const currentBookmarks = await getUserBookmarks(userId);
    
    // Check if migration is needed (old format didn't have metadata)
    const needsMigration = Object.values(currentBookmarks).some(typeBookmarks => 
      Object.values(typeBookmarks).some(bookmark => 
        typeof bookmark === 'boolean' || !bookmark.bookmarkedAt
      )
    );
    
    if (!needsMigration) {
      return { success: true, migrated: false, message: 'No migration needed' };
    }
    
    // Migrate to new format with metadata (business logic)
    const migratedBookmarks = {};
    Object.keys(currentBookmarks).forEach(type => {
      migratedBookmarks[type] = {};
      Object.keys(currentBookmarks[type]).forEach(itemId => {
        const bookmark = currentBookmarks[type][itemId];
        if (typeof bookmark === 'boolean' || !bookmark.bookmarkedAt) {
          migratedBookmarks[type][itemId] = {
            bookmarked: true,
            bookmarkedAt: Date.now(), // Business layer uses client timestamp
            migrated: true
          };
        } else {
          migratedBookmarks[type][itemId] = bookmark;
        }
      });
    });
    
    // Use database layer for saving migrated bookmarks
    await saveUserBookmarksToDb(userId, migratedBookmarks);
    
    logger.info('[BookmarkService] Bookmarks migrated successfully:', { userId });
    
    return {
      success: true,
      migrated: true,
      bookmarks: migratedBookmarks,
      timestamp: Date.now()
    };
    
  } catch (error) {
    logger.error('[BookmarkService] Failed to migrate bookmarks:', error);
    return {
      success: false,
      error: error.message,
      timestamp: Date.now()
    };
  }
};

export default {
  BOOKMARK_TYPES,
  getUserBookmarks,
  onBookmarksChange,
  toggleBookmark,
  isBookmarked,
  getBookmarkCount,
  getTotalBookmarkCount,
  getEmptyBookmarks,
  calculateBookmarkCount,
  migrateLegacyBookmarks
};
