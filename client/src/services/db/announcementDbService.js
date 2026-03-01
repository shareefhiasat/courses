/**
 * Announcement Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for announcement records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'announcements'
 * 
 * @typedef {import('@types/index').Announcement} Announcement
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  where
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get all announcements - with performance monitoring and memoization
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAnnouncements = async (options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    logger.debug('Querying announcements collection with options:', options);
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const announcements = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    
    return { success: true, data: announcements };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error getting announcements:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get latest announcement
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getLatestAnnouncement = async () => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { success: true, data: null };
    }
    
    const announcement = { docId: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    return { success: true, data: announcement };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error getting latest announcement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get announcement by ID
 * @param {string} announcementId - Announcement ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getAnnouncement = async (announcementId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS, announcementId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Announcement not found' };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error getting announcement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create announcement
 * @param {Object} announcementData - Announcement data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const create = async (announcementData, user = null) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS));
    await setDoc(docRef, {
      ...announcementData,
      ...getCreateAuditData(user || { uid: 'system' })
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error creating announcement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update announcement
 * @param {string} announcementId - Announcement ID
 * @param {Object} announcementData - Updated announcement data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const update = async (announcementId, announcementData, user = null) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS, announcementId), {
      ...announcementData,
      ...getUpdateAuditData(user || { uid: 'system' })
    });
    return { success: true };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error updating announcement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete announcement
 * @param {string} announcementId - Announcement ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAnnouncement = async (announcementId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS, announcementId));
    return { success: true };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error deleting announcement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for latest announcement
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onLatestAnnouncementChange = (callback) => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const announcement = { docId: change.doc.id, ...change.doc.data() };
          callback(announcement, change.type);
        }
      });
    });
    
    return unsubscribe;
  } catch (error) {
    logger.error('[AnnouncementDbService] Error setting up latest announcement listener:', error);
    return () => {};
  }
};

/**
 * Real-time listener for all announcements
 * @param {Function} callback - Callback function
 * @param {Object} options - Query options
 * @returns {Function} Unsubscribe function
 */
export const onAnnouncementsChange = (callback, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const announcements = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      callback(announcements);
    });
    
    return unsubscribe;
  } catch (error) {
    logger.error('[AnnouncementDbService] Error setting up announcements listener:', error);
    return () => {};
  }
};

/**
 * Get announcements by class
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAnnouncementsByClass = async (classId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS),
      where('classId', '==', classId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const announcements = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: announcements };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error getting announcements by class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get announcements by program
 * @param {string} programId - Program ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAnnouncementsByProgram = async (programId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS),
      where('programId', '==', programId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const announcements = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: announcements };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error getting announcements by program:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active announcements
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getActiveAnnouncements = async (options = {}) => {
  try {
    const { limitCount = 100, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.ANNOUNCEMENTS),
      where('isActive', '==', true),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const announcements = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: announcements };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error getting active announcements:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search announcements
 * @param {string} searchTerm - Search term
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const searchAnnouncements = async (searchTerm) => {
  try {
    // This would typically require a full-text search index
    // For now, get all announcements and filter client-side
    const result = await getAnnouncements({ limitCount: 1000 });
    if (!result.success) {
      return result;
    }
    
    const filteredAnnouncements = result.data.filter(announcement => 
      announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { success: true, data: filteredAnnouncements };
  } catch (error) {
    logger.error('[AnnouncementDbService] Error searching announcements:', error);
    return { success: false, error: error.message };
  }
};
