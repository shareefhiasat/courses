import { info, error, warn, debug } from '../services/utils/logger.js';

/**
 * Absence Types Constants
 * 
 * Centralized constants for absence types based on Arabic regulations:
 * - With excuse (official document): -0.25 points per session
 * - Without excuse: -0.50 points per session
 * - Bereavement (death of close relative): No deduction, 3 days leave
 * - Exceeding 20%: Automatic failure (FB grade)
 */

export const ABSENCE_TYPES = [
  {
    id: "with_excuse",
    label_ar: "بعذر رسمي",
    label_en: "With Official Excuse",
    deduction: 0.25,
    icon: "FileSignature",
    color: "#3b82f6",
    description: "Absence with official documentation (medical certificate, etc.)"
  },
  {
    id: "without_excuse",
    label_ar: "بدون عذر",
    label_en: "Without Excuse",
    deduction: 0.50,
    icon: "XCircle",
    color: "#ef4444",
    description: "Absence without official documentation"
  },
  {
    id: "bereavement",
    label_ar: "وفاة",
    label_en: "Bereavement",
    deduction: 0,
    icon: "Heart",
    color: "#6b7280",
    description: "Death of close relative, up to 3 days leave"
  },
  {
    id: "medical_emergency",
    label_ar: "طوارئ طبية",
    label_en: "Medical Emergency",
    deduction: 0.25,
    icon: "AlertTriangle",
    color: "#f59e0b",
    description: "Medical emergency requiring immediate attention"
  },
  {
    id: "family_emergency",
    label_ar: "طوارئ عائلية",
    label_en: "Family Emergency",
    deduction: 0.25,
    icon: "Users",
    color: "#8b5cf6",
    description: "Family emergency requiring immediate attention"
  }
];

export const ABSENCE_THRESHOLDS = {
  WARNING_PERCENTAGE: 10, // 10% absence triggers warning
  CRITICAL_PERCENTAGE: 15, // 15% absence triggers critical warning
  FAILURE_PERCENTAGE: 20, // 20% absence triggers automatic failure
  MAX_ALLOWED_ABSENCES: 5, // Maximum allowed absences per term
  FAILURE_GRADE: "FB" // Grade for automatic failure
};

export const getAbsenceTypeById = (id) => {
  return ABSENCE_TYPES.find(type => type.id === id);
};

export const getAbsenceTypeLabel = (id, lang = 'en') => {
  const type = getAbsenceTypeById(id);
  if (!type) return id;
  return lang === 'ar' ? type.label_ar : type.label_en;
};

export const calculateAbsenceDeduction = (sessions, absenceType) => {
  const type = getAbsenceTypeById(absenceType);
  if (!type) return 0;
  return sessions * type.deduction;
};

export const checkAbsenceThreshold = (totalSessions, absentSessions) => {
  const percentage = (absentSessions / totalSessions) * 100;
  
  if (percentage >= ABSENCE_THRESHOLDS.FAILURE_PERCENTAGE) {
    return {
      level: 'failure',
      percentage,
      message: 'Student has exceeded absence limit and will receive FB grade',
      grade: ABSENCE_THRESHOLDS.FAILURE_GRADE
    };
  }
  
  if (percentage >= ABSENCE_THRESHOLDS.CRITICAL_PERCENTAGE) {
    return {
      level: 'critical',
      percentage,
      message: 'Student is approaching absence limit',
      grade: null
    };
  }
  
  if (percentage >= ABSENCE_THRESHOLDS.WARNING_PERCENTAGE) {
    return {
      level: 'warning',
      percentage,
      message: 'Student absence rate requires attention',
      grade: null
    };
  }
  
  return {
    level: 'normal',
    percentage,
    message: 'Student attendance is within acceptable range',
    grade: null
  };
};

// Add missing getAbsenceColor function
export const getAbsenceColor = (absenceType) => {
  const type = getAbsenceTypeById(absenceType);
  return type?.color || '#6b7280';
};

// Add missing getAbsenceIcon function
export const getAbsenceIcon = (absenceType) => {
  const type = getAbsenceTypeById(absenceType);
  return type?.icon || 'HelpCircle';
};

// Add missing getAbsenceLabel function (alias for getAbsenceTypeLabel)
export const getAbsenceLabel = getAbsenceTypeLabel;

export default {
  ABSENCE_TYPES,
  ABSENCE_THRESHOLDS,
  getAbsenceTypeById,
  getAbsenceTypeLabel,
  calculateAbsenceDeduction,
  checkAbsenceThreshold,
  getAbsenceColor,
  getAbsenceIcon,
  getAbsenceLabel
};
