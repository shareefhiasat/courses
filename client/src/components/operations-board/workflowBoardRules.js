/**
 * Role-based lane visibility and drag targets for the workflow operations board.
 *
 * Flow: Draft → Taken → Submitted → Admin → HR → Approved | Rejected
 * Instructor: Draft ↔ Taken ↔ Submitted (and Submitted → Admin)
 * Admin: Submitted ↔ Admin ↔ HR (and Admin → Submitted)
 * HR: HR ↔ Admin, HR → Approved | Rejected
 */

const INSTRUCTOR_LANES = new Set([
  'DRAFT',
  'TAKEN',
  'SUBMITTED',
  'UNDER_ADMIN_REVIEW',
  'UNDER_HR_REVIEW',
  'APPROVED',
  'REJECTED',
]);

const ADMIN_LANES = new Set([
  'DRAFT',
  'TAKEN',
  'SUBMITTED',
  'UNDER_ADMIN_REVIEW',
  'UNDER_HR_REVIEW',
  'APPROVED',
  'REJECTED',
]);

/** Adjacent / allowed transitions by role (from → to). */
const INSTRUCTOR_TRANSITIONS = {
  DRAFT: new Set(['TAKEN']),
  TAKEN: new Set(['DRAFT', 'SUBMITTED']),
  SUBMITTED: new Set(['TAKEN', 'UNDER_ADMIN_REVIEW']),
};

/** Statuses locked from instructor board moves once sent to admin review. */
export const INSTRUCTOR_LOCKED_STATUSES = new Set([
  'UNDER_ADMIN_REVIEW',
  'UNDER_HR_REVIEW',
  'APPROVED',
  'REJECTED',
]);

/** Instructor-controlled workflow lanes (Draft / Taken / Sent). */
export const INSTRUCTOR_WORKFLOW_LANES = new Set(['DRAFT', 'TAKEN', 'SUBMITTED']);

const ADMIN_TRANSITIONS = {
  SUBMITTED: new Set(['UNDER_ADMIN_REVIEW']),
  UNDER_ADMIN_REVIEW: new Set(['SUBMITTED', 'UNDER_HR_REVIEW', 'REJECTED']),
  UNDER_HR_REVIEW: new Set(['UNDER_ADMIN_REVIEW']),
};

const HR_TRANSITIONS = {
  DRAFT: new Set(['SUBMITTED']),
  SUBMITTED: new Set(['DRAFT', 'UNDER_ADMIN_REVIEW']),
  UNDER_HR_REVIEW: new Set(['UNDER_ADMIN_REVIEW', 'APPROVED', 'REJECTED']),
  APPROVED: new Set([]),
  REJECTED: new Set([]),
};

export function isInstructorOnly({ isInstructor, isAdmin, isHR, isSuperAdmin }) {
  return isInstructor && !isAdmin && !isHR && !isSuperAdmin;
}

function isAdminOnly({ isAdmin, isHR, isSuperAdmin }) {
  return isAdmin && !isHR && !isSuperAdmin;
}

function isHROnly({ isHR, isSuperAdmin }) {
  return isHR && !isSuperAdmin;
}

function isAdminOnlyWithoutInstructor(roleContext) {
  return roleContext.isAdmin && !roleContext.isInstructor && !roleContext.isHR && !roleContext.isSuperAdmin;
}

export function isInstructorWorkflowLane(column) {
  return INSTRUCTOR_WORKFLOW_LANES.has(column);
}

export function requiresAdminInstructorOverride(fromColumn, toColumn, roleContext = {}) {
  if (roleContext.isSuperAdmin) return false;
  if (!roleContext.isAdmin || roleContext.isHR) return false;
  if (isInstructorOnly(roleContext)) return false;
  if (!isInstructorWorkflowLane(fromColumn) && !isInstructorWorkflowLane(toColumn)) return false;
  if (ADMIN_TRANSITIONS[fromColumn]?.has(toColumn)) return false;
  return true;
}

export function getWorkflowColumnsForRole(allColumns, roleContext = {}, viewMode = 'day') {
  if (!allColumns?.length) return [];
  if (roleContext.isSuperAdmin) return allColumns;
  if (isInstructorOnly(roleContext)) {
    return allColumns.filter((col) => INSTRUCTOR_LANES.has(col.id));
  }
  if (isAdminOnly(roleContext)) {
    return allColumns.filter((col) => ADMIN_LANES.has(col.id));
  }
  if (isHROnly(roleContext)) {
    const hrColumns = ['UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED', 'REJECTED', 'SUBMITTED'];
    // In week mode, include DRAFT so HR can see weekly summary workflows
    if (viewMode === 'week') {
      hrColumns.push('DRAFT');
    }
    return allColumns.filter((col) => hrColumns.includes(col.id));
  }
  return allColumns;
}

export function canMoveWorkflowToColumn(fromColumn, toColumn, roleContext = {}) {
  if (!fromColumn || !toColumn || fromColumn === toColumn) return false;
  if (roleContext.isSuperAdmin) {
    return Boolean(resolveWorkflowNotifyMeta(fromColumn, toColumn));
  }
  if (isInstructorOnly(roleContext)) {
    return INSTRUCTOR_TRANSITIONS[fromColumn]?.has(toColumn) || false;
  }
  if (isAdminOnly(roleContext)) {
    if (ADMIN_TRANSITIONS[fromColumn]?.has(toColumn)) return true;
    if (INSTRUCTOR_TRANSITIONS[fromColumn]?.has(toColumn)) return true;
    return false;
  }
  if (isHROnly(roleContext)) {
    return HR_TRANSITIONS[fromColumn]?.has(toColumn) || false;
  }
  // Multi-role users: allow union of applicable transitions
  const allowed = new Set();
  if (roleContext.isInstructor) {
    Object.entries(INSTRUCTOR_TRANSITIONS).forEach(([from, tos]) => {
      if (from === fromColumn) tos.forEach((t) => allowed.add(t));
    });
  }
  if (roleContext.isAdmin) {
    Object.entries(ADMIN_TRANSITIONS).forEach(([from, tos]) => {
      if (from === fromColumn) tos.forEach((t) => allowed.add(t));
    });
    Object.entries(INSTRUCTOR_TRANSITIONS).forEach(([from, tos]) => {
      if (from === fromColumn) tos.forEach((t) => allowed.add(t));
    });
  }
  if (roleContext.isHR) {
    Object.entries(HR_TRANSITIONS).forEach(([from, tos]) => {
      if (from === fromColumn) tos.forEach((t) => allowed.add(t));
    });
  }
  return allowed.has(toColumn);
}

/**
 * Who gets notified for a transition, and which i18n key to show in the confirm dialog.
 * Returns null if the move is not a known notifying transition (still may be allowed for superadmin).
 */
export function resolveWorkflowNotifyMeta(fromColumn, toColumn, roleContext = {}) {
  const adminOverride = requiresAdminInstructorOverride(fromColumn, toColumn, roleContext);
  if (adminOverride) {
    return {
      titleKey: 'operations_board_move_admin_override_title',
      bodyKey: 'operations_board_move_admin_override_body',
      notifyKey: 'operations_board_move_admin_override_notify',
      roles: ['instructor'],
      lockWarning: false,
      adminOverride: true,
    };
  }

  if (fromColumn === 'DRAFT' && toColumn === 'SUBMITTED') {
    return {
      titleKey: 'operations_board_move_draft_to_submitted_title',
      bodyKey: 'operations_board_move_draft_to_submitted_body',
      notifyKey: null,
      roles: [],
      lockWarning: false,
    };
  }
  if (fromColumn === 'SUBMITTED' && toColumn === 'DRAFT') {
    return {
      titleKey: 'operations_board_move_submitted_to_draft_title',
      bodyKey: 'operations_board_move_submitted_to_draft_body',
      notifyKey: null,
      roles: [],
      lockWarning: false,
    };
  }
  if (fromColumn === 'DRAFT' && toColumn === 'TAKEN') {
    return {
      titleKey: 'operations_board_move_draft_to_taken_title',
      bodyKey: 'operations_board_move_draft_to_taken_body',
      notifyKey: null,
      roles: [],
      lockWarning: false,
    };
  }
  if (fromColumn === 'TAKEN' && toColumn === 'DRAFT') {
    return {
      titleKey: 'operations_board_move_taken_to_draft_title',
      bodyKey: 'operations_board_move_taken_to_draft_body',
      notifyKey: null,
      roles: [],
      lockWarning: false,
    };
  }
  if (fromColumn === 'TAKEN' && toColumn === 'SUBMITTED') {
    return {
      titleKey: 'operations_board_move_taken_to_sent_title',
      bodyKey: 'operations_board_move_taken_to_sent_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_admin',
      roles: ['Admin', 'HR'],
      lockWarning: false,
    };
  }
  if (fromColumn === 'SUBMITTED' && toColumn === 'TAKEN') {
    return {
      titleKey: 'operations_board_move_sent_to_taken_title',
      bodyKey: 'operations_board_move_sent_to_taken_body',
      notifyKey: null,
      roles: [],
      lockWarning: false,
    };
  }
  if (fromColumn === 'SUBMITTED' && toColumn === 'UNDER_ADMIN_REVIEW') {
    return {
      titleKey: 'operations_board_move_sent_to_admin_title',
      bodyKey: 'operations_board_move_sent_to_admin_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_admin',
      roles: ['Admin'],
      lockWarning: true,
      lockWarningKey: 'operations_board_move_admin_lock_warning',
    };
  }
  // Admin → Submitted (back to instructor)
  if (fromColumn === 'UNDER_ADMIN_REVIEW' && toColumn === 'SUBMITTED') {
    return {
      titleKey: 'operations_board_move_admin_to_sent_title',
      bodyKey: 'operations_board_move_admin_to_sent_body',
      notifyKey: 'operations_board_move_notify_instructor_and_admins',
      roles: ['Admin', 'instructor'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // Admin → Rejected
  if (fromColumn === 'UNDER_ADMIN_REVIEW' && toColumn === 'REJECTED') {
    return {
      titleKey: 'operations_board_move_admin_to_rejected_title',
      bodyKey: 'operations_board_move_admin_to_rejected_body',
      notifyKey: 'operations_board_move_notify_instructor_only',
      roles: ['instructor'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // Admin → HR
  if (fromColumn === 'UNDER_ADMIN_REVIEW' && toColumn === 'UNDER_HR_REVIEW') {
    return {
      titleKey: 'operations_board_move_admin_to_hr_title',
      bodyKey: 'operations_board_move_admin_to_hr_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_hr',
      roles: ['HR'],
      lockWarning: false,
    };
  }
  // HR → Admin
  if (fromColumn === 'UNDER_HR_REVIEW' && toColumn === 'UNDER_ADMIN_REVIEW') {
    return {
      titleKey: 'operations_board_move_hr_to_admin_title',
      bodyKey: 'operations_board_move_hr_to_admin_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_admin',
      roles: ['Admin'],
      lockWarning: false,
    };
  }
  // HR approve/reject
  if (fromColumn === 'UNDER_HR_REVIEW' && (toColumn === 'APPROVED' || toColumn === 'REJECTED')) {
    return {
      titleKey: toColumn === 'APPROVED'
        ? 'operations_board_move_hr_to_approved_title'
        : 'operations_board_move_hr_to_rejected_title',
      bodyKey: toColumn === 'APPROVED'
        ? 'operations_board_move_hr_to_approved_body'
        : 'operations_board_move_hr_to_rejected_body',
      notifyKey: 'operations_board_move_notify_all_parties',
      roles: ['Admin', 'HR', 'instructor'],
      lockWarning: false,
    };
  }
  return {
    titleKey: 'operations_board_move_confirm_title',
    bodyKey: 'operations_board_move_confirm_body',
    notifyKey: null,
    roles: [],
    lockWarning: false,
  };
}

export function shouldConfirmWorkflowMove(fromColumn, toColumn) {
  // Always confirm cross-status moves on the workflow board
  return fromColumn !== toColumn;
}
