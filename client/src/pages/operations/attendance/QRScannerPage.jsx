import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { db } from '@services/other/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getClasses } from '@services/business/classService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { notificationGateway } from '@services/business/notificationGateway';
import { uploadReport } from '@services/business/fileStorageService';
import { REPORT_TYPES, STORAGE_CONSTANTS } from '@constants/reportConstants';
import { getThemedIcon } from '@constants/iconTypes';
import Modal from '@ui/Modal/Modal';
import { markAttendance, getAttendanceByClass, getAttendanceByStudent, deleteAttendance } from '@services/business/attendanceService';
import { getAttendanceRecords } from '@services/db/attendanceDbService';
import { createPenalty, getPenalties, deletePenalty } from '@services/business/penaltyService';
import { createParticipation, getParticipations, deleteParticipation } from '@services/business/participationService';
import { createBehavior, getBehaviors, deleteBehavior } from '@services/business/behaviorService';
import { getPerformedByFields } from '@services/business/userService';
import { PENALTY_TYPES } from '@constants/penaltyTypes';
import { ATTENDANCE_METHODS, getAttendanceMethodLabel } from '@constants/attendanceMethods';
import { ATTENDANCE_TYPES } from '@constants/attendanceTypes';
import { EMAIL_TEMPLATE_TYPES } from '@constants/templateTypes';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { useToast } from '@ui/ToastProvider.jsx';
import { addNotification } from '@services/business/notificationService';
import { sendStudentNotification } from '@services/business/notificationService';
import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
import { PARTICIPATION_TYPES } from '@constants/participationTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { USER_ROLES } from '@constants/activityTypes';
import { Select, DatePicker, Button, Card, CardBody } from '@ui';
import QRScanner from '@/components/qr-scanner/QRScanner';
import StudentRoster from '@/components/qr-scanner/StudentRoster';
import StudentActionStatsPanel from '@/components/qr-scanner/StudentActionStatsPanel';
import StudentActionZapPanel from '@/components/qr-scanner/StudentActionZapPanel';
import ReportExportModal from '@/components/qr-scanner/ReportExportModal';
import '@/components/qr-scanner/ui/qr-scanner-ui.css';
import './QRScannerPage.module.css';
import eventBus, { EVENTS } from '@utils/eventBus';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const QRScannerPage = () => {
  const { user, loading: authLoading, isAdmin, isSuperAdmin, isHR, isInstructor, role } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const showSuccess = toast?.showSuccess || ((msg) => console.log('SUCCESS:', msg));
  const showError = toast?.showError || ((msg) => console.log('ERROR:', msg));
  const showInfo = toast?.showInfo || ((msg) => console.log('INFO:', msg));
  const { startLoading } = useGlobalLoading();

  // Helper functions to save selections to localStorage
  const saveSelectedProgramId = useCallback((programId) => {
    try {
      localStorage.setItem('qrScanner_selectedProgramId', programId);
    } catch (error) {
      console.warn(t('instructor_qr_failed_to_save_program_id'), error);
    }
    setSelectedProgramId(programId);
  }, []);

  const saveSelectedSubjectId = useCallback((subjectId) => {
    try {
      localStorage.setItem('qrScanner_selectedSubjectId', subjectId);
    } catch (error) {
      console.warn(t('instructor_qr_failed_to_save_subject_id'), error);
    }
    setSelectedSubjectId(subjectId);
  }, []);

  const saveSelectedClassId = useCallback((classId) => {
    try {
      localStorage.setItem('qrScanner_selectedClassId', classId);
    } catch (error) {
      console.warn(t('instructor_qr_failed_to_save_class_id'), error);
    }
    setSelectedClassId(classId);
  }, []);

  // Helper function to validate if a selection still exists in available data
  const validateSelection = useCallback((selectionId, availableItems, itemType) => {
    if (selectionId === 'all') return true;
    return availableItems.some(item => 
      (item.id === selectionId) || (item.docId === selectionId)
    );
  }, []);

  // Filter state
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(() => {
    // Try to get saved selection from localStorage, fallback to 'all'
    try {
      const saved = localStorage.getItem('qrScanner_selectedProgramId');
      return saved || 'all';
    } catch {
      return 'all';
    }
  });
  
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    // Try to get saved selection from localStorage, fallback to 'all'
    try {
      const saved = localStorage.getItem('qrScanner_selectedSubjectId');
      return saved || 'all';
    } catch {
      return 'all';
    }
  });
  
  const [selectedClassId, setSelectedClassId] = useState(() => {
    // Try to get saved selection from localStorage, fallback to 'all'
    try {
      const saved = localStorage.getItem('qrScanner_selectedClassId');
      return saved || 'all';
    } catch {
      return 'all';
    }
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    // Use ISO format for database operations (Qatar time adjusted)
    const qatarNow = getQatarNow();
    return qatarNow.toISOString().split('T')[0]; // Format as yyyy-MM-dd
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [participationMin, setParticipationMin] = useState('');
  const [participationMax, setParticipationMax] = useState('');
  const [penaltyFilter, setPenaltyFilter] = useState('all');

  // Data state
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [penaltyRecords, setPenaltyRecords] = useState([]);
  const [error, setError] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteBehaviors, setFavoriteBehaviors] = useState([]);
  const [showScanner, setShowScanner] = useState(true);
  const [sendNotifications, setSendNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [isScannerMinimized, setIsScannerMinimized] = useState(false);
  
  // Report export modal state (unified for both daily and summary)
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [showSemesterReportConfirm, setShowSemesterReportConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv', 'email'
  const [dailyExportFormat, setDailyExportFormat] = useState('csv'); // For daily report
  const [isExporting, setIsExporting] = useState(false);
  const [selectedSubjectsForReport, setSelectedSubjectsForReport] = useState([]);
  const [emailRecipients, setEmailRecipients] = useState([]); // For email functionality
  const [dailyEmailRecipients, setDailyEmailRecipients] = useState([]); // For daily report email
  const [showEmailRecipientDialog, setShowEmailRecipientDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]); // Instructors, Admins, HR
  const [usersLoading, setUsersLoading] = useState(false);
  
  
  // Computed values for selected names
  const selectedClassName = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return null;
    const selectedClass = classes.find(c => c.id === selectedClassId);
    return selectedClass?.name || selectedClass?.nameEn || 'Unknown Class';
  }, [selectedClassId, classes]);

  const selectedProgramName = useMemo(() => {
    if (!selectedProgramId || selectedProgramId === 'all') return null;
    const selectedProgram = programs.find(p => p.id === selectedProgramId);
    return selectedProgram?.name || selectedProgram?.nameEn || 'Unknown Program';
  }, [selectedProgramId, programs]);

  // Debounced resize handler for performance
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle QR scanner minimization changes
  const handleScannerMinimizeChange = useCallback((isMinimized) => {
    logger.log(t('instructor_qr_qr_scanner_minimization_changed'), isMinimized); // Debug
    setIsScannerMinimized(isMinimized);
  }, []);

  // Redirect to login if session expired (no user)
  useEffect(() => {
    if (!user && !authLoading) {
      logger.debug(t('instructor_qr_no_user_found_redirecting'));
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Sidebar state
  const [activityRefresh, setActivityRefresh] = useState(null);
  const [deleteActivityModalOpen, setDeleteActivityModalOpen] = useState(false);
  const [activityToDelete, setDeleteActivityData] = useState(null);
  const [deleteActivityLoading, setDeleteActivityLoading] = useState(false);

  // Handle activity refresh from QRScanner
  const handleActivityUpdate = useCallback((refreshFunction) => {
    if (refreshFunction) {
      refreshFunction(); // Call the refresh function immediately
    }
  }, []);

  // Handle activity deletion from QRScanner
  const handleDeleteActivity = (activity) => {
    setDeleteActivityData(activity);
    setDeleteActivityModalOpen(true);
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    
    setDeleteActivityLoading(true);
    try {
      let result;
      if (activityToDelete.type === RECORD_TYPES.ATTENDANCE) {
        result = await deleteAttendance(activityToDelete.id);
        if (result.success) {
          eventBus.emit(EVENTS.ATTENDANCE_MARKED, { studentId: activityToDelete.studentId });
        }
      } else if (activityToDelete.type === RECORD_TYPES.PENALTY) {
        result = await deletePenalty(activityToDelete.id);
        if (result.success) {
          eventBus.emit(EVENTS.PENALTY_ASSIGNED, { studentId: activityToDelete.studentId });
        }
      } else if (activityToDelete.type === RECORD_TYPES.PARTICIPATION) {
        result = await deleteParticipation(activityToDelete.id);
        if (result.success) {
          eventBus.emit(EVENTS.PARTICIPATION_ADDED, { studentId: activityToDelete.studentId, status: 'deleted' });
        }
      } else if (activityToDelete.type === RECORD_TYPES.BEHAVIOR) {
        result = await deleteBehavior(activityToDelete.id);
        if (result.success) {
          eventBus.emit(EVENTS.BEHAVIOR_LOGGED, { studentId: activityToDelete.studentId, status: 'deleted' });
        }
      }
      
      if (result?.success) {
        triggerActivityRefresh();
        loadStudents(selectedClassId, selectedDate);
      }
    } catch (error) {
      console.error(t('instructor_qr_error_deleting_activity'), error);
    } finally {
      setDeleteActivityLoading(false);
      setDeleteActivityModalOpen(false);
      setDeleteActivityData(null);
    }
  };

  // Memoized trigger activity refresh
  const triggerActivityRefresh = useCallback(() => {
    if (activityRefresh) {
      activityRefresh();
    }
  }, [activityRefresh]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoized options for dropdowns - following DashboardPage pattern
  const programOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('instructor_qr_all_programs'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validPrograms = programs
      .filter(prog => prog.docId || prog.id)
      .map(prog => {
        const value = prog.docId || prog.id;
        const label = lang === 'ar' ? (prog.nameAr || prog.nameEn || prog.name || prog.code || value) : (prog.nameEn || prog.name || prog.code || value);
        return { value, label, icon: getThemedIcon('ui', 'book_open', 16, theme) };
      });
    return [...opts, ...validPrograms];
  }, [programs, t, lang, theme]);

  const subjectOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_subjects'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validSubjects = subjects
      .filter(sub => {
        if (!selectedProgramId || selectedProgramId === 'all') return true;
        const subProgramId = sub.programId || sub.program || '';
        const formProgramId = selectedProgramId;
        return subProgramId === formProgramId;
      })
      .filter(sub => sub.docId || sub.id)
      .map(sub => {
        const value = sub.docId || sub.id;
        const label = lang === 'ar' ? (sub.nameAr || sub.nameEn || sub.name || sub.code || value) : (sub.nameEn || sub.name || sub.code || value);
        return { value, label, icon: getThemedIcon('ui', 'file_text', 16, theme) };
      });
    return [...opts, ...validSubjects];
  }, [subjects, selectedProgramId, t, lang, theme]);

  const classOptions = useMemo(() => {
    const opts = [
      { value: 'all', label: t('all_classes'), icon: getThemedIcon('ui', 'filter', 16, theme) }
    ];
    const validClasses = classes
      .filter(cls => {
        if (!selectedSubjectId || selectedSubjectId === 'all') return true;
        const clsSubjectId = cls.subjectId || cls.subject || '';
        const formSubjectId = selectedSubjectId;
        return clsSubjectId === formSubjectId;
      })
      .filter(cls => cls.docId || cls.id)
      .map(cls => {
        const value = cls.docId || cls.id;
        const name = lang === 'ar' ? (cls.nameAr || cls.name) : (cls.name || cls.nameAr || t('unnamed_class'));
        const label = `${name}${cls.code ? ` (${cls.code})` : ''}`;
        return { value, label, icon: getThemedIcon('ui', 'users', 16, theme) };
      });
    return [...opts, ...validClasses];
  }, [classes, selectedSubjectId, t, lang, theme]);

  // Load programs on mount
  useEffect(() => {
    logger.debug('[QR Scanner] Initializing page...');
    const stopLoading = startLoading();
    
    // Wrap loadPrograms to ensure loading stops
    const init = async () => {
      try {
        await loadPrograms();
      } finally {
        stopLoading();
      }
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load subjects when program changes
  useEffect(() => {
    if (selectedProgramId && selectedProgramId !== 'all') {
      setGridLoading(true);
      loadSubjects(selectedProgramId);
    } else {
      setGridLoading(true);
      loadSubjects(null);
      setSubjects([]);
      // Don't reset selections here - let the auto-selection logic handle it
      setGridLoading(false);
    }
  }, [selectedProgramId]);

  // Load classes when subject changes
  useEffect(() => {
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      loadClasses(selectedSubjectId);
    } else {
      setClasses([]);
      // Don't reset selectedClassId here - let the auto-selection logic handle it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjectId]);

  // Memoized loadStudents function for performance
  const loadStudents = useCallback(async (classId, date) => {
    try {
      logger.debug('[QR Scanner] Loading students for class:', classId, 'date:', date);
      setLoading(true);

      // Parallel data fetching for better performance
      const [enrollmentsResponse, usersResponse, penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
        getEnrollments(),
        getUsers(),
        getPenalties(),
        getParticipations(),
        getBehaviors()
      ]);

      const allEnrollments = enrollmentsResponse.success ? enrollmentsResponse.data : [];
      const allUsers = usersResponse.success ? usersResponse.data : [];
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const allParticipations = participationsResponse.success ? participationsResponse.data : [];
      const allBehaviors = behaviorsResponse.success ? behaviorsResponse.data : [];
      
      // Create Set for O(1) lookup performance
      const classEnrollments = allEnrollments.filter(e => e.classId === classId);
      const studentIdSet = new Set(classEnrollments.map(e => e.userId));
      const studentUsers = allUsers.filter(u => 
        studentIdSet.has(u.id) || studentIdSet.has(u.docId)
      );
      
      setEnrollments(classEnrollments);

      if (studentUsers.length === 0) {
        logger.warn('[QR Scanner] No students found for this class');
      }

      // Get attendance for selected date
      const dateStr = date;
      const attendanceResponse = await getAttendanceByClass(classId, dateStr);
      const attendance = attendanceResponse.success ? attendanceResponse.data : [];
      setAttendanceRecords(attendance);

      // Create penalty map for O(1) lookup
      const penaltyMap = new Map();
      allPenalties.forEach(p => {
        if (studentIdSet.has(p.studentId)) {
          const existing = penaltyMap.get(p.studentId) || [];
          existing.push(p);
          penaltyMap.set(p.studentId, existing);
        }
      });
      setPenaltyRecords(Array.from(penaltyMap.values()).flat());

      // Create participation/behavior maps for O(1) lookup
      const participationMap = new Map();
      allParticipations.forEach(p => {
        if (studentIdSet.has(p.studentId) || studentIdSet.has(p.docId)) {
          const existing = participationMap.get(p.studentId) || [];
          existing.push(p);
          participationMap.set(p.studentId, existing);
        }
      });

      const behaviorMap = new Map();
      allBehaviors.forEach(b => {
        if (studentIdSet.has(b.studentId) || studentIdSet.has(b.docId)) {
          const existing = behaviorMap.get(b.studentId) || [];
          existing.push(b);
          behaviorMap.set(b.studentId, existing);
        }
      });

      // Process students in parallel batches for better performance
      const BATCH_SIZE = 10;
      const studentsWithData = [];
      
      for (let i = 0; i < studentUsers.length; i += BATCH_SIZE) {
        const batch = studentUsers.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(async (student) => {
          const studentId = student.id || student.docId;
          const studentName = student.displayName || student.realName || student.name || student.email;
          
          // Find the primary attendance record
          const studentRecords = attendance.filter(a => a.studentId === studentId);
          const todayAttendance = studentRecords.find(a => !a.delta) || studentRecords[0];

          // Fetch all attendance records for this student (attendance only)
          const studentAttendanceResponse = await getAttendanceByStudent(studentId);
          const studentAttendanceRecords = studentAttendanceResponse.success ? studentAttendanceResponse.data : [];

          // Attendance total should count status records only
          let totalAttendanceCount = 0;
          const attendanceStats = {
            present: 0,
            late: 0,
            absent: 0,
            absentWithExcuse: 0,
            excusedLeave: 0,
            humanitarianCase: 0
          };

          studentAttendanceRecords.forEach(record => {
            if (record.status === 'present' || record.status === 'late') {
              totalAttendanceCount++;
            }
            switch (record.status) {
              case 'present':
                attendanceStats.present++;
                break;
              case 'late':
                attendanceStats.late++;
                break;
              case 'absent_no_excuse':
                attendanceStats.absent++;
                break;
              case 'absent_with_excuse':
                attendanceStats.absentWithExcuse++;
                break;
              case 'excused_leave':
                attendanceStats.excusedLeave++;
                break;
              case 'humanitarian_case':
                attendanceStats.humanitarianCase++;
                break;
            }
          });

          // Participation/Behavior totals + history from dedicated collections
          const participations = participationMap.get(studentId) || [];
          const behaviors = behaviorMap.get(studentId) || [];

          const participationTotal = participations.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
          const behaviorTotal = behaviors.reduce((sum, b) => sum + (Number(b.points) || 0), 0);

          const studentParticipationHistory = participations.map(p => ({
            id: p.docId || p.id,
            date: p.date,
            time: p.createdAt,
            points: p.points,
            reason: p.description || '',
            markedBy: p.createdBy,
            category: RECORD_TYPES.PARTICIPATION
          }));

          const studentBehaviorHistory = behaviors.map(b => ({
            id: b.docId || b.id,
            date: b.date,
            time: b.createdAt,
            points: b.points,
            reason: b.description || '',
            markedBy: b.createdBy,
            category: RECORD_TYPES.BEHAVIOR
          }));

          // Get penalties from map
          const penalties = penaltyMap.get(studentId) || [];
          
          const penaltyTotal = penalties.reduce((sum, p) => {
            const pPoints = p.points;
            if (pPoints !== null && pPoints !== undefined && pPoints !== '' && !isNaN(pPoints)) {
              const negativePoints = -Math.abs(Number(pPoints)); // Convert to negative
              return sum + negativePoints;
            }
            return sum;
          }, 0);

          return {
            id: studentId,
            docId: student.docId,
            studentId: student.studentId || studentId,
            studentNumber: student.studentNumber,
            name: studentName,
            email: student.email,
            studentOrder: student.studentOrder, // Add student order field
            attendance: todayAttendance?.status || 'absent_no_excuse',
            participation: participationTotal,
            behavior: behaviorTotal,
            penalty: penaltyTotal,
            totalAttendance: totalAttendanceCount,
            attendanceStats, // Add detailed attendance statistics
            isPinned: student.isPinned || false,
            behaviorHistory: studentBehaviorHistory,
            participationHistory: studentParticipationHistory,
            penaltyHistory: penalties
          };
        }));
        
        studentsWithData.push(...batchResults);
      }

      setStudents(studentsWithData);
      
      logger.debug('[LoadStudents] Loaded', studentsWithData.length, 'students');
    } catch (error) {
      logger.error('[QR Scanner] Error loading students:', error);
      setStudents([]);
      setError('Failed to load students: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load students when class or date changes
  useEffect(() => {
    if (selectedClassId && selectedClassId !== 'all') {
      loadStudents(selectedClassId, selectedDate);
    } else {
      setStudents([]);
    }
  }, [selectedClassId, selectedDate, loadStudents]);

  // Load favorite behaviors when student changes
  useEffect(() => {
    if (selectedStudent?.id) {
      const studentFavorites = selectedStudent.favoriteBehaviors || [];
      setFavoriteBehaviors(studentFavorites);
    } else {
      setFavoriteBehaviors([]);
    }
  }, [selectedStudent?.id, selectedStudent?.favoriteBehaviors]);

  // Listen for real-time attendance updates with debouncing
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.ATTENDANCE_MARKED, (data) => {
      // If the update is for the current class, refresh students immediately
      if (data.classId === selectedClassId) {
        logger.debug('🔄 Attendance marked event received, refreshing students for class:', selectedClassId);
        
        // Immediate refresh to update UI
        loadStudents(selectedClassId, selectedDate);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedClassId, selectedDate, loadStudents]);

  const loadPrograms = async () => {
    try {
      const programsResponse = await getPrograms();
      let programsData = programsResponse.success ? programsResponse.data : [];

      if (programsData.length === 0) {
        logger.warn('[QR Scanner] No programs found in database');
        setPrograms(programsData);
        setInitialLoading(false);
        return;
      }

      setPrograms(programsData);
      
      // Validate saved selection or auto-select first program
      const currentSelection = selectedProgramId;
      const isValidSelection = validateSelection(currentSelection, programsData, 'program');
      
      if (!isValidSelection || currentSelection === 'all') {
        const firstProgram = programsData[0];
        const programId = firstProgram.id || firstProgram.docId;
        saveSelectedProgramId(programId);
        logger.debug('[QR Scanner] Auto-selected first program:', firstProgram.name || firstProgram.code);
      } else {
        logger.debug('[QR Scanner] Using saved program selection:', currentSelection);
      }
      
      setInitialLoading(false);
    } catch (error) {
      logger.error('[QR Scanner] Error loading programs:', error);
      setPrograms([]);
      setError('Failed to load programs: ' + error.message);
      setInitialLoading(false);
    }
  };

  const loadSubjects = useCallback(async (programId) => {
    try {
      const subjectsResponse = await getSubjects(programId || null);
      let subjectsData = subjectsResponse.success ? subjectsResponse.data : [];
      
      // Sort client-side when filtering by program to avoid index requirement
      if (programId) {
        subjectsData.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      }

      setSubjects(subjectsData);
      
      // Validate saved selection or auto-select first subject
      const currentSelection = selectedSubjectId;
      const isValidSelection = validateSelection(currentSelection, subjectsData, 'subject');
      
      if (!isValidSelection || currentSelection === 'all') {
        if (subjectsData.length > 0) {
          const firstSubject = subjectsData[0];
          const subjectId = firstSubject.id || firstSubject.docId;
          saveSelectedSubjectId(subjectId);
          logger.debug('[QR Scanner] Auto-selected first subject:', firstSubject.name || firstSubject.code);
        }
      } else {
        logger.debug('[QR Scanner] Using saved subject selection:', currentSelection);
      }
      
      setGridLoading(false);
    } catch (error) {
      logger.error('[QR Scanner] Error loading subjects:', error);
      setSubjects([]);
      setGridLoading(false);
      setError('Failed to load subjects: ' + error.message);
    }
  }, [selectedSubjectId, saveSelectedSubjectId, validateSelection]);

  const loadClasses = async (subjectId) => {
    try {
      const classesResponse = await getClasses();
      const allClasses = classesResponse.success ? classesResponse.data : [];
      
      let filteredClasses = allClasses;
      
      // If user is admin or super admin, show all classes
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        if (subjectId && subjectId !== 'all') {
          filteredClasses = allClasses.filter(c => c.subjectId === subjectId);
        }
      } else {
        // Regular instructor - only show their classes
        filteredClasses = allClasses.filter(c => 
          c.instructorId === user?.uid || c.ownerEmail === user?.email
        );
        if (subjectId && subjectId !== 'all') {
          filteredClasses = filteredClasses.filter(c => c.subjectId === subjectId);
        }
      }
      
      if (filteredClasses.length === 0) {
        // console.warn('[QR Scanner] No classes found');
      }

      setClasses(filteredClasses);
      
      // Validate saved selection or auto-select first class
      const currentSelection = selectedClassId;
      const isValidSelection = validateSelection(currentSelection, filteredClasses, 'class');
      
      if (!isValidSelection || currentSelection === 'all') {
        if (filteredClasses.length > 0) {
          const firstClass = filteredClasses[0];
          const classId = firstClass.id || firstClass.docId;
          saveSelectedClassId(classId);
          logger.debug('[QR Scanner] Auto-selected first class:', firstClass.name || firstClass.code);
        }
      } else {
        logger.debug('[QR Scanner] Using saved class selection:', currentSelection);
      }
    } catch (error) {
      logger.error('[QR Scanner] Error loading classes:', error);
      setClasses([]);
      setError('Failed to load classes: ' + error.message);
    }
  };

  const handleMarkAttendance = useCallback(async (studentId, status, notes = '', method = ATTENDANCE_METHODS.MANUAL_INSTRUCTOR) => {
    try {
      // Get performedBy fields using shared service
      const performedByFields = await getPerformedByFields(user);
      
      // Ensure selectedDate is a string in yyyy-MM-dd format
      const dateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0];
      
      // Get class data to extract programId and subjectId
      const currentClass = classes.find(c => (c.id || c.docId) === selectedClassId);
      
      // Extract programId and subjectId with better fallback logic
      let programId = currentClass?.programId || currentClass?.program;
      let subjectId = currentClass?.subjectId || currentClass?.subject;
      
      // If still null, try the selected values (but not 'all')
      if (!programId && selectedProgramId && selectedProgramId !== 'all') {
        programId = selectedProgramId;
      }
      if (!subjectId && selectedSubjectId && selectedSubjectId !== 'all') {
        subjectId = selectedSubjectId;
      }
      
      await markAttendance({
        classId: selectedClassId,
        studentId,
        programId,
        subjectId,
        date: dateStr,
        status,
        notes,
        method,
        markedBy: user.uid,
        ...performedByFields
      });

      // Reload students to reflect changes
      await loadStudents(selectedClassId, selectedDate);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Emit real-time event for activity updates
      // Use user ID as primary, but include reference ID for QR scanner compatibility
      const student = students.find(s => s.id === studentId);
      const referenceId = student ? `STU-${student.studentNumber}` : studentId;
      
      eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
        studentId, // Primary: user ID for data consistency
        referenceId, // Secondary: reference ID for QR scanner
        classId: selectedClassId,
        status,
        performedBy: user,
        timestamp: new Date()
      });
      
      // Trigger activity refresh to update recent activity
      triggerActivityRefresh();

      // Send notifications if enabled
      if (sendNotifications) {
        const student = students.find(s => s.id === studentId);
        const currentClass = classes.find(c => (c.id || c.docId) === selectedClassId);
        if (student && currentClass) {
          const statusLabels = {
            present: { en: 'Present', ar: 'حاضر' },
            absent_no_excuse: { en: 'Absent', ar: 'غائب (بدون عذر)' },
            absent_with_excuse: { en: 'Absent (Excused)', ar: 'غائب (بعذر)' },
            late: { en: 'Late', ar: 'متأخر' },
            excused_leave: { en: 'Excused Leave', ar: 'إجازة' },
            human_case: { en: 'Human Case', ar: 'حالة إنسانية' }
          };

          const label = statusLabels[status] || { en: status, ar: status };

          await sendStudentNotification({
            userId: student.id,
            email: student.email,
            title: t('attendance_marked_title'),
            message: t('attendance_marked_msg', { 
              className: currentClass.name || currentClass.code,
              status: lang === 'ar' ? (label.ar || label.en) : label.en
            }),
            type: RECORD_TYPES.ATTENDANCE,
            templateId: 'attendance_marked_default',
            variables: {
              recipientName: student.displayName || student.realName || student.name || student.email,
              className: currentClass.name || currentClass.code,
              className_ar: currentClass.nameAr || currentClass.name || currentClass.code,
              status: label.en,
              status_ar: label.ar,
              date: dateStr,
              notes: notes,
              notes_ar: notes
            },
            sendEmailNotification: true
          });
        }
      }
    } catch (error) {
      logger.error('Error marking attendance:', error);
    }
  }, [selectedClassId, selectedDate, user, students, classes, sendNotifications, t, lang, loadStudents, triggerActivityRefresh]);

  const handleScan = useCallback((studentId) => {
    // studentId here is the reference ID (like STU-JLHXQ2)
    const student = students.find(s => s.studentId === studentId || s.id === studentId || `STU-${s.studentNumber}` === studentId);
    if (student) {
      setSelectedStudentForAction(student); // Use new panel instead of old
      // Always use the user ID (student.id) for attendance marking, not reference ID
      logger.debug('handleScan: Found student', {
        referenceId: studentId,
        userId: student.id,
        studentName: student.displayName || student.name
      });
      handleMarkAttendance(student.id, 'present', 'QR scan', 'qr_camera');
    } else {
      logger.error('handleScan: Student not found', { studentId });
    }
  }, [students, handleMarkAttendance]);

  const handleStudentSelect = useCallback((student) => {
    setSelectedStudent(student); // Use old panel for viewing student details
  }, []);

  // Listen for attendance updates to refresh students
  useEffect(() => {
    const unsubscribeAttendanceDeleted = eventBus.on(EVENTS.ATTENDANCE_DELETED, () => {
      // Refresh students when attendance is deleted
      if (selectedClassId && selectedDate) {
        loadStudents(selectedClassId, selectedDate);
      }
    });

    return () => {
      unsubscribeAttendanceDeleted();
    };
  }, [selectedClassId, selectedDate, loadStudents]);

  const handleBehaviorSubmit = useCallback(async (studentId, actions, note, pointsOverride = {}) => {
    try {
      // Get performedBy fields using shared service
      const performedByFields = await getPerformedByFields(user);
      
      // Handle participation
      const participationActions = actions.filter(a =>
        PARTICIPATION_TYPES.some(pt => pt.id === a.type)
      );

      // Handle behavior
      const behaviorActions = actions.filter(a =>
        BEHAVIOR_TYPES.some(bt => bt.id === a.type)
      );

      // Handle penalties
      const penaltyActions = actions.filter(a => a.points < 0);

      // Save to Firebase
      for (const action of actions) {
        const points = pointsOverride[action.type] !== undefined
          ? pointsOverride[action.type]
          : action.points;

        if (action.category === RECORD_TYPES.PENALTY) {
          // Add penalty (only for actions with category 'penalty')
          const penaltyResult = await createPenalty({
            studentId,
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            type: action.type || action.id, // Use specific penalty type
            points: Math.abs(points), // Store as positive in Firebase
            reason: note,
            createdBy: user.uid,
            ...performedByFields,
            date: selectedDate,
            sendNotification: sendNotifications,
            className: classes.find(c => c.id === selectedClassId)?.name || ''
          });
        } else if (action.category === RECORD_TYPES.BEHAVIOR || action.category === RECORD_TYPES.PARTICIPATION) {
          if (action.category === RECORD_TYPES.BEHAVIOR) {
            await createBehavior({
              classId: selectedClassId,
              studentId,
              subjectId: selectedSubjectId,
              type: action.type || action.id || RECORD_TYPES.BEHAVIOR,
              points: points,
              description: note,
              createdBy: user.uid,
              ...performedByFields,
              date: selectedDate,
              sendNotification: sendNotifications,
              className: classes.find(c => c.id === selectedClassId)?.name || ''
            });
          } else {
            await createParticipation({
              classId: selectedClassId,
              studentId,
              subjectId: selectedSubjectId,
              type: action.type || action.id || RECORD_TYPES.PARTICIPATION,
              points: points,
              description: note,
              createdBy: user.uid,
              ...performedByFields,
              date: selectedDate,
              sendNotification: sendNotifications,
              className: classes.find(c => c.id === selectedClassId)?.name || ''
            });
          }
        } else {
          // Unknown action category
        }
      }

      // Reload students with a small delay to allow Firestore to propagate
      setTimeout(async () => {
        await loadStudents(selectedClassId, selectedDate);
        
        // Trigger activity refresh to update recent activity
        triggerActivityRefresh();
      }, 1000);

      // Emit events for each action type
      participationActions.forEach(action => {
        eventBus.emit(EVENTS.PARTICIPATION_ADDED, {
          studentId,
          actionType: action.type,
          points: pointsOverride[action.type] || action.points,
          performedBy: user,
          timestamp: new Date()
        });
      });

      behaviorActions.forEach(action => {
        eventBus.emit(EVENTS.BEHAVIOR_LOGGED, {
          studentId,
          actionType: action.type,
          points: pointsOverride[action.type] || action.points,
          note,
          performedBy: user,
          timestamp: new Date()
        });
      });

      penaltyActions.forEach(action => {
        eventBus.emit(EVENTS.PENALTY_ASSIGNED, {
          studentId,
          actionType: action.type,
          points: pointsOverride[action.type] || action.points,
          performedBy: user,
          timestamp: new Date()
        });
      });

      // Update selected student
      const updatedStudent = students.find(s => s.id === studentId);
      setSelectedStudentForAction(updatedStudent); // Use new panel instead of old

      // Send notifications if enabled
      if (sendNotifications) {
        const student = students.find(s => s.id === studentId);
        const currentClass = classes.find(c => (c.id || c.docId) === selectedClassId);
        if (student && currentClass) {
          for (const action of actions) {
            const points = pointsOverride[action.type] !== undefined
              ? pointsOverride[action.type]
              : action.points;

            let type = 'info';
            let templateId = '';
            let title = '';

            if (points < 0) {
              type = RECORD_TYPES.PENALTY;
              templateId = 'penalty_assigned_default';
              title = t('delete_penalty_title');
            } else if (PARTICIPATION_TYPES.some(pt => pt.id === action.type)) {
              type = RECORD_TYPES.PARTICIPATION;
              templateId = 'participation_added_default';
              title = t('participation_recorded');
            } else {
              type = RECORD_TYPES.BEHAVIOR;
              templateId = 'behavior_logged_default';
              title = t('behavior_recorded');
            }

            await sendStudentNotification({
              userId: student.id,
              email: student.email,
              title,
              message: t('action_logged_msg', {
                type: t(type),
                className: currentClass.name || currentClass.code,
                label: lang === 'ar' ? (action.labelAr || action.labelEn || action.type) : (action.labelEn || action.label || action.type)
              }),
              type,
              templateId,
              variables: {
                recipientName: student.displayName || student.realName || student.name || student.email,
                className: currentClass.name || currentClass.code,
                className_ar: currentClass.nameAr || currentClass.name || currentClass.code,
                label: action.labelEn || action.label || action.type,
                label_ar: action.labelAr || action.label || action.type,
                points: points >= 0 ? `+${points}` : points,
                notes: note,
                notes_ar: note
              },
              sendEmailNotification: true
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error submitting behavior:', error);
    }
  }, [selectedClassId, selectedSubjectId, selectedDate, user, students, classes, sendNotifications, t, lang, loadStudents, triggerActivityRefresh]);

  const handleTogglePin = useCallback((studentId) => {
    // TODO: Implement pin/unpin in Firebase
    setStudents(prevStudents =>
      prevStudents.map(s =>
        s.id === studentId ? { ...s, isPinned: !s.isPinned } : s
      )
    );
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  const handleDownload = useCallback(() => {
    try {
      // Get current class and subject info for filename
      const currentClass = classes.find(c => (c.id || c.docId) === selectedClassId);
      const currentSubject = subjects.find(s => (s.id || s.docId) === selectedSubjectId);
      
      const className = currentClass?.name || currentClass?.code || 'Class';
      const subjectName = currentSubject?.name || currentSubject?.code || 'Subject';
      const dateStr = selectedDate || new Date().toISOString().split('T')[0];
      
      // Create CSV content
      const headers = [
        t('student_id') || 'Student ID',
        t('student') || 'Name',
        t('email') || 'Email',
        t('attendance') || 'Attendance',
        t('participation') || 'Participation',
        t('behavior') || 'Behavior',
        t('penalty') || 'Penalty',
        t('total_attendance') || 'Total Attendance'
      ];
      const csvContent = [
        headers.join(','),
        ...students.map(student => [
          `STU-${student.studentNumber || student.id?.slice(-4) || '0000'}`,
          `"${student.name || 'Unknown'}"`,
          student.email || '',
          student.attendance || 'absent_no_excuse',
          student.participation || 0,
          student.behavior || 0,
          student.penalty || 0,
          student.totalAttendance || 0
        ].join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${className}_${subjectName}_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logger.debug('CSV downloaded successfully');
    } catch (error) {
      logger.error('Error downloading CSV:', error);
      alert(t('failed_to_download_csv') || 'Failed to download CSV. Please try again.');
    }
  }, [students, classes, subjects, selectedClassId, selectedSubjectId, selectedDate, t]);

  const handleRefresh = useCallback(() => {
    // Reload students data
    if (selectedClassId && selectedClassId !== 'all') {
      loadStudents(selectedClassId, selectedDate);
    }
    // Trigger activity refresh
    triggerActivityRefresh();
  }, [selectedClassId, selectedDate, loadStudents, triggerActivityRefresh]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleFilter = useCallback(() => {
    setShowFilterDialog(true);
  }, []);

  const applyFilters = useCallback(() => {
    setShowFilterDialog(false);
    // The filtering will be applied in useMemo
  }, []);

  const clearFilters = useCallback(() => {
    setAttendanceFilter('all');
    setParticipationMin('');
    setParticipationMax('');
    setPenaltyFilter('all');
    setShowFilterDialog(false);
  }, []);

  const handleStudentAction = useCallback((student) => {
    setSelectedStudentForAction(student);
  }, []);

  const handleCloseActionPanel = useCallback(() => {
    setSelectedStudentForAction(null);
  }, []);

  // Helper functions for email functionality
  const getUserFromKey = useCallback((key) => {
    const [role, id] = key.split('_');
    
    console.log('🔍 getUserFromKey debug:', { key, role, id, availableUsersKeys: Object.keys(availableUsers) });
    
    // Search across all user categories using the correct keys
    const allUserCategories = ['admins', 'instructors', 'hr', 'students'];
    for (const category of allUserCategories) {
      const users = availableUsers[category];
      console.log(`🔍 Searching in category ${category}:`, users?.length || 0, 'users');
      const user = users?.find(u => u.id === id);
      if (user) {
        console.log('✅ Found user in', category, ':', user);
        return user;
      }
    }
    
    // Check if this is the current user - use their actual email
    if (id === user?.uid) {
      console.log('✅ Using current user email fallback:', user.email);
      return { 
        name: user.displayName || user.email, 
        email: user.email,
        id: user.uid,
        role: user.role || 'user'
      };
    }
    
    // Fallback: return key as both name and email
    console.warn('⚠️ User not found for key:', key);
    return { name: key, email: key };
  }, [availableUsers, user]);

  // Export Daily Report function
  const exportDailyReport = useCallback(async () => {
    if (!selectedClassId || selectedClassId === 'all') {
      showError(t('please_select_class') || 'Please select a class first');
      return;
    }

    try {
      // Get all attendance data for the selected class
      const formattedDate = formatQatarDateOnly(selectedDate);
      console.log('🔍 Export Debug - Fetching attendance with:', {
        selectedClassId,
        selectedDate,
        formattedDate,
        selectedDateType: typeof selectedDate,
        formattedDateType: typeof formattedDate
      });
      
      // Try different date formats
      let attendanceResponse;
      let attendanceData = [];
      
      // Try with formatted date first
      attendanceResponse = await getAttendanceByClass(selectedClassId, formattedDate);
      attendanceData = attendanceResponse.success ? attendanceResponse.data : [];
      
      console.log('🔍 Export Debug - First attempt result:', {
        attendanceDataLength: attendanceData.length,
        attendanceResponse
      });
      
      // If still no data, try with raw date
      if (attendanceData.length === 0) {
        console.log('🔍 Export Debug - Trying with raw date...');
        attendanceResponse = await getAttendanceByClass(selectedClassId, selectedDate);
        attendanceData = attendanceResponse.success ? attendanceResponse.data : [];
        
        console.log('🔍 Export Debug - Second attempt result:', {
          attendanceDataLength: attendanceData.length,
          attendanceResponse
        });
      }
      
      console.log('🔍 Export Debug - Final Attendance Data:', {
        attendanceDataLength: attendanceData.length,
        selectedDate,
        formattedDate,
        sampleAttendanceRecord: attendanceData[0] || 'No records',
        allAttendanceFields: attendanceData.length > 0 ? Object.keys(attendanceData[0]) : []
      });
      
      // If no data found, try alternative methods
      if (attendanceData.length === 0) {
        console.log('🔍 Export Debug - No attendance data found, trying alternative methods...');
        
        // Skip alternative method for now since getAttendanceByDate is not available
        console.log('🔍 Export Debug - Skipping alternative method (getAttendanceByDate not available)');
      }
      
      // Get all student data
      const usersResponse = await getUsers();
      const allUsers = usersResponse.success ? usersResponse.data : [];
      
      console.log('🔍 Export Debug - Users Response:', {
        usersResponse,
        allUsersLength: allUsers.length,
        sampleUsers: allUsers.slice(0, 3).map(u => ({ studentNumber: u.studentNumber, displayName: u.displayName }))
      });
      
      // Enrich attendance data with student information
      const enrichedData = attendanceData.map(record => {
        // Find student by studentId (not studentNumber)
        const student = allUsers.find(u => u.id === record.studentId);
        
        // Helper function to safely format date
        const safeFormatDate = (timestamp, formatFunc) => {
          if (!timestamp) return '';
          try {
            let date;
            // Handle Firestore timestamp objects
            if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
              date = timestamp.toDate();
            } else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
              date = new Date(timestamp.seconds * 1000);
            } else {
              date = new Date(timestamp);
            }
            
            if (isNaN(date.getTime())) {
              console.log('🔍 Invalid date detected:', timestamp);
              return '';
            }
            return formatFunc(date);
          } catch (error) {
            console.log('🔍 Date formatting error:', error, timestamp);
            return '';
          }
        };
        
        return {
          studentNumber: student?.studentNumber || record.studentId || '',
          studentName: student?.displayName || student?.realName || '',
          status: record.status || 'present',
          date: record.date || formatQatarDateOnly(selectedDate),
          time: safeFormatDate(record.timestamp, (date) => date.toLocaleTimeString(lang === 'ar' ? 'ar-QA' : 'en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })),
          method: record.method || 'manual',
          notes: record.notes || '',
          markedBy: record.performedByName || record.markedByName || '',
          timestamp: safeFormatDate(record.timestamp, (date) => date.toLocaleString(lang === 'ar' ? 'ar-QA' : 'en-US'))
        };
      });

      console.log('🔍 Export Debug - Enriched Data:', {
        enrichedData,
        enrichedDataLength: enrichedData.length,
        sampleRecords: enrichedData.slice(0, 3)
      });
      
      // If no data, show message to user
      if (enrichedData.length === 0) {
        console.log('🔍 Export Debug - No attendance data found for export');
        
        const message = t('no_attendance_records_found') || 
          (lang === 'ar' 
            ? 'لا توجد سجلات حضور لهذا التاريخ. يرجى تسجيل الحضور أولاً.'
            : 'No attendance records found for this date. Please mark attendance first.');
        
        showError(message);
        
        // Also show info about how to mark attendance
        const helpMessage = lang === 'ar' 
          ? '💡 نصيحة: استخدم ماسح QR ل تسجيل حضور الطلاب أولاً'
          : '💡 Tip: Use the QR scanner to mark student attendance first';
        
        showInfo(helpMessage);
        return;
      }

      // Create CSV content with localized headers using constants
      const headers = lang === 'ar' ? [
        '#',
        t('student_number'),
        t('student_name'),
        ...ATTENDANCE_TYPES.map(type => type.label_ar),
        t('date'),
        t('time'),
        t('method'),
        t('notes'),
        t('marked_by'),
        t('timestamp')
      ] : [
        '#',
        t('student_number'),
        t('student_name'),
        ...ATTENDANCE_TYPES.map(type => type.label_en),
        t('date'),
        t('time'),
        t('method'),
        t('notes'),
        t('marked_by'),
        t('timestamp')
      ];

      const csvContent = [
        headers.join(','),
        ...enrichedData.map((row, index) => [
          `"${index + 1}"`,
          `"${row.studentNumber}"`,
          `"${row.studentName}"`,
          ...ATTENDANCE_TYPES.map(type => `"${row.status === type.id ? 'X' : ''}"`),
          `"${row.date}"`,
          `"${row.time}"`,
          `"${getAttendanceMethodLabel(row.method, t, lang)}"`,
          `"${row.notes}"`,
          `"${row.markedBy}"`,
          `"${row.timestamp}"`
        ].join(','))
      ].join('\n');

      console.log('🔍 Export Debug - Final CSV Content:', {
        csvContentLength: csvContent.length,
        csvContentPreview: csvContent.substring(0, 500) + (csvContent.length > 500 ? '...' : '')
      });

      // Get program, subject, and class names for filename
      console.log('🔍 Export Debug - Selected IDs:', {
        selectedProgramId,
        selectedSubjectId,
        selectedClassId,
        programsState: programs.map(p => ({ id: p.id || p.docId, name: p.name || p.code })),
        subjectsState: subjects.map(s => ({ id: s.id || s.docId, name: s.name || s.code })),
        classesState: classes.map(c => ({ id: c.id || c.docId, name: c.name || c.code }))
      });
      
      // Always fetch fresh data to ensure we have the latest
      console.log('🔍 Export Debug - Fetching fresh data for filename...');
      
      const programsResponse = await getPrograms();
      const allPrograms = programsResponse.success ? programsResponse.data : [];
      const currentProgram = allPrograms.find(p => (p.id === selectedProgramId) || (p.docId === selectedProgramId));
      
      const subjectsResponse = await getSubjects(selectedProgramId);
      const allSubjects = subjectsResponse.success ? subjectsResponse.data : [];
      const currentSubject = allSubjects.find(s => (s.id === selectedSubjectId) || (s.docId === selectedSubjectId));
      
      const classesResponse = await getClasses(selectedSubjectId);
      const allClasses = classesResponse.success ? classesResponse.data : [];
      const currentClass = allClasses.find(c => (c.id === selectedClassId) || (c.docId === selectedClassId));
      
      console.log('🔍 Export Debug - Fresh Data Results:', {
        allPrograms: allPrograms.map(p => ({ id: p.id || p.docId, name: p.name || p.code })),
        allSubjects: allSubjects.map(s => ({ id: s.id || s.docId, name: s.name || s.code })),
        allClasses: allClasses.map(c => ({ id: c.id || c.docId, name: c.name || c.code })),
        foundProgram: currentProgram,
        foundSubject: currentSubject,
        foundClass: currentClass
      });
      
      console.log('🔍 Export Debug - Found Items:', {
        currentProgram,
        currentSubject,
        currentClass
      });
      
      const programName = currentProgram?.nameEn || currentProgram?.name || t('all_programs') || 'All';
      const subjectName = currentSubject?.nameEn || currentSubject?.name || t('all_subjects') || 'All';
      const className = currentClass?.nameEn || currentClass?.name || t('all_classes') || 'All';
      
      console.log('🔍 Export Debug - Final Names:', {
        programName,
        subjectName,
        className
      });
      
      // Format date as YYYY-MM-DD
      const dateFormatted = new Date(selectedDate).toISOString().split('T')[0];
      
      // Create filename based on language with safety checks
      const safeProgramName = programName || 'UnknownProgram';
      const safeSubjectName = subjectName || 'UnknownSubject';
      const safeClassName = className || 'UnknownClass';
      
      const filename = lang === 'ar' 
        ? `تقرير_الحضور_الرسمي_${safeProgramName}_${safeSubjectName}_${safeClassName}_${dateFormatted}.csv`
        : `attendance_official_report_${safeProgramName}_${safeSubjectName}_${safeClassName}_${dateFormatted}.csv`;
      
      console.log('🔍 Export Debug - Final Filename:', {
        lang,
        filename,
        dateFormatted,
        programName,
        subjectName,
        className,
        filenameUndefined: filename === undefined,
        filenameType: typeof filename
      });

      // Handle export based on format
      if (dailyExportFormat === 'email') {
        console.log('📧 Sending daily report via email...');
        
        // Set loading state
        setIsExporting(true);
        console.log('✅ Daily report loading state set, starting export...');
        
        try {
          // Upload CSV to Firebase Storage
          const uploadResult = await uploadReport({
            csvContent,
            filename,
            userId: user?.uid,
            reportMetadata: {
              reportType: REPORT_TYPES.ATTENDANCE_REPORT,
              programId: selectedProgramId,
              programName: programName,
              subjectId: selectedSubjectId,
              subjectName: subjectName,
              classId: selectedClassId,
              className: className,
              date: selectedDate,
              totalStudents: enrichedData.length
            }
          });

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Failed to upload report');
          }

          console.log('📤 File uploaded successfully:', uploadResult);

          // Process email recipients
          const recipientEmails = [];
          
          for (const recipient of dailyEmailRecipients) {
            if (recipient === 'self') {
              recipientEmails.push(user?.email);
            } else {
              const recipientUser = getUserFromKey(recipient);
              if (recipientUser && recipientUser.email) {
                recipientEmails.push(recipientUser.email);
              }
            }
          }

          console.log('📧 Sending to recipients:', recipientEmails);

          // Send emails
          const emailPromises = recipientEmails.map(async (recipientEmail) => {
            try {
              const result = await notificationGateway.send(
                NOTIFICATION_TRIGGERS.SUMMARY_REPORT,
                {
                  userId: user?.uid,
                  role: 'admin',
                  email: recipientEmail,
                  title: `📊 Daily Attendance Report - ${className}`,
                  message: `Daily attendance report for ${className} on ${dateFormatted}`,
                  variables: {
                    reportType: 'Daily Attendance Report',
                    programName: programName,
                    subjectName: subjectName,
                    className: className,
                    date: dateFormatted,
                    totalRecords: enrichedData.length,
                    downloadURL: uploadResult.downloadURL,
                    filename: uploadResult.filename,
                    fileId: uploadResult.fileId
                  }
                }
              );
              return result;
            } catch (error) {
              console.error('📧 Email error for', recipientEmail, ':', error);
              return { success: false, error: error.message };
            }
          });

          const results = await Promise.allSettled(emailPromises);
          const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
          const failed = results.length - successful;

          if (successful > 0) {
            console.log('✅ Email sent successfully to', successful, 'recipients');
            
            setSuccessData({
              filename: uploadResult.filename,
              fileId: uploadResult.fileId,
              downloadURL: uploadResult.downloadURL,
              recipients: recipientEmails,
              totalRecipients: successful,
              reportData: {
                programName,
                className,
                totalStudents: enrichedData.length,
                selectedSubjects: 1
              }
            });
            setShowSuccessModal(true);

            if (failed > 0) {
              console.warn('⚠️ Some emails failed:', failed);
              showError(`${failed} email${failed > 1 ? 's' : ''} failed to send`);
            }
          } else {
            console.error('❌ All emails failed');
            showError('Failed to send any emails');
          }
        } catch (emailError) {
          console.error('📧 Email send failed:', emailError);
          showError('Failed to send email: ' + emailError.message);
        }
      } else {
        // CSV export (default)
        console.log('📊 Generating CSV export...');
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const successMessage = t('report_exported_successfully') || 
          (lang === 'ar' 
            ? 'تم تصدير التقرير بنجاح'
            : 'Report exported successfully');
        showSuccess(successMessage);
      }

    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = (t('export_failed') || 'Export failed: ') + error.message;
      showError(errorMessage);
    } finally {
      // Reset loading state
      setIsExporting(false);
    }
  }, [selectedClassId, selectedDate, selectedProgramId, selectedSubjectId, programs, subjects, classes, lang, t, dailyExportFormat, dailyEmailRecipients, user, availableUsers, showError, showSuccess]);

  
  const toggleUserSelection = useCallback((user) => {
    const userKey = `${user.role}_${user.id}`;
    if (emailRecipients.includes(userKey)) {
      setEmailRecipients(emailRecipients.filter(r => r !== userKey));
    } else {
      setEmailRecipients([...emailRecipients, userKey]);
    }
  }, [emailRecipients]);

  // Separate toggle function for daily report email recipients
  const toggleDailyUserSelection = useCallback((user) => {
    const userKey = `${user.role}_${user.id}`;
    if (dailyEmailRecipients.includes(userKey)) {
      setDailyEmailRecipients(dailyEmailRecipients.filter(r => r !== userKey));
    } else {
      setDailyEmailRecipients([...dailyEmailRecipients, userKey]);
    }
  }, [dailyEmailRecipients]);

  const toggleRoleSelection = useCallback((role) => {
    const roleUsers = availableUsers[role] || [];
    const roleKeys = roleUsers.map(user => `${user.role}_${user.id}`);
    
    const allSelected = roleKeys.every(key => emailRecipients.includes(key));
    
    if (allSelected) {
      // Remove all users in this role
      setEmailRecipients(emailRecipients.filter(r => !roleKeys.includes(r)));
    } else {
      // Add all users in this role
      const newRecipients = [...emailRecipients];
      roleKeys.forEach(key => {
        if (!newRecipients.includes(key)) {
          newRecipients.push(key);
        }
      });
      setEmailRecipients(newRecipients);
    }
  }, [availableUsers, emailRecipients]);

  // Separate toggle function for daily report role selection
  const toggleDailyRoleSelection = useCallback((role) => {
    const roleUsers = availableUsers[role] || [];
    const roleKeys = roleUsers.map(user => `${user.role}_${user.id}`);
    
    const allSelected = roleKeys.every(key => dailyEmailRecipients.includes(key));
    
    if (allSelected) {
      // Remove all users in this role
      setDailyEmailRecipients(dailyEmailRecipients.filter(r => !roleKeys.includes(r)));
    } else {
      // Add all users in this role
      const newRecipients = [...dailyEmailRecipients];
      roleKeys.forEach(key => {
        if (!newRecipients.includes(key)) {
          newRecipients.push(key);
        }
      });
      setDailyEmailRecipients(newRecipients);
    }
  }, [availableUsers, dailyEmailRecipients]);

  // Export Summary Report function
  const exportSemesterReport = useCallback(async () => {
    console.log('📊 Export function called', { selectedClassId, selectedProgramId });
    
    // Validate selection
    if (!selectedClassId && !selectedProgramId) {
      console.error('❌ No class or program selected');
      showError(t('please_select_class_or_program') || 'Please select a class or program first');
      return;
    }

    // Validate subject selection
    if (selectedSubjectsForReport.length === 0) {
      console.error('❌ No subjects selected for report');
      showError(t('select_at_least_one_subject') || 'Please select at least one subject for the report');
      return;
    }

    // Validate email recipients if email format is selected
    if (exportFormat === 'email' && emailRecipients.length === 0) {
      console.error('❌ No email recipients selected');
      showError(t('select_at_least_one_recipient') || 'Please select at least one recipient for the email');
      return;
    }

    // Set loading state
    setIsExporting(true);
    console.log('✅ Loading state set, starting export...');

    try {
      // Determine export scope
      const scope = selectedClassId ? 'class' : 'program';
      const scopeId = selectedClassId || selectedProgramId;
      console.log('📊 Export scope:', { scope, scopeId });

      // Get all attendance data based on scope
      let attendanceResponse;
      if (scope === 'class') {
        attendanceResponse = await getAttendanceRecords({ classId: scopeId });
      } else {
        // For program scope, get all classes in the program
        const programClasses = classes.filter(c => c.programId === scopeId);
        const classIds = programClasses.map(c => c.id);
        
        // Get attendance for all classes in the program
        const attendancePromises = classIds.map(classId => 
          getAttendanceRecords({ classId }).catch(err => ({ success: false, error: err.message }))
        );
        
        const attendanceResults = await Promise.all(attendancePromises);
        const allAttendanceData = attendanceResults
          .filter(result => result.success)
          .flatMap(result => result.data);
        
        attendanceResponse = { success: true, data: allAttendanceData };
      }
      
      const attendanceData = attendanceResponse.success ? attendanceResponse.data : [];
      
      console.log('📊 Semester Report - Attendance Data:', {
        totalRecords: attendanceData.length,
        sampleRecord: attendanceData[0]
      });

      // Get all students
      const usersResponse = await getUsers();
      const allUsers = usersResponse.success ? usersResponse.data : [];

      // Aggregate attendance data by student
      const studentAttendanceMap = {};
      
      attendanceData.forEach(record => {
        const studentId = record.studentId;
        
        if (!studentAttendanceMap[studentId]) {
          studentAttendanceMap[studentId] = {
            present: 0,
            late: 0,
            absentNoExcuse: 0,
            absentWithExcuse: 0,
            excusedLeave: 0,
            humanCase: 0,
            total: 0
          };
        }
        
        const status = record.status?.toLowerCase() || 'present';
        studentAttendanceMap[studentId].total++;
        
        // Map status to counters - handle all 6 attendance types
        if (status === 'present') {
          studentAttendanceMap[studentId].present++;
        } else if (status === 'late') {
          studentAttendanceMap[studentId].late++;
        } else if (status === 'absent_no_excuse' || status === 'absent') {
          studentAttendanceMap[studentId].absentNoExcuse++;
        } else if (status === 'absent_with_excuse' || status === 'absence_excused' || status === 'absenceexcused') {
          studentAttendanceMap[studentId].absentWithExcuse++;
        } else if (status === 'excused_leave' || status === 'leave') {
          studentAttendanceMap[studentId].excusedLeave++;
        } else if (status === 'human_case' || status === 'humancase') {
          studentAttendanceMap[studentId].humanCase++;
        }
      });

      console.log('📊 Semester Report - Aggregated Data:', {
        totalStudents: Object.keys(studentAttendanceMap).length,
        sampleStudent: Object.entries(studentAttendanceMap)[0]
      });

      // Create enriched data with calculations
      const enrichedData = Object.entries(studentAttendanceMap).map(([studentId, stats]) => {
        const student = allUsers.find(u => u.id === studentId);
        
        // Calculate attendance percentage
        const attendancePercentage = stats.total > 0 
          ? ((stats.present / stats.total) * 100).toFixed(2)
          : '0.00';
        
        // Calculate mark deductions for each type
        const absentNoExcuseDeduction = stats.absentNoExcuse * 1.0;      // 1.0 mark per absent
        const absentWithExcuseDeduction = stats.absentWithExcuse * 0.5;  // 0.5 mark per excused absent
        const excusedLeaveDeduction = stats.excusedLeave * 0.5;        // 0.5 mark per excused leave
        const humanCaseDeduction = stats.humanCase * 0.25;             // 0.25 mark per human case
        
        // Total deductions
        const totalDeduction = absentNoExcuseDeduction + absentWithExcuseDeduction + excusedLeaveDeduction + humanCaseDeduction;
        
        return {
          studentNumber: student?.studentNumber || studentId || '',
          studentName: student?.displayName || student?.realName || '',
          present: stats.present,
          late: stats.late,
          absentNoExcuse: stats.absentNoExcuse,
          absentWithExcuse: stats.absentWithExcuse,
          excusedLeave: stats.excusedLeave,
          humanCase: stats.humanCase,
          totalSessions: stats.total,
          attendancePercentage: attendancePercentage + '%',
          absentNoExcuseDeduction: absentNoExcuseDeduction.toFixed(2),
          absentWithExcuseDeduction: absentWithExcuseDeduction.toFixed(2),
          excusedLeaveDeduction: excusedLeaveDeduction.toFixed(2),
          humanCaseDeduction: humanCaseDeduction.toFixed(2),
          totalMarkDeduction: totalDeduction.toFixed(2)
        };
      });

      // Sort by student number
      enrichedData.sort((a, b) => {
        const numA = parseInt(a.studentNumber) || 0;
        const numB = parseInt(b.studentNumber) || 0;
        return numA - numB;
      });

      console.log('📊 Semester Report - Enriched Data:', {
        totalStudents: enrichedData.length,
        sampleStudent: enrichedData[0]
      });

      if (enrichedData.length === 0) {
        setIsExporting(false);
        showError(t('no_attendance_records_found') || 'No attendance records found for this semester');
        return;
      }

      // Enhanced headers with per-subject details if enabled
      let headers = lang === 'ar' ? [
        '#',
        t('student_number') || 'رقم الطالب',
        t('student_name') || 'اسم الطالب',
        t('present') || 'حاضر',
        t('late') || 'متأخر',
        t('absent_no_excuse') || 'غائب بدون عذر',
        t('absent_with_excuse') || 'غائب مع عذر',
        t('excused_leave') || 'استئذان',
        t('human_case') || 'حالة إنسانية',
        t('total_sessions') || 'إجمالي الجلسات',
        t('attendance_percentage') || 'نسبة الحضور',
        t('absent_no_excuse_deduction') || 'خصم الغياب بدون عذر (×1.0)',
        t('absent_with_excuse_deduction') || 'خصم الغياب مع عذر (×0.5)',
        t('excused_leave_deduction') || 'خصم الاستئذان (×0.5)',
        t('human_case_deduction') || 'خصم الحالة (×0.25)',
        t('total_mark_deduction') || 'إجمالي الخصم'
      ] : [
        '#',
        t('student_number') || 'Student Number',
        t('student_name') || 'Student Name',
        t('present') || 'Present',
        t('late') || 'Late',
        t('absent_no_excuse') || 'Absent (No Excuse)',
        t('absent_with_excuse') || 'Absent (With Excuse)',
        t('excused_leave') || 'Excused Leave',
        t('human_case') || 'Human Case',
        t('total_sessions') || 'Total Sessions',
        t('attendance_percentage') || 'Attendance %',
        t('absent_no_excuse_deduction') || 'Absent No Excuse Deduction (×1.0)',
        t('absent_with_excuse_deduction') || 'Absent With Excuse Deduction (×0.5)',
        t('excused_leave_deduction') || 'Excused Leave Deduction (×0.5)',
        t('human_case_deduction') || 'Human Case Deduction (×0.25)',
        t('total_mark_deduction') || 'Total Mark Deduction'
      ];

      // Add per-subject columns if subjects are selected
      if (selectedSubjectsForReport.length > 0) {
        console.log('📊 Adding per-subject details for selected subjects...');
        
        // Get selected subjects
        const selectedSubjects = subjects.filter(s => 
          selectedSubjectsForReport.includes(s.docId || s.id)
        );
        
        console.log('📊 Selected Subjects:', selectedSubjects);
        
        // Add columns for each selected subject
        selectedSubjects.forEach(subject => {
          const subjectName = subject.nameEn || subject.name || 'Unknown Subject';
          headers.push(`${subjectName} - ${t('total_absents') || 'Total Absents'}`);
          headers.push(`${subjectName} - ${t('deduction') || 'Deduction'}`);
        });
        
        // Add enhanced totals
        headers.push(t('total_all_absents') || 'Total All Absents');
        headers.push(t('total_deduction_per_subject') || 'Total Deduction Per Subject');
      }

      // Create CSV content with per-subject data if detailed
      const csvContent = [
        headers.join(','),
        ...enrichedData.map((row, index) => {
          let rowData = [
            `"${index + 1}"`,
            `"${row.studentNumber}"`,
            `"${row.studentName}"`,
            `"${row.present}"`,
            `"${row.late}"`,
            `"${row.absentNoExcuse}"`,
            `"${row.absentWithExcuse}"`,
            `"${row.excusedLeave}"`,
            `"${row.humanCase}"`,
            `"${row.totalSessions}"`,
            `"${row.attendancePercentage}"`,
            `"${row.absentNoExcuseDeduction}"`,
            `"${row.absentWithExcuseDeduction}"`,
            `"${row.excusedLeaveDeduction}"`,
            `"${row.humanCaseDeduction}"`,
            `"${row.totalMarkDeduction}"`
          ];
          
          // Add per-subject data if subjects are selected
          if (selectedSubjectsForReport.length > 0) {
            const selectedSubjects = subjects.filter(s => 
              selectedSubjectsForReport.includes(s.docId || s.id)
            );
            
            // For now, add placeholder data for per-subject columns
            // TODO: Implement actual per-subject attendance tracking
            selectedSubjects.forEach(subject => {
              // Placeholder: distribute absents across selected subjects
              const totalAbsents = parseInt(row.absentNoExcuse) + parseInt(row.absentWithExcuse) + parseInt(row.excusedLeave);
              const subjectAbsents = Math.floor(totalAbsents / selectedSubjects.length) || 0;
              const subjectDeduction = (subjectAbsents * 0.5).toFixed(2);
              
              rowData.push(`"${subjectAbsents}"`);
              rowData.push(`"${subjectDeduction}"`);
            });
            
            // Add enhanced totals
            const totalAllAbsents = parseInt(row.absentNoExcuse) + parseInt(row.absentWithExcuse) + parseInt(row.excusedLeave);
            const totalDeductionPerSubject = (totalAllAbsents * 0.5).toFixed(2);
            
            rowData.push(`"${totalAllAbsents}"`);
            rowData.push(`"${totalDeductionPerSubject}"`);
          }
          
          return rowData.join(',');
        })
      ].join('\n');

      // Get names for filename from current selections (try both id and docId)
      const currentProgram = programs.find(p => (p.id === selectedProgramId) || (p.docId === selectedProgramId));
      const currentSubject = subjects.find(s => (s.id === selectedSubjectId) || (s.docId === selectedSubjectId));
      const currentClass = classes.find(c => (c.id === selectedClassId) || (c.docId === selectedClassId));
      
      console.log('📊 Filename Generation:', {
        currentProgram,
        currentSubject,
        currentClass,
        selectedProgramId,
        selectedSubjectId,
        selectedClassId
      });
      
      // Get names and sanitize for filename (remove spaces, special chars)
      const sanitize = (str) => str ? str.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '';
      
      const programName = sanitize(currentProgram?.nameEn || currentProgram?.name || 'UnknownProgram');
      const subjectName = sanitize(currentSubject?.nameEn || currentSubject?.name || 'UnknownSubject');
      const className = sanitize(currentClass?.nameEn || currentClass?.name || 'UnknownClass');
      
      console.log('📊 Sanitized Names:', { programName, subjectName, className });
      
      // Create localized filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const [year, month, day] = currentDate.split('-');
      const formattedDate = `${year}_${month}-${day}`;
      
      // Always use CSV format (Excel-compatible)
      const fileExtension = '.csv';
      
      // Create filename with proper structure
      let filename;
      if (selectedSubjectsForReport.length > 0) {
        // For multi-subject export, use program name only
        const subjectCount = selectedSubjectsForReport.length;
        filename = lang === 'ar' 
          ? `تقرير_ملخص_${programName}_${subjectCount}_مواد_${formattedDate}${fileExtension}`
          : `summary_report_${programName}_${subjectCount}_subjects_${formattedDate}${fileExtension}`;
      } else if (scope === 'class') {
        // For class export, include class, program, subject
        filename = lang === 'ar' 
          ? `تقرير_ملخص_${className}_${programName}_${subjectName}_${formattedDate}${fileExtension}`
          : `summary_report_${className}_${programName}_${subjectName}_${formattedDate}${fileExtension}`;
      } else {
        // For program export, use program name only
        filename = lang === 'ar' 
          ? `تقرير_ملخص_${programName}_البرنامج_${formattedDate}${fileExtension}`
          : `summary_report_${programName}_program_${formattedDate}${fileExtension}`;
      }
      
      console.log('📊 Final Filename:', filename);
      console.log('📊 Export Format:', exportFormat);
      console.log('📊 Export Scope:', selectedSubjectsForReport.length > 0 ? 'multi-subject' : scope);

      // Handle export formats (CSV and Email)
      if (exportFormat === 'email') {
        // Email export
        console.log('📧 Sending report via email...');
        
        try {
          // Process email recipients
          const recipientEmails = emailRecipients.map(recipient => {
            console.log('📧 Processing recipient:', recipient);
            
            if (recipient === 'self') {
              if (!user?.email) {
                console.warn('⚠️ No user email available for self recipient');
                return null;
              }
              console.log('📧 Self email:', user.email);
              return user.email;
            }
            
            const userInfo = getUserFromKey(recipient);
            console.log('📧 User info for', recipient, ':', userInfo);
            
            if (!userInfo || !userInfo.email) {
              console.error('❌ No email found for recipient:', recipient);
              return null;
            }
            
            return userInfo.email;
          }).filter(email => email !== null); // Filter out null emails
          
          console.log('📧 Email Recipients:', recipientEmails);
          
          // Validate that we have valid email addresses
          if (recipientEmails.length === 0) {
            console.error('❌ No valid email addresses found after processing');
            showError('No valid email recipients found');
            return;
          }
          
          console.log('📧 Report Data:', {
            totalStudents: enrichedData.length,
            className: currentClass?.nameEn || currentClass?.name,
            programName: currentProgram?.nameEn || currentProgram?.name,
            subjectName: currentSubject?.nameEn || currentSubject?.name,
            selectedSubjects: selectedSubjectsForReport.length
          });
          
          // Send email using notification gateway (same as other system emails)
          console.log('📧 Starting email send process via notification gateway...');
          
          try {
            // Step 1: Upload CSV to Firebase Storage for audit trail and sharing
            console.log('📤 Uploading CSV report to Firebase Storage...');
            let uploadResult;
            
            try {
              uploadResult = await uploadReport({
                csvContent,
                filename: `${filename.replace('.csv', '')}.csv`,
                userId: user?.uid,
                reportMetadata: {
                  reportType: REPORT_TYPES.SUMMARY_REPORT,
                  programId: selectedProgramId,
                  programName: currentProgram?.nameEn || currentProgram?.name || 'N/A',
                  classId: selectedClassId,
                  className: currentClass?.nameEn || currentClass?.name || 'N/A',
                  subjectId: selectedSubjectId,
                  subjectName: currentSubject?.nameEn || currentSubject?.name || 'N/A',
                  totalStudents: enrichedData.length,
                  selectedSubjects: selectedSubjectsForReport.length
                }
              });
              
              console.log('✅ CSV uploaded to Firebase Storage:', {
                fileId: uploadResult.fileId,
                downloadURL: uploadResult.downloadURL
              });
            } catch (storageError) {
              console.error('❌ Firebase Storage upload failed:', storageError);
              console.log('🔄 Continuing without storage upload - sending email with CSV content...');
              
              // Fallback: use a mock upload result for email sending
              uploadResult = {
                fileId: STORAGE_CONSTANTS.ERROR_PREFIXES.STORAGE_FAILED + Date.now(),
                downloadURL: null,
                filename: filename,
                storageFailed: true
              };
            }
            
            // Step 2: Send email with download link
            const emailPromises = recipientEmails.map(async (recipientEmail) => {
              console.log('📧 Sending to recipient:', recipientEmail);
              
              try {
                const result = await notificationGateway.send(
                  NOTIFICATION_TRIGGERS.SUMMARY_REPORT,
                  {
                    userId: user?.uid,
                    role: 'admin',
                    email: recipientEmail,
                    title: `📊 Summary Report - ${currentProgram?.nameEn || currentProgram?.name || 'N/A'}`,
                    message: `A summary report has been generated for ${currentProgram?.nameEn || currentProgram?.name || 'N/A'} with ${enrichedData.length} students. Download the CSV report using the link below.`,
                    variables: {
                      userName: user?.displayName || 'Admin',
                      userEmail: user?.email,
                      programName: currentProgram?.nameEn || currentProgram?.name || 'N/A',
                      className: currentClass?.nameEn || currentClass?.name || 'N/A',
                      subjectName: currentSubject?.nameEn || currentSubject?.name || 'N/A',
                      reportDate: new Date().toLocaleDateString(),
                      totalStudents: enrichedData.length,
                      selectedSubjects: selectedSubjectsForReport.length,
                      recipientCount: recipientEmails.length,
                      downloadURL: uploadResult.downloadURL,
                      fileId: uploadResult.fileId,
                      filename: uploadResult.filename,
                      storageFailed: uploadResult.storageFailed || false,
                      csvContent: uploadResult.storageFailed ? csvContent.substring(0, 1000) + '...' : null // Include preview if storage failed
                    }
                  }
                );
                
                console.log('📧 Notification gateway result for', recipientEmail, ':', result);
                return result;
              } catch (error) {
                console.error('📧 Notification gateway error for', recipientEmail, ':', error);
                return { success: false, error: error.message };
              }
            });
            
            const results = await Promise.allSettled(emailPromises);
            
            console.log('📧 Raw results from Promise.allSettled:', results);
            
            // Check results
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.length - successful;
            
            console.log('📧 Email results:', { successful, failed, total: results.length });
            
            // Log each result for debugging
            results.forEach((result, index) => {
              if (result.status === 'fulfilled') {
                console.log(`📧 Result ${index}:`, result.value);
              } else {
                console.log(`📧 Result ${index} (rejected):`, result.reason);
              }
            });
            
            if (successful > 0) {
              console.log('✅ Email sent successfully to', successful, 'recipients');
              
              // Show detailed success message with download link
              if (uploadResult && uploadResult.downloadURL) {
                const successMessage = `
                ${getThemedIcon('ui', 'bar_chart_3', 16, theme)} Report sent successfully to ${successful} recipient${successful > 1 ? 's' : ''}!
                
                ${getThemedIcon('ui', 'file_signature', 16, theme)} File: ${uploadResult.filename}
                ${getThemedIcon('ui', 'tag', 16, theme)} File ID: ${uploadResult.fileId}
                ${getThemedIcon('ui', 'mail', 16, theme)} Sent to: ${recipientEmails.join(', ')}
                
                ${getThemedIcon('ui', 'download', 16, theme)} Download: ${uploadResult.downloadURL}
                                `.trim();
                
                showSuccess(successMessage);
                
                // Show success modal with visual confirmation
                setSuccessData({
                  filename: uploadResult.filename,
                  fileId: uploadResult.fileId,
                  downloadURL: uploadResult.downloadURL,
                  recipients: recipientEmails,
                  totalRecipients: successful,
                  reportData: {
                    programName: currentProgram?.nameEn || currentProgram?.name || 'N/A',
                    className: currentClass?.nameEn || currentClass?.name || 'N/A',
                    totalStudents: enrichedData.length,
                    selectedSubjects: selectedSubjectsForReport.length
                  }
                });
                setShowSuccessModal(true);
                
                // Also show the download link in console for easy access
                console.log('📥 Download Link:', uploadResult.downloadURL);
                console.log('📁 File Details:', {
                  filename: uploadResult.filename,
                  fileId: uploadResult.fileId,
                  sentTo: recipientEmails
                });
              } else {
                showSuccess(`Report sent successfully to ${successful} recipient${successful > 1 ? 's' : ''}`);
              }
              
              if (failed > 0) {
                console.warn('⚠️ Some emails failed:', failed);
                showError(`${failed} email${failed > 1 ? 's' : ''} failed to send`);
              }
            } else {
              console.error('❌ All emails failed');
              showError('Failed to send any emails');
            }
            
          } catch (emailError) {
            console.error('❌ Email send failed:', emailError);
            console.log('📧 Error details:', emailError);
            showError(`Failed to send email: ${emailError.message}`);
          }
          
        } catch (emailError) {
          console.error('📧 Email send failed:', emailError);
          showError('Failed to send email: ' + emailError.message);
        }
        
      } else {
        // CSV export (default and only option)
        console.log('📊 Generating CSV export...');
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('📊 CSV file downloaded:', filename);
        showSuccess(t('summary_report_exported_successfully') || 'Summary report exported successfully');
      }

    } catch (error) {
      console.error('Semester Report Export failed:', error);
      showError((t('export_failed') || 'Export failed: ') + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [selectedClassId, selectedSubjectId, selectedProgramId, programs, subjects, classes, lang, t, showError, showSuccess, showInfo, exportFormat, selectedSubjectsForReport, emailRecipients, user, availableUsers, getUserFromKey]);

  // Fetch users for email recipient selection
  const fetchUsersForEmail = useCallback(async () => {
    if (usersLoading) return;
    
    setUsersLoading(true);
    try {
      console.log('🔍 Fetching real users for email recipient selection...');
      
      // Fetch real users from Firebase
      const usersCollection = collection(db, 'users');
      
      // Get all users
      const usersSnapshot = await getDocs(usersCollection);
      const allUsers = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email && userData.displayName) {
          allUsers.push({
            id: doc.id,
            name: userData.displayName,
            email: userData.email,
            role: userData.role || 'user'
          });
        }
      });
      
      // Categorize users by role using constants with priority logic
      // Priority: Super Admin > Admin > HR > Instructor > Student
      // Each user appears in only one category based on their highest priority role
      const categorizedUsers = {
        admins: [],
        hr: [],
        instructors: [],
        students: []
      };
      
      allUsers.forEach(firebaseUser => {
        // Check if this is the current logged-in user and use AuthContext role data
        if (firebaseUser.email === user?.email) {
          // Use AuthContext role information for current user
          if (isSuperAdmin || isAdmin) {
            categorizedUsers.admins.push(firebaseUser);
          } else if (isHR) {
            categorizedUsers.hr.push(firebaseUser);
          } else if (isInstructor) {
            categorizedUsers.instructors.push(firebaseUser);
          } else {
            categorizedUsers.students.push(firebaseUser);
          }
        } else {
          // Use Firebase user data for other users
          console.log('🔍 Categorizing user:', firebaseUser.email, 'with role:', firebaseUser.role);
          
          if (firebaseUser.role === USER_ROLES.SUPER_ADMIN || 
              firebaseUser.role === USER_ROLES.ADMIN ||
              firebaseUser.isSuperAdmin === true ||
              firebaseUser.isAdmin === true) {
            categorizedUsers.admins.push(firebaseUser);
            console.log('✅ Added to admins:', firebaseUser.email);
          } else if (firebaseUser.role === USER_ROLES.HR || 
                     firebaseUser.isHR === true) {
            categorizedUsers.hr.push(firebaseUser);
            console.log('✅ Added to HR:', firebaseUser.email);
          } else if (firebaseUser.role === USER_ROLES.INSTRUCTOR || 
                     firebaseUser.isInstructor === true) {
            categorizedUsers.instructors.push(firebaseUser);
            console.log('✅ Added to instructors:', firebaseUser.email);
          } else if (firebaseUser.role === USER_ROLES.STUDENT || 
                     firebaseUser.isStudent === true) {
            categorizedUsers.students.push(firebaseUser);
            console.log('✅ Added to students:', firebaseUser.email);
          } else {
            // Default to students for unknown roles, but add debug info
            categorizedUsers.students.push(firebaseUser);
            console.log('⚠️ Added to students (unknown role):', firebaseUser.email, 'role:', firebaseUser.role);
          }
        }
      });
      
      setAvailableUsers(categorizedUsers);
      console.log('👥 Real users loaded:', {
        instructors: categorizedUsers.instructors.length,
        admins: categorizedUsers.admins.length,
        hr: categorizedUsers.hr.length,
        students: categorizedUsers.students.length,
        total: allUsers.length
      });
      
      // Debug: Show all users found
      if (allUsers.length > 0) {
        console.log('📋 All users found:', allUsers.slice(0, 5));
        console.log('👤 User roles found:', allUsers.map(u => u.role));
      console.log('🔍 Full user data for debugging:', allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isAdmin: u.isAdmin,
        isSuperAdmin: u.isSuperAdmin,
        isInstructor: u.isInstructor,
        isHR: u.isHR,
        isStudent: u.isStudent
      })));
      
      // Debug: Show current logged-in user data
      console.log('🔐 Current logged-in user data:', {
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
        role: user?.role,
        isAdmin: user?.isAdmin,
        isSuperAdmin: user?.isSuperAdmin,
        isInstructor: user?.isInstructor,
        isHR: user?.isHR,
        isStudent: user?.isStudent,
        emailVerified: user?.emailVerified,
        customClaims: user?.customClaims
      });
      
      // Debug: Show AuthContext role information
      console.log('👑 AuthContext role data:', {
        role: role,
        isAdmin: isAdmin,
        isSuperAdmin: isSuperAdmin,
        isHR: isHR,
        isInstructor: isInstructor
      });
      } else {
        console.log('⚠️ No users found in Firebase collection');
      }
      
      // Log sample users for debugging
      if (categorizedUsers.instructors.length > 0) {
        console.log('📚 Sample instructors:', categorizedUsers.instructors.slice(0, 2));
      }
      if (categorizedUsers.admins.length > 0) {
        console.log('🔐 Sample admins:', categorizedUsers.admins.slice(0, 2));
      }
      if (categorizedUsers.hr.length > 0) {
        console.log('👔 Sample HR:', categorizedUsers.hr.slice(0, 2));
      }
      if (categorizedUsers.students.length > 0) {
        console.log('🎓 Sample students:', categorizedUsers.students.slice(0, 2));
      }
      
      // If no categorized users, show all users as "other" for debugging
      if (categorizedUsers.instructors.length === 0 && 
          categorizedUsers.admins.length === 0 && 
          categorizedUsers.hr.length === 0 && 
          categorizedUsers.students.length === 0 && 
          allUsers.length > 0) {
        console.log('🔍 Users found but no matching roles. Adding all users to instructors for testing:');
        categorizedUsers.instructors = allUsers.slice(0, 5); // Show first 5 users as instructors
        setAvailableUsers(categorizedUsers);
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch real users:', error);
      // Set empty array on error
      setAvailableUsers({ instructors: [], admins: [], hr: [], students: [] });
    } finally {
      setUsersLoading(false);
    }
  }, [usersLoading]);

  // Memoized filtered students for performance
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Apply search filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        student.studentNumber?.toString().includes(debouncedSearchQuery)
      );
    }

    // Apply attendance filter
    if (attendanceFilter !== 'all') {
      logger.debug('[Filter] Applying attendance filter:', attendanceFilter);
      
      // More flexible filtering - check multiple possible attendance fields
      filtered = filtered.filter(student => {
        const attendanceStatus = student.attendance || student.status || 'absent_no_excuse';
        const matches = attendanceStatus === attendanceFilter;
        
        if (!matches && attendanceFilter === 'absent_no_excuse') {
          // Also check for null/undefined attendance as absent no excuse
          return !student.attendance || student.attendance === 'absent_no_excuse';
        }
        
        return matches;
      });
    }

    // Apply participation range filter
    if (participationMin !== '') {
      const min = parseFloat(participationMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(student => student.participation >= min);
      }
    }
    if (participationMax !== '') {
      const max = parseFloat(participationMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(student => student.participation <= max);
      }
    }

    // Apply penalty filter
    if (penaltyFilter === 'none') {
      filtered = filtered.filter(student => !student.penalty || student.penalty === 0);
    } else if (penaltyFilter === 'hasPenalty') {
      filtered = filtered.filter(student => student.penalty && student.penalty > 0);
    }

    // Sort students
    const sorted = [...filtered].sort((a, b) => {
      // Always prioritize studentOrder as primary sort key, fallback to studentNumber
      const aOrder = a.studentOrder !== null && a.studentOrder !== undefined && a.studentOrder !== '' ? Number(a.studentOrder) : (Number(a.studentNumber) || 999999);
      const bOrder = b.studentOrder !== null && b.studentOrder !== undefined && b.studentOrder !== '' ? Number(b.studentOrder) : (Number(b.studentNumber) || 999999);
      
      // Primary sort: by studentOrder
      const primarySort = aOrder - bOrder;
      if (primarySort !== 0) {
        return primarySort;
      }
      
      // Secondary sort: use the selected sort field for students with same or no studentOrder
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle nested values
      if (sortField === 'name') {
        aValue = aValue || '';
        bValue = bValue || '';
      }

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      aValue = aValue?.toString() || '';
      bValue = bValue?.toString() || '';

      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return sorted;
  }, [students, debouncedSearchQuery, attendanceFilter, participationMin, participationMax, penaltyFilter, sortField, sortDirection]);

  // Calculate pagination
  const total = filteredStudents.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Show loading while auth is initializing
  if (authLoading) {
    return <GlobalLoadingFallback />;
  }

  if (!user && !authLoading) {
    return null;
  }

  if (initialLoading) {
    return <GlobalLoadingFallback />;
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background-secondary, #f9fafb)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '0.75rem',
          border: '1px solid #fee2e2',
          maxWidth: '500px'
        }}>
          <h3 style={{ color: 'var(--color-danger, #dc2626)', margin: '0 0 1rem 0' }}>{t('error_loading_page')}</h3>
          <p style={{ color: 'var(--text-muted, #6b7280)', margin: '0 0 1rem 0' }}>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setInitialLoading(true);
              loadPrograms();
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-primary, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container" dir={isRTL ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: 'var(--background-secondary, #f9fafb)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Top Bar with Filters */}
      <header style={{
        background: 'var(--panel, white)',
        borderBottom: '1px solid var(--border, #e5e7eb)',
        padding: isMobile ? '0.5rem 1rem' : '1rem 1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          maxWidth: '1600px',
          margin: '0 auto',
          flexWrap: 'wrap'
        }}>
          {/*<div style={{*/}
          {/*  display: 'flex',*/}
          {/*  alignItems: 'center',*/}
          {/*  gap: '0.5rem',*/}
          {/*  color: '#111827',*/}
          {/*  fontWeight: 600*/}
          {/*}}>*/}
          {/*  <svg style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">*/}
          {/*    <rect x="3" y="3" width="7" height="9" />*/}
          {/*    <rect x="14" y="3" width="7" height="5" />*/}
          {/*    <rect x="14" y="12" width="7" height="9" />*/}
          {/*    <rect x="3" y="16" width="7" height="5" />*/}
          {/*  </svg>*/}
          {/*  <span>{t('qr_scanner')}</span>*/}
          {/*</div>*/}

          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            flex: 1, 
            alignItems: 'center', 
            flexWrap: 'wrap',
            flexDirection: 'column'
          }}>
            <div style={{ width: '100%', minWidth: '100%' }}>
              <Select
                size="small"
                searchable
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value);
                  setSelectedSubjectId('all');
                  setSelectedClassId('all');
                }}
                options={programOptions}
                style={{ width: '100%', minWidth: '100%' }}
                placeholder={gridLoading ? t('loading') || 'Loading...' : (t('all_programs') || 'All Programs')}
                disabled={gridLoading}
              />
            </div>

            <div style={{ width: '100%', minWidth: '100%' }}>
              <Select
                size="small"
                searchable
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedClassId('all');
                }}
                options={subjectOptions}
                style={{ width: '100%', minWidth: '100%' }}
                placeholder={gridLoading ? t('loading') || 'Loading...' : (t('all_subjects') || 'All Subjects')}
                disabled={gridLoading}
              />
            </div>

            <div style={{ width: '100%', minWidth: '100%' }}>
              <Select
                size="small"
                searchable
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                }}
                options={classOptions}
                style={{ width: '100%', minWidth: '100%' }}
                placeholder={t('all_classes')}
              />
            </div>
          </div>

          {/* Date picker and export buttons section */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '0.5rem'
          }}>
            {/* Date picker row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ width: '100%', maxWidth: '300px' }}>
                {!gridLoading && selectedClassId && selectedClassId !== 'all' && (
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    format="yyyy-MM-dd"
                  />
                )}
                {gridLoading && (
                  <div style={{
                    height: '38px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: '0.875rem'
                  }}>
                    {t('loading') || 'Loading...'}
                  </div>
                )}
              </div>
            </div>

            {/* Export buttons row */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  if (!selectedClassId || selectedClassId === 'all') {
                    showError(t('please_select_class') || 'Please select a class first');
                    return;
                  }
                  setShowDailyReportModal(true);
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
                  minWidth: '140px',
                  justifyContent: 'center',
                  opacity: isExporting ? 0.6 : 1
                }}
                disabled={gridLoading || !selectedClassId || selectedClassId === 'all' || isExporting}
              >
                {getThemedIcon('ui', 'file', 16, theme)}
                {t('daily_report') || 'Daily Report'}
              </button>

              <button
                onClick={() => {
                  console.log('🔍 Summary Report button clicked');
                  setShowSemesterReportConfirm(true);
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: isExporting ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                  minWidth: '140px',
                  justifyContent: 'center',
                  opacity: isExporting ? 0.6 : 1
                }}
                disabled={gridLoading || (!selectedClassId && !selectedProgramId) || isExporting}
                title={t('export_summary_report') || 'Export comprehensive summary report'}
              >
                {getThemedIcon('ui', 'send', 16, theme)}
                {t('summary_report') || 'Summary Report'}
              </button>
            </div>
          </div>

          {/* Export Loading Animation */}
          {isExporting && (
            <div style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              zIndex: 1000,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151'
              }}>
                {t('exporting_report') || 'Exporting report...'}
              </span>
            </div>
          )}

            <div 
              onClick={() => setSendNotifications(!sendNotifications)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                background: sendNotifications ? '#f0fdf4' : '#fef2f2',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                border: `1px solid ${sendNotifications ? 'var(--color-success-light, #bbf7d0)' : 'var(--color-danger-light, #fecaca)'}`,
                transition: 'all 0.2s',
                userSelect: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{
                width: '2.5rem',
                height: '1.25rem',
                background: sendNotifications ? '#10b981' : '#ef4444',
                borderRadius: '1rem',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0
              }}>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '0.125rem',
                  left: sendNotifications ? (isRTL ? '0.125rem' : '1.375rem') : (isRTL ? '1.375rem' : '0.125rem'),
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: sendNotifications ? '#166534' : '#991b1b',
                  lineHeight: 1
                }}>
                  {sendNotifications ? `${t('notifications')}: ${lang === 'ar' ? 'مفعلة' : 'ON'}` : `${t('notifications')}: ${lang === 'ar' ? 'معطلة' : 'OFF'}`}
                </span>
                <span style={{ fontSize: '0.625rem', color: sendNotifications ? '#15803d' : '#b91c1c', marginTop: '2px' }}>
                  {t('email_notification')} + {lang === 'ar' ? 'النظام' : 'System'}
                </span>
              </div>
            </div>
          </div>
      </header>

      <div style={{
        padding: isMobile ? '0.5rem' : '1.5rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1.5rem',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Sidebar with Scanner */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          width: isMobile ? '100%' : (isScannerMinimized ? '0px' : '300px'), // Hide completely when minimized
          flexShrink: 0,
          transition: 'width 0.3s ease',
          overflow: 'hidden' // Hide content when width is 0
        }}>
          {showScanner && selectedClassId && (
            <QRScanner 
              onScan={handleScan} 
              classId={selectedClassId}
              onActivityUpdate={handleActivityUpdate}
              onDeleteActivity={handleDeleteActivity}
              selectedProgramId={selectedProgramId}
              selectedSubjectId={selectedSubjectId}
              selectedClassId={selectedClassId}
              selectedProgramName={(() => {
                const program = programs.find(p => p.id === selectedProgramId);
                logger.debug('Program lookup:', {
                  selectedProgramId,
                  totalPrograms: programs.length,
                  found: !!program,
                  programName: program?.name || 'NOT_FOUND'
                });
                return program?.name || '';
              })()}
              selectedSubjectName={(() => {
                const subject = subjects.find(s => s.id === selectedSubjectId);
                logger.debug('Subject lookup:', {
                  selectedSubjectId,
                  totalSubjects: subjects.length,
                  found: !!subject,
                  subjectName: subject?.name || 'NOT_FOUND'
                });
                return subject?.name || '';
              })()}
              selectedClassName={(() => {
                const cls = classes.find(c => c.id === selectedClassId);
                logger.debug('Class lookup:', {
                  selectedClassId,
                  totalClasses: classes.length,
                  found: !!cls,
                  className: cls?.name || 'NOT_FOUND'
                });
                return cls?.name || '';
              })()}
              loading={false}
              students={students}
              onMinimizeChange={handleScannerMinimizeChange}
            />
          )}
        </div>

        {/* Main Content */}
        <div style={{ 
          width: isMobile ? '100%' : (isScannerMinimized ? '100%' : 'calc(100% - 300px)'),
          transition: 'width 0.3s ease' // Smooth transition
        }}>
          {loading && <GlobalLoadingFallback />}
          
          {!selectedClassId || selectedClassId === 'all' ? (
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                {t('select_filters_to_view_students')}
              </p>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <StudentRoster
              students={paginatedStudents}
              onStudentSelect={handleStudentSelect}
              selectedStudentId={selectedStudent?.id}
              onTogglePin={handleTogglePin}
              onDownload={handleDownload}
              onFilter={handleFilter}
              onRefresh={handleRefresh}
              onStudentAction={handleStudentAction}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalStudents={total}
              selectedProgramId={selectedProgramId}
              selectedSubjectId={selectedSubjectId}
              selectedClassId={selectedClassId}
              selectedDate={selectedDate}
              autoExpand={isScannerMinimized}
            />
            </div>
          )}
        </div>

        {/* Student Action Panel */}
        {selectedStudent && (
          <>
            {gridLoading && <GlobalLoadingFallback />}
            <StudentActionStatsPanel
              student={selectedStudent}
              onClose={handleClosePanel}
              onBehaviorSubmit={handleBehaviorSubmit}
              onMarkAttendance={handleMarkAttendance}
              behaviorTypes={showFavoritesOnly ? BEHAVIOR_TYPES.filter(b => favoriteBehaviors.includes(b.id)) : BEHAVIOR_TYPES}
              participationTypes={showFavoritesOnly ? PARTICIPATION_TYPES.filter(p => favoriteBehaviors.includes(p.id)) : PARTICIPATION_TYPES}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
              favoriteBehaviors={favoriteBehaviors}
              onToggleFavorite={(behaviorId) => {
                setFavoriteBehaviors(prev => 
                  prev.includes(behaviorId) 
                    ? prev.filter(id => id !== behaviorId)
                    : [...prev, behaviorId]
                );
              }}
              sendNotifications={sendNotifications}
              onToggleNotifications={() => setSendNotifications(!sendNotifications)}
            />
          </>
        )}

        {/* Student Action Panel New */}
        {selectedStudentForAction && (
          <>
            <StudentActionZapPanel
              student={selectedStudentForAction}
              onClose={handleCloseActionPanel}
              onBehaviorSubmit={handleBehaviorSubmit}
              onParticipationSubmit={handleBehaviorSubmit}
              onPenaltySubmit={handleBehaviorSubmit}
              onMarkAttendance={handleMarkAttendance}
              options={[
                ...BEHAVIOR_TYPES.map(type => ({ ...type, category: RECORD_TYPES.BEHAVIOR })),
                ...PARTICIPATION_TYPES.map(type => ({ ...type, category: RECORD_TYPES.PARTICIPATION })),
                ...PENALTY_TYPES.map(type => ({
                  id: type.id,
                  label_en: type.label_en,
                  label_ar: type.label_ar,
                  icon: type.icon,
                  color: type.color,
                  points: -type.points, // Make points negative for penalties
                  category: RECORD_TYPES.PENALTY
                }))
              ]}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
              favoriteBehaviors={favoriteBehaviors}
              onToggleFavorite={(behaviorId) => {
                setFavoriteBehaviors(prev => 
                  prev.includes(behaviorId) 
                    ? prev.filter(id => id !== behaviorId)
                    : [...prev, behaviorId]
                );
              }}
              sendNotifications={sendNotifications}
              onToggleNotifications={() => setSendNotifications(!sendNotifications)}
              selectedDate={selectedDate}
            />
          </>
        )}

        {/* Filter Dialog */}
        {showFilterDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--overlay, rgba(0, 0, 0, 0.5))',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'var(--panel, white)',
              borderRadius: '0.75rem',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text, #111827)', fontSize: '1.25rem' }}>
                {t('filter_students')}
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary, #374151)' }}>
                  {t('attendance_status')}
                </label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => {
                    setAttendanceFilter(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text, #111827)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">{t('all_status')}</option>
                  <option value="present">{t('present')}</option>
                  <option value="absent_no_excuse">{t('absent_no_excuse')}</option>
                  <option value="absent_with_excuse">{t('absent_with_excuse')}</option>
                  <option value="late">{t('late')}</option>
                  <option value="excused_leave">{t('excused_leave')}</option>
                  <option value="human_case">{t('human_case')}</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  {t('participation_range')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder={t('min')}
                    value={participationMin}
                    onChange={(e) => setParticipationMin(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text, #111827)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <span style={{ color: 'var(--text-muted, #6b7280)' }}>{t('to')}</span>
                  <input
                    type="number"
                    placeholder={t('max')}
                    value={participationMax}
                    onChange={(e) => setParticipationMax(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text, #111827)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                  {t('penalty_status')}
                </label>
                <select
                  value={penaltyFilter}
                  onChange={(e) => setPenaltyFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text, #111827)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">{t('all_students')}</option>
                  <option value="none">{t('no_penalties')}</option>
                  <option value="hasPenalty">{t('has_penalties')}</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text-muted, #6b7280)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {t('clear')}
                </button>
                <button
                  onClick={() => setShowFilterDialog(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border, #d1d5db)',
                    background: 'var(--input-bg, white)',
                    color: 'var(--text-muted, #6b7280)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={applyFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'var(--color-primary, #8b5cf6)',
                    color: 'white',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {t('apply_filters')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Activity Confirmation Modal */}
        {deleteActivityModalOpen && (
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
            zIndex: 1000
          }}>
            <Card style={{ maxWidth: '400px', margin: '1rem' }}>
              <CardBody>
                <h3>{t('delete_activity_title', { type: activityToDelete?.type === RECORD_TYPES.ATTENDANCE ? t('attendance') : t('penalties') })}</h3>
                <p>{t('delete_activity_msg', { studentName: activityToDelete?.studentName || t('this_student') })}</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <Button variant="outline" onClick={() => setDeleteActivityModalOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button variant="primary" onClick={confirmDeleteActivity} loading={deleteActivityLoading} style={{ backgroundColor: '#dc2626' }}>
                    {t('delete')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Summary Report Export Modal */}
        <ReportExportModal
          isOpen={showSemesterReportConfirm}
          onClose={() => setShowSemesterReportConfirm(false)}
          reportType="summary"
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          selectedSubjectsForReport={selectedSubjectsForReport}
          setSelectedSubjectsForReport={setSelectedSubjectsForReport}
          subjects={subjects}
          selectedProgramId={selectedProgramId}
          programs={programs}
          emailRecipients={emailRecipients}
          setEmailRecipients={setEmailRecipients}
          usersLoading={usersLoading}
          availableUsers={availableUsers}
          toggleUserSelection={toggleUserSelection}
          toggleRoleSelection={toggleRoleSelection}
          user={user}
          theme={theme}
          t={t}
          lang={lang}
          isExporting={isExporting}
          onExport={exportSemesterReport}
          fetchUsersForEmail={fetchUsersForEmail}
        />

        {/* Daily Report Export Modal */}
        <ReportExportModal
          isOpen={showDailyReportModal}
          onClose={() => setShowDailyReportModal(false)}
          reportType="daily"
          exportFormat={dailyExportFormat}
          setExportFormat={setDailyExportFormat}
          selectedSubjectsForReport={[]}
          setSelectedSubjectsForReport={() => {}}
          subjects={subjects}
          selectedProgramId={selectedProgramId}
          programs={programs}
          emailRecipients={dailyEmailRecipients}
          setEmailRecipients={setDailyEmailRecipients}
          usersLoading={usersLoading}
          availableUsers={availableUsers}
          toggleUserSelection={toggleDailyUserSelection}
          toggleRoleSelection={toggleDailyRoleSelection}
          user={user}
          theme={theme}
          t={t}
          lang={lang}
          isExporting={isExporting}
          onExport={exportDailyReport}
          fetchUsersForEmail={fetchUsersForEmail}
        />

        {/* Success Confirmation Modal */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title={t('report_export_successful')}
          size="medium"
          showCloseButton={true}
        >
          {successData && (
            <div style={{ padding: '20px 0' }}>
              {/* Success Header */}
              <div style={{ 
                marginBottom: '20px',
                padding: '16px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#15803d', fontSize: '16px' }}>
                    {t('report_sent_successfully')
                      .replace('{{count}}', successData.totalRecipients)
                      .replace('{{plural}}', lang === 'ar' 
                        ? (successData.totalRecipients > 1 ? 'مستلمين' : 'مستلم')
                        : (successData.totalRecipients > 1 ? 's' : '')
                      )
                    }
                  </div>
                  <div style={{ color: '#16a34a', fontSize: '14px', marginTop: '2px' }}>
                    {t('email_delivered_and_file_uploaded')}
                  </div>
                </div>
              </div>

              {/* File Details */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px', fontWeight: 600 }}>
                  {t('file_details')}
                </h4>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '12px', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>{t('file')}</span>
                    <span style={{ fontWeight: 500 }}>{successData.filename}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>{t('file_id')}</span>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '12px' }}>
                      {successData.fileId}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>{t('sent_to')}</span>
                    <span style={{ fontWeight: 500 }}>{successData.recipients.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px', fontWeight: 600 }}>
                  {t('report_summary')}
                </h4>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '12px', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>{t('program')}</span>
                    <span style={{ fontWeight: 500 }}>{successData.reportData.programName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>{t('class')}</span>
                    <span style={{ fontWeight: 500 }}>{successData.reportData.className}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>{t('students')}</span>
                    <span style={{ fontWeight: 500 }}>{successData.reportData.totalStudents}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>{t('subjects')}</span>
                    <span style={{ fontWeight: 500 }}>{successData.reportData.selectedSubjects}</span>
                  </div>
                </div>
              </div>

              {/* Download Actions */}
              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <a
                  href={successData.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#10b981',
                    color: 'white',
                    padding: '12px 20px',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  {getThemedIcon('ui', 'download', 16, theme)}
                  {t('download_csv_report')}
                </a>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successData.downloadURL);
                    // You could add a toast notification here
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                >
                  {getThemedIcon('ui', 'external_link', 16, theme)}
                  {t('copy_download_link')}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default () => (
  <ErrorBoundary>
    <QRScannerPage />
  </ErrorBoundary>
);
