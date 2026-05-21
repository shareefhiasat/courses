/**
 * Notification Types Constants - ES6 Version
 * Centralized notification types used throughout the application
 * 
 * NOTE: NOTIFICATION_TRIGGERS removed - events are now defined in backend
 * services/notifications/constants.js and should be retrieved from the API
 */

import { info, error, warn, debug } from '../services/utils/logger.js';

// Notification Types
export const NOTIFICATION_TYPES = {
  // System Notifications
  SYSTEM: 'system',
  USER: 'user',
  ACADEMIC: 'academic',
  ATTENDANCE: 'attendance',
  ASSESSMENT: 'assessment',
  COMMUNICATION: 'communication',
  ANNOUNCEMENT: 'announcement',
  WORKFLOW: 'workflow',
  BEHAVIOR: 'behavior',
  FILE: 'file',
  QR: 'qr'
};

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
};

// Stub for backward compatibility - triggers are now defined in backend
export const NOTIFICATION_TRIGGERS = {
  ANNOUNCEMENTS: 'announcements',
  ACTIVITIES: 'activities',
  ACTIVITY_COMPLETE: 'activity_complete',
  ACTIVITY_GRADED: 'activity_graded',
  ENROLLMENTS: 'enrollments',
  RESOURCES: 'resources',
  CHAT_DIGEST: 'chat_digest',
  PASSWORD_RESET: 'password_reset',
  WELCOME_SIGNUP: 'welcome_signup',
  QR_CODE: 'qr_code',
  STUDENT_SUMMARY: 'student_summary'
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const NOTIFICATION_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

export const NOTIFICATION_STATUS = NOTIFICATION_STATUSES; // Alias

// Helper functions
export const getNotificationIcon = (type) => {
  const iconMap = {
    [NOTIFICATION_TYPES.SYSTEM]: 'Settings',
    [NOTIFICATION_TYPES.USER]: 'User',
    [NOTIFICATION_TYPES.ACADEMIC]: 'BookOpen',
    [NOTIFICATION_TYPES.ATTENDANCE]: 'Calendar',
    [NOTIFICATION_TYPES.ASSESSMENT]: 'Clipboard',
    [NOTIFICATION_TYPES.COMMUNICATION]: 'MessageSquare',
    [NOTIFICATION_TYPES.ANNOUNCEMENT]: 'Megaphone',
    [NOTIFICATION_TYPES.WORKFLOW]: 'Workflow',
    [NOTIFICATION_TYPES.BEHAVIOR]: 'Activity',
    [NOTIFICATION_TYPES.FILE]: 'File',
    [NOTIFICATION_TYPES.QR]: 'QRCode'
  };
  
  return iconMap[type] || 'Bell';
};

export const getNotificationStatusOptions = () => {
  return Object.entries(NOTIFICATION_STATUSES).map(([key, value]) => ({
    value: value,
    label: key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')
  }));
};

export const getNotificationPriorityOptions = () => {
  return Object.entries(NOTIFICATION_PRIORITIES).map(([key, value]) => ({
    value: value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));
};

export const getNotificationChannelOptions = () => {
  return Object.entries(NOTIFICATION_CHANNELS).map(([key, value]) => ({
    value: value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));
};

export const getNotificationTriggerOptions = () => {
  return Object.entries(NOTIFICATION_TRIGGERS).map(([key, value]) => ({
    value: value,
    label: key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')
  }));
};

export const getNotificationTypeOptions = () => {
  return Object.entries(NOTIFICATION_TYPES).map(([key, value]) => ({
    value: value,
    label: key.charAt(0) + key.slice(1).toLowerCase()
  }));
};

export const getNotificationLabel = (type) => {
  const labels = {
    [NOTIFICATION_TYPES.SYSTEM]: 'System',
    [NOTIFICATION_TYPES.USER]: 'User',
    [NOTIFICATION_TYPES.ACADEMIC]: 'Academic',
    [NOTIFICATION_TYPES.ATTENDANCE]: 'Attendance',
    [NOTIFICATION_TYPES.ASSESSMENT]: 'Assessment',
    [NOTIFICATION_TYPES.COMMUNICATION]: 'Communication',
    [NOTIFICATION_TYPES.ANNOUNCEMENT]: 'Announcement',
    [NOTIFICATION_TYPES.WORKFLOW]: 'Workflow',
    [NOTIFICATION_TYPES.BEHAVIOR]: 'Behavior',
    [NOTIFICATION_TYPES.FILE]: 'File',
    [NOTIFICATION_TYPES.QR]: 'QR Code'
  };
  
  return labels[type] || type;
};

export const getNotificationPriorityLabel = (priority) => {
  const labels = {
    [NOTIFICATION_PRIORITIES.LOW]: 'Low',
    [NOTIFICATION_PRIORITIES.NORMAL]: 'Normal',
    [NOTIFICATION_PRIORITIES.HIGH]: 'High',
    [NOTIFICATION_PRIORITIES.URGENT]: 'Urgent'
  };
  
  return labels[priority] || priority;
};

export const getNotificationStatusLabel = (status) => {
  const labels = {
    [NOTIFICATION_STATUSES.PENDING]: 'Pending',
    [NOTIFICATION_STATUSES.SENT]: 'Sent',
    [NOTIFICATION_STATUSES.DELIVERED]: 'Delivered',
    [NOTIFICATION_STATUSES.READ]: 'Read',
    [NOTIFICATION_STATUSES.FAILED]: 'Failed'
  };
  
  return labels[status] || status;
};

// Default export
export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_STATUS,
  getNotificationIcon,
  getNotificationStatusOptions,
  getNotificationPriorityOptions,
  getNotificationChannelOptions,
  getNotificationTriggerOptions,
  getNotificationTypeOptions,
  getNotificationLabel,
  getNotificationPriorityLabel,
  getNotificationStatusLabel
};
