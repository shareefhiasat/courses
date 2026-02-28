/**
 * Notification Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for notification records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTION: 'notifications'
 * 
 * @typedef {import('@types/index').Notification} Notification
 * @typedef {import('@types/index').NotificationType} NotificationType
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
import { getCreateAuditData, getUpdateAuditData } from '@utils/auditHelper';
import logger from '@utils/logger';

/**
 * Get notifications for a user - with performance monitoring and memoization
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getNotifications = async (userId, options = {}) => {
  try {
    const { unreadOnly = false, limitCount = 50 } = options;
    const conditions = [where('userId', '==', userId)];
    
    if (unreadOnly) {
      conditions.push(where('read', '==', false));
    }
    
    const q = query(
      collection(db, 'notifications'),
      ...conditions,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: notifications };
  } catch (error) {
    // Check if this is a missing collection error
    if (error.message.includes('Missing or insufficient permissions') || 
        error.code === 'permission-denied' ||
        error.message.includes('No document to update')) {
      logger.warn('[NotificationDbService] Notifications collection not available:', { error: error.message });
      return {
        success: true,
        data: []
      };
    }
    
    logger.error('[NotificationDbService] Error getting notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notification by ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getNotification = async (notificationId) => {
  try {
    const docSnap = await getDoc(doc(db, 'notifications', notificationId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Notification not found' };
  } catch (error) {
    logger.error('[NotificationDbService] Error getting notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create notification
 * @param {Object} notificationData - Notification data
 * @param {Object} user - User object for audit trail
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const create = async (notificationData, user = null) => {
  try {
    const docRef = doc(collection(db, 'notifications'));
    await setDoc(docRef, {
      ...notificationData,
      read: false,
      archived: false,
      ...getCreateAuditData(user || { uid: 'system' })
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[NotificationDbService] Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[NotificationDbService] Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    logger.error('[NotificationDbService] Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Archive notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const archiveNotification = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      archived: true,
      archivedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    logger.error('[NotificationDbService] Error archiving notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    return { success: true };
  } catch (error) {
    logger.error('[NotificationDbService] Error deleting notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real-time listener for user notifications
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onNotificationsChange = (userId, callback) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      callback(notifications);
    });
    
    return unsubscribe;
  } catch (error) {
    logger.error('[NotificationDbService] Error setting up notifications listener:', error);
    return () => {};
  }
};

/**
 * Log notification activity for tracking and debugging
 * @param {Object} activity - Activity data
 * @returns {Promise<{success: boolean, logId?: string, error?: string}>}
 */
export const logNotificationActivity = async (activity) => {
  try {
    const docRef = doc(collection(db, 'notificationLogs'));
    const logEntry = {
      ...activity,
      timestamp: serverTimestamp(),
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    await setDoc(docRef, logEntry);
    
    logger.info('[NotificationDbService] Notification activity logged:', {
      trigger: activity.trigger,
      channel: activity.channel,
      userId: activity.userId,
      success: activity.success
    });
    
    return { success: true, logId: logEntry.id };
  } catch (error) {
    logger.error('[NotificationDbService] Error logging notification activity:', error);
    return { success: false, error: error.message };
  }
};
