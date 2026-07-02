/**
 * Note Enumeration Constants for Attendance Actions
 * These constants are used to standardize note content across the application
 * and enable proper localization via langContext
 */

// Quick action notes (for roster quick actions)
export const QUICK_NOTE_TYPES = {
  QUICK_ATTENDANCE_LATE: 'QUICK_ATTENDANCE_LATE',
  QUICK_ATTENDANCE_PRESENT: 'QUICK_ATTENDANCE_PRESENT',
  QUICK_ATTENDANCE_ABSENT: 'QUICK_ATTENDANCE_ABSENT',
  QUICK_ATTENDANCE_LEAVE: 'QUICK_ATTENDANCE_LEAVE',
  QUICK_ATTENDANCE_HUMAN_CASE: 'QUICK_ATTENDANCE_HUMAN_CASE'
};

// Manual action notes (for manual input)
export const MANUAL_NOTE_TYPES = {
  MANUAL_ATTENDANCE_LATE: 'MANUAL_ATTENDANCE_LATE',
  MANUAL_ATTENDANCE_PRESENT: 'MANUAL_ATTENDANCE_PRESENT',
  MANUAL_ATTENDANCE_ABSENT: 'MANUAL_ATTENDANCE_ABSENT',
  MANUAL_ATTENDANCE_LEAVE: 'MANUAL_ATTENDANCE_LEAVE',
  MANUAL_ATTENDANCE_HUMAN_CASE: 'MANUAL_ATTENDANCE_HUMAN_CASE'
};

// QR scan notes (for QR code scanning)
export const QR_NOTE_TYPES = {
  QR_ATTENDANCE_LATE: 'QR_ATTENDANCE_LATE',
  QR_ATTENDANCE_PRESENT: 'QR_ATTENDANCE_PRESENT',
  QR_ATTENDANCE_ABSENT: 'QR_ATTENDANCE_ABSENT',
  QR_ATTENDANCE_LEAVE: 'QR_ATTENDANCE_LEAVE',
  QR_ATTENDANCE_HUMAN_CASE: 'QR_ATTENDANCE_HUMAN_CASE'
};

// Standup notes (for standup attendance)
export const STANDUP_NOTE_TYPES = {
  STANDUP_PRESENT: 'STANDUP_PRESENT',
  STANDUP_LATE: 'STANDUP_LATE',
  STANDUP_ABSENT: 'STANDUP_ABSENT',
  STANDUP_CLINIC: 'STANDUP_CLINIC'
};

// Bulk scan notes (for bulk upload operations)
export const BULK_NOTE_TYPES = {
  BULK_ATTENDANCE_PRESENT: 'BULK_ATTENDANCE_PRESENT',
  BULK_ATTENDANCE_LATE: 'BULK_ATTENDANCE_LATE',
  BULK_ATTENDANCE_ABSENT: 'BULK_ATTENDANCE_ABSENT',
  BULK_ATTENDANCE_LEAVE: 'BULK_ATTENDANCE_LEAVE',
  BULK_ATTENDANCE_HUMAN_CASE: 'BULK_ATTENDANCE_HUMAN_CASE'
};

/**
 * Get localized note text from note type constant
 * @param {string} noteType - The note type constant
 * @param {Function} t - Translation function from langContext
 * @returns {string} Localized note text
 */
export const getLocalizedNoteText = (noteType, t) => {
  if (!t) return noteType;

  const noteMap = {
    // Quick notes
    [QUICK_NOTE_TYPES.QUICK_ATTENDANCE_LATE]: t('note_quick_late') || 'Quick Late',
    [QUICK_NOTE_TYPES.QUICK_ATTENDANCE_PRESENT]: t('note_quick_present') || 'Quick Present',
    [QUICK_NOTE_TYPES.QUICK_ATTENDANCE_ABSENT]: t('note_quick_absent_no_excuse') || 'Quick Absent',
    [QUICK_NOTE_TYPES.QUICK_ATTENDANCE_LEAVE]: t('note_quick_excused_leave') || 'Quick Excused Leave',
    [QUICK_NOTE_TYPES.QUICK_ATTENDANCE_HUMAN_CASE]: t('note_quick_human_case') || 'Quick Human Case',

    // Manual notes
    [MANUAL_NOTE_TYPES.MANUAL_ATTENDANCE_LATE]: t('note_manual_late') || 'Manual Late',
    [MANUAL_NOTE_TYPES.MANUAL_ATTENDANCE_PRESENT]: t('note_manual_present') || 'Manual Present',
    [MANUAL_NOTE_TYPES.MANUAL_ATTENDANCE_ABSENT]: t('note_manual_absent_no_excuse') || 'Manual Absent',
    [MANUAL_NOTE_TYPES.MANUAL_ATTENDANCE_LEAVE]: t('note_manual_excused_leave') || 'Manual Excused Leave',
    [MANUAL_NOTE_TYPES.MANUAL_ATTENDANCE_HUMAN_CASE]: t('note_manual_human_case') || 'Manual Human Case',

    // QR notes
    [QR_NOTE_TYPES.QR_ATTENDANCE_LATE]: t('note_qr_late') || 'QR Late',
    [QR_NOTE_TYPES.QR_ATTENDANCE_PRESENT]: t('note_qr_present') || 'QR Present',
    [QR_NOTE_TYPES.QR_ATTENDANCE_ABSENT]: t('note_qr_absent_no_excuse') || 'QR Absent',
    [QR_NOTE_TYPES.QR_ATTENDANCE_LEAVE]: t('note_qr_excused_leave') || 'QR Excused Leave',
    [QR_NOTE_TYPES.QR_ATTENDANCE_HUMAN_CASE]: t('note_qr_human_case') || 'QR Human Case',

    // Standup notes
    [STANDUP_NOTE_TYPES.STANDUP_PRESENT]: t('note_standup_present') || 'Standup Present',
    [STANDUP_NOTE_TYPES.STANDUP_LATE]: t('note_standup_late') || 'Standup Late',
    [STANDUP_NOTE_TYPES.STANDUP_ABSENT]: t('note_standup_absent') || 'Standup Absent',
    [STANDUP_NOTE_TYPES.STANDUP_CLINIC]: t('note_standup_clinic') || 'Standup Clinic',

    // Bulk scan notes
    [BULK_NOTE_TYPES.BULK_ATTENDANCE_PRESENT]: t('note_bulk_present') || 'Bulk Present',
    [BULK_NOTE_TYPES.BULK_ATTENDANCE_LATE]: t('note_bulk_late') || 'Bulk Late',
    [BULK_NOTE_TYPES.BULK_ATTENDANCE_ABSENT]: t('note_bulk_absent_no_excuse') || 'Bulk Absent',
    [BULK_NOTE_TYPES.BULK_ATTENDANCE_LEAVE]: t('note_bulk_excused_leave') || 'Bulk Excused Leave',
    [BULK_NOTE_TYPES.BULK_ATTENDANCE_HUMAN_CASE]: t('note_bulk_human_case') || 'Bulk Human Case'
  };

  return noteMap[noteType] || noteType;
};

/**
 * Get note type constant from status and method
 * @param {string} status - Attendance status
 * @param {string} method - Attendance method (quick, manual, qr, standup)
 * @returns {string} Note type constant
 */
export const getNoteTypeFromStatus = (status, method = 'manual') => {
  const statusUpper = status?.toUpperCase() || 'ATTENDANCE_PRESENT';
  
  const methodPrefixes = {
    quick: 'QUICK',
    manual: 'MANUAL',
    qr: 'QR',
    standup: 'STANDUP',
    bulk: 'BULK'
  };
  
  const prefix = methodPrefixes[method] || 'MANUAL';
  
  const statusMap = {
    'ATTENDANCE_PRESENT': 'ATTENDANCE_PRESENT',
    'ATTENDANCE_LATE': 'ATTENDANCE_LATE',
    'ATTENDANCE_ABSENT': 'ATTENDANCE_ABSENT',
    'ATTENDANCE_LEAVE': 'ATTENDANCE_LEAVE',
    'ATTENDANCE_HUMAN_CASE': 'ATTENDANCE_HUMAN_CASE',
    'STANDUP_PRESENT': 'ATTENDANCE_PRESENT',
    'STANDUP_LATE': 'ATTENDANCE_LATE',
    'STANDUP_ABSENT': 'ATTENDANCE_ABSENT',
    'STANDUP_CLINIC': 'CLINIC'
  };
  
  const statusSuffix = statusMap[statusUpper] || statusUpper;
  
  return `${prefix}_${statusSuffix}`;
};
