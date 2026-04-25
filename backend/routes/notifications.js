/**
 * Notification Routes
 * Mounted at `/api/v1/notifications`.
 */

import { Router } from 'express';
import { keycloakAuth } from '../middleware/keycloakAuth.js';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  archiveNotification,
  archiveAllRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  testNotification,
} from '../controllers/notificationController.js';

const router = Router();

// All notification routes require auth.
router.use(keycloakAuth([]));

// Notification CRUD
router.get('/', getNotifications);
router.patch('/:notificationId/read', markNotificationRead);
router.post('/mark-all-read', markAllRead);
router.patch('/:notificationId/archive', archiveNotification);
router.post('/archive-all-read', archiveAllRead);
router.delete('/:notificationId', deleteNotification);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Admin test endpoint (admin role required)
router.post('/admin/test', keycloakAuth(['admin']), testNotification);

export default router;
