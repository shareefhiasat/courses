import { info, error, warn, debug } from '@services/utils/logger.js';
import { ROLES } from './permissionConfig';

/**
 * Screen Definitions for Localization
 * Centralized screen information with translations
 */

export const SCREEN_GROUPS = {
  MAIN: 'main',
  QUIZ: 'quiz',
  CLASSES: 'classes',
  ACADEMIC: 'academic',
  ATTENDANCE: 'attendance',
  ANALYTICS: 'analytics',
  COMMUNICATION: 'communication',
  COMMUNITY: 'community',
  SETTINGS: 'settings'
};

export const SCREEN_DEFINITIONS = {
  // MAIN
  home: {
    id: 'home',
    nameKey: 'home',
    group: SCREEN_GROUPS.MAIN,
    descriptionKey: 'home_description'
  },
  dashboard: {
    id: 'dashboard',
    nameKey: 'dashboard',
    group: SCREEN_GROUPS.MAIN,
    descriptionKey: 'dashboard_description'
  },
  studentDashboard: {
    id: 'studentDashboard',
    nameKey: 'student_dashboard',
    group: SCREEN_GROUPS.MAIN,
    descriptionKey: 'student_dashboard_description'
  },
  studentProfile: {
    id: 'studentProfile',
    nameKey: 'student_profile',
    group: SCREEN_GROUPS.MAIN,
    descriptionKey: 'student_profile_description'
  },
  activities: {
    id: 'activities',
    nameKey: 'activities',
    group: SCREEN_GROUPS.MAIN,
    descriptionKey: 'activities_description'
  },
  resources: {
    id: 'resources',
    nameKey: 'resources',
    group: SCREEN_GROUPS.MAIN,
    descriptionKey: 'resources_description'
  },
  
  // QUIZ
  quizzes: {
    id: 'quizzes',
    nameKey: 'quizzes',
    group: SCREEN_GROUPS.QUIZ,
    descriptionKey: 'quizzes_description'
  },
  quizManagement: {
    id: 'quizManagement',
    nameKey: 'quiz_management',
    group: SCREEN_GROUPS.QUIZ,
    descriptionKey: 'quiz_management_description'
  },
  quizBuilder: {
    id: 'quizBuilder',
    nameKey: 'quiz_builder',
    group: SCREEN_GROUPS.QUIZ,
    descriptionKey: 'quiz_builder_description'
  },
  quizResults: {
    id: 'quizResults',
    nameKey: 'quiz_results',
    group: SCREEN_GROUPS.QUIZ,
    descriptionKey: 'quiz_results_description'
  },
  reviewResults: {
    id: 'reviewResults',
    nameKey: 'review_results',
    group: SCREEN_GROUPS.QUIZ,
    descriptionKey: 'review_results_description'
  },
  
  // CLASSES
  classSchedules: {
    id: 'classSchedules',
    nameKey: 'class_schedules',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'class_schedules_description'
  },
  manageEnrollments: {
    id: 'manageEnrollments',
    nameKey: 'manage_enrollments',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'manage_enrollments_description'
  },
  myEnrollments: {
    id: 'myEnrollments',
    nameKey: 'my_enrollments',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'my_enrollments_description'
  },
  enrollments: {
    id: 'enrollments',
    nameKey: 'enrollments',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'enrollments_description'
  },
  programs: {
    id: 'programs',
    nameKey: 'programs',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'programs_description'
  },
  subjects: {
    id: 'subjects',
    nameKey: 'subjects',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'subjects_description'
  },
  classes: {
    id: 'classes',
    nameKey: 'classes',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'classes_description'
  },
  marksEntry: {
    id: 'marksEntry',
    nameKey: 'marks_entry',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'marks_entry_description'
  },
  courseProgress: {
    id: 'courseProgress',
    nameKey: 'course_progress',
    group: SCREEN_GROUPS.CLASSES,
    descriptionKey: 'course_progress_description'
  },
  
  // ACADEMIC
  courses: {
    id: 'courses',
    nameKey: 'courses',
    group: SCREEN_GROUPS.ACADEMIC,
    descriptionKey: 'courses_description'
  },
  
  // ATTENDANCE
  attendance: {
    id: 'attendance',
    nameKey: 'attendance_instructor',
    group: SCREEN_GROUPS.ATTENDANCE,
    descriptionKey: 'attendance_instructor_description'
  },
  hrAttendance: {
    id: 'hrAttendance',
    nameKey: 'hr_attendance',
    group: SCREEN_GROUPS.ATTENDANCE,
    descriptionKey: 'hr_attendance_description'
  },
  myAttendance: {
    id: 'myAttendance',
    nameKey: 'my_attendance_student',
    group: SCREEN_GROUPS.ATTENDANCE,
    descriptionKey: 'my_attendance_student_description'
  },
  penalty: {
    id: 'penalty',
    nameKey: 'penalty',
    group: SCREEN_GROUPS.ATTENDANCE,
    descriptionKey: 'penalty_description'
  },
  participation: {
    id: 'participation',
    nameKey: 'participation',
    group: SCREEN_GROUPS.ATTENDANCE,
    descriptionKey: 'participation_description'
  },
  behavior: {
    id: 'behavior',
    nameKey: 'behavior',
    group: SCREEN_GROUPS.ATTENDANCE,
    descriptionKey: 'behavior_description'
  },
  
  // ANALYTICS
  analytics: {
    id: 'analytics',
    nameKey: 'analytics',
    group: SCREEN_GROUPS.ANALYTICS,
    descriptionKey: 'analytics_description'
  },
  advancedAnalytics: {
    id: 'advancedAnalytics',
    nameKey: 'advanced_analytics',
    group: SCREEN_GROUPS.ANALYTICS,
    descriptionKey: 'advanced_analytics_description'
  },
  
  // COMMUNICATION
  chat: {
    id: 'chat',
    nameKey: 'chat',
    group: SCREEN_GROUPS.COMMUNICATION,
    descriptionKey: 'chat_description'
  },
  scheduledReports: {
    id: 'scheduledReports',
    nameKey: 'scheduled_reports',
    group: SCREEN_GROUPS.COMMUNICATION,
    descriptionKey: 'scheduled_reports_description'
  },
  smtpConfig: {
    id: 'smtpConfig',
    nameKey: 'smtp_config',
    group: SCREEN_GROUPS.COMMUNICATION,
    descriptionKey: 'smtp_config_description'
  },
  notifications: {
    id: 'notifications',
    nameKey: 'notifications',
    group: SCREEN_GROUPS.COMMUNITY,
    descriptionKey: 'notifications_description'
  },
  
  // SETTINGS
  profile: {
    id: 'profile',
    nameKey: 'profile_settings',
    group: SCREEN_GROUPS.SETTINGS,
    descriptionKey: 'profile_settings_description'
  },
  roleAccess: {
    id: 'roleAccess',
    nameKey: 'role_access',
    group: SCREEN_GROUPS.SETTINGS,
    descriptionKey: 'role_access_description'
  }
};

/**
 * Get localized screen information
 * @param {string} screenId - Screen ID
 * @param {Function} t - Translation function
 * @returns {Object} Localized screen object
 */
export const getLocalizedScreen = (screenId, t) => {
  const screen = SCREEN_DEFINITIONS[screenId];
  if (!screen) return null;
  
  return {
    ...screen,
    name: t(screen.nameKey) || screen.nameKey,
    description: t(screen.descriptionKey) || screen.descriptionKey
  };
};

/**
 * Get all localized screens
 * @param {Function} t - Translation function
 * @returns {Array} Array of localized screen objects
 */
export const getAllLocalizedScreens = (t) => {
  return Object.values(SCREEN_DEFINITIONS).map(screen => ({
    ...screen,
    name: t(screen.nameKey) || screen.nameKey,
    description: t(screen.descriptionKey) || screen.descriptionKey
  }));
};

/**
 * Get screens by group
 * @param {string} group - Screen group
 * @param {Function} t - Translation function
 * @returns {Array} Array of localized screen objects for the group
 */
export const getScreensByGroup = (group, t) => {
  return Object.values(SCREEN_DEFINITIONS)
    .filter(screen => screen.group === group)
    .map(screen => ({
      ...screen,
      name: t(screen.nameKey) || screen.nameKey,
      description: t(screen.descriptionKey) || screen.descriptionKey
    }));
};

/**
 * Role-based access control mapping
 * Maps screen IDs to allowed Keycloak roles
 * NOTE: super_admin has access to ALL screens by default (bypass in RoleGuard)
 */
export const SCREEN_ROLE_ACCESS = {
  // Main screens
  home: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR, ROLES.STUDENT],
  dashboard: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],
  studentDashboard: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STUDENT],
  studentProfile: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],
  activities: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT],
  resources: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT],
  
  // Quiz screens
  quizzes: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT],
  quizManagement: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR],
  quizBuilder: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR],
  quizResults: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT],
  reviewResults: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  
  // Class screens
  classSchedules: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT],
  manageEnrollments: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR],
  myEnrollments: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STUDENT],
  enrollments: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  
  // Academic screens
  programs: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  subjects: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  classes: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR],
  marksEntry: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR],
  courseProgress: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STUDENT],
  courses: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT],
  
  // Attendance screens
  attendance: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR],
  hrAttendance: [ROLES.SUPER_ADMIN, ROLES.HR],
  myAttendance: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STUDENT],
  hrPenalties: [ROLES.SUPER_ADMIN, ROLES.HR],
  instructorParticipation: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR],
  instructorBehavior: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR],
  qrScanner: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],
  
  // Analytics screens
  analytics: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],
  advancedAnalytics: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  
  // Communication screens
  chat: [ROLES.SUPER_ADMIN],
  scheduledReports: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  smtpConfig: [ROLES.SUPER_ADMIN],
  notifications: [ROLES.SUPER_ADMIN],

  // Drive & Workflow screens
  drive: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],
  workflow: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],

  // Settings screens
  profile: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR, ROLES.STUDENT],
  roleAccess: [ROLES.SUPER_ADMIN], // REMOVED from UI - kept for reference only

  // Scheduling screens
  summaryDashboard: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],
  'summary-dashboard': [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],
  schedulingCalendar: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR, ROLES.INSTRUCTOR],
  instructorAvailability: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR],
  classroomAvailability: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR],
};

/**
 * Check if a role has access to a screen
 * @param {string} screenId - Screen ID
 * @param {string|string[]} userRoles - User role(s) from Keycloak
 * @returns {boolean} Whether the user has access
 */
export const hasScreenAccess = (screenId, userRoles) => {
  // Super admin always has access
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  const normalizedRoles = roles.map(role => role.toUpperCase().replace(/-/g, '_'));
  if (normalizedRoles.includes(ROLES.SUPER_ADMIN)) return true;
  
  // Home is accessible to all authenticated users
  if (screenId === 'home') return true;
  
  // Check screen-specific access
  const allowedRoles = SCREEN_ROLE_ACCESS[screenId];
  if (!allowedRoles) return false; // Unknown screen - deny by default
  
  return normalizedRoles.some(role => allowedRoles.includes(role));
};
