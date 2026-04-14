/**
 * Constants Index - ES6 Exports
 * 
 * PURPOSE:
 * Provides all constants with ES6 exports
 * PostgreSQL-oriented, simple, clean, import/export pattern
 */

// Import role constants from userUtils
import { 
  ROLE_STRINGS, 
  ROLE_DISPLAY_NAMES, 
  ROLE_HIERARCHY, 
  ROLE_PRECEDENCE, 
  DEFAULT_ROLE, 
  ALL_ROLES, 
  ROLE_KEYS
} from '../utils/userUtils.js';

// Import activity types
import {
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  ACTIVITY_DISPLAY_NAMES,
  ACTIVITY_ICONS,
  ACTIVITY_WEIGHTS,
  ACTIVITY_TYPE_OPTIONS,
  getActivityCategory,
  getActivityTypeConfig
} from './activityTypes.js';

// Import difficulty types
import {
  DIFFICULTY_TYPES,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_ICONS,
  getDifficultyLevel,
  getDifficultyConfig,
  getDifficultyOptionsForDropdown
} from './difficultyTypes.js';

// Import target audience types
import {
  TARGET_AUDIENCE_TYPES,
  TARGET_AUDIENCE_LABELS,
  TARGET_AUDIENCE_OPTIONS
} from './targetAudienceTypes.js';

// Import priority types
import {
  PRIORITY_TYPES,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_CODES,
  getPriorityLabel,
  getPriorityColor,
  getPriorityCode,
  getPriorityConfig
} from './priorityTypes.js';

// Import dashboard types
import {
  DARK_MODE_COLORS,
  getThemeColor
} from './dashboardTypes.jsx';

// Import icon types and theme utilities
import { 
  CATEGORY_ICONS,
  getThemedIcon
} from './iconTypes.jsx';

// Export role constants
export {
  ROLE_STRINGS,
  ROLE_DISPLAY_NAMES,
  ROLE_HIERARCHY,
  ROLE_PRECEDENCE,
  DEFAULT_ROLE,
  ALL_ROLES,
  ROLE_KEYS
};

// Export activity constants
export {
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  ACTIVITY_DISPLAY_NAMES,
  ACTIVITY_ICONS,
  ACTIVITY_WEIGHTS,
  ACTIVITY_TYPE_OPTIONS,
  getActivityCategory,
  getActivityTypeConfig
};

// Export difficulty constants
export {
  DIFFICULTY_TYPES,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_ICONS,
  getDifficultyLevel,
  getDifficultyConfig,
  getDifficultyOptionsForDropdown
};

// Export target audience constants
export {
  TARGET_AUDIENCE_TYPES,
  TARGET_AUDIENCE_LABELS,
  TARGET_AUDIENCE_OPTIONS
};

// Export priority constants
export {
  PRIORITY_TYPES,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_CODES,
  getPriorityLabel,
  getPriorityColor,
  getPriorityCode,
  getPriorityConfig
};

// Export dashboard types
export {
  DARK_MODE_COLORS,
  getThemeColor
};

// Export icon types and theme utilities
export {
  CATEGORY_ICONS,
  getThemedIcon
};

// PostgreSQL Table Names (instead of MongoDB collections)
export const TABLES = {
  // User Management
  USERS: 'users',
  USER_AUTH: 'user_auth',
  
  // Academic Structure
  PROGRAMS: 'programs',
  SUBJECTS: 'subjects',
  CLASSES: 'classes',
  CATEGORIES: 'categories',
  
  // Enrollment & Progress
  ENROLLMENTS: 'enrollments',
  SUBJECT_ENROLLMENTS: 'subject_enrollments',
  STUDENT_PROGRESS: 'student_progress',
  
  // Quizzes & Assessments
  QUIZZES: 'quizzes',
  QUIZ_SUBMISSIONS: 'quiz_submissions',
  QUIZ_RESULTS: 'quiz_results',
  QUIZ_QUESTIONS: 'quiz_questions',
  
  // Attendance & Behavior
  ATTENDANCE: 'attendance',
  BEHAVIOR: 'behavior',
  PENALTIES: 'penalties',
  PARTICIPATION: 'participation',
  GAMIFICATION: 'gamification',
  
  // Communication
  CHAT_ROOMS: 'chat_rooms',
  CHAT_MESSAGES: 'chat_messages',
  NOTIFICATIONS: 'notifications',
  EMAIL_TEMPLATES: 'email_templates',
  
  // Resources & Activities
  RESOURCES: 'resources',
  ACTIVITIES: 'activities',
  ANNOUNCEMENTS: 'announcements'
};

// Database Field Names (PostgreSQL column names)
export const FIELDS = {
  // Common fields
  ID: 'id',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  DELETED_AT: 'deleted_at',
  IS_ACTIVE: 'is_active',
  
  // User fields
  USER_ID: 'user_id',
  EMAIL: 'email',
  PASSWORD_HASH: 'password_hash',
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  DISPLAY_NAME: 'display_name',
  ROLE: 'role',
  STATUS: 'status',
  
  // Academic fields
  PROGRAM_ID: 'program_id',
  SUBJECT_ID: 'subject_id',
  CLASS_ID: 'class_id',
  INSTRUCTOR_ID: 'instructor_id',
  STUDENT_ID: 'student_id',
  
  // Enrollment fields
  ENROLLMENT_ID: 'enrollment_id',
  ENROLLED_AT: 'enrolled_at',
  COMPLETED_AT: 'completed_at',
  GRADE: 'grade',
  
  // Attendance fields
  ATTENDANCE_ID: 'attendance_id',
  DATE: 'date',
  CHECK_IN_TIME: 'check_in_time',
  CHECK_OUT_TIME: 'check_out_time',
  METHOD: 'method',
  STATUS: 'status',
  NOTES: 'notes'
};

// Attendance methods constants
export const ATTENDANCE_METHODS = {
  ROSTER_QUICK_ACTION: 'roster_quick_action',
  MANUAL_INSTRUCTOR: 'manual_instructor',
  MANUAL: 'manual',
  QR_SCAN: 'qr_scan',
  QR_SCAN_AUTO: 'qr_scan_auto',
  QR_SCAN_MANUAL: 'qr_scan_manual',
  BATCH_IMPORT: 'batch_import',
  API_IMPORT: 'api_import',
  BULK_UPDATE: 'bulk_update'
};

// Attendance method labels function
export const getAttendanceMethodLabel = (method, t, lang = 'en') => {
  if (!method) return '';
  
  const methodLabels = {
    roster_quick_action: lang === 'ar' ? 'إجراء سريع' : 'Quick Action',
    manual_instructor: lang === 'ar' ? 'يدوي المدرب' : 'Manual Instructor',
    manual: lang === 'ar' ? 'يدوي' : 'Manual',
    qr_scan: lang === 'ar' ? 'مسح QR' : 'QR Scan',
    qr_scan_auto: lang === 'ar' ? 'مسح QR تلقائي' : 'Auto QR Scan',
    qr_scan_manual: lang === 'ar' ? 'مسح QR يدوي' : 'Manual QR Scan',
    batch_import: lang === 'ar' ? 'استيراد دفعة' : 'Batch Import',
    api_import: lang === 'ar' ? 'استيراد API' : 'API Import',
    bulk_update: lang === 'ar' ? 'تحديث جماعي' : 'Bulk Update'
  };
  
  return methodLabels[method] || method;
};

// Should show method label function
export const shouldShowMethodLabel = (method, comment) => {
  if (!method) return false;
  
  // Show method label for certain methods
  const methodsToShow = [
    'roster_quick_action',
    'qr_scan',
    'qr_scan_auto',
    'qr_scan_manual'
  ];
  
  return methodsToShow.includes(method) && !comment;
};

// Icon types
export const ICON_TYPES = {
  USER: 'user',
  CLASS: 'class',
  PROGRAM: 'program',
  ATTENDANCE: 'attendance',
  BEHAVIOR: 'behavior',
  PENALTY: 'penalty',
  PARTICIPATION: 'participation',
  NOTIFICATION: 'notification',
  ACTIVITY: 'activity',
  STATUS: 'status'
};

// Icon utility functions
export const getIcon = (type, color = null) => {
  const iconMap = {
    [ICON_TYPES.USER]: 'user',
    [ICON_TYPES.CLASS]: 'class',
    [ICON_TYPES.PROGRAM]: 'program',
    [ICON_TYPES.ATTENDANCE]: 'attendance',
    [ICON_TYPES.BEHAVIOR]: 'behavior',
    [ICON_TYPES.PENALTY]: 'penalty',
    [ICON_TYPES.PARTICIPATION]: 'participation',
    [ICON_TYPES.NOTIFICATION]: 'notification',
    [ICON_TYPES.ACTIVITY]: 'activity',
    [ICON_TYPES.STATUS]: 'status'
  };
  
  return iconMap[type] || 'default';
};

export const getIconWithColorLocal = (type, color) => {
  return {
    icon: getIcon(type),
    color: color || '#3b82f6' // Default primary color
  };
};

// Dashboard colors (local definition since not exported from dashboardTypes.jsx)
export const DASHBOARD_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
  GRAY: '#6b7280'
};

// Activity type colors for UI display (centralized constants)
export const ACTIVITY_COLORS = {
  participation: '#3b82f6', // Blue
  behavior: '#f97316',      // Orange
  penalty: '#dc2626',       // Darker red
  humanitarian: '#8b5cf6',  // Purple
  attendance: '#10b981',    // Green
  absent: '#ef4444',       // Red
  late: '#f59e0b',         // Orange-yellow
  present: '#10b981'       // Green
};

export const getTypeIcon = (type) => getIcon(type);
export const getAttendanceIcon = () => getIcon(ICON_TYPES.ATTENDANCE);
export const getBehaviorIcon = () => getIcon(ICON_TYPES.BEHAVIOR);
export const getPenaltyIcon = () => getIcon(ICON_TYPES.PENALTY);
export const getParticipationIcon = () => getIcon(ICON_TYPES.PARTICIPATION);
export const getNotificationIcon = () => getIcon(ICON_TYPES.NOTIFICATION);
export const getActivityIcon = () => getIcon(ICON_TYPES.ACTIVITY);
export const getUserStatusIcon = (status) => {
  const statusIcons = {
    active: 'user-active',
    inactive: 'user-inactive',
    pending: 'user-pending',
    suspended: 'user-suspended'
  };
  
  return statusIcons[status] || 'user';
};
export const getUserRoleIcon = (role) => {
  const roleIcons = {
    admin: 'admin',
    instructor: 'instructor',
    student: 'student',
    hr: 'hr',
    super_admin: 'super-admin'
  };
  
  return roleIcons[role] || 'user';
};

// Default export
export default {
  // Role constants
  ROLE_STRINGS,
  ROLE_DISPLAY_NAMES,
  ROLE_HIERARCHY,
  ROLE_PRECEDENCE,
  DEFAULT_ROLE,
  ALL_ROLES,
  ROLE_KEYS,
  
  // Activity constants
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  ACTIVITY_DISPLAY_NAMES,
  ACTIVITY_ICONS,
  ACTIVITY_WEIGHTS,
  ACTIVITY_TYPE_OPTIONS,
  getActivityCategory,
  getActivityTypeConfig,
  
  // Difficulty constants
  DIFFICULTY_TYPES,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_ICONS,
  getDifficultyLevel,
  getDifficultyConfig,
  getDifficultyOptionsForDropdown,
  
  // Target audience constants
  TARGET_AUDIENCE_TYPES,
  TARGET_AUDIENCE_LABELS,
  TARGET_AUDIENCE_OPTIONS,
  
  // Priority constants
  PRIORITY_TYPES,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_CODES,
  getPriorityLabel,
  getPriorityColor,
  getPriorityCode,
  getPriorityConfig,
  
  // Dashboard types
  DASHBOARD_COLORS,
  DARK_MODE_COLORS,
  getThemeColor,
  
  // Icon and theme utilities
  // getThemedIcon is defined locally below
  
  // Database constants
  TABLES,
  FIELDS,
  
  // Attendance constants
  ATTENDANCE_METHODS,
  getAttendanceMethodLabel,
  shouldShowMethodLabel,
  
  // Icon constants
  ICON_TYPES,
  DASHBOARD_COLORS,
  CATEGORY_ICONS,
  getIcon,
  getIconWithColorLocal,
  getThemedIcon,
  getTypeIcon,
  getAttendanceIcon,
  getBehaviorIcon,
  getPenaltyIcon,
  getParticipationIcon,
  getNotificationIcon,
  getActivityIcon,
  getUserStatusIcon,
  getUserRoleIcon
};
