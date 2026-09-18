/**
 * Canonical enrollment status codes.
 * The canonical "currently enrolled" status is ACTIVE — enrollments are
 * created with ACTIVE by default (see db/enrollments-postgres.js getDefaultStatusId).
 * ENROLLED is a legacy code kept in the lookup table for backward compat only.
 */
export const ENROLLMENT_STATUS_CODES = {
  ACTIVE: 'ACTIVE',
  ENROLLED: 'ENROLLED', // legacy — do not use for new filters
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  DROPPED: 'DROPPED',
  SUSPENDED: 'SUSPENDED',
};
