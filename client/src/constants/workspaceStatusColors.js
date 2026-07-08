import { ATTENDANCE_STATUS } from './attendanceTypes.js';

/**
 * Shared status colors for welcome schedule dots and operations board lanes.
 * Schedule semantics: not taken → orange, taken → green, submitted → blue.
 */
export const SCHEDULE_WORKFLOW_STATUS = {
  NOT_TAKEN: 'not_taken',
  DRAFT: 'draft',
  TAKEN: 'taken',
  SUBMITTED: 'submitted',
};

export const SCHEDULE_WORKFLOW_COLORS = {
  [SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN]: '#f97316',
  [SCHEDULE_WORKFLOW_STATUS.DRAFT]: '#f59e0b',
  [SCHEDULE_WORKFLOW_STATUS.TAKEN]: '#22c55e',
  [SCHEDULE_WORKFLOW_STATUS.SUBMITTED]: '#3b82f6',
};

export const WORKFLOW_STATUS_COLORS = {
  DRAFT: SCHEDULE_WORKFLOW_COLORS[SCHEDULE_WORKFLOW_STATUS.DRAFT],
  TAKEN: SCHEDULE_WORKFLOW_COLORS[SCHEDULE_WORKFLOW_STATUS.TAKEN],
  SUBMITTED: SCHEDULE_WORKFLOW_COLORS[SCHEDULE_WORKFLOW_STATUS.SUBMITTED],
  UNDER_ADMIN_REVIEW: '#ea580c',
  UNDER_HR_REVIEW: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

export const ATTENDANCE_BOARD_COLORS = {
  NOT_TAKEN: SCHEDULE_WORKFLOW_COLORS[SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN],
  PRESENT: '#10b981',
  LATE: '#f59e0b',
  ABSENT: '#ef4444',
  EXCUSED: '#ec4899',
  HUMAN_CASE: '#8b5cf6',
};

const SUBMITTED_WORKFLOW_STATUSES = new Set([
  'SUBMITTED',
  'UNDER_ADMIN_REVIEW',
  'UNDER_HR_REVIEW',
  'APPROVED',
  'ADMIN_APPROVED',
]);

export function resolveScheduleWorkflowKey(status) {
  if (!status) return SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN;
  if (SUBMITTED_WORKFLOW_STATUSES.has(status.workflowStatus)) {
    return SCHEDULE_WORKFLOW_STATUS.SUBMITTED;
  }
  if (status.hasAttendance || status.workflowStatus === 'TAKEN') {
    return SCHEDULE_WORKFLOW_STATUS.TAKEN;
  }
  if (status.workflowStatus === 'DRAFT') {
    return SCHEDULE_WORKFLOW_STATUS.DRAFT;
  }
  return SCHEDULE_WORKFLOW_STATUS.NOT_TAKEN;
}

export function getScheduleWorkflowColor(status) {
  const key = resolveScheduleWorkflowKey(status);
  return SCHEDULE_WORKFLOW_COLORS[key];
}

export function getWorkflowStatusColor(statusId) {
  return WORKFLOW_STATUS_COLORS[statusId] || '#6b7280';
}

export function getAttendanceBoardColor(laneId) {
  return ATTENDANCE_BOARD_COLORS[laneId] || '#6b7280';
}

export function mapAttendanceTypeToBoardColor(status) {
  const map = {
    [ATTENDANCE_STATUS.PRESENT]: ATTENDANCE_BOARD_COLORS.PRESENT,
    [ATTENDANCE_STATUS.LATE]: ATTENDANCE_BOARD_COLORS.LATE,
    [ATTENDANCE_STATUS.ABSENT_NO_EXCUSE]: ATTENDANCE_BOARD_COLORS.ABSENT,
    [ATTENDANCE_STATUS.EXCUSED_LEAVE]: ATTENDANCE_BOARD_COLORS.EXCUSED,
    [ATTENDANCE_STATUS.HUMAN_CASE]: ATTENDANCE_BOARD_COLORS.HUMAN_CASE,
  };
  return map[status] || ATTENDANCE_BOARD_COLORS.NOT_TAKEN;
}
