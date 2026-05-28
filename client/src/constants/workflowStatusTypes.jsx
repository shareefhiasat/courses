/**
 * Workflow Document Status Constants
 * 
 * PURPOSE: Single source of truth for workflow document status values and UI variants
 * ARCHITECTURE: Centralized constants → Used across all workflow components
 */

import { CheckCircle, XCircle, Clock, AlertCircle, GitBranch } from 'lucide-react';

/**
 * Workflow Document Status Values
 */
export const WORKFLOW_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  UNDER_ADMIN_REVIEW: 'UNDER_ADMIN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  AMENDED: 'AMENDED',
  CLOSED: 'CLOSED'
};

/**
 * UI Badge Variants for Workflow Status
 * Maps status values to shadcn/ui Badge variants
 */
export const WORKFLOW_STATUS_VARIANTS = {
  [WORKFLOW_STATUS.DRAFT]: 'secondary',
  [WORKFLOW_STATUS.SUBMITTED]: 'warning',
  [WORKFLOW_STATUS.UNDER_REVIEW]: 'info',
  [WORKFLOW_STATUS.UNDER_ADMIN_REVIEW]: 'info',
  [WORKFLOW_STATUS.APPROVED]: 'success',
  [WORKFLOW_STATUS.REJECTED]: 'destructive',
  [WORKFLOW_STATUS.AMENDED]: 'warning',
  [WORKFLOW_STATUS.CLOSED]: 'outline'
};

/**
 * Get badge variant for a given status
 * @param {string} status - The workflow status
 * @returns {string} The badge variant
 */
export const getStatusVariant = (status) => {
  return WORKFLOW_STATUS_VARIANTS[status] || 'secondary';
};

/**
 * Legacy Workflow System Status (for backward compatibility)
 * These are for the older Workflow system, not WorkflowDocument system
 */
export const LEGACY_WORKFLOW_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  RETURNED: 'returned',
  REVISE_NEEDED: 'revise_needed',
  APPROVED: 'approved',
  CLOSED: 'closed'
};

/**
 * UI Badge Variants for Legacy Workflow Status
 */
export const LEGACY_WORKFLOW_STATUS_VARIANTS = {
  [LEGACY_WORKFLOW_STATUS.DRAFT]: 'secondary',
  [LEGACY_WORKFLOW_STATUS.SENT]: 'warning',
  [LEGACY_WORKFLOW_STATUS.RETURNED]: 'destructive',
  [LEGACY_WORKFLOW_STATUS.REVISE_NEEDED]: 'destructive',
  [LEGACY_WORKFLOW_STATUS.APPROVED]: 'success',
  [LEGACY_WORKFLOW_STATUS.CLOSED]: 'outline'
};

/**
 * Get badge variant for legacy workflow status
 * @param {string} status - The legacy workflow status
 * @returns {string} The badge variant
 */
export const getLegacyStatusVariant = (status) => {
  return LEGACY_WORKFLOW_STATUS_VARIANTS[status] || 'secondary';
};

/**
 * Workflow Inbox Action Status Variants
 */
export const WORKFLOW_ACTION_VARIANTS = {
  sent: 'default',
  review: 'warning',
  approve: 'info',
  revise: 'destructive',
  approved: 'success',
  return: 'secondary',
  close: 'outline',
  pending: 'warning',
  rejected: 'destructive',
  returned: 'destructive',
  completed: 'success'
};

/**
 * Get badge variant for workflow inbox action
 * @param {string} action - The workflow action
 * @returns {string} The badge variant
 */
export const getActionVariant = (action) => {
  return WORKFLOW_ACTION_VARIANTS[action] || 'secondary';
};

/**
 * CSS Color Classes for Workflow Status (for WorkflowHistory component)
 * Returns Tailwind CSS classes for status badges
 */
export const WORKFLOW_STATUS_COLOR_CLASSES = {
  [WORKFLOW_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
  [WORKFLOW_STATUS.SUBMITTED]: 'bg-yellow-100 text-yellow-800',
  [WORKFLOW_STATUS.UNDER_REVIEW]: 'bg-blue-100 text-blue-800',
  [WORKFLOW_STATUS.UNDER_ADMIN_REVIEW]: 'bg-blue-100 text-blue-800',
  [WORKFLOW_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [WORKFLOW_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [WORKFLOW_STATUS.AMENDED]: 'bg-orange-100 text-orange-800',
  [WORKFLOW_STATUS.CLOSED]: 'bg-gray-100 text-gray-800',
  // Legacy status support
  'REVIEW': 'bg-yellow-100 text-yellow-800'
};

/**
 * Get CSS color classes for a given status
 * @param {string} status - The workflow status
 * @returns {string} The CSS classes
 */
export const getStatusColorClasses = (status) => {
  return WORKFLOW_STATUS_COLOR_CLASSES[status] || 'bg-gray-100 text-gray-800';
};

/**
 * SmartDrive Workflow Status Constants
 * These are for the file workflow status in SmartDrive
 */
export const SMARTDRIVE_WORKFLOW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  NEEDS_FEEDBACK: 'needs_feedback'
};

/**
 * SmartDrive Workflow Status Icons
 */
export const SMARTDRIVE_WORKFLOW_STATUS_ICONS = {
  [SMARTDRIVE_WORKFLOW_STATUS.COMPLETED]: CheckCircle,
  [SMARTDRIVE_WORKFLOW_STATUS.REJECTED]: XCircle,
  [SMARTDRIVE_WORKFLOW_STATUS.PENDING]: Clock,
  [SMARTDRIVE_WORKFLOW_STATUS.IN_PROGRESS]: Clock,
  [SMARTDRIVE_WORKFLOW_STATUS.NEEDS_FEEDBACK]: AlertCircle,
  default: GitBranch
};

/**
 * Get icon for SmartDrive workflow status
 * @param {string} status - The workflow status
 * @returns {Component} The icon component
 */
export const getSmartDriveWorkflowStatusIcon = (status) => {
  return SMARTDRIVE_WORKFLOW_STATUS_ICONS[status] || SMARTDRIVE_WORKFLOW_STATUS_ICONS.default;
};

/**
 * SmartDrive Workflow Status Styles
 */
export const SMARTDRIVE_WORKFLOW_STATUS_STYLES = {
  [SMARTDRIVE_WORKFLOW_STATUS.COMPLETED]: {
    bg: 'rgba(34, 197, 94, 0.1)',
    color: '#16a34a',
    borderColor: '#22c55e',
  },
  [SMARTDRIVE_WORKFLOW_STATUS.REJECTED]: {
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#dc2626',
    borderColor: '#ef4444',
  },
  [SMARTDRIVE_WORKFLOW_STATUS.IN_PROGRESS]: {
    bg: 'rgba(59, 130, 246, 0.1)',
    color: '#2563eb',
    borderColor: '#3b82f6',
  },
  [SMARTDRIVE_WORKFLOW_STATUS.NEEDS_FEEDBACK]: {
    bg: 'rgba(234, 179, 8, 0.1)',
    color: '#ca8a04',
    borderColor: '#eab308',
  },
  [SMARTDRIVE_WORKFLOW_STATUS.PENDING]: {
    bg: 'rgba(107, 114, 128, 0.1)',
    color: '#6b7280',
    borderColor: '#9ca3af',
  },
  default: {
    bg: 'rgba(107, 114, 128, 0.1)',
    color: '#6b7280',
    borderColor: '#9ca3af',
  }
};

/**
 * Get style for SmartDrive workflow status
 * @param {string} status - The workflow status
 * @returns {Object} The style object
 */
export const getSmartDriveWorkflowStatusStyle = (status) => {
  return SMARTDRIVE_WORKFLOW_STATUS_STYLES[status] || SMARTDRIVE_WORKFLOW_STATUS_STYLES.default;
};

/**
 * SmartDrive Workflow Status Descriptions
 * @param {string} status - The workflow status
 * @param {Function} t - Translation function
 * @returns {string} The status description
 */
export const getSmartDriveWorkflowStatusDescription = (status, t) => {
  const descriptions = {
    [SMARTDRIVE_WORKFLOW_STATUS.PENDING]: t('workflow.status.pending.desc', 'Awaiting review'),
    [SMARTDRIVE_WORKFLOW_STATUS.IN_PROGRESS]: t('workflow.status.inProgress.desc', 'Currently being reviewed'),
    [SMARTDRIVE_WORKFLOW_STATUS.COMPLETED]: t('workflow.status.completed.desc', 'Workflow completed successfully'),
    [SMARTDRIVE_WORKFLOW_STATUS.REJECTED]: t('workflow.status.rejected.desc', 'Rejected and requires changes'),
    [SMARTDRIVE_WORKFLOW_STATUS.NEEDS_FEEDBACK]: t('workflow.status.needsFeedback.desc', 'Additional information required'),
  };
  return descriptions[status] || t('workflow.status.unknown.desc', 'Unknown status');
};

export default {
  WORKFLOW_STATUS,
  WORKFLOW_STATUS_VARIANTS,
  getStatusVariant,
  LEGACY_WORKFLOW_STATUS,
  LEGACY_WORKFLOW_STATUS_VARIANTS,
  getLegacyStatusVariant,
  WORKFLOW_ACTION_VARIANTS,
  getActionVariant,
  WORKFLOW_STATUS_COLOR_CLASSES,
  getStatusColorClasses,
  SMARTDRIVE_WORKFLOW_STATUS,
  SMARTDRIVE_WORKFLOW_STATUS_ICONS,
  getSmartDriveWorkflowStatusIcon,
  SMARTDRIVE_WORKFLOW_STATUS_STYLES,
  getSmartDriveWorkflowStatusStyle,
  getSmartDriveWorkflowStatusDescription
};
