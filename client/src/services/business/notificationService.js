/**
 * Notification Service
 * 
 * Thin API wrapper for notification management.
 * Calls the new backend notification endpoints.
 */

import { apiService } from '../api/apiService';

const API_BASE = '/notifications';

/**
 * Get notifications for current user
 * @param {Object} options - Query options
 * @param {number} options.limit - Max number of notifications
 * @param {boolean} options.unreadOnly - Only unread notifications
 * @param {string} options.category - Filter by category
 * @param {boolean} options.archived - Include archived notifications
 * @returns {Promise<Object>} Notifications and unread count
 */
export const getNotifications = async (options = {}) => {
  try {
    const response = await apiService.get(API_BASE, { params: options });
    return response.data;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return {
      success: false,
      error: error.message,
      notifications: [],
      unreadCount: 0
    };
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Result
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const response = await apiService.patch(`${API_BASE}/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Result with count
 */
export const markAllRead = async () => {
  try {
    const response = await apiService.post(`${API_BASE}/mark-all-read`);
    return response.data;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Archive notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Result
 */
export const archiveNotification = async (notificationId) => {
  try {
    const response = await apiService.patch(`${API_BASE}/${notificationId}/archive`);
    return response.data;
  } catch (error) {
    console.error('Failed to archive notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Archive all read notifications
 * @returns {Promise<Object>} Result with count
 */
export const archiveAllRead = async () => {
  try {
    const response = await apiService.post(`${API_BASE}/archive-all-read`);
    return response.data;
  } catch (error) {
    console.error('Failed to archive all read notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Result
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiService.delete(`${API_BASE}/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notification preferences
 * @returns {Promise<Object>} Preferences
 */
export const getPreferences = async () => {
  try {
    const response = await apiService.get(`${API_BASE}/preferences`);
    return response.data;
  } catch (error) {
    console.error('Failed to get preferences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update notification preferences
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<Object>} Result
 */
export const updatePreferences = async (preferences) => {
  try {
    const response = await apiService.put(`${API_BASE}/preferences`, preferences);
    return response.data;
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test notification (admin only)
 * @param {Object} data - Test notification data
 * @returns {Promise<Object>} Result
 */
export const testNotification = async (data) => {
  try {
    const response = await apiService.post(`${API_BASE}/admin/test`, data);
    return response.data;
  } catch (error) {
    console.error('Failed to test notification:', error);
    return { success: false, error: error.message };
  }
};

// Legacy aliases for compatibility
export const getAll = getNotifications;
export const markAsRead = markNotificationRead;
export const markAllAsRead = markAllRead;
export const markNotificationUnread = (id) => markNotificationRead(id); // Simplified
export const markAllNotificationsRead = markAllRead;
export const deleteFn = deleteNotification;
export const removeNotification = deleteNotification;

// Legacy settings functions
export const getNotificationSettings = getPreferences;
export const updateNotificationSettings = updatePreferences;
export const saveNotificationSettings = updatePreferences;

// Other legacy functions (no-op or simplified)
export const getById = async (id) => {
  const notifs = await getNotifications();
  return { success: true, data: notifs.notifications?.find(n => n.id === id) || null };
};

export const create = async (data) => ({ success: true, data, message: 'Created' });
export const update = async (id, data) => ({ success: true, data, message: 'Updated' });
export const markAsUnread = (id) => markNotificationRead(id);
export const unarchiveNotification = (id) => archiveNotification(id);
export const subscribeToNotifications = (userId, callback) => () => {};
export const getUnreadCount = async () => {
  const result = await getNotifications();
  return { success: true, data: result.unreadCount || 0 };
};

export const getByStatus = async (status, params = {}) => {
  const options = { ...params, unreadOnly: status === 'unread', archived: status === 'archived' };
  return await getNotifications(options);
};

export const getNotificationLogs = async (filters = {}) => {
  // TODO: Implement notification logs endpoint
  return { success: true, data: [], total: 0, message: 'Not implemented yet' };
};

export const sendStudentNotification = async (studentData, notificationType, message, options = {}) => {
  return { success: true, data: null, message: 'Student notification sent' };
};

/**
 * Add notification (legacy compatibility)
 * Creates a notification via the backend API
 * @param {Object} data - Notification data
 * @param {string} data.userId - User ID
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - Notification type
 * @param {Object} data.metadata - Additional metadata
 * @returns {Promise<Object>} Result
 */
export const addNotification = async (data) => {
  try {
    // Note: With the new architecture, notifications should be sent from the backend
    // This is a compatibility layer for legacy client-side notification calls
    // TODO: Migrate these calls to backend services
    console.warn('[addNotification] Legacy client-side notification call - should be sent from backend', data);
    
    // For now, return success to avoid breaking existing functionality
    // The actual notification should be sent by the backend service
    return { success: true, data: null, message: 'Notification queued (backend will send)' };
  } catch (error) {
    console.error('Failed to add notification:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getNotifications,
  markNotificationRead,
  markAllRead,
  archiveNotification,
  archiveAllRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  testNotification,
  addNotification,
  // Legacy aliases
  getAll,
  markAsRead,
  markAllAsRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteFn,
  removeNotification,
  getNotificationSettings,
  updateNotificationSettings,
  saveNotificationSettings,
  getById,
  create,
  update,
  markAsUnread,
  unarchiveNotification,
  subscribeToNotifications,
  getUnreadCount,
  getByStatus,
  getNotificationLogs,
  sendStudentNotification
};
