import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import logger from '../../utils/logger';
import { Button } from './ui/button';
import jsQR from 'jsqr';
import { getAttendanceByClass } from '../../firebase/attendance';
import { markAttendance } from '../../firebase/attendance';
import { getPenalties } from '../../firebase/penalties';
import { createPenalty } from '../../firebase/penalties';
import { getUsers } from '../../firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import eventBus, { EVENTS } from '../../utils/eventBus';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useToast } from '../ui/Toast';
import { RefreshCw } from 'lucide-react';
import StudentActionPanel from './StudentActionPanel';
import StudentActionPanelNew from './StudentActionPanelNew';
import { generateReferenceId } from '../../utils/qrCode';

const QrCodeIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const AttendanceIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m22 21-3-3 3-3"/>
    <path d="M16 8h6"/>
  </svg>
);

export default function QRScanner({ onScan, classId, onActivityUpdate, onDeleteActivity, selectedProgramId, selectedSubjectId, selectedClassId, loading = false, students = [] }) {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { addToast } = useToast();
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
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalData, setResultModalData] = useState({ type: '', message: '' });
  const [showStudentActionPanel, setShowStudentActionPanel] = useState(false);
  const [showStudentActionPanelNew, setShowStudentActionPanelNew] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForAction, setStudentForAction] = useState(null);
  const [todayAttendanceStatus, setTodayAttendanceStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err) {
        console.error('Error getting devices:', err);
      }
    };
    getDevices();
  }, []);

  const startCamera = async () => {
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
      const constraints = {
        video: {
          facingMode: cameraMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (permissionError) {
        // Handle specific permission errors
        let errorMessage = '';
        if (permissionError.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.';
        } else if (permissionError.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (permissionError.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application. Please close other apps using the camera and try again.';
        } else if (permissionError.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not support the required settings. Try switching cameras.';
        } else {
          errorMessage = `Camera access failed: ${permissionError.message}`;
        }
        
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
  };

  const stopCamera = () => {
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
  };

  const scanQRCode = () => {
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
        handleQRCodeDetected(code.data);
      }
    }
  };

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
    console.log(`[${timestamp}] ${message}`);
  }, []);

  // Show result modal function
  const showResult = useCallback((type, message) => {
    setResultModalData({ type, message });
    setShowResultModal(true);
    addDebugLog(`📢 Showing result modal: ${type} - ${message}`, 'info');
  }, [addDebugLog]);

  // Play feedback sound and vibration
  const playFeedbackSound = useCallback((type) => {
    try {
      // Vibration for error only (as requested)
      if (type === 'error' && vibrationEnabled && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // Sound feedback
      if (soundEnabled) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'success') {
          // Success sound: ascending tone
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'error') {
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
      // const message = type === 'success' 
      //   ? (t('qr_scan_success') || 'QR Code scanned successfully!')
      //   : (t('qr_scan_error') || 'QR Code scan failed. Please try again.');
      // 
      // addToast(message, type);
    } catch (error) {
      console.warn('Could not play feedback sound:', error);
    }
  }, [soundEnabled, vibrationEnabled, t, addToast]);

  const handleQRCodeDetected = async (data) => {
    // Prevent infinite scanning - lock scanning for 3 seconds
    if (isScanningLocked) {
      addDebugLog('🔒 Scanning locked - ignoring duplicate scan', 'warning');
      return;
    }
    
    setIsScanningLocked(true);
    addDebugLog(`🔍 QR Code scanned: ${data}`, 'success');
    
    // Play success feedback
    playFeedbackSound('success');
    
    onScan(data);
    setRecentScans(prev => prev + 1);
    
    // Parse QR data to get student info
    let studentInfo = null;
    try {
      if (typeof data === 'string') {
        if (data.startsWith('STU-')) {
          // Reference ID format
          studentInfo = { referenceId: data };
        } else if (data.includes('/qr/student/')) {
          // URL format like https://localhost:5174/qr/student/STU-JLHXQ2
          const urlParts = data.split('/qr/student/');
          if (urlParts.length > 1) {
            const studentId = urlParts[1].split('?')[0]; // Remove query params if any
            studentInfo = { referenceId: studentId };
          }
        } else {
          // Try to parse as JSON
          const parsed = JSON.parse(data);
          studentInfo = parsed;
        }
      } else {
        studentInfo = data;
      }
    } catch (error) {
      addDebugLog(`❌ Error parsing QR data: ${error.message}`, 'error');
      addToast('Invalid QR code format', 'error');
      setIsScanningLocked(false);
      return;
    }
    
    addDebugLog(`👤 Student info parsed: ${JSON.stringify(studentInfo)}`, 'info');
    setLastScannedStudent(studentInfo);
    
    // Check if all required fields are selected
    if (!selectedProgramId || !selectedSubjectId || !selectedClassId) {
      showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
      addDebugLog('❌ Cannot scan: Missing required selections', 'error');
      stopCamera();
      return;
    }
    
    // Always use semi-auto mode - show dialog to choose action
    addDebugLog('🔄 Semi-auto mode: Showing action dialog', 'info');
    setShowScanDialog(true);
    
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
  }, [selectedProgramId, selectedSubjectId, selectedClassId, t]);

  const handleManualSubmit = useCallback(() => {
    if (!manualStudentId.trim()) return;
    
    // Check if all required fields are selected
    if (!selectedProgramId || !selectedSubjectId || !selectedClassId) {
      showResult('error', t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning');
      addDebugLog('❌ Cannot scan manually: Missing required selections', 'error');
      return;
    }
    
    const studentInfo = { referenceId: manualStudentId.trim() };
    setLastScannedStudent(studentInfo);
    setShowScanDialog(true);
    setShowManualInput(false);
    setManualStudentId('');
    
    addDebugLog(`📝 Manual student ID entered: ${manualStudentId.trim()}`, 'info');
    playFeedbackSound('success');
  }, [manualStudentId, selectedProgramId, selectedSubjectId, selectedClassId, t, addDebugLog, playFeedbackSound]);

  const findStudentData = useCallback(async (referenceId) => {
    try {
      const result = await getUsers();
      const students = result.success ? result.data : [];
      const student = students.find(s => s.referenceId === referenceId);
      return student;
    } catch (error) {
      addDebugLog(`❌ Error finding student data: ${error.message}`, 'error');
      return null;
    }
  }, [addDebugLog]);

  const checkTodayAttendanceStatus = useCallback(async (referenceId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingDoc = await getDoc(doc(db, 'attendance', `${classId}_${referenceId}_${today}`));
      
      if (existingDoc.exists()) {
        const data = existingDoc.data();
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
      const [studentData, attendanceStatus] = await Promise.all([
        findStudentData(referenceId),
        checkTodayAttendanceStatus(referenceId)
      ]);
      
      setTodayAttendanceStatus(attendanceStatus);
      return studentData;
    } catch (error) {
      addDebugLog(`❌ Error processing student data: ${error.message}`, 'error');
      setTodayAttendanceStatus(null);
      return null;
    }
  }, [findStudentData, checkTodayAttendanceStatus, addDebugLog]);

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
    
    setActivityLoading(true);
    try {
      // Small delay to ensure Firestore has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use local date string YYYY-MM-DD to avoid timezone shifts
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      logger.debug('[QR Scanner] Date filtering:', {
        today: today.toISOString(),
        todayStr: todayStr,
        classId: classId
      });
      
      // Get today's attendance records for this class
      const attendanceResponse = await getAttendanceByClass(classId, todayStr);
      const attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];
      
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
      
      // Get today's penalty records for students in this class
      const penaltiesResponse = await getPenalties();
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      
      // Create a map of referenceId to student name from passed students
      const studentMap = {};
      logger.debug('[QR Scanner] Creating student map from', students.length, 'students');
      students.forEach(student => {
        const studentId = student.id || student.docId;
        const referenceId = student.studentNumber ? `STU-${student.studentNumber}` : (student.referenceId || generateReferenceId(studentId));
        const name = student.displayName || student.realName || student.name || (student.email ? student.email.split('@')[0] : 'Unknown');
        studentMap[referenceId] = name;
        logger.debug('[QR Scanner] Student map entry:', referenceId, '->', name, '(from studentId:', studentId, ')');
      });
      
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
      
      // Filter penalties for today only
      const todayPenalties = allPenalties.filter(p => {
        if (!p.studentId || !studentMap[p.studentId]) return false;
        
        // Handle Firestore serverTimestamp field values (might be null if just created locally)
        const timestamp = p.createdAt || p.timestamp;
        if (!timestamp) return true; // Assume today if no timestamp yet (just created)
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        return dateStr === todayStr;
      });
      
      logger.debug('[QR Scanner] Activity refresh found:', attendanceRecords.length, 'attendance,', todayPenalties.length, 'penalties');
      
      // Combine and format activity logs
      logger.debug('[QR Scanner] Processing', attendanceRecords.length, 'attendance records');
      logger.debug('[QR Scanner] First attendance record details:', attendanceRecords.length > 0 ? {
        fullRecord: attendanceRecords[0],
        id: attendanceRecords[0]?.id,
        studentId: attendanceRecords[0]?.studentId,
        status: attendanceRecords[0]?.status,
        category: attendanceRecords[0]?.category,
        delta: attendanceRecords[0]?.delta,
        date: attendanceRecords[0]?.date,
        timestamp: attendanceRecords[0]?.timestamp,
        method: attendanceRecords[0]?.method,
        notes: attendanceRecords[0]?.notes,
        reason: attendanceRecords[0]?.reason
      } : 'No attendance records');
      
      const activityLogs = [
        ...attendanceRecords.map((record, index) => {
          const studentId = record.studentId;
          const studentName = studentMap[studentId] || 'Unknown Student';
          
          logger.debug('[QR Scanner] Processing attendance record #' + index + ':', {
            studentId,
            studentName,
            status: record.status,
            category: record.category,
            delta: record.delta,
            date: record.date,
            timestamp: record.timestamp,
            method: record.method,
            notes: record.notes,
            reason: record.reason,
            availableInMap: !!studentMap[studentId],
            totalStudentsInMap: Object.keys(studentMap).length,
            computedType: record.category || (record.delta ? (record.delta > 0 ? 'participation' : 'behavior') : 'attendance')
          });
          
          return {
            id: record.id || `attendance-${Math.random()}`,
            time: record.timestamp || record.updatedAt || record.date,
            type: record.category || (record.delta ? (record.delta > 0 ? 'participation' : 'behavior') : 'attendance'),
            studentId,
            studentName,
            status: record.status || 'present',
            delta: record.delta,
            label: record.notes || record.reason || '',
            method: record.method || 'QR Scan',
            performedBy: record.performedBy || user || { displayName: 'System', email: 'system@qaf.com' },
            scanMethod: record.scanMethod || (record.method === 'QR Scan' ? 'auto' : 'manual_instructor')
          };
        }),
        ...todayPenalties.map(record => ({
          id: record.id || record.docId || `penalty-${Math.random()}`,
          time: record.createdAt || record.timestamp || new Date(),
          type: 'penalty',
          studentId: record.studentId,
          studentName: studentMap[record.studentId] || 'Unknown Student',
          status: 'penalty',
          label: record.reason || record.type || 'Penalty',
          points: record.points,
          performedBy: record.performedBy || user || { displayName: 'System', email: 'system@qaf.com' },
          scanMethod: 'manual_instructor'
        }))
      ].sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA;
      }).slice(0, 15);
      
      // Remove duplicate attendance records for same student
      const uniqueLogs = [];
      const seen = new Set();
      
      activityLogs.forEach(log => {
        // Create a unique key based on student and action type
        // For attendance, we only want the latest one
        if (log.type === 'attendance') {
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
      
      // Sort by time (most recent first)
      uniqueLogs.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA;
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
      } : 'No activity logs');
      
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
  }, [classId, user]);

  // Memoized helper functions for activity display - defined outside map for performance
  const getScanMethodDisplay = useCallback((scanMethod) => {
    switch(scanMethod) {
      case 'auto':
        return {
          icon: '',
          text: lang === 'ar' ? 'مسح QR' : 'QR Scan',
          color: '#10b981'
        };
      case 'manual_instructor':
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

  const getStatusColor = useCallback((status, type, delta) => {
    if (type === 'participation' || delta > 0) return '#3b82f6';
    if (type === 'behavior' || delta < 0) return '#f97316';
    if (type === 'penalty') return '#dc2626';
    
    switch(status?.toLowerCase()) {
      case 'present': return '#16a34a';
      case 'late': return '#eab308';
      case 'human_case': return '#8b5cf6';
      case 'absent': 
      case 'absent_no_excuse': 
      case 'absent_with_excuse':
      case 'excused_leave':
        return '#dc2626';
      default: return '#6b7280';
    }
  }, []);

  const getStatusIcon = useCallback((status, type, delta) => {
    if (type === 'participation' || delta > 0) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="m21 16-8-5-5-5 5"/>
        </svg>
      );
    }
    if (type === 'behavior' || delta < 0) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      );
    }
    if (type === 'penalty') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    }

    switch(status?.toLowerCase()) {
      case 'present': 
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case 'late': 
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 12 12"></polyline>
          </svg>
        );
      case 'absent':
      case 'absent_no_excuse':
      case 'absent_with_excuse':
      case 'excused_leave':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        );
      case 'human_case':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        );
      default: 
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        );
    }
  }, []);

  const getStatusLabel = useCallback((status, type, delta) => {
    if (type === 'participation' || delta > 0) return t('participation') || 'Participation';
    if (type === 'behavior' || delta < 0) return t('behavior') || 'Behavior';
    if (type === 'penalty') return t('penalty') || 'Penalty';

    switch(status?.toLowerCase()) {
      case 'present': return t('present');
      case 'late': return t('late');
      case 'absent': return t('absent');
      case 'absent_no_excuse': return t('absent');
      case 'absent_with_excuse': return t('absent_excused');
      case 'excused_leave': return t('excused_leave');
      case 'human_case': return t('human_case');
      default: return status || t('present');
    }
  }, [t]);

  // Listen for real-time activity updates - optimized with useCallback
  useEffect(() => {
    const unsubscribeActivity = eventBus.on(EVENTS.ACTIVITY_UPDATE, fetchRecentActivity);
    const unsubscribeAttendance = eventBus.on(EVENTS.ATTENDANCE_MARKED, fetchRecentActivity);
    const unsubscribeBehavior = eventBus.on(EVENTS.BEHAVIOR_LOGGED, fetchRecentActivity);
    const unsubscribeParticipation = eventBus.on(EVENTS.PARTICIPATION_ADDED, fetchRecentActivity);
    const unsubscribePenalty = eventBus.on(EVENTS.PENALTY_ASSIGNED, fetchRecentActivity);

    return () => {
      unsubscribeActivity();
      unsubscribeAttendance();
      unsubscribeBehavior();
      unsubscribeParticipation();
      unsubscribePenalty();
    };
  }, [fetchRecentActivity]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onActivityUpdate) {
      onActivityUpdate(fetchRecentActivity);
    }
  }, [onActivityUpdate, fetchRecentActivity]);

  // Fetch activity when classId changes
  useEffect(() => {
    if (classId) {
      fetchRecentActivity();
    }
  }, [classId]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
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
        margin: isMobile ? '0 auto 1rem auto' : '0 0 1rem 0'
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
          <span className="qr-sr-only">{isScanning ? 'Stop camera' : 'Activate camera'}</span>
        </Button>
      </div>

      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: 'var(--background-secondary, #f9fafb)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border, #e5e7eb)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setVibrationEnabled(!vibrationEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border, #e5e7eb)',
                background: vibrationEnabled ? 'var(--color-primary, #8b5cf6)' : 'white',
                color: vibrationEnabled ? 'white' : 'var(--text, #111827)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={vibrationEnabled ? (t('disable_vibration') || 'Disable vibration') : (t('enable_vibration') || 'Enable vibration')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 8v8l2-2m0 0l2 2m-2-2v6m14-10v8l-2-2m0 0l-2 2m2-2v6m-8-10v6l-2-2m0 0l-2 2m2-2v6"/>
              </svg>
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border, #e5e7eb)',
                background: soundEnabled ? 'var(--color-primary, #8b5cf6)' : 'white',
                color: soundEnabled ? 'white' : 'var(--text, #111827)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title={soundEnabled ? (t('disable_sound') || 'Disable sound') : (t('enable_sound') || 'Enable sound')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </button>
            
            <button
              onClick={() => setShowDebugBox(!showDebugBox)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border, #e5e7eb)',
                background: showDebugBox ? '#ef4444' : 'white',
                color: showDebugBox ? 'white' : 'var(--text, #111827)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Toggle debug console"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
              </svg>
            </button>
            
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
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
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
              title={(!selectedProgramId || !selectedSubjectId || !selectedClassId) ? (t('please_select_program_subject_class') || 'Please select Program, Subject, and Class before scanning') : 'Manual student ID input'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#111827',
            margin: 0
          }}>
            {t('recent_activity') || 'Recent Activity'}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRecentActivity}
            title="Refresh activity"
            style={{ padding: '0.25rem' }}
          >
            <RefreshCw style={{ width: '1rem', height: '1rem' }} />
          </Button>
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
          [isRTL ? 'borderRight' : 'borderLeft']: '3px solid #8b5cf6'
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
              {t('no_recent_activity')}
            </div>
          ) : (
            recentActivity.map((activity) => {

              return (
                <div key={activity.id} style={{
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: expandedActivities.has(activity.id) ? '0.75rem' : '0.25rem'
                }}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 0',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleActivityExpansion(activity.id)}
                  >
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: getStatusColor(activity.status, activity.type, activity.delta),
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {getStatusIcon(activity.status, activity.type, activity.delta)} {getStatusLabel(activity.status, activity.type, activity.delta)}
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #374151)', flex: 1 }}>
                      {activity.studentName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {onDeleteActivity && activity.type !== 'attendance' && (
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
                          title="Delete activity"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        style={{
                          transform: expandedActivities.has(activity.id) ? (isRTL ? 'rotate(180deg)' : 'rotate(180deg)') : (isRTL ? 'rotate(90deg)' : 'rotate(0deg)'),
                          transition: 'transform 0.2s',
                          color: '#6b7280'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                  
                  {expandedActivities.has(activity.id) && (
                    <div style={{ 
                      paddingLeft: '3.5rem',
                      paddingTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      display: isMobile ? 'flex' : 'block',
                      flexDirection: isMobile ? 'column' : 'none',
                      gap: isMobile ? '0.25rem' : '0'
                    }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>{t('date') || 'Date'}:</strong> {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')} {activity.time?.toDate ? activity.time.toDate().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (activity.time instanceof Date ? activity.time.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : activity.time || '')}
                      </div>
                      {activity.program && (
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong>{t('program') || 'Program'}:</strong> {activity.program}
                        </div>
                      )}
                      {activity.subject && (
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong>{t('subject') || 'Subject'}:</strong> {activity.subject}
                        </div>
                      )}
                      {activity.class && (
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong>{t('class') || 'Class'}:</strong> {activity.class}
                        </div>
                      )}
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>{t('method') || 'Method'}:</strong> {getScanMethodDisplay(activity.scanMethod).text}
                      </div>
                      <div>
                        <strong>{t('by') || 'By'}:</strong> {activity.performedBy?.displayName || activity.performedBy?.email?.split('@')[0] || t('unknown')}
                      </div>
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
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
              <br />
              {lastScannedStudent.referenceId || lastScannedStudent.email || JSON.stringify(lastScannedStudent)}
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <button
                onClick={async () => {
                  console.log('✅ Mark as present');
                  addDebugLog('✅ Marking student as present', 'success');
                  
                  setActionLoading(true);
                  setCurrentAction('present');
                  
                  try {
                    const today = new Date().toISOString().split('T')[0];
                    
                    // Check if already marked present today
                    const existingDoc = await getDoc(doc(db, 'attendance', `${classId}_${lastScannedStudent.referenceId}_${today}`));
                    if (existingDoc.exists() && (existingDoc.data().status === 'present' || existingDoc.data().status === 'late')) {
                      showResult('info', 'Student is already marked for today.');
                      return;
                    }
                    
                    const result = await markAttendance({
                      classId,
                      studentId: lastScannedStudent.referenceId,
                      date: today,
                      status: 'present',
                      markedBy: user.uid,
                      method: 'qr_scan',
                      notes: 'Marked present via QR scan'
                    });
                    
                    if (result.success) {
                      setShowScanDialog(false);
                      showResult('success', 'Student marked as present successfully!');
                      
                      // Trigger activity update
                      if (onActivityUpdate) {
                        onActivityUpdate(() => {
                          logger.debug('[QR Scanner] Triggering activity refresh after marking present');
                          fetchRecentActivity();
                        });
                      }
                    } else {
                      showResult('error', result.error || 'Failed to mark attendance');
                    }
                  } catch (error) {
                    addDebugLog(`❌ Error marking attendance: ${error.message}`, 'error');
                    showResult('error', `Failed to mark attendance: ${error.message}`);
                  } finally {
                    setActionLoading(false);
                    setCurrentAction(null);
                  }
                }}
                disabled={actionLoading || (todayAttendanceStatus === 'present' || todayAttendanceStatus === 'late')}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  background: actionLoading && currentAction === 'present' ? '#94a3b8' : '#16a34a',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: actionLoading ? 0.7 : 1
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    {t('mark_present') || 'Mark Present'}
                  </>
                )}
              </button>
              
              <button
                onClick={async () => {
                  console.log('📝 Open behavior actions');
                  addDebugLog('📝 Opening behavior actions', 'info');
                  
                  setActionLoading(true);
                  setCurrentAction('behavior');
                  
                  try {
                    const studentData = await processStudentData(lastScannedStudent.referenceId);
                    if (studentData) {
                      setStudentForAction(studentData);
                      setShowStudentActionPanelNew(true);
                      setShowScanDialog(false);
                      addDebugLog(`✅ Found student for behavior: ${studentData.name || studentData.email}`, 'success');
                    } else {
                      showResult('error', 'Student not found with this reference ID');
                    }
                  } catch (error) {
                    addDebugLog(`❌ Error opening behavior actions: ${error.message}`, 'error');
                    showResult('error', `Failed to open behavior actions: ${error.message}`);
                  } finally {
                    setActionLoading(false);
                    setCurrentAction(null);
                  }
                }}
                disabled={actionLoading}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  background: actionLoading && currentAction === 'behavior' ? '#94a3b8' : '#f59e0b',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading && currentAction === 'behavior' ? (
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    {t('behavior') || 'Behavior'}
                  </>
                )}
              </button>
              
              <button
                onClick={async () => {
                  console.log('⚖️ Open penalty actions');
                  addDebugLog('⚖️ Opening penalty actions', 'info');
                  
                  setActionLoading(true);
                  setCurrentAction('penalty');
                  
                  try {
                    const studentData = await processStudentData(lastScannedStudent.referenceId);
                    if (studentData) {
                      setStudentForAction(studentData);
                      setShowStudentActionPanelNew(true);
                      setShowScanDialog(false);
                      addDebugLog(`✅ Found student for penalty: ${studentData.name || studentData.email}`, 'success');
                    } else {
                      showResult('error', 'Student not found with this reference ID');
                    }
                  } catch (error) {
                    addDebugLog(`❌ Error opening penalty actions: ${error.message}`, 'error');
                    showResult('error', `Failed to open penalty actions: ${error.message}`);
                  } finally {
                    setActionLoading(false);
                    setCurrentAction(null);
                  }
                }}
                disabled={actionLoading}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  background: actionLoading && currentAction === 'penalty' ? '#94a3b8' : '#dc2626',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading && currentAction === 'penalty' ? (
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                      <path d="M12 8v4"/>
                      <path d="M12 16h.01"/>
                    </svg>
                    {t('penalty') || 'Penalty'}
                  </>
                )}
              </button>
              
              <button
                onClick={async () => {
                  console.log('⏰ Mark as late');
                  addDebugLog('⏰ Marking student as late', 'info');
                  
                  setActionLoading(true);
                  setCurrentAction('late');
                  try {
                    const today = new Date().toISOString().split('T')[0];
                    
                    // Check if already marked present or late today
                    const existingDoc = await getDoc(doc(db, 'attendance', `${classId}_${lastScannedStudent.referenceId}_${today}`));
                    if (existingDoc.exists() && (existingDoc.data().status === 'present' || existingDoc.data().status === 'late')) {
                      showResult('info', 'Student is already marked for today.');
                      return;
                    }
                    
                    const result = await markAttendance({
                      classId,
                      studentId: lastScannedStudent.referenceId,
                      date: today,
                      status: 'late',
                      markedBy: user.uid,
                      method: 'qr_scan',
                      notes: 'Marked late via QR scan'
                    });
                    
                    if (result.success) {
                      setShowScanDialog(false);
                      showResult('late', 'Student marked as late successfully!');
                      
                      // Trigger activity update
                      if (onActivityUpdate) {
                        onActivityUpdate(() => {
                          logger.debug('[QR Scanner] Triggering activity refresh after marking late');
                          fetchRecentActivity();
                        });
                      }
                    } else {
                      showResult('error', result.error || 'Failed to mark late');
                    }
                  } catch (error) {
                    addDebugLog(`❌ Error marking late: ${error.message}`, 'error');
                    showResult('error', `Failed to mark late: ${error.message}`);
                  } finally {
                    setActionLoading(false);
                    setCurrentAction(null);
                  }
                }}
                disabled={actionLoading || (todayAttendanceStatus === 'present' || todayAttendanceStatus === 'late')}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  background: actionLoading && currentAction === 'late' ? '#94a3b8' : '#eab308',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: actionLoading ? 0.7 : 1
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {t('late') || 'Late'}
                  </>
                )}
              </button>
              
              <button
                onClick={async () => {
                  console.log('👥 Open participation actions');
                  addDebugLog('👥 Opening participation actions', 'info');
                  
                  setActionLoading(true);
                  setCurrentAction('participation');
                  
                  try {
                    const studentData = await processStudentData(lastScannedStudent.referenceId);
                    if (studentData) {
                      setStudentForAction(studentData);
                      setShowStudentActionPanelNew(true);
                      setShowScanDialog(false);
                      addDebugLog(`✅ Found student for participation: ${studentData.name || studentData.email}`, 'success');
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
                  padding: '0.75rem',
                  border: 'none',
                  background: actionLoading && currentAction === 'participation' ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading && currentAction === 'participation' ? (
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="m22 21-3-3 3-3"/>
                      <path d="M16 8h6"/>
                    </svg>
                    {t('participation') || 'Participation'}
                  </>
                )}
              </button>
              
              <button
                onClick={async () => {
                  console.log('👤 Open student details');
                  addDebugLog('👤 Opening student details', 'info');
                  
                  setActionLoading(true);
                  setCurrentAction('details');
                  
                  try {
                    const studentData = await processStudentData(lastScannedStudent.referenceId);
                    if (studentData) {
                      setStudentForAction(studentData);
                      setShowStudentActionPanel(true);
                      setShowScanDialog(false);
                      addDebugLog(`✅ Found student: ${studentData.name || studentData.email}`, 'success');
                    } else {
                      showResult('error', 'Student not found with this reference ID');
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
                  padding: '0.75rem',
                  border: 'none',
                  background: actionLoading && currentAction === 'details' ? '#94a3b8' : '#6b7280',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: actionLoading ? 0.7 : 1
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="m22 21-3-3 3-3"/>
                      <path d="M16 8h6"/>
                    </svg>
                    {t('student_details') || 'Student Details'}
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  console.log('❌ Cancel scan action');
                  setShowScanDialog(false);
                }}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#6b7280',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
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
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          fontSize: '0.75rem'
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
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 1003,
          minWidth: '350px',
          maxWidth: '90%'
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
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                setShowManualInput(false);
                setManualStudentId('');
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
              onClick={handleManualSubmit}
              disabled={!manualStudentId.trim()}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: manualStudentId.trim() ? '#3b82f6' : '#9ca3af',
                color: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: manualStudentId.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {t('simulate_scan') || 'Simulate Scan'}
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
          zIndex: 1002
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: resultModalData.type === 'success' ? '#16a34a' : 
                         resultModalData.type === 'error' ? '#dc2626' : 
                         resultModalData.type === 'late' ? '#eab308' : '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              {resultModalData.type === 'success' ? (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : resultModalData.type === 'error' ? (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : resultModalData.type === 'late' ? (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </div>
            
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 0.5rem 0'
            }}>
              {resultModalData.type === 'success' ? 'Success!' : 
               resultModalData.type === 'error' ? 'Error!' : 'Information'}
            </h3>
            
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.5'
            }}>
              {resultModalData.message}
            </p>
            
            <button
              onClick={() => setShowResultModal(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: resultModalData.type === 'success' ? '#16a34a' : 
                           resultModalData.type === 'error' ? '#dc2626' : 
                           resultModalData.type === 'late' ? '#eab308' : '#3b82f6',
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
      
      {/* Student Action Panel */}
      {showStudentActionPanel && studentForAction && (
        <StudentActionPanel
          student={studentForAction}
          onClose={() => {
            setShowStudentActionPanel(false);
            setStudentForAction(null);
          }}
          onUpdate={() => {
            if (onActivityUpdate) {
              onActivityUpdate(() => {
                logger.debug('[QR Scanner] Triggering activity refresh from StudentActionPanel');
                fetchRecentActivity();
              });
            }
          }}
        />
      )}
      
      {/* Student Action Panel New */}
      {showStudentActionPanelNew && studentForAction && (
        <StudentActionPanelNew
          student={studentForAction}
          onClose={() => {
            setShowStudentActionPanelNew(false);
            setStudentForAction(null);
          }}
          onUpdate={() => {
            if (onActivityUpdate) {
              onActivityUpdate(() => {
                logger.debug('[QR Scanner] Triggering activity refresh from StudentActionPanelNew');
                fetchRecentActivity();
              });
            }
          }}
        />
      )}

      <style jsx>{`
        @keyframes qr-scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
