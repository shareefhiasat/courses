import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate';
import { Button } from '@ui';
import { CollapsibleSection, PerformedBy } from '@ui';
import DeleteModal from '@ui/history/DeleteModal';
import { Upload } from 'lucide-react';
import jsQR from 'jsqr';
import { getAttendanceByClass, deleteAttendance, rosterQuickAction, markAttendance } from '@services/business/attendanceServiceUnified.js';
import { deleteStandupAttendance, getStandupAttendanceByUserAndDate, getStandupAttendanceByProgramAndDate } from '@services/business/standupAttendanceService.js';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_TYPE_CATEGORY, getAttendanceIcon, getAttendanceColor, getAttendanceLabel, getLocalizedAttendanceLabel, getStatusCodeFromRecord } from '@constants/attendanceTypes';
import { QUICK_NOTE_TYPES, MANUAL_NOTE_TYPES, QR_NOTE_TYPES, STANDUP_NOTE_TYPES, getNoteTypeFromStatus, getLocalizedNoteText } from '@constants/noteTypes';
import { ATTENDANCE_METHODS } from '@constants/attendanceMethods';
import { isAdmin, isSuperAdmin, isStudent } from '@utils/userUtils';
import { getPenalties, deletePenalty, createPenalty, getPenaltiesByClassAndDate } from '@services/business/penaltyService';
import { createParticipation, getParticipations, getParticipationsByClassAndDate, deleteParticipation } from '@services/business/participationService';
import { createBehavior, getBehaviors, getBehaviorsByClassAndDate, deleteBehavior } from '@services/business/behaviorService';
import { getPerformedByFields } from '@services/business/userService';
import { getUsers } from '@services/business/userService';
import { getUserByStudentNumber, getUserById } from '@services/business/userService';
import { getTodayAttendanceStatus, isStudentMarkedToday } from '@services/business/attendanceService';
import eventBus, { EVENTS } from '@utils/eventBus';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { useQRPermissions } from '@hooks/useQRPermissions';
import { useToast } from '@ui';
import PortalTooltip from '@ui/PortalTooltip';
import { getLocalizedUserName } from '@utils/localizedUserName';
import StudentActionStatsPanel from './StudentActionStatsPanel';
import StudentActionZapPanel from './StudentActionZapPanel';
import BulkScanDialog from '@ui/BulkScanDialog';
import BulkSuccessModal from '@ui/BulkScanDialog/BulkSuccessModal';
import { BulkScanProvider } from '@/contexts/BulkScanContext';
import AttendanceResultModal from '@ui/attendance/AttendanceResultModal';
import { generateReferenceId } from '@utils/qrCode';
import { getTypeColor } from '@utils/sharedTypes';
// OLD: import { PARTICIPATION_TYPES, getParticipationColor } from '@constants/participationTypes.jsx';
// OLD: import { PENALTY_TYPES, getPenaltyColor } from '@constants/penaltyTypes.jsx';
// OLD: import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes.jsx';
// NOW: Using useLookupTypes hook for all lookup data
import { RECORD_TYPES } from '@utils/sharedTypes';
import {
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
  QR_SCANNER_ACTIONS
} from '@constants/qrScannerTypes';
import {
  QrCodeIcon,
  StopIcon,
  ZapIcon,
  DetailsIcon,
  MinimizeIcon,
  VibrationIcon,
  SoundIcon,
  UserInputIcon,
  RefreshIcon,
  DeleteIcon,
  PenaltyIcon,
  ParticipationIcon,
  CheckSmallIcon,
  ClockSmallIcon,
  XSmallIcon,
  CircleIcon,
  ChevronDownIcon,
  TrashIcon,
  HeartIcon,
  AlertCircleIcon,
  HelpCircleIcon
} from '@utils/icons.jsx';
import CameraView from './CameraView.jsx';
import QuickActionButtons from './QuickActionButtons.jsx';
import AttendanceActionButtons from './AttendanceActionButtons.jsx';
import ActivityList from './ActivityList.jsx';
import StudentScanDialog from './StudentScanDialog.jsx';
import ManualInputForm from './ManualInputForm.jsx';
import DebugPanel from './DebugPanel.jsx';
import { getAttendanceMethodLabel, shouldShowMethodLabel } from '@constants/attendanceMethods';
import { getThemedIcon } from '@constants/iconTypes';
import { useBilingualNotes } from '@hooks/useBilingualNotes.js';
import { FeatureFlagWrapper } from '@ui/FeatureFlagWrapper';
import { useFeatureFlags } from '@hooks/useFeatureFlags';
import { ROLE_STRINGS } from '@utils/userUtils';

export default function QRScanner({ onScan, classId, onActivityUpdate, onDeleteActivity, selectedProgramId, selectedSubjectId, selectedClassId, selectedDate, selectedProgramName, selectedSubjectName, selectedClassName, selectedProgramNameAr, selectedSubjectNameAr, selectedClassNameAr, loading = false, students = [], onMinimizeChange, forceMinimized = false, attendanceMode: propAttendanceMode }) {
  const auth = useAuth();
  const { user, role, isSuperAdmin } = auth;
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const { isEnabled, loading: featureLoading } = useFeatureFlags();
  const {
    canManualInput,
    canDeleteAttendance,
    canClearToday,
    canEditAttendance,
    canUseStatsPanel,
    canUseZapPanel,
    canSeeQuickButtons,
    canMarkAttendance,
    canBulkScan
  } = useQRPermissions();
  const { activityTypeOptions, loading: lookupLoading } = useLookupTypes();

  // Refs must be defined before early return (React Hooks rule)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Handle auth loading state to prevent white screen
  if (auth.loading || (!user && auth.hasProfile)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '2rem',
        background: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          {t('loading') || 'Loading...'}
        </p>
      </div>
    );
  }
  
  // Safe bilingual notes hook with fallback
  let bilingualNotes = null;
  try {
    bilingualNotes = useBilingualNotes();
  } catch (err) {
    console.warn('Bilingual notes hook not available, using fallback:', err);
    bilingualNotes = {
      getNote: (note) => String(note || ''),
      createNote: (noteEn, noteAr = null) => ({ 
        en: String(noteEn || ''), 
        ar: String(noteAr || noteEn || ''), 
        hasArabic: !!noteAr && noteAr !== noteEn 
      }),
      getTranslatedNote: (noteKey, customArabic = null) => String(customArabic || noteKey || ''),
    };
  }
  
  const { getNote, createNote, getTranslatedNote } = bilingualNotes || {};
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState(0);
  const [scanError, setScanError] = useState('');
  const [cameraMode, setCameraMode] = useState('environment'); // 'environment' for back camera, 'user' for front
  const [devices, setDevices] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugBox, setShowDebugBox] = useState(false);
  const [isScanningLocked, setIsScanningLocked] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(null); // Track last scanned code to prevent duplicates
  const [isMinimized, setIsMinimized] = useState(false); // Track minimization state
  const scannerRef = useRef(null); // Ref for the scanner section
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalData, setResultModalData] = useState({ type: '', message: '' });
  const [showStudentActionStatsPanel, setShowStudentActionStatsPanel] = useState(false);
  const [showStudentActionZapPanel, setShowStudentActionZapPanel] = useState(false);
  const [initialTab, setInitialTab] = useState(RECORD_TYPES.BEHAVIOR); // Track which tab to open
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForAction, setStudentForAction] = useState(null);
  const [todayAttendanceStatus, setTodayAttendanceStatus] = useState(null);
  const [attendanceMode, setAttendanceMode] = useState(propAttendanceMode || ATTENDANCE_TYPE_CATEGORY.REGULAR); // 'regular' or 'standup'

  // Sync local attendanceMode when prop changes (parent controls the mode toggle)
  useEffect(() => {
    if (propAttendanceMode && propAttendanceMode !== attendanceMode) {
      setAttendanceMode(propAttendanceMode);
    }
  }, [propAttendanceMode]);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false); // Start with false
  const [manualStudentId, setManualStudentId] = useState('');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearScope, setClearScope] = useState('today'); // 'today' or 'all'
  const [clearStandupModal, setClearStandupModal] = useState({ isOpen: false, loading: false });
  const [clearRegularModal, setClearRegularModal] = useState({ isOpen: false, loading: false, recordCount: 0 });
  const [showBulkScanDialog, setShowBulkScanDialog] = useState(false);
  const [bulkSuccessResult, setBulkSuccessResult] = useState(null);
  const [performedByFields, setPerformedByFields] = useState({
    performedBy: user?.uid || 'unknown',
    performedByName: 'Unknown User',
    performedByEmail: user?.email || 'unknown@example.com'
  });

  // Detect mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Fetch performed by fields when user is available
  useEffect(() => {
    const fetchPerformedByFields = async () => {
      if (user) {
        try {
          const fields = await getPerformedByFields(user);
          setPerformedByFields(fields);
        } catch (err) {
          console.error('🔍 QRScanner - Error fetching performedByFields:', err);
        }
      }
    };
    fetchPerformedByFields();
  }, [user]);

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err) {
        error('Error getting devices:', err);
      }
    };
    getDevices();
  }, []);

  // Debug logging function
  const addDebugLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      type,
      id: Date.now() + Math.random()
    };
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 50)); // Keep last 50 logs
    info(`[${timestamp}] ${message}`);
  }, []);

  // Show result modal function - Enhanced for attendance types
  const showResult = useCallback((type, message, attendanceStatus = null, isSummary = false) => {
    // If attendance status is provided, use its color and icon
    let finalType = type;
    let finalMessage = message;
    
    if (attendanceStatus && [
      ATTENDANCE_STATUS.PRESENT,
      ATTENDANCE_STATUS.LATE,
      ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
      ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE,
      ATTENDANCE_STATUS.EXCUSED_LEAVE,
      ATTENDANCE_STATUS.HUMAN_CASE,
      ATTENDANCE_STATUS.STANDUP_PRESENT,
      ATTENDANCE_STATUS.STANDUP_LATE,
      ATTENDANCE_STATUS.STANDUP_ABSENT,
      ATTENDANCE_STATUS.STANDUP_CLINIC
    ].includes(attendanceStatus)) {
      finalType = attendanceStatus;
      // Add attendance icon to message if not already present
      const icon = getAttendanceIcon(attendanceStatus);
      const label = getLocalizedAttendanceLabel(attendanceStatus, lang);
      if (typeof message === 'string' && !message.includes(label)) {
        finalMessage = `${label}: ${message}`;
      }
    }
    
    setResultModalData({ 
      type: finalType, 
      message: finalMessage, 
      isSummary,
      attendanceStatus // Store for icon/color rendering
    });
    setShowResultModal(true);
    addDebugLog(`📢 Showing result modal: ${finalType} - ${finalMessage}`, 'info');
  }, [addDebugLog, lang, t]);

  const handleQRCodeDetected = async (data) => {
    // Prevent infinite scanning - lock scanning for 3 seconds
    if (isScanningLocked) {
      addDebugLog('🔒 Scanning locked - ignoring duplicate scan', 'warning');
      return;
    }

    setIsScanningLocked(true);
    addDebugLog(`🔍 QR Code scanned: ${data}`, GENERAL_STATUS.SUCCESS);

    // Play success feedback
    playFeedbackSound(GENERAL_STATUS.SUCCESS);

    onScan(data);
    setRecentScans(prev => prev + 1);

    // Parse QR data to get student info
    let studentInfo = null;
    try {
      if (typeof data === 'string') {
        if (data.includes('/qr/student/')) {
          // URL format like https://localhost:5174/qr/student/12345 or any student number
          const urlParts = data.split('/qr/student/');
          if (urlParts.length > 1) {
            const studentId = urlParts[1].split('?')[0]; // Remove query params if any
            studentInfo = { studentNumber: studentId };
          }
        } else {
          // Direct student number or any text/number
          studentInfo = { studentNumber: data.trim() };
        }
      } else {
        studentInfo = data;
      }
    } catch (err) {
      addDebugLog(`❌ Error parsing QR data: ${err.message}`, 'error');
      playFeedbackSound('error'); // Add vibration for parsing error
      showError(t('invalid_qr_code_format'));
      setIsScanningLocked(false);
      return;
    }

    addDebugLog(`👤 Student info parsed: ${JSON.stringify(studentInfo)}`, 'info');
    addDebugLog(`🔍 Available students count: ${students.length}`, 'info');
    addDebugLog(`🔍 Selected program: ${selectedProgramId}, subject: ${selectedSubjectId}, class: ${selectedClassId}`, 'info');

    // If students array is empty, try to fetch from Firebase using multiple methods
    if (students.length === 0) {
      addDebugLog(`⚠️ Students array is empty, trying multiple Firebase lookups`, 'warning');

      let foundStudent = null;

      // Method 1: Try direct student number lookup
      try {
        const result = await getUserByStudentNumber(studentInfo.studentNumber);
        if (result.success && result.data && !isAdmin(result.data) && !isSuperAdmin(result.data)) {
          foundStudent = {
            id: result.data.id,
                        referenceId: result.data.referenceId,
            studentId: result.data.id || result.data.studentNumber,
            studentNumber: result.data.studentNumber || result.data.id,
            name: result.data.displayName || result.data.realName || result.data.name || 'Unknown',
            displayName: result.data.displayName,
            realName: result.data.realName,
            email: result.data.email,
            attendance: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
            participation: 0,
            behavior: 0,
            penalty: 0,
            totalAttendance: 0,
            attendanceStats: {
              present: 0,
              late: 0,
              absent_no_excuse: 0,
              absent_with_excuse: 0,
              excused_leave: 0
            },
            isPinned: result.data.isPinned || false
          };
          addDebugLog(`✅ Found student via direct lookup: ${foundStudent.name}`, 'success');
        }
      } catch (err) {
        addDebugLog(`❌ Direct lookup failed: ${err.message}`, 'error');
      }

      // Method 2: Try to find by studentNumber field (query all users)
      if (!foundStudent) {
        try {
          // Use getUsers to fetch all users and find by studentNumber
          const result = await getUsers();
          if (result.success) {
            const allUsers = result.data;
            addDebugLog(`🔍 Searching ${allUsers.length} users for matches`, 'info');

            // Show first few users for debugging
            allUsers.slice(0, 3).forEach((u, idx) => {
              addDebugLog(`User ${idx}: id=${u.id}, studentNumber=${u.studentNumber}, referenceId=${u.referenceId}, name=${u.displayName || u.name}`, 'info');
            });

            const student = allUsers.find(u => {
              const matches = [
                u.studentNumber === studentInfo.studentNumber,
                u.referenceId === studentInfo.studentNumber,
                `STU-${u.studentNumber}` === studentInfo.studentNumber,
                u.id && String(u.id) === studentInfo.studentNumber
              ];

              if (matches.some(Boolean)) {
                addDebugLog(`🎯 Found potential match: ${u.displayName || u.name || 'Unknown'}, studentNumber=${u.studentNumber}, id=${u.id}`, 'info');
              }

              return matches.some(Boolean);
            });

            if (student && !isAdmin(student) && !isSuperAdmin(student)) {
              foundStudent = {
                id: student.id,
                                referenceId: student.referenceId, // Include referenceId
                studentId: student.id || student.studentNumber,
                studentNumber: student.studentNumber || student.id,
                name: student.displayName || student.realName || student.name || 'Unknown',
                displayName: student.displayName,
                realName: student.realName,
                email: student.email,
                attendance: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
                participation: 0,
                behavior: 0,
                penalty: 0,
                totalAttendance: 0,
                attendanceStats: {
                  present: 0,
                  late: 0,
                  absent_no_excuse: 0,
                  absent_with_excuse: 0,
                  excused_leave: 0
                },
                isPinned: student.isPinned || false
              };
              addDebugLog(`✅ Found student via user search: ${foundStudent.name}`, 'success');
            }
          }
        } catch (err) {
          addDebugLog(`❌ User search failed: ${err.message}`, 'error');
        }
      }

      if (foundStudent) {
        setLastScannedStudent(foundStudent);
        setShowScanDialog(true);
        setIsScanningLocked(false);
        setLastScannedCode(null);
        stopCamera();
        return;
      } else {
        addDebugLog(`❌ Student not found: ${studentInfo.studentNumber}`, 'error');
        showResult('error', t('student_not_found'));
        setIsScanningLocked(false);
        setLastScannedCode(null);
        stopCamera();
        return;
      }
    }

    // Find student in the provided students array
    const student = students.find(s => {
      const studentId = s.studentId || s.id;
      const studentNumber = s.studentNumber;
      const referenceId = s.referenceId;
      
      return [
        studentId === studentInfo.studentNumber,
        studentNumber === studentInfo.studentNumber,
        referenceId === studentInfo.studentNumber,
        `STU-${studentNumber}` === studentInfo.studentNumber,
        String(s.id) === studentInfo.studentNumber // Database ID matching
      ].some(Boolean);
    });

    if (student) {
      addDebugLog(`✅ Found student: ${student.name || student.email}`, 'success');
      setLastScannedStudent(student);
      setShowScanDialog(true);
    } else {
      addDebugLog(`❌ Student not found: ${studentInfo.studentNumber}`, 'error');
      showResult('error', t('student_not_found'));
    }

    // Safety timeout to unlock scanning after 3 seconds
    setTimeout(() => {
      setIsScanningLocked(false);
      setLastScannedCode(null); // Reset to allow re-scanning
      addDebugLog('🔓 Scanning unlocked after timeout', 'info');
    }, 3000);

    // Stop camera after scan - user will manually restart
    stopCamera();
    setTimeout(() => {
      if (videoRef.current && canvasRef.current) {
        // Clear the video element to prevent black screen
        videoRef.current.srcObject = null;
      }
    }, 100);

    // Unlock scanning immediately for next manual scan
    setIsScanningLocked(false);
    addDebugLog('🔓 Scanning unlocked - ready for next manual scan', 'info');
  };

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // Add additional check to prevent multiple scans of the same code
        if (code.data !== lastScannedCode) {
          setLastScannedCode(code.data);
          handleQRCodeDetected(code.data);
        }
      }
    }
  }, [lastScannedCode, handleQRCodeDetected]);

  // Play feedback sound and vibration
  const playFeedbackSound = useCallback((type) => {
    try {
      // Vibration for both success and error
      if (vibrationEnabled && navigator.vibrate) {
        if (type === GENERAL_STATUS.SUCCESS) {
          // Short vibration for success
          navigator.vibrate(100);
        } else if (type === GENERAL_STATUS.ERROR) {
          // Longer vibration pattern for error
          navigator.vibrate([200, 100, 200]);
        }
      }

      // Sound feedback
      if (soundEnabled) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === GENERAL_STATUS.SUCCESS) {
          // Success sound: ascending tone
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === GENERAL_STATUS.ERROR) {
          // Error sound: descending tone
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
          oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.2); // A3
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }
      }

      // Don't show toast notification - using modal system instead
      // const message = type === GENERAL_STATUS.SUCCESS
      //   ? (t('qr_scan_success') || 'QR Code scanned successfully!')
      //   : (t('qr_scan_error') || 'QR Code scan failed. Please try again.');
      //
      // addToast(message, type);
    } catch (err) {
      warn('Could not play feedback sound:', err);
    }
  }, [soundEnabled, vibrationEnabled]);

  const startCamera = useCallback(async () => {
    // Check if all required fields are selected before starting camera
    if (!selectedProgramId || !selectedSubjectId || !selectedClassId) {
      showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
      addDebugLog('❌ Cannot start camera: Missing required selections', 'error');
      return;
    }

    try {
      setScanError('');
      setIsScanning(true);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t('attendance.camera_api_not_available'));
      }
      
      // Request camera access with appropriate constraints
      const constraints = getCameraConstraints(isMobile, cameraMode);

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (permissionError) {
        // Handle specific permission errors using centralized error handling
        const errorMessage = getCameraErrorMessage(permissionError, t);

        // Play error feedback
        playFeedbackSound('error');
        throw new Error(errorMessage);
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning for QR codes
      scanIntervalRef.current = setInterval(scanQRCode, 100);
    } catch (err) {
      error('Error accessing camera:', err);
      setScanError(err.message || t('attendance.unable_to_access_camera'));
      setIsScanning(false);
      // Play error feedback for camera errors
      playFeedbackSound('error');
    }
  }, [selectedProgramId, selectedSubjectId, selectedClassId, showResult, t, addDebugLog, cameraMode, isMobile, playFeedbackSound, scanQRCode]);

  const stopCamera = useCallback(() => {
    setIsScanning(false);

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    addDebugLog('🛑 Camera stopped and cleaned up', 'info');
  }, [addDebugLog]);


  const toggleCamera = useCallback(() => {
    if (isScanning) {
      stopCamera();
    } else {
      // In standup mode, only require Program selection
      // In regular mode, require Program, Subject, and Class
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        if (!selectedProgramId || selectedProgramId === 'all') {
          showResult('error', t('please_select_program') || 'Please select Program before scanning');
          return;
        }
      } else {
        if (!selectedProgramId || selectedProgramId === 'all' ||
            !selectedSubjectId || selectedSubjectId === 'all' ||
            !selectedClassId || selectedClassId === 'all') {
          showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
          return;
        }
      }

      startCamera();
    }
  }, [selectedProgramId, selectedSubjectId, selectedClassId, t, isScanning, showResult, startCamera, stopCamera, attendanceMode]);

  const handleManualSubmit = useCallback(() => {
    if (!manualStudentId.trim()) return;

    // In standup mode, only require Program selection
    // In regular mode, require Program, Subject, and Class
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      if (!selectedProgramId || selectedProgramId === 'all') {
        showResult('error', t('please_select_program') || 'Please select Program before scanning');
        addDebugLog('❌ Cannot scan manually: Missing program selection', 'error');
        return;
      }
    } else {
      if (!selectedProgramId || !selectedSubjectId || !selectedClassId) {
        showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
        addDebugLog('❌ Cannot scan manually: Missing required selections', 'error');
        return;
      }
    }

    const studentInfo = { studentNumber: manualStudentId.trim() };

    // Try to find the full student object using the student number
    debug('Manual student input lookup:', {
      studentNumber: manualStudentId.trim(),
      totalStudents: students.length,
      studentsSample: students.slice(0, 3).map(s => ({
        id: s.id,
        studentId: s.studentId,
        referenceId: s.referenceId,
        studentNumber: s.studentNumber,
        displayName: s.displayName,
        name: s.name
      }))
    });

    let fullStudent = students.find(s => {
      const matches = [
        s.studentNumber === manualStudentId.trim(),
        s.referenceId === manualStudentId.trim(),
        s.studentId === manualStudentId.trim(),
        `STU-${s.studentNumber}` === manualStudentId.trim(), // Backward compatibility
        String(s.id) === manualStudentId.trim() // Database ID matching
      ];

      if (matches.some(Boolean)) {
        debug('Manual student match found:', {
          searchingFor: manualStudentId.trim(),
          found: {
            id: s.id,
            studentId: s.studentId,
            referenceId: s.referenceId,
            studentNumber: s.studentNumber,
            matches: matches
          }
        });
      }

      return matches.some(Boolean);
    });

    if (fullStudent) {
      debug('Manual student match found:', {
        studentNumber: manualStudentId.trim(),
        fullStudent: {
          id: fullStudent.id,
          studentNumber: fullStudent.studentNumber,
          displayName: fullStudent.displayName,
          name: fullStudent.name
        }
      });
      // Make sure we include all necessary fields
      setLastScannedStudent({
        ...fullStudent,
        // Ensure we have these fields from the full student record
        name: fullStudent.name || fullStudent.displayName,
        email: fullStudent.email,
        studentNumber: fullStudent.studentNumber
      });
      setShowScanDialog(true);
      setShowManualInput(false);
      setManualStudentId('');
      addDebugLog(`📝 Manual student ID entered: ${manualStudentId.trim()}`, 'info');
      playFeedbackSound(GENERAL_STATUS.SUCCESS);
    } else {
      // Student not found - show error message
      showResult('error', t('student_not_found'));
      addDebugLog(`❌ Student not found: ${manualStudentId.trim()}`, 'error');
      playFeedbackSound(GENERAL_STATUS.ERROR);
    }
  }, [manualStudentId, selectedProgramId, selectedSubjectId, selectedClassId, t, addDebugLog, playFeedbackSound, students, showResult, attendanceMode]);

  const findStudentData = useCallback(async (referenceId) => {
    try {
      const result = await getUsers();
      const students = result.success ? result.data : [];
      const student = students.find(s =>
          s.referenceId === referenceId &&
          isStudent(s) // Only match students exactly
      );
      return student;
    } catch (err) {
      addDebugLog(`❌ Error finding student data: ${err.message}`, 'error');
      return null;
    }
  }, [addDebugLog]);

  const checkTodayAttendanceStatus = useCallback(async (studentId) => {
    try {
      const attendanceResult = await getTodayAttendanceStatus(classId, studentId);

      if (attendanceResult.success && attendanceResult.data) {
        const data = attendanceResult.data;
        return data.status; // 'present', 'late', or null
      }
      return null;
    } catch (err) {
      addDebugLog(`❌ Error checking attendance status: ${err.message}`, 'error');
      return null;
    }
  }, [classId, addDebugLog]);

  const processStudentData = useCallback(async (referenceId) => {
    try {
      const studentData = await findStudentData(referenceId);

      // Check attendance status using the student's actual ID
      let attendanceStatus = null;
      if (studentData) {
        attendanceStatus = await checkTodayAttendanceStatus(studentData.id);
        // Update studentData with actual attendance status
        if (attendanceStatus) {
          studentData.attendance = attendanceStatus;
        }

        const sid = studentData.id;

        const [penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
          getPenalties(sid),
          getParticipations(),
          getBehaviors()
        ]);

        const studentPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
        const studentParticipations = (participationsResponse.success ? participationsResponse.data : []).filter(p => p.studentId === sid);
        const studentBehaviors = (behaviorsResponse.success ? behaviorsResponse.data : []).filter(b => b.studentId === sid);

        const participationCount = studentParticipations.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
        const behaviorCount = studentBehaviors.reduce((sum, b) => sum + Math.abs(Number(b.points) || 0), 0);
        const penaltyCount = studentPenalties.reduce((sum, p) => sum + Math.abs(Number(p.points) || 0), 0);

        studentData.participation = participationCount;
        studentData.behavior = behaviorCount;
        studentData.penalty = penaltyCount;

        addDebugLog(`📊 Student activity counts (all time): participation=${participationCount}, behavior=${behaviorCount}, penalty=${penaltyCount}`, 'info');
      }

      setTodayAttendanceStatus(attendanceStatus);
      return studentData;
    } catch (err) {
      addDebugLog(`❌ Error processing student data: ${err.message}`, 'error');
      setTodayAttendanceStatus(null);
      return null;
    }
  }, [findStudentData, checkTodayAttendanceStatus, addDebugLog]);

  // Handle behavior/participation submission
  const handleBehaviorSubmit = useCallback(async (studentId, actions, note) => {
    info('🔧 handleBehaviorSubmit called with:', { studentId, actions, note });

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get performedBy fields using shared service
      const performedByFields = await getPerformedByFields(user);

      // Get student information for proper naming
      const studentData = await findStudentData(studentId);
      const studentInfo = studentData ? {
        name: studentData.name || studentData.displayName || 'Unknown',
        email: studentData.email,
        studentId: studentData.studentId,
        referenceId: studentData.referenceId
      } : null;

      for (const action of actions) {
        if (action.category === RECORD_TYPES.BEHAVIOR) {
          const behaviorTypeId = action.id || action.type;
          if (!behaviorTypeId || behaviorTypeId === RECORD_TYPES.BEHAVIOR) {
            error('🔧 Invalid behavior type detected:', { action });
            throw new Error('Invalid behavior type: must be a specific behavior type');
          }

          await createBehavior({
            classId: selectedClassId,
            studentId,
            subjectId: selectedSubjectId,
            type: behaviorTypeId,
            points: action.points,
            description: (createNote && getTranslatedNote) 
              ? createNote(note || '', note ? getTranslatedNote(note) : null)
              : (note || ''),
            createdBy: user.uid,
            ...performedByFields,
            date: today,
            studentInfo,
            className: selectedClassName || ''
          });
        } else if (action.category === RECORD_TYPES.PARTICIPATION) {
          const participationTypeId = action.id || action.type;
          if (!participationTypeId || participationTypeId === RECORD_TYPES.PARTICIPATION) {
            error('🔧 Invalid participation type detected:', { action });
            throw new Error('Invalid participation type: must be a specific participation type');
          }

          await createParticipation({
            classId: selectedClassId,
            studentId,
            subjectId: selectedSubjectId,
            type: participationTypeId,
            points: action.points,
            description: (createNote && getTranslatedNote) 
              ? createNote(note || '', note ? getTranslatedNote(note) : null)
              : (note || ''),
            createdBy: user.uid,
            ...performedByFields,
            date: today,
            studentInfo,
            className: selectedClassName || ''
          });
        }
      }

      // Emit events for real-time updates
      actions.forEach(action => {
        if (action.category === RECORD_TYPES.PARTICIPATION) {
          eventBus.emit(EVENTS.PARTICIPATION_ADDED, {
            studentId,
            classId: selectedClassId,
            status: 'added',
            performedBy: user,
            timestamp: new Date()
          });
        } else if (action.category === RECORD_TYPES.BEHAVIOR) {
          eventBus.emit(EVENTS.BEHAVIOR_LOGGED, {
            studentId,
            classId: selectedClassId,
            status: 'logged',
            performedBy: user,
            timestamp: new Date()
          });
        }
      });

      // Success message is handled by StudentActionZapPanel
    } catch (err) {
      error('Error submitting behavior/participation:', err);
      showError('Failed to record actions');
    }
  }, [selectedClassId, selectedSubjectId, selectedClassName, user, findStudentData, showError]);

  // Handle penalty submission
  const handlePenaltySubmit = useCallback(async (studentId, penalties, note) => {
    info('🔧 handlePenaltySubmit called with:', { studentId, penalties, note });

    try {
      // Get performedBy fields using shared service
      const performedByFields = await getPerformedByFields(user);
      
      // Process each penalty
      for (const penalty of penalties) {
        info('🔧 Processing penalty:', penalty);
        info('🔧 penalty.id:', penalty.id);
        info('🔧 penalty.type:', penalty.type);

        const today = new Date().toISOString().split('T')[0];

        // Ensure we always use the correct penalty type ID
        const penaltyTypeId = penalty.id || penalty.type;
        info('🔧 penaltyTypeId extracted:', penaltyTypeId);
        info('🔧 penalty object:', JSON.stringify(penalty, null, 2));

        if (!penaltyTypeId || penaltyTypeId === RECORD_TYPES.PENALTY) {
          error('🔧 Invalid penalty type detected:', { penalty, penaltyTypeId });
          throw new Error('Invalid penalty type: must be a specific penalty type like "cheating", not "penalty"');
        }

        info('🔧 About to create penalty with type:', penaltyTypeId);

        await createPenalty({
          classId: selectedClassId,
          studentId,
          subjectId: selectedSubjectId,
          type: penaltyTypeId, // Always use the specific penalty type ID
          points: -Math.abs(penalty.points || 0), // Always negative for penalties
          reason: (createNote && getTranslatedNote) 
            ? createNote(note || '', note ? getTranslatedNote(note) : null)
            : (note || ''),
          note: (createNote && getTranslatedNote) 
            ? createNote(note || '', note ? getTranslatedNote(note) : null)
            : (note || ''),
          description: (createNote && getTranslatedNote) 
            ? createNote(note || '', note ? getTranslatedNote(note) : null)
            : (note || ''), // Add description field to match behavior pattern
          createdBy: user.uid,
          ...performedByFields,
          date: today,
          studentInfo: await findStudentData(studentId),
          className: selectedClassName || ''
        });

        info('🔧 Penalty saved successfully');
      }

      // Emit events for real-time updates
      penalties.forEach(penalty => {
        eventBus.emit(EVENTS.PENALTY_ASSIGNED, {
          studentId,
          classId: selectedClassId,
          status: 'penalty_assigned',
          performedBy: user,
          timestamp: new Date()
        });
      });

      // Success message is handled by StudentActionZapPanel
    } catch (err) {
      error('Error submitting penalty:', err);
      showError('Failed to record penalty');
    }
  }, [selectedClassId, selectedSubjectId, user, findStudentData, selectedClassName, showError]);

  const switchCameraMode = () => {
    const newMode = cameraMode === 'environment' ? 'user' : 'environment';
    setCameraMode(newMode);

    if (isScanning) {
      stopCamera();
      setTimeout(() => {
        setCameraMode(newMode);
        startCamera();
      }, 100);
    }
  };

  // Fetch real activity data
  const toggleActivityExpansion = (activityId) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  // Memoized fetchRecentActivity for performance
  const fetchRecentActivity = useCallback(async () => {
    // In standup mode, require programId; in regular mode, require classId
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      if (!selectedProgramId || selectedProgramId === 'all') return;
    } else {
      if (!classId) return;
    }

    // Get the latest students state at the time of execution
    const currentStudents = students;

    // Early return if no students available
    if (currentStudents.length === 0) {
      setRecentActivity([]);
      setActivityLoading(false);
      return;
    }

    setActivityLoading(true);
    try {
      // Small delay to ensure Firestore has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use selectedDate (YYYY-MM-DD) for activity queries, fallback to today
      const activityDate = (typeof selectedDate === 'string' && selectedDate) 
        ? selectedDate 
        : (() => {
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          })();

      // Get attendance records based on date filter and mode
      let attendanceRecords = [];
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // In standup mode, fetch from standup attendance table for the program using single efficient API call
        if (selectedProgramId && selectedProgramId !== 'all') {
          const attendanceResponse = await getStandupAttendanceByProgramAndDate(selectedProgramId, activityDate);
          if (attendanceResponse.success && attendanceResponse.data) {
            attendanceRecords = attendanceResponse.data.map(r => ({ ...r, category: RECORD_TYPES.ATTENDANCE }));
          }
        }
      } else {
        // In regular mode, fetch from regular attendance table for the class
        const attendanceResponse = await getAttendanceByClass(classId, { date: activityDate });
        attendanceRecords = attendanceResponse.success ? attendanceResponse.data.filter(r => {
          if (!r.status) return false;
          // Filter out standup attendance entries in regular mode
          const statusCode = typeof r.status === 'object' ? r.status?.code : r.status;
          if (statusCode && String(statusCode).toUpperCase().startsWith('STANDUP_')) return false;
          return true;
        }).map(r => ({ ...r, category: RECORD_TYPES.ATTENDANCE })) : [];
      }

      // Get penalties, participations, behaviors for the selected date
      // In standup mode, classId may be null — skip class-based queries
      let penaltyRecords = [];
      let participationRecords = [];
      let behaviorRecords = [];

      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // In standup mode, fetch all and filter by student IDs from currentStudents
        const studentIdSet = new Set(currentStudents.map(s => s.id));
        const [penaltiesRes, participationsRes, behaviorsRes] = await Promise.all([
          getPenaltiesByClassAndDate(null, activityDate),
          getParticipationsByClassAndDate(null, activityDate),
          getBehaviorsByClassAndDate(null, activityDate)
        ]);
        penaltyRecords = (penaltiesRes.success && penaltiesRes.data ? penaltiesRes.data : [])
          .filter(p => studentIdSet.has(p.studentId))
          .map(p => ({ ...p, category: RECORD_TYPES.PENALTY }));
        participationRecords = (participationsRes.success && participationsRes.data ? participationsRes.data : [])
          .filter(p => studentIdSet.has(p.studentId))
          .map(p => ({ ...p, category: RECORD_TYPES.PARTICIPATION }));
        behaviorRecords = (behaviorsRes.success && behaviorsRes.data ? behaviorsRes.data : [])
          .filter(b => studentIdSet.has(b.studentId))
          .map(b => ({ ...b, category: RECORD_TYPES.BEHAVIOR }));
      } else {
        // In regular mode, use classId-based queries
        const [penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
          getPenaltiesByClassAndDate(classId, activityDate),
          getParticipationsByClassAndDate(classId, activityDate),
          getBehaviorsByClassAndDate(classId, activityDate)
        ]);
        penaltyRecords = penaltiesResponse.success && penaltiesResponse.data ? penaltiesResponse.data.map(p => ({ ...p, category: RECORD_TYPES.PENALTY })) : [];
        participationRecords = participationsResponse.success && participationsResponse.data ? participationsResponse.data.map(p => ({ ...p, category: RECORD_TYPES.PARTICIPATION })) : [];
        behaviorRecords = behaviorsResponse.success && behaviorsResponse.data ? behaviorsResponse.data.map(b => ({ ...b, category: RECORD_TYPES.BEHAVIOR })) : [];
      }

      debug('[QR Scanner] Attendance records fetched:', attendanceRecords.length);
      const allRecords = [...attendanceRecords, ...penaltyRecords, ...participationRecords, ...behaviorRecords];
      debug('[QR Scanner] Activity refresh found:', allRecords.length, 'total records');

      // Create student map for efficient lookup
      const studentMap = {};
      const studentMapEn = {};
      const studentMapAr = {};
      info('Creating student map from', currentStudents.length, 'students');

      // Only create student map if we have students
      if (currentStudents.length === 0) {
        info('No students available for mapping - returning empty activity');
        setRecentActivity([]);
        setActivityLoading(false);
        return;
      }

      // Add a small delay to ensure students are fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      const unknownStudentLabel = t('unknown_student');

      currentStudents.forEach((student) => {
        const studentId = student.id;
        studentMapEn[studentId] = getLocalizedUserName(student, 'en', unknownStudentLabel);
        studentMapAr[studentId] = getLocalizedUserName(student, 'ar', studentMapEn[studentId]);
        studentMap[studentId] = lang === 'ar' ? studentMapAr[studentId] : studentMapEn[studentId];
      });

      info('QRScanner student map created:', currentStudents.length, 'students');

      // Combine and format activity logs
      debug('[QR Scanner] Processing', allRecords.length, 'total records');

      const activityLogs = allRecords.map((record, index) => {
        const studentId = record.userId || record.studentId;
        let studentName;
        let studentNameEn;
        let studentNameAr;
        const resolveStudentNames = (student) => {
          if (!student) return;
          studentNameEn = getLocalizedUserName(student, 'en', unknownStudentLabel);
          studentNameAr = getLocalizedUserName(student, 'ar', studentNameEn);
          studentName = lang === 'ar' ? studentNameAr : studentNameEn;
        };
        
        if (record.type === RECORD_TYPES.PENALTY || record.category === RECORD_TYPES.PENALTY || record.category === RECORD_TYPES.BEHAVIOR || record.category === RECORD_TYPES.PARTICIPATION) {
          const foundStudent = students.find(s => s.id === studentId);
          if (foundStudent) {
            resolveStudentNames(foundStudent);
          } else {
            const foundStudentByNumber = students.find(s => 
              s.studentNumber && record.studentNumber && s.studentNumber === record.studentNumber
            );
            if (foundStudentByNumber) {
              resolveStudentNames(foundStudentByNumber);
            } else {
              studentName = unknownStudentLabel;
              studentNameEn = unknownStudentLabel;
              studentNameAr = unknownStudentLabel;
            }
          }
          
          debug('[QR Scanner] Processing penalty/behavior record with database ID mapping:', studentId, '->', studentName);
        } else {
          studentName = studentMap[studentId];
          if (studentName) {
            studentNameEn = studentMapEn[studentId] || studentName;
            studentNameAr = studentMapAr[studentId] || studentNameEn;
          }
        }

        if (!studentName && students.length > 0) {
          const foundStudent = students.find(s => s.id === studentId);
          if (foundStudent) {
            resolveStudentNames(foundStudent);
          }
        }

        if (record.type === RECORD_TYPES.PENALTY || record.category === RECORD_TYPES.PENALTY || record.category === RECORD_TYPES.BEHAVIOR) {
          debug('[QR Scanner] Processing cheating record:', record.id, 'for student:', studentName);
        }

        if (!studentName) {
          studentName = unknownStudentLabel;
          studentNameEn = studentNameEn || unknownStudentLabel;
          studentNameAr = studentNameAr || unknownStudentLabel;
        }

        const recordPointsRaw = record.delta !== undefined && record.delta !== null ? record.delta : (record.points !== undefined && record.points !== null ? record.points : 0);
        const recordPoints = (record.category === RECORD_TYPES.PENALTY || record.penaltyType)
            ? -Math.abs(Number(recordPointsRaw) || 0)
            : (record.category === RECORD_TYPES.BEHAVIOR)
                ? -Math.abs(Number(recordPointsRaw) || 0)
                : Number(recordPointsRaw) || 0;

        debug('[QR Scanner] Processing record:', index, 'student:', studentName, 'type:', record.category, 'points:', recordPoints);

        const activityLabel = getNote 
      ? getNote(record.notes || record.note || record.reason || record.description) || record.type || ''
      : (record.notes || record.note || record.reason || record.description || record.type || '');

        // Resolve human-readable label per type
        let finalLabel = activityLabel;

        if (record.category === RECORD_TYPES.PENALTY) {
          const penaltyId = record.type;
          const penaltyDef = (activityTypeOptions['penalty-types'] || []).find(pt => pt.id === penaltyId);
          finalLabel = penaltyDef
              ? (lang === 'ar' ? (penaltyDef.nameAr || penaltyDef.nameEn) : penaltyDef.nameEn)
              : penaltyId
              || activityLabel
              || 'Penalty';
        } else if (record.category === RECORD_TYPES.PARTICIPATION) {
          const participationDef = (activityTypeOptions['participation-types'] || []).find(pt => pt.id === record.type);
          finalLabel = (participationDef ? (lang === 'ar' ? (participationDef.nameAr || participationDef.nameEn) : participationDef.nameEn) : null)
              || record.type
              || activityLabel
              || 'Participation';
        } else if (record.category === RECORD_TYPES.BEHAVIOR) {
          const behaviorDef = (activityTypeOptions['behavior-types'] || []).find(bt => bt.id === record.type);
          finalLabel = (behaviorDef ? (lang === 'ar' ? (behaviorDef.nameAr || behaviorDef.nameEn) : behaviorDef.nameEn) : null)
              || record.type
              || activityLabel
              || 'Behavior';
        } else if (record.status) {
          // For attendance records, check if we should show method label instead of notes
          const statusCode = getStatusCodeFromRecord(record);
          if (record.method && shouldShowMethodLabel(record.method, activityLabel)) {
            // Use localized method label instead of notes
            finalLabel = getAttendanceMethodLabel(record.method, t, lang) || getLocalizedAttendanceLabel(statusCode, lang) || statusCode || 'Attendance';
          } else {
            // Use original attendance status label
            finalLabel = getLocalizedAttendanceLabel(statusCode, lang) || statusCode || 'Attendance';
          }
        }

        const computedType = (record.category === RECORD_TYPES.PENALTY || record.penaltyType)
            ? RECORD_TYPES.PENALTY
            : (record.category || (record.status ? RECORD_TYPES.ATTENDANCE : (recordPoints > 0 ? RECORD_TYPES.PARTICIPATION : (recordPoints < 0 ? RECORD_TYPES.BEHAVIOR : RECORD_TYPES.ATTENDANCE))));

        // Create truly unique ID for UI rendering to prevent expansion conflicts
        // Use record.id if available, otherwise create composite unique ID
        const uniqueActivityId = record.id || 
          `${record.studentId || 'unknown'}-${record.type || 'unknown'}-${record.date || 'unknown'}-${record.timestamp || Date.now()}-${Math.random()}`;
        
        const finalActivityLog = {
          id: uniqueActivityId,
          recordId: record.id, // Preserve original record ID for deduplication
          time: record.createdAt || record.updatedAt || record.timestamp,
          type: computedType,
          studentId,
          studentName,
          studentNameEn,
          studentNameAr,
          status: getStatusCodeFromRecord(record) || null,
          delta: recordPoints,
          points: recordPoints,
          label: finalLabel,
          method: record.method || ATTENDANCE_METHODS.QR_SCAN,
          performedBy: record.creator?.id || record.performedBy || user?.uid || '-',
          performedByName: record.creator
            ? getLocalizedUserName(record.creator, lang, record.creator.displayName || record.performedByName || user?.displayName || '')
            : (record.performedByName || user?.displayName || ''),
          creator: record.creator || null,
          performedByEmail: record.creator?.email || record.performedByEmail || user?.email || '',
          scanMethod: record.scanMethod || (record.method === ATTENDANCE_METHODS.QR_SCAN ? 'auto' : ATTENDANCE_METHODS.MANUAL_INSTRUCTOR),
          subject: selectedSubjectName,
          subjectAr: selectedSubjectNameAr,
          program: selectedProgramName,
          programAr: selectedProgramNameAr,
          class: selectedClassName,
          classAr: selectedClassNameAr,
          comment: (() => {
            const noteContent = record.notes || record.note || record.reason || record.description || '';
            // Check if it's a note constant (uppercase with underscores)
            if (/^[A-Z_]+$/.test(noteContent)) {
              return getLocalizedNoteText(noteContent, t) || noteContent;
            }
            // Otherwise use bilingual notes hook if available
            return getNote ? getNote(noteContent) || noteContent : noteContent;
          })(),
          // Preserve original types for color determination
          originalType: record.type,
          penaltyType: record.penaltyType || record.type,
          behaviorType: record.behaviorType || record.type,
          actionType: record.category
        };

        return finalActivityLog;
      }).sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA; // Descending order (newest first)
      }).slice(0, 15);

      // Remove duplicate records
      const uniqueLogs = [];
      const seen = new Set();
      const recordIdsSeen = new Set();
      
      activityLogs.forEach((log, index) => {
        let uniqueKey;
        if (log.recordId) {
          uniqueKey = `record-${log.recordId}`;
        } else if (log.type === RECORD_TYPES.ATTENDANCE) {
          uniqueKey = `${log.studentId}-${log.type}`;
        } else {
          uniqueKey = `${log.studentId}-${log.type}-${log.time}`;
        }
        
        // Check for duplicate record IDs
        if (log.recordId && recordIdsSeen.has(log.recordId)) {
          debug('[QR Scanner] Skipping duplicate record:', log.recordId);
          return;
        } else if (log.recordId) {
          recordIdsSeen.add(log.recordId);
        }
        
        // Add to unique logs if not seen before
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          uniqueLogs.push(log);
        }
      });
      
      debug('[QR Scanner] Deduplication complete:', uniqueLogs.length, 'unique logs from', activityLogs.length, 'original');

      // Sort by time (newest first)
      uniqueLogs.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA; // Descending order (newest first)
      });

      debug('[QR Scanner] Final unique logs:', uniqueLogs.length);

      // Keep raw timestamps — ActivityList.formatActivityTime handles display formatting
      setRecentActivity(uniqueLogs);
    } catch (err) {
      error('Error fetching recent activity:', err);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [classId, students, user, selectedProgramName, selectedSubjectName, selectedClassName, lang, t, attendanceMode, selectedProgramId, selectedDate]);

  // Memoized helper functions for activity display - defined outside map for performance
  const getScanMethodDisplay = useCallback((scanMethod) => {
    switch(scanMethod) {
      case 'auto':
        return {
          icon: '',
          text: lang === 'ar' ? 'مسح QR' : 'QR Scan',
          color: '#10b981'
        };
      case ATTENDANCE_METHODS.MANUAL_INSTRUCTOR:
        return {
          icon: '',
          text: lang === 'ar' ? 'يدوي' : 'Manual',
          color: '#3b82f6'
        };
      case 'manual_hr':
        return {
          icon: '',
          text: lang === 'ar' ? 'يدوي (موارد بشرية)' : 'Manual (HR)',
          color: '#8b5cf6'
        };
      case 'manual_student':
        return {
          icon: '',
          text: lang === 'ar' ? 'يدوي (طالب)' : 'Manual (Student)',
          color: '#f59e0b'
        };
      default:
        return {
          icon: '',
          text: lang === 'ar' ? 'يدوي' : 'Manual',
          color: '#6b7280'
        };
    }
  }, [lang]);

  const getStatusColor = useCallback((status, type, delta, penaltyType, behaviorType) => {
    // Use specific color functions for penalties and behaviors
    if (type === RECORD_TYPES.PENALTY && penaltyType) {
      return getTypeColor('penalty', penaltyType);
    }
    
    if (type === RECORD_TYPES.BEHAVIOR && behaviorType) {
      return getTypeColor('behavior', behaviorType);
    }
    
    if (type === RECORD_TYPES.PARTICIPATION) {
      return '#3b82f6'; // Blue for participation
    }
    
    // Use centralized type color system for other record types
    if (type) {
      const typeColor = getTypeColor('record', type);
      if (typeColor && typeColor !== '#6b7280') {
        return typeColor;
      }
    }
    
    // Fallback for delta-based logic
    if (delta > 0) {
      return '#3b82f6'; // Positive changes
    }
    if (delta < 0) {
      return '#f97316'; // Negative changes
    }

    // Use centralized attendance color system (same as roster)
    return getAttendanceColor(status);
  }, []);

  const getStatusIcon = useCallback((status, type, delta) => {
    // Use white icons with colored circle backgrounds for participation, behavior, and penalty
    if (type === RECORD_TYPES.PARTICIPATION || delta > 0) {
      return <div style={{ backgroundColor: '#3b82f6', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ParticipationIcon style={{ width: '12px', height: '12px', color: '#ffffff' }} /></div>;
    }
    if (type === RECORD_TYPES.PENALTY) {
      return <div style={{ backgroundColor: '#f97316', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PenaltyIcon style={{ width: '12px', height: '12px', color: '#ffffff' }} /></div>;
    }
    if (type === RECORD_TYPES.BEHAVIOR || delta < 0) {
      return <div style={{ backgroundColor: '#f97316', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZapIcon style={{ width: '12px', height: '12px', color: '#ffffff' }} /></div>;
    }

    // Use unified attendance icons for attendance types
    if (type === RECORD_TYPES.ATTENDANCE || status) {
      const statusValue = status?.code || status;
      const iconName = getAttendanceIcon(statusValue);
      const statusColor = getAttendanceColor(statusValue);
      console.log('🔍 QRScanner - Icon Mapping:', { type, status, statusValue, statusType: typeof status, iconName, statusColor, statusKeys: Object.keys(status || {}) });
      
      const iconMap = {
        CheckCircle: <div style={{ backgroundColor: statusColor, borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckSmallIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} /></div>,
        Clock: <div style={{ backgroundColor: statusColor, borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClockSmallIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} /></div>,
        AlertCircle: <div style={{ backgroundColor: statusColor, borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircleIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} /></div>,
        XCircle: <div style={{ backgroundColor: statusColor, borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XSmallIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} /></div>,
        Heart: <div style={{ backgroundColor: statusColor, borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HeartIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} /></div>,
        Star: <div style={{ backgroundColor: statusColor, borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getThemedIcon('ui', 'star', 16, '#ffffff')}</div>,
        HelpCircle: <div style={{ backgroundColor: statusColor, borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HelpCircleIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} /></div>
      };
      
      const selectedIcon = iconMap[iconName] || iconMap.HelpCircle;
      console.log('🔍 QRScanner - Selected Icon:', { iconName, hasIcon: !!iconMap[iconName], fallback: !iconMap[iconName] });
      return selectedIcon;
    }

    // Fallback for unknown types
    return <CircleIcon style={{ width: '12px', height: '12px' }} />;
  }, []);

  const getStatusLabel = useCallback((status, type, delta) => {
    // Show only icons for behavior and participation to save space
    if (type === RECORD_TYPES.PARTICIPATION || delta > 0) return '';
    if (type === RECORD_TYPES.BEHAVIOR || delta < 0) return '';

    // For penalties, show the label if available
    if (type === RECORD_TYPES.PENALTY) return status || '';

    // Hide labels for all attendance types in Today grid - show only icons
    if (type === RECORD_TYPES.ATTENDANCE) return '';

    // Fallback for any other types
    return '';
  }, []);

  // Listen for real-time activity updates - optimized with useCallback
  useEffect(() => {
    const unsubscribeActivity = eventBus.on(EVENTS.ACTIVITY_UPDATE, fetchRecentActivity);
    const unsubscribeAttendance = eventBus.on(EVENTS.ATTENDANCE_MARKED, fetchRecentActivity);
    const unsubscribeBehavior = eventBus.on(EVENTS.BEHAVIOR_LOGGED, fetchRecentActivity);
    const unsubscribeParticipation = eventBus.on(EVENTS.PARTICIPATION_ADDED, fetchRecentActivity);
    const unsubscribePenalty = eventBus.on(EVENTS.PENALTY_ASSIGNED, fetchRecentActivity);
    
    // Add refresh event listeners
    const unsubscribeRefreshRecent = eventBus.on(EVENTS.REFRESH_RECENT_ACTIVITY, fetchRecentActivity);
    const unsubscribeRefreshToday = eventBus.on(EVENTS.REFRESH_TODAY_ACTIVITY, fetchRecentActivity);

    return () => {
      unsubscribeActivity();
      unsubscribeAttendance();
      unsubscribeBehavior();
      unsubscribeParticipation();
      unsubscribePenalty();
      unsubscribeRefreshRecent();
      unsubscribeRefreshToday();
    };
  }, [fetchRecentActivity]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onActivityUpdate) {
      onActivityUpdate(fetchRecentActivity);
    }
  }, [onActivityUpdate, fetchRecentActivity]);

  // Handle attendance marking
  const handleMarkAttendance = useCallback(async (studentIdOrStatus, statusOrNotes, notes, programId, subjectId) => {
    // Check if this is called from scan dialog (status, notes) or from elsewhere (studentId, status, programId, subjectId)
    const isFromScanDialog = typeof studentIdOrStatus === 'string' &&
                             [
                               ATTENDANCE_STATUS.PRESENT,
                               ATTENDANCE_STATUS.LATE,
                               ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
                               ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE,
                               ATTENDANCE_STATUS.EXCUSED_LEAVE,
                               ATTENDANCE_STATUS.HUMAN_CASE,
                               ATTENDANCE_STATUS.STANDUP_PRESENT,
                               ATTENDANCE_STATUS.STANDUP_LATE,
                               ATTENDANCE_STATUS.STANDUP_ABSENT,
                               ATTENDANCE_STATUS.STANDUP_CLINIC
                             ].includes(studentIdOrStatus);

    if (isFromScanDialog) {
      // Called from scan dialog: handleMarkAttendance(status, notes)
      const status = studentIdOrStatus;
      const scanNotes = statusOrNotes;

      setActionLoading(true);
      setCurrentAction(status);

      try {
        // Use selectedDate if available, otherwise default to today
        const dateStr = (typeof selectedDate === 'string' && selectedDate) 
          ? selectedDate 
          : getQatarNow().toISOString().split('T')[0];

        // Get the correct student ID - try multiple possible fields
        let studentId = lastScannedStudent?.id ||
            lastScannedStudent?.userId ||
            lastScannedStudent?.studentId;

        // If still no student ID, try to find it in the students array
        if (!studentId) {
          const searchField = lastScannedStudent?.studentNumber || lastScannedStudent?.referenceId;
          if (searchField) {
            const foundStudent = students.find(s =>
              s.studentNumber === searchField ||
              s.referenceId === searchField ||
              s.studentId === searchField ||
              `STU-${s.studentNumber}` === searchField ||
              String(s.id) === searchField
            );
            studentId = foundStudent?.id;
          }
        }

        if (!studentId) {
          throw new Error(`Student ID not found. Student data: ${JSON.stringify(lastScannedStudent)}`);
        }

        debug('Using studentId:', studentId);

        // Check if already marked — only in regular mode (standup uses different table)
        if (attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP) {
          const isMarked = await isStudentMarkedToday(studentId);
          if (isMarked) {
            showResult('info', t('already_marked_for_today') || 'Student is already marked for today.');
            setShowScanDialog(false);
            return;
          }
        }

        // Get performedBy fields using shared service
        const performedByFields = await getPerformedByFields(user);

        // Use unified attendance service for both regular and standup attendance
        let result = await markAttendance({
          userId: studentId,
          classId: attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? classId : undefined,
          date: dateStr,
          status: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? status.toUpperCase() : status,
          notes: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
            ? getNoteTypeFromStatus(status, 'standup')
            : getNoteTypeFromStatus(status, 'qr'),
          user: user,
          programId: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? selectedProgramId : (attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? selectedProgramId : undefined),
          subjectId: attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? selectedSubjectId : undefined
        }, user, attendanceMode);

        if (result.success) {
          setShowScanDialog(false);
          const statusLabel = getLocalizedAttendanceLabel(status, lang);
          const scannedStudentName = getLocalizedUserName(lastScannedStudent, lang);
          showResult('success', <span>{t('student_marked_as', { name: scannedStudentName, status: statusLabel }) || `${scannedStudentName} marked as ${statusLabel}!`}<br/><b style={{ textDecoration: 'underline' }}>{scannedStudentName}</b></span>, status);

          // Emit proper attendance event
          eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
            studentId: studentId,
            studentNumber: lastScannedStudent.studentNumber,
            referenceId: lastScannedStudent.referenceId,
            classId,
            status,
            performedBy: user,
            timestamp: new Date()
          });

          // Trigger activity update
          if (onActivityUpdate) {
            onActivityUpdate(() => {
              debug(`[QR Scanner] Triggering activity refresh after marking ${status}`);
              fetchRecentActivity();
            });
          }
        } else {
          showResult('error', result.error || 'Failed to mark attendance');
        }
      } catch (err) {
        addDebugLog(`❌ Error marking attendance (${status}): ${err.message}`, 'error');
        showResult('error', `Failed to mark attendance: ${err.message}`);
      } finally {
        setActionLoading(false);
        setCurrentAction(null);
      }
    } else {
      // Called from activity list or other places: handleMarkAttendance(studentId, status, programId, subjectId)
      const studentId = studentIdOrStatus;
      const status = statusOrNotes;

      console.log('🔍 [QR Scanner handleMarkAttendance] Activity list path:', {
        studentId,
        status,
        programId,
        subjectId,
        selectedProgramId,
        selectedSubjectId,
        selectedClassId,
        classId,
        attendanceMode
      });

      try {
        const today = formatQatarDateOnly(getQatarNow());
        const todayISO = getQatarNow().toISOString().split('T')[0]; // Use ISO format for database

        // Get performedBy fields using shared service
        const performedByFields = await getPerformedByFields(user);

        // Use passed programId/subjectId directly, or fallback to selected values
        const finalProgramId = programId || selectedProgramId;
        const finalSubjectId = subjectId || selectedSubjectId;

        console.log('🔍 [QR Scanner handleMarkAttendance] Final values:', {
          finalProgramId,
          finalSubjectId,
          passedProgramId: programId,
          passedSubjectId: subjectId,
          selectedProgramId,
          selectedSubjectId
        });

        await markAttendance({
          userId: studentId,
          classId: selectedClassId,
          date: todayISO, // Use ISO format for database
          status: status,
          notes: getNoteTypeFromStatus(status, 'quick'),
          user: user,
          programId: finalProgramId,
          subjectId: finalSubjectId
        }, user, attendanceMode);

        // Emit event for real-time updates
        eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
          studentId,
          classId: selectedClassId,
          status,
          performedBy: user,
          timestamp: new Date()
        });

        // Trigger activity refresh
        if (onActivityUpdate) {
          onActivityUpdate(() => {
            fetchRecentActivity();
          });
        }

        showSuccess('Attendance marked successfully');
      } catch (err) {
        error('Error marking attendance:', err);
        showError('Failed to mark attendance');
      }
    }
  }, [selectedClassId, selectedSubjectId, user, lastScannedStudent, students, classId, lang, t, onActivityUpdate, fetchRecentActivity, showResult, addDebugLog, showSuccess, showError, attendanceMode, selectedProgramId, selectedDate]);

  // Senior-Level Quick Attendance Handler
  const handleQuickAttendance = useCallback(async (student, status, mode, programIdParam) => {
    if (!student || !status) return;

    const statusLabel = getLocalizedAttendanceLabel(status, lang);
    addDebugLog(`⚡ ${t('quick') || 'Quick'} marking ${student.displayName || student.name} as ${statusLabel}`, 'info');

    try {
      const dateStr = (typeof selectedDate === 'string' && selectedDate) 
        ? selectedDate 
        : getQatarNow().toISOString().split('T')[0];
      const performedByFields = await getPerformedByFields(user);
      let result;

      console.log('🔍 [QR Scanner handleQuickAttendance] Calling with:', {
        studentId: student.id,
        status,
        mode,
        programIdParam,
        selectedProgramId,
        selectedSubjectId,
        attendanceMode
      });

      // Use unified attendance service for both regular and standup attendance
      result = await markAttendance({
        userId: student.id,
        classId: (mode || attendanceMode) === ATTENDANCE_TYPE_CATEGORY.REGULAR ? selectedClassId : undefined,
        date: dateStr,
        status: status, // Keep original status format for proper icon/color mapping
        notes: getNoteTypeFromStatus(status, 'quick'),
        user: user,
        programId: programIdParam || selectedProgramId,
        subjectId: selectedSubjectId
      }, user, mode || attendanceMode);

      if (result.success) {
        const studentName = getLocalizedUserName(student, lang);
        showResult('success', <span>{t('marked_as', { status: statusLabel }) || `Marked as ${statusLabel}!`}<br/><b style={{ textDecoration: 'underline' }}>{studentName}</b></span>, status);

        eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
          studentId: student.id,
          studentNumber: student.studentNumber,
          referenceId: student.referenceId,
          classId: selectedClassId,
          status,
          performedBy: user,
          timestamp: new Date(),
          quickAction: true,
          source: 'roster'
        });

        if (onActivityUpdate) {
          onActivityUpdate(() => {
            fetchRecentActivity();
          });
        }

        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

      } else {
        showResult('error', result.error || `Failed to mark ${statusLabel}`);
      }
    } catch (err) {
      addDebugLog(`❌ Quick attendance error: ${err.message}`, 'error');
      showResult('error', `Failed to mark ${statusLabel}: ${err.message}`);
    }
  }, [selectedClassId, user, lang, t, onActivityUpdate, fetchRecentActivity, showResult, addDebugLog, attendanceMode, selectedProgramId, selectedDate]);

  // Clear all standup attendance for current date/program
  const handleClearStandup = useCallback(async () => {
    if (!selectedProgramId || selectedProgramId === 'all') {
      showResult('error', t('please_select_program') || 'Please select Program');
      return;
    }

    // Count how many standup attendance records exist for selected date before showing modal
    try {
      const dateStr = (typeof selectedDate === 'string' && selectedDate) 
        ? selectedDate 
        : getQatarNow().toISOString().split('T')[0];
      let recordCount = 0;

      for (const student of students) {
        const result = await getStandupAttendanceByUserAndDate(student.id, dateStr);
        if (result.success && result.data) {
          const recordProgramId = result.data.programId;
          if (recordProgramId === parseInt(selectedProgramId) || recordProgramId === selectedProgramId) {
            recordCount++;
          }
        }
      }

      setClearStandupModal({ isOpen: true, loading: false, recordCount });
    } catch (err) {
      showResult('error', `Failed to count attendance records: ${err.message}`);
    }
  }, [selectedProgramId, showResult, t, students, selectedDate]);

  // Actual clear standup logic (called when modal is confirmed)
  const confirmClearStandup = useCallback(async () => {
    setClearStandupModal(prev => ({ ...prev, loading: true }));
    try {
      addDebugLog('🗑️ Clearing standup attendance...', 'info');
      addDebugLog(`🔍 Clearing for program: ${selectedProgramId}, date: ${(typeof selectedDate === 'string' && selectedDate) ? selectedDate : getQatarNow().toISOString().split('T')[0]}`, 'info');
      setActivityLoading(true);

      const dateStr = (typeof selectedDate === 'string' && selectedDate) 
        ? selectedDate 
        : getQatarNow().toISOString().split('T')[0];
      let deletedCount = 0;

      // Delete standup attendance for all students in the current program for today
      for (const student of students) {
        try {
          const result = await getStandupAttendanceByUserAndDate(student.id, dateStr);
          if (result.success && result.data) {
            // Check if the record has a valid ID and belongs to the current program
            const recordId = result.data.id;
            const recordProgramId = result.data.programId;

            if (recordId && (recordProgramId === parseInt(selectedProgramId) || recordProgramId === selectedProgramId)) {
              await deleteStandupAttendance(recordId);
              deletedCount++;
              addDebugLog(`✅ Deleted standup attendance for student ${student.id}`, 'info');
            } else if (!recordId) {
              addDebugLog(`⚠️ No ID found for student ${student.id} attendance record`, 'warning');
            } else {
              addDebugLog(`⚠️ Skipping student ${student.id} - record belongs to different program: ${recordProgramId}`, 'warning');
            }
          }
        } catch (err) {
          addDebugLog(`❌ Error deleting attendance for student ${student.id}: ${err.message}`, 'error');
        }
      }

      addDebugLog(`✅ Cleared ${deletedCount} standup attendance records for program ${selectedProgramId}`, 'success');
      showResult('success', `Cleared ${deletedCount} standup attendance records`);

      // Refresh activity
      if (fetchRecentActivity) {
        fetchRecentActivity();
      }

      // Emit event to update student roster
      eventBus.emit(EVENTS.ATTENDANCE_MARKED, { forceRefresh: true, programId: selectedProgramId });
      eventBus.emit(EVENTS.ATTENDANCE_DELETED);
    } catch (err) {
      addDebugLog(`❌ Error clearing standup: ${err.message}`, 'error');
      showResult('error', `Failed to clear standup: ${err.message}`);
    } finally {
      setActivityLoading(false);
      setClearStandupModal({ isOpen: false, loading: false });
    }
  }, [students, selectedProgramId, t, showResult, addDebugLog, fetchRecentActivity, selectedDate]);

  // Clear all attendance for today in regular mode
  const handleClearRegular = useCallback(async () => {
    if (!selectedClassId || selectedClassId === 'all') {
      showResult('error', t('please_select_class') || 'Please select Class');
      return;
    }

    // Count how many attendance records exist for today before showing modal
    try {
      const qatarNow = getQatarNow();
      const dateStr = qatarNow.toISOString().split('T')[0];
      
      const attendanceResponse = await getAttendanceByClass(selectedClassId, dateStr);
      const recordCount = attendanceResponse.success ? attendanceResponse.data.length : 0;

      setClearRegularModal({ isOpen: true, loading: false, recordCount });
    } catch (err) {
      showResult('error', `Failed to count attendance records: ${err.message}`);
    }
  }, [selectedClassId, showResult, t]);

  // Actual clear regular logic (called when modal is confirmed)
  const confirmClearRegular = useCallback(async () => {
    setClearRegularModal(prev => ({ ...prev, loading: true }));
    try {
      addDebugLog('🗑️ Clearing today\'s attendance...', 'info');
      addDebugLog(`🔍 Clearing for class: ${selectedClassId}, date: ${getQatarNow().toISOString().split('T')[0]}`, 'info');
      setActivityLoading(true);

      const qatarNow = getQatarNow();
      const dateStr = qatarNow.toISOString().split('T')[0];
      let deletedCount = 0;

      // Delete attendance records for today
      const attendanceResponse = await getAttendanceByClass(selectedClassId, dateStr);
      for (const record of attendanceResponse.success ? attendanceResponse.data : []) {
        try {
          await deleteAttendance(record.id);
          debug('Deleted attendance record:', record.id);
          deletedCount++;
        } catch (err) {
          error('Failed to delete attendance record:', record.id, err);
        }
      }

      addDebugLog(`✅ Cleared ${deletedCount} attendance records for class ${selectedClassId}`, 'success');
      showResult('success', `Cleared ${deletedCount} attendance records for today`);

      // Refresh activity
      if (fetchRecentActivity) {
        fetchRecentActivity();
      }

      // Emit events to update student roster and grid
      eventBus.emit(EVENTS.ATTENDANCE_MARKED, { forceRefresh: true, classId: selectedClassId });
      eventBus.emit(EVENTS.ATTENDANCE_DELETED);
      eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
      eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);
      eventBus.emit(EVENTS.REFRESH_STUDENT_DATA, { forceRefresh: true });
    } catch (err) {
      addDebugLog(`❌ Error clearing regular attendance: ${err.message}`, 'error');
      showResult('error', `Failed to clear attendance: ${err.message}`);
    } finally {
      setActivityLoading(false);
      setClearRegularModal({ isOpen: false, loading: false, recordCount: 0 });
    }
  }, [selectedClassId, t, showResult, addDebugLog, fetchRecentActivity]);

  // Fetch activity when classId and students change
  useEffect(() => {
    // Only fetch if we have a valid classId (not 'all') AND students
    if (classId && classId !== 'all' && students && students.length > 0) {
      info('🔧 Fetching activity - classId:', classId, 'students:', students.length);
      // Use a timeout to ensure the latest students state is captured
      setTimeout(() => {
        fetchRecentActivity();
      }, 50);
    } else {
      info('🔧 Skipping activity fetch - classId:', classId, 'students:', students?.length || 0);
      // Clear activity when conditions aren't met
      setRecentActivity([]);
      setActivityLoading(false);
    }
  }, [classId, students, fetchRecentActivity]);

  // Notify parent when minimization state changes (skip if change came from forceMinimized)
  const skipNotifyRef = useRef(false);
  useEffect(() => {
    if (skipNotifyRef.current) {
      skipNotifyRef.current = false;
      return;
    }
    if (onMinimizeChange) {
      onMinimizeChange(isMinimized);
    }
  }, [isMinimized, onMinimizeChange]);

  // Handle forceMinimized prop
  useEffect(() => {
    if (forceMinimized !== isMinimized) {
      skipNotifyRef.current = true;
      setIsMinimized(forceMinimized);
    }
  }, [forceMinimized]);

  // Add debug logging for props
  useEffect(() => {
    info('🔧 QRScanner props updated:', {
      studentsLength: students?.length || 0,
      selectedProgramId,
      selectedSubjectId,
      selectedClassId,
      students: students?.map(s => ({ id: s.id, displayName: s.displayName, name: s.name }))
    });
  }, [students, selectedProgramId, selectedSubjectId, selectedClassId]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Debug logging for StudentActionZapPanel rendering
  useEffect(() => {
    if (showStudentActionZapPanel && studentForAction) {
      addDebugLog(`🎯 Rendering StudentActionZapPanel for: ${studentForAction.name || studentForAction.email}`, 'info');
    }
  }, [showStudentActionZapPanel, studentForAction, addDebugLog]);

  return (
      <CollapsibleSection
          ref={scannerRef}
          sectionId="qr-scanner-v2"
           title={t('activity_list') || 'Activity list'}
          titleStyle={{ fontSize: '0.75rem' }}
          icon={<QrCodeIcon />}
          color="#8b5cf6"
          defaultMode="minimize"
          onModeChange={(mode) => {
            const isMinimized = mode === 'minimize';
            setIsMinimized(isMinimized);
          }}
          compactContent={
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {isScanning ?
                t('scanning') || 'Scanning...' :
                t('ready_to_scan') || 'Ready to scan'
            }
          </span>
              <PortalTooltip content={t('toggle_minimization')} position="top">
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  style={{ padding: '0.25rem' }}
              >
                <MinimizeIcon style={{ width: '16px', height: '16px' }} />
              </Button>
            </PortalTooltip>
            </div>
          }
      >
        <div dir={isRTL ? 'rtl' : 'ltr'} style={{
          background: 'var(--panel, white)',
          // borderRadius: '0.75rem',
          // border: '1px solid var(--border, #e5e7eb)',
          // padding: '1.5rem'
        }}>
          {/* <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCodeIcon className="w-5 h-5" style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary, #8b5cf6)' }} />
              <h3 style={{ fontWeight: 600, color: 'var(--text, #111827)', margin: 0, fontSize: '0.875rem' }}>
                {t('scanner')} {isScanning ? t('active') || 'Active' : t('ready') || 'Ready'}
              </h3>
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: isScanning ? '#166534' : '#1e40af',
              fontWeight: 500
            }}>
          {isScanning ? t('scanning') || 'SCANNING' : t('idle') || 'IDLE'}
        </span>
          </div> */}

          {isMobile && (
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              isScanning={isScanning}
              loading={loading}
              error={error}
              isMobile={isMobile}
              onToggleCamera={toggleCamera}
              t={t}
            />
          )}

          <div>
            <div style={{
              display: 'flex',
              gap: '0.25rem',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'var(--background-secondary, #f9fafb)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border, #e5e7eb)',
              justifyContent: isMobile ? 'center' : 'space-between',
              flexWrap: 'nowrap',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                justifyContent: 'center',
                flexWrap: 'nowrap'
              }}>
                {isMobile && (
                  <>
                    <PortalTooltip content={vibrationEnabled ? (t('disable_vibration') || 'Disable vibration') : (t('enable_vibration') || 'Enable vibration')} position="top">
                    <button
                        onClick={() => setVibrationEnabled(!vibrationEnabled)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border, #e5e7eb)',
                          background: vibrationEnabled ? 'var(--color-primary, #8b5cf6)' : 'white',
                          color: vibrationEnabled ? 'white' : 'var(--text, #111827)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <VibrationIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                    </PortalTooltip>

                    <PortalTooltip content={soundEnabled ? (t('disable_sound') || 'Disable sound') : (t('enable_sound') || 'Enable sound')} position="top">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border, #e5e7eb)',
                          background: soundEnabled ? 'var(--color-primary, #8b5cf6)' : 'white',
                          color: soundEnabled ? 'white' : 'var(--text, #111827)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <SoundIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                    </PortalTooltip>
                  </>
                )}

                {/*<button*/}
                {/*    onClick={() => setShowDebugBox(!showDebugBox)}*/}
                {/*    style={{*/}
                {/*      display: 'flex',*/}
                {/*      alignItems: 'center',*/}
                {/*      gap: '0.25rem',*/}
                {/*      padding: '0.375rem 0.5rem',*/}
                {/*      borderRadius: '0.375rem',*/}
                {/*      border: '1px solid var(--border, #e5e7eb)',*/}
                {/*      background: showDebugBox ? '#ef4444' : 'white',*/}
                {/*      color: showDebugBox ? 'white' : 'var(--text, #111827)',*/}
                {/*      fontSize: '0.75rem',*/}
                {/*      fontWeight: 500,*/}
                {/*      cursor: 'pointer',*/}
                {/*      transition: 'all 0.2s'*/}
                {/*    }}*/}
                {/*    title={t('toggle_debug_console')}*/}
                {/*>*/}
                {/*  <DebugIcon style={{ width: '14px', height: '14px' }} />*/}
                {/*</button>*/}

                {canManualInput && (
                  <PortalTooltip content={attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
                    ? ((!selectedProgramId || selectedProgramId === 'all')
                      ? (t('please_select_program') || 'Please select Program')
                      : t('manual_student_id_input'))
                    : ((!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')
                      ? (t('please_select_program_subject_class') || 'Please select Program, Subject, and Class')
                      : t('manual_student_id_input')
                      )
                    } position="top">
                    <button
                        disabled={attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')}
                        onClick={() => {
                          // Check if all required fields are selected before allowing manual input
                          if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
                            if (!selectedProgramId || selectedProgramId === 'all') {
                              showResult('error', t('please_select_program') || 'Please select Program before scanning');
                              return;
                            }
                          } else {
                            if (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all') {
                              showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
                              return;
                            }
                          }
                          setShowManualInput(!showManualInput);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border, #e5e7eb)',
                          background: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? '#f3f4f6' : (showManualInput ? '#3b82f6' : 'white'),
                          color: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? '#9ca3af' : (showManualInput ? 'white' : 'var(--text, #111827)'),
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? 0.6 : 1
                        }}
                  >
                    <UserInputIcon style={{ width: '14px', height: '14px' }} />
                  </button>
                </PortalTooltip>
                )}

                {canBulkScan && (
                  <PortalTooltip content={(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? t(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'please_select_program' : 'please_select_program_subject_class') : (t('bulk_scan') || 'Bulk Scan')} position="top">
                  <button
                      onClick={() => {
                        if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
                          if (!selectedProgramId || selectedProgramId === 'all') {
                            showResult('error', t('please_select_program') || 'Please select Program before scanning');
                            return;
                          }
                        } else {
                          if (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all') {
                            showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
                            return;
                          }
                        }
                        setShowBulkScanDialog(true);
                      }}
                      disabled={attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border, #e5e7eb)',
                        background: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? '#f3f4f6' : '#8b5cf6',
                        color: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? '#9ca3af' : 'white',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? 0.6 : 1
                      }}
                    >
                      <Upload style={{ width: '14px', height: '14px' }} />
                    </button>
                  </PortalTooltip>
                )}

                <PortalTooltip content={t('refresh_today_activity')} position="top">
                  <button
                    onClick={() => {
                      // Force refresh with current students
                      if (students && students.length > 0) {
                        fetchRecentActivity();
                      } else {
                        showResult('error', t('attendance.no_students_available_to_refresh'));
                      }
                    }}
                    disabled={(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || !selectedSubjectId || !selectedClassId)) || students.length === 0 || activityLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border, #e5e7eb)',
                      background: ((attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || !selectedSubjectId || !selectedClassId)) || students.length === 0 || activityLoading) ? '#f3f4f6' : '#10b981',
                      color: ((attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || !selectedSubjectId || !selectedClassId)) || students.length === 0 || activityLoading) ? '#9ca3af' : 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: ((attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || !selectedSubjectId || !selectedClassId)) || students.length === 0 || activityLoading) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: ((attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || !selectedSubjectId || !selectedClassId)) || students.length === 0 || activityLoading) ? 0.6 : 1
                    }}
                  >
                    <RefreshIcon 
                      style={{ 
                        width: '14px', 
                        height: '14px',
                        animation: activityLoading ? 'spin 1s linear infinite' : 'none'
                      }} 
                    />
                    {/*{t('refresh_today') || 'Refresh Today'}*/}
                  </button>
                </PortalTooltip>

                {/* Activity List Help Tour Button */}
                <PortalTooltip content={t('activity_help_tour') || 'Take a tour of the activity list features'} position="top">
                  <button
                    onClick={() => {
                      if (recentActivity.length === 0) {
                        showResult('error', t('no_todays_transactions') || 'No transactions Today');
                        return;
                      }
                      window.dispatchEvent(new Event('app:activity-tour'));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.375rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border, #e5e7eb)',
                      background: 'white',
                      color: 'var(--text-secondary, #6b7280)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: '28px',
                      height: '28px'
                    }}
                  >
                    ?
                  </button>
                </PortalTooltip>

                {/* Recycle Button - Clear attendance for today */}
                {canClearToday && (
                  <PortalTooltip content={attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (t('clear_standup_for_today') || 'Clear Standup For Today') : (t('clear_attendance_for_today') || 'Clear Attendance For Today')} position="top">
                    <button
                      onClick={attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? handleClearStandup : handleClearRegular}
                      disabled={activityLoading || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all'))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #ef4444',
                        background: activityLoading || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all')) ? '#f3f4f6' : '#ef4444',
                        color: activityLoading || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all')) ? '#9ca3af' : 'white',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: activityLoading || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all')) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: activityLoading || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all')) ? 0.6 : 1
                      }}
                    >
                      <TrashIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  </PortalTooltip>
                )}

                {/* Stop Scanner Button - Only show when scanning */}
                {isScanning && (
                    <PortalTooltip content={t('stop_scanner')} position="top">
                    <button
                        onClick={stopCamera}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #ef4444',
                          background: '#ef4444',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <StopIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                    </PortalTooltip>
                )}

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '24px'
                }}>
              <span style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                fontWeight: '500',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {`${recentActivity.length}`}
              </span>
                  {/*<Button*/}
                  {/*    variant="ghost"*/}
                  {/*    size="icon"*/}
                  {/*    onClick={() => {*/}
                  {/*      logger.log('🔧 Refresh button clicked - fetching recent activity'); // Debug*/}
                  {/*      fetchRecentActivity();*/}
                  {/*    }}*/}
                  {/*    title={t('refresh_activity')}*/}
                  {/*    style={{ padding: '0.25rem' }}*/}
                  {/*>*/}
                  {/*  <RefreshCw style={{ width: '1rem', height: '1rem' }} />*/}
                  {/*</Button>*/}
                </div>
              </div>
            </div>

              {/*<div style={{*/}
              {/*  display: 'flex',*/}
              {/*  alignItems: 'center',*/}
              {/*  justifyContent: 'space-between',*/}
              {/*  fontSize: '0.875rem',*/}
              {/*  marginBottom: '1rem',*/}
              {/*  fontWeight: 600,*/}
              {/*  color: '#111827'*/}
              {/*}}>*/}
              {/*  <span>Recent Activity</span>*/}
              {/*  <span style={{ */}
              {/*    fontSize: '0.75rem', */}
              {/*    background: '#8b5cf6', */}
              {/*    color: 'white', */}
              {/*    padding: '0.25rem 0.5rem', */}
              {/*    borderRadius: '0.25rem',*/}
              {/*    fontWeight: 500 */}
              {/*  }}>*/}
              {/*    ACTIVE*/}
              {/*  </span>*/}
              {/*</div>*/}

              <ActivityList
                recentActivity={recentActivity}
                activityLoading={activityLoading}
                expandedActivities={expandedActivities}
                students={students}
                onToggleActivityExpansion={toggleActivityExpansion}
                onDeleteActivity={onDeleteActivity}
                onQuickAttendance={handleQuickAttendance}
                programId={selectedProgramId}
                attendanceMode={attendanceMode}
                canEditAttendance={canEditAttendance}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getStatusLabel={getStatusLabel}
                getScanMethodDisplay={getScanMethodDisplay}
                t={t}
                lang={lang}
                canDeleteAttendance={canDeleteAttendance}
                isRTL={isRTL}
                isMobile={isMobile}
                canSeeQuickButtons={canSeeQuickButtons}
                canMarkAttendance={canMarkAttendance}
              />


            {devices.length > 1 && isScanning && (
                <button
                    onClick={switchCameraMode}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      marginTop: '0.5rem'
                    }}
                >
                  Switch to {cameraMode === 'environment' ? 'Front' : 'Back'} Camera
                </button>
            )}
          </div>

          <StudentScanDialog
            showScanDialog={showScanDialog}
            lastScannedStudent={lastScannedStudent}
            selectedProgramId={selectedProgramId}
            selectedSubjectId={selectedSubjectId}
            selectedClassId={selectedClassId}
            isMobile={isMobile}
            actionLoading={actionLoading}
            currentAction={currentAction}
            t={t}
            lang={lang}
            onClose={() => setShowScanDialog(false)}
            canEditAttendance={canEditAttendance}
            onMarkAttendance={handleMarkAttendance}
            attendanceMode={attendanceMode}
            onOpenPenalty={async () => {
              info('⚡ Add penalty');
              addDebugLog('⚡ Opening penalty actions', 'info');
              setActionLoading(true);
              setCurrentAction('penalty');
              try {
                let studentData;
                if (lastScannedStudent?.referenceId) {
                  studentData = await processStudentData(lastScannedStudent.referenceId);
                } else if (lastScannedStudent?.id) {
                  studentData = {
                    id: lastScannedStudent.id,
                    studentId: lastScannedStudent.studentNumber || lastScannedStudent.id,
                    studentNumber: lastScannedStudent.studentNumber,
                    name: lastScannedStudent.name || lastScannedStudent.displayName,
                    displayName: lastScannedStudent.displayName,
                    email: lastScannedStudent.email,
                    classId: selectedClassId,
                    programId: selectedProgramId,
                    subjectId: selectedSubjectId,
                    referenceId: lastScannedStudent.referenceId || lastScannedStudent.studentNumber || String(lastScannedStudent.id)
                  };
                }
                if (studentData) {
                  setInitialTab('participation');
                  setStudentForAction(studentData);
                  setShowStudentActionZapPanel(true);
                  setShowScanDialog(false);
                  addDebugLog(`✅ Found student for penalty: ${studentData.name || studentData.email}`, 'success');
                } else {
                  showResult('error', 'Student not found with this reference ID');
                }
              } catch (err) {
                addDebugLog(`❌ Error opening penalty actions: ${err.message}`, 'error');
                showResult('error', `Failed to open penalty actions: ${err.message}`);
              } finally {
                setActionLoading(false);
                setCurrentAction(null);
              }
            }}
            onOpenParticipation={async () => {
              info('👥 Open participation actions');
              addDebugLog('👥 Opening participation actions', 'info');
              setActionLoading(true);
              setCurrentAction('participation');
              try {
                let studentData;
                if (lastScannedStudent?.referenceId) {
                  studentData = await processStudentData(lastScannedStudent.referenceId);
                } else if (lastScannedStudent?.id) {
                  studentData = {
                    id: lastScannedStudent.id,
                    studentId: lastScannedStudent.studentNumber || lastScannedStudent.id,
                    studentNumber: lastScannedStudent.studentNumber,
                    name: lastScannedStudent.name || lastScannedStudent.displayName,
                    displayName: lastScannedStudent.displayName,
                    email: lastScannedStudent.email,
                    classId: selectedClassId,
                    programId: selectedProgramId,
                    subjectId: selectedSubjectId,
                    referenceId: lastScannedStudent.referenceId || lastScannedStudent.studentNumber || String(lastScannedStudent.id)
                  };
                }
                if (studentData) {
                  setInitialTab('participation');
                  setStudentForAction(studentData);
                  setShowStudentActionZapPanel(true);
                  setShowScanDialog(false);
                  addDebugLog(`✅ Found student for participation: ${studentData.name || studentData.email}`, 'success');
                } else {
                  showResult('error', 'Student not found with this reference ID');
                }
              } catch (err) {
                addDebugLog(`❌ Error opening participation actions: ${err.message}`, 'error');
                showResult('error', `Failed to open participation actions: ${err.message}`);
              } finally {
                setActionLoading(false);
                setCurrentAction(null);
              }
            }}
            onOpenBehavior={async () => {
              info('⚡ Add behavior');
              addDebugLog('⚡ Opening behavior actions', 'info');
              setActionLoading(true);
              setCurrentAction('behavior');
              try {
                let studentData;
                if (lastScannedStudent?.referenceId) {
                  studentData = await processStudentData(lastScannedStudent.referenceId);
                } else if (lastScannedStudent?.id) {
                  studentData = {
                    id: lastScannedStudent.id,
                    studentId: lastScannedStudent.studentNumber || lastScannedStudent.id,
                    studentNumber: lastScannedStudent.studentNumber,
                    name: lastScannedStudent.name || lastScannedStudent.displayName,
                    displayName: lastScannedStudent.displayName,
                    email: lastScannedStudent.email,
                    classId: selectedClassId,
                    programId: selectedProgramId,
                    subjectId: selectedSubjectId,
                    referenceId: lastScannedStudent.referenceId || lastScannedStudent.studentNumber || String(lastScannedStudent.id)
                  };
                }
                if (studentData) {
                  setInitialTab('behavior');
                  setStudentForAction(studentData);
                  setShowStudentActionZapPanel(true);
                  setShowScanDialog(false);
                  addDebugLog(`✅ Found student for behavior: ${studentData.name || studentData.email}`, 'success');
                } else {
                  showResult('error', 'Student not found with this reference ID');
                }
              } catch (err) {
                addDebugLog(`❌ Error opening behavior actions: ${err.message}`, 'error');
                showResult('error', `Failed to open behavior actions: ${err.message}`);
              } finally {
                setActionLoading(false);
                setCurrentAction(null);
              }
            }}
            onOpenDetails={async () => {
              info('📋 Open student details');
              addDebugLog('📋 Opening student details', 'info');
              setActionLoading(true);
              setCurrentAction('details');
              try {
                let studentReferenceId = null;
                if (lastScannedStudent?.referenceId) {
                  studentReferenceId = lastScannedStudent.referenceId;
                } else if (lastScannedStudent?.studentId) {
                  studentReferenceId = lastScannedStudent.studentId;
                } else if (activity?.studentName && students?.length > 0) {
                  const foundStudent = students.find(s => 
                    s.name === activity.studentName || 
                    s.displayName === activity.studentName ||
                    s.email === activity.studentName
                  );
                  if (foundStudent?.studentId) {
                    studentReferenceId = foundStudent.studentId;
                  }
                }
                if (studentReferenceId) {
                  const studentData = await processStudentData(studentReferenceId);
                  if (studentData) {
                    setStudentForAction(studentData);
                    setShowStudentActionStatsPanel(true);
                    setShowScanDialog(false);
                    addDebugLog(`✅ Opening details for: ${studentData.name || studentData.email || 'Unknown'} (${studentReferenceId})`, 'success');
                  } else {
                    showResult('error', 'Student data not found');
                  }
                } else {
                  showResult('error', 'No student reference ID available');
                  addDebugLog('❌ Could not find student reference ID', 'error');
                }
              } catch (err) {
                addDebugLog(`❌ Error opening student details: ${err.message}`, 'error');
                showResult('error', `Failed to open student details: ${err.message}`);
              } finally {
                setActionLoading(false);
                setCurrentAction(null);
              }
            }}
            onOpenActions={async () => {
              info('🎯 Open student actions');
              addDebugLog('🎯 Opening student actions', 'info');
              setActionLoading(true);
              setCurrentAction('actions');
              try {
                let studentData;
                if (lastScannedStudent?.referenceId) {
                  studentData = await processStudentData(lastScannedStudent.referenceId);
                } else if (lastScannedStudent?.id) {
                  studentData = {
                    id: lastScannedStudent.id,
                    studentId: lastScannedStudent.studentNumber || lastScannedStudent.id,
                    studentNumber: lastScannedStudent.studentNumber,
                    name: lastScannedStudent.name || lastScannedStudent.displayName,
                    displayName: lastScannedStudent.displayName,
                    email: lastScannedStudent.email,
                    classId: selectedClassId,
                    programId: selectedProgramId,
                    subjectId: selectedSubjectId,
                    referenceId: lastScannedStudent.referenceId || lastScannedStudent.studentNumber || String(lastScannedStudent.id)
                  };
                }
                if (studentData) {
                  setStudentForAction(studentData);
                  setShowStudentActionZapPanel(true);
                  setShowScanDialog(false);
                  addDebugLog(`✅ Opening actions for: ${studentData.name || studentData.email || 'Unknown'}`, 'success');
                } else {
                  showResult('error', 'Student not found with this reference ID');
                }
              } catch (err) {
                addDebugLog(`❌ Error opening student actions: ${err.message}`, 'error');
                showResult('error', `Failed to open student actions: ${err.message}`);
              } finally {
                setActionLoading(false);
                setCurrentAction(null);
              }
            }}
            students={students}
            processStudentData={processStudentData}
            setStudentForAction={setStudentForAction}
            setShowStudentActionStatsPanel={setShowStudentActionStatsPanel}
            setShowStudentActionZapPanel={setShowStudentActionZapPanel}
            setShowScanDialog={setShowScanDialog}
            addDebugLog={addDebugLog}
            showResult={showResult}
          />

          <DebugPanel
            showDebugBox={showDebugBox}
            debugLogs={debugLogs}
            onClear={() => setDebugLogs([])}
            isMobile={isMobile}
          />

          <ManualInputForm
            showManualInput={showManualInput}
            manualStudentId={manualStudentId}
            setManualStudentId={setManualStudentId}
            onSubmit={handleManualSubmit}
            onClose={() => {
              setShowManualInput(false);
              setManualStudentId('');
            }}
            isMobile={isMobile}
            t={t}
          />

          {/* Result Modal */}
          <AttendanceResultModal
            isOpen={showResultModal}
            onClose={() => setShowResultModal(false)}
            type={resultModalData.type}
            message={resultModalData.isSummary ? 
              (typeof resultModalData.message === 'object' ? 
                JSON.stringify(resultModalData.message) : resultModalData.message) : 
              resultModalData.message
            }
            isSummary={resultModalData.isSummary}
            attendanceStatus={resultModalData.attendanceStatus}
          />

          {canUseStatsPanel && showStudentActionStatsPanel && studentForAction && (
              <StudentActionStatsPanel
                  student={studentForAction}
                  onClose={() => {
                    setShowStudentActionStatsPanel(false);
                    setStudentForAction(null);
                  }}
                  onBehaviorSubmit={handleBehaviorSubmit}
                  onMarkAttendance={handleMarkAttendance}
                  attendanceMode={attendanceMode}
                  programId={selectedProgramId}
                  subjectId={selectedSubjectId}
                  onUpdate={() => {
                    if (onActivityUpdate) {
                      onActivityUpdate(() => {
                        debug('[QR Scanner] Triggering activity refresh from StudentActionStatsPanel');
                        fetchRecentActivity();
                      });
                    }
                  }}
              />
          )}

          {canUseZapPanel && showStudentActionZapPanel && studentForAction && (
              <StudentActionZapPanel
                  student={studentForAction}
                  initialTab={initialTab}
                  attendanceMode={attendanceMode}
                  classId={selectedClassId}
                  programId={selectedProgramId}
                  subjectId={selectedSubjectId}
                  onClose={() => {
                    addDebugLog('🔚 Closing StudentActionZapPanel', 'info');
                    setShowStudentActionZapPanel(false);
                    setStudentForAction(null);
                  }}
                  onBehaviorSubmit={handleBehaviorSubmit}
                  onParticipationSubmit={handleBehaviorSubmit}
                  onPenaltySubmit={handlePenaltySubmit}
                  onMarkAttendance={handleMarkAttendance}
                  onUpdate={() => {
                    if (onActivityUpdate) {
                      onActivityUpdate(() => {
                        debug('[QR Scanner] Triggering activity refresh from StudentActionZapPanel');
                        fetchRecentActivity();
                      });
                    }
                  }}
                  options={activityTypeOptions}
              />
          )}

          {/* Clear Confirmation Modal */}
          {showClearConfirmModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1004
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  maxWidth: '400px',
                  width: '90%',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '0.75rem'
                  }}>
                    {t('confirm_clear') || 'Confirm Clear'}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '1rem'
                  }}>
                    {t('confirm_clear_message') || 'Select the scope for clearing records:'}
                  </p>
                  
                  <div style={{
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="clearScope"
                        value="today"
                        checked={clearScope === 'today'}
                        onChange={() => setClearScope('today')}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{t('clear_today') || 'Clear Today Only'}</span>
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="clearScope"
                        value="all"
                        checked={clearScope === 'all'}
                        onChange={() => setClearScope('all')}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{t('clear_all_days') || 'Clear All Days'}</span>
                    </label>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                        onClick={() => {
                          setShowClearConfirmModal(false);
                          setClearScope('today');
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          color: '#6b7280',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                    >
                      {t('cancel') || 'Cancel'}
                    </button>
                    <button
                        onClick={async () => {
                          setShowClearConfirmModal(false);
                          setActionLoading(true);
                          setCurrentAction('clear');

                          try {
                            const today = new Date().toISOString().split('T')[0];
                            debug('Clearing records for scope:', clearScope);

                            // Get attendance records based on scope
                            let attendanceRecords = [];
                            if (clearScope === 'today') {
                              const attendanceResponse = await getAttendanceByClass(classId, today);
                              attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];
                            } else {
                              const attendanceResponse = await getAttendanceByClass(classId);
                              attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];
                            }

                            // Get penalties based on scope
                            let penaltiesToClear = [];
                            if (clearScope === 'today') {
                              const penaltiesResponse = await getPenalties();
                              const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
                              penaltiesToClear = allPenalties.filter(p => {
                                const timestamp = p.createdAt || p.timestamp;
                                if (!timestamp) return false;
                                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                return dateStr === today;
                              });
                            } else {
                              const penaltiesResponse = await getPenalties();
                              penaltiesToClear = penaltiesResponse.success ? penaltiesResponse.data.filter(p => p.classId === classId) : [];
                            }

                            // Count different record types from attendance
                            const behaviorRecords = attendanceRecords.filter(r => r.category === RECORD_TYPES.BEHAVIOR);
                            const participationRecords = attendanceRecords.filter(r => r.category === RECORD_TYPES.PARTICIPATION);
                            const attendanceOnlyRecords = attendanceRecords.filter(r => r.category === RECORD_TYPES.ATTENDANCE || r.category === ATTENDANCE_STATUS.LATE || r.category === ATTENDANCE_STATUS.PRESENT);
                            const lateRecords = attendanceRecords.filter(r => r.category === ATTENDANCE_STATUS.LATE);

                            debug('Records to delete:', {
                              totalAttendanceRecords: attendanceRecords.length,
                              attendanceOnlyRecords: attendanceOnlyRecords.length,
                              lateRecords: lateRecords.length,
                              behaviorRecords: behaviorRecords.length,
                              participationRecords: participationRecords.length,
                              penaltyCount: todayPenalties.length,
                              total: attendanceRecords.length + todayPenalties.length
                            });

                            // Delete all attendance records for today (including late entries)
                            let deletedAttendanceCount = 0;
                            for (const record of attendanceRecords) {
                              try {
                                await deleteAttendance(record.id);
                                debug('Deleted attendance record:', record.id, 'Category:', record.category);
                                deletedAttendanceCount++;
                              } catch (err) {
                                error('Failed to delete attendance record:', record.id, err);
                              }
                            }

                            // Delete all penalty records for today
                            let deletedPenaltyCount = 0;
                            for (const penalty of todayPenalties) {
                              try {
                                await deletePenalty(penalty.id);
                                debug('Deleted penalty record:', penalty.id);
                                deletedPenaltyCount++;
                              } catch (err) {
                                error('Failed to delete penalty record:', penalty.id, err);
                              }
                            }

                            // Delete participation records based on scope
                            let participationsToClear = [];
                            if (clearScope === 'today') {
                              const participationResponse = await getParticipations();
                              const allParticipations = participationResponse.success ? participationResponse.data : [];
                              participationsToClear = allParticipations.filter(p => {
                                const timestamp = p.createdAt || p.timestamp;
                                if (!timestamp) return false;
                                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                return dateStr === today;
                              });
                            } else {
                              const participationResponse = await getParticipations();
                              participationsToClear = participationResponse.success ? participationResponse.data.filter(p => p.classId === classId) : [];
                            }

                            let deletedParticipationCount = 0;
                            for (const participation of participationsToClear) {
                              try {
                                await deleteParticipation(participation.id);
                                debug('Deleted participation record:', participation.id);
                                deletedParticipationCount++;
                              } catch (err) {
                                error('Failed to delete participation record:', participation.id, err);
                              }
                            }

                            // Delete behavior records based on scope
                            let behaviorsToClear = [];
                            if (clearScope === 'today') {
                              const behaviorResponse = await getBehaviors();
                              const allBehaviors = behaviorResponse.success ? behaviorResponse.data : [];
                              behaviorsToClear = allBehaviors.filter(b => {
                                const timestamp = b.createdAt || b.timestamp;
                                if (!timestamp) return false;
                                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                return dateStr === today;
                              });
                            } else {
                              const behaviorResponse = await getBehaviors();
                              behaviorsToClear = behaviorResponse.success ? behaviorResponse.data.filter(b => b.classId === classId) : [];
                            }

                            let deletedBehaviorCount = 0;
                            for (const behavior of behaviorsToClear) {
                              try {
                                await deleteBehavior(behavior.id);
                                debug('Deleted behavior record:', behavior.id);
                                deletedBehaviorCount++;
                              } catch (err) {
                                error('Failed to delete behavior record:', behavior.id, err);
                              }
                            }

                            // Refresh the activity display
                            fetchRecentActivity();

                            // Emit events to refresh roster and student data
                            eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
                            eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
                            eventBus.emit(EVENTS.REFRESH_ROSTER);

                            // Show detailed summary with actual deleted counts
                            const summaryData = {
                              attendance: deletedAttendanceCount,
                              behavior: deletedBehaviorCount,
                              participation: deletedParticipationCount,
                              penalties: deletedPenaltyCount,
                              total: deletedAttendanceCount + deletedBehaviorCount + deletedParticipationCount + deletedPenaltyCount
                            };

                            showResult('success', summaryData, true); // Pass true to indicate this is a summary
                            addDebugLog(`✅ Cleared ${deletedAttendanceCount} attendance, ${deletedBehaviorCount} behavior, ${deletedParticipationCount} participation, and ${deletedPenaltyCount} penalty records for today`, 'success');

                            setShowScanDialog(false);
                          } catch (err) {
                            addDebugLog(`❌ Error clearing today's scans: ${err.message}`, 'error');
                            showResult('error', `${t('clear_error') || 'Failed to clear today\'s scans'}: ${err.message}`);
                          } finally {
                            setActionLoading(false);
                            setCurrentAction(null);
                          }
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem 1rem',
                          border: 'none',
                          background: actionLoading ? '#94a3b8' : '#dc2626',
                          color: 'white',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: actionLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                      {actionLoading ? (t('clearing') || 'Clearing...') : (t('confirm_clear') || 'Confirm Clear')}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Clear Standup Modal */}
          <DeleteModal
            isOpen={clearStandupModal.isOpen}
            onClose={() => setClearStandupModal({ isOpen: false, loading: false, recordCount: 0 })}
            onConfirm={confirmClearStandup}
            loading={clearStandupModal.loading}
            customTitle={t('confirm_clear_standup') || 'Clear Standup Attendance'}
            customMessage={
              clearStandupModal.recordCount > 0
                ? `${t('confirm_clear_standup_message') || 'Are you sure you want to clear all standup attendance for today?'}\n\n${t('this_will_delete') || 'This will delete'} ${clearStandupModal.recordCount} ${t('standup_attendance_records') || 'standup attendance records'} ${t('for_today') || 'for today'}.\n\n⚠️ ${t('this_action_cannot_be_undone') || 'This action cannot be undone.'}`
                : `${t('no_standup_records_today') || 'No standup attendance records found for today.'}`
            }
            t={t}
          />

          {/* Clear Regular Modal */}
          <DeleteModal
            isOpen={clearRegularModal.isOpen}
            onClose={() => setClearRegularModal({ isOpen: false, loading: false, recordCount: 0 })}
            onConfirm={confirmClearRegular}
            loading={clearRegularModal.loading}
            customTitle={t('confirm_clear_today') || 'Clear Today\'s Scans'}
            customMessage={
              clearRegularModal.recordCount > 0
                ? `${t('confirm_clear_message') || 'Are you sure you want to clear all records for today? This will permanently delete all attendance records for today\'s date.'}\n\n${t('this_will_delete') || 'This will delete'} ${clearRegularModal.recordCount} ${t('attendance_records') || 'attendance records'} ${t('for_today') || 'for today'}.\n\n⚠️ ${t('this_action_cannot_be_undone') || 'This action cannot be undone.'}`
                : `${t('no_attendance_records_today') || 'No attendance records found for today.'}`
            }
            t={t}
          />

          {canBulkScan && (
            <>
              {/* Bulk Scan Dialog */}
              <BulkScanProvider
                programId={selectedProgramId}
                subjectId={selectedSubjectId}
                classId={selectedClassId}
                markedBy={performedByFields.performedBy}
                performedBy={performedByFields.performedBy}
                performedByName={performedByFields.performedByName}
                performedByEmail={performedByFields.performedByEmail}
                attendanceMode={attendanceMode}
                onSuccess={(result) => {
                  // Store the result for the success modal (selectedStatus is already in result)
                  setBulkSuccessResult(result);
                  // Close the bulk dialog
                  setShowBulkScanDialog(false);
                  // The success modal will show automatically when bulkSuccessResult is set
                }}
                t={t}
                lang={lang}
                showSuccess={showSuccess}
                showError={showError}
              >
                <BulkScanDialog
                  isOpen={showBulkScanDialog}
                  onClose={() => setShowBulkScanDialog(false)}
                  programId={selectedProgramId}
                  subjectId={selectedSubjectId}
                  classId={selectedClassId}
                  markedBy={performedByFields.performedBy}
                  performedBy={performedByFields.performedBy}
                  performedByName={performedByFields.performedByName}
                  performedByEmail={performedByFields.performedByEmail}
                  attendanceMode={attendanceMode}
                  t={t}
                  lang={lang}
                  showSuccess={showSuccess}
                  showError={showError}
                />
              </BulkScanProvider>

              {/* Bulk Success Modal */}
              <BulkSuccessModal
                isOpen={!!bulkSuccessResult}
                result={bulkSuccessResult}
                programName={lang === 'ar' ? (selectedProgramNameAr || selectedProgramName || selectedProgramId) : (selectedProgramName || selectedProgramId)}
                statusLabel={(() => {
                  if (!bulkSuccessResult) return '';
                  const statusFromResult = bulkSuccessResult?.results?.detailed?.[0]?.status;
                  const statusFromParam = bulkSuccessResult?.selectedStatus;
                  const statusToUse = statusFromParam || statusFromResult;
                  return statusToUse ? getLocalizedAttendanceLabel(statusToUse, lang) : '';
                })()}
                statusIcon={(() => {
                  if (!bulkSuccessResult) return null;
                  const statusFromResult = bulkSuccessResult?.results?.detailed?.[0]?.status;
                  const statusFromParam = bulkSuccessResult?.selectedStatus;
                  const statusToUse = statusFromParam || statusFromResult;
                  return statusToUse ? getAttendanceIcon(statusToUse) : null;
                })()}
                statusColor={(() => {
                  if (!bulkSuccessResult) return null;
                  const statusFromResult = bulkSuccessResult?.results?.detailed?.[0]?.status;
                  const statusFromParam = bulkSuccessResult?.selectedStatus;
                  const statusToUse = statusFromParam || statusFromResult;
                  return statusToUse ? getAttendanceColor(statusToUse) : null;
                })()}
                dateLabel={new Date().toISOString().split('T')[0]}
                onClose={() => {
                  setBulkSuccessResult(null);
                  // Refresh data when user clicks OK
                  fetchRecentActivity();
                  eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
                    classId: selectedClassId,
                    timestamp: Date.now(),
                    forceRefresh: true
                  });
                  eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
                  eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);
                  eventBus.emit(EVENTS.REFRESH_STUDENT_DATA, { forceRefresh: true });
                }}
                t={t}
              />
            </>
          )}

          <style>{`
            @keyframes qr-scan-line {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100%); }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </CollapsibleSection>
  );
}
