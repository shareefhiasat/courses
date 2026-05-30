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
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

/**
 * Workflow Status to Frontend Status Mapping
 * Maps backend statuses to frontend status keys
 */
export const WORKFLOW_STATUS_MAP = {
  [WORKFLOW_STATUS.DRAFT]: 'draft',
  [WORKFLOW_STATUS.SUBMITTED]: 'submitted',
  [WORKFLOW_STATUS.IN_REVIEW]: 'in_review',
  [WORKFLOW_STATUS.APPROVED]: 'approved',
  [WORKFLOW_STATUS.REJECTED]: 'rejected',
  [WORKFLOW_STATUS.CANCELLED]: 'cancelled',
};

/**
 * Workflow Status Configuration
 * Unified configuration for icons, colors, and labels
 */
export const WORKFLOW_STATUS_CONFIG = {
  draft: {
    icon: 'file_text',
    color: '#6b7280', // gray-500
    bg: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#d1d5db',
    labelKey: 'workflow.status.draft',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-800',
    borderClass: 'border-0',
  },
  submitted: {
    icon: 'send',
    color: '#10b981', // green-500
    bg: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#6ee7b7',
    labelKey: 'workflow.status.submitted',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-300 dark:border-green-700',
  },
  in_review: {
    icon: 'clock',
    color: '#d97706', // amber-600
    bg: 'rgba(217, 119, 6, 0.1)',
    borderColor: '#fcd34d',
    labelKey: 'workflow.status.in_review',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-300 dark:border-amber-700',
  },
  approved: {
    icon: 'check_circle',
    color: '#16a34a', // green-600
    bg: 'rgba(22, 163, 74, 0.1)',
    borderColor: '#86efac',
    labelKey: 'workflow.status.approved',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    borderClass: 'border-green-300 dark:border-green-700',
  },
  rejected: {
    icon: 'x_circle',
    color: '#dc2626', // red-600
    bg: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#fca5a5',
    labelKey: 'workflow.status.rejected',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-300 dark:border-red-700',
  },
  cancelled: {
    icon: 'alert_circle',
    color: '#6b7280', // gray-500
    bg: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#d1d5db',
    labelKey: 'workflow.status.cancelled',
    bgClass: 'bg-gray-100 dark:bg-gray-900/30',
    textClass: 'text-gray-700 dark:text-gray-400',
    borderClass: 'border-gray-300 dark:border-gray-700',
  },
};

/**
 * Default workflow counts structure
 */
export const DEFAULT_WORKFLOW_COUNTS = {
  draft: 0,
  submitted: 0,
  in_review: 0,
  approved: 0,
  rejected: 0,
  cancelled: 0,
};

/**
 * Drive space constants
 */
export const DRIVE_SPACES = {
  MY_DRIVE: 'my-drive',
  SHARED: 'shared',
  WORKFLOW: 'workflow',
  TRASH: 'trash',
};

/**
 * Get refresh handler based on active space
 * @param {string} activeSpace - Current active space
 * @param {Object} handlers - Object containing load functions for each space
 * @returns {Function} - Appropriate load function or null
 */
export const getRefreshHandler = (activeSpace, handlers) => {
  switch (activeSpace) {
    case DRIVE_SPACES.MY_DRIVE:
      return handlers.loadPrivateFiles || null;
    case DRIVE_SPACES.SHARED:
      return handlers.loadSharedFiles || null;
    case DRIVE_SPACES.WORKFLOW:
      return handlers.loadWorkflowFiles || null;
    default:
      return null;
  }
};
