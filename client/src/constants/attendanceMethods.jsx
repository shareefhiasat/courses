import { info, error, warn, debug } from '@services/utils/logger.js';

// Attendance Method Types and Labels
export const ATTENDANCE_METHODS = {
  ROSTER_QUICK_ACTION: 'roster_quick_action',
  MANUAL_INSTRUCTOR: 'manual_instructor',
  MANUAL: 'manual',
  QR_SCAN: 'qr_scan',
  QR_SCAN_AUTO: 'qr_scan_auto',
  QR_SCAN_MANUAL: 'qr_scan_manual',
  BATCH_IMPORT: 'batch_import',
  API_IMPORT: 'api_import',
  BULK_UPDATE: 'bulk_update'
};

// Attendance Method Labels with Localization Support
export const getAttendanceMethodLabel = (method, t, lang = 'en') => {
  if (!method) return '';
  
  const methodLabels = {
    [ATTENDANCE_METHODS.ROSTER_QUICK_ACTION]: {
      en: 'Roster Quick Action',
      ar: 'إجراء سريع من السجل'
    },
    [ATTENDANCE_METHODS.MANUAL_INSTRUCTOR]: {
      en: 'Manual Entry',
      ar: 'إدخال يدوي'
    },
    [ATTENDANCE_METHODS.MANUAL]: {
      en: 'Manual',
      ar: 'يدوي'
    },
    [ATTENDANCE_METHODS.QR_SCAN]: {
      en: 'QR Scan',
      ar: 'مسح QR'
    },
    [ATTENDANCE_METHODS.QR_SCAN_AUTO]: {
      en: 'QR Scan (Auto)',
      ar: 'مسح QR (تلقائي)'
    },
    [ATTENDANCE_METHODS.QR_SCAN_MANUAL]: {
      en: 'QR Scan (Manual)',
      ar: 'مسح QR (يدوي)'
    },
    [ATTENDANCE_METHODS.BATCH_IMPORT]: {
      en: 'Batch Import',
      ar: 'استيراد مجمع'
    },
    [ATTENDANCE_METHODS.API_IMPORT]: {
      en: 'API Import',
      ar: 'استيراد عبر API'
    },
    [ATTENDANCE_METHODS.BULK_UPDATE]: {
      en: 'Bulk Update',
      ar: 'تحديث مجمع'
    }
  };

  const label = methodLabels[method];
  if (!label) {
    // Fallback for unknown methods - convert snake_case to title case
    return method.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Return localized label if translation function is provided
  if (t && typeof t === 'function') {
    const translationKey = `attendance_method_${method}`;
    return t(translationKey) || label[lang] || label.en;
  }

  // Return label based on language
  return label[lang] || label.en;
};

// Attendance Method Icons (if needed for future UI enhancements)
export const getAttendanceMethodIcon = (method) => {
  const iconMap = {
    [ATTENDANCE_METHODS.ROSTER_QUICK_ACTION]: 'zap',
    [ATTENDANCE_METHODS.MANUAL_INSTRUCTOR]: 'edit',
    [ATTENDANCE_METHODS.MANUAL]: 'edit',
    [ATTENDANCE_METHODS.QR_SCAN]: 'qr_code',
    [ATTENDANCE_METHODS.QR_SCAN_AUTO]: 'qr_code',
    [ATTENDANCE_METHODS.QR_SCAN_MANUAL]: 'qr_code',
    [ATTENDANCE_METHODS.BATCH_IMPORT]: 'upload',
    [ATTENDANCE_METHODS.API_IMPORT]: 'cloud',
    [ATTENDANCE_METHODS.BULK_UPDATE]: 'refresh_cw'
  };

  return iconMap[method] || 'help_circle';
};

// Attendance Method Colors (if needed for future UI enhancements)
export const getAttendanceMethodColor = (method) => {
  const colorMap = {
    [ATTENDANCE_METHODS.ROSTER_QUICK_ACTION]: '#10b981',
    [ATTENDANCE_METHODS.MANUAL_INSTRUCTOR]: '#3b82f6',
    [ATTENDANCE_METHODS.MANUAL]: '#6b7280',
    [ATTENDANCE_METHODS.QR_SCAN]: '#8b5cf6',
    [ATTENDANCE_METHODS.QR_SCAN_AUTO]: '#8b5cf6',
    [ATTENDANCE_METHODS.QR_SCAN_MANUAL]: '#8b5cf6',
    [ATTENDANCE_METHODS.BATCH_IMPORT]: '#f59e0b',
    [ATTENDANCE_METHODS.API_IMPORT]: '#06b6d4',
    [ATTENDANCE_METHODS.BULK_UPDATE]: '#ef4444'
  };

  return colorMap[method] || '#6b7280';
};

// Helper function to determine if we should show method label instead of notes
export const shouldShowMethodLabel = (method, notes) => {
  // If method is a quick action or manual instructor, always show method label
  if (method === ATTENDANCE_METHODS.ROSTER_QUICK_ACTION || method === ATTENDANCE_METHODS.MANUAL_INSTRUCTOR) {
    return true;
  }
  
  // If notes contain mixed language or seem auto-generated, show method label
  if (notes && (
    notes.includes('Quick') || 
    notes.includes('سريع') ||
    notes.match(/[a-zA-Z].*[\u0600-\u06FF]|\u0600-\u06FF.*[a-zA-Z]/) // Mixed Arabic and English
  )) {
    return true;
  }
  
  // Otherwise, show the original notes
  return false;
};

// Export all constants for easy importing
export const ATTENDANCE_METHOD_LABELS = {
  roster_quick_action: 'Roster Quick Action',
  manual_instructor: 'Manual Entry',
  manual: 'Manual',
  qr_scan: 'QR Scan',
  qr_scan_auto: 'QR Scan (Auto)',
  qr_scan_manual: 'QR Scan (Manual)',
  batch_import: 'Batch Import',
  api_import: 'API Import',
  bulk_update: 'Bulk Update'
};
