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
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get all announcements
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getAnnouncements = async (options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(db, 'announcements'),
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
      collection(db, 'announcements'),
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
    const docSnap = await getDoc(doc(db, 'announcements', announcementId));
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
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createAnnouncement = async (announcementData) => {
  try {
    const docRef = doc(collection(db, 'announcements'));
    await setDoc(docRef, {
      ...announcementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAnnouncement = async (announcementId, announcementData) => {
  try {
    await updateDoc(doc(db, 'announcements', announcementId), {
      ...announcementData,
      updatedAt: serverTimestamp()
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
    await deleteDoc(doc(db, 'announcements', announcementId));
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
      collection(db, 'announcements'),
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
      collection(db, 'announcements'),
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
