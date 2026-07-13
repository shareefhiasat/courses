import { LMS_ROLES } from '../services/keycloakAdminService.js';

const INSTRUCTOR_TRANSITIONS = {
  DRAFT: new Set(['SUBMITTED']),
  SUBMITTED: new Set(['DRAFT', 'UNDER_ADMIN_REVIEW']),
};

const ADMIN_TRANSITIONS = {
  DRAFT: new Set(['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED', 'REJECTED']),
  SUBMITTED: new Set(['DRAFT', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED', 'REJECTED']),
  UNDER_ADMIN_REVIEW: new Set(['DRAFT', 'SUBMITTED', 'UNDER_HR_REVIEW', 'APPROVED', 'REJECTED']),
  UNDER_HR_REVIEW: new Set(['DRAFT', 'SUBMITTED', 'UNDER_ADMIN_REVIEW', 'APPROVED']),
  APPROVED: new Set(['DRAFT', 'SUBMITTED', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'REJECTED']),
  REJECTED: new Set(['DRAFT', 'SUBMITTED', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED']),
};

const INSTRUCTOR_WORKFLOW_LANES = new Set(['DRAFT', 'SUBMITTED']);

const HR_TRANSITIONS = {
  DRAFT: new Set(['SUBMITTED']),
  SUBMITTED: new Set(['DRAFT', 'UNDER_ADMIN_REVIEW']),
  UNDER_HR_REVIEW: new Set(['UNDER_ADMIN_REVIEW', 'APPROVED']),
};

const INSTRUCTOR_LOCKED_STATUSES = new Set([
  'UNDER_ADMIN_REVIEW',
  'UNDER_HR_REVIEW',
  'APPROVED',
]);

function isInstructorOnly(roles = []) {
  return roles.includes(LMS_ROLES.INSTRUCTOR)
    && !roles.includes(LMS_ROLES.ADMIN)
    && !roles.includes(LMS_ROLES.HR)
    && !roles.includes(LMS_ROLES.SUPER_ADMIN);
}

function isAdminOnly(roles = []) {
  return roles.includes(LMS_ROLES.ADMIN)
    && !roles.includes(LMS_ROLES.HR)
    && !roles.includes(LMS_ROLES.SUPER_ADMIN);
}

function isHROnly(roles = []) {
  return roles.includes(LMS_ROLES.HR) && !roles.includes(LMS_ROLES.SUPER_ADMIN);
}

function canRoleMove(fromStatus, toStatus, roles = []) {
  if (!fromStatus || !toStatus || fromStatus === toStatus) return false;
  if (roles.includes(LMS_ROLES.SUPER_ADMIN)) return true;

  // Admin can freely move to any status
  if (isAdminOnly(roles)) {
    return ADMIN_TRANSITIONS[fromStatus]?.has(toStatus) || false;
  }

  const allowed = new Set();
  if (roles.includes(LMS_ROLES.INSTRUCTOR)) {
    INSTRUCTOR_TRANSITIONS[fromStatus]?.forEach((t) => allowed.add(t));
  }
  if (roles.includes(LMS_ROLES.ADMIN)) {
    ADMIN_TRANSITIONS[fromStatus]?.forEach((t) => allowed.add(t));
  }
  if (roles.includes(LMS_ROLES.HR)) {
    HR_TRANSITIONS[fromStatus]?.forEach((t) => allowed.add(t));
  }
  return allowed.has(toStatus);
}

/**
 * Validate a workflow board status PATCH for the given user roles.
 * Returns { ok: true } or { ok: false, error: string }.
 */
export function validateWorkflowBoardStatusTransition(user, previousStatus, nextStatus) {
  const roles = user?.roles || [];

  if (!nextStatus) {
    return { ok: false, error: 'Status is required' };
  }
  if (previousStatus === nextStatus) {
    return { ok: false, error: 'Status is unchanged' };
  }

  if (roles.includes(LMS_ROLES.SUPER_ADMIN)) {
    return { ok: true };
  }

  if (isInstructorOnly(roles)) {
    if (INSTRUCTOR_LOCKED_STATUSES.has(previousStatus)) {
      return {
        ok: false,
        error: 'This workflow is locked for instructor changes after it has been sent for admin review',
      };
    }
    if (!INSTRUCTOR_TRANSITIONS[previousStatus]?.has(nextStatus)) {
      return { ok: false, error: `Instructors cannot move workflow from ${previousStatus} to ${nextStatus}` };
    }
    return { ok: true };
  }

  if (!canRoleMove(previousStatus, nextStatus, roles)) {
    return { ok: false, error: `You are not allowed to move workflow from ${previousStatus} to ${nextStatus}` };
  }

  return { ok: true };
}
