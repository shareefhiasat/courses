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

// Maps DB status type IDs to canonical status codes (matches attendance_status_types table)
export const STATUS_ID_MAP = {
  1: 'PRESENT',
  2: 'ABSENT',
  3: 'LATE',
  4: 'EXCUSED',
  5: 'SICK_LEAVE',
  6: 'EARLY_DEPARTURE',
  7: 'STANDUP_PRESENT',
  8: 'STANDUP_LATE',
  9: 'STANDUP_ABSENT',
  10: 'STANDUP_CLINIC',
  11: 'ABSENT_WITH_EXCUSE'
};

// Reverse mapping: DB status codes → frontend canonical status codes
// The DB stores short codes (ABSENT, EXCUSED, EARLY_DEPARTURE) but the frontend
// uses more specific codes (ABSENT_NO_EXCUSE, EXCUSED_LEAVE, HUMAN_CASE).
// This mapping normalizes DB codes back to frontend codes for display.
export const DB_CODE_TO_FRONTEND_STATUS = {
  'ABSENT': 'ABSENT_NO_EXCUSE',
  'EXCUSED': 'EXCUSED_LEAVE',
  'EARLY_DEPARTURE': 'HUMAN_CASE',
  'SICK_LEAVE': 'EXCUSED_LEAVE'
};

// Extract a status code string from a record that may have statusId, status as object, or status as string
// Returns the FRONTEND canonical status code (e.g. ABSENT_NO_EXCUSE, not ABSENT)
export const getStatusCodeFromRecord = (record) => {
  if (!record) return null;
  if (record.statusId && STATUS_ID_MAP[record.statusId]) {
    const dbCode = STATUS_ID_MAP[record.statusId];
    return DB_CODE_TO_FRONTEND_STATUS[dbCode] || dbCode;
  }
  if (typeof record.status === 'object') {
    const code = record.status?.code || record.status?.nameEn || null;
    if (!code) return null;
    const upper = code.toUpperCase();
    return DB_CODE_TO_FRONTEND_STATUS[upper] || upper;
  }
  if (record.status) {
    const upper = record.status.toUpperCase();
    return DB_CODE_TO_FRONTEND_STATUS[upper] || upper;
  }
  return null;
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
  [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'Absent excused',
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
  [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'Absent excused',
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

// Attendance Type Categories (for components that expect it)
export const ATTENDANCE_TYPE_CATEGORY = {
  REGULAR: 'regular',
  STANDUP: 'standup'
};

// Row Highlighting Thresholds
export const ATTENDANCE_HIGHLIGHT_THRESHOLDS = {
  YELLOW_MIN: 4,
  YELLOW_MAX: 5,
  ORANGE_MIN: 6,
  ORANGE_MAX: 7,
  RED_MIN: 8,
};

// Row Highlighting Colors
export const ATTENDANCE_HIGHLIGHT_COLORS = {
  YELLOW: '#fef08a', // Light yellow background
  ORANGE: '#fed7aa', // Light orange background
  RED: '#fecaca',    // Light red background
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

// Normalize status values to canonical keys (case-insensitive + alias mapping)
const STATUS_ALIASES = {
  'ABSENT': 'ABSENT_NO_EXCUSE',
  'ABSENT_NO_EXCUSE': 'ABSENT_NO_EXCUSE',
  'ABSENT_WITH_EXCUSE': 'ABSENT_WITH_EXCUSE',
  'EXCUSED': 'EXCUSED_LEAVE',
  'EXCUSED_LEAVE': 'EXCUSED_LEAVE',
  'HUMAN_CASE': 'HUMAN_CASE',
  'HUMANITARIAN': 'HUMAN_CASE',
  'CLINIC': 'HUMAN_CASE',
  'SICK_LEAVE': 'EXCUSED_LEAVE',
  'EARLY_DEPARTURE': 'HUMAN_CASE',
  'PRESENT': 'PRESENT',
  'LATE': 'LATE',
  'STANDUP_PRESENT': 'STANDUP_PRESENT',
  'STANDUP_LATE': 'STANDUP_LATE',
  'STANDUP_ABSENT': 'STANDUP_ABSENT',
  'STANDUP_CLINIC': 'STANDUP_CLINIC',
};

const normalizeStatus = (status) => {
  if (!status) return status;
  const upper = String(status).toUpperCase();
  return STATUS_ALIASES[upper] || upper;
};

// Helper functions
export const getAttendanceDisplayName = (status) => {
  const normalized = normalizeStatus(status);
  return ATTENDANCE_DISPLAY_NAMES[normalized] || status;
};

export const getAttendanceColor = (status) => {
  const normalized = normalizeStatus(status);
  return ATTENDANCE_COLORS[normalized] || '#6b7280';
};

export const getAttendanceIcon = (status) => {
  const normalized = normalizeStatus(status);
  return ATTENDANCE_ICONS[normalized] || 'HelpCircle';
};

// Add missing getAttendanceLabel function (alias for getAttendanceDisplayName)
export const getAttendanceLabel = getAttendanceDisplayName;

export const isValidAttendanceStatus = (status) => {
  const normalized = normalizeStatus(status);
  return Object.values(ATTENDANCE_STATUS).includes(normalized);
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
      [ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE]: 'Absent excused',
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
      [ATTENDANCE_STATUS.STANDUP_CLINIC]: 'عيادة'
    }
  };

  const normalized = normalizeStatus(status);
  return labels[lang]?.[normalized] || labels.en[normalized] || status;
};

export default {
  ATTENDANCE_STATUS,
  STATUS_ID_MAP,
  DB_CODE_TO_FRONTEND_STATUS,
  getStatusCodeFromRecord,
  ATTENDANCE_METHODS,
  ATTENDANCE_DISPLAY_NAMES,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_COLORS,
  ATTENDANCE_ICONS,
  ATTENDANCE_TYPE_CATEGORY,
  ATTENDANCE_TYPES,
  STANDUP_ATTENDANCE_TYPES,
  getAttendanceDisplayName,
  getAttendanceColor,
  getAttendanceIcon,
  getAttendanceLabel,
  getLocalizedAttendanceLabel,
  isValidAttendanceStatus,
  isValidAttendanceMethod
};
