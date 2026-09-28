import { ATTENDANCE_COLUMNS } from '@services/business/operationsBoardService.js';

/** HR-only viewers (not also Admin/SuperAdmin). */
export function isHROnlyViewer(roleContext = {}) {
  return Boolean(roleContext.isHR && !roleContext.isAdmin && !roleContext.isSuperAdmin && !roleContext.isProgramCommander);
}

/** Instructor-only viewers (not also Admin/HR/SuperAdmin). */
export function isInstructorOnlyViewer(roleContext = {}) {
  return Boolean(
    roleContext.isInstructor
    && !roleContext.isAdmin
    && !roleContext.isHR
    && !roleContext.isSuperAdmin
    && !roleContext.isProgramCommander
  );
}

/** Map Late → Present for HR-facing attendance display. @deprecated HR sees real attendance statuses. */
export function maskAttendanceColumnForHR(columnId, roleContext = {}) {
  return columnId;
}

export function maskAttendanceStatsForHR(stats, roleContext = {}) {
  return stats;
}

/** Board kanban: HR sees the same lane data as admin/instructor. */
export function mapAttendanceBoardDataForHR(data, roleContext = {}) {
  return data;
}

export function getHRLegendAttendanceColumns(roleContext = {}) {
  return ATTENDANCE_COLUMNS;
}

export function shouldHideAttendancePrivacyTabs(roleContext = {}) {
  return isHROnlyViewer(roleContext) || isInstructorOnlyViewer(roleContext);
}

export function shouldHideNotesParticipation(roleContext = {}) {
  return isHROnlyViewer(roleContext);
}

/** Hide notes and comments tabs for instructors (participation stays visible). */
export function shouldHideNotesCommentsOnly(roleContext = {}) {
  return isInstructorOnlyViewer(roleContext);
}

/** Participation is instructor-only by default; admins and superadmins can also view it. */
export function canViewParticipation(roleContext = {}) {
  return isInstructorOnlyViewer(roleContext) || Boolean(roleContext.isAdmin) || Boolean(roleContext.isSuperAdmin) || Boolean(roleContext.isProgramCommander);
}

export function filterActivityEntriesForHR(entries, roleContext = {}) {
  let result = entries;
  if (!canViewParticipation(roleContext)) {
    result = result.filter((entry) => entry.type !== ACTIVITY_TYPE.PARTICIPATION);
  }
  if (isHROnlyViewer(roleContext)) {
    result = result.filter((entry) => entry.type !== ACTIVITY_TYPE.NOTE);
  }
  return result;
}
