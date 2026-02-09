// Centralized Constants and Types Index
// This file exports all centralized constants, types, and utilities for easy importing

// Icon Types - Single source of truth for all icons
export {
  ICON_TYPES,
  getIcon,
  getIconWithColor,
  getThemedIcon,
  getTypeIcon,
  getAttendanceIcon,
  getBehaviorIcon,
  getPenaltyIcon,
  getParticipationIcon,
  getNotificationIcon,
  getActivityIcon,
  getUserStatusIcon,
  getUserRoleIcon,
  DASHBOARD_COLORS,
  CATEGORY_ICONS
} from './iconTypes.jsx';

// Filter Configuration - Centralized filter system
export {
  FILTER_CONFIGS,
  getFilterConfig,
  generateFilterOptions,
  getFilterPlaceholder
} from './filterConfig.js';

// Dashboard Types
import {
  RESOURCE_TYPES,
  getResourceTypeConfig,
  getResourceTypeOptions,
  getActivityLogTypeConfig,
  PROGRAM_SCOPE_TYPES,
  getProgramScopeConfig,
  COMMON_GRID_COLUMNS as DASHBOARD_GRID_COLUMNS,
  DARK_MODE_COLORS,
  getThemeColor,
  COMMON_ICONS
} from './dashboardTypes.jsx';

export {
  RESOURCE_TYPES,
  getResourceTypeConfig,
  getResourceTypeOptions,
  getActivityLogTypeConfig,
  PROGRAM_SCOPE_TYPES,
  getProgramScopeConfig,
  DASHBOARD_GRID_COLUMNS,
  DARK_MODE_COLORS,
  getThemeColor,
  COMMON_ICONS
};

// QR Scanner Types
import {
  QR_SCANNER_ACTIONS,
  getActionConfig,
  getActionButtonStyles,
  getActivityTypeOptions,
  getCameraConstraints,
  getCameraErrorMessage,
  isMobileDevice,
  INITIAL_QR_SCANNER_STATE,
  FEEDBACK_SOUNDS,
  DEBUG_LOG_TYPES,
  QR_SCANNER_VALIDATION,
  getQRScannerThemeColor
} from './qrScannerTypes.jsx';

export {
  QR_SCANNER_ACTIONS,
  getActionConfig,
  getActionButtonStyles,
  getActivityTypeOptions,
  getCameraConstraints,
  getCameraErrorMessage,
  isMobileDevice,
  INITIAL_QR_SCANNER_STATE,
  FEEDBACK_SOUNDS,
  DEBUG_LOG_TYPES,
  QR_SCANNER_VALIDATION,
  getQRScannerThemeColor
};

// Page Types
import {
  PAGE_STATES,
  FORM_STATES,
  MODAL_TYPES,
  TYPE_ICONS,
  COMMON_GRID_COLUMNS,
  VALIDATION_RULES,
  COMMON_FILTERS,
  PAGE_LAYOUTS,
  getThemeStyles,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from './pageTypes.jsx';

export {
  PAGE_STATES,
  FORM_STATES,
  MODAL_TYPES,
  TYPE_ICONS,
  COMMON_GRID_COLUMNS,
  VALIDATION_RULES,
  COMMON_FILTERS,
  PAGE_LAYOUTS,
  getThemeStyles,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};

// UI Theme
import {
  UI_THEMES,
  COMPONENT_SIZES,
  COMPONENT_VARIANTS,
  getTheme,
  getColor,
  getComponentStyles,
  generateCSSVariables,
  isDarkMode,
  useUITheme
} from './uiTheme.jsx';

export {
  UI_THEMES,
  COMPONENT_SIZES,
  COMPONENT_VARIANTS,
  getTheme,
  getColor,
  getComponentStyles,
  generateCSSVariables,
  isDarkMode,
  useUITheme
};

// Re-export commonly used constants from other files
import { USER_ROLES } from './userRoles.js';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, getAttendanceColor, getAttendanceLabel } from './attendanceTypes.js';
import { ATTENDANCE_METHODS, getAttendanceMethodLabel, shouldShowMethodLabel } from './attendanceMethods.jsx';
import { NOTIFICATION_TYPES, NOTIFICATION_STATUS, getNotificationTypeOptions, getNotificationStatusOptions, getNotificationTriggerOptions, getNotificationChannelOptions } from './notificationTypes.jsx';
import { PARTICIPATION_TYPES, getParticipationColor, getParticipationLabel, getParticipationTypeById } from './participationTypes.jsx';
import { PENALTY_TYPES, getPenaltyColor, getPenaltyLabel, getPenaltyTypeById } from './penaltyTypes.jsx';
import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorColor, getBehaviorTypeById } from './behaviorTypes.jsx';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_LABELS_AR, ACTIVITY_TYPE_OPTIONS, getActivityTypeConfig, getActivityTypeOptionsForDropdown } from './activityTypes.js';
import { RECORD_TYPES, GENERAL_STATUS, ENROLLMENT_STATUS, SUBMISSION_STATUS, TASK_STATUS, USER_STATUS, CLASS_STATUS } from '../utils/sharedTypes.js';

export { USER_ROLES };
export { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, getAttendanceColor, getAttendanceLabel };
export { ATTENDANCE_METHODS, getAttendanceMethodLabel, shouldShowMethodLabel };
export { NOTIFICATION_TYPES, NOTIFICATION_STATUS, getNotificationTypeOptions, getNotificationStatusOptions, getNotificationTriggerOptions, getNotificationChannelOptions };
export { PARTICIPATION_TYPES, getParticipationColor, getParticipationLabel, getParticipationTypeById };
export { PENALTY_TYPES, getPenaltyColor, getPenaltyLabel, getPenaltyTypeById };
export { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorColor, getBehaviorTypeById };
export { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_LABELS_AR, ACTIVITY_TYPE_OPTIONS, getActivityTypeConfig, getActivityTypeOptionsForDropdown };
export { RECORD_TYPES, GENERAL_STATUS, ENROLLMENT_STATUS, SUBMISSION_STATUS, TASK_STATUS, USER_STATUS, CLASS_STATUS };

// Global Role Configuration System - Comprehensive role-based limitations
import {
  ROLE_CONFIGURATIONS,
  getRoleConfig,
  hasPermission,
  getRoleLimit,
  isFileTypeAllowedForRole,
  getAllRolePermissions,
  getHigherPrivilegeRole,
  canManageRole,
  CHAT_LIMITATIONS,
  DEFAULT_CHAT_LIMITATIONS
} from './roleConfigurations.js';

export {
  ROLE_CONFIGURATIONS,
  getRoleConfig,
  hasPermission,
  getRoleLimit,
  isFileTypeAllowedForRole,
  getAllRolePermissions,
  getHigherPrivilegeRole,
  canManageRole,
  CHAT_LIMITATIONS,
  DEFAULT_CHAT_LIMITATIONS
};

// Chat Limitations - Legacy exports for backward compatibility
import {
  getChatLimitations,
  isFileTypeAllowed,
  isFileSizeAllowed,
  getMaxFileSizeDisplay,
  getMaxVoiceTimeDisplay,
  validateFileUpload,
  isVoiceTimeAllowed,
  getVoiceRecordingProgress
} from './chatLimitations.js';

export {
  getChatLimitations,
  isFileTypeAllowed,
  isFileSizeAllowed,
  getMaxFileSizeDisplay,
  getMaxVoiceTimeDisplay,
  validateFileUpload,
  isVoiceTimeAllowed,
  getVoiceRecordingProgress
};

// Role Configuration Usage Examples
import {
  canUserUploadFile,
  canUserCreateQuiz,
  getUserChatLimits,
  canUserModerateChat,
  getDashboardPermissions,
  validateFileUploadForRole,
  canUserManageOtherUser,
  getHighestRole,
  getAccessibleFeatures,
  getProgressLimits,
  getUserStorageInfo,
  getVoiceRecordingLimits
} from './roleConfigExamples.js';

export {
  canUserUploadFile,
  canUserCreateQuiz,
  getUserChatLimits,
  canUserModerateChat,
  getDashboardPermissions,
  validateFileUploadForRole,
  canUserManageOtherUser,
  getHighestRole,
  getAccessibleFeatures,
  getProgressLimits,
  getUserStorageInfo,
  getVoiceRecordingLimits
};

// Utility Functions
import { formatDateTime } from '@utils/date';
import { formatQatarDate, formatQatarDateOnly } from '@utils/timezone';
import { generateReferenceId, generateStudentQRCode } from '@utils/qrCode';
export { formatDateTime, formatQatarDate, formatQatarDateOnly, generateReferenceId, generateStudentQRCode };

// Default export containing all constants
export default {
  // Dashboard
  RESOURCE_TYPES,
  getResourceTypeConfig,
  getResourceTypeOptions,
  getActivityLogTypeConfig,
  PROGRAM_SCOPE_TYPES,
  getProgramScopeConfig,
  
  // QR Scanner
  QR_SCANNER_ACTIONS,
  getActionConfig,
  getActionButtonStyles,
  getActivityTypeOptions,
  getCameraConstraints,
  getCameraErrorMessage,
  isMobileDevice,
  INITIAL_QR_SCANNER_STATE,
  FEEDBACK_SOUNDS,
  DEBUG_LOG_TYPES,
  QR_SCANNER_VALIDATION,
  getQRScannerThemeColor,
  
  // Pages
  PAGE_STATES,
  FORM_STATES,
  MODAL_TYPES,
  TYPE_ICONS,
  COMMON_GRID_COLUMNS,
  VALIDATION_RULES,
  COMMON_FILTERS,
  PAGE_LAYOUTS,
  getThemeStyles,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  
  // UI Theme
  UI_THEMES,
  COMPONENT_SIZES,
  COMPONENT_VARIANTS,
  getTheme,
  getColor,
  getComponentStyles,
  generateCSSVariables,
  isDarkMode,
  useUITheme,
  
  // Re-exported constants
  USER_ROLES,
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_LABELS,
  getAttendanceColor,
  getAttendanceLabel,
  ATTENDANCE_METHODS,
  getAttendanceMethodLabel,
  shouldShowMethodLabel,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  getNotificationTypeOptions,
  getNotificationStatusOptions,
  PARTICIPATION_TYPES,
  getParticipationColor,
  getParticipationLabel,
  getParticipationTypeById,
  PENALTY_TYPES,
  getPenaltyColor,
  getPenaltyLabel,
  getPenaltyTypeById,
  BEHAVIOR_TYPES,
  getBehaviorLabel,
  getBehaviorColor,
  getBehaviorTypeById,
  RECORD_TYPES,
  GENERAL_STATUS,
  ENROLLMENT_STATUS,
  SUBMISSION_STATUS,
  TASK_STATUS,
  USER_STATUS,
  CLASS_STATUS,
  
  // Utilities
  formatDateTime,
  formatQatarDate,
  formatQatarDateOnly,
  generateReferenceId,
  generateStudentQRCode,
  
  // Theme utilities - DARK_MODE_COLORS exported from dashboardTypes.jsx
};
