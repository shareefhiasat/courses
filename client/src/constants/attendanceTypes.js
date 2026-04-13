import { info, error, warn, debug } from '../services/utils/logger.js';

// Attendance Status Types - Updated to match new rules
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT_NO_EXCUSE: 'ABSENT_NO_EXCUSE',
  LATE: 'LATE',
  ABSENT_WITH_EXCUSE: 'ABSENT_WITH_EXCUSE',
  EXCUSED_LEAVE: 'EXCUSED_LEAVE',
  HUMAN_CASE: 'HUMAN_CASE',
  // Standup status types (matching database codes)
  STANDUP_PRESENT: 'STANDUP_PRESENT',
  STANDUP_LATE: 'STANDUP_LATE',
  STANDUP_ABSENT: 'STANDUP_ABSENT',
  STANDUP_CLINIC: 'STANDUP_CLINIC'
};

// Attendance Methods
export const ATTENDANCE_METHODS = {
  MANUAL: 'manual',
  QR_CODE: 'qr_code',
  BIOMETRIC: 'biometric',
  RFID: 'rfid',
  FACE_RECOGNITION: 'face_recognition',
  GPS: 'gps',
  SELF_REPORT: 'self_report'
};

// Attendance Display Names - Updated to match new rules
export const ATTENDANCE_DISPLAY_NAMES = {
  [ATTENDANCE_STATUS.PRESENT]: 'Present',
  [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'Absent',
  [ATTENDANCE_STATUS.LATE]: 'Late',
  [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'Absent with excuse',
  [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'Excused Leave',
  [ATTENDANCE_STATUS.HUMAN_CASE]: 'Human Case',
  // Standup types (matching database codes)
  [ATTENDANCE_STATUS.STANDUP_PRESENT]: 'Present',
  [ATTENDANCE_STATUS.STANDUP_LATE]: 'Late',
  [ATTENDANCE_STATUS.STANDUP_ABSENT]: 'Absent',
  [ATTENDANCE_STATUS.STANDUP_CLINIC]: 'Clinic'
};

// Attendance Status Labels (for iconTypes.jsx) - Updated to match new status constants
export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.PRESENT]: 'Present',
  [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'Absent',
  [ATTENDANCE_STATUS.LATE]: 'Late',
  [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'Absent with excuse',
  [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'Excused Leave',
  [ATTENDANCE_STATUS.HUMAN_CASE]: 'Human Case',
  // Standup types (matching database codes)
  [ATTENDANCE_STATUS.STANDUP_PRESENT]: 'Present',
  [ATTENDANCE_STATUS.STANDUP_LATE]: 'Late',
  [ATTENDANCE_STATUS.STANDUP_ABSENT]: 'Absent',
  [ATTENDANCE_STATUS.STANDUP_CLINIC]: 'Clinic'
};

// Attendance Colors - Updated to match new status constants
export const ATTENDANCE_COLORS = {
  [ATTENDANCE_STATUS.PRESENT]: '#10b981', // Green
  [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: '#ef4444', // Red
  [ATTENDANCE_STATUS.LATE]: '#f59e0b', // Yellow
  [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: '#ef4444', // Red (same as ABSENT_NO_EXCUSE)
  [ATTENDANCE_STATUS.EXCUSED_LEAVE]: '#ec4899', // Purple
  [ATTENDANCE_STATUS.HUMAN_CASE]: '#8b5cf6', // Purple (Human Case)
  // Standup types (matching database codes)
  [ATTENDANCE_STATUS.STANDUP_PRESENT]: '#10b981', // Green
  [ATTENDANCE_STATUS.STANDUP_LATE]: '#f59e0b', // Yellow
  [ATTENDANCE_STATUS.STANDUP_ABSENT]: '#ef4444', // Red
  [ATTENDANCE_STATUS.STANDUP_CLINIC]: '#ec4899' // Pink (Clinic)
};

// Attendance Icons - Updated to match new status constants
export const ATTENDANCE_ICONS = {
  [ATTENDANCE_STATUS.PRESENT]: 'CheckCircle',
  [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'XCircle',
  [ATTENDANCE_STATUS.LATE]: 'Clock',
  [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'XCircle',
  [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'Heart',
  [ATTENDANCE_STATUS.HUMAN_CASE]: 'Heart',
  // Standup types (matching database codes)
  [ATTENDANCE_STATUS.STANDUP_PRESENT]: 'CheckCircle',
  [ATTENDANCE_STATUS.STANDUP_LATE]: 'Clock',
  [ATTENDANCE_STATUS.STANDUP_ABSENT]: 'XCircle',
  [ATTENDANCE_STATUS.STANDUP_CLINIC]: 'Heart'
};

// Attendance Rules
export const ATTENDANCE_RULES = {
  LATE_THRESHOLD_MINUTES: 15, // Minutes after which arrival is considered late
  ABSENCE_THRESHOLD_PERCENTAGE: 20, // Percentage threshold for failure
  MINIMUM_ATTENDANCE_PERCENTAGE: 80, // Minimum required attendance
  MAX_LATE_COUNT: 3, // Maximum number of lates before converting to absence
  EXCUSED_ABSENCE_LIMIT: 5 // Maximum number of excused absences per term
};

// Attendance Type Categories (for components that expect it)
export const ATTENDANCE_TYPE_CATEGORY = {
  REGULAR: 'regular',
  STANDUP: 'standup'
};

// Attendance Types (for components that expect it) - Updated to match new status constants
export const ATTENDANCE_TYPES = {
  PRESENT: 'PRESENT',
  ABSENT_NO_EXCUSE: 'ABSENT_NO_EXCUSE',
  LATE: 'LATE',
  ABSENT_WITH_EXCUSE: 'ABSENT_WITH_EXCUSE',
  EXCUSED_LEAVE: 'EXCUSED_LEAVE',
  HUMAN_CASE: 'HUMAN_CASE'
};

// Standup Attendance Types (for components that expect it) - matching database codes
export const STANDUP_ATTENDANCE_TYPES = {
  STANDUP_PRESENT: 'STANDUP_PRESENT',
  STANDUP_LATE: 'STANDUP_LATE',
  STANDUP_ABSENT: 'STANDUP_ABSENT',
  STANDUP_CLINIC: 'STANDUP_CLINIC'
};

// Helper functions
export const getAttendanceDisplayName = (status) => {
  return ATTENDANCE_DISPLAY_NAMES[status] || status;
};

export const getAttendanceColor = (status) => {
  return ATTENDANCE_COLORS[status] || '#6b7280';
};

export const getAttendanceIcon = (status) => {
  return ATTENDANCE_ICONS[status] || 'HelpCircle';
};

// Add missing getAttendanceLabel function (alias for getAttendanceDisplayName)
export const getAttendanceLabel = getAttendanceDisplayName;

export const isLate = (checkInTime, scheduledTime) => {
  const threshold = ATTENDANCE_RULES.LATE_THRESHOLD_MINUTES * 60 * 1000; // Convert to milliseconds
  return (checkInTime - scheduledTime) > threshold;
};

export const calculateAttendancePercentage = (presentDays, totalDays) => {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
};

export const isAttendanceSufficient = (percentage) => {
  return percentage >= ATTENDANCE_RULES.MINIMUM_ATTENDANCE_PERCENTAGE;
};

export const shouldFailDueToAttendance = (absentDays, totalDays) => {
  const absencePercentage = calculateAttendancePercentage(totalDays - absentDays, totalDays);
  return absencePercentage < (100 - ATTENDANCE_RULES.ABSENCE_THRESHOLD_PERCENTAGE);
};

export const getAttendanceSummary = (records) => {
  const summary = {
    total: records.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    sick: 0,
    holiday: 0,
    cancelled: 0,
    percentage: 0,
    isSufficient: false,
    shouldFail: false
  };
  
  records.forEach(record => {
    summary[record.status] = (summary[record.status] || 0) + 1;
  });
  
  summary.present = summary.present || 0;
  summary.percentage = calculateAttendancePercentage(summary.present, summary.total);
  summary.isSufficient = isAttendanceSufficient(summary.percentage);
  summary.shouldFail = shouldFailDueToAttendance(summary.absent, summary.total);
  
  return summary;
};

export const isValidAttendanceStatus = (status) => {
  return Object.values(ATTENDANCE_STATUS).includes(status);
};

export const isValidAttendanceMethod = (method) => {
  return Object.values(ATTENDANCE_METHODS).includes(method);
};

// Get localized attendance label based on language
export const getLocalizedAttendanceLabel = (status, lang = 'en') => {
  const labels = {
    en: {
      [ATTENDANCE_STATUS.PRESENT]: 'Present',
      [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'Absent',
      [ATTENDANCE_STATUS.LATE]: 'Late',
      [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'Absent with excuse',
      [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'Excused Leave',
      [ATTENDANCE_STATUS.HUMAN_CASE]: 'Human Case',
      // Standup types (matching database codes)
      [ATTENDANCE_STATUS.STANDUP_PRESENT]: 'Present',
      [ATTENDANCE_STATUS.STANDUP_LATE]: 'Late',
      [ATTENDANCE_STATUS.STANDUP_ABSENT]: 'Absent',
      [ATTENDANCE_STATUS.STANDUP_CLINIC]: 'Clinic'
    },
    ar: {
      [ATTENDANCE_STATUS.PRESENT]: 'حاضر',
      [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: 'غائب',
      [ATTENDANCE_STATUS.LATE]: 'متأخر',
      [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'غائب بعذر',
      [ATTENDANCE_STATUS.EXCUSED_LEAVE]: 'إجازة مرضية',
      [ATTENDANCE_STATUS.HUMAN_CASE]: 'حالة إنسانية',
      // Standup types (matching database codes)
      [ATTENDANCE_STATUS.STANDUP_PRESENT]: 'حاضر',
      [ATTENDANCE_STATUS.STANDUP_LATE]: 'متأخر',
      [ATTENDANCE_STATUS.STANDUP_ABSENT]: 'غائب',
      [ATTENDANCE_STATUS.STANDUP_CLINIC]: 'غائب عيادة'
    }
  };

  return labels[lang]?.[status] || labels.en[status] || status;
};

export default {
  ATTENDANCE_STATUS,
  ATTENDANCE_METHODS,
  ATTENDANCE_DISPLAY_NAMES,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_COLORS,
  ATTENDANCE_ICONS,
  ATTENDANCE_RULES,
  ATTENDANCE_TYPE_CATEGORY,
  ATTENDANCE_TYPES,
  STANDUP_ATTENDANCE_TYPES,
  getAttendanceDisplayName,
  getAttendanceColor,
  getAttendanceIcon,
  getAttendanceLabel,
  getLocalizedAttendanceLabel,
  isLate,
  calculateAttendancePercentage,
  isAttendanceSufficient,
  shouldFailDueToAttendance,
  getAttendanceSummary,
  isValidAttendanceStatus,
  isValidAttendanceMethod
};
