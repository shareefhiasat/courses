import { getThemedIcon } from './iconTypes';
import { info, error, warn, debug } from '../services/utils/logger.js';

// Activity/Mark Types
export const ACTIVITY_TYPES = {
  QUIZ: 'quiz',
  HOMEWORK: 'homework',
  TRAINING: 'training',
  PROJECT: 'project',
  EXAM: 'exam',
  ASSIGNMENT: 'assignment',
  PARTICIPATION: 'participation',
  PRESENTATION: 'presentation',
  LAB_WORK: 'lab_work',
  FIELD_TRIP: 'field_trip',
  CASE_STUDY: 'case_study',
  RESEARCH: 'research',
  DEBATE: 'debate',
  WORKSHOP: 'workshop',
  SEMINAR: 'seminar'
};

// Activity Status
export const ACTIVITY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived'
};

// Activity Categories
export const ACTIVITY_CATEGORIES = {
  ASSESSMENT: 'assessment',
  ASSIGNMENT: 'assignment',
  PARTICIPATION: 'participation',
  PROJECT: 'project',
  EXAM: 'exam',
  PRACTICAL: 'practical'
};

// User Roles (re-exported from userUtils for convenience)
export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
  HR: 'hr',
  SUPER_ADMIN: 'super_admin'
};

// Activity Display Names
export const ACTIVITY_DISPLAY_NAMES = {
  [ACTIVITY_TYPES.QUIZ]: 'Quiz',
  [ACTIVITY_TYPES.HOMEWORK]: 'Homework',
  [ACTIVITY_TYPES.TRAINING]: 'Training',
  [ACTIVITY_TYPES.PROJECT]: 'Project',
  [ACTIVITY_TYPES.EXAM]: 'Exam',
  [ACTIVITY_TYPES.ASSIGNMENT]: 'Assignment',
  [ACTIVITY_TYPES.PARTICIPATION]: 'Participation',
  [ACTIVITY_TYPES.PRESENTATION]: 'Presentation',
  [ACTIVITY_TYPES.LAB_WORK]: 'Lab Work',
  [ACTIVITY_TYPES.FIELD_TRIP]: 'Field Trip',
  [ACTIVITY_TYPES.CASE_STUDY]: 'Case Study',
  [ACTIVITY_TYPES.RESEARCH]: 'Research',
  [ACTIVITY_TYPES.DEBATE]: 'Debate',
  [ACTIVITY_TYPES.WORKSHOP]: 'Workshop',
  [ACTIVITY_TYPES.SEMINAR]: 'Seminar'
};

// Activity Icons
export const ACTIVITY_ICONS = {
  [ACTIVITY_TYPES.QUIZ]: getThemedIcon('quiz'),
  [ACTIVITY_TYPES.HOMEWORK]: getThemedIcon('homework'),
  [ACTIVITY_TYPES.TRAINING]: getThemedIcon('training'),
  [ACTIVITY_TYPES.PROJECT]: getThemedIcon('project'),
  [ACTIVITY_TYPES.EXAM]: getThemedIcon('exam'),
  [ACTIVITY_TYPES.ASSIGNMENT]: getThemedIcon('assignment'),
  [ACTIVITY_TYPES.PARTICIPATION]: getThemedIcon('participation'),
  [ACTIVITY_TYPES.PRESENTATION]: getThemedIcon('presentation'),
  [ACTIVITY_TYPES.LAB_WORK]: getThemedIcon('lab'),
  [ACTIVITY_TYPES.FIELD_TRIP]: getThemedIcon('trip'),
  [ACTIVITY_TYPES.CASE_STUDY]: getThemedIcon('case'),
  [ACTIVITY_TYPES.RESEARCH]: getThemedIcon('research'),
  [ACTIVITY_TYPES.DEBATE]: getThemedIcon('debate'),
  [ACTIVITY_TYPES.WORKSHOP]: getThemedIcon('workshop'),
  [ACTIVITY_TYPES.SEMINAR]: getThemedIcon('seminar')
};

// Activity Weights (for grade calculation)
export const ACTIVITY_WEIGHTS = {
  [ACTIVITY_TYPES.QUIZ]: 0.10,
  [ACTIVITY_TYPES.HOMEWORK]: 0.15,
  [ACTIVITY_TYPES.TRAINING]: 0.05,
  [ACTIVITY_TYPES.PROJECT]: 0.20,
  [ACTIVITY_TYPES.EXAM]: 0.25,
  [ACTIVITY_TYPES.ASSIGNMENT]: 0.15,
  [ACTIVITY_TYPES.PARTICIPATION]: 0.05,
  [ACTIVITY_TYPES.PRESENTATION]: 0.10,
  [ACTIVITY_TYPES.LAB_WORK]: 0.10,
  [ACTIVITY_TYPES.FIELD_TRIP]: 0.05,
  [ACTIVITY_TYPES.CASE_STUDY]: 0.10,
  [ACTIVITY_TYPES.RESEARCH]: 0.15,
  [ACTIVITY_TYPES.DEBATE]: 0.05,
  [ACTIVITY_TYPES.WORKSHOP]: 0.05,
  [ACTIVITY_TYPES.SEMINAR]: 0.05
};

// Helper Functions
export const getActivityDisplayName = (type) => {
  return ACTIVITY_DISPLAY_NAMES[type] || type;
};

export const getActivityIcon = (type) => {
  return ACTIVITY_ICONS[type] || getThemedIcon('activity');
};

export const getActivityWeight = (type) => {
  return ACTIVITY_WEIGHTS[type] || 0.10; // Default weight
};

export const getActivityCategory = (type) => {
  // Map activity types to categories
  const categoryMap = {
    [ACTIVITY_TYPES.QUIZ]: ACTIVITY_CATEGORIES.ASSESSMENT,
    [ACTIVITY_TYPES.EXAM]: ACTIVITY_CATEGORIES.EXAM,
    [ACTIVITY_TYPES.HOMEWORK]: ACTIVITY_CATEGORIES.ASSIGNMENT,
    [ACTIVITY_TYPES.ASSIGNMENT]: ACTIVITY_CATEGORIES.ASSIGNMENT,
    [ACTIVITY_TYPES.PROJECT]: ACTIVITY_CATEGORIES.PROJECT,
    [ACTIVITY_TYPES.PARTICIPATION]: ACTIVITY_CATEGORIES.PARTICIPATION,
    [ACTIVITY_TYPES.LAB_WORK]: ACTIVITY_CATEGORIES.PRACTICAL,
    [ACTIVITY_TYPES.FIELD_TRIP]: ACTIVITY_CATEGORIES.PRACTICAL,
    [ACTIVITY_TYPES.PRESENTATION]: ACTIVITY_CATEGORIES.ASSESSMENT,
    [ACTIVITY_TYPES.CASE_STUDY]: ACTIVITY_CATEGORIES.ASSIGNMENT,
    [ACTIVITY_TYPES.RESEARCH]: ACTIVITY_CATEGORIES.PROJECT,
    [ACTIVITY_TYPES.DEBATE]: ACTIVITY_CATEGORIES.PARTICIPATION,
    [ACTIVITY_TYPES.WORKSHOP]: ACTIVITY_CATEGORIES.PRACTICAL,
    [ACTIVITY_TYPES.SEMINAR]: ACTIVITY_CATEGORIES.PARTICIPATION,
    [ACTIVITY_TYPES.TRAINING]: ACTIVITY_CATEGORIES.PRACTICAL
  };
  
  return categoryMap[type] || ACTIVITY_CATEGORIES.ASSIGNMENT;
};

export const getActivitiesByCategory = (category) => {
  return Object.entries(ACTIVITY_TYPES)
    .filter(([type]) => getActivityCategory(type) === category)
    .map(([key, value]) => ({ key, value, displayName: ACTIVITY_DISPLAY_NAMES[value] }));
};

export const isValidActivityType = (type) => {
  return Object.values(ACTIVITY_TYPES).includes(type);
};

export const isValidActivityStatus = (status) => {
  return Object.values(ACTIVITY_STATUS).includes(status);
};

// Activity Type Options for dropdowns
export const ACTIVITY_TYPE_OPTIONS = Object.entries(ACTIVITY_DISPLAY_NAMES).map(([key, value]) => ({
  value: key,
  label: value
}));

// Get activity type configuration
export const getActivityTypeConfig = (type) => {
  // Handle undefined/null type gracefully
  if (!type || typeof type !== 'string') {
    return {
      type: type || 'unknown',
      displayName: 'Unknown Activity',
      icon: 'activity',
      weight: 0.10,
      category: 'general'
    };
  }
  
  // Map activity types to icon names (not React elements)
  const activityIconNames = {
    [ACTIVITY_TYPES.QUIZ]: 'quiz',
    [ACTIVITY_TYPES.HOMEWORK]: 'homework',
    [ACTIVITY_TYPES.TRAINING]: 'training',
    [ACTIVITY_TYPES.PROJECT]: 'project',
    [ACTIVITY_TYPES.EXAM]: 'exam',
    [ACTIVITY_TYPES.ASSIGNMENT]: 'assignment',
    [ACTIVITY_TYPES.PARTICIPATION]: 'participation',
    [ACTIVITY_TYPES.PRESENTATION]: 'presentation',
    [ACTIVITY_TYPES.LAB_WORK]: 'lab',
    [ACTIVITY_TYPES.FIELD_TRIP]: 'trip',
    [ACTIVITY_TYPES.CASE_STUDY]: 'case',
    [ACTIVITY_TYPES.RESEARCH]: 'research',
    [ACTIVITY_TYPES.DEBATE]: 'debate',
    [ACTIVITY_TYPES.WORKSHOP]: 'workshop',
    [ACTIVITY_TYPES.SEMINAR]: 'seminar'
  };
  
  return {
    type,
    displayName: ACTIVITY_DISPLAY_NAMES[type] || type,
    icon: activityIconNames[type] || 'activity',
    weight: ACTIVITY_WEIGHTS[type] || 0.10,
    category: getActivityCategory(type)
  };
};

export default {
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  ACTIVITY_CATEGORIES,
  USER_ROLES,
  ACTIVITY_DISPLAY_NAMES,
  ACTIVITY_ICONS,
  ACTIVITY_WEIGHTS,
  ACTIVITY_TYPE_OPTIONS,
  getActivityDisplayName,
  getActivityIcon,
  getActivityWeight,
  getActivityCategory,
  getActivitiesByCategory,
  isValidActivityType,
  isValidActivityStatus,
  getActivityTypeConfig
};
