/**
 * Notification Types Constants - ES6 Version
 * Centralized notification types and triggers used throughout the application
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
  ANNOUNCEMENT: 'announcement'
};

export const NOTIFICATION_TRIGGERS = {
  // User Notifications
  USER_WELCOME: 'user_welcome',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_PROFILE_UPDATE: 'user_profile_update',
  USER_PASSWORD_CHANGE: 'user_password_change',
  USER_ROLE_CHANGE: 'user_role_change',
  
  // Academic Notifications
  ENROLLMENT_CONFIRMED: 'enrollment_confirmed',
  ENROLLMENT_CANCELLED: 'enrollment_cancelled',
  CLASS_ENROLLED: 'class_enrolled',
  CLASS_UNENROLLED: 'class_unenrolled',
  ASSIGNMENT_DUE: 'assignment_due',
  ASSIGNMENT_SUBMITTED: 'assignment_submitted',
  GRADE_POSTED: 'grade_posted',
  
  // Attendance Notifications
  ATTENDANCE_MARKED: 'attendance_marked',
  ATTENDANCE_ABSENT: 'attendance_absent',
  ATTENDANCE_LATE: 'attendance_late',
  ATTENDANCE_THRESHOLD_WARNING: 'attendance_threshold_warning',
  
  // Assessment Notifications
  QUIZ_AVAILABLE: 'quiz_available',
  QUIZ_SUBMITTED: 'quiz_submitted',
  QUIZ_GRADED: 'quiz_graded',
  EXAM_SCHEDULED: 'exam_scheduled',
  EXAM_RESULTS: 'exam_results',
  
  // Communication Notifications
  MESSAGE_RECEIVED: 'message_received',
  ANNOUNCEMENT_POSTED: 'announcement_posted',
  CHAT_MESSAGE: 'chat_message',
  
  // System Notifications
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SYSTEM_UPDATE: 'system_update',
  SECURITY_ALERT: 'security_alert'
};

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push'
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
    [NOTIFICATION_TYPES.ANNOUNCEMENT]: 'Megaphone'
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
    [NOTIFICATION_TYPES.ANNOUNCEMENT]: 'Announcement'
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
  NOTIFICATION_TRIGGERS,
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
