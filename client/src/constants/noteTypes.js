/**
 * Note Enumeration Constants for Attendance Actions
 * These constants are used to standardize note content across the application
 * and enable proper localization via langContext
 */

// Quick action notes (for roster quick actions)
export const QUICK_NOTE_TYPES = {
  QUICK_LATE: 'QUICK_LATE',
  QUICK_PRESENT: 'QUICK_PRESENT',
  QUICK_ABSENT: 'QUICK_ABSENT',
  QUICK_ABSENT_NO_EXCUSE: 'QUICK_ABSENT_NO_EXCUSE',
  QUICK_ABSENT_WITH_EXCUSE: 'QUICK_ABSENT_WITH_EXCUSE',
  QUICK_EXCUSED_LEAVE: 'QUICK_EXCUSED_LEAVE',
  QUICK_HUMAN_CASE: 'QUICK_HUMAN_CASE'
};

// Manual action notes (for manual input)
export const MANUAL_NOTE_TYPES = {
  MANUAL_LATE: 'MANUAL_LATE',
  MANUAL_PRESENT: 'MANUAL_PRESENT',
  MANUAL_ABSENT: 'MANUAL_ABSENT',
  MANUAL_ABSENT_NO_EXCUSE: 'MANUAL_ABSENT_NO_EXCUSE',
  MANUAL_ABSENT_WITH_EXCUSE: 'MANUAL_ABSENT_WITH_EXCUSE',
  MANUAL_EXCUSED_LEAVE: 'MANUAL_EXCUSED_LEAVE',
  MANUAL_HUMAN_CASE: 'MANUAL_HUMAN_CASE'
};

// QR scan notes (for QR code scanning)
export const QR_NOTE_TYPES = {
  QR_LATE: 'QR_LATE',
  QR_PRESENT: 'QR_PRESENT',
  QR_ABSENT: 'QR_ABSENT',
  QR_ABSENT_NO_EXCUSE: 'QR_ABSENT_NO_EXCUSE',
  QR_ABSENT_WITH_EXCUSE: 'QR_ABSENT_WITH_EXCUSE',
  QR_EXCUSED_LEAVE: 'QR_EXCUSED_LEAVE',
  QR_HUMAN_CASE: 'QR_HUMAN_CASE'
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
  BULK_PRESENT: 'BULK_PRESENT',
  BULK_LATE: 'BULK_LATE',
  BULK_ABSENT: 'BULK_ABSENT',
  BULK_ABSENT_NO_EXCUSE: 'BULK_ABSENT_NO_EXCUSE',
  BULK_ABSENT_WITH_EXCUSE: 'BULK_ABSENT_WITH_EXCUSE',
  BULK_EXCUSED_LEAVE: 'BULK_EXCUSED_LEAVE',
  BULK_HUMAN_CASE: 'BULK_HUMAN_CASE'
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
    [QUICK_NOTE_TYPES.QUICK_LATE]: t('note_quick_late') || 'Quick Late',
    [QUICK_NOTE_TYPES.QUICK_PRESENT]: t('note_quick_present') || 'Quick Present',
    [QUICK_NOTE_TYPES.QUICK_ABSENT]: t('note_quick_absent') || 'Quick Absent',
    [QUICK_NOTE_TYPES.QUICK_ABSENT_NO_EXCUSE]: t('note_quick_absent_no_excuse') || 'Quick Absent',
    [QUICK_NOTE_TYPES.QUICK_ABSENT_WITH_EXCUSE]: t('note_quick_absent_with_excuse') || 'Quick Absent Excused',
    [QUICK_NOTE_TYPES.QUICK_EXCUSED_LEAVE]: t('note_quick_excused_leave') || 'Quick Excused Leave',
    [QUICK_NOTE_TYPES.QUICK_HUMAN_CASE]: t('note_quick_human_case') || 'Quick Human Case',

    // Manual notes
    [MANUAL_NOTE_TYPES.MANUAL_LATE]: t('note_manual_late') || 'Manual Late',
    [MANUAL_NOTE_TYPES.MANUAL_PRESENT]: t('note_manual_present') || 'Manual Present',
    [MANUAL_NOTE_TYPES.MANUAL_ABSENT]: t('note_manual_absent') || 'Manual Absent',
    [MANUAL_NOTE_TYPES.MANUAL_ABSENT_NO_EXCUSE]: t('note_manual_absent_no_excuse') || 'Manual Absent',
    [MANUAL_NOTE_TYPES.MANUAL_ABSENT_WITH_EXCUSE]: t('note_manual_absent_with_excuse') || 'Manual Absent Excused',
    [MANUAL_NOTE_TYPES.MANUAL_EXCUSED_LEAVE]: t('note_manual_excused_leave') || 'Manual Excused Leave',
    [MANUAL_NOTE_TYPES.MANUAL_HUMAN_CASE]: t('note_manual_human_case') || 'Manual Human Case',

    // QR notes
    [QR_NOTE_TYPES.QR_LATE]: t('note_qr_late') || 'QR Late',
    [QR_NOTE_TYPES.QR_PRESENT]: t('note_qr_present') || 'QR Present',
    [QR_NOTE_TYPES.QR_ABSENT]: t('note_qr_absent') || 'QR Absent',
    [QR_NOTE_TYPES.QR_ABSENT_NO_EXCUSE]: t('note_qr_absent_no_excuse') || 'QR Absent',
    [QR_NOTE_TYPES.QR_ABSENT_WITH_EXCUSE]: t('note_qr_absent_with_excuse') || 'QR Absent Excused',
    [QR_NOTE_TYPES.QR_EXCUSED_LEAVE]: t('note_qr_excused_leave') || 'QR Excused Leave',
    [QR_NOTE_TYPES.QR_HUMAN_CASE]: t('note_qr_human_case') || 'QR Human Case',

    // Standup notes
    [STANDUP_NOTE_TYPES.STANDUP_PRESENT]: t('note_standup_present') || 'Standup Present',
    [STANDUP_NOTE_TYPES.STANDUP_LATE]: t('note_standup_late') || 'Standup Late',
    [STANDUP_NOTE_TYPES.STANDUP_ABSENT]: t('note_standup_absent') || 'Standup Absent',
    [STANDUP_NOTE_TYPES.STANDUP_CLINIC]: t('note_standup_clinic') || 'Standup Clinic',

    // Bulk scan notes
    [BULK_NOTE_TYPES.BULK_PRESENT]: t('note_bulk_present') || 'Bulk Present',
    [BULK_NOTE_TYPES.BULK_LATE]: t('note_bulk_late') || 'Bulk Late',
    [BULK_NOTE_TYPES.BULK_ABSENT]: t('note_bulk_absent') || 'Bulk Absent',
    [BULK_NOTE_TYPES.BULK_ABSENT_NO_EXCUSE]: t('note_bulk_absent_no_excuse') || 'Bulk Absent',
    [BULK_NOTE_TYPES.BULK_ABSENT_WITH_EXCUSE]: t('note_bulk_absent_with_excuse') || 'Bulk Absent Excused',
    [BULK_NOTE_TYPES.BULK_EXCUSED_LEAVE]: t('note_bulk_excused_leave') || 'Bulk Excused Leave',
    [BULK_NOTE_TYPES.BULK_HUMAN_CASE]: t('note_bulk_human_case') || 'Bulk Human Case'
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
  const statusUpper = status?.toUpperCase() || 'PRESENT';
  
  const methodPrefixes = {
    quick: 'QUICK',
    manual: 'MANUAL',
    qr: 'QR',
    standup: 'STANDUP',
    bulk: 'BULK'
  };
  
  const prefix = methodPrefixes[method] || 'MANUAL';
  
  const statusMap = {
    'PRESENT': 'PRESENT',
    'LATE': 'LATE',
    'ABSENT': 'ABSENT',
    'ABSENT_NO_EXCUSE': 'ABSENT_NO_EXCUSE',
    'ABSENT_WITH_EXCUSE': 'ABSENT_WITH_EXCUSE',
    'HUMAN_CASE': 'HUMAN_CASE',
    'EXCUSED_LEAVE': 'EXCUSED_LEAVE',
    'STANDUP_PRESENT': 'PRESENT',
    'STANDUP_LATE': 'LATE',
    'STANDUP_ABSENT': 'ABSENT',
    'STANDUP_CLINIC': 'CLINIC'
  };
  
  const statusSuffix = statusMap[statusUpper] || statusUpper;
  
  return `${prefix}_${statusSuffix}`;
};
