/**
 * Notification Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for notifications using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: notifications (via Prisma Notification model)
 *
 * @typedef {import('@types/index').Notification} Notification
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[NotificationDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[NotificationDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'NotificationDbService' });
  })
  .catch((err) => {
    console.error('[NotificationDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'NotificationDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all notifications
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getNotifications = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { userId, type, category, isRead, limitCount = 200 } = options;

    logger.info('Getting notifications', {
      service: 'NotificationDbService',
      operation: 'getNotifications',
      filters: { userId, type, category, isRead, limitCount }
    });

    const where = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (category) where.category = category;
    if (isRead !== undefined) where.isRead = isRead;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitCount,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'notification', where, notifications, duration);

    console.log(`[NotificationDbService] ✅ Retrieved ${notifications.length} notifications in ${duration}ms`);
    return { success: true, data: notifications };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting notifications', {
      service: 'NotificationDbService',
      operation: 'getNotifications',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[NotificationDbService] ❌ Error getting notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notification by ID
 * @param {string} notificationId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getNotificationById = async (notificationId) => {
  const startTime = Date.now();
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'notification', { id: notificationId }, notification, duration);

    if (!notification) return { success: false, error: 'Notification not found' };
    return { success: true, data: notification };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting notification by ID', {
      service: 'NotificationDbService',
      operation: 'getNotificationById',
      notificationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create notification
 * @param {Object} notificationData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (notificationData) => {
  const startTime = Date.now();
  try {
    const notification = await prisma.notification.create({
      data: notificationData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'notification', notificationData, notification, duration);

    return { success: true, data: notification };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating notification', {
      service: 'NotificationDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update notification
 * @param {string} notificationId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (notificationId, updateData) => {
  const startTime = Date.now();
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
      include: {
        user: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'notification', { id: notificationId, ...updateData }, notification, duration);

    return { success: true, data: notification };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating notification', {
      service: 'NotificationDbService',
      operation: 'update',
      notificationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete notification
 * @param {string} notificationId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteNotification = async (notificationId) => {
  const startTime = Date.now();
  try {
    const notification = await prisma.notification.delete({
      where: { id: notificationId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'notification', { id: notificationId }, notification, duration);

    return { success: true, message: 'Notification deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting notification', {
      service: 'NotificationDbService',
      operation: 'deleteNotification',
      notificationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Mark notifications as read
 * @param {string} userId
 * @param {Array<string>} notificationIds
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const markAsRead = async (userId, notificationIds) => {
  const startTime = Date.now();
  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: userId
      },
      data: { isRead: true }
    });

    const duration = Date.now() - startTime;
    logDbOperation('updateMany', 'notification', { userId, notificationIds }, result, duration);

    return { success: true, message: `Marked ${result.count} notifications as read` };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error marking notifications as read', {
      service: 'NotificationDbService',
      operation: 'markAsRead',
      userId,
      notificationIds,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[NotificationDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[NotificationDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getNotifications,
  getNotificationById,
  create,
  update,
  deleteNotification,
  markAsRead
};
