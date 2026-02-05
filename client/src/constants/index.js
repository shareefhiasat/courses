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
  getUserRoleIcon
} from './iconTypes.jsx';

// Dashboard Types
export {
  RESOURCE_TYPES,
  getResourceTypeConfig,
  getResourceTypeOptions,
  ACTIVITY_LOG_TYPE_CONFIG,
  getActivityLogTypeConfig,
  PROGRAM_SCOPE_TYPES,
  getProgramScopeConfig,
  COMMON_GRID_COLUMNS as DASHBOARD_GRID_COLUMNS,
  DARK_MODE_COLORS,
  getThemeColor,
  COMMON_ICONS
} from './dashboardTypes.jsx';

// QR Scanner Types
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
} from './qrScannerTypes.jsx';

// Page Types
export {
  PAGE_STATES,
  FORM_STATES,
  MODAL_TYPES,
  TYPE_ICONS,
  getTypeIcon,
  COMMON_GRID_COLUMNS,
  VALIDATION_RULES,
  COMMON_FILTERS,
  PAGE_LAYOUTS,
  getThemeStyles,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from './pageTypes.jsx';

// UI Theme
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
} from './uiTheme.jsx';

// Re-export commonly used constants from other files
export { USER_ROLES } from './userRoles.jsx';
export { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, getAttendanceIcon, getAttendanceColor, getAttendanceLabel } from './attendanceTypes.jsx';
export { NOTIFICATION_TYPES, NOTIFICATION_STATUS, getNotificationIcon, getNotificationTypeOptions, getNotificationStatusOptions } from './notificationTypes.jsx';
export { PARTICIPATION_TYPES, getParticipationColor, getParticipationLabel, getParticipationTypeById } from './participationTypes.jsx';
export { PENALTY_TYPES, getPenaltyColor, getPenaltyLabel, getPenaltyTypeById } from './penaltyTypes.jsx';
export { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorIcon, getBehaviorColor, getBehaviorTypeById } from './behaviorTypes.jsx';
export { RECORD_TYPES, GENERAL_STATUS, ENROLLMENT_STATUS, SUBMISSION_STATUS, TASK_STATUS, USER_STATUS, CLASS_STATUS } from '../utils/sharedTypes.jsx';

// Utility Functions
export { formatDateTime } from '../utils/date.js';
export { formatQatarDate, formatQatarDateOnly } from '../utils/timezone.js';
export { generateReferenceId, generateStudentQRCode } from '../utils/qrCode.js';

// Default export containing all constants
export default {
  // Dashboard
  RESOURCE_TYPES,
  getResourceTypeConfig,
  getResourceTypeOptions,
  ACTIVITY_LOG_TYPE_CONFIG,
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
  getTypeIcon,
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
  getAttendanceIcon,
  getAttendanceColor,
  getAttendanceLabel,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  getNotificationIcon,
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
  getBehaviorIcon,
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
  
  // Theme utilities
  DARK_MODE_COLORS,
  getThemeColor
};
