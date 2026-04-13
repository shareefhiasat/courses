// QR Scanner screen permissions - code-based configuration
// This will be migrated to DB in Phase 2

export const PERMISSION_CONFIG = {
  // Role definitions
  roles: {
    super_admin: {
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
    hr: {
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
    admin: {
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
    instructor: {
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
    student: {
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
    super_admin: ['all'], // Special key for all screens
    hr: ['operations/attendance/qr-scanner'],
    admin: ['operations/attendance/qr-scanner'],
    instructor: ['operations/attendance/qr-scanner'],
    student: []
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
