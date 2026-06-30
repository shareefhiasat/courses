/**
 * Unified Shared Types System
 * Provides consistent interface for all shared types: behavior, participation, absence, penalty, attendance, and general statuses
 * These are shared type utilities used throughout the application
 */

// OLD: import { BEHAVIOR_TYPES, getBehaviorTypeById, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '../constants/behaviorTypes';
// OLD: import { PARTICIPATION_TYPES, getParticipationTypeById, getParticipationLabel, getParticipationIcon, getParticipationColor } from '../constants/participationTypes';
// OLD: import { ABSENCE_TYPES, getAbsenceTypeById, getAbsenceLabel, getAbsenceIcon, getAbsenceColor } from '../constants/absenceTypes';
// OLD: import { PENALTY_TYPES, getPenaltyTypeById, getPenaltyLabel, getPenaltyIcon, getPenaltyColor } from '../constants/penaltyTypes';
// NOTE: These functions now accept lookup data from useLookupTypes hook instead of hardcoded constants
import { ATTENDANCE_STATUS_LABELS, getAttendanceLabel, getLocalizedAttendanceLabel, getAttendanceColor, getAttendanceIcon } from '../constants/attendanceTypes';

import { info, error, warn, debug } from '@services/utils/logger.js';

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
  DOCUMENT: 'document',
  IMAGE: 'image',
  AUDIO: 'audio',
  INTERACTIVE: 'interactive',
  ASSIGNMENT: 'assignment',
  QUIZ: 'quiz',
  PROJECT: 'project'
};

// Record type constants for type safety
export const RECORD_TYPES = {
  ACTIVITY: 'activity',
  QUIZ: 'quiz',
  RESOURCE: 'resource',
  ANNOUNCEMENT: 'announcement',
  USER: 'user',
  CLASS: 'class',
  PROGRAM: 'program',
  SUBJECT: 'subject',
  ENROLLMENT: 'enrollment',
  ATTENDANCE: 'attendance',
  BEHAVIOR: 'behavior',
  PARTICIPATION: 'participation',
  PENALTY: 'penalty',
  ABSENCE: 'absence',
  SUBMISSION: 'submission',
  GRADE: 'grade',
  NOTIFICATION: 'notification'
};

// Record type labels for display
export const RECORD_TYPE_LABELS = {
  [RECORD_TYPES.ACTIVITY]: { en: 'Activity', ar: 'نشاط' },
  [RECORD_TYPES.QUIZ]: { en: 'Quiz', ar: 'اختبار' },
  [RECORD_TYPES.RESOURCE]: { en: 'Resource', ar: 'مورد' },
  [RECORD_TYPES.ANNOUNCEMENT]: { en: 'Announcement', ar: 'إعلان' },
  [RECORD_TYPES.USER]: { en: 'User', ar: 'مستخدم' },
  [RECORD_TYPES.CLASS]: { en: 'Class', ar: 'فصل' },
  [RECORD_TYPES.PROGRAM]: { en: 'Program', ar: 'برنامج' },
  [RECORD_TYPES.SUBJECT]: { en: 'Subject', ar: 'مادة' },
  [RECORD_TYPES.ENROLLMENT]: { en: 'Enrollment', ar: 'تسجيل' },
  [RECORD_TYPES.ATTENDANCE]: { en: 'Attendance', ar: 'الحضور' },
  [RECORD_TYPES.BEHAVIOR]: { en: 'Behavior', ar: 'سلوك' },
  [RECORD_TYPES.PARTICIPATION]: { en: 'Participation', ar: 'مشاركة' },
  [RECORD_TYPES.PENALTY]: { en: 'Penalty', ar: 'عقوبة' },
  [RECORD_TYPES.ABSENCE]: { en: 'Absence', ar: 'غياب' },
  [RECORD_TYPES.SUBMISSION]: { en: 'Submission', ar: 'تسليم' },
  [RECORD_TYPES.GRADE]: { en: 'Grade', ar: 'درجة' },
  [RECORD_TYPES.NOTIFICATION]: { en: 'Notification', ar: 'إشعار' }
};

// General status constants
export const GENERAL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived'
};

// Task status constants
export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Submission status constants
export const SUBMISSION_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  REJECTED: 'rejected',
  LATE: 'late'
};

// Status labels for different languages
export const STATUS_LABELS_EN = {
  ...Object.fromEntries(
    Object.entries({
      [GENERAL_STATUS.ACTIVE]: 'Active',
      [GENERAL_STATUS.INACTIVE]: 'Inactive',
      [GENERAL_STATUS.PENDING]: 'Pending',
      [GENERAL_STATUS.COMPLETED]: 'Completed',
      [GENERAL_STATUS.CANCELLED]: 'Cancelled',
      [GENERAL_STATUS.REJECTED]: 'Rejected',
      [GENERAL_STATUS.SUSPENDED]: 'Suspended',
      [GENERAL_STATUS.ARCHIVED]: 'Archived'
    })
  ),
  [TASK_STATUS.NOT_STARTED]: 'Not Started',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.OVERDUE]: 'Overdue',
  [SUBMISSION_STATUS.NOT_SUBMITTED]: 'Not Submitted',
  [SUBMISSION_STATUS.SUBMITTED]: 'Submitted',
  [SUBMISSION_STATUS.GRADED]: 'Graded',
  [SUBMISSION_STATUS.REJECTED]: 'Rejected',
  [SUBMISSION_STATUS.LATE]: 'Late'
};

export const STATUS_LABELS_AR = {
  ...Object.fromEntries(
    Object.entries({
      [GENERAL_STATUS.ACTIVE]: 'نشط',
      [GENERAL_STATUS.INACTIVE]: 'غير نشط',
      [GENERAL_STATUS.PENDING]: 'معلق',
      [GENERAL_STATUS.COMPLETED]: 'مكتمل',
      [GENERAL_STATUS.CANCELLED]: 'ملغي',
      [GENERAL_STATUS.REJECTED]: 'مرفوض',
      [GENERAL_STATUS.SUSPENDED]: 'معلق',
      [GENERAL_STATUS.ARCHIVED]: 'مؤرشف'
    })
  ),
  [TASK_STATUS.NOT_STARTED]: 'لم يبدأ',
  [TASK_STATUS.IN_PROGRESS]: 'قيد التنفيذ',
  [TASK_STATUS.OVERDUE]: 'متأخر',
  [SUBMISSION_STATUS.NOT_SUBMITTED]: 'لم يتم التسليم',
  [SUBMISSION_STATUS.SUBMITTED]: 'تم التسليم',
  [SUBMISSION_STATUS.GRADED]: 'تم التقييم',
  [SUBMISSION_STATUS.REJECTED]: 'مرفوض',
  [SUBMISSION_STATUS.LATE]: 'متأخر'
};

// Status colors for UI
export const STATUS_COLORS = {
  ...Object.fromEntries(
    Object.entries({
      [GENERAL_STATUS.ACTIVE]: '#16a34a',
      [GENERAL_STATUS.INACTIVE]: '#6b7280',
      [GENERAL_STATUS.PENDING]: '#eab308',
      [GENERAL_STATUS.COMPLETED]: '#2563eb',
      [GENERAL_STATUS.CANCELLED]: '#dc2626',
      [GENERAL_STATUS.REJECTED]: '#dc2626',
      [GENERAL_STATUS.SUSPENDED]: '#f97316',
      [GENERAL_STATUS.ARCHIVED]: '#6b7280'
    })
  ),
  [TASK_STATUS.NOT_STARTED]: '#6b7280',
  [TASK_STATUS.IN_PROGRESS]: '#3b82f6',
  [TASK_STATUS.OVERDUE]: '#dc2626',
  [SUBMISSION_STATUS.NOT_SUBMITTED]: '#6b7280',
  [SUBMISSION_STATUS.SUBMITTED]: '#3b82f6',
  [SUBMISSION_STATUS.GRADED]: '#16a34a',
  [SUBMISSION_STATUS.REJECTED]: '#dc2626',
  [SUBMISSION_STATUS.LATE]: '#f97316'
};

// Status icons for UI
export const STATUS_ICONS = {
  ...Object.fromEntries(
    Object.entries({
      [GENERAL_STATUS.ACTIVE]: 'CheckCircle',
      [GENERAL_STATUS.INACTIVE]: 'XCircle',
      [GENERAL_STATUS.PENDING]: 'Clock',
      [GENERAL_STATUS.COMPLETED]: 'CheckCircle',
      [GENERAL_STATUS.CANCELLED]: 'XCircle',
      [GENERAL_STATUS.REJECTED]: 'XCircle',
      [GENERAL_STATUS.SUSPENDED]: 'AlertTriangle',
      [GENERAL_STATUS.ARCHIVED]: 'Archive'
    })
  ),
  [TASK_STATUS.NOT_STARTED]: 'Circle',
  [TASK_STATUS.IN_PROGRESS]: 'Loader',
  [TASK_STATUS.OVERDUE]: 'AlertCircle',
  [SUBMISSION_STATUS.NOT_SUBMITTED]: 'Circle',
  [SUBMISSION_STATUS.SUBMITTED]: 'Send',
  [SUBMISSION_STATUS.GRADED]: 'CheckCircle',
  [SUBMISSION_STATUS.REJECTED]: 'XCircle',
  [SUBMISSION_STATUS.LATE]: 'Clock'
};

// Type constants for type safety
export const TYPE_CATEGORIES = {
  BEHAVIOR: 'behavior',
  PARTICIPATION: 'participation', 
  ABSENCE: 'absence',
  PENALTY: 'penalty',
  ATTENDANCE: 'attendance'
};

// Type mapping for quick lookup - now accepts lookup data
const createTypeMappings = (lookupData = {}) => {
  const behaviorTypes = lookupData['behavior-types'] || [];
  const participationTypes = lookupData['participation-types'] || [];
  const penaltyTypes = lookupData['penalty-types'] || [];
  
  return {
    [TYPE_CATEGORIES.BEHAVIOR]: {
      types: behaviorTypes,
      getById: (id) => behaviorTypes.find(type => type.id === id) || null,
      getLabel: (id, lang = 'en') => {
        const type = behaviorTypes.find(t => t.id === id);
        return type ? (lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn) : id;
      },
      getIcon: (id) => {
        const type = behaviorTypes.find(t => t.id === id);
        return type ? type.icon : 'HelpCircle';
      },
      getColor: (id) => {
        const type = behaviorTypes.find(t => t.id === id);
        return type ? type.color : '#6b7280';
      }
    },
    [TYPE_CATEGORIES.PARTICIPATION]: {
      types: participationTypes,
      getById: (id) => participationTypes.find(type => type.id === id) || null,
      getLabel: (id, lang = 'en') => {
        const type = participationTypes.find(t => t.id === id);
        return type ? (lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn) : id;
      },
      getIcon: (id) => {
        const type = participationTypes.find(t => t.id === id);
        return type ? type.icon : 'MessageSquare';
      },
      getColor: (id) => {
        const type = participationTypes.find(t => t.id === id);
        return type ? type.color : '#3b82f6';
      }
    },
    [TYPE_CATEGORIES.PENALTY]: {
      types: penaltyTypes,
      getById: (id) => penaltyTypes.find(type => type.id === id) || null,
      getLabel: (id, lang = 'en') => {
        const type = penaltyTypes.find(t => t.id === id);
        return type ? (lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn) : id;
      },
      getIcon: (id) => {
        const type = penaltyTypes.find(t => t.id === id);
        return type ? type.icon : 'AlertTriangle';
      },
      getColor: (id) => {
        const type = penaltyTypes.find(t => t.id === id);
        return type ? type.color : '#dc2626';
      }
    },
    [TYPE_CATEGORIES.ATTENDANCE]: {
    types: ATTENDANCE_STATUS_LABELS,
    getById: (id) => ATTENDANCE_STATUS_LABELS[id] || null,
    getLabel: (id, lang = 'en') => {
      return getLocalizedAttendanceLabel(id, lang) || id;
    },
    getIcon: (id) => {
      return getAttendanceIcon(id) || 'Users';
    },
    getColor: (id) => {
      return getAttendanceColor(id) || '#6b7280';
    }
  }
  };
};

/**
 * Unified type information getter
 * @param {string} category - Type category (behavior, participation, absence, penalty, attendance)
 * @param {string} typeId - Type ID
 * @param {Object} lookupData - Lookup data from useLookupTypes hook (optional)
 * @returns {Object|null} Type information or null if not found
 */
export const getTypeInfo = (category, typeId, lookupData = {}) => {
  const typeMappings = createTypeMappings(lookupData);
  const mapping = typeMappings[category];
  if (!mapping) return null;
  
  return mapping.getById(typeId);
};

/**
 * Unified label getter
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @param {string} lang - Language ('en' or 'ar')
 * @param {Object} lookupData - Lookup data from useLookupTypes hook (optional)
 * @returns {string} Label or the typeId if not found
 */
export const getTypeLabel = (category, typeId, lang = 'en', lookupData = {}) => {
  const typeMappings = createTypeMappings(lookupData);
  const mapping = typeMappings[category];
  if (!mapping) return typeId;
  
  return mapping.getLabel(typeId, lang);
};

/**
 * Unified icon getter
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @param {Object} lookupData - Lookup data from useLookupTypes hook (optional)
 * @returns {string} Icon name or default icon
 */
export const getTypeIcon = (category, typeId, lookupData = {}) => {
  const typeMappings = createTypeMappings(lookupData);
  const mapping = typeMappings[category];
  if (!mapping) return 'HelpCircle';
  
  return mapping.getIcon(typeId);
};

/**
 * Unified color getter
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @param {Object} lookupData - Lookup data from useLookupTypes hook (optional)
 * @returns {string} Color hex code or default color
 */
export const getTypeColor = (category, typeId, lookupData = {}) => {
  const typeMappings = createTypeMappings(lookupData);
  const mapping = typeMappings[category];
  if (!mapping) return '#6b7280';
  
  return mapping.getColor(typeId);
};

/**
 * Get all types for a category
 * @param {string} category - Type category
 * @param {Object} lookupData - Lookup data from useLookupTypes hook (optional)
 * @returns {Array} Array of type objects
 */
export const getAllTypes = (category, lookupData = {}) => {
  const typeMappings = createTypeMappings(lookupData);
  const mapping = typeMappings[category];
  if (!mapping) return [];
  
  return mapping.types || [];
};

/**
 * Smart type resolver - automatically detects category from type ID patterns
 * @param {string} typeId - Type ID
 * @param {Object} lookupData - Lookup data from useLookupTypes hook (optional)
 * @returns {string|null} Detected category or null
 */
export const detectTypeCategory = (typeId, lookupData = {}) => {
  if (!typeId) return null;
  
  const behaviorTypes = lookupData['behavior-types'] || [];
  const participationTypes = lookupData['participation-types'] || [];
  const penaltyTypes = lookupData['penalty-types'] || [];
  
  // Check behavior patterns
  if (behaviorTypes.some(type => type.id === typeId)) {
    return TYPE_CATEGORIES.BEHAVIOR;
  }
  
  // Check participation patterns
  if (participationTypes.some(type => type.id === typeId)) {
    return TYPE_CATEGORIES.PARTICIPATION;
  }
  
  // Check penalty patterns
  if (penaltyTypes.some(type => type.id === typeId)) {
    return TYPE_CATEGORIES.PENALTY;
  }
  
  // Check attendance patterns
  if (ATTENDANCE_STATUS_LABELS[typeId]) {
    return TYPE_CATEGORIES.ATTENDANCE;
  }
  
  return null;
};

// Helper function to get localized record type label
export const getRecordTypeLabel = (recordType, lang = 'en') => {
  const label = RECORD_TYPE_LABELS[recordType];
  return label ? (lang === 'ar' ? label.ar : label.en) : recordType;
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
  return Object.values(GENERAL_STATUS).includes(status);
};

export const isValidSubmissionStatus = (status) => {
  return Object.values(GENERAL_STATUS).includes(status);
};

export const isValidTaskStatus = (status) => {
  return Object.values(GENERAL_STATUS).includes(status);
};

export const isValidUserStatus = (status) => {
  return Object.values(GENERAL_STATUS).includes(status);
};

export const isValidClassStatus = (status) => {
  return Object.values(GENERAL_STATUS).includes(status);
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
    GENERAL_STATUS.SUSPENDED
  ].includes(status);
};

export const isPositiveStatus = (status) => {
  return [
    GENERAL_STATUS.ACTIVE,
    GENERAL_STATUS.COMPLETED
  ].includes(status);
};

// Type validation functions
export const isValidType = (category, typeId) => {
  return getTypeInfo(category, typeId) !== null;
};

/**
 * Get formatted type display with icon, color, and label
 * @param {string} category - Type category
 * @param {string} typeId - Type ID
 * @param {string} lang - Language code
 * @param {Object} options - Additional options
 * @returns {Object} Formatted display object
 */
export const getFormattedTypeDisplay = (category, typeId, lang = 'en', options = {}) => {
  const {
    includeIcon = true,
    includeColor = true,
    includeLabel = true
  } = options;

  const display = {
    value: typeId,
    category,
    lang
  };

  if (includeLabel) {
    display.label = getTypeLabel(category, typeId, lang);
  }

  if (includeIcon) {
    display.icon = getTypeIcon(category, typeId);
  }

  if (includeColor) {
    display.color = getTypeColor(category, typeId);
  }

  return display;
};

/**
 * Create type options for select components
 * @param {string} category - Type category
 * @param {string} lang - Language code
 * @param {Object} options - Additional options
 * @returns {Array} Array of option objects for select components
 */
export const createTypeOptions = (category, lang = 'en', lookupData = {}, options = {}) => {
  const {
    includeEmpty = false,
    emptyLabel = lang === 'ar' ? 'الكل' : 'All',
    emptyValue = '',
    sortBy = 'label', // 'label' | 'value' | 'none'
    sortDirection = 'asc' // 'asc' | 'desc'
  } = options;

  const types = getAllTypes(category, lookupData);
  let typeOptions = types.map(type => ({
    value: type.id,
    label: getTypeLabel(category, type.id, lang),
    color: getTypeColor(category, type.id),
    icon: getTypeIcon(category, type.id)
  }));

  // Sort options if requested
  if (sortBy !== 'none') {
    typeOptions.sort((a, b) => {
      const aValue = sortBy === 'label' ? a.label : a.value;
      const bValue = sortBy === 'label' ? b.label : b.value;
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  // Add empty option if requested
  if (includeEmpty) {
    typeOptions.unshift({
      value: emptyValue,
      label: emptyLabel,
      color: '#6b7280',
      icon: 'HelpCircle'
    });
  }

  return typeOptions;
};

const CATEGORY_MAP = {
  participation: TYPE_CATEGORIES.PARTICIPATION,
  behavior: TYPE_CATEGORIES.BEHAVIOR,
  penalty: TYPE_CATEGORIES.PENALTY,
  attendance: TYPE_CATEGORIES.ATTENDANCE,
};

const humanizeTypeId = (typeId) => {
  if (!typeId) return '';
  return String(typeId)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Resolve a localized label for participation/behavior/penalty action types.
 * Accepts a type id string or an API object with nameEn/nameAr.
 */
export const getLocalizedActionLabel = (category, typeValue, t, lang = 'en', lookupData = {}) => {
  if (typeValue == null || typeValue === '') return '';

  if (typeof typeValue === 'object') {
    const localized = lang === 'ar'
      ? (typeValue.nameAr || typeValue.nameEn || typeValue.code)
      : (typeValue.nameEn || typeValue.nameAr || typeValue.code);
    if (localized) return localized;
    typeValue = typeValue.code || typeValue.id || '';
  }

  const typeId = String(typeValue);
  const mappedCategory = CATEGORY_MAP[category] || category;
  const fromLookup = getTypeLabel(mappedCategory, typeId, lang, lookupData);
  if (fromLookup && fromLookup !== typeId) {
    return fromLookup;
  }

  if (typeof t === 'function') {
    const dictKey = `${category}_${typeId}`;
    const translated = t(dictKey);
    const fallback = dictKey.replaceAll('_', ' ');
    if (translated && translated !== fallback) {
      return translated;
    }
  }

  return humanizeTypeId(typeId);
};
