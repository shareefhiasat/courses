/**
 * Attendance Row Highlighting Utility
 * 
 * PURPOSE: Calculate attention scores and determine highlight colors for student rows
 * based on attendance counts and configurable thresholds
 */

import { 
  ATTENDANCE_HIGHLIGHT_THRESHOLDS, 
  ATTENDANCE_HIGHLIGHT_COLORS,
  ATTENDANCE_TYPE_CATEGORY 
} from '@constants/attendanceTypes';

/**
 * Calculate attention score for a student based on attendance mode
 *
 * Regular mode: Count absent + absent excused + human case (exclude late and excused leave)
 * Standup mode: Count only STANDUP_ABSENT
 *
 * @param {Object} student - Student object with attendance counts
 * @param {string} attendanceMode - 'regular' or 'standup'
 * @returns {number} Attention score
 */
export const calculateAttentionScore = (student, attendanceMode) => {
  console.log('🔍 [DEBUG] calculateAttentionScore called:', {
    student,
    attendanceMode,
    hasStudent: !!student
  });

  if (!student) {
    console.log('🔍 [DEBUG] calculateAttentionScore: student is null/undefined');
    return 0;
  }

  if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
    // Standup mode: count only STANDUP_ABSENT
    const score = student.absentNoExcuse || student.absent || 0;
    console.log('🔍 [DEBUG] calculateAttentionScore (standup mode):', {
      absentNoExcuse: student.absentNoExcuse,
      absent: student.absent,
      score
    });
    return score;
  }

  // Regular mode: count absent + absent excused + human case (exclude late and excused leave)
  // Try multiple possible field names for absent counts
  const score =
    (student.absentNoExcuse || student.absent || 0) +
    (student.absentWithExcuse || student.absentExcused || 0) +
    (student.humanCase || 0);

  console.log('🔍 [DEBUG] calculateAttentionScore (regular mode):', {
    absentNoExcuse: student.absentNoExcuse,
    absent: student.absent,
    absentWithExcuse: student.absentWithExcuse,
    absentExcused: student.absentExcused,
    humanCase: student.humanCase,
    score
  });

  return score;
};

/**
 * Get highlight color based on attention score
 *
 * @param {number} count - Attention score
 * @returns {string|null} Color hex code or null if no highlight needed
 */
export const getHighlightColor = (count) => {
  console.log('🔍 [DEBUG] getHighlightColor called:', {
    count,
    thresholds: ATTENDANCE_HIGHLIGHT_THRESHOLDS
  });

  if (count >= ATTENDANCE_HIGHLIGHT_THRESHOLDS.RED_MIN) {
    console.log('🔍 [DEBUG] getHighlightColor: returning RED');
    return ATTENDANCE_HIGHLIGHT_COLORS.RED;
  }
  if (count >= ATTENDANCE_HIGHLIGHT_THRESHOLDS.ORANGE_MIN && count <= ATTENDANCE_HIGHLIGHT_THRESHOLDS.ORANGE_MAX) {
    console.log('🔍 [DEBUG] getHighlightColor: returning ORANGE');
    return ATTENDANCE_HIGHLIGHT_COLORS.ORANGE;
  }
  if (count >= ATTENDANCE_HIGHLIGHT_THRESHOLDS.YELLOW_MIN && count <= ATTENDANCE_HIGHLIGHT_THRESHOLDS.YELLOW_MAX) {
    console.log('🔍 [DEBUG] getHighlightColor: returning YELLOW');
    return ATTENDANCE_HIGHLIGHT_COLORS.YELLOW;
  }
  console.log('🔍 [DEBUG] getHighlightColor: returning null (no highlight)');
  return null;
};

/**
 * Get highlight CSS class based on attention score
 * 
 * @param {number} count - Attention score
 * @returns {string|null} CSS class name or null if no highlight needed
 */
export const getHighlightClass = (count) => {
  if (count >= ATTENDANCE_HIGHLIGHT_THRESHOLDS.RED_MIN) {
    return 'row-highlight-red';
  }
  if (count >= ATTENDANCE_HIGHLIGHT_THRESHOLDS.ORANGE_MIN && count <= ATTENDANCE_HIGHLIGHT_THRESHOLDS.ORANGE_MAX) {
    return 'row-highlight-orange';
  }
  if (count >= ATTENDANCE_HIGHLIGHT_THRESHOLDS.YELLOW_MIN && count <= ATTENDANCE_HIGHLIGHT_THRESHOLDS.YELLOW_MAX) {
    return 'row-highlight-yellow';
  }
  return null;
};

/**
 * Get row style object based on attention score and enabled state
 *
 * @param {number} count - Attention score
 * @param {boolean} isEnabled - Whether highlighting is enabled
 * @returns {Object} Style object with backgroundColor or empty object
 */
export const getRowHighlightStyle = (count, isEnabled) => {
  console.log('🔍 [DEBUG] getRowHighlightStyle called:', {
    count,
    isEnabled
  });

  if (!isEnabled) {
    console.log('🔍 [DEBUG] getRowHighlightStyle: highlighting disabled, returning empty style');
    return {};
  }

  const color = getHighlightColor(count);
  if (color) {
    console.log('🔍 [DEBUG] getRowHighlightStyle: returning style with backgroundColor:', color);
    return { backgroundColor: color };
  }
  console.log('🔍 [DEBUG] getRowHighlightStyle: no color returned, returning empty style');
  return {};
};

export default {
  calculateAttentionScore,
  getHighlightColor,
  getHighlightClass,
  getRowHighlightStyle
};
