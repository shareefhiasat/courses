/**
 * Activity Type Constants
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

// Labels for UI display
export const ACTIVITY_TYPE_LABELS = {
  [ACTIVITY_TYPES.QUIZ]: 'Quiz',
  [ACTIVITY_TYPES.HOMEWORK]: 'Homework',
  [ACTIVITY_TYPES.TRAINING]: 'Training',
  [ACTIVITY_TYPES.LAB_AND_PROJECT]: 'Lab & Project',
  [ACTIVITY_TYPES.MID_EXAM]: 'Mid-Term Exam',
  [ACTIVITY_TYPES.FINAL_EXAM]: 'Final Exam'
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
      icon: 'target', 
      text: labels[ACTIVITY_TYPES.QUIZ] 
    },
    [ACTIVITY_TYPES.HOMEWORK]: { 
      icon: 'home', 
      text: labels[ACTIVITY_TYPES.HOMEWORK] 
    },
    [ACTIVITY_TYPES.TRAINING]: { 
      icon: 'book_open', 
      text: labels[ACTIVITY_TYPES.TRAINING] 
    },
    [ACTIVITY_TYPES.LAB_AND_PROJECT]: { 
      icon: 'wrench', 
      text: labels[ACTIVITY_TYPES.LAB_AND_PROJECT] 
    },
    [ACTIVITY_TYPES.MID_EXAM]: { 
      icon: 'clipboard', 
      text: labels[ACTIVITY_TYPES.MID_EXAM] 
    },
    [ACTIVITY_TYPES.FINAL_EXAM]: { 
      icon: 'award', 
      text: labels[ACTIVITY_TYPES.FINAL_EXAM] 
    }
  };
  
  const config = typeConfig[type] || { 
    icon: 'file_text', 
    text: type || 'Unknown' 
  };
  
  return {
    ...config,
    icon: config.icon
  };
};

// Get activity type options for dropdown with icons
export const getActivityTypeOptionsForDropdown = (theme = 'light', lang = 'en') => {
  return Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => {
    const config = getActivityTypeConfig(value, theme, lang);
    return {
      value,
      label: config.text,
      icon: getThemedIcon('ui', config.icon, 16, theme)
    };
  });
};

// Mark types (subset of activity types used specifically for marks)
export const MARK_TYPES = {
  MID_TERM_EXAM: 'midTermExam',
  FINAL_EXAM: 'finalExam',
  HOMEWORK: 'homework',
  LABS_PROJECT_RESEARCH: 'labsProjectResearch',
  QUIZZES: 'quizzes',
  PARTICIPATION: 'participation',
  ATTENDANCE: 'attendance'
};

// Mapping from mark type keys to activity types
export const MARK_TYPE_TO_ACTIVITY_TYPE = {
  [MARK_TYPES.MID_TERM_EXAM]: ACTIVITY_TYPES.MID_EXAM,
  [MARK_TYPES.FINAL_EXAM]: ACTIVITY_TYPES.FINAL_EXAM,
  [MARK_TYPES.HOMEWORK]: ACTIVITY_TYPES.HOMEWORK,
  [MARK_TYPES.LABS_PROJECT_RESEARCH]: ACTIVITY_TYPES.LAB_AND_PROJECT,
  [MARK_TYPES.QUIZZES]: ACTIVITY_TYPES.QUIZ,
  [MARK_TYPES.PARTICIPATION]: ACTIVITY_TYPES.PARTICIPATION,
  [MARK_TYPES.ATTENDANCE]: ACTIVITY_TYPES.ATTENDANCE
};

// Export empty object to maintain compatibility for now
// RECORD_TYPES moved to utils/sharedTypes.js
export const RECORD_TYPES = {};

