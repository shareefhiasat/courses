import { info, error, warn, debug } from '../services/utils/logger.js';

export const EMAIL_TEMPLATE_TYPES = {
  // Activity Templates
  ACTIVITY_DEFAULT: 'activity_default',
  ACTIVITY_ASSIGNMENT: 'activity_assignment',
  ACTIVITY_QUIZ: 'activity_quiz',
  ACTIVITY_EXAM: 'activity_exam',
  ACTIVITY_PROJECT: 'activity_project',
  ACTIVITY_DISCUSSION: 'activity_discussion',
  ACTIVITY_RESOURCE: 'activity_resource',
  
  // User Management Templates
  USER_WELCOME: 'user_welcome',
  USER_PASSWORD_RESET: 'user_password_reset',
  USER_ACCOUNT_VERIFICATION: 'user_account_verification',
  USER_PROFILE_UPDATE: 'user_profile_update',
  
  // Academic Templates
  ACADEMIC_ENROLLMENT_CONFIRMATION: 'academic_enrollment_confirmation',
  ACADEMIC_GRADE_POSTED: 'academic_grade_posted',
  ACADEMIC_ASSIGNMENT_DUE: 'academic_assignment_due',
  ACADEMIC_EXAM_SCHEDULED: 'academic_exam_scheduled',
  
  // Attendance Templates
  ATTENDANCE_ABSENCE_ALERT: 'attendance_absence_alert',
  ATTENDANCE_TARDY_ALERT: 'attendance_tardy_alert',
  ATTENDANCE_DAILY_SUMMARY: 'attendance_daily_summary',
  ATTENDANCE_WEEKLY_REPORT: 'attendance_weekly_report',
  
  // System Templates
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SYSTEM_OUTAGE: 'system_outage',
  SYSTEM_UPDATE: 'system_update',
  SYSTEM_SECURITY_ALERT: 'system_security_alert',
  
  // Notification Templates
  NOTIFICATION_GENERAL: 'notification_general',
  NOTIFICATION_URGENT: 'notification_urgent',
  NOTIFICATION_REMINDER: 'notification_reminder',
  NOTIFICATION_ANNOUNCEMENT: 'notification_announcement'
};

export const TEMPLATE_CATEGORIES = {
  ACTIVITY: 'activity',
  USER: 'user',
  ACADEMIC: 'academic',
  ATTENDANCE: 'attendance',
  SYSTEM: 'system',
  NOTIFICATION: 'notification'
};

export const getTemplateCategory = (templateType) => {
  for (const [category, templates] of Object.entries(EMAIL_TEMPLATE_TYPES)) {
    if (templates[templateType]) {
      return category;
    }
  }
  return 'general';
};

export const getTemplatesByCategory = (category) => {
  const templates = {};
  for (const [key, value] of Object.entries(EMAIL_TEMPLATE_TYPES)) {
    if (key.startsWith(category.toUpperCase() + '_')) {
      templates[key] = value;
    }
  }
  return templates;
};

export const isValidTemplateType = (templateType) => {
  return Object.values(EMAIL_TEMPLATE_TYPES).includes(templateType);
};

export default {
  EMAIL_TEMPLATE_TYPES,
  TEMPLATE_CATEGORIES,
  getTemplateCategory,
  getTemplatesByCategory,
  isValidTemplateType
};
