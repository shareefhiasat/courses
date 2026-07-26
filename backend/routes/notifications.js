/**
 * Notification Routes
 * Mounted at `/api/v1/notifications`.
 */

import { Router } from 'express';
import { keycloakAuth } from '../middleware/keycloakAuth.js';
import { screenOps } from '../middleware/requirePermission.js';
import {
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
} from '../controllers/notificationController.js';

const router = Router();
const notifOps = screenOps('notifications');

// All notification routes require auth.
router.use(keycloakAuth([]));

// Notification CRUD
router.get('/', notifOps.view, getNotifications);
router.patch('/:notificationId/read', notifOps.update, markNotificationRead);
router.patch('/:notificationId/unread', notifOps.update, markNotificationUnread);
router.post('/mark-all-read', notifOps.update, markAllRead);
router.patch('/:notificationId/archive', notifOps.update, archiveNotification);
router.patch('/:notificationId/unarchive', notifOps.update, unarchiveNotification);
router.post('/archive-all-read', notifOps.update, archiveAllRead);
router.delete('/:notificationId', notifOps.update, deleteNotification);

// Preferences
router.get('/preferences', notifOps.view, getPreferences);
router.put('/preferences', notifOps.update, updatePreferences);

// Admin test endpoint (admin role required)
router.post('/admin/test', keycloakAuth(['admin']), testNotification);

export default router;
