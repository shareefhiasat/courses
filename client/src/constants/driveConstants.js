/**
 * Drive System Constants
 * Centralized constants for drive-related configurations
 */

/**
 * Default storage limit in bytes (1 GB)
 */
export const DEFAULT_STORAGE_LIMIT = 1 * 1024 * 1024 * 1024;

/**
 * Workflow Instance Status Constants
 * Maps backend workflow statuses to frontend display values
 */
export const WORKFLOW_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  NEEDS_FEEDBACK: 'NEEDS_FEEDBACK',
};

/**
 * Workflow Status to Frontend Status Mapping
 * Maps backend statuses to frontend status keys
 */
export const WORKFLOW_STATUS_MAP = {
  [WORKFLOW_STATUS.PENDING]: 'pending',
  [WORKFLOW_STATUS.IN_PROGRESS]: 'in_progress',
  [WORKFLOW_STATUS.COMPLETED]: 'completed',
  [WORKFLOW_STATUS.REJECTED]: 'rejected',
  [WORKFLOW_STATUS.NEEDS_FEEDBACK]: 'needs_feedback',
};

/**
 * Default workflow counts structure
 */
export const DEFAULT_WORKFLOW_COUNTS = {
  pending: 0,
  in_progress: 0,
  completed: 0,
  rejected: 0,
  needs_feedback: 0,
};
