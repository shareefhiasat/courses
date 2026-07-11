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
  DRAFT: new Set(['TAKEN', 'SUBMITTED']),
  TAKEN: new Set(['DRAFT', 'SUBMITTED']),
  SUBMITTED: new Set(['DRAFT', 'UNDER_ADMIN_REVIEW']),
};

const ADMIN_TRANSITIONS = {
  SUBMITTED: new Set(['UNDER_ADMIN_REVIEW']),
  UNDER_ADMIN_REVIEW: new Set(['SUBMITTED', 'UNDER_HR_REVIEW']),
  UNDER_HR_REVIEW: new Set(['UNDER_ADMIN_REVIEW']),
};

const HR_TRANSITIONS = {
  UNDER_HR_REVIEW: new Set(['UNDER_ADMIN_REVIEW', 'APPROVED', 'REJECTED']),
  UNDER_ADMIN_REVIEW: new Set(['UNDER_HR_REVIEW']),
  APPROVED: new Set([]),
  REJECTED: new Set([]),
};

function isInstructorOnly({ isInstructor, isAdmin, isHR, isSuperAdmin }) {
  return isInstructor && !isAdmin && !isHR && !isSuperAdmin;
}

function isAdminOnly({ isAdmin, isHR, isSuperAdmin }) {
  return isAdmin && !isHR && !isSuperAdmin;
}

function isHROnly({ isHR, isSuperAdmin }) {
  return isHR && !isSuperAdmin;
}

export function getWorkflowColumnsForRole(allColumns, roleContext = {}) {
  if (!allColumns?.length) return [];
  if (roleContext.isSuperAdmin) return allColumns;
  if (isInstructorOnly(roleContext)) {
    return allColumns.filter((col) => INSTRUCTOR_LANES.has(col.id));
  }
  if (isAdminOnly(roleContext)) {
    return allColumns.filter((col) => ADMIN_LANES.has(col.id));
  }
  if (isHROnly(roleContext)) {
    return allColumns.filter((col) =>
      ['UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED', 'REJECTED', 'SUBMITTED'].includes(col.id),
    );
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
    return ADMIN_TRANSITIONS[fromColumn]?.has(toColumn) || false;
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
export function resolveWorkflowNotifyMeta(fromColumn, toColumn) {
  // Instructor → Admin
  if (fromColumn === 'SUBMITTED' && toColumn === 'UNDER_ADMIN_REVIEW') {
    return { notifyKey: 'operations_board_move_notify_role', roleKey: 'operations_board_role_admin', roles: ['Admin'] };
  }
  // Admin → Submitted (back to instructor)
  if (fromColumn === 'UNDER_ADMIN_REVIEW' && toColumn === 'SUBMITTED') {
    return { notifyKey: 'operations_board_move_notify_instructor_and_admins', roles: ['Admin', 'instructor'] };
  }
  // Admin → HR
  if (fromColumn === 'UNDER_ADMIN_REVIEW' && toColumn === 'UNDER_HR_REVIEW') {
    return { notifyKey: 'operations_board_move_notify_role', roleKey: 'operations_board_role_hr', roles: ['HR'] };
  }
  // HR → Admin
  if (fromColumn === 'UNDER_HR_REVIEW' && toColumn === 'UNDER_ADMIN_REVIEW') {
    return { notifyKey: 'operations_board_move_notify_role', roleKey: 'operations_board_role_admin', roles: ['Admin'] };
  }
  // Admin → HR (from HR return path already covered); HR approve/reject
  if (fromColumn === 'UNDER_HR_REVIEW' && (toColumn === 'APPROVED' || toColumn === 'REJECTED')) {
    return { notifyKey: 'operations_board_move_notify_all_parties', roles: ['Admin', 'HR', 'instructor'] };
  }
  // Instructor internal moves — no role broadcast required, but still confirm lightly
  if (
    (fromColumn === 'DRAFT' && (toColumn === 'TAKEN' || toColumn === 'SUBMITTED'))
    || (fromColumn === 'TAKEN' && (toColumn === 'DRAFT' || toColumn === 'SUBMITTED'))
    || (fromColumn === 'SUBMITTED' && toColumn === 'DRAFT')
  ) {
    return { notifyKey: null, roles: [] };
  }
  return { notifyKey: null, roles: [] };
}

export function shouldConfirmWorkflowMove(fromColumn, toColumn) {
  // Always confirm cross-status moves on the workflow board
  return fromColumn !== toColumn;
}
