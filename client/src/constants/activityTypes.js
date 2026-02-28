/**
 * Activity Constants
 * 
 * Centralized constants for activity types used throughout the application.
 * These types are used for activities, marks, and other assessments.
 */

import { getThemedIcon } from '@constants/iconTypes';

// Activity/Mark Types
export const ACTIVITY_TYPES = {
  QUIZ: 'quiz',
  HOMEWORK: 'homework',
  TRAINING: 'training',
  LAB_AND_PROJECT: 'labandproject',
  MID_EXAM: 'mid-exam',
  FINAL_EXAM: 'final-exam'
};

// Re-export user constants from shared location
export { 
  USER_ACTIVITY_TYPES, 
  USER_ROLES, 
  USER_STATUS_TYPES 
} from '../../../functions/constants/userConstants.js';

// Labels for UI display
export const ACTIVITY_TYPE_LABELS = {
  [ACTIVITY_TYPES.QUIZ]: 'Quiz',
  [ACTIVITY_TYPES.HOMEWORK]: 'Homework',
  [ACTIVITY_TYPES.TRAINING]: 'Training',
  [ACTIVITY_TYPES.LAB_AND_PROJECT]: 'Lab & Project',
  [ACTIVITY_TYPES.MID_EXAM]: 'Mid-Term Exam',
  [ACTIVITY_TYPES.FINAL_EXAM]: 'Final Exam'
};

// User Activity Labels
export const USER_ACTIVITY_LABELS = {
  USER_DISABLED: 'User Disabled',
  USER_ENABLED: 'User Enabled',
  USER_CREATED: 'User Created',
  USER_UPDATED: 'User Updated',
  USER_DELETED: 'User Deleted',
  USER_LOGIN: 'User Login',
  USER_LOGOUT: 'User Logout'
};

// Arabic labels for bilingual support
export const ACTIVITY_TYPE_LABELS_AR = {
  [ACTIVITY_TYPES.QUIZ]: 'اختبار',
  [ACTIVITY_TYPES.HOMEWORK]: 'واجب منزلي',
  [ACTIVITY_TYPES.TRAINING]: 'تدريب',
  [ACTIVITY_TYPES.LAB_AND_PROJECT]: 'معمل ومشروع',
  [ACTIVITY_TYPES.MID_EXAM]: 'امتحان منتصف الفصل',
  [ACTIVITY_TYPES.FINAL_EXAM]: 'امتحان نهائي'
};

// User Activity Arabic Labels
export const USER_ACTIVITY_LABELS_AR = {
  USER_DISABLED: 'تم تعطيل المستخدم',
  USER_ENABLED: 'تم تفعيل المستخدم',
  USER_CREATED: 'تم إنشاء المستخدم',
  USER_UPDATED: 'تم تحديث المستخدم',
  USER_DELETED: 'تم حذف المستخدم',
  USER_LOGIN: 'تسجيل دخول المستخدم',
  USER_LOGOUT: 'تسجيل خروج المستخدم'
};

// Options for dropdown/select components
export const ACTIVITY_TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}));

// Get activity type configuration with icon and text
export const getActivityTypeConfig = (type, theme = 'light', lang = 'en') => {
  const labels = lang === 'ar' ? ACTIVITY_TYPE_LABELS_AR : ACTIVITY_TYPE_LABELS;
  
  const typeConfig = {
    [ACTIVITY_TYPES.QUIZ]: {
      icon: getThemedIcon('quiz', theme),
      label: labels[ACTIVITY_TYPES.QUIZ],
      color: theme === 'dark' ? '#8b5cf6' : '#7c3aed'
    },
    [ACTIVITY_TYPES.HOMEWORK]: {
      icon: getThemedIcon('homework', theme),
      label: labels[ACTIVITY_TYPES.HOMEWORK],
      color: theme === 'dark' ? '#3b82f6' : '#2563eb'
    },
    [ACTIVITY_TYPES.TRAINING]: {
      icon: getThemedIcon('training', theme),
      label: labels[ACTIVITY_TYPES.TRAINING],
      color: theme === 'dark' ? '#10b981' : '#059669'
    },
    [ACTIVITY_TYPES.LAB_AND_PROJECT]: {
      icon: getThemedIcon('lab', theme),
      label: labels[ACTIVITY_TYPES.LAB_AND_PROJECT],
      color: theme === 'dark' ? '#f59e0b' : '#d97706'
    },
    [ACTIVITY_TYPES.MID_EXAM]: {
      icon: getThemedIcon('exam', theme),
      label: labels[ACTIVITY_TYPES.MID_EXAM],
      color: theme === 'dark' ? '#ef4444' : '#dc2626'
    },
    [ACTIVITY_TYPES.FINAL_EXAM]: {
      icon: getThemedIcon('exam', theme),
      label: labels[ACTIVITY_TYPES.FINAL_EXAM],
      color: theme === 'dark' ? '#dc2626' : '#b91c1c'
    }
  };

  return typeConfig[type] || {
    icon: getThemedIcon('activity', theme),
    label: 'Unknown Activity',
    color: theme === 'dark' ? '#6b7280' : '#4b5563'
  };
};

// Get activity type options for dropdown/select components
export const getActivityTypeOptionsForDropdown = (lang = 'en') => {
  const labels = lang === 'ar' ? ACTIVITY_TYPE_LABELS_AR : ACTIVITY_TYPE_LABELS;
  
  return Object.entries(ACTIVITY_TYPES).map(([value, key]) => ({
    value: key,
    label: labels[key] || key
  }));
};
