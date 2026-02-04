/**
 * Notification Service - High-level notification utilities
 * Re-exports from Firebase notificationService for unified access
 */

import { 
  sendStudentNotification,
  notifyQuizAvailable,
  sendDeadlineReminders,
  notifyGradeReleased,
  sendPushNotification,
  scheduleReminders
} from '@firebaseServices/notificationService';

// Re-export all functions for backward compatibility
export {
  sendStudentNotification,
  notifyQuizAvailable,
  sendDeadlineReminders,
  notifyGradeReleased,
  sendPushNotification,
  scheduleReminders
};
