/**
 * Notifications Business Service
 * 
 * PURPOSE:
 * Business logic layer for notification-related operations
 * Handles real-time notifications, subscriptions, and notification management
 */

const { info, error, warn, debug } = require('../utils/logger.js');

const serviceName = 'notificationsBusinessService';

// Mock notification storage (in real app, this would be database/websocket)
let notifications = [];
let subscribers = new Set();

const getAll = async (params = {}) => {
  try {
    info(`${serviceName}:getAll`, { params });
    
    // Mock pagination and filtering
    const { page = 1, limit = 10, userId, type } = params;
    let filteredNotifications = notifications;
    
    if (userId) {
      filteredNotifications = filteredNotifications.filter(n => n.userId === userId);
    }
    
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedNotifications,
      total: filteredNotifications.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredNotifications.length / limit),
        hasNext: endIndex < filteredNotifications.length,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    error(`${serviceName}:getAll:error`, { error: error.message, params });
    return {
      success: false,
      error: error.message || 'Failed to load notifications',
      data: []
    };
  }
};

const getById = async (id) => {
  try {
    info(`${serviceName}:getById`, { id });
    
    const notification = notifications.find(n => n.id === parseInt(id));
    
    return {
      success: !!notification,
      data: notification || null,
      error: notification ? undefined : 'Notification not found'
    };
  } catch (error) {
    error(`${serviceName}:getById:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to load notification',
      data: null
    };
  }
};

const create = async (data, user = null) => {
  try {
    info(`${serviceName}:create`, { data });
    
    const notification = {
      id: Date.now(),
      ...data,
      createdAt: new Date(),
      read: false,
      createdBy: user?.id || null
    };
    
    notifications.push(notification);
    
    // Notify subscribers
    subscribers.forEach(callback => {
      try {
        callback({
          type: 'notification_created',
          notification
        });
      } catch (err) {
        error(`${serviceName}:create:subscriber_error`, { error: err.message });
      }
    });
    
    return {
      success: true,
      data: notification,
      message: 'Notification created successfully'
    };
  } catch (error) {
    error(`${serviceName}:create:error`, { error: error.message, data });
    return {
      success: false,
      error: error.message || 'Failed to create notification',
      data: null
    };
  }
};

const update = async (id, updateData, user = null) => {
  try {
    info(`${serviceName}:update`, { id, data: updateData });
    
    const index = notifications.findIndex(n => n.id === parseInt(id));
    
    if (index === -1) {
      return {
        success: false,
        error: 'Notification not found',
        data: null
      };
    }
    
    notifications[index] = {
      ...notifications[index],
      ...updateData,
      updatedAt: new Date(),
      updatedBy: user?.id || null
    };
    
    // Notify subscribers
    subscribers.forEach(callback => {
      try {
        callback({
          type: 'notification_updated',
          notification: notifications[index]
        });
      } catch (err) {
        error(`${serviceName}:update:subscriber_error`, { error: err.message });
      }
    });
    
    return {
      success: true,
      data: notifications[index],
      message: 'Notification updated successfully'
    };
  } catch (error) {
    error(`${serviceName}:update:error`, { error: error.message, id, data: updateData });
    return {
      success: false,
      error: error.message || 'Failed to update notification',
      data: null
    };
  }
};

const deleteFn = async (id, user = null) => {
  try {
    info(`${serviceName}:delete`, { id });
    
    const index = notifications.findIndex(n => n.id === parseInt(id));
    
    if (index === -1) {
      return {
        success: false,
        error: 'Notification not found'
      };
    }
    
    const deletedNotification = notifications.splice(index, 1)[0];
    
    // Notify subscribers
    subscribers.forEach(callback => {
      try {
        callback({
          type: 'notification_deleted',
          notification: deletedNotification
        });
      } catch (err) {
        error(`${serviceName}:delete:subscriber_error`, { error: err.message });
      }
    });
    
    return {
      success: true,
      message: 'Notification deleted successfully'
    };
  } catch (error) {
    error(`${serviceName}:delete:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to delete notification'
    };
  }
};

// Real-time notification functions
const subscribeToNotifications = (callback, userId = null) => {
  try {
    info(`${serviceName}:subscribeToNotifications`, { userId });
    
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    // Add subscriber
    subscribers.add(callback);
    
    // Return unsubscribe function
    const unsubscribe = () => {
      subscribers.delete(callback);
      info(`${serviceName}:unsubscribe`, { userId });
    };
    
    // Send initial notifications if userId provided
    if (userId) {
      const userNotifications = notifications.filter(n => n.userId === userId);
      callback({
        type: 'initial_notifications',
        notifications: userNotifications
      });
    }
    
    return unsubscribe;
  } catch (error) {
    error(`${serviceName}:subscribeToNotifications:error`, { error: error.message, userId });
    return null;
  }
};

const markAsRead = async (id, user = null) => {
  try {
    info(`${serviceName}:markAsRead`, { id });
    
    return await update(id, { read: true, readAt: new Date() }, user);
  } catch (error) {
    error(`${serviceName}:markAsRead:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to mark notification as read'
    };
  }
};

const markAllAsRead = async (userId, user = null) => {
  try {
    info(`${serviceName}:markAllAsRead`, { userId });
    
    const userNotifications = notifications.filter(n => n.userId === userId && !n.read);
    const updatePromises = userNotifications.map(notification => 
      update(notification.id, { read: true, readAt: new Date() }, user)
    );
    
    await Promise.all(updatePromises);
    
    return {
      success: true,
      message: `Marked ${userNotifications.length} notifications as read`
    };
  } catch (error) {
    error(`${serviceName}:markAllAsRead:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to mark all notifications as read'
    };
  }
};

const getUnreadCount = async (userId) => {
  try {
    info(`${serviceName}:getUnreadCount`, { userId });
    
    const unreadCount = notifications.filter(n => n.userId === userId && !n.read).length;
    
    return {
      success: true,
      data: unreadCount
    };
  } catch (error) {
    error(`${serviceName}:getUnreadCount:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to get unread count',
      data: 0
    };
  }
};

// Additional commonly expected notification functions
const getNotificationSettings = async (userId) => {
  try {
    info(`${serviceName}:getNotificationSettings`, { userId });
    
    // Mock notification settings
    const settings = {
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      desktopNotifications: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      categories: {
        announcements: true,
        assignments: true,
        grades: true,
        attendance: true,
        messages: true
      }
    };
    
    return {
      success: true,
      data: settings
    };
  } catch (error) {
    error(`${serviceName}:getNotificationSettings:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to get notification settings',
      data: null
    };
  }
};

const updateNotificationSettings = async (userId, settings, user = null) => {
  try {
    info(`${serviceName}:updateNotificationSettings`, { userId, settings });
    
    // Mock update - in real app would save to database
    return {
      success: true,
      data: settings,
      message: 'Notification settings updated successfully'
    };
  } catch (error) {
    error(`${serviceName}:updateNotificationSettings:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to update notification settings',
      data: null
    };
  }
};

const sendNotification = async (notificationData, user = null) => {
  try {
    info(`${serviceName}:sendNotification`, { notificationData });
    
    return await create(notificationData, user);
  } catch (error) {
    error(`${serviceName}:sendNotification:error`, { error: error.message, notificationData });
    return {
      success: false,
      error: error.message || 'Failed to send notification',
      data: null
    };
  }
};

const clearNotifications = async (userId, user = null) => {
  try {
    info(`${serviceName}:clearNotifications`, { userId });
    
    // Remove all notifications for user
    const beforeCount = notifications.length;
    notifications = notifications.filter(n => n.userId !== userId);
    const clearedCount = beforeCount - notifications.length;
    
    // Notify subscribers
    subscribers.forEach(callback => {
      try {
        callback({
          type: 'notifications_cleared',
          userId,
          clearedCount
        });
      } catch (err) {
        error(`${serviceName}:clearNotifications:subscriber_error`, { error: err.message });
      }
    });
    
    return {
      success: true,
      message: `Cleared ${clearedCount} notifications`
    };
  } catch (error) {
    error(`${serviceName}:clearNotifications:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to clear notifications'
    };
  }
};

const getNotificationTypes = async () => {
  try {
    info(`${serviceName}:getNotificationTypes`);
    
    const types = [
      { id: 'announcement', name: 'Announcement', icon: 'megaphone' },
      { id: 'assignment', name: 'Assignment', icon: 'assignment' },
      { id: 'grade', name: 'Grade', icon: 'grade' },
      { id: 'attendance', name: 'Attendance', icon: 'attendance' },
      { id: 'message', name: 'Message', icon: 'message' },
      { id: 'system', name: 'System', icon: 'system' }
    ];
    
    return {
      success: true,
      data: types
    };
  } catch (error) {
    error(`${serviceName}:getNotificationTypes:error`, { error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to get notification types',
      data: []
    };
  }
};

const archiveNotification = async (id, user = null) => {
  try {
    info(`${serviceName}:archiveNotification`, { id });
    
    // Archive notification by marking as archived instead of deleting
    return await update(id, { 
      archived: true, 
      archivedAt: new Date(), 
      archivedBy: user?.id || null 
    }, user);
  } catch (error) {
    error(`${serviceName}:archiveNotification:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to archive notification',
      data: null
    };
  }
};

const unarchiveNotification = async (id, user = null) => {
  try {
    info(`${serviceName}:unarchiveNotification`, { id });
    
    // Unarchive notification
    return await update(id, { 
      archived: false, 
      unarchivedAt: new Date(), 
      unarchivedBy: user?.id || null 
    }, user);
  } catch (error) {
    error(`${serviceName}:unarchiveNotification:error`, { error: error.message, id });
    return {
      success: false,
      error: error.message || 'Failed to unarchive notification',
      data: null
    };
  }
};

const getArchivedNotifications = async (userId, params = {}) => {
  try {
    info(`${serviceName}:getArchivedNotifications`, { userId, params });
    
    // Get only archived notifications for user
    const archivedNotifications = notifications.filter(n => 
      n.userId === userId && n.archived === true
    );
    
    return {
      success: true,
      data: archivedNotifications,
      total: archivedNotifications.length
    };
  } catch (error) {
    error(`${serviceName}:getArchivedNotifications:error`, { error: error.message, userId });
    return {
      success: false,
      error: error.message || 'Failed to get archived notifications',
      data: []
    };
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteFn,
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotificationSettings,
  updateNotificationSettings,
  sendNotification,
  clearNotifications,
  getNotificationTypes,
  archiveNotification,
  unarchiveNotification,
  getArchivedNotifications
};
