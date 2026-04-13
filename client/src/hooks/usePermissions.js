import { useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getPermission, canAccessScreen, PERMISSION_CONFIG } from '@constants/permissionConfig';

export const usePermissions = () => {
  const { role, isSuperAdmin, isHR, isAdmin, isInstructor, isStudent } = useAuth();

  // Determine user's role code
  const roleCode = useMemo(() => {
    if (isSuperAdmin) return 'super_admin';
    if (isHR) return 'hr';
    if (isAdmin) return 'admin';
    if (isInstructor) return 'instructor';
    if (isStudent) return 'student';
    return null;
  }, [isSuperAdmin, isHR, isAdmin, isInstructor, isStudent]);

  // Get permissions for this role
  const permissions = useMemo(() => {
    if (!roleCode) return PERMISSION_CONFIG.roles.student;
    return PERMISSION_CONFIG.roles[roleCode];
  }, [roleCode]);

  return {
    // Screen access
    canAccessAllScreens: permissions.canAccessAllScreens,
    canAccessQRScanner: permissions.canAccessQRScanner,
    
    // Delete operations
    canDeleteAttendance: permissions.canDeleteAttendance,
    canClearToday: permissions.canClearToday,
    
    // Update operations
    canEditAttendance: permissions.canEditAttendance,
    canBulkScan: permissions.canBulkScan,
    canManualInput: permissions.canManualInput,
    canUseStatsPanel: permissions.canUseStatsPanel,
    canUseZapPanel: permissions.canUseZapPanel,
    
    // Create operations
    canMarkAttendance: permissions.canMarkAttendance,
    canUseQRScanner: permissions.canUseQRScanner,
    
    // View operations
    canSeeStandupMode: permissions.canSeeStandupMode,
    canExport: permissions.canExport,
    canSeeQuickButtons: permissions.canSeeQuickButtons,
    
    // Helper functions
    hasPermission: (permissionName) => permissions[permissionName] || false,
    canAccessScreen: (screenPath) => canAccessScreen(screenPath, roleCode),
    roleCode
  };
};
