import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '@services/business/userService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getClasses } from '@services/business/classService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { markAttendance, getAttendanceByClass, getAttendanceByStudent, deleteAttendance } from '@services/business/attendanceService';
import { createPenalty, getPenalties, deletePenalty } from '@services/business/penaltyService';
import { createParticipation, getParticipations, deleteParticipation } from '@services/business/participationService';
import { createBehavior, getBehaviors, deleteBehavior } from '@services/business/behaviorService';
import { getPerformedByFields } from '@services/business/userService';
import { PENALTY_TYPES } from '@constants/penaltyTypes';
import { ATTENDANCE_METHODS, getAttendanceMethodLabel } from '@constants/attendanceMethods';
import { ATTENDANCE_TYPES } from '@constants/attendanceTypes';
import { db } from '@services/other/config';
import { useToast } from '@ui/ToastProvider.jsx';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { addNotification } from '@services/business/notificationService';
import { sendStudentNotification } from '@services/business/notificationService';
import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
import { PARTICIPATION_TYPES } from '@constants/participationTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { Select, DatePicker, Button, Card, CardBody } from '@ui';
import { getThemedIcon, getColoredIcon } from '@constants/iconTypes';
import QRScanner from '@/components/qr-scanner/QRScanner';
import StudentRoster from '@/components/qr-scanner/StudentRoster';
import StudentActionStatsPanel from '@/components/qr-scanner/StudentActionStatsPanel';
import StudentActionZapPanel from '@/components/qr-scanner/StudentActionZapPanel';
import '@/components/qr-scanner/ui/qr-scanner-ui.css';
import './QRScannerPage.module.css';
import eventBus, { EVENTS } from '@utils/eventBus';
import { GlobalLoadingFallback, useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const QRScannerPage = () => {
  const { user, loading: authLoading } = useAuth();
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
            ...performedByFields
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
        return;
      }

      // Create CSV content with localized headers using constants
      const headers = lang === 'ar' ? [
        '#',
        t('student_number') || 'الرقم العسكري',
        t('student_name') || 'اسم الطالب',
        ...ATTENDANCE_TYPES.map(type => type.label_ar),
        t('date') || 'التاريخ',
        t('time') || 'الوقت',
        t('method') || 'الطريقة',
        t('notes') || 'الملاحظات',
        t('marked_by') || 'سجل بواسطة',
        t('timestamp') || 'الوقت والتاريخ'
      ] : [
        '#',
        t('student_number') || 'Student Number',
        t('student_name') || 'Student Name',
        ...ATTENDANCE_TYPES.map(type => type.label_en),
        t('date') || 'Date',
        t('time') || 'Time',
        t('method') || 'Method',
        t('notes') || 'Notes',
        t('marked_by') || 'Marked By',
        t('timestamp') || 'Timestamp'
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
      
      // Create filename based on language
      const filename = lang === 'ar' 
        ? `تقرير_الحضور_الرسمي_${programName}_${subjectName}_${className}_${dateFormatted}.csv`
        : `attendance_official_report_${programName}_${subjectName}_${className}_${dateFormatted}.csv`;
      
      console.log('🔍 Export Debug - Final Filename:', {
        lang,
        filename,
        dateFormatted
      });

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      const successMessage = t('report_exported_successfully') || 
        (lang === 'ar' 
          ? 'تم تصدير التقرير بنجاح'
          : 'Report exported successfully');
      showSuccess(successMessage);

    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = (t('export_failed') || 'Export failed: ') + error.message;
      showError(errorMessage);
    }
  }, [selectedClassId, selectedDate, selectedProgramId, selectedSubjectId, programs, subjects, classes, lang, t]);

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
      // Always prioritize studentOrder as primary sort key
      const aOrder = a.studentOrder !== null && a.studentOrder !== undefined && a.studentOrder !== '' ? Number(a.studentOrder) : 999999;
      const bOrder = b.studentOrder !== null && b.studentOrder !== undefined && b.studentOrder !== '' ? Number(b.studentOrder) : 999999;
      
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

          {/* Date picker and notification on same row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '0.5rem',
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
            
            <button
              onClick={exportDailyReport}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
              }}
              disabled={gridLoading || !selectedClassId || selectedClassId === 'all'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              {t('daily_report')}
            </button>
            
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
      </div>
    </div>
  );
};

export default () => (
  <ErrorBoundary>
    <QRScannerPage />
  </ErrorBoundary>
);
