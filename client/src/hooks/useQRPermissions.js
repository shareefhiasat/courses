import { usePermissions } from '@hooks/usePermissions';

/**
 * Shared QR scanner permission checks.
 * Used by QRScannerPage, QRScanner, StudentRoster, StudentActionStatsPanel, StudentActionZapPanel.
 */
export const useQRPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canBulkScan: hasPermission('qr-scanner.canBulkScan'),
    canManualInput: hasPermission('qr-scanner.canManualInput'),
    canClearToday: hasPermission('qr-scanner.canClearToday'),
    canDeleteAttendance: hasPermission('qr-scanner.canDeleteAttendance'),
    canEditAttendance: hasPermission('qr-scanner.canEditAttendance'),
    canExport: hasPermission('qr-scanner.canExport'),
    canExportSummary: hasPermission('qr-scanner.canExportSummary'),
    canSeeStandupMode: hasPermission('qr-scanner.canSeeStandupMode'),
    canSeeQuickButtons: hasPermission('qr-scanner.canSeeQuickButtons'),
    canMarkAttendance: hasPermission('qr-scanner.canMarkAttendance'),
    canUseStatsPanel: hasPermission('qr-scanner.canUseStatsPanel'),
    canUseZapPanel: hasPermission('qr-scanner.canUseZapPanel'),
  };
};

export default useQRPermissions;
