import { ATTENDANCE_COLUMNS } from '@services/business/operationsBoardService.js';

const INSTRUCTOR_LANE_IDS = new Set(['NOT_TAKEN', 'PRESENT', 'LATE']);

export function getAttendanceColumnsForRole({ isInstructor, isAdmin, isHR, isSuperAdmin }) {
  const isInstructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  if (isInstructorOnly) {
    return ATTENDANCE_COLUMNS.filter((col) => INSTRUCTOR_LANE_IDS.has(col.id));
  }
  return ATTENDANCE_COLUMNS;
}

export function canMoveAttendanceToColumn(targetColumn, { isInstructor, isAdmin, isHR, isSuperAdmin }) {
  if (targetColumn === 'NOT_TAKEN') return false;
  const isInstructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  if (isInstructorOnly) {
    return targetColumn === 'PRESENT' || targetColumn === 'LATE';
  }
  return ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'HUMAN_CASE'].includes(targetColumn);
}

export function getAllowedAttendanceActions({ isInstructor, isAdmin, isHR, isSuperAdmin }) {
  const isInstructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  if (isInstructorOnly) {
    return ATTENDANCE_COLUMNS.filter((col) => col.id === 'PRESENT' || col.id === 'LATE');
  }
  return ATTENDANCE_COLUMNS.filter((col) => col.id !== 'NOT_TAKEN');
}
