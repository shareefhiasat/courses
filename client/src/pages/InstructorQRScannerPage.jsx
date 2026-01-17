import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  updateDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Camera, 
  CameraOff, 
  Search, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Smartphone,
  Monitor,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  QrCode,
  User,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Target,
  MessageSquare,
  Heart,
  Shield,
  Globe,
  Filter
} from 'lucide-react';
import { Button, Input, Loading, Card, CardBody, Select } from '../components/ui';
import RibbonTabs from '../components/RibbonTabs';
import StudentQuickActionModal from '../components/StudentQuickActionModal';
import DraggableClock from '../components/DraggableClock';
import { markAttendance } from '../firebase/attendance';
import { getClasses, getEnrollments, getUsers } from '../firebase/firestore';
import { addNotification } from '../firebase/notifications';
import { DEFAULT_ACCENT, normalizeHexColor } from '../utils/color';
import { 
  saveOfflineScan, 
  getOfflineScans, 
  syncOfflineData, 
  getOfflineStats,
  setupAutoSync,
  setupNetworkMonitoring
} from '../utils/offlineSync';
import './InstructorQRScannerPage.css';

// QR Scanner Component (will be implemented separately)
const QRScannerInterface = ({ onScanSuccess, onScanError, isActive, isMobile }) => {
  const [scannerError, setScannerError] = useState(null);
  
  // Placeholder for html5-qrcode implementation
  useEffect(() => {
    if (!isActive) return;
    
    // TODO: Implement html5-qrcode scanner
    console.log('QR Scanner would initialize here');
  }, [isActive]);

  return (
    <div className="qr-scanner-container">
      <div className="scanner-viewport">
        {isActive ? (
          <div className="scanner-placeholder">
            <Camera size={48} className="scanner-icon" />
            <p>QR Scanner Interface</p>
            <p className="scanner-hint">
              {isMobile 
                ? 'Position QR code within camera frame' 
                : 'Click "Start Scanning" and position QR code in camera window'
              }
            </p>
            <div className="scanner-instructions">
              <h4>Instructions:</h4>
              <ul>
                <li>Ensure good lighting for best results</li>
                <li>Hold QR code steady and centered</li>
                <li>Scanner will automatically detect valid student QR codes</li>
                <li>Use manual search if QR code is damaged</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="scanner-inactive">
            <CameraOff size={48} className="scanner-icon" />
            <p>Scanner Inactive</p>
            <p className="scanner-hint">Click "Start Scanning" to begin</p>
          </div>
        )}
      </div>
      {scannerError && (
        <div className="scanner-error">
          <AlertCircle size={16} />
          <span>{scannerError}</span>
        </div>
      )}
    </div>
  );
};

const InstructorQRScannerPage = () => {
  const { user, isAdmin, isInstructor, isSuperAdmin, loading: authLoading } = useAuth();
  const { t, isRTL } = useLang();
  const { isDark, theme } = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState('scanner');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({
    scanner: false,
    manual: false,
    recent: true
  });
  
  // Form state for quick actions
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attendanceNote, setAttendanceNote] = useState('');
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Filtering state
  const [classFilters, setClassFilters] = useState({
    programId: '',
    subjectId: '',
    classId: ''
  });
  
  // Quick Action Modal state
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [modalContext, setModalContext] = useState({});
  
  // Offline state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineStats, setOfflineStats] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Theme color
  const accentColor = useMemo(() => {
    try {
      const savedColor = localStorage.getItem('userMessageColor');
      return normalizeHexColor(savedColor, DEFAULT_ACCENT);
    } catch {
      return DEFAULT_ACCENT;
    }
  }, []);

  // Filter classes based on selected filters
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      if (classFilters.programId && cls.programId !== classFilters.programId) return false;
      if (classFilters.subjectId && cls.subjectId !== classFilters.subjectId) return false;
      if (classFilters.classId && cls.id !== classFilters.classId) return false;
      return true;
    });
  }, [classes, classFilters]);

  // Check if user can access this page
  useEffect(() => {
    if (!authLoading && (!isAdmin && !isSuperAdmin && !isInstructor)) {
      navigate('/dashboard');
    }
  }, [authLoading, isAdmin, isSuperAdmin, isInstructor, navigate]);

  // Detect camera devices
  useEffect(() => {
    const detectDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        // Auto-select environment camera if available, otherwise first camera
        const environmentCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        );
        
        if (environmentCamera) {
          setSelectedDevice(environmentCamera.deviceId);
          setFacingMode('environment');
        } else if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
          setFacingMode('user');
        }
      } catch (error) {
        console.error('Error detecting devices:', error);
      }
    };

    detectDevices();
    
    // Listen for device changes
    navigator.mediaDevices?.addEventListener('devicechange', detectDevices);
    
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', detectDevices);
    };
  }, []);

  // Toggle camera facing mode
  const toggleCamera = () => {
    if (devices.length < 2) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDevice(devices[nextIndex].deviceId);
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      // Force re-render to update time
      const timeElement = document.querySelector('.time-display');
      const dateElement = document.querySelector('.date-display');
      if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
      }
      if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Load/save filter preferences
  useEffect(() => {
    // Load saved preferences
    const savedFilters = localStorage.getItem('qrScannerFilters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      setClassFilters(prev => ({ ...prev, ...filters }));
      if (filters.programId) {
        setSelectedProgram(filters.programId);
      }
      if (filters.subjectId) {
        setSelectedSubject(filters.subjectId);
      }
      if (filters.classId) {
        setSelectedClass(filters.classId);
      }
    }
  }, []);

  // Save filter preferences
  useEffect(() => {
    const filtersToSave = {
      programId: classFilters.programId,
      subjectId: classFilters.subjectId,
      classId: classFilters.classId
    };
    localStorage.setItem('qrScannerFilters', JSON.stringify(filtersToSave));
  }, [classFilters]);

  // Load instructor's classes and programs
  useEffect(() => {
    if (!user?.uid) return;
    loadInstructorData();
  }, [user]);

  const loadInstructorData = async () => {
    try {
      setLoading(true);
      
      // Load all programs with proper names
      const programsSnap = await getDocs(collection(db, 'programs'));
      const programsData = programsSnap.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name || doc.data().name_en || doc.data().name_ar || 'Unknown Program',
        ...doc.data() 
      }));
      setPrograms(programsData);
      console.log('Loaded programs:', programsData);
      
      // Load all subjects with proper names
      const subjectsSnap = await getDocs(collection(db, 'subjects'));
      const subjectsData = subjectsSnap.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name || doc.data().name_en || doc.data().name_ar || 'Unknown Subject',
        ...doc.data() 
      }));
      setSubjects(subjectsData);
      console.log('Loaded subjects:', subjectsData);
      
      // Load classes where user is instructor or admin
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classData = classesSnap.docs.map(doc => ({ 
        id: doc.id || `class-${Math.random().toString(36).substr(2, 9)}`, // Use doc ID or generate
        ...doc.data() 
      }));
      
      console.log('🔍 LOADING CLASSES - Check browser console!');
      console.log('All classes loaded:', classData.length);
      console.log('User UID:', user.uid);
      console.log('User email:', user.email);
      console.log('Is admin:', isAdmin);
      
      // Show first few classes for debugging
      console.log('Sample classes:', classData.slice(0, 3).map(cls => ({
        name: cls.name || cls.code,
        id: cls.id,
        instructorId: cls.instructorId,
        createdBy: cls.createdBy,
        instructors: cls.instructors,
        ownerEmail: cls.ownerEmail,
        instructor: cls.instructor
      })));
      
      // Filter classes based on user role
      const filteredClasses = (isAdmin || isSuperAdmin) 
        ? classData 
        : classData.filter(cls => {
            console.log('Checking class:', cls.name || cls.code, 'ownerEmail:', cls.ownerEmail, 'your email:', user.email);
            return cls.ownerEmail === user.email ||
                   cls.instructorId === user.uid || 
                   cls.createdBy === user.uid ||
                   cls.instructors?.includes(user.uid) ||
                   cls.instructor === user.email;
          });
      
      console.log('Filtered classes for instructor:', filteredClasses.length);
      filteredClasses.forEach(cls => {
        console.log('Class accessible:', cls.name || cls.code, 'Year:', cls.year, 'Term:', cls.term);
      });
      
      setClasses(filteredClasses);
      console.log('Loaded classes:', filteredClasses);
      
    } catch (error) {
      console.error('Failed to load instructor data:', error);
      setError('Failed to load classes and programs');
    } finally {
      setLoading(false);
    }
  };

  // Handle QR scan success
  const handleScanSuccess = async (decodedText) => {
    try {
      setIsScanning(false);
      setSuccess('');
      setError('');
      
      // Parse QR content (expecting format: https://domain.com/qr/student/REFERENCE_ID)
      const match = decodedText.match(/\/qr\/student\/([A-Z0-9-]+)$/);
      if (!match) {
        throw new Error('Invalid student QR code format');
      }
      
      const referenceId = match[1];
      await loadStudentByReferenceId(referenceId);
      
    } catch (error) {
      console.error('Scan processing error:', error);
      setError(error.message || 'Failed to process QR code');
      setIsScanning(true); // Resume scanning
    }
  };

  // Load student by reference ID
  const loadStudentByReferenceId = async (referenceId) => {
    try {
      setLoading(true);
      
      // Query users collection for reference ID
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referenceId', '==', referenceId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Student not found with this reference ID');
      }
      
      const studentDoc = querySnapshot.docs[0];
      const studentData = studentDoc.data();
      
      // Verify it's a student
      if (studentData.role !== 'student') {
        throw new Error('This QR code is not for a student profile');
      }
      
      // Load student's enrollments
      const enrollmentsSnap = await getDocs(
        query(collection(db, 'enrollments'), where('userId', '==', studentDoc.id))
      );
      const enrollments = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Load student's attendance summary
      const attendanceSnap = await getDocs(
        query(collection(db, 'attendance'), where('studentId', '==', studentDoc.id))
      );
      const attendanceRecords = attendanceSnap.docs.map(doc => doc.data());
      
      const student = {
        uid: studentDoc.id,
        ...studentData,
        enrollments,
        attendanceSummary: {
          total: attendanceRecords.length,
          present: attendanceRecords.filter(r => r.status === 'present').length,
          late: attendanceRecords.filter(r => r.status === 'late').length,
          absent: attendanceRecords.filter(r => r.status.includes('absent')).length
        }
      };
      
      setScannedStudent(student);
      
      // Add to recent scans
      setRecentScans(prev => [
        {
          student,
          scannedAt: new Date(),
          actionType: 'profile_scan'
        },
        ...prev.slice(0, 9) // Keep last 10 scans
      ]);
      
      setSuccess(`Student profile loaded: ${student.displayName || student.email}`);
      
    } catch (error) {
      console.error('Failed to load student:', error);
      setError(error.message || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  // Record scan for analytics
  const recordScan = async (studentId, actionType = 'scan') => {
    try {
      const scanData = {
        studentId,
        instructorId: user.uid,
        actionType,
        scannedAt: new Date().toISOString(),
        classId: selectedClass || null
      };
      
      console.log('Recording scan:', scanData);
      
      // Save to Firestore if online, otherwise save offline
      if (navigator.onLine) {
        try {
          const { collection, addDoc } = await import('firebase/firestore');
          await addDoc(collection(db, 'scans'), scanData);
          console.log('Scan recorded to Firestore');
        } catch (firestoreError) {
          console.warn('Firestore permission error, saving offline:', firestoreError);
          // Fallback to offline storage
          await saveOfflineScan(scanData);
        }
      } else {
        await saveOfflineScan(scanData);
      }
      
      // Update recent scans
      setRecentScans(prev => [
        {
          student: scannedStudent,
          scannedAt: new Date(),
          actionType
        },
        ...prev.slice(0, 9) // Keep last 10 scans
      ]);
      
    } catch (error) {
      console.error('Failed to record scan:', error);
      // Don't throw error, just log it to avoid breaking the flow
    }
  };

  // Manual search
  const handleManualSearch = async () => {
    if (!manualSearch.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      
      const searchTerm = manualSearch.trim().toLowerCase();
      console.log('Searching for:', searchTerm);
      
      // Try to find by reference ID first
      if (searchTerm.startsWith('stu-')) {
        console.log('Trying reference ID search for:', manualSearch.trim());
        await loadStudentByReferenceId(manualSearch.trim());
        return;
      }
      
      // Try to find by email or display name
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('role', '==', 'student')
      );
      const querySnapshot = await getDocs(q);
      console.log('Found students count:', querySnapshot.docs.length);
      
      // Filter results for email or display name match
      const matchedStudents = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        const emailMatch = data.email?.toLowerCase().includes(searchTerm);
        const nameMatch = data.displayName?.toLowerCase().includes(searchTerm);
        console.log('Checking student:', data.email, 'emailMatch:', emailMatch, 'nameMatch:', nameMatch);
        return emailMatch || nameMatch;
      });
      
      console.log('Matched students:', matchedStudents.length);
      
      if (matchedStudents.length > 0) {
        const studentDoc = matchedStudents[0];
        const studentData = { uid: studentDoc.id, ...studentDoc.data() };
        console.log('Found student:', studentData);
        
        // Get proper display name
        const displayName = studentData?.displayName || 
                          (studentData?.firstName && studentData?.lastName ? `${studentData.firstName} ${studentData.lastName}` : '') ||
                          studentData?.email?.split('@')[0] || 
                          'Unknown Student';
        
        setScannedStudent(studentData);
        setSuccess(`Student found: ${displayName}`);
        recordScan(studentData.uid, 'manual_search');
      } else {
        throw new Error('Student not found');
      }
      
    } catch (error) {
      console.error('Manual search failed:', error);
      setError(error.message || 'Student not found');
    } finally {
      setLoading(false);
    }
  };

  // Quick attendance marking
  const handleMarkAttendance = async () => {
    if (!scannedStudent?.uid || !selectedClass) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const today = new Date().toISOString().split('T')[0];
      
      const result = await markAttendance({
        classId: selectedClass,
        studentId: scannedStudent.uid,
        date: today,
        status: attendanceStatus,
        markedBy: user.uid,
        method: 'qr',
        notes: attendanceNote,
        studentInfo: {
          email: scannedStudent.email,
          displayName: scannedStudent.displayName
        },
        className: classes.find(c => c.id === selectedClass)?.name || selectedClass,
        sendNotification: true
      });
      
      if (result.success) {
        setSuccess(`Attendance marked: ${attendanceStatus} for ${scannedStudent.displayName || 
                        (scannedStudent.firstName && scannedStudent.lastName ? `${scannedStudent.firstName} ${scannedStudent.lastName}` : '') ||
                        scannedStudent.email?.split('@')[0] || 
                        'Unknown Student'}`);
        
        // Update recent scans with action
        setRecentScans(prev => [
          {
            student: scannedStudent,
            scannedAt: new Date(),
            actionType: 'attendance_marked',
            details: { status: attendanceStatus, classId: selectedClass }
          },
          ...prev.slice(0, 9)
        ]);
        
        // Reset form
        setAttendanceNote('');
      } else {
        throw new Error(result.error || 'Failed to mark attendance');
      }
      
    } catch (error) {
      console.error('Attendance marking failed:', error);
      setError(error.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  // Toggle scanning
  const toggleScanning = () => {
    setIsScanning(!isScanning);
    setError('');
    setSuccess('');
  };

  // Toggle collapsed sections
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Clear scanned student
  const clearScannedStudent = () => {
    setScannedStudent(null);
    setSuccess('');
    setError('');
    setAttendanceNote('');
  };

  if (authLoading) {
    return <Loading variant="overlay" fullscreen message="Loading..." />;
  }

  if (!isAdmin && !isSuperAdmin && !isInstructor) {
    return (
      <div className="access-denied">
        <Shield size={48} />
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className={`instructor-qr-scanner ${isDark ? 'dark' : 'light'} ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Ribbon Navigation */}
      <div className="ribbon-with-clock">
        <RibbonTabs
          categories={[
            {
              id: 'main',
              label: 'QR Scanner',
              items: [
                { key: 'scanner', label: 'Scanner', icon: <Camera size={18} /> },
                { key: 'manual', label: 'Manual Search', icon: <Search size={18} /> },
                { key: 'recent', label: 'Recent Scans', icon: <Clock size={18} />, badge: recentScans.length > 0 ? recentScans.length : undefined }
              ]
            }
          ]}
          activeCategory="main"
          activeItem={activeTab}
          onChange={({ item }) => setActiveTab(item)}
        />
      </div>

      {/* Main Content */}
      <div className="scanner-content">
        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div className="scanner-tab">
            {/* Collapsible Scanner Section */}
            <div className={`collapsible-section ${collapsedSections.scanner ? 'collapsed' : ''}`}>
              <div 
                className="section-header"
                onClick={() => toggleSection('scanner')}
              >
                <h3>
                  <Camera size={20} />
                  QR Scanner
                </h3>
                <button className="collapse-toggle">
                  {collapsedSections.scanner ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              </div>
              
              {!collapsedSections.scanner && (
                <div className="section-content">
                  <div className="scanner-controls">
                    <Button
                      onClick={toggleCamera}
                      variant="outline"
                      size="sm"
                      className="camera-switch"
                      disabled={devices.length < 2}
                    >
                      <Camera size={16} />
                      {facingMode === 'environment' ? 'Front' : 'Back'} Camera
                    </Button>
                    
                    <Button
                      onClick={toggleScanning}
                      variant={isScanning ? 'danger' : 'primary'}
                      size="lg"
                      className="scanner-toggle"
                    >
                      {isScanning ? (
                        <>
                          <CameraOff size={20} />
                          Stop Scanning
                        </>
                      ) : (
                        <>
                          <Camera size={20} />
                          Start Scanning
                        </>
                      )}
                    </Button>
                    
                    {isScanning && (
                      <Button
                        onClick={() => setIsScanning(false)}
                        variant="ghost"
                        size="sm"
                      >
                        <RotateCcw size={16} />
                        Reset
                      </Button>
                    )}
                  </div>
                  
                  <QRScannerInterface
                    isActive={isScanning}
                    onScanSuccess={handleScanSuccess}
                    onScanError={(error) => setError(error)}
                    isMobile={isMobile}
                  />
                </div>
              )}
            </div>

            {/* Student Info Section */}
            {scannedStudent && (
              <div className="student-info-section">
                <div className="section-header">
                  <h3>
                    <User size={20} />
                    Student Profile
                  </h3>
                  <Button
                    onClick={clearScannedStudent}
                    variant="ghost"
                    size="sm"
                  >
                    <XCircle size={16} />
                    Clear
                  </Button>
                </div>
                
                <div className="student-profile">
                  <div className="profile-header">
                    <div className="student-avatar">
                      {(scannedStudent.displayName || 
                        (scannedStudent.firstName && scannedStudent.lastName ? `${scannedStudent.firstName} ${scannedStudent.lastName}` : '') ||
                        scannedStudent.email?.split('@')[0] || 
                        'Unknown Student').charAt(0).toUpperCase()}
                    </div>
                    <div className="student-info">
                      <h4>{scannedStudent.displayName || 
                            (scannedStudent.firstName && scannedStudent.lastName ? `${scannedStudent.firstName} ${scannedStudent.lastName}` : '') ||
                            scannedStudent.email?.split('@')[0] || 
                            'Unknown Student'}</h4>
                        <p>{scannedStudent.email}</p>
                        <div className="reference-id">
                          <QrCode size={14} />
                          <span>{scannedStudent.referenceId}</span>
                        </div>
                      </div>
                  </div>
                  
                  <div className="profile-stats">
                    <div className="stat-item">
                      <BookOpen size={16} />
                      <div>
                        <span className="stat-value">{scannedStudent.enrollments?.length || 0}</span>
                        <span className="stat-label">Enrollments</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <CheckCircle size={16} />
                      <div>
                        <span className="stat-value">{scannedStudent.attendanceSummary?.present || 0}</span>
                        <span className="stat-label">Present</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <Clock size={16} />
                      <div>
                        <span className="stat-value">{scannedStudent.attendanceSummary?.late || 0}</span>
                        <span className="stat-label">Late</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <XCircle size={16} />
                      <div>
                        <span className="stat-value">{scannedStudent.attendanceSummary?.absent || 0}</span>
                        <span className="stat-label">Absent</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Section */}
            {scannedStudent && (
              <div className="quick-actions-section">
                <div className="section-header">
                  <h3>
                    <Zap size={20} />
                    Quick Actions
                  </h3>
                </div>
                
                <div className="action-forms">
                  <div className="action-form">
                    <h4>
                      <Target size={16} />
                      Student Actions
                    </h4>
                    
                    <p className="action-description">
                      Perform quick actions for {scannedStudent.displayName || 
                        (scannedStudent.firstName && scannedStudent.lastName ? `${scannedStudent.firstName} ${scannedStudent.lastName}` : '') ||
                        scannedStudent.email?.split('@')[0] || 
                        'Unknown Student'}
                    </p>
                    
                    <Button
                      onClick={() => {
                        setModalContext({
                          classId: selectedClass,
                          programId: selectedProgram,
                          subjectId: selectedSubject
                        });
                        setShowQuickActionModal(true);
                      }}
                      variant="primary"
                      className="action-button"
                    >
                      <Zap size={16} />
                      Open Quick Actions
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Search Tab */}
        {activeTab === 'manual' && (
          <div className="manual-search-tab">
            <div className="compact-search">
              <div className="search-row">
                <Input
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualSearch();
                    }
                  }}
                  placeholder="Search by name, email, or reference ID..."
                  className="search-input-compact"
                />
                <Button
                  onClick={handleManualSearch}
                  disabled={!manualSearch.trim() || loading}
                  variant="primary"
                  size="sm"
                  className="search-button-compact"
                >
                  <Search size={14} />
                </Button>
              </div>
              
              {/* Quick Filters */}
              <div className="quick-filters">
                <Select
                  value={classFilters.programId}
                  onChange={(e) => {
                    setClassFilters({...classFilters, programId: e.target.value});
                    setSelectedProgram(e.target.value);
                  }}
                  options={[
                    { value: '', label: 'All Programs', icon: <Filter size={16} color="var(--text-secondary, #374151)" /> },
                    ...programs.map(program => ({
                      value: program.id,
                      label: program.name,
                      icon: <GraduationCap size={16} color="var(--text-secondary, #374151)" />
                    }))
                  ]}
                  placeholder="Program"
                  searchable={true}
                  size="small"
                />
                
                <Select
                  value={classFilters.subjectId}
                  onChange={(e) => {
                    setClassFilters({...classFilters, subjectId: e.target.value});
                    setSelectedSubject(e.target.value);
                  }}
                  options={[
                    { value: '', label: 'All Subjects', icon: <Filter size={16} color="var(--text-secondary, #374151)" /> },
                    ...subjects.map(subject => ({
                      value: subject.id,
                      label: subject.name,
                      icon: <BookOpen size={16} color="var(--text-secondary, #374151)" />
                    }))
                  ]}
                  placeholder="Subject"
                  searchable={true}
                  size="small"
                />
                
                <Select
                  value={classFilters.classId}
                  onChange={(e) => {
                    setClassFilters({...classFilters, classId: e.target.value});
                    setSelectedClass(e.target.value);
                  }}
                  options={[
                    { value: '', label: 'All Classes', icon: <Filter size={16} color="var(--text-secondary, #374151)" /> },
                    ...filteredClasses.map(cls => ({
                      value: cls.id,
                      label: `${cls.name || cls.code} - ${cls.term || ''} ${cls.year || ''}`,
                      icon: <Users size={16} color="var(--text-secondary, #374151)" />
                    }))
                  ]}
                  placeholder="Class"
                  searchable={true}
                  size="small"
                />
              </div>
            </div>
            
            {/* Show search results here - same as scanner results */}
            {scannedStudent && (
              <div className="search-results">
                {/* Same student profile display as scanner tab */}
                <div className="student-info-section">
                  <div className="section-header">
                    <h3>
                      <User size={20} />
                      Search Results
                    </h3>
                    <Button
                      onClick={clearScannedStudent}
                      variant="ghost"
                      size="sm"
                    >
                      <XCircle size={16} />
                      Clear
                    </Button>
                  </div>
                  
                  {/* Reuse student profile component */}
                  <div className="student-profile">
                    {/* Same profile content as scanner tab */}
                    <div className="profile-header">
                      <div className="student-avatar">
                        {(scannedStudent.displayName || 
                          (scannedStudent.firstName && scannedStudent.lastName ? `${scannedStudent.firstName} ${scannedStudent.lastName}` : '') ||
                          scannedStudent.email?.split('@')[0] || 
                          'Unknown Student').charAt(0).toUpperCase()}
                      </div>
                      <div className="student-info">
                        <h4>{scannedStudent.displayName || 
                              (scannedStudent.firstName && scannedStudent.lastName ? `${scannedStudent.firstName} ${scannedStudent.lastName}` : '') ||
                              scannedStudent.email?.split('@')[0] || 
                              'Unknown Student'}</h4>
                        <p>{scannedStudent.email}</p>
                        <div className="reference-id">
                          <QrCode size={14} />
                          <span>{scannedStudent.referenceId || 'No Ref ID'}</span>
                        </div>
                        <div className="profile-actions">
                          <Button
                            onClick={() => navigate(`/student/${scannedStudent.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <User size={14} />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Scans Tab */}
        {activeTab === 'recent' && (
          <div className="recent-scans-tab">
            {/* Filters for Recent Scans */}
            <div className="recent-filters">
              <h4>
                <Filter size={16} />
                Filter Recent Scans
              </h4>
              <div className="filter-grid">
                <Select
                  value={classFilters.programId}
                  onChange={(e) => setClassFilters({...classFilters, programId: e.target.value})}
                  options={[
                    { value: '', label: 'All Programs', icon: <Filter size={16} color="var(--text-secondary, #374151)" /> },
                    ...programs.map(program => ({
                      value: program.id,
                      label: program.name,
                      icon: <GraduationCap size={16} color="var(--text-secondary, #374151)" />
                    }))
                  ]}
                  placeholder="Select Program"
                  searchable={true}
                  size="small"
                />
                
                <Select
                  value={classFilters.subjectId}
                  onChange={(e) => setClassFilters({...classFilters, subjectId: e.target.value})}
                  options={[
                    { value: '', label: 'All Subjects', icon: <Filter size={16} color="var(--text-secondary, #374151)" /> },
                    ...subjects.map(subject => ({
                      value: subject.id,
                      label: subject.name,
                      icon: <BookOpen size={16} color="var(--text-secondary, #374151)" />
                    }))
                  ]}
                  placeholder="Select Subject"
                  searchable={true}
                  size="small"
                />
                
                <Select
                  value={classFilters.classId}
                  onChange={(e) => setClassFilters({...classFilters, classId: e.target.value})}
                  options={[
                    { value: '', label: 'All Classes', icon: <Filter size={16} color="var(--text-secondary, #374151)" /> },
                    ...filteredClasses.map(cls => ({
                      value: cls.id,
                      label: `${cls.name || cls.code} - ${cls.term || ''} ${cls.year || ''}`,
                      icon: <Users size={16} color="var(--text-secondary, #374151)" />
                    }))
                  ]}
                  placeholder="Select Class"
                  searchable={true}
                  size="small"
                />
              </div>
            </div>
            
            <div className="recent-scans-list">
              {recentScans.length === 0 ? (
                <div className="empty-state">
                  <Clock size={48} />
                  <h3>No Recent Scans</h3>
                  <p>Start scanning students to see their history here.</p>
                </div>
              ) : (
                recentScans.map((scan, index) => (
                  <div key={index} className="recent-scan-item">
                    <div className="scan-info">
                      <div className="student-mini">
                        <div className="mini-avatar">
                          {scan.student?.displayName?.charAt(0)?.toUpperCase() || scan.student?.email?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="mini-details">
                          <h4>{scan.student?.displayName || scan.student?.email || 'Unknown Student'}</h4>
                          <p>{scan.student?.email || 'No email'}</p>
                          <div className="scan-time">
                            <Clock size={12} />
                            {scan.scannedAt?.toLocaleString() || 'Unknown time'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="scan-action">
                        <span className="action-badge">
                          {scan.actionType === 'profile_scan' ? (
                            <>
                              <User size={12} />
                              Profile Scan
                            </>
                          ) : scan.actionType === 'attendance_marked' ? (
                            <>
                              <CheckCircle size={12} />
                              Attendance: {scan.details?.status}
                            </>
                          ) : (
                            scan.actionType
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setScannedStudent(scan.student)}
                      variant="ghost"
                      size="sm"
                    >
                      <User size={14} />
                      View Profile
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="status-message error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-button">
            <XCircle size={14} />
          </button>
        </div>
      )}
      
      {success && (
        <div className="status-message success">
          <CheckCircle size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="close-button">
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <Loading variant="overlay" fullscreen message="Processing..." />
      )}

      {/* Quick Action Modal */}
      {scannedStudent && (
        <StudentQuickActionModal
          student={scannedStudent}
          isOpen={showQuickActionModal}
          onClose={() => setShowQuickActionModal(false)}
          onSuccess={(actionData) => {
            setSuccess(`${actionData.type} action completed successfully for ${scannedStudent.displayName || 
                        (scannedStudent.firstName && scannedStudent.lastName ? `${scannedStudent.firstName} ${scannedStudent.lastName}` : '') ||
                        scannedStudent.email?.split('@')[0] || 
                        'Unknown Student'}`);
            setShowQuickActionModal(false);
          }}
          initialContext={modalContext}
          classes={filteredClasses}
        />
      )}
      
      {/* Draggable Clock */}
      <DraggableClock />
    </div>
  );
};

export default InstructorQRScannerPage;
