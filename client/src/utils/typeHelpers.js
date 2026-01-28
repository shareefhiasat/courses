/**
 * Unified Type Helpers System
 * Provides consistent interface for all types: behavior, participation, absence, penalty, attendance
 */

import { BEHAVIOR_TYPES, getBehaviorTypeById, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '../constants/behaviorTypes';
import { PARTICIPATION_TYPES, getParticipationTypeById, getParticipationLabel, getParticipationIcon, getParticipationColor } from '../constants/participationTypes';
import { ABSENCE_TYPES, getAbsenceTypeById, getAbsenceLabel, getAbsenceIcon, getAbsenceColor } from '../constants/absenceTypes';
import { PENALTY_TYPES, getPenaltyTypeById, getPenaltyLabel, getPenaltyIcon, getPenaltyColor } from '../constants/penaltyTypes';
import { ATTENDANCE_STATUS_LABELS } from '../firebase/attendance';

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
  getAutoTypeColor
};
