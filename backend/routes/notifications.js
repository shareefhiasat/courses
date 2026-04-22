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
} from '../controllers/notificationController.js';

const router = Router();

// All notification routes require auth.
router.use(keycloakAuth([]));

router.get('/', getNotifications);
router.patch('/:notificationId/read', markNotificationRead);
router.post('/mark-all-read', markAllRead);

export default router;
