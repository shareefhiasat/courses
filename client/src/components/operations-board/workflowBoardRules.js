/**
 * Role-based lane visibility and drag targets for the workflow operations board.
 *
 * Flow: Draft → Confirmed → Admin → HR → Approved
 * Instructor: Draft → Confirmed only (initial attendance marking on the same day)
 * Admin: Full control — can move to any status freely
 * HR: HR ↔ Admin, HR → Approved (Rejected hidden from HR)
 */

export const WORKFLOW_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_ADMIN_REVIEW: 'UNDER_ADMIN_REVIEW',
  UNDER_HR_REVIEW: 'UNDER_HR_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

const INSTRUCTOR_LANES = new Set([
  WORKFLOW_STATUS.DRAFT,
  WORKFLOW_STATUS.SUBMITTED,
  WORKFLOW_STATUS.UNDER_ADMIN_REVIEW,
  WORKFLOW_STATUS.UNDER_HR_REVIEW,
  WORKFLOW_STATUS.APPROVED,
]);

const ADMIN_LANES = new Set([
  WORKFLOW_STATUS.DRAFT,
  WORKFLOW_STATUS.SUBMITTED,
  WORKFLOW_STATUS.UNDER_ADMIN_REVIEW,
  WORKFLOW_STATUS.UNDER_HR_REVIEW,
  WORKFLOW_STATUS.APPROVED,
  WORKFLOW_STATUS.REJECTED,
]);

/** Adjacent / allowed transitions by role (from → to). */
const INSTRUCTOR_TRANSITIONS = {
  [WORKFLOW_STATUS.DRAFT]: new Set([WORKFLOW_STATUS.SUBMITTED]),
};

/** Statuses locked from instructor board moves once sent to admin review. */
export const INSTRUCTOR_LOCKED_STATUSES = new Set([
  WORKFLOW_STATUS.UNDER_ADMIN_REVIEW,
  WORKFLOW_STATUS.UNDER_HR_REVIEW,
  WORKFLOW_STATUS.APPROVED,
]);

/** Instructor-controlled workflow lanes (Draft / Confirmed). */
export const INSTRUCTOR_WORKFLOW_LANES = new Set([WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.SUBMITTED]);

const ADMIN_TRANSITIONS = {
  [WORKFLOW_STATUS.DRAFT]: new Set([WORKFLOW_STATUS.SUBMITTED, WORKFLOW_STATUS.UNDER_ADMIN_REVIEW, WORKFLOW_STATUS.UNDER_HR_REVIEW, WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.REJECTED]),
  [WORKFLOW_STATUS.SUBMITTED]: new Set([WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.UNDER_ADMIN_REVIEW, WORKFLOW_STATUS.UNDER_HR_REVIEW, WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.REJECTED]),
  [WORKFLOW_STATUS.UNDER_ADMIN_REVIEW]: new Set([WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.SUBMITTED, WORKFLOW_STATUS.UNDER_HR_REVIEW, WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.REJECTED]),
  [WORKFLOW_STATUS.UNDER_HR_REVIEW]: new Set([WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.SUBMITTED, WORKFLOW_STATUS.UNDER_ADMIN_REVIEW, WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.REJECTED]),
  [WORKFLOW_STATUS.APPROVED]: new Set([WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.SUBMITTED, WORKFLOW_STATUS.UNDER_ADMIN_REVIEW, WORKFLOW_STATUS.UNDER_HR_REVIEW, WORKFLOW_STATUS.REJECTED]),
  [WORKFLOW_STATUS.REJECTED]: new Set([WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.SUBMITTED, WORKFLOW_STATUS.UNDER_ADMIN_REVIEW, WORKFLOW_STATUS.UNDER_HR_REVIEW, WORKFLOW_STATUS.APPROVED]),
};

const HR_TRANSITIONS = {
  [WORKFLOW_STATUS.DRAFT]: new Set([WORKFLOW_STATUS.SUBMITTED]),
  [WORKFLOW_STATUS.SUBMITTED]: new Set([WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.UNDER_ADMIN_REVIEW]),
  [WORKFLOW_STATUS.UNDER_HR_REVIEW]: new Set([WORKFLOW_STATUS.UNDER_ADMIN_REVIEW, WORKFLOW_STATUS.APPROVED]),
  [WORKFLOW_STATUS.APPROVED]: new Set([]),
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
    const hrColumns = [WORKFLOW_STATUS.UNDER_ADMIN_REVIEW, WORKFLOW_STATUS.UNDER_HR_REVIEW, WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.SUBMITTED];
    // In week mode, include DRAFT so HR can see weekly summary workflows
    if (viewMode === 'week') {
      hrColumns.push(WORKFLOW_STATUS.DRAFT);
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
  // Admin can freely move to any status
  if (isAdminOnly(roleContext)) {
    return ADMIN_TRANSITIONS[fromColumn]?.has(toColumn) || false;
  }
  if (isInstructorOnly(roleContext)) {
    return INSTRUCTOR_TRANSITIONS[fromColumn]?.has(toColumn) || false;
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

  if (fromColumn === WORKFLOW_STATUS.DRAFT && toColumn === WORKFLOW_STATUS.SUBMITTED) {
    return {
      titleKey: 'operations_board_move_draft_to_confirmed_title',
      bodyKey: 'operations_board_move_draft_to_confirmed_body',
      notifyKey: null,
      roles: [],
      lockWarning: false,
    };
  }
  if (fromColumn === WORKFLOW_STATUS.SUBMITTED && toColumn === WORKFLOW_STATUS.DRAFT) {
    return {
      titleKey: 'operations_board_move_confirmed_to_draft_title',
      bodyKey: 'operations_board_move_confirmed_to_draft_body',
      notifyKey: null,
      roles: [],
      lockWarning: false,
    };
  }
  if (fromColumn === WORKFLOW_STATUS.SUBMITTED && toColumn === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW) {
    const isInstructor = isInstructorOnly(roleContext);
    return {
      titleKey: isInstructor ? 'operations_board_move_sent_to_admin_title' : 'operations_board_move_confirm_title',
      bodyKey: isInstructor ? 'operations_board_move_sent_to_admin_body' : 'operations_board_move_confirm_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_admin',
      roles: ['Admin'],
      lockWarning: isInstructor,
      lockWarningKey: 'operations_board_move_admin_lock_warning',
    };
  }
  // Admin → Submitted (back to instructor)
  if (fromColumn === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW && toColumn === WORKFLOW_STATUS.SUBMITTED) {
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
  if (fromColumn === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW && toColumn === WORKFLOW_STATUS.REJECTED) {
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
  if (fromColumn === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW && toColumn === WORKFLOW_STATUS.UNDER_HR_REVIEW) {
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
  if (fromColumn === WORKFLOW_STATUS.UNDER_HR_REVIEW && toColumn === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW) {
    return {
      titleKey: 'operations_board_move_hr_to_admin_title',
      bodyKey: 'operations_board_move_hr_to_admin_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_admin',
      roles: ['Admin'],
      lockWarning: false,
    };
  }
  // HR approve
  if (fromColumn === WORKFLOW_STATUS.UNDER_HR_REVIEW && toColumn === WORKFLOW_STATUS.APPROVED) {
    return {
      titleKey: 'operations_board_move_hr_to_approved_title',
      bodyKey: 'operations_board_move_hr_to_approved_body',
      notifyKey: 'operations_board_move_notify_admins_hr',
      roles: ['Admin', 'HR'],
      lockWarning: false,
    };
  }
  // REJECTED → DRAFT (admin reinstating for instructor to rework)
  if (fromColumn === WORKFLOW_STATUS.REJECTED && toColumn === WORKFLOW_STATUS.DRAFT) {
    return {
      titleKey: 'operations_board_move_rejected_to_draft_title',
      bodyKey: 'operations_board_move_rejected_to_draft_body',
      notifyKey: 'operations_board_move_notify_instructor_only',
      roles: ['instructor'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // REJECTED → SUBMITTED (admin resubmitting on behalf of instructor)
  if (fromColumn === WORKFLOW_STATUS.REJECTED && toColumn === WORKFLOW_STATUS.SUBMITTED) {
    return {
      titleKey: 'operations_board_move_rejected_to_submitted_title',
      bodyKey: 'operations_board_move_rejected_to_submitted_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_admin',
      roles: ['Admin'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // REJECTED → UNDER_ADMIN_REVIEW (admin re-reviewing)
  if (fromColumn === WORKFLOW_STATUS.REJECTED && toColumn === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW) {
    return {
      titleKey: 'operations_board_move_rejected_to_admin_title',
      bodyKey: 'operations_board_move_rejected_to_admin_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_admin',
      roles: ['Admin'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // REJECTED → UNDER_HR_REVIEW (admin sending rejected doc to HR)
  if (fromColumn === WORKFLOW_STATUS.REJECTED && toColumn === WORKFLOW_STATUS.UNDER_HR_REVIEW) {
    return {
      titleKey: 'operations_board_move_rejected_to_hr_title',
      bodyKey: 'operations_board_move_rejected_to_hr_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_hr',
      roles: ['HR'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // REJECTED → APPROVED (admin overriding rejection)
  if (fromColumn === WORKFLOW_STATUS.REJECTED && toColumn === WORKFLOW_STATUS.APPROVED) {
    return {
      titleKey: 'operations_board_move_rejected_to_approved_title',
      bodyKey: 'operations_board_move_rejected_to_approved_body',
      notifyKey: 'operations_board_move_notify_admins_hr',
      roles: ['Admin', 'HR'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // APPROVED → DRAFT (admin reopening approved doc)
  if (fromColumn === WORKFLOW_STATUS.APPROVED && toColumn === WORKFLOW_STATUS.DRAFT) {
    return {
      titleKey: 'operations_board_move_approved_to_draft_title',
      bodyKey: 'operations_board_move_approved_to_draft_body',
      notifyKey: 'operations_board_move_notify_instructor_only',
      roles: ['instructor'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // APPROVED → SUBMITTED (admin reopening to submitted)
  if (fromColumn === WORKFLOW_STATUS.APPROVED && toColumn === WORKFLOW_STATUS.SUBMITTED) {
    return {
      titleKey: 'operations_board_move_approved_to_submitted_title',
      bodyKey: 'operations_board_move_approved_to_submitted_body',
      notifyKey: 'operations_board_move_notify_instructor_only',
      roles: ['instructor'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // APPROVED → UNDER_ADMIN_REVIEW (admin reopening for admin review)
  if (fromColumn === WORKFLOW_STATUS.APPROVED && toColumn === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW) {
    return {
      titleKey: 'operations_board_move_approved_to_admin_title',
      bodyKey: 'operations_board_move_approved_to_admin_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_admin',
      roles: ['Admin'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // APPROVED → UNDER_HR_REVIEW (admin reopening for HR review)
  if (fromColumn === WORKFLOW_STATUS.APPROVED && toColumn === WORKFLOW_STATUS.UNDER_HR_REVIEW) {
    return {
      titleKey: 'operations_board_move_approved_to_hr_title',
      bodyKey: 'operations_board_move_approved_to_hr_body',
      notifyKey: 'operations_board_move_notify_role',
      roleKey: 'operations_board_role_hr',
      roles: ['HR'],
      lockWarning: false,
      adminOverride: false,
    };
  }
  // APPROVED → REJECTED (admin overriding approval to rejection)
  if (fromColumn === WORKFLOW_STATUS.APPROVED && toColumn === WORKFLOW_STATUS.REJECTED) {
    return {
      titleKey: 'operations_board_move_approved_to_rejected_title',
      bodyKey: 'operations_board_move_approved_to_rejected_body',
      notifyKey: 'operations_board_move_notify_all_parties',
      roles: ['Admin', 'HR', 'instructor'],
      lockWarning: false,
      adminOverride: false,
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
  // Skip confirmation for Admin → Confirmed (no instructor notification)
  if (fromColumn === WORKFLOW_STATUS.UNDER_ADMIN_REVIEW && toColumn === WORKFLOW_STATUS.SUBMITTED) {
    return false;
  }
  // Always confirm other cross-status moves on the workflow board
  return fromColumn !== toColumn;
}
