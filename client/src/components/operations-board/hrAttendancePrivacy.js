import { ATTENDANCE_COLUMNS } from '@services/business/operationsBoardService.js';

/** HR-only viewers (not also Admin/SuperAdmin). */
export function isHROnlyViewer(roleContext = {}) {
  return Boolean(roleContext.isHR && !roleContext.isAdmin && !roleContext.isSuperAdmin);
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
  return isHROnlyViewer(roleContext);
}

export function shouldHideNotesParticipation(roleContext = {}) {
  return isHROnlyViewer(roleContext);
}

export function filterActivityEntriesForHR(entries, roleContext = {}) {
  if (!isHROnlyViewer(roleContext)) return entries;
  return entries.filter((entry) => entry.type !== 'participation' && entry.type !== 'note');
}
