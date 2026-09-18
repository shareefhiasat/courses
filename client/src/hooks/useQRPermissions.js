import { usePermissions } from '@hooks/usePermissions';
import { useAuth } from '@contexts/AuthContext';

/** Operations that admin/super_admin are explicitly denied even with the override. */
const ADMIN_DENIED = new Set([
  'qr-scanner.canDeleteAttendance',
  'qr-scanner.canClearToday',
]);

/**
 * Shared QR scanner permission checks.
 * Used by QRScannerPage, QRScanner, StudentRoster, StudentActionStatsPanel, StudentActionZapPanel.
 *
 * Admin & super_admin get all QR scanner permissions except delete operations,
 * regardless of the permission matrix configuration.
 */
export const useQRPermissions = () => {
  const { hasPermission } = usePermissions();
  const { isAdmin, isSuperAdmin } = useAuth();

  const adminOverride = isAdmin || isSuperAdmin;

  const check = (key) => {
    if (adminOverride) return !ADMIN_DENIED.has(key);
    return hasPermission(key);
  };

  return {
    canBulkScan: check('qr-scanner.canBulkScan'),
    canManualInput: check('qr-scanner.canManualInput'),
    canClearToday: check('qr-scanner.canClearToday'),
    canDeleteAttendance: check('qr-scanner.canDeleteAttendance'),
    canEditAttendance: check('qr-scanner.canEditAttendance'),
    canExport: check('qr-scanner.canExport'),
    canExportSummary: check('qr-scanner.canExportSummary'),
    canSeeStandupMode: check('qr-scanner.canSeeStandupMode'),
    canSeeQuickButtons: check('qr-scanner.canSeeQuickButtons'),
    canMarkAttendance: check('qr-scanner.canMarkAttendance'),
    canUseStatsPanel: check('qr-scanner.canUseStatsPanel'),
    canUseZapPanel: check('qr-scanner.canUseZapPanel'),
  };
};

export default useQRPermissions;
