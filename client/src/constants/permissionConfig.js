// QR Scanner screen permissions - code-based configuration
// This will be migrated to DB in Phase 2

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  HR: 'HR',
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  STUDENT: 'STUDENT'
};

// Screen IDs for scheduling system
export const SCREEN_IDS = {
  SCHEDULE_OVERVIEW: 'scheduleOverview',
  SCHEDULING_MASTERS: 'schedulingMasters',
  SCHEDULE_SESSION_EDITOR: 'scheduleSessionEditor',
  BULK_SCHEDULING: 'bulkScheduling',
  ADMIN_SCOPE_ASSIGNMENT: 'adminScopeAssignment',
  SUMMARY_DASHBOARD: 'summaryDashboard',
  WORKFLOW: 'workflow',
  WORKFLOW_INBOX: 'workflowInbox',
  WORKFLOW_DOCUMENT_DETAIL: 'workflowDocumentDetail'
};

export const PERMISSION_CONFIG = {
  // Role definitions
  roles: {
    [ROLES.SUPER_ADMIN]: {
      // Screen access
      canAccessAllScreens: true,
      canAccessQRScanner: true,
      // Delete operations
      canDeleteAttendance: true,
      canClearToday: true,
      // Update operations
      canEditAttendance: true,
      canBulkScan: true,
      canManualInput: true,
      canUseStatsPanel: true,
      canUseZapPanel: true,
      // Create operations
      canMarkAttendance: true,
      canUseQRScanner: true,
      // View operations
      canSeeStandupMode: true,
      canExport: true,
      canSeeQuickButtons: true
    },
    [ROLES.HR]: {
      // Screen access
      canAccessAllScreens: false,
      canAccessQRScanner: true,
      // Delete operations
      canDeleteAttendance: true,
      canClearToday: true,
      // Update operations
      canEditAttendance: true,
      canBulkScan: false,
      canManualInput: false,
      canUseStatsPanel: true,
      canUseZapPanel: true,
      // Create operations
      canMarkAttendance: true,
      canUseQRScanner: true,
      // View operations
      canSeeStandupMode: true,
      canExport: true,
      canSeeQuickButtons: true
    },
    [ROLES.ADMIN]: {
      // Screen access
      canAccessAllScreens: false,
      canAccessQRScanner: true,
      // Delete operations
      canDeleteAttendance: false,
      canClearToday: false,
      // Update operations
      canEditAttendance: false,
      canBulkScan: false,
      canManualInput: false,
      canUseStatsPanel: true, // Can view but not edit
      canUseZapPanel: false,
      // Create operations
      canMarkAttendance: true,
      canUseQRScanner: true,
      // View operations
      canSeeStandupMode: true,
      canExport: true,
      canSeeQuickButtons: true
    },
    [ROLES.INSTRUCTOR]: {
      // Screen access
      canAccessAllScreens: false,
      canAccessQRScanner: true,
      // Delete operations
      canDeleteAttendance: false,
      canClearToday: false,
      // Update operations
      canEditAttendance: false,
      canBulkScan: false,
      canManualInput: false,
      canUseStatsPanel: true, // Can view but not edit
      canUseZapPanel: false,
      // Create operations
      canMarkAttendance: true,
      canUseQRScanner: true,
      // View operations
      canSeeStandupMode: false,
      canExport: true,
      canSeeQuickButtons: true
    },
    [ROLES.STUDENT]: {
      // Screen access
      canAccessAllScreens: false,
      canAccessQRScanner: false,
      // Delete operations
      canDeleteAttendance: false,
      canClearToday: false,
      // Update operations
      canEditAttendance: false,
      canBulkScan: false,
      canManualInput: false,
      canUseStatsPanel: false,
      canUseZapPanel: false,
      // Create operations
      canMarkAttendance: false,
      canUseQRScanner: false,
      // View operations
      canSeeStandupMode: false,
      canExport: false,
      canSeeQuickButtons: false
    }
  },

  // Screen access mapping for side menu
  screenAccess: {
    [ROLES.SUPER_ADMIN]: ['all'], // Special key for all screens
    [ROLES.HR]: ['/', '/qr-scanner', '/hr-attendance', '/analytics', '/student-profile', '/profile',
                  '/schedule-overview', '/scheduling-masters', '/schedule-session-editor', '/bulk-scheduling', '/admin-scope-assignment', '/summary-dashboard',
                  '/workflow', '/workflow/inbox', '/workflow-documents/:documentId', '/workflow/:documentId',
                  '/smart-drive'],
    [ROLES.ADMIN]: ['all'], // Admin can access all screens except role-access-pro
    [ROLES.INSTRUCTOR]: ['all'], // Instructor can access all screens except role-access-pro
    [ROLES.STUDENT]: ['/', '/student-dashboard', '/my-enrollments', '/scheduling-calendar', '/my-attendance', '/profile']
  }
};

export const getPermission = (permissionName, userRole) => {
  const roleConfig = PERMISSION_CONFIG.roles[userRole];
  if (!roleConfig) return false;
  return roleConfig[permissionName] || false;
};

export const canAccessScreen = (screenPath, userRole) => {
  const screenAccess = PERMISSION_CONFIG.screenAccess[userRole];
  if (!screenAccess) return false;
  
  // Super admin can access all screens
  if (screenAccess.includes('all')) return true;
  
  return screenAccess.includes(screenPath);
};
