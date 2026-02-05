import React from 'react';
import {
  UserCheck, UserX, Clock, AlertTriangle, Heart, Shield, 
  MessageSquare, Award, BookOpen, Zap
} from 'lucide-react';
import { ATTENDANCE_STATUS } from './attendanceTypes';
import { PARTICIPATION_TYPES } from './participationTypes.jsx';
import { PENALTY_TYPES } from './penaltyTypes.jsx';
import { BEHAVIOR_TYPES } from './behaviorTypes.jsx';

// QR Scanner Action Types
export const QR_SCANNER_ACTIONS = {
  MARK_PRESENT: 'mark_present',
  MARK_LATE: 'mark_late',
  MARK_ABSENT_NO_EXCUSE: 'mark_absent_no_excuse',
  MARK_ABSENT_WITH_EXCUSE: 'mark_absent_with_excuse',
  MARK_HUMAN_CASE: 'mark_human_case',
  ADD_PARTICIPATION: 'add_participation',
  ADD_PENALTY: 'add_penalty',
  ADD_BEHAVIOR: 'add_behavior'
};

// Action Button Configurations
export const getActionConfig = (action, theme = 'light') => {
  const configs = {
    [QR_SCANNER_ACTIONS.MARK_PRESENT]: {
      icon: <UserCheck size={18} />,
      color: '#16a34a',
      label: 'Mark Present',
      attendanceStatus: ATTENDANCE_STATUS.PRESENT
    },
    [QR_SCANNER_ACTIONS.MARK_LATE]: {
      icon: <Clock size={18} />,
      color: '#eab308',
      label: 'Mark Late',
      attendanceStatus: ATTENDANCE_STATUS.LATE
    },
    [QR_SCANNER_ACTIONS.MARK_ABSENT_NO_EXCUSE]: {
      icon: <UserX size={18} />,
      color: '#dc2626',
      label: 'Mark Absent',
      attendanceStatus: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE
    },
    [QR_SCANNER_ACTIONS.MARK_ABSENT_WITH_EXCUSE]: {
      icon: <AlertTriangle size={18} />,
      color: '#f97316',
      label: 'Mark Absent with Excuse',
      attendanceStatus: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE
    },
    [QR_SCANNER_ACTIONS.MARK_HUMAN_CASE]: {
      icon: <Heart size={18} />,
      color: '#8b5cf6',
      label: 'Mark Human Case',
      attendanceStatus: ATTENDANCE_STATUS.HUMAN_CASE
    }
  };
  
  return configs[action] || configs[QR_SCANNER_ACTIONS.MARK_PRESENT];
};

// Action Button Style Generator
export const getActionButtonStyles = (action, isLoading = false, theme = 'light') => {
  const config = getActionConfig(action, theme);
  const baseColor = config.color;
  
  return {
    padding: '0.875rem',
    border: 'none',
    background: isLoading ? '#94a3b8' : baseColor,
    color: 'white',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.625rem',
    opacity: isLoading ? 0.7 : 1,
    transition: 'all 0.2s ease',
    boxShadow: `0 2px 4px ${baseColor}20`,
    '&:hover': !isLoading ? {
      background: baseColor + 'dd',
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 8px ${baseColor}40`
    } : {}
  };
};

// Activity Type Options for StudentActionPanel
export const getActivityTypeOptions = () => [
  // Behavior options
  ...BEHAVIOR_TYPES.map(behavior => ({
    value: behavior.id,
    category: 'behavior',
    points: behavior.points,
    icon: behavior.icon || 'AlertCircle',
    color: behavior.color || '#f97316',
    label: behavior.label || behavior.name
  })),
  
  // Participation options
  ...PARTICIPATION_TYPES.map(participation => ({
    value: participation.id,
    category: 'participation',
    points: participation.points,
    icon: participation.icon || 'MessageSquare',
    color: participation.color || '#3b82f6',
    label: participation.label || participation.name
  })),
  
  // Penalty options
  ...PENALTY_TYPES.map(penalty => ({
    value: penalty.id,
    category: 'penalty',
    points: penalty.points,
    icon: penalty.icon || 'AlertTriangle',
    color: penalty.color || '#dc2626',
    label: penalty.label || penalty.name
  }))
];

// Camera Configuration
export const getCameraConstraints = (isMobile = false, cameraMode = 'environment') => ({
  video: {
    facingMode: cameraMode,
    width: { ideal: isMobile ? 640 : 1280 },
    height: { ideal: isMobile ? 480 : 720 }
  }
});

// Error Messages for Camera Issues
export const getCameraErrorMessage = (error, t) => {
  const errorMessages = {
    'NotAllowedError': t('camera_permission_denied') || 'Camera permission denied. Please allow camera access.',
    'NotFoundError': t('camera_not_found') || 'No camera found on this device.',
    'NotReadableError': t('camera_already_in_use') || 'Camera is already in use by another application.',
    'OverconstrainedError': t('camera_constraints_not_supported') || 'Camera constraints not supported.',
    'SecurityError': t('camera_security_error') || 'Camera access blocked due to security restrictions.',
    'TypeError': t('camera_type_error') || 'Camera API not available in this browser.'
  };
  
  return errorMessages[error.name] || 
    `${t('camera_access_failed') || 'Failed to access camera'}: ${error.message}`;
};

// Mobile Detection
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// QR Scanner State Management
export const INITIAL_QR_SCANNER_STATE = {
  isScanning: false,
  recentScans: 0,
  error: '',
  cameraMode: 'environment',
  devices: [],
  isMobile: false,
  recentActivity: [],
  activityLoading: false,
  expandedActivities: new Set(),
  soundEnabled: true,
  vibrationEnabled: true,
  lastScannedStudent: null,
  showScanDialog: false,
  debugLogs: [],
  showDebugBox: false,
  isScanningLocked: false,
  lastScannedCode: null,
  isMinimized: false,
  showResultModal: false,
  resultModalData: { type: '', message: '' },
  showStudentActionPanel: false,
  showStudentActionPanelNew: false,
  initialTab: 'behavior',
  selectedStudent: null,
  studentForAction: null,
  todayAttendanceStatus: null,
  actionLoading: false,
  currentAction: null,
  showManualInput: false,
  manualStudentId: '',
  showClearConfirmModal: false
};

// Feedback Sound Types
export const FEEDBACK_SOUNDS = {
  SUCCESS: 'success',
  ERROR: 'error',
  SCAN: 'scan',
  WARNING: 'warning'
};

// Debug Log Types
export const DEBUG_LOG_TYPES = {
  INFO: 'info',
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success'
};

// QR Scanner Validation Rules
export const QR_SCANNER_VALIDATION = {
  REQUIRED_FIELDS: ['selectedProgramId', 'selectedSubjectId', 'selectedClassId'],
  STUDENT_NUMBER_PATTERN: /^\d+$/,
  MAX_DEBUG_LOGS: 50,
  SCAN_DEBOUNCE_MS: 1000,
  CAMERA_RETRY_ATTEMPTS: 3
};

// Theme-aware Colors
export const QR_SCANNER_THEMES = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#e2e8f0',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      muted: '#9ca3af'
    },
    status: {
      scanning: '#3b82f6',
      success: '#16a34a',
      error: '#dc2626',
      warning: '#f59e0b'
    }
  },
  dark: {
    background: '#111827',
    surface: '#1f2937',
    border: '#374151',
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      muted: '#9ca3af'
    },
    status: {
      scanning: '#60a5fa',
      success: '#34d399',
      error: '#f87171',
      warning: '#fbbf24'
    }
  }
};

// Get theme-aware color
export const getQRScannerThemeColor = (colorKey, theme = 'light') => {
  return QR_SCANNER_THEMES[theme]?.[colorKey] || QR_SCANNER_THEMES.light[colorKey];
};
