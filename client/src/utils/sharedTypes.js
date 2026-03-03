/**
 * Unified Shared Types System
 * Provides consistent interface for all shared types: behavior, participation, absence, penalty, attendance, and general statuses
 * These are shared type utilities used throughout the application
 */

import { BEHAVIOR_TYPES, getBehaviorTypeById, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '../constants/behaviorTypes';
import { PARTICIPATION_TYPES, getParticipationTypeById, getParticipationLabel, getParticipationIcon, getParticipationColor } from '../constants/participationTypes';
import { ABSENCE_TYPES, getAbsenceTypeById, getAbsenceLabel, getAbsenceIcon, getAbsenceColor } from '../constants/absenceTypes';
import { PENALTY_TYPES, getPenaltyTypeById, getPenaltyLabel, getPenaltyIcon, getPenaltyColor } from '../constants/penaltyTypes';
import { ATTENDANCE_STATUS_LABELS, getAttendanceLabel } from '../constants/attendanceTypes';

// Mode types for navigation and filtering
export const MODE_TYPES = {
  ACTIVITIES: 'activities',
  RESOURCES: 'resources',
  ANNOUNCEMENTS: 'announcements',
  REVIEW: 'review'
};

// Resource types for filtering
export const RESOURCE_TYPES = {
  ALL: 'all',
  VIDEO: 'video',
  LINK: 'link',
  DOCUMENT: 'document'
};

// Record type constants for student logs, activities, and core entities
export const RECORD_TYPES = {
  // Core academic records
  ATTENDANCE: 'attendance',
  PENALTY: 'penalty',
  PARTICIPATION: 'participation',
  BEHAVIOR: 'behavior',
  ACTIVITY: 'activities',
  RESOURCE: 'resource',

  // User & catalog entities (used by delete modals and history views)
  USER: 'user',
  PROGRAM: 'program',
  SUBJECT: 'subject',
  CLASS: 'class',
  CATEGORY: 'category',
  QUIZ: 'quiz',
  ENROLLMENT: 'enrollment',
  ANNOUNCEMENT: 'announcement',
  SUBMISSION: 'submission',
  ASSIGNMENT: 'assignment',
  COURSE: 'course',
  MARK: 'mark',
  GRADE: 'grade',
  SCHEDULE: 'schedule',
  EVENT: 'event',
  NOTIFICATION: 'notification'
};

// Record type labels for display
export const RECORD_TYPE_LABELS = {
  [RECORD_TYPES.PARTICIPATION]: {
    en: 'Participation',
    ar: 'مشاركة'
  },
  [RECORD_TYPES.BEHAVIOR]: {
    en: 'Behavior',
    ar: 'سلوك'
  },
  [RECORD_TYPES.ATTENDANCE]: {
    en: 'Attendance',
    ar: 'الحضور'
  },
  [RECORD_TYPES.PENALTY]: {
    en: 'Penalty',
    ar: 'عقوبة'
  },
  [RECORD_TYPES.ACTIVITY]: {
    en: 'Activity',
    ar: 'نشاط'
  },
  [RECORD_TYPES.RESOURCE]: {
    en: 'Resource',
    ar: 'مورد'
  },
  [RECORD_TYPES.USER]: {
    en: 'User',
    ar: 'مستخدم'
  },
  [RECORD_TYPES.PROGRAM]: {
    en: 'Program',
    ar: 'برنامج'
  },
  [RECORD_TYPES.SUBJECT]: {
    en: 'Subject',
    ar: 'مادة'
  },
  [RECORD_TYPES.CLASS]: {
    en: 'Class',
    ar: 'فصل'
  },
  [RECORD_TYPES.QUIZ]: {
    en: 'Quiz',
    ar: 'اختبار'
  },
  [RECORD_TYPES.ENROLLMENT]: {
    en: 'Enrollment',
    ar: 'تسجيل'
  },
  [RECORD_TYPES.ANNOUNCEMENT]: {
    en: 'Announcement',
    ar: 'إعلان'
  },
  [RECORD_TYPES.SUBMISSION]: {
    en: 'Submission',
    ar: 'تسليم'
  },
  [RECORD_TYPES.ASSIGNMENT]: {
    en: 'Assignment',
    ar: 'مهمة'
  },
  [RECORD_TYPES.COURSE]: {
    en: 'Course',
    ar: 'دورة'
  }
};

// Helper function to get localized record type label
export const getRecordTypeLabel = (recordType, lang = 'en') => {
  const label = RECORD_TYPE_LABELS[recordType];
  return label ? (lang === 'ar' ? label.ar : label.en) : recordType;
};

// General Status Constants - Phase 2
export const GENERAL_STATUS = {
  // Basic statuses
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  
  // Task/Assignment statuses
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  
  // Progress statuses
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  REVIEW: 'review',
  
  // System statuses
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  IDLE: 'idle'
};

// Enrollment Status Constants
export const ENROLLMENT_STATUS = {
  ACTIVE: GENERAL_STATUS.ACTIVE,
  PENDING: GENERAL_STATUS.PENDING,
  COMPLETED: GENERAL_STATUS.COMPLETED,
  CANCELLED: GENERAL_STATUS.CANCELLED,
  SUSPENDED: 'suspended',
  WITHDRAWN: 'withdrawn'
};

// Submission Status Constants
export const SUBMISSION_STATUS = {
  DRAFT: GENERAL_STATUS.DRAFT,
  SUBMITTED: GENERAL_STATUS.SUBMITTED,
  GRADED: GENERAL_STATUS.GRADED,
  RETURNED: GENERAL_STATUS.RETURNED,
  OVERDUE: GENERAL_STATUS.OVERDUE,
  PLAGIARISM_DETECTED: 'plagiarism_detected'
};

// Task Status Constants
export const TASK_STATUS = {
  NOT_STARTED: GENERAL_STATUS.NOT_STARTED,
  IN_PROGRESS: GENERAL_STATUS.IN_PROGRESS,
  COMPLETED: GENERAL_STATUS.COMPLETED,
  OVERDUE: GENERAL_STATUS.OVERDUE,
  CANCELLED: GENERAL_STATUS.CANCELLED
};

// User Account Status Constants
export const USER_STATUS = {
  ACTIVE: GENERAL_STATUS.ACTIVE,
  INACTIVE: GENERAL_STATUS.INACTIVE,
  PENDING: GENERAL_STATUS.PENDING,
  SUSPENDED: 'suspended',
  BANNED: 'banned'
};

// Class/Course Status Constants
export const CLASS_STATUS = {
  ACTIVE: GENERAL_STATUS.ACTIVE,
  INACTIVE: GENERAL_STATUS.INACTIVE,
  UPCOMING: 'upcoming',
  COMPLETED: GENERAL_STATUS.COMPLETED,
  CANCELLED: GENERAL_STATUS.CANCELLED
};

// Status Display Labels (English)
export const STATUS_LABELS_EN = {
  [GENERAL_STATUS.ACTIVE]: 'Active',
  [GENERAL_STATUS.INACTIVE]: 'Inactive',
  [GENERAL_STATUS.PENDING]: 'Pending',
  [GENERAL_STATUS.COMPLETED]: 'Completed',
  [GENERAL_STATUS.CANCELLED]: 'Cancelled',
  [GENERAL_STATUS.APPROVED]: 'Approved',
  [GENERAL_STATUS.REJECTED]: 'Rejected',
  [GENERAL_STATUS.DRAFT]: 'Draft',
  [GENERAL_STATUS.SUBMITTED]: 'Submitted',
  [GENERAL_STATUS.GRADED]: 'Graded',
  [GENERAL_STATUS.RETURNED]: 'Returned',
  [GENERAL_STATUS.OVERDUE]: 'Overdue',
  [GENERAL_STATUS.NOT_STARTED]: 'Not Started',
  [GENERAL_STATUS.IN_PROGRESS]: 'In Progress',
  [GENERAL_STATUS.ON_HOLD]: 'On Hold',
  [GENERAL_STATUS.REVIEW]: 'Under Review',
  [GENERAL_STATUS.EXCELLENT]: 'Excellent',
  [GENERAL_STATUS.GOOD]: 'Good',
  [GENERAL_STATUS.SATISFACTORY]: 'Satisfactory',
  [GENERAL_STATUS.NEEDS_IMPROVEMENT]: 'Needs Improvement',
  [GENERAL_STATUS.LOADING]: 'Loading',
  [GENERAL_STATUS.ERROR]: 'Error',
  [GENERAL_STATUS.SUCCESS]: 'Success',
  [GENERAL_STATUS.IDLE]: 'Idle',
  [ENROLLMENT_STATUS.SUSPENDED]: 'Suspended',
  [ENROLLMENT_STATUS.WITHDRAWN]: 'Withdrawn',
  [SUBMISSION_STATUS.PLAGIARISM_DETECTED]: 'Plagiarism Detected',
  [USER_STATUS.SUSPENDED]: 'Suspended',
  [USER_STATUS.BANNED]: 'Banned',
  [CLASS_STATUS.UPCOMING]: 'Upcoming'
};

// Status Display Labels (Arabic)
export const STATUS_LABELS_AR = {
  [GENERAL_STATUS.ACTIVE]: 'نشط',
  [GENERAL_STATUS.INACTIVE]: 'غير نشط',
  [GENERAL_STATUS.PENDING]: 'في الانتظار',
  [GENERAL_STATUS.COMPLETED]: 'مكتمل',
  [GENERAL_STATUS.CANCELLED]: 'ملغي',
  [GENERAL_STATUS.APPROVED]: 'موافق عليه',
  [GENERAL_STATUS.REJECTED]: 'مرفوض',
  [GENERAL_STATUS.DRAFT]: 'مسودة',
  [GENERAL_STATUS.SUBMITTED]: 'مقدم',
  [GENERAL_STATUS.GRADED]: 'مصنف',
  [GENERAL_STATUS.RETURNED]: 'مُعاد',
  [GENERAL_STATUS.OVERDUE]: 'متأخر',
  [GENERAL_STATUS.NOT_STARTED]: 'لم يبدأ',
  [GENERAL_STATUS.IN_PROGRESS]: 'قيد التنفيذ',
  [GENERAL_STATUS.ON_HOLD]: 'معلق',
  [GENERAL_STATUS.REVIEW]: 'قيد المراجعة',
  [GENERAL_STATUS.EXCELLENT]: 'ممتاز',
  [GENERAL_STATUS.GOOD]: 'جيد',
  [GENERAL_STATUS.SATISFACTORY]: 'مرضي',
  [GENERAL_STATUS.NEEDS_IMPROVEMENT]: 'يحتاج تحسين',
  [GENERAL_STATUS.LOADING]: 'جاري التحميل',
  [GENERAL_STATUS.ERROR]: 'خطأ',
  [GENERAL_STATUS.SUCCESS]: 'نجح',
  [GENERAL_STATUS.IDLE]: 'خامل',
  [ENROLLMENT_STATUS.SUSPENDED]: 'موقوف',
  [ENROLLMENT_STATUS.WITHDRAWN]: 'منسحب',
  [SUBMISSION_STATUS.PLAGIARISM_DETECTED]: 'تم اكتشاف الانتحال',
  [USER_STATUS.SUSPENDED]: 'موقوف',
  [USER_STATUS.BANNED]: 'محظور',
  [CLASS_STATUS.UPCOMING]: 'قادم'
};

// Status Color Mapping
export const STATUS_COLORS = {
  [GENERAL_STATUS.ACTIVE]: '#16a34a',      // green-600
  [GENERAL_STATUS.INACTIVE]: '#6b7280',    // gray-500
  [GENERAL_STATUS.PENDING]: '#f59e0b',     // amber-500
  [GENERAL_STATUS.COMPLETED]: '#059669',   // emerald-600
  [GENERAL_STATUS.CANCELLED]: '#dc2626',   // red-600
  [GENERAL_STATUS.APPROVED]: '#059669',     // emerald-600
  [GENERAL_STATUS.REJECTED]: '#dc2626',     // red-600
  [GENERAL_STATUS.DRAFT]: '#6b7280',       // gray-500
  [GENERAL_STATUS.SUBMITTED]: '#3b82f6',    // blue-500
  [GENERAL_STATUS.GRADED]: '#059669',      // emerald-600
  [GENERAL_STATUS.RETURNED]: '#f59e0b',     // amber-500
  [GENERAL_STATUS.OVERDUE]: '#dc2626',      // red-600
  [GENERAL_STATUS.NOT_STARTED]: '#6b7280',  // gray-500
  [GENERAL_STATUS.IN_PROGRESS]: '#3b82f6',  // blue-500
  [GENERAL_STATUS.ON_HOLD]: '#f59e0b',     // amber-500
  [GENERAL_STATUS.REVIEW]: '#8b5cf6',      // violet-500
  [GENERAL_STATUS.EXCELLENT]: '#059669',   // emerald-600
  [GENERAL_STATUS.GOOD]: '#16a34a',        // green-600
  [GENERAL_STATUS.SATISFACTORY]: '#f59e0b', // amber-500
  [GENERAL_STATUS.NEEDS_IMPROVEMENT]: '#f97316', // orange-500
  [GENERAL_STATUS.LOADING]: '#6b7280',     // gray-500
  [GENERAL_STATUS.ERROR]: '#dc2626',       // red-600
  [GENERAL_STATUS.SUCCESS]: '#059669',     // emerald-600
  [GENERAL_STATUS.IDLE]: '#6b7280',        // gray-500
  [ENROLLMENT_STATUS.SUSPENDED]: '#dc2626', // red-600
  [ENROLLMENT_STATUS.WITHDRAWN]: '#6b7280', // gray-500
  [SUBMISSION_STATUS.PLAGIARISM_DETECTED]: '#dc2626', // red-600
  [USER_STATUS.SUSPENDED]: '#dc2626',       // red-600
  [USER_STATUS.BANNED]: '#7f1d1d',          // red-900
  [CLASS_STATUS.UPCOMING]: '#3b82f6'        // blue-500
};

// Status Icon Mapping
export const STATUS_ICONS = {
  [GENERAL_STATUS.ACTIVE]: 'CheckCircle',
  [GENERAL_STATUS.INACTIVE]: 'XCircle',
  [GENERAL_STATUS.PENDING]: 'Clock',
  [GENERAL_STATUS.COMPLETED]: 'CheckCircle',
  [GENERAL_STATUS.CANCELLED]: 'XCircle',
  [GENERAL_STATUS.APPROVED]: 'CheckCircle',
  [GENERAL_STATUS.REJECTED]: 'XCircle',
  [GENERAL_STATUS.DRAFT]: 'FileText',
  [GENERAL_STATUS.SUBMITTED]: 'Send',
  [GENERAL_STATUS.GRADED]: 'Award',
  [GENERAL_STATUS.RETURNED]: 'RotateCcw',
  [GENERAL_STATUS.OVERDUE]: 'AlertCircle',
  [GENERAL_STATUS.NOT_STARTED]: 'Circle',
  [GENERAL_STATUS.IN_PROGRESS]: 'Loader',
  [GENERAL_STATUS.ON_HOLD]: 'Pause',
  [GENERAL_STATUS.REVIEW]: 'Eye',
  [GENERAL_STATUS.EXCELLENT]: 'Star',
  [GENERAL_STATUS.GOOD]: 'ThumbsUp',
  [GENERAL_STATUS.SATISFACTORY]: 'Check',
  [GENERAL_STATUS.NEEDS_IMPROVEMENT]: 'AlertTriangle',
  [GENERAL_STATUS.LOADING]: 'Loader',
  [GENERAL_STATUS.ERROR]: 'XCircle',
  [GENERAL_STATUS.SUCCESS]: 'CheckCircle',
  [GENERAL_STATUS.IDLE]: 'Circle',
  [ENROLLMENT_STATUS.SUSPENDED]: 'Ban',
  [ENROLLMENT_STATUS.WITHDRAWN]: 'LogOut',
  [SUBMISSION_STATUS.PLAGIARISM_DETECTED]: 'AlertTriangle',
  [USER_STATUS.SUSPENDED]: 'Ban',
  [USER_STATUS.BANNED]: 'Shield',
  [CLASS_STATUS.UPCOMING]: 'Calendar'
};

// Helper Functions for Status Management
export const getStatusLabel = (status, lang = 'en') => {
  const labels = lang === 'ar' ? STATUS_LABELS_AR : STATUS_LABELS_EN;
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#6b7280';
};

export const getStatusIcon = (status) => {
  return STATUS_ICONS[status] || 'HelpCircle';
};

export const getStatusDisplay = (status, lang = 'en') => {
  return {
    value: status,
    label: getStatusLabel(status, lang),
    color: getStatusColor(status),
    icon: getStatusIcon(status)
  };
};

// Status validation functions
export const isValidStatus = (status) => {
  return Object.values(GENERAL_STATUS).includes(status);
};

export const isValidEnrollmentStatus = (status) => {
  return Object.values(ENROLLMENT_STATUS).includes(status);
};

export const isValidSubmissionStatus = (status) => {
  return Object.values(SUBMISSION_STATUS).includes(status);
};

export const isValidTaskStatus = (status) => {
  return Object.values(TASK_STATUS).includes(status);
};

export const isValidUserStatus = (status) => {
  return Object.values(USER_STATUS).includes(status);
};

export const isValidClassStatus = (status) => {
  return Object.values(CLASS_STATUS).includes(status);
};

// Status comparison functions
export const isActiveStatus = (status) => {
  return status === GENERAL_STATUS.ACTIVE;
};

export const isPendingStatus = (status) => {
  return status === GENERAL_STATUS.PENDING;
};

export const isCompletedStatus = (status) => {
  return status === GENERAL_STATUS.COMPLETED;
};

export const isNegativeStatus = (status) => {
  return [
    GENERAL_STATUS.CANCELLED,
    GENERAL_STATUS.REJECTED,
    GENERAL_STATUS.ERROR,
    GENERAL_STATUS.OVERDUE,
    GENERAL_STATUS.NEEDS_IMPROVEMENT
  ].includes(status);
};

export const isPositiveStatus = (status) => {
  return [
    GENERAL_STATUS.ACTIVE,
    GENERAL_STATUS.COMPLETED,
    GENERAL_STATUS.APPROVED,
    GENERAL_STATUS.SUCCESS,
    GENERAL_STATUS.EXCELLENT,
    GENERAL_STATUS.GOOD
  ].includes(status);
};

// Type constants for type safety
export const TYPE_CATEGORIES = {
  BEHAVIOR: 'behavior',
  PARTICIPATION: 'participation', 
  ABSENCE: 'absence',
  PENALTY: 'penalty',
  ATTENDANCE: 'attendance'
};

// Type mapping for quick lookup
const TYPE_MAPPINGS = {
  [TYPE_CATEGORIES.BEHAVIOR]: {
    types: BEHAVIOR_TYPES,
    getById: getBehaviorTypeById,
    getLabel: getBehaviorLabel,
    getIcon: getBehaviorIcon,
    getColor: getBehaviorColor
  },
  [TYPE_CATEGORIES.PARTICIPATION]: {
    types: PARTICIPATION_TYPES,
    getById: getParticipationTypeById,
    getLabel: getParticipationLabel,
    getIcon: getParticipationIcon,
    getColor: getParticipationColor
  },
  [TYPE_CATEGORIES.ABSENCE]: {
    types: ABSENCE_TYPES,
    getById: getAbsenceTypeById,
    getLabel: getAbsenceLabel,
    getIcon: getAbsenceIcon,
    getColor: getAbsenceColor
  },
  [TYPE_CATEGORIES.PENALTY]: {
    types: PENALTY_TYPES,
    getById: getPenaltyTypeById,
    getLabel: getPenaltyLabel,
    getIcon: getPenaltyIcon,
    getColor: getPenaltyColor
  },
  [TYPE_CATEGORIES.ATTENDANCE]: {
    types: ATTENDANCE_STATUS_LABELS,
    getById: (id) => ATTENDANCE_STATUS_LABELS[id] || null,
    getLabel: (id, lang = 'en') => {
      const status = ATTENDANCE_STATUS_LABELS[id];
      return status ? (lang === 'ar' ? status.label_ar : status.label_en) : id;
    },
    getIcon: (id) => {
      const status = ATTENDANCE_STATUS_LABELS[id];
      return status ? status.icon : 'Users';
    },
    getColor: (id) => {
      const status = ATTENDANCE_STATUS_LABELS[id];
      return status ? status.color : '#6b7280';
    }
  }
};

/**
 * Unified type information getter
 * @param {string} category - Type category (behavior, participation, absence, penalty, attendance)
 * @param {string} typeId - Type ID
 * @returns {Object|null} Type information or null if not found
 */
export const getTypeInfo = (category, typeId) => {
  const mapping = TYPE_MAPPINGS[category];
  if (!mapping) return null;
  
  return mapping.getById(typeId);
};

/**
 * Unified label getter
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @param {string} lang - Language ('en' or 'ar')
 * @returns {string} Label or the typeId if not found
 */
export const getTypeLabel = (category, typeId, lang = 'en') => {
  const mapping = TYPE_MAPPINGS[category];
  if (!mapping) return typeId;
  
  return mapping.getLabel(typeId, lang);
};

/**
 * Unified icon getter
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @returns {string} Icon name or default icon
 */
export const getTypeIcon = (category, typeId) => {
  const mapping = TYPE_MAPPINGS[category];
  if (!mapping) return 'HelpCircle';
  
  return mapping.getIcon(typeId);
};

/**
 * Unified color getter
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @returns {string} Color hex code or default color
 */
export const getTypeColor = (category, typeId) => {
  const mapping = TYPE_MAPPINGS[category];
  if (!mapping) return '#6b7280';
  
  return mapping.getColor(typeId);
};

/**
 * Get all types for a category
 * @param {string} category - Type category
 * @returns {Array} Array of type objects
 */
export const getAllTypes = (category) => {
  const mapping = TYPE_MAPPINGS[category];
  if (!mapping) return [];
  
  return mapping.types || [];
};

/**
 * Check if a type ID exists in a category
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @returns {boolean} True if type exists
 */
export const isValidType = (category, typeId) => {
  return getTypeInfo(category, typeId) !== null;
};

/**
 * Get formatted type display with icon and label
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @param {string} lang - Language
 * @param {Object} options - Additional options
 * @returns {Object} Formatted display object
 */
export const getFormattedTypeDisplay = (category, typeId, lang = 'en', options = {}) => {
  const {
    includeIcon = true,
    includeColor = true,
    includePoints = false,
    includeDeduction = false
  } = options;
  
  const typeInfo = getTypeInfo(category, typeId);
  if (!typeInfo) {
    return {
      id: typeId,
      label: typeId,
      icon: 'HelpCircle',
      color: '#6b7280'
    };
  }
  
  const result = {
    id: typeId,
    label: getTypeLabel(category, typeId, lang),
    icon: includeIcon ? getTypeIcon(category, typeId) : null,
    color: includeColor ? getTypeColor(category, typeId) : null
  };
  
  if (includePoints && typeInfo.points !== undefined) {
    result.points = typeInfo.points;
  }
  
  if (includeDeduction && typeInfo.deduction !== undefined) {
    result.deduction = typeInfo.deduction;
  }
  
  return result;
};

/**
 * Create options array for dropdown/select components
 * @param {string} category - Type category
 * @param {string} lang - Language
 * @param {Object} options - Additional options
 * @returns {Array} Array of option objects for select components
 */
export const createTypeOptions = (category, lang = 'en', options = {}) => {
  const {
    includeEmpty = false,
    emptyLabel = 'Select Type',
    includeIcon = true,
    includePoints = false,
    includeDeduction = false
  } = options;
  
  const types = getAllTypes(category);
  const typeOptions = types.map(type => getFormattedTypeDisplay(category, type.id, lang, {
    includeIcon,
    includePoints,
    includeDeduction
  }));
  
  const optionsArray = typeOptions.map(type => ({
    value: type.id,
    label: type.label,
    icon: includeIcon && type.icon ? { name: type.icon, color: type.color } : null
  }));
  
  if (includeEmpty) {
    return [{ value: '', label: emptyLabel }, ...optionsArray];
  }
  
  return optionsArray;
};

/**
 * Get localized label for any action type using translation function
 * @param {string} actionType - Action type (penalty, behavior, participation, attendance)
 * @param {string} typeId - Specific type ID (cheating, talk_in_class, active_discussion, etc.)
 * @param {Function} t - Translation function from LangContext
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {string} Localized label
 */
export const getLocalizedActionLabel = (actionType, typeId, t, lang = 'en') => {
  // First try to get translation from LangContext
  const translatedLabel = t(typeId);
  if (translatedLabel && translatedLabel !== typeId) {
    return translatedLabel;
  }
  
  // Fallback to type-specific label functions
  switch (actionType) {
    case 'penalty':
      return getPenaltyLabel(typeId, lang);
    case 'behavior':
      return getBehaviorLabel(typeId, lang);
    case 'participation':
      return getParticipationLabel(typeId, lang);
    case 'attendance':
      return getAttendanceLabel(typeId, lang);
    default:
      return typeId;
  }
};

/**
 * Smart type resolver - automatically detects category from type ID patterns
 * @param {string} typeId - Type ID
 * @returns {string|null} Detected category or null
 */
export const detectTypeCategory = (typeId) => {
  if (!typeId) return null;
  
  // Check behavior patterns
  if (BEHAVIOR_TYPES.some(type => type.id === typeId)) {
    return TYPE_CATEGORIES.BEHAVIOR;
  }
  
  // Check participation patterns
  if (PARTICIPATION_TYPES.some(type => type.id === typeId)) {
    return TYPE_CATEGORIES.PARTICIPATION;
  }
  
  // Check absence patterns
  if (ABSENCE_TYPES.some(type => type.id === typeId)) {
    return TYPE_CATEGORIES.ABSENCE;
  }
  
  // Check penalty patterns
  if (PENALTY_TYPES.some(type => type.id === typeId)) {
    return TYPE_CATEGORIES.PENALTY;
  }
  
  // Check attendance patterns
  if (ATTENDANCE_STATUS_LABELS[typeId]) {
    return TYPE_CATEGORIES.ATTENDANCE;
  }
  
  return null;
};

/**
 * Auto-resolving type helpers - detect category automatically
 */
export const getAutoTypeLabel = (typeId, lang = 'en') => {
  const category = detectTypeCategory(typeId);
  return category ? getTypeLabel(category, typeId, lang) : typeId;
};

export const getAutoTypeIcon = (typeId) => {
  const category = detectTypeCategory(typeId);
  return category ? getTypeIcon(category, typeId) : 'HelpCircle';
};

export const getAutoTypeColor = (typeId) => {
  const category = detectTypeCategory(typeId);
  return category ? getTypeColor(category, typeId) : '#6b7280';
};

export default {
  TYPE_CATEGORIES,
  GENERAL_STATUS,
  ENROLLMENT_STATUS,
  SUBMISSION_STATUS,
  TASK_STATUS,
  USER_STATUS,
  CLASS_STATUS,
  STATUS_LABELS_EN,
  STATUS_LABELS_AR,
  STATUS_COLORS,
  STATUS_ICONS,
  getTypeInfo,
  getTypeLabel,
  getTypeIcon,
  getTypeColor,
  getAllTypes,
  isValidType,
  getFormattedTypeDisplay,
  createTypeOptions,
  detectTypeCategory,
  getAutoTypeLabel,
  getAutoTypeIcon,
  getAutoTypeColor,
  getRecordTypeLabel,
  getStatusLabel,
  getStatusColor,
  getStatusIcon,
  getStatusDisplay,
  isValidStatus,
  isValidEnrollmentStatus,
  isValidSubmissionStatus,
  isValidTaskStatus,
  isValidUserStatus,
  isValidClassStatus,
  isActiveStatus,
  isPendingStatus,
  isCompletedStatus,
  isNegativeStatus,
  isPositiveStatus
};
