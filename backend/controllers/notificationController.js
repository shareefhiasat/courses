/**
 * Notification Controller
 *
 * HTTP handlers for notification management.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getNotifications(req, res) {
  try {
    const { limit, unreadOnly } = req.query;
    const userId = req.dbId;
    
    const where = { userId };
    if (unreadOnly === 'true') where.isRead = false;
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit, 10) : 50,
    });
    
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    
    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('[notificationController.getNotifications]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.dbId;
    
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('[notificationController.markNotificationRead]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const userId = req.dbId;
    
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    
    return res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('[notificationController.markAllRead]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default {
  getNotifications,
  markNotificationRead,
  markAllRead,
};
