import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate';
import { Button } from '@ui';
import { CollapsibleSection, PerformedBy } from '@ui';
import { Upload } from 'lucide-react';
import jsQR from 'jsqr';
import { getAttendanceByClass, deleteAttendance, rosterQuickAction, markAttendance } from '@services/business/attendanceService';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, getAttendanceIcon, getAttendanceColor, getAttendanceLabel, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
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
import { useToast } from '@ui';
import PortalTooltip from '@ui/PortalTooltip';
import { GENERAL_STATUS } from '@utils/sharedTypes';
import StudentActionStatsPanel from './StudentActionStatsPanel';
import StudentActionZapPanel from './StudentActionZapPanel';
import BulkScanDialog from '@ui/BulkScanDialog';
import { generateReferenceId } from '@utils/qrCode';
import { getTypeColor } from '@utils/sharedTypes';
import { PARTICIPATION_TYPES, getParticipationColor } from '@constants/participationTypes.jsx';
import { PENALTY_TYPES, getPenaltyColor } from '@constants/penaltyTypes.jsx';
import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes.jsx';
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
import { getAttendanceMethodLabel, shouldShowMethodLabel } from '@constants/attendanceMethods';
import { useBilingualNotes } from '@hooks/useBilingualNotes.js';

export default function QRScanner({ onScan, classId, onActivityUpdate, onDeleteActivity, selectedProgramId, selectedSubjectId, selectedClassId, selectedProgramName, selectedSubjectName, selectedClassName, loading = false, students = [], onMinimizeChange }) {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  
  // Safe bilingual notes hook with fallback
  let bilingualNotes = null;
  try {
    bilingualNotes = useBilingualNotes();
  } catch (error) {
    console.warn('Bilingual notes hook not available, using fallback:', error);
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
  const [error, setError] = useState('');
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
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false); // Start with false
  const [manualStudentId, setManualStudentId] = useState('');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showBulkScanDialog, setShowBulkScanDialog] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err) {
        logger.error('Error getting devices:', err);
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
    logger.log(`[${timestamp}] ${message}`);
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
      ATTENDANCE_STATUS.HUMAN_CASE
    ].includes(attendanceStatus)) {
      finalType = attendanceStatus;
      // Add attendance icon to message if not already present
      const icon = getAttendanceIcon(attendanceStatus);
      const label = getLocalizedAttendanceLabel(attendanceStatus, t, lang);
      if (!message.includes(label)) {
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
    } catch (error) {
      addDebugLog(`❌ Error parsing QR data: ${error.message}`, 'error');
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
            id: result.data.docId || result.data.id,
            docId: result.data.docId,
            referenceId: result.data.referenceId,
            studentId: result.data.studentNumber || result.data.docId || result.data.id,
            studentNumber: result.data.studentNumber || result.data.docId || result.data.id,
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
              excused_leave: 0,
              humanitarian_case: 0
            },
            isPinned: result.data.isPinned || false
          };
          addDebugLog(`✅ Found student via direct lookup: ${foundStudent.name}`, 'success');
        }
      } catch (error) {
        addDebugLog(`❌ Direct lookup failed: ${error.message}`, 'error');
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
              addDebugLog(`User ${idx}: docId=${u.docId}, id=${u.id}, studentNumber=${u.studentNumber}, referenceId=${u.referenceId}, name=${u.displayName || u.name}`, 'info');
            });

            const student = allUsers.find(u => {
              const matches = [
                u.studentNumber === studentInfo.studentNumber,
                u.referenceId === studentInfo.studentNumber,
                `STU-${u.studentNumber}` === studentInfo.studentNumber,
                // Only check generateReferenceId if docId exists
                u.docId && generateReferenceId(u.docId) === studentInfo.studentNumber
              ];

              if (matches.some(Boolean)) {
                addDebugLog(`🎯 Found potential match: ${u.displayName || u.name || 'Unknown'}, studentNumber=${u.studentNumber}, referenceId=${u.referenceId}, docId=${u.docId}`, 'info');
              }

              return matches.some(Boolean);
            });

            if (student && !isAdmin(student) && !isSuperAdmin(student)) {
              foundStudent = {
                id: student.docId || student.id, // Use docId as primary, fallback to id
                docId: student.docId,
                referenceId: student.referenceId, // Include referenceId
                studentId: student.studentNumber || student.docId || student.id,
                studentNumber: student.studentNumber || student.docId || student.id,
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
                  excused_leave: 0,
                  humanitarian_case: 0
                },
                isPinned: student.isPinned || false
              };
              addDebugLog(`✅ Found student via user search: ${foundStudent.name}`, 'success');
            }
          }
        } catch (error) {
          addDebugLog(`❌ User search failed: ${error.message}`, 'error');
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
        // Only check generateReferenceId if docId exists
        s.docId && generateReferenceId(s.docId) === studentInfo.studentNumber
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
    } catch (error) {
      logger.warn('Could not play feedback sound:', error);
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
      setError('');
      setIsScanning(true);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this browser. Please try using a modern browser like Chrome, Firefox, or Safari.');
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
      logger.error('Error accessing camera:', err);
      setError(err.message || 'Unable to access camera. Please check permissions.');
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
      // Validate that program, subject, and class are selected
      if (!selectedProgramId || selectedProgramId === 'all' ||
          !selectedSubjectId || selectedSubjectId === 'all' ||
          !selectedClassId || selectedClassId === 'all') {
        showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
        return;
      }

      startCamera();
    }
  }, [selectedProgramId, selectedSubjectId, selectedClassId, t, isScanning, showResult, startCamera, stopCamera]);

  const handleManualSubmit = useCallback(() => {
    if (!manualStudentId.trim()) return;

    // Check if all required fields are selected
    if (!selectedProgramId || !selectedSubjectId || !selectedClassId) {
      showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
      addDebugLog('❌ Cannot scan manually: Missing required selections', 'error');
      return;
    }

    const studentInfo = { studentNumber: manualStudentId.trim() };

    // Try to find the full student object using the student number
    logger.debug('Manual student input lookup:', {
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
        generateReferenceId(s.id) === manualStudentId.trim() // Backward compatibility
      ];

      if (matches.some(Boolean)) {
        logger.debug('Manual student match found:', {
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
      logger.debug('Found full student object for manual input:', {
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
  }, [manualStudentId, selectedProgramId, selectedSubjectId, selectedClassId, t, addDebugLog, playFeedbackSound, students, showResult]);

  const findStudentData = useCallback(async (referenceId) => {
    try {
      const result = await getUsers();
      const students = result.success ? result.data : [];
      const student = students.find(s =>
          s.referenceId === referenceId &&
          isStudent(s) // Only match students exactly
      );
      return student;
    } catch (error) {
      addDebugLog(`❌ Error finding student data: ${error.message}`, 'error');
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
    } catch (error) {
      addDebugLog(`❌ Error checking attendance status: ${error.message}`, 'error');
      return null;
    }
  }, [classId, addDebugLog]);

  const processStudentData = useCallback(async (referenceId) => {
    try {
      const studentData = await findStudentData(referenceId);

      // Check attendance status using the student's actual ID
      let attendanceStatus = null;
      if (studentData) {
        attendanceStatus = await checkTodayAttendanceStatus(studentData.docId || studentData.id);
        // Update studentData with actual attendance status
        if (attendanceStatus) {
          studentData.attendance = attendanceStatus;
        }

        const sid = studentData.docId || studentData.id;

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
    } catch (error) {
      addDebugLog(`❌ Error processing student data: ${error.message}`, 'error');
      setTodayAttendanceStatus(null);
      return null;
    }
  }, [findStudentData, checkTodayAttendanceStatus, addDebugLog]);

  // Handle behavior/participation submission
  const handleBehaviorSubmit = useCallback(async (studentId, actions, note) => {
    logger.log('🔧 handleBehaviorSubmit called with:', { studentId, actions, note });

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
            logger.error('🔧 Invalid behavior type detected:', { action });
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
            logger.error('🔧 Invalid participation type detected:', { action });
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
    } catch (error) {
      logger.error('Error submitting behavior/participation:', error);
      showError('Failed to record actions');
    }
  }, [selectedClassId, selectedSubjectId, selectedClassName, user, findStudentData, showError]);

  // Handle penalty submission
  const handlePenaltySubmit = useCallback(async (studentId, penalties, note) => {
    logger.log('🔧 handlePenaltySubmit called with:', { studentId, penalties, note });

    try {
      // Get performedBy fields using shared service
      const performedByFields = await getPerformedByFields(user);
      
      // Process each penalty
      for (const penalty of penalties) {
        logger.log('🔧 Processing penalty:', penalty);
        logger.log('🔧 penalty.id:', penalty.id);
        logger.log('🔧 penalty.type:', penalty.type);

        const today = new Date().toISOString().split('T')[0];

        // Ensure we always use the correct penalty type ID
        const penaltyTypeId = penalty.id || penalty.type;
        logger.log('🔧 penaltyTypeId extracted:', penaltyTypeId);
        logger.log('🔧 penalty object:', JSON.stringify(penalty, null, 2));

        if (!penaltyTypeId || penaltyTypeId === RECORD_TYPES.PENALTY) {
          logger.error('🔧 Invalid penalty type detected:', { penalty, penaltyTypeId });
          throw new Error('Invalid penalty type: must be a specific penalty type like "cheating", not "penalty"');
        }

        logger.log('🔧 About to create penalty with type:', penaltyTypeId);

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

        logger.log('🔧 Penalty saved successfully');
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
    } catch (error) {
      logger.error('Error submitting penalty:', error);
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
    if (!classId) return;

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

      // Use local date string YYYY-MM-DD to avoid timezone shifts
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Get today's attendance records for this class
      const attendanceResponse = await getAttendanceByClass(classId, todayStr);
      const attendanceRecords = attendanceResponse.success ? attendanceResponse.data.filter(r => r.status) : [];

      // Get today's penalties for this class
      const penaltiesResponse = await getPenaltiesByClassAndDate(classId, todayStr);
      const penaltyRecords = penaltiesResponse.success && penaltiesResponse.data ? penaltiesResponse.data.map(p => ({ ...p, category: RECORD_TYPES.PENALTY })) : [];

      // Get today's participations for this class
      const participationsResponse = await getParticipationsByClassAndDate(classId, todayStr);
      const participationRecords = participationsResponse.success && participationsResponse.data ? participationsResponse.data.map(p => ({ ...p, category: RECORD_TYPES.PARTICIPATION })) : [];

      // Get today's behaviors for this class
      const behaviorsResponse = await getBehaviorsByClassAndDate(classId, todayStr);
      const behaviorRecords = behaviorsResponse.success && behaviorsResponse.data ? behaviorsResponse.data.map(b => ({ ...b, category: RECORD_TYPES.BEHAVIOR })) : [];

      logger.debug('[QR Scanner] Attendance records fetched:', {
        success: attendanceResponse.success,
        count: attendanceRecords.length,
        records: attendanceRecords.map(r => ({
          id: r.id,
          studentId: r.studentId,
          status: r.status,
          date: r.date,
          timestamp: r.timestamp,
          category: r.category,
          delta: r.delta
        }))
      });

      // Combine attendance, penalty, participation, and behavior records
      const allRecords = [...attendanceRecords, ...penaltyRecords, ...participationRecords, ...behaviorRecords];

      logger.debug('[QR Scanner] Activity refresh found:', allRecords.length, 'total records');

      // Create a map of studentId to student name from captured students
      const studentMap = {};
      logger.log('🔧 Creating student map from', currentStudents.length, 'students');

      // Only create student map if we have students
      if (currentStudents.length === 0) {
        logger.log('🔧 No students available for mapping - returning empty activity');
        // Return early with empty activity
        setRecentActivity([]);
        setActivityLoading(false);
        return;
      }

      // Add a small delay to ensure students are fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      logger.debug('[QR Scanner] Creating student map from', currentStudents.length, 'students');
      currentStudents.forEach(student => {
        const studentId = student.id || student.docId; // Firebase user ID
        const name = student.displayName || student.realName || student.name || (student.email ? student.email.split('@')[0] : 'Unknown');

        // Only map the Firebase user ID to the name (not reference ID)
        studentMap[studentId] = name;
        studentMap[generateReferenceId(studentId)] = name; // Also map reference ID

        logger.debug('[QR Scanner] Student map entry:', {
          firebaseId: studentId,
          refId: generateReferenceId(studentId),
          name: name
        });
      });

      logger.log('🔧 QRScanner student map created:', {
        totalStudents: currentStudents.length,
        studentMapEntries: Object.entries(studentMap).map(([key, value]) => ({ key, value })),
        availableStudentIds: currentStudents.map(s => s.id)
      }); // Debug

      // Fallback: Get all users if no students provided or to find missing students
      if (students.length === 0) {
        logger.debug('[QR Scanner] No students provided, fetching all users as fallback');
        const usersResponse = await getUsers();
        const allUsers = usersResponse.success ? usersResponse.data : [];
        allUsers.forEach(u => {
          const userId = u.id || u.docId;
          const referenceId = u.studentNumber ? `STU-${u.studentNumber}` : (u.referenceId || generateReferenceId(userId));
          const name = u.displayName || u.realName || u.name || (u.email ? u.email.split('@')[0] : 'Unknown');
          if (!studentMap[referenceId]) {
            studentMap[referenceId] = name;
            logger.debug('[QR Scanner] Fallback student map entry:', referenceId, '->', name, '(from userId:', userId, ')');
          }
        });
      }

      // Combine and format activity logs (penalties are now included from separate collection)
      logger.debug('[QR Scanner] Processing', allRecords.length, 'total records');
      logger.debug('[QR Scanner] First record details:', allRecords.length > 0 ? {
        fullRecord: allRecords[0],
        id: allRecords[0]?.id,
        studentId: allRecords[0]?.studentId,
        status: allRecords[0]?.status,
        category: allRecords[0]?.category,
        delta: allRecords[0]?.delta,
        date: allRecords[0]?.date,
        timestamp: allRecords[0]?.timestamp,
        method: allRecords[0]?.method,
        notes: allRecords[0]?.notes,
        reason: allRecords[0]?.reason
      } : 'No attendance records');

      const activityLogs = allRecords.map((record, index) => {
        const studentId = record.studentId;
        let studentName = studentMap[studentId];

        // If not found in map, try to find the student by generating reference ID from user IDs
        if (!studentName && students.length > 0) {
          const foundStudent = students.find(s => {
            const generatedRefId = generateReferenceId(s.id);
            return generatedRefId === studentId || s.id === studentId;
          });
          if (foundStudent) {
            studentName = foundStudent.displayName || foundStudent.name || foundStudent.email?.split('@')[0] || 'Unknown Student';
            logger.log('🔧 Found student by reference/Firebase ID:', studentId, '->', studentName);
          } else {
            logger.log('🔧 Student not found for ID:', studentId, 'Available students:', students.map(s => ({ id: s.id, refId: generateReferenceId(s.id), name: s.displayName })));
          }
        }

        // Final fallback
        if (!studentName) {
          studentName = 'Unknown Student';
        }

        const recordPointsRaw = record.delta !== undefined && record.delta !== null ? record.delta : (record.points !== undefined && record.points !== null ? record.points : 0);
        const recordPoints = (record.category === RECORD_TYPES.PENALTY || record.penaltyType)
            ? -Math.abs(Number(recordPointsRaw) || 0)
            : (record.category === RECORD_TYPES.BEHAVIOR)
                ? -Math.abs(Number(recordPointsRaw) || 0)
                : Number(recordPointsRaw) || 0;

        logger.debug('[QR Scanner] Processing attendance record #' + index + ':', {
          studentId,
          studentName,
          status: record.status,
          category: record.category,
          delta: recordPoints,
          date: record.date,
          timestamp: record.timestamp,
          method: record.method,
          notes: record.notes,
          reason: record.reason,
          description: record.description,
          note: record.note,
          type: record.type,
          availableInMap: !!studentMap[studentId],
          totalStudentsInMap: Object.keys(studentMap).length,
          computedType: record.category || (recordPoints ? (recordPoints > 0 ? RECORD_TYPES.PARTICIPATION : RECORD_TYPES.BEHAVIOR) : RECORD_TYPES.ATTENDANCE)
        });

        const activityLabel = getNote 
      ? getNote(record.notes || record.note || record.reason || record.description) || record.type || ''
      : (record.notes || record.note || record.reason || record.description || record.type || '');

        // Resolve human-readable label per type
        let finalLabel = activityLabel;

        if (record.category === RECORD_TYPES.PENALTY) {
          const penaltyId = record.type;
          const penaltyDef = PENALTY_TYPES.find(pt => pt.id === penaltyId);
          finalLabel = penaltyDef
              ? (lang === 'ar' ? penaltyDef.label_ar : penaltyDef.label_en)
              : penaltyId
              || activityLabel
              || 'Penalty';
        } else if (record.category === RECORD_TYPES.PARTICIPATION) {
          const participationDef = PARTICIPATION_TYPES.find(pt => pt.id === record.type);
          finalLabel = (participationDef ? (lang === 'ar' ? participationDef.label_ar : participationDef.label_en) : null)
              || record.type
              || activityLabel
              || 'Participation';
        } else if (record.category === RECORD_TYPES.BEHAVIOR) {
          const behaviorDef = BEHAVIOR_TYPES.find(bt => bt.id === record.type);
          finalLabel = (behaviorDef ? (lang === 'ar' ? behaviorDef.label_ar : behaviorDef.label_en) : null)
              || record.type
              || activityLabel
              || 'Behavior';
        } else if (record.status) {
          // For attendance records, check if we should show method label instead of notes
          if (record.method && shouldShowMethodLabel(record.method, activityLabel)) {
            // Use localized method label instead of notes
            finalLabel = getAttendanceMethodLabel(record.method, t, lang) || getLocalizedAttendanceLabel(record.status, t, lang) || record.status || 'Attendance';
          } else {
            // Use original attendance status label
            finalLabel = getLocalizedAttendanceLabel(record.status, t, lang) || record.status || 'Attendance';
          }
        }

        const computedType = (record.category === RECORD_TYPES.PENALTY || record.penaltyType)
            ? RECORD_TYPES.PENALTY
            : (record.category || (record.status ? RECORD_TYPES.ATTENDANCE : (recordPoints > 0 ? RECORD_TYPES.PARTICIPATION : (recordPoints < 0 ? RECORD_TYPES.BEHAVIOR : RECORD_TYPES.ATTENDANCE))));

        const finalActivityLog = {
          id: record.id || `attendance-${Math.random()}`,
          time: record.timestamp || record.updatedAt || record.date || record.createdAt,
          type: computedType,
          studentId,
          studentName,
          status: record.status || 'present',
          delta: recordPoints,
          points: recordPoints,
          label: finalLabel,
          method: record.method || ATTENDANCE_METHODS.QR_SCAN,
          performedBy: record.performedBy || user?.uid || '-',
          performedByName: record.performedByName || user?.displayName || '',
          performedByEmail: record.performedByEmail || user?.email || '',
          scanMethod: record.scanMethod || (record.method === ATTENDANCE_METHODS.QR_SCAN ? 'auto' : ATTENDANCE_METHODS.MANUAL_INSTRUCTOR),
          subject: selectedSubjectName,
          program: selectedProgramName,
          class: selectedClassName,
          comment: getNote 
          ? getNote(record.notes || record.note || record.reason || record.description) || ''
          : (record.notes || record.note || record.reason || record.description || ''),
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

      // Remove duplicate attendance records for same student
      const uniqueLogs = [];
      const seen = new Set();

      activityLogs.forEach(log => {
        // Create a unique key based on student and action type
        // For attendance, we only want the latest one
        if (log.type === RECORD_TYPES.ATTENDANCE) {
          const key = `${log.studentId}-${log.type}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueLogs.push(log);
          }
        } else {
          // For behavior/participation/penalty, show all
          uniqueLogs.push(log);
        }
      });

      // Sort by time (newest first)
      uniqueLogs.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA; // Descending order (newest first)
      });

      logger.debug('[QR Scanner] Final activity logs (deduped):', uniqueLogs.length);
      logger.debug('[QR Scanner] First activity log details:', uniqueLogs.length > 0 ? {
        studentId: uniqueLogs[0]?.studentId,
        studentName: uniqueLogs[0]?.studentName,
        status: uniqueLogs[0]?.status,
        type: uniqueLogs[0]?.type,
        delta: uniqueLogs[0]?.delta,
        label: uniqueLogs[0]?.label,
        method: uniqueLogs[0]?.method,
        time: uniqueLogs[0]?.time
      } : t('no_activity_logs') || 'No activity logs');

      // Format time for display
      const formattedLogs = uniqueLogs.map(log => ({
        ...log,
        time: log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : (log.time instanceof Date ? log.time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : log.time || '')
      }));

      setRecentActivity(formattedLogs);
    } catch (error) {
      logger.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [classId, students, user, selectedProgramName, selectedSubjectName, selectedClassName, lang, t]);

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
      return getPenaltyColor(penaltyType);
    }
    
    if (type === RECORD_TYPES.BEHAVIOR && behaviorType) {
      return getBehaviorColor(behaviorType);
    }
    
    if (type === RECORD_TYPES.PARTICIPATION) {
      return '#16a34a'; // Green for participation
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

    // Use centralized attendance color system
    switch(status?.toLowerCase()) {
      case ATTENDANCE_STATUS.PRESENT: 
        return '#16a34a';
      case ATTENDANCE_STATUS.LATE: 
        return '#eab308';
      case ATTENDANCE_STATUS.HUMAN_CASE: 
        return '#8b5cf6';
      case ATTENDANCE_STATUS.ABSENT:
      case ATTENDANCE_STATUS.ABSENT_NO_EXCUSE:
      case ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE:
      case ATTENDANCE_STATUS.EXCUSED_LEAVE:
        return '#dc2626';
      default: 
        return '#6b7280';
    }
  }, []);

  const getStatusIcon = useCallback((status, type, delta) => {
    if (type === RECORD_TYPES.PARTICIPATION || delta > 0) {
      return <ParticipationIcon style={{ width: '12px', height: '12px' }} />;
    }
    if (type === RECORD_TYPES.PENALTY) {
      return <PenaltyIcon style={{ width: '12px', height: '12px' }} />;
    }
    if (type === RECORD_TYPES.BEHAVIOR || delta < 0) {
      return <ZapIcon style={{ width: '12px', height: '12px' }} />;
    }

    // Use unified attendance icons for attendance types
    if (type === RECORD_TYPES.ATTENDANCE || status) {
      const iconName = getAttendanceIcon(status);
      
      const iconMap = {
        CheckCircle: <CheckSmallIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />,
        Clock: <ClockSmallIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />,
        AlertCircle: <AlertCircleIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />,
        XCircle: <XSmallIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />,
        Heart: <HeartIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />,
        HelpCircle: <HelpCircleIcon style={{ width: '16px', height: '16px', color: '#ffffff' }} />
      };
      
      return iconMap[iconName] || iconMap.HelpCircle;
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
  const handleMarkAttendance = useCallback(async (studentIdOrStatus, statusOrNotes, notes) => {
    // Check if this is called from scan dialog (status, notes) or from elsewhere (studentId, status)
    const isFromScanDialog = typeof studentIdOrStatus === 'string' && 
                             [
                               ATTENDANCE_STATUS.PRESENT,
                               ATTENDANCE_STATUS.LATE,
                               ATTENDANCE_STATUS.ABSENT_NO_EXCUSE,
                               ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE,
                               ATTENDANCE_STATUS.EXCUSED_LEAVE,
                               ATTENDANCE_STATUS.HUMAN_CASE
                             ].includes(studentIdOrStatus);
    
    if (isFromScanDialog) {
      // Called from scan dialog: handleMarkAttendance(status, notes)
      const status = studentIdOrStatus;
      const scanNotes = statusOrNotes;
      
      setActionLoading(true);
      setCurrentAction(status);

      try {
        const today = formatQatarDateOnly(getQatarNow());
        const todayISO = getQatarNow().toISOString().split('T')[0]; // Use ISO format for database

        // Get the correct student ID - try multiple possible fields
        let studentId = lastScannedStudent?.id ||
            lastScannedStudent?.userId ||
            lastScannedStudent?.studentId ||
            lastScannedStudent?.docId;

        // If still no student ID, try to find it in the students array
        if (!studentId) {
          const searchField = lastScannedStudent?.studentNumber || lastScannedStudent?.referenceId;
          if (searchField) {
            const foundStudent = students.find(s => 
              s.studentNumber === searchField || 
              s.referenceId === searchField ||
              s.studentId === searchField ||
              `STU-${s.studentNumber}` === searchField ||
              generateReferenceId(s.id) === searchField
            );
            studentId = foundStudent?.id;
          }
        }

        if (!studentId) {
          throw new Error(`Student ID not found. Student data: ${JSON.stringify(lastScannedStudent)}`);
        }

        logger.debug('Using studentId:', studentId);

        // Check if already marked with any attendance status today
        const studentIdentifier = lastScannedStudent?.studentNumber || lastScannedStudent?.referenceId;
        const isMarked = await isStudentMarkedToday(classId, studentIdentifier);
        if (isMarked) {
          showResult('info', 'Student is already marked for today.');
          setShowScanDialog(false);
          return;
        }

        // Get performedBy fields using shared service
        const performedByFields = await getPerformedByFields(user);

        // Mark attendance
        const result = await markAttendance({
          classId,
          studentId: studentId,
          programId: selectedProgramId,
          subjectId: selectedSubjectId,
          date: todayISO, // Use ISO format for database
          status,
          markedBy: user.uid,
          method: ATTENDANCE_METHODS.MANUAL_INSTRUCTOR,
          notes: scanNotes,
          ...performedByFields
        });

        if (result.success) {
          setShowScanDialog(false);
          const statusLabel = getLocalizedAttendanceLabel(status, t, lang);
          showResult('success', `Student marked as ${statusLabel} successfully!`, status);

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
              logger.debug(`[QR Scanner] Triggering activity refresh after marking ${status}`);
              fetchRecentActivity();
            });
          }
        } else {
          showResult('error', result.error || 'Failed to mark attendance');
        }
      } catch (error) {
        addDebugLog(`❌ Error marking attendance (${status}): ${error.message}`, 'error');
        showResult('error', `Failed to mark attendance: ${error.message}`);
      } finally {
        setActionLoading(false);
        setCurrentAction(null);
      }
    } else {
      // Original functionality: handleMarkAttendance(studentId, status)
      const studentId = studentIdOrStatus;
      const status = statusOrNotes;
      
      try {
        const today = formatQatarDateOnly(getQatarNow());
        const todayISO = getQatarNow().toISOString().split('T')[0]; // Use ISO format for database
        
        // Get performedBy fields using shared service
        const performedByFields = await getPerformedByFields(user);

        await markAttendance({
          classId: selectedClassId,
          studentId,
          date: todayISO, // Use ISO format for database
          status,
          markedBy: user.uid,
          method: 'manual',
          ...performedByFields
        });

        // Emit event for real-time updates
        eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
          studentId,
          classId: selectedClassId,
          status,
          performedBy: user,
          timestamp: new Date()
        });

        showSuccess('Attendance marked successfully');
      } catch (error) {
        logger.error('Error marking attendance:', error);
        showError('Failed to mark attendance');
      }
    }
  }, [selectedClassId, user, lastScannedStudent, students, classId, lang, t, onActivityUpdate, fetchRecentActivity, showResult, addDebugLog, showSuccess, showError]);

  // Senior-Level Quick Attendance Handler
  const handleQuickAttendance = useCallback(async (student, status) => {
    if (!student || !status) return;
    
    // Show immediate visual feedback
    const statusLabel = getLocalizedAttendanceLabel(status, t, lang);
    addDebugLog(`⚡ ${t('quick') || 'Quick'} marking ${student.displayName || student.name} as ${statusLabel}`, 'info');
    
    try {
      // Use the dedicated roster quick action method
      const result = await rosterQuickAction(
        student.id,
        selectedClassId,
        status,
        user,
        `${t('quick') || 'Quick'} ${statusLabel}`,
        selectedProgramId,
        selectedSubjectId,
        getQatarNow().toISOString().split('T')[0] // Current date in ISO format
      );

      if (result.success) {
        // Show success feedback
        showResult('success', `${student.displayName || student.name} marked as ${statusLabel}!`, status);
        
        // Emit real-time event
        eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
          studentId: student.id,
          studentNumber: student.studentNumber,
          referenceId: student.referenceId,
          classId: selectedClassId,
          status,
          performedBy: user,
          timestamp: new Date(),
          quickAction: true
        });

        // Refresh activity to show the change
        if (onActivityUpdate) {
          onActivityUpdate(() => {
            fetchRecentActivity();
          });
        }

        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50); // Short vibration for success
        }

      } else {
        showResult('error', result.error || `Failed to mark ${statusLabel}`);
      }
    } catch (error) {
      addDebugLog(`❌ Quick attendance error: ${error.message}`, 'error');
      showResult('error', `Failed to mark ${statusLabel}: ${error.message}`);
    }
  }, [selectedClassId, user, lang, t, onActivityUpdate, fetchRecentActivity, showResult, addDebugLog]);

  // Fetch activity when classId and students change
  useEffect(() => {
    // Only fetch if we have a valid classId (not 'all') AND students
    if (classId && classId !== 'all' && students && students.length > 0) {
      logger.log('🔧 Fetching activity - classId:', classId, 'students:', students.length);
      // Use a timeout to ensure the latest students state is captured
      setTimeout(() => {
        fetchRecentActivity();
      }, 50);
    } else {
      logger.log('🔧 Skipping activity fetch - classId:', classId, 'students:', students?.length || 0);
      // Clear activity when conditions aren't met
      setRecentActivity([]);
      setActivityLoading(false);
    }
  }, [classId, students, fetchRecentActivity]);

  // Notify parent when minimization state changes
  useEffect(() => {
    if (onMinimizeChange) {
      onMinimizeChange(isMinimized);
    }
  }, [isMinimized, onMinimizeChange]);

  // Add debug logging for props
  useEffect(() => {
    logger.log('🔧 QRScanner props updated:', {
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
          sectionId="qr-scanner"
          title={t('qr_scanner') || 'QR Scanner'}
          titleStyle={{ fontSize: '0.75rem' }}
          icon={<QrCodeIcon />}
          color="#8b5cf6"
          defaultMode="full"
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
          borderRadius: '0.75rem',
          border: '1px solid var(--border, #e5e7eb)',
          padding: '1.5rem'
        }}>
          <div style={{
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
              padding: '0.25rem 0.5rem',
              background: isScanning ? '#dcfce7' : '#dbeafe',
              color: isScanning ? '#166534' : '#1e40af',
              borderRadius: '0.375rem',
              fontWeight: 500
            }}>
          {isScanning ? t('scanning') || 'SCANNING' : t('idle') || 'IDLE'}
        </span>
          </div>

          <div style={{
            background: '#0f172a',
            borderRadius: '0.5rem',
            aspectRatio: isMobile ? '1/1' : '4/3',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            maxWidth: isMobile ? '100%' : '600px',
            margin: isMobile ? '0 auto 1rem auto' : '0 auto 1rem auto'
          }}>
            {loading ? (
                <div style={{ textAlign: 'center', zIndex: 10, position: 'relative', background: 'white', padding: '2rem' }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    border: '3px solid #1e293b',
                    borderTop: '3px solid #8b5cf6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 0.75rem'
                  }}></div>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                    {t('loading') || 'Loading...'}
                  </p>
                </div>
            ) : !isScanning ? (
                <div style={{
                  textAlign: 'center',
                  zIndex: 1,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%'
                }}>
                  <p style={{ color: '#ffffff', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>
                    {t('tap_to_activate')}
                  </p>
                  {error && (
                      <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {error}
                      </p>
                  )}
                </div>
            ) : (
                <>
                  <video
                      ref={videoRef}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      playsInline
                      muted
                  />
                  <canvas
                      ref={canvasRef}
                      style={{ display: 'none' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      width: '60%',
                      height: '60%',
                      border: '2px solid #8b5cf6',
                      borderRadius: '0.5rem',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '1rem',
                        height: '1rem',
                        borderTop: '3px solid #8b5cf6',
                        borderLeft: '3px solid #8b5cf6'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '1rem',
                        height: '1rem',
                        borderTop: '3px solid #8b5cf6',
                        borderRight: '3px solid #8b5cf6'
                      }} />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '1rem',
                        height: '1rem',
                        borderBottom: '3px solid #8b5cf6',
                        borderLeft: '3px solid #8b5cf6'
                      }} />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '1rem',
                        height: '1rem',
                        borderBottom: '3px solid #8b5cf6',
                        borderRight: '3px solid #8b5cf6'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: '#8b5cf6',
                        animation: 'qr-scan-line 2s linear infinite'
                      }} />
                    </div>
                  </div>
                </>
            )}

            <Button
                onClick={toggleCamera}
                variant="ghost"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: isScanning ? 0 : 2
                }}
            >
              <span className="qr-sr-only">{isScanning ? t('stop_camera') : t('activate_camera')}</span>
            </Button>
          </div>

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
                      fontSize: '0.7rem',
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

                <PortalTooltip content={(!selectedProgramId || !selectedSubjectId || !selectedClassId) ? t('please_select_program_subject_class') : t('manual_student_id_input')} position="top">
                <button
                    onClick={() => {
                      // Check if all required fields are selected before allowing manual input
                      if (!selectedProgramId || !selectedSubjectId || !selectedClassId) {
                        showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
                        return;
                      }
                      setShowManualInput(!showManualInput);
                    }}
                    disabled={!selectedProgramId || !selectedSubjectId || !selectedClassId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border, #e5e7eb)',
                      background: (!selectedProgramId || !selectedSubjectId || !selectedClassId) ? '#f3f4f6' : (showManualInput ? '#3b82f6' : 'white'),
                      color: (!selectedProgramId || !selectedSubjectId || !selectedClassId) ? '#9ca3af' : (showManualInput ? 'white' : 'var(--text, #111827)'),
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: (!selectedProgramId || !selectedSubjectId || !selectedClassId) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: (!selectedProgramId || !selectedSubjectId || !selectedClassId) ? 0.6 : 1
                    }}
                  >
                    <UserInputIcon style={{ width: '14px', height: '14px' }} />
                  </button>
                </PortalTooltip>

                <PortalTooltip content={(!selectedProgramId || !selectedSubjectId || !selectedClassId) ? t('please_select_program_subject_class') : (t('bulk_scan') || 'Bulk Scan')} position="top">
                <button
                    onClick={() => {
                      if (!selectedProgramId || !selectedSubjectId || !selectedClassId) {
                        showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
                        return;
                      }
                      setShowBulkScanDialog(true);
                    }}
                    disabled={!selectedProgramId || !selectedSubjectId || !selectedClassId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border, #e5e7eb)',
                      background: (!selectedProgramId || !selectedSubjectId || !selectedClassId) ? '#f3f4f6' : '#8b5cf6',
                      color: (!selectedProgramId || !selectedSubjectId || !selectedClassId) ? '#9ca3af' : 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: (!selectedProgramId || !selectedSubjectId || !selectedClassId) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: (!selectedProgramId || !selectedSubjectId || !selectedClassId) ? 0.6 : 1
                    }}
                  >
                    <Upload style={{ width: '14px', height: '14px' }} />
                  </button>
                </PortalTooltip>

                <PortalTooltip content={t('refresh_today_activity')} position="top">
                  <button
                    onClick={() => {
                      // Force refresh with current students
                      if (students && students.length > 0) {
                        fetchRecentActivity();
                      } else {
                        showResult('error', 'No students available to refresh');
                      }
                    }}
                    disabled={!selectedProgramId || !selectedSubjectId || !selectedClassId || students.length === 0 || activityLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.375rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border, #e5e7eb)',
                      background: (!selectedProgramId || !selectedSubjectId || !selectedClassId || students.length === 0 || activityLoading) ? '#f3f4f6' : '#10b981',
                      color: (!selectedProgramId || !selectedSubjectId || !selectedClassId || students.length === 0 || activityLoading) ? '#9ca3af' : 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: (!selectedProgramId || !selectedSubjectId || !selectedClassId || students.length === 0 || activityLoading) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: (!selectedProgramId || !selectedSubjectId || !selectedClassId || students.length === 0 || activityLoading) ? 0.6 : 1
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

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                [isRTL ? 'paddingRight' : 'paddingLeft']: '1rem',
                [isRTL ? 'borderRight' : 'borderLeft']: '3px solid #8b5cf6',
                maxHeight: '400px', // Limit height
                overflowY: 'auto' // Add vertical scrollbar
              }}>
                {/* Real activity logs from Firebase */}
                {activityLoading ? (
                    <div style={{
                      padding: '1rem',
                      color: '#9ca3af',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>
                      {t('loading')}...
                    </div>
                ) : recentActivity.length === 0 ? (
                    <div style={{
                      padding: '1rem',
                      color: '#9ca3af',
                      fontSize: '0.875rem'
                    }}>
                      {t('no_todays_transactions') || 'No transactions Today'}
                    </div>
                ) : (
                    recentActivity.map((activity) => {
                      // Removed debug logging for cleaner console

                      return (
                          <div key={activity.id} style={{
                            borderBottom: '1px solid #e5e7eb',
                            paddingBottom: expandedActivities.has(activity.id) ? '0.5rem' : '0.125rem'
                          }}>
                            <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  padding: '0.25rem 0',
                                  cursor: 'pointer'
                                }}
                                onClick={() => toggleActivityExpansion(activity.id)}
                            >
                              <div style={{
                                padding: '0.125rem 0.375rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: getStatusColor(activity.status, activity.type, activity.delta, activity.penaltyType, activity.behaviorType),
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.125rem'
                              }}>
                                {(() => {
                                  // Removed debug logging for cleaner console
                                  return getStatusIcon(activity.status, activity.type, activity.delta);
                                })()} {getStatusLabel(activity.status, activity.type, activity.delta)}
                                {(activity.type === RECORD_TYPES.PENALTY || activity.type === RECORD_TYPES.PARTICIPATION || activity.type === RECORD_TYPES.BEHAVIOR) && activity.points && (
                                  <span style={{ marginLeft: '0.25rem' }}>({activity.points})</span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #374151)', flex: 1 }}>
                      {activity.studentName}
                    </span>
                    
                    {/* Senior-Level Quick Actions - Only for Attendance Records */}
                    {activity.studentId && activity.type === RECORD_TYPES.ATTENDANCE && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        marginRight: '0.5rem'
                      }}>
                        {/* Quick Present Button */}
                        <PortalTooltip content={(() => {
                            const student = students.find(s => s.id === activity.studentId);
                            return student?.attendance === 'present' ? t('already_marked_present') : t('mark_present');
                          })()} position="top">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const student = students.find(s => s.id === activity.studentId);
                            if (student) {
                              await handleQuickAttendance(student, 'present');
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          disabled={activity.studentId && (() => {
                            const student = students.find(s => s.id === activity.studentId);
                            return student?.attendance === 'present';
                          })()}
                          style={{
                            background: (() => {
                              const student = students.find(s => s.id === activity.studentId);
                              return student?.attendance === 'present' ? '#9ca3af' : getAttendanceColor('present');
                            })(),
                            border: 'none',
                            color: 'white',
                            cursor: (() => {
                              const student = students.find(s => s.id === activity.studentId);
                              return student?.attendance === 'present' ? 'not-allowed' : 'pointer';
                            })(),
                            padding: '0.25rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            boxShadow: (() => {
                              const student = students.find(s => s.id === activity.studentId);
                              return student?.attendance === 'present' ? 'none' : `0 2px 4px ${getAttendanceColor('present')}30`;
                            })(),
                            opacity: (() => {
                              const student = students.find(s => s.id === activity.studentId);
                              return student?.attendance === 'present' ? 0.6 : 1;
                            })(),
                            minWidth: '24px',
                            height: '24px'
                          }}
                          onMouseEnter={(e) => {
                            const student = students.find(s => s.id === activity.studentId);
                            if (student?.attendance !== 'present') {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('present')}40`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            const student = students.find(s => s.id === activity.studentId);
                            if (student?.attendance !== 'present') {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('present')}30`;
                            }
                          }}
                        >
                          <CheckSmallIcon style={{ width: '12px', height: '12px' }} />
                        </button>
                        </PortalTooltip>

                        {/* Quick Late Button */}
                        <PortalTooltip content={(() => {
                            const student = students.find(s => s.id === activity.studentId);
                            return student?.attendance === 'late' ? t('already_marked_late') : t('mark_late');
                          })()} position="top">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const student = students.find(s => s.id === activity.studentId);
                            if (student) {
                              await handleQuickAttendance(student, 'late');
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          disabled={activity.studentId && (() => {
                            const student = students.find(s => s.id === activity.studentId);
                            return student?.attendance === 'late';
                          })()}
                          style={{
                            background: (() => {
                              const student = students.find(s => s.id === activity.studentId);
                              return student?.attendance === 'late' ? '#9ca3af' : getAttendanceColor('late');
                            })(),
                            border: 'none',
                            color: 'white',
                            cursor: (() => {
                              const student = students.find(s => s.id === activity.studentId);
                              return student?.attendance === 'late' ? 'not-allowed' : 'pointer';
                            })(),
                            padding: '0.25rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            boxShadow: (() => {
                              const student = students.find(s => s.id === activity.studentId);
                              return student?.attendance === 'late' ? 'none' : `0 2px 4px ${getAttendanceColor('late')}30`;
                            })(),
                            opacity: (() => {
                              const student = students.find(s => s.id === activity.studentId);
                              return student?.attendance === 'late' ? 0.6 : 1;
                            })(),
                            minWidth: '24px',
                            height: '24px'
                          }}
                          onMouseEnter={(e) => {
                            const student = students.find(s => s.id === activity.studentId);
                            if (student?.attendance !== 'late') {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('late')}40`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            const student = students.find(s => s.id === activity.studentId);
                            if (student?.attendance !== 'late') {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('late')}30`;
                            }
                          }}
                        >
                          <ClockSmallIcon style={{ width: '12px', height: '12px' }} />
                        </button>
                        </PortalTooltip>
                      </div>
                    )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {onDeleteActivity && (
                                    <PortalTooltip content={t('delete_activity')} position="top">
                                    <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteActivity(activity);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: 'var(--color-danger, #ef4444)',
                                          cursor: 'pointer',
                                          padding: '0.25rem',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '0.25rem'
                                        }}
                                      >
                                        <DeleteIcon style={{ width: '14px', height: '14px' }} />
                                      </button>
                                    </PortalTooltip>
                                )}
                                <ChevronDownIcon
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      transform: expandedActivities.has(activity.id) ? (isRTL ? 'rotate(180deg)' : 'rotate(180deg)') : (isRTL ? 'rotate(90deg)' : 'rotate(0deg)'),
                                      transition: 'transform 0.2s',
                                      color: '#6b7280'
                                    }}
                                />
                              </div>
                            </div>

                            {expandedActivities.has(activity.id) && (
                                <div style={{
                                  paddingLeft: '0.5rem',
                                  paddingTop: '0.5rem',
                                  fontSize: '0.75rem',
                                  color: '#6b7280',
                                  display: isMobile ? 'flex' : 'block',
                                  flexDirection: isMobile ? 'column' : 'none',
                                  gap: isMobile ? '0.15rem' : '0'
                                }}>
                                  <div style={{ marginBottom: '0.15rem' }}>
                                    {/*<strong>{t('date') || 'Date'}:</strong> */}
                                    {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')} {activity.time?.toDate ? activity.time.toDate().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (activity.time instanceof Date ? activity.time.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : activity.time || '')}
                                  </div>
                                  {activity.subject && (
                                      <div style={{ marginBottom: '0.25rem' }}>
                                        {/*<strong>{t('subject') || 'Subject'}:</strong> */}
                                        {activity.subject}
                                      </div>
                                  )}
                                  {activity.program && (
                                      <div style={{ marginBottom: '0.25rem' }}>
                                        {/*<strong>{t('program') || 'Program'}:</strong>*/}
                                        {activity.program}
                                      </div>
                                  )}
                                  {activity.class && (
                                      <div style={{ marginBottom: '0.25rem' }}>
                                        {/*<strong>{t('class') || 'Class'}:</strong> */}
                                        {activity.class}
                                      </div>
                                  )}
                                  <PerformedBy 
                                    performedByName={activity.performedByName}
                                    performedBy={activity.performedBy}
                                  />
                                  {activity.comment && (
                                      <div style={{ marginBottom: '0.25rem' }}>
                                        {activity.comment}
                                      </div>
                                  )}
                                  {activity.label && activity.type === RECORD_TYPES.PENALTY && (
                                      <div style={{ marginBottom: '0.25rem' }}>
                                        {activity.label || t('penalty_type') || 'Penalty Type'}
                                      </div>
                                  )}
                                  {activity.type === RECORD_TYPES.PARTICIPATION && (
                                      <div style={{ marginBottom: '0.25rem' }}>
                                        {activity.label || t('participation') || 'Participation'}
                                      </div>
                                  )}
                                  {activity.type === RECORD_TYPES.BEHAVIOR && (
                                      <div style={{ marginBottom: '0.25rem' }}>
                                        {/*<strong>{t('behavior_type') || 'Behavior Type'}</strong> */}
                                        {activity.label || t('behavior') || 'Behavior'}
                                      </div>
                                  )}
                                </div>
                            )}
                          </div>
                      );
                    })
                )}
              </div>


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

          {/* Scan Action Dialog */}
          {showScanDialog && lastScannedStudent && selectedProgramId && selectedSubjectId && selectedClassId && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                overflow: 'hidden' // Prevent scrolling
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: isMobile ? '0' : '0.5rem',
                  padding: isMobile ? '1rem' : '1.5rem',
                  width: isMobile ? '100vw' : '400px',
                  maxWidth: isMobile ? '100vw' : '400px',
                  minWidth: isMobile ? '100vw' : '350px',
                  height: isMobile ? '100vh' : 'auto',
                  maxHeight: isMobile ? '100vh' : '80vh',
                  overflow: 'auto',
                  position: isMobile ? 'fixed' : 'relative',
                  top: isMobile ? '0' : 'auto',
                  left: isMobile ? '0' : 'auto'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: '0 0 1rem 0'
                  }}>
                    {t('choose_action') || 'Choose Action'}
                  </h3>

                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    <strong>{t('scanned_student') || 'Scanned Student'}:</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      {lastScannedStudent.name || lastScannedStudent.displayName || lastScannedStudent.email ? (
                          <div style={{ fontWeight: 500, color: '#111827' }}>
                            {lastScannedStudent.name || lastScannedStudent.displayName || lastScannedStudent.email}
                          </div>
                      ) : (
                          <div style={{ fontStyle: 'italic' }}>
                            {t('no_name_available') || 'Not available'}
                          </div>
                      )}

                      {lastScannedStudent.email && lastScannedStudent.name && (
                          <div style={{ color: '#4b5563', marginTop: '0.25rem' }}>
                            {lastScannedStudent.email}
                          </div>
                      )}

                      {lastScannedStudent.studentNumber && (
                          <div style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                            {t('student_number') || 'Student Number'}: {lastScannedStudent.studentNumber}
                          </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '0.75rem'
                  }}>
                    {/* First Row: Primary Actions */}
                    <button
                        onClick={async () => {
                          await handleMarkAttendance('present', 'Manual');
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === 'present' ? '#94a3b8' : '#10b981',
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#059669';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#10b981';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                          }
                        }}
                    >
                      {actionLoading && currentAction === 'present' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <CheckSmallIcon style={{ width: '18px', height: '18px' }} />
                            {t('present') || 'Present'}
                          </>
                      )}
                    </button>

                    <button
                        onClick={async () => {
                          await handleMarkAttendance('late', 'Marked late manually');
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === 'late' ? '#94a3b8' : '#f59e0b',
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#d97706';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#f59e0b';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.2)';
                          }
                        }}
                    >
                      {actionLoading && currentAction === 'late' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <ClockSmallIcon style={{ width: '18px', height: '18px' }} />
                            {t('late') || 'Late'}
                          </>
                      )}
                    </button>

                    {/* Additional Attendance Status Buttons */}
                    <button
                        onClick={async () => {
                          await handleMarkAttendance(ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, 'Marked absent (no excuse) manually');
                        }}
                        disabled={actionLoading}
                        style={getActionButtonStyles(QR_SCANNER_ACTIONS.MARK_ABSENT_NO_EXCUSE, actionLoading)}
                    >
                      {actionLoading && currentAction === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <XSmallIcon style={{ width: '18px', height: '18px' }} />
                            {t('absent_no_excuse') || 'Absent (No Excuse)'}
                          </>
                      )}
                    </button>

                    <button
                        onClick={async () => {
                          await handleMarkAttendance('absent_with_excuse', 'Marked absent (with excuse) manually');
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === 'absent_with_excuse' ? '#94a3b8' : getAttendanceColor('absent_with_excuse'),
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: `0 2px 4px ${getAttendanceColor('absent_with_excuse')}20`
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            const color = getAttendanceColor('absent_with_excuse');
                            e.target.style.background = color + 'dd';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('absent_with_excuse')}40`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = getAttendanceColor('absent_with_excuse');
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('absent_with_excuse')}20`;
                          }
                        }}
                    >
                      {actionLoading && currentAction === 'absent_with_excuse' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <XSmallIcon style={{ width: '18px', height: '18px' }} />
                            {t('absent_with_excuse') || 'Absent (With Excuse)'}
                          </>
                      )}
                    </button>

                    <button
                        onClick={async () => {
                          await handleMarkAttendance('excused_leave', 'Marked excused leave manually');
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === 'excused_leave' ? '#94a3b8' : getAttendanceColor('excused_leave'),
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: `0 2px 4px ${getAttendanceColor('excused_leave')}20`
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            const color = getAttendanceColor('excused_leave');
                            e.target.style.background = color + 'dd';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('excused_leave')}40`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = getAttendanceColor('excused_leave');
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('excused_leave')}20`;
                          }
                        }}
                    >
                      {actionLoading && currentAction === 'excused_leave' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <XSmallIcon style={{ width: '18px', height: '18px' }} />
                            {t('excused_leave') || 'Excused Leave'}
                          </>
                      )}
                    </button>

                    <button
                        onClick={async () => {
                          await handleMarkAttendance('human_case', 'Marked human case manually');
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === 'human_case' ? '#94a3b8' : getAttendanceColor('human_case'),
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: `0 2px 4px ${getAttendanceColor('human_case')}20`
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            const color = getAttendanceColor('human_case');
                            e.target.style.background = color + 'dd';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = `0 4px 8px ${getAttendanceColor('human_case')}40`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = getAttendanceColor('human_case');
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = `0 2px 4px ${getAttendanceColor('human_case')}20`;
                          }
                        }}
                    >
                      {actionLoading && currentAction === 'human_case' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <HeartIcon style={{ width: '18px', height: '18px' }} />
                            {t('human_case') || 'Human Case'}
                          </>
                      )}
                    </button>

                    {/* Second Row: Secondary Actions */}
                    <button
                        onClick={async () => {
                          logger.log('⚡ Add penalty');
                          addDebugLog('⚡ Adding penalty', 'info');

                          setActionLoading(true);
                          setCurrentAction('penalty');

                          try {
                            // For manual scan, use the student data we already have
                            // For QR scan, use processStudentData to get complete student data
                            let studentData;
                            if (lastScannedStudent?.referenceId) {
                              studentData = await processStudentData(lastScannedStudent.referenceId);
                            } else if (lastScannedStudent?.id) {
                              // Use the student data we already have from manual scan
                              studentData = {
                                id: lastScannedStudent.id,
                                docId: lastScannedStudent.id,
                                studentId: lastScannedStudent.studentNumber || lastScannedStudent.id,
                                studentNumber: lastScannedStudent.studentNumber,
                                name: lastScannedStudent.name || lastScannedStudent.displayName,
                                displayName: lastScannedStudent.displayName,
                                email: lastScannedStudent.email,
                                referenceId: lastScannedStudent.referenceId || generateReferenceId(lastScannedStudent.id)
                              };
                            }

                            if (studentData) {
                              setInitialTab('penalty');
                              setStudentForAction(studentData);
                              setShowStudentActionZapPanel(true);
                              setShowScanDialog(false);
                              addDebugLog(`✅ Found student for penalty: ${studentData.name || studentData.email}`, 'success');
                            } else {
                              showResult('error', 'Student not found with this reference ID');
                            }
                          } catch (error) {
                            addDebugLog(`❌ Error adding penalty: ${error.message}`, 'error');
                            showResult('error', `Failed to add penalty: ${error.message}`);
                          } finally {
                            setActionLoading(false);
                            setCurrentAction(null);
                          }
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === RECORD_TYPES.PENALTY ? '#94a3b8' : '#ef4444',
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#dc2626';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#ef4444';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                          }
                        }}
                    >
                      {actionLoading && currentAction === RECORD_TYPES.PENALTY ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <PenaltyIcon style={{ width: '18px', height: '18px' }} />
                            {t('penalty') || 'Penalty'}
                          </>
                      )}
                    </button>

                    <button
                        onClick={async () => {
                          logger.log('👥 Open participation actions');
                          addDebugLog('👥 Opening participation actions', 'info');

                          setActionLoading(true);
                          setCurrentAction('participation');

                          try {
                            // For manual scan, use the student data we already have
                            // For QR scan, use processStudentData to get complete student data
                            let studentData;
                            if (lastScannedStudent?.referenceId) {
                              studentData = await processStudentData(lastScannedStudent.referenceId);
                            } else if (lastScannedStudent?.id) {
                              // Use the student data we already have from manual scan
                              studentData = {
                                id: lastScannedStudent.id,
                                docId: lastScannedStudent.id,
                                studentId: lastScannedStudent.studentNumber || lastScannedStudent.id,
                                studentNumber: lastScannedStudent.studentNumber,
                                name: lastScannedStudent.name || lastScannedStudent.displayName,
                                displayName: lastScannedStudent.displayName,
                                email: lastScannedStudent.email,
                                referenceId: lastScannedStudent.referenceId || generateReferenceId(lastScannedStudent.id)
                              };
                            }

                            if (studentData) {
                              setInitialTab('participation');
                              setStudentForAction(studentData);
                              setShowStudentActionZapPanel(true);
                              setShowScanDialog(false);
                              addDebugLog(`✅ Found student for participation: ${studentData.name || studentData.email}`, 'success');
                              addDebugLog(`🔍 Setting studentForAction and showing new panel`, 'info');
                            } else {
                              showResult('error', 'Student not found with this reference ID');
                            }
                          } catch (error) {
                            addDebugLog(`❌ Error opening participation actions: ${error.message}`, 'error');
                            showResult('error', `Failed to open participation actions: ${error.message}`);
                          } finally {
                            setActionLoading(false);
                            setCurrentAction(null);
                          }
                        }}
                        disabled={actionLoading}
                        style={{
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === RECORD_TYPES.PARTICIPATION ? '#94a3b8' : '#3b82f6',
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#2563eb';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#3b82f6';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                          }
                        }}
                    >
                      {actionLoading && currentAction === RECORD_TYPES.PARTICIPATION ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <ParticipationIcon style={{ width: '18px', height: '18px' }} />
                            {t('participation') || 'Participation'}
                          </>
                      )}
                    </button>
                  </div>

                  {/* Third Row: Actions and Details */}
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '0.75rem',
                    marginTop: '0.5rem'
                  }}>
                    {/* Details Button - Opens StudentActionStatsPanel */}
                    <button
                        onClick={async () => {
                          logger.log('📋 Open student details');
                          addDebugLog('📋 Opening student details', 'info');

                          setActionLoading(true);
                          setCurrentAction('details');

                          try {
                            // Debug logging to understand the data structure
                            logger.log('🔍 Debug - lastScannedStudent:', lastScannedStudent);
                            logger.log('🔍 Debug - students array length:', students?.length);
                            
                            // Try to get student reference from multiple sources
                            let studentReferenceId = null;
                            
                            // First try from lastScannedStudent
                            if (lastScannedStudent?.referenceId) {
                              studentReferenceId = lastScannedStudent.referenceId;
                              logger.log('🔍 Found referenceId from lastScannedStudent:', studentReferenceId);
                            }
                            // Try from lastScannedStudent.studentId
                            else if (lastScannedStudent?.studentId) {
                              studentReferenceId = lastScannedStudent.studentId;
                              logger.log('🔍 Found studentId from lastScannedStudent:', studentReferenceId);
                            }
                            // Try to find student by name from the activity
                            else if (activity?.studentName && students?.length > 0) {
                              logger.log('🔍 Searching for student by name:', activity.studentName);
                              const foundStudent = students.find(s => 
                                s.name === activity.studentName || 
                                s.displayName === activity.studentName ||
                                s.email === activity.studentName
                              );
                              logger.log('🔍 Found student by name:', foundStudent);
                              if (foundStudent?.studentId) {
                                studentReferenceId = foundStudent.studentId;
                                logger.log('🔍 Found studentId from name lookup:', studentReferenceId);
                              }
                            }
                            
                            logger.log('🔍 Final studentReferenceId:', studentReferenceId);
                            
                            if (studentReferenceId) {
                              const studentData = await processStudentData(studentReferenceId);
                              if (studentData) {
                                setStudentForAction(studentData);
                                setShowStudentActionStatsPanel(true); // Use the Stats panel for details
                                setShowScanDialog(false);
                                addDebugLog(`✅ Opening details for: ${studentData.name || studentData.email || 'Unknown'} (${studentReferenceId})`, 'success');
                              } else {
                                showResult('error', 'Student data not found');
                              }
                            } else {
                              showResult('error', 'No student reference ID available');
                              addDebugLog('❌ Could not find student reference ID', 'error');
                            }
                          } catch (error) {
                            addDebugLog(`❌ Error opening student details: ${error.message}`, 'error');
                            showResult('error', `Failed to open student details: ${error.message}`);
                          } finally {
                            setActionLoading(false);
                            setCurrentAction(null);
                          }
                        }}
                        disabled={actionLoading}
                        style={{
                          display: 'none', // Hidden as requested
                          flex: isMobile ? 1 : 2,
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === 'details' ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'center',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)',
                          order: isMobile ? -1 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 12px rgba(139, 92, 246, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 6px rgba(139, 92, 246, 0.3)';
                          }
                        }}
                    >
                      {actionLoading && currentAction === 'details' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <DetailsIcon style={{ width: '18px', height: '18px' }} />
                            {t('details') || 'Details'}
                          </>
                      )}
                    </button>

                    {/* Actions Button - Opens StudentActionZapPanel */}
                    <button
                        onClick={async () => {
                          logger.log('🎯 Open student actions');
                          addDebugLog('🎯 Opening student actions', 'info');

                          setActionLoading(true);
                          setCurrentAction('actions');

                          try {
                            // For manual scan, use the student data we already have
                            // For QR scan, use processStudentData to get complete student data
                            let studentData;
                            if (lastScannedStudent?.referenceId) {
                              studentData = await processStudentData(lastScannedStudent.referenceId);
                            } else if (lastScannedStudent?.id) {
                              // Use the student data we already have from manual scan
                              studentData = {
                                id: lastScannedStudent.id,
                                docId: lastScannedStudent.id,
                                studentId: lastScannedStudent.studentNumber || lastScannedStudent.id,
                                studentNumber: lastScannedStudent.studentNumber,
                                name: lastScannedStudent.name || lastScannedStudent.displayName,
                                displayName: lastScannedStudent.displayName,
                                email: lastScannedStudent.email,
                                referenceId: lastScannedStudent.referenceId || generateReferenceId(lastScannedStudent.id)
                              };
                            }

                            if (studentData) {
                              setStudentForAction(studentData);
                              setShowStudentActionZapPanel(true); // Use the Zap panel for actions
                              setShowScanDialog(false);
                              addDebugLog(`✅ Opening actions for: ${studentData.name || studentData.email || 'Unknown'}`, 'success');
                            } else {
                              showResult('error', 'Student data not found');
                            }
                          } catch (error) {
                            addDebugLog(`❌ Error opening student actions: ${error.message}`, 'error');
                            showResult('error', `Failed to open student actions: ${error.message}`);
                          } finally {
                            setActionLoading(false);
                            setCurrentAction(null);
                          }
                        }}
                        disabled={actionLoading}
                        style={{
                          flex: isMobile ? 1 : 1,
                          padding: '0.875rem',
                          border: 'none',
                          background: actionLoading && currentAction === 'actions' ? '#94a3b8' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 6px rgba(251, 191, 36, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 12px rgba(251, 191, 36, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 6px rgba(251, 191, 36, 0.3)';
                          }
                        }}
                        onMouseDown={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#d97706';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(251, 191, 36, 0.2)';
                          }
                        }}
                    >
                      {actionLoading && currentAction === 'actions' ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid white',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            {t('processing') || 'Processing...'}
                          </>
                      ) : (
                          <>
                            <ZapIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
                            {t('actions') || 'Actions'}
                          </>
                      )}
                    </button>
                  </div>

                  {/* Clear Today's Scans and Cancel Buttons Side by Side */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    {/* Clear Today's Scans Button - 1/3 width */}
                    <button
                        onClick={() => {
                          logger.log('🗑️ Clear today\'s scans');
                          addDebugLog('🗑️ Clearing all scans for today', 'warning');
                          setShowClearConfirmModal(true);
                        }}
                        disabled={actionLoading}
                        style={{
                          flex: 1, // 1/3 of the space
                          padding: '0.875rem',
                          border: '2px solid #dc2626',
                          background: actionLoading ? '#fca5a5' : '#ef4444',
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.625rem',
                          opacity: actionLoading ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#dc2626';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 12px rgba(239, 68, 68, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#ef4444';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.3)';
                          }
                        }}
                        onMouseDown={(e) => {
                          if (!actionLoading) {
                            e.target.style.background = '#b91c1c';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                          }
                        }}
                    >
                      <TrashIcon style={{ width: '18px', height: '18px' }} />
                      {t('clear_today') || 'Clear Today'}
                    </button>

                    {/* Cancel Button - 2/3 width */}
                    <button
                        onClick={async () => {
                          logger.log('❌ Cancel scan action');
                          setShowScanDialog(false);
                        }}
                        style={{
                          flex: 2, // 2/3 of the space
                          padding: '0.875rem',
                          border: '2px solid #e5e7eb',
                          background: 'white',
                          color: '#6b7280',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.625rem',
                          transition: 'all 0.2s ease',
                          marginTop: '0'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f9fafb';
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.transform = 'translateY(0)';
                        }}
                    >
                      <XSmallIcon style={{ width: '18px', height: '18px' }} />
                      {t('cancel') || 'Cancel'}
                    </button>
                  </div>

                </div>
              </div>
          )}

          {/* Debug Log Box */}
          {showDebugBox && (
              <div style={{
                position: 'fixed',
                bottom: '1rem',
                right: '1rem',
                width: isMobile ? '90vw' : '400px',
                height: '300px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                zIndex: 999, // Lower than modals
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                maxWidth: '90vw',
                overflow: 'hidden' // Prevent scrolling issues
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: '#333',
                  borderBottom: '1px solid #444',
                  color: 'white'
                }}>
                  <span>🐛 Debug Console</span>
                  <button
                      onClick={() => setDebugLogs([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                  >
                    Clear
                  </button>
                </div>
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '0.5rem'
                }}>
                  {debugLogs.length === 0 ? (
                      <div style={{ color: '#666', textAlign: 'center', marginTop: '1rem' }}>
                        No logs yet...
                      </div>
                  ) : (
                      debugLogs.map(log => (
                          <div
                              key={log.id}
                              style={{
                                marginBottom: '0.25rem',
                                color: log.type === 'error' ? '#ef4444' :
                                    log.type === 'warning' ? '#f59e0b' :
                                        log.type === 'success' ? '#10b981' : '#d1d5db',
                                fontSize: '0.7rem',
                                lineHeight: '1.3'
                              }}
                          >
                            <span style={{ color: '#666' }}>[{log.timestamp}]</span> {log.message}
                          </div>
                      ))
                  )}
                </div>
              </div>
          )}

          {/* Manual Input Dialog */}
          {showManualInput && (
              <div style={{
                position: 'fixed',
                top: isMobile ? '0' : '50%',
                left: isMobile ? '0' : '50%',
                transform: isMobile ? 'none' : 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: isMobile ? '0' : '0.5rem',
                padding: isMobile ? '1rem' : '1.5rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                zIndex: 1003,
                width: isMobile ? '100vw' : '400px',
                maxWidth: isMobile ? '100vw' : '400px',
                minWidth: isMobile ? '100vw' : '350px',
                height: isMobile ? '100vh' : 'auto',
                maxHeight: isMobile ? '100vh' : '80vh',
                overflow: 'auto'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827'
                }}>
                  {t('manual_student_id') || 'Manual Student ID'}
                </h3>

                <input
                    type="text"
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    placeholder={t('enter_reference_id') || 'Enter reference ID (STU-XXXXXX)'}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      marginBottom: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleManualSubmit();
                      }
                    }}
                />

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginTop: '1rem'
                }}>
                  <button
                      onClick={handleManualSubmit}
                      disabled={!manualStudentId.trim()}
                      style={{
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: manualStudentId.trim() ? '#3b82f6' : '#9ca3af',
                        color: 'white',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        cursor: manualStudentId.trim() ? 'pointer' : 'not-allowed',
                        width: '100%',
                        fontWeight: 500,
                        transition: 'all 0.2s ease'
                      }}
                  >
                    {t('simulate_scan') || 'Simulate Scan'}
                  </button>

                  <button
                      onClick={() => {
                        setShowManualInput(false);
                        setManualStudentId('');
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #d1d5db',
                        background: 'white',
                        color: '#6b7280',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: 500,
                        transition: 'all 0.2s ease'
                      }}
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                </div>
              </div>
          )}

          {/* Result Modal */}
          {showResultModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1005
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: isMobile ? '0' : '0.5rem',
                  padding: isMobile ? '1rem' : '2rem',
                  width: isMobile ? '100vw' : '400px',
                  maxWidth: isMobile ? '100vw' : '400px',
                  minWidth: isMobile ? '100vw' : '350px',
                  height: isMobile ? '100vh' : 'auto',
                  maxHeight: isMobile ? '100vh' : '80vh',
                  overflow: 'auto',
                  position: isMobile ? 'fixed' : 'relative',
                  top: isMobile ? '0' : 'auto',
                  left: isMobile ? '0' : 'auto',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: (() => {
                      // Handle attendance statuses
                      if (resultModalData.attendanceStatus) {
                        const color = getAttendanceColor(resultModalData.attendanceStatus);
                        return color;
                      }
                      
                      // Handle penalty types
                      if (resultModalData.type === RECORD_TYPES.PENALTY && resultModalData.penaltyType) {
                        const color = getPenaltyColor(resultModalData.penaltyType);
                        return color;
                      }
                      
                      // Handle behavior types
                      if (resultModalData.type === RECORD_TYPES.BEHAVIOR && resultModalData.behaviorType) {
                        const color = getBehaviorColor(resultModalData.behaviorType);
                        return color;
                      }
                      
                      // Handle participation types (use success color)
                      if (resultModalData.type === RECORD_TYPES.PARTICIPATION) {
                        const color = '#16a34a'; // Green for participation
                        return color;
                      }
                      
                      // Fallback colors for generic types
                      let fallbackColor;
                      if (resultModalData.type === 'success') {
                        fallbackColor = '#16a34a';
                      } else if (resultModalData.type === 'error') {
                        fallbackColor = '#dc2626';
                      } else if (resultModalData.type === 'late') {
                        fallbackColor = '#eab308';
                      } else {
                        fallbackColor = '#3b82f6';
                      }
                      
                      console.log('🎨 [QRScanner] Fallback Color:', {
                        type: resultModalData.type,
                        color: fallbackColor
                      });
                      
                      return fallbackColor;
                    })(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                  }}>
                    {resultModalData.attendanceStatus ? (
                      // Use attendance icon
                      (() => {
                        const iconName = getAttendanceIcon(resultModalData.attendanceStatus);
                        switch (iconName) {
                          case 'CheckCircle':
                            return <CheckSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                          case 'Clock':
                            return <ClockSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                          case 'XCircle':
                            return <XSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                          case 'Heart':
                            return <HeartIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                          default:
                            return <CircleIcon style={{ width: '30px', height: '30px', color: 'white' }} />;
                        }
                      })()
                    ) : resultModalData.type === 'success' ? (
                      <CheckSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />
                    ) : resultModalData.type === 'error' ? (
                      <XSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />
                    ) : resultModalData.type === 'late' ? (
                      <ClockSmallIcon style={{ width: '30px', height: '30px', color: 'white' }} />
                    ) : (
                      <CircleIcon style={{ width: '30px', height: '30px', color: 'white' }} />
                    )}
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {resultModalData.attendanceStatus ? 
                      getAttendanceLabel(resultModalData.attendanceStatus, lang) :
                      (resultModalData.type === 'success' ? 'Success!' :
                        resultModalData.type === 'error' ? 'Error!' : 'Information')}
                  </h3>

                  <p style={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    margin: '0 0 1.5rem 0',
                    lineHeight: '1.5'
                  }}>
                    {resultModalData.isSummary ? (
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>
                            {t('clear_success') || 'Successfully Cleared Today\'s Records'}
                          </h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                            <tbody>
                            <tr>
                              <td style={{ padding: '0.25rem', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                                {t('attendance') || 'Attendance'}:
                              </td>
                              <td style={{ padding: '0.25rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                                {resultModalData.message.attendance}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.25rem', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                                {t('behavior') || 'Behavior'}:
                              </td>
                              <td style={{ padding: '0.25rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                                {resultModalData.message.behavior}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.25rem', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                                {t('participation') || 'Participation'}:
                              </td>
                              <td style={{ padding: '0.25rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                                {resultModalData.message.participation}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.25rem', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                                {t('penalties') || 'Penalties'}:
                              </td>
                              <td style={{ padding: '0.25rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>
                                {resultModalData.message.penalties}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.25rem', fontWeight: '600', color: '#059669' }}>
                                {t('total') || 'Total'}:
                              </td>
                              <td style={{ padding: '0.25rem', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                {resultModalData.message.total}
                              </td>
                            </tr>
                            </tbody>
                          </table>
                        </div>
                    ) : (
                        resultModalData.message
                    )}
                  </p>

                  <button
                      onClick={() => setShowResultModal(false)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: resultModalData.attendanceStatus ? 
                          getAttendanceColor(resultModalData.attendanceStatus) :
                          (resultModalData.type === 'success' ? '#16a34a' :
                            resultModalData.type === 'error' ? '#dc2626' :
                              resultModalData.type === 'late' ? '#eab308' : '#3b82f6'),
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                  >
                    OK
                  </button>
                </div>
              </div>
          )}

          {showStudentActionStatsPanel && studentForAction && (
              <StudentActionStatsPanel
                  student={studentForAction}
                  onClose={() => {
                    setShowStudentActionStatsPanel(false);
                    setStudentForAction(null);
                  }}
                  onBehaviorSubmit={handleBehaviorSubmit}
                  onMarkAttendance={handleMarkAttendance}
                  onUpdate={() => {
                    if (onActivityUpdate) {
                      onActivityUpdate(() => {
                        logger.debug('[QR Scanner] Triggering activity refresh from StudentActionStatsPanel');
                        fetchRecentActivity();
                      });
                    }
                  }}
              />
          )}

          {showStudentActionZapPanel && studentForAction && (
              <StudentActionZapPanel
                  student={studentForAction}
                  initialTab={initialTab}
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
                        logger.debug('[QR Scanner] Triggering activity refresh from StudentActionZapPanel');
                        fetchRecentActivity();
                      });
                    }
                  }}
                  options={getActivityTypeOptions()}
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
                    margin: '0 0 1rem 0',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#111827'
                  }}>
                    {t('confirm_clear_today') || 'Clear Today\'s Scans'}
                  </h3>
                  <p style={{
                    margin: '0 0 1.5rem 0',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {t('confirm_clear_message') || 'Are you sure you want to clear all records for today? This will permanently delete all attendance, penalties, participation, and behavior records for today\'s date.'}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                        onClick={() => setShowClearConfirmModal(false)}
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
                            logger.debug('Clearing all records for date:', today);

                            // Get all attendance records for today
                            const attendanceResponse = await getAttendanceByClass(classId, today);
                            const attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];

                            // Get all penalties for today
                            const penaltiesResponse = await getPenalties();
                            const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
                            const todayPenalties = allPenalties.filter(p => {
                              const timestamp = p.createdAt || p.timestamp;
                              if (!timestamp) return false;
                              const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                              return dateStr === today;
                            });

                            // Count different record types from attendance
                            const behaviorRecords = attendanceRecords.filter(r => r.category === RECORD_TYPES.BEHAVIOR);
                            const participationRecords = attendanceRecords.filter(r => r.category === RECORD_TYPES.PARTICIPATION);
                            const attendanceOnlyRecords = attendanceRecords.filter(r => r.category === RECORD_TYPES.ATTENDANCE || r.category === ATTENDANCE_STATUS.LATE || r.category === ATTENDANCE_STATUS.PRESENT);
                            const lateRecords = attendanceRecords.filter(r => r.category === ATTENDANCE_STATUS.LATE);

                            logger.debug('Records to delete:', {
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
                                logger.debug('Deleted attendance record:', record.id, 'Category:', record.category);
                                deletedAttendanceCount++;
                              } catch (error) {
                                logger.error('Failed to delete attendance record:', record.id, error);
                              }
                            }

                            // Delete all penalty records for today
                            let deletedPenaltyCount = 0;
                            for (const penalty of todayPenalties) {
                              try {
                                await deletePenalty(penalty.id || penalty.docId);
                                logger.debug('Deleted penalty record:', penalty.id || penalty.docId);
                                deletedPenaltyCount++;
                              } catch (error) {
                                logger.error('Failed to delete penalty record:', penalty.id || penalty.docId, error);
                              }
                            }

                            // Delete all participation records for today
                            const participationResponse = await getParticipations();
                            const allParticipations = participationResponse.success ? participationResponse.data : [];
                            const todayParticipations = allParticipations.filter(p => {
                              const timestamp = p.createdAt || p.timestamp;
                              if (!timestamp) return false;
                              const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                              return dateStr === today;
                            });

                            let deletedParticipationCount = 0;
                            for (const participation of todayParticipations) {
                              try {
                                await deleteParticipation(participation.id || participation.docId);
                                logger.debug('Deleted participation record:', participation.id || participation.docId);
                                deletedParticipationCount++;
                              } catch (error) {
                                logger.error('Failed to delete participation record:', participation.id || participation.docId, error);
                              }
                            }

                            // Delete all behavior records for today
                            const behaviorResponse = await getBehaviors();
                            const allBehaviors = behaviorResponse.success ? behaviorResponse.data : [];
                            const todayBehaviors = allBehaviors.filter(b => {
                              const timestamp = b.createdAt || b.timestamp;
                              if (!timestamp) return false;
                              const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                              return dateStr === today;
                            });

                            let deletedBehaviorCount = 0;
                            for (const behavior of todayBehaviors) {
                              try {
                                await deleteBehavior(behavior.id || behavior.docId);
                                logger.debug('Deleted behavior record:', behavior.id || behavior.docId);
                                deletedBehaviorCount++;
                              } catch (error) {
                                logger.error('Failed to delete behavior record:', behavior.id || behavior.docId, error);
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
                          } catch (error) {
                            addDebugLog(`❌ Error clearing today's scans: ${error.message}`, 'error');
                            showResult('error', `${t('clear_error') || 'Failed to clear today\'s scans'}: ${error.message}`);
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

          {/* Bulk Scan Dialog */}
          <BulkScanDialog
            isOpen={showBulkScanDialog}
            onClose={() => setShowBulkScanDialog(false)}
            programId={selectedProgramId}
            subjectId={selectedSubjectId}
            classId={selectedClassId}
            markedBy={user?.uid || 'unknown'}
            performedBy={user?.uid || 'unknown'}
            performedByName={user?.displayName || user?.name || user?.email || 'Unknown User'}
            performedByEmail={user?.email || 'unknown@example.com'}
            onSuccess={(result) => {
              showSuccess(t('bulk_operation_success') || `Successfully processed ${result.summary.succeeded} students`);
              
              // Trigger multiple refresh mechanisms to ensure UI updates
              fetchRecentActivity();
              
              // Trigger event bus events to refresh all components
              eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
                classId: selectedClassId,
                timestamp: Date.now()
              });
              
              eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
              eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);
              
              // Force a second refresh after a short delay to catch any slow updates
              setTimeout(() => {
                fetchRecentActivity();
                eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
              }, 500);
            }}
            t={t}
            lang={lang}
          />

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
