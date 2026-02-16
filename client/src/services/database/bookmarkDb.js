import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@services/other/config';
import logger from '@utils/logger';

/**
 * Bookmark Database Service - Pure database operations
 * This layer handles only Firebase/Firestore operations
 * No business logic, validation, or side effects
 */

const COLLECTION_NAME = 'users';

/**
 * Get user document from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<DocumentSnapshot>} User document snapshot
 */
export const getUserDocument = async (userId) => {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc;
  } catch (error) {
    logger.error('[BookmarkDb] Failed to get user document:', error);
    throw error;
  }
};

/**
 * Set user document in Firestore
 * @param {string} userId - User ID
 * @param {Object} data - Data to set
 * @param {Object} options - Firestore options
 * @returns {Promise<void>}
 */
export const setUserDocument = async (userId, data, options = {}) => {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(userDocRef, data, { merge: true, ...options });
  } catch (error) {
    logger.error('[BookmarkDb] Failed to set user document:', error);
    throw error;
  }
};

/**
 * Update user document in Firestore
 * @param {string} userId - User ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export const updateUserDocument = async (userId, data) => {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(userDocRef, data);
  } catch (error) {
    logger.error('[BookmarkDb] Failed to update user document:', error);
    throw error;
  }
};

/**
 * Get user bookmarks from database
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Raw bookmarks data from Firestore
 */
export const getUserBookmarksFromDb = async (userId) => {
  try {
    const userDoc = await getUserDocument(userId);
    const userData = userDoc.data();
    
    const bookmarks = {
      activities: (userData?.bookmarks?.activities) || {},
      resources: (userData?.bookmarks?.resources) || {},
      quizzes: (userData?.bookmarks?.quizzes) || {},
      announcements: (userData?.bookmarks?.announcements) || {},
      channels: (userData?.bookmarks?.channels) || {},
      chats: (userData?.bookmarks?.chats) || {}
    };

    logger.debug('[BookmarkDb] Retrieved bookmarks from database:', {
      userId,
      totalBookmarks: Object.values(bookmarks).reduce((sum, items) => sum + Object.keys(items).length, 0)
    });

    return bookmarks;
  } catch (error) {
    logger.error('[BookmarkDb] Failed to get user bookmarks from database:', error);
    throw error;
  }
};

/**
 * Save user bookmarks to database
 * @param {string} userId - User ID
 * @param {Object} bookmarks - Bookmarks object to save
 * @returns {Promise<void>}
 */
export const saveUserBookmarksToDb = async (userId, bookmarks) => {
  try {
    const bookmarkData = {
      bookmarks: {
        activities: bookmarks.activities || {},
        resources: bookmarks.resources || {},
        quizzes: bookmarks.quizzes || {},
        announcements: bookmarks.announcements || {},
        channels: bookmarks.channels || {},
        chats: bookmarks.chats || {}
      },
      lastBookmarkUpdate: serverTimestamp()
    };

    await setUserDocument(userId, bookmarkData);
    
    logger.debug('[BookmarkDb] Saved bookmarks to database:', {
      userId,
      totalBookmarks: Object.values(bookmarks).reduce((sum, items) => sum + Object.keys(items).length, 0)
    });
  } catch (error) {
    logger.error('[BookmarkDb] Failed to save user bookmarks to database:', error);
    throw error;
  }
};

/**
 * Update specific bookmark type in database
 * @param {string} userId - User ID
 * @param {string} bookmarkType - Type of bookmark (activities, resources, etc.)
 * @param {Object} bookmarkData - Bookmark data for this type
 * @returns {Promise<void>}
 */
export const updateBookmarkTypeInDb = async (userId, bookmarkType, bookmarkData) => {
  try {
    const updateData = {
      [`bookmarks.${bookmarkType}`]: bookmarkData,
      lastBookmarkUpdate: serverTimestamp()
    };

    await updateUserDocument(userId, updateData);
    
    logger.debug('[BookmarkDb] Updated bookmark type in database:', {
      userId,
      bookmarkType,
      itemCount: Object.keys(bookmarkData).length
    });
  } catch (error) {
    logger.error('[BookmarkDb] Failed to update bookmark type in database:', error);
    throw error;
  }
};

/**
 * Set up real-time listener for user bookmarks
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function (bookmarks) => void
 * @returns {Function} Unsubscribe function
 */
export const onUserBookmarksChange = (userId, callback) => {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    
    return onSnapshot(userDocRef, (doc) => {
      const userData = doc.data();
      const bookmarks = {
        activities: (userData?.bookmarks?.activities) || {},
        resources: (userData?.bookmarks?.resources) || {},
        quizzes: (userData?.bookmarks?.quizzes) || {},
        announcements: (userData?.bookmarks?.announcements) || {},
        channels: (userData?.bookmarks?.channels) || {},
        chats: (userData?.bookmarks?.chats) || {}
      };
      
      logger.debug('[BookmarkDb] Real-time bookmark update received:', {
        userId,
        totalBookmarks: Object.values(bookmarks).reduce((sum, items) => sum + Object.keys(items).length, 0)
      });
      
      callback(bookmarks);
    }, (error) => {
      logger.error('[BookmarkDb] Real-time bookmark listener error:', error);
    });
  } catch (error) {
    logger.error('[BookmarkDb] Failed to set up real-time listener:', error);
    throw error;
  }
};

/**
 * Check if user document exists
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user document exists
 */
export const userDocumentExists = async (userId) => {
  try {
    const userDoc = await getUserDocument(userId);
    return userDoc.exists();
  } catch (error) {
    logger.error('[BookmarkDb] Failed to check if user document exists:', error);
    return false;
  }
};

/**
 * Get user metadata related to bookmarks
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User metadata
 */
export const getUserBookmarkMetadata = async (userId) => {
  try {
    const userDoc = await getUserDocument(userId);
    const userData = userDoc.data();
    
    return {
      lastBookmarkUpdate: userData?.lastBookmarkUpdate || null,
      bookmarkMigrated: userData?.bookmarkMigrated || null,
      totalBookmarkCount: Object.values(userData?.bookmarks || {}).reduce(
        (sum, items) => sum + Object.keys(items).length, 0
      )
    };
  } catch (error) {
    logger.error('[BookmarkDb] Failed to get user bookmark metadata:', error);
    throw error;
  }
};

/**
 * Batch operation: Update multiple bookmark types at once
 * @param {string} userId - User ID
 * @param {Object} bookmarkUpdates - Object with bookmark type as key and data as value
 * @returns {Promise<void>}
 */
export const batchUpdateBookmarkTypes = async (userId, bookmarkUpdates) => {
  try {
    const updateData = {
      lastBookmarkUpdate: serverTimestamp()
    };

    // Add each bookmark type to the update
    Object.keys(bookmarkUpdates).forEach(bookmarkType => {
      updateData[`bookmarks.${bookmarkType}`] = bookmarkUpdates[bookmarkType];
    });

    await updateUserDocument(userId, updateData);
    
    logger.debug('[BookmarkDb] Batch updated bookmark types:', {
      userId,
      updatedTypes: Object.keys(bookmarkUpdates)
    });
  } catch (error) {
    logger.error('[BookmarkDb] Failed to batch update bookmark types:', error);
    throw error;
  }
};

/**
 * Delete all bookmarks for a user (for testing/reset purposes)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteAllUserBookmarks = async (userId) => {
  try {
    const updateData = {
      bookmarks: {
        activities: {},
        resources: {},
        quizzes: {},
        announcements: {},
        channels: {},
        chats: {}
      },
      lastBookmarkUpdate: serverTimestamp(),
      bookmarksCleared: serverTimestamp()
    };

    await updateUserDocument(userId, updateData);
    
    logger.info('[BookmarkDb] Cleared all bookmarks for user:', { userId });
  } catch (error) {
    logger.error('[BookmarkDb] Failed to delete all user bookmarks:', error);
    throw error;
  }
};

export default {
  getUserDocument,
  setUserDocument,
  updateUserDocument,
  getUserBookmarksFromDb,
  saveUserBookmarksToDb,
  updateBookmarkTypeInDb,
  onUserBookmarksChange,
  userDocumentExists,
  getUserBookmarkMetadata,
  batchUpdateBookmarkTypes,
  deleteAllUserBookmarks
};
