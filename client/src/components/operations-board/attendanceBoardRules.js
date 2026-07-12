import { ATTENDANCE_COLUMNS } from '@services/business/operationsBoardService.js';
import { isHROnlyViewer } from './hrAttendancePrivacy.js';

const INSTRUCTOR_LANE_IDS = new Set(['NOT_TAKEN', 'PRESENT', 'LATE']);
const INSTRUCTOR_MOVE_TARGETS = new Set(['NOT_TAKEN', 'PRESENT', 'LATE']);
/** Admin sees instructor-marked Present/Late plus review lanes; Late was missing so Late cards vanished. */
const ADMIN_LANE_IDS = new Set(['NOT_TAKEN', 'PRESENT', 'LATE', 'ABSENT', 'HUMAN_CASE', 'EXCUSED']);
const ADMIN_MOVE_TARGETS = new Set(['PRESENT', 'LATE', 'ABSENT', 'HUMAN_CASE', 'EXCUSED']);
/** HR sees full attendance picture including Late (no Late→Present masking). */
const HR_LANE_IDS = new Set(['NOT_TAKEN', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'HUMAN_CASE']);
// HR is a read-only viewer for daily attendance; only Admin/Instructor/Super-Admin may edit
const HR_MOVE_TARGETS = new Set([]);

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

const ROLE_WORKFLOW_EDIT_STATUSES = {
  instructor: new Set(['DRAFT', 'TAKEN']),
  admin: new Set(['SUBMITTED', 'UNDER_ADMIN_REVIEW']),
  hr: new Set(['UNDER_HR_REVIEW']),
};

/**
 * Enforce workflow ownership for attendance edits.
 * Instructors may edit while the workflow is still with them (DRAFT/TAKEN).
 * Admins may edit while the workflow is with them (SUBMITTED/UNDER_ADMIN_REVIEW).
 * HR may edit only while the workflow is under HR review.
 * Super-admins may always edit.
 * When no workflow exists yet, instructors and admins are allowed to take initial attendance.
 */
export function canEditAttendanceForWorkflow(workflowStatus, roleContext = {}) {
  const { isInstructor, isAdmin, isHR, isSuperAdmin } = roleContext;
  if (isSuperAdmin) return true;
  if (!workflowStatus) {
    return isInstructor || isAdmin;
  }
  const allowed = new Set();
  if (isInstructor) ROLE_WORKFLOW_EDIT_STATUSES.instructor.forEach((s) => allowed.add(s));
  if (isAdmin) ROLE_WORKFLOW_EDIT_STATUSES.admin.forEach((s) => allowed.add(s));
  if (isHR) ROLE_WORKFLOW_EDIT_STATUSES.hr.forEach((s) => allowed.add(s));
  return allowed.has(workflowStatus);
}
