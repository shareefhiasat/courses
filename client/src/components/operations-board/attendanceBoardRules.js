import { ATTENDANCE_COLUMNS } from '@services/business/operationsBoardService.js';
import { isHROnlyViewer } from './hrAttendancePrivacy.js';

const INSTRUCTOR_LANE_IDS = new Set(['NOT_TAKEN', 'PRESENT', 'LATE']);
const INSTRUCTOR_MOVE_TARGETS = new Set(['NOT_TAKEN', 'PRESENT', 'LATE']);
const ADMIN_LANE_IDS = new Set(['PRESENT', 'ABSENT', 'HUMAN_CASE', 'EXCUSED']);
const ADMIN_MOVE_TARGETS = new Set(['PRESENT', 'ABSENT', 'HUMAN_CASE', 'EXCUSED']);
const HR_LANE_IDS = new Set(['NOT_TAKEN', 'PRESENT', 'ABSENT', 'EXCUSED', 'HUMAN_CASE']);
const HR_MOVE_TARGETS = new Set(['PRESENT', 'ABSENT', 'EXCUSED', 'HUMAN_CASE']);

export function getAttendanceColumnsForRole(roleContext = {}) {
  const { isInstructor, isAdmin, isHR, isSuperAdmin } = roleContext;
  const isInstructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  if (isInstructorOnly) {
    return ATTENDANCE_COLUMNS.filter((col) => INSTRUCTOR_LANE_IDS.has(col.id));
  }
  const isAdminOnly = isAdmin && !isHR && !isSuperAdmin;
  if (isAdminOnly) {
    return ATTENDANCE_COLUMNS.filter((col) => ADMIN_LANE_IDS.has(col.id));
  }
  if (isHROnlyViewer(roleContext)) {
    return ATTENDANCE_COLUMNS.filter((col) => HR_LANE_IDS.has(col.id));
  }
  return ATTENDANCE_COLUMNS;
}

export function canMoveAttendanceToColumn(targetColumn, roleContext = {}) {
  const { isInstructor, isAdmin, isHR, isSuperAdmin } = roleContext;
  const isInstructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  if (isInstructorOnly) {
    return INSTRUCTOR_MOVE_TARGETS.has(targetColumn);
  }
  const isAdminOnly = isAdmin && !isHR && !isSuperAdmin;
  if (isAdminOnly) {
    return ADMIN_MOVE_TARGETS.has(targetColumn);
  }
  if (isHROnlyViewer(roleContext)) {
    return HR_MOVE_TARGETS.has(targetColumn);
  }
  return ['NOT_TAKEN', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'HUMAN_CASE'].includes(targetColumn);
}

export function getAllowedAttendanceActions(roleContext = {}) {
  return getAttendanceColumnsForRole(roleContext);
}
