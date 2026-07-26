/**
 * Notification Controller
 *
 * HTTP handlers for notification management.
 */

import prisma from '../db/prismaClient.js';
import { mapNotifications } from '../services/notifications/mapper.js';
import { getRequestScope, isRecordInScope } from '../utils/scopeAccess.js';


/**
 * Get language from request (Accept-Language header or query param)
 */
const getRequestLanguage = (req) => {
  const headerLang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  const queryLang = req.query.lang;
  const lang = queryLang || headerLang || 'en';
  return ['en', 'ar'].includes(lang) ? lang : 'en';
};

export async function getNotifications(req, res) {
  try {
    const { limit, unreadOnly, category, archived } = req.query;
    const userId = req.user?.dbId;
    const lang = getRequestLanguage(req);
    
    const where = { userId };
    if (unreadOnly === 'true') where.isRead = false;
    if (category) where.category = category;
    if (archived === 'true') where.isArchived = true;
    else where.isArchived = false;
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit, 10) : 50,
    });

    const scope = await getRequestScope(req);
    const filtered = scope.unrestricted
      ? notifications
      : notifications.filter((n) => {
          const meta = n.metadata && typeof n.metadata === 'object' ? n.metadata : {};
          const classId = meta.classId ?? meta.class_id;
          const programId = meta.programId ?? meta.program_id;
          const subjectId = meta.subjectId ?? meta.subject_id;
          if (classId == null && programId == null && subjectId == null) return true;
          return isRecordInScope(scope, { classId, programId, subjectId });
        });
    
    const mappedNotifications = mapNotifications(filtered, lang);
    const unreadCount = mappedNotifications.filter(n => !n.isRead && !n.isArchived).length;
    
    return res.json({ success: true, notifications: mappedNotifications, unreadCount });
  } catch (error) {
    console.error('[notificationController.getNotifications]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.dbId;
    
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('[notificationController.markNotificationRead]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function markNotificationUnread(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.dbId;
    
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: false, readAt: null },
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('[notificationController.markNotificationUnread]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function markAllRead(req, res) {
  try {
    const userId = req.user?.dbId;
    
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    
    return res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('[notificationController.markAllRead]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function archiveNotification(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.dbId;
    
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isArchived: true, archivedAt: new Date() },
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('[notificationController.archiveNotification]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function unarchiveNotification(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.dbId;

    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isArchived: false, archivedAt: null },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('[notificationController.unarchiveNotification]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function archiveAllRead(req, res) {
  try {
    const userId = req.user?.dbId;
    
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: true, isArchived: false },
      data: { isArchived: true, archivedAt: new Date() },
    });
    
    return res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('[notificationController.archiveAllRead]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function deleteNotification(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.dbId;
    
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('[notificationController.deleteNotification]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getPreferences(req, res) {
  try {
    const userId = req.user?.dbId;
    
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });
    
    // Create default preferences if not exist
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }
    
    return res.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error('[notificationController.getPreferences]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function updatePreferences(req, res) {
  try {
    const userId = req.user?.dbId;
    const { inAppEnabled, emailEnabled, smsEnabled, pushEnabled, matrix, soundEnabled, vibrationEnabled, browserNotifEnabled } = req.body;
    
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        inAppEnabled,
        emailEnabled,
        smsEnabled,
        pushEnabled,
        matrix: matrix || {},
        soundEnabled,
        vibrationEnabled,
        browserNotifEnabled,
      },
      update: {
        inAppEnabled,
        emailEnabled,
        smsEnabled,
        pushEnabled,
        matrix: matrix || {},
        soundEnabled,
        vibrationEnabled,
        browserNotifEnabled,
      },
    });
    
    return res.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error('[notificationController.updatePreferences]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function testNotification(req, res) {
  try {
    // Admin-only endpoint for testing notifications
    const { event, payload, recipientCriteria } = req.body;
    const userId = req.user?.dbId;
    
    // Import notification gateway dynamically to avoid circular dependency
    const notificationGateway = await import('../services/notifications/index.js');
    
    const result = await notificationGateway.emit(
      event,
      payload,
      { id: userId },
      recipientCriteria || { userId }
    );
    
    return res.json({ success: true, result });
  } catch (error) {
    console.error('[notificationController.testNotification]', error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export default {
  getNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllRead,
  archiveNotification,
  unarchiveNotification,
  archiveAllRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  testNotification,
};
