import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { usePermissions } from '@hooks/usePermissions';
// OLD: import { PENALTY_TYPES } from '@constants/penaltyTypes';
// OLD: import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
// OLD: import { PARTICIPATION_TYPES } from '@constants/participationTypes';
// NOW: Using useLookupTypes hook for all lookup data
import { useNavigate } from 'react-router-dom';
import { getUsers } from '@services/business/userService';
import { getEnrollments, getEnrollmentsByProgram } from '@services/business/enrollmentService';
import { getClasses } from '@services/business/classService';
import { getPrograms, getSubjects } from '@services/business/programService';
import { notificationGateway } from '@services/business/notificationGateway';
import { uploadReport } from '@services/business/fileStorageService';
import { REPORT_TYPES, STORAGE_CONSTANTS, REPORT_TYPE_IDS } from '@constants/reportConstants';
import { getThemedIcon } from '@constants/iconTypes';
import Modal from '@ui/Modal/Modal';
import { markAttendance, getAttendanceByClass, getAttendanceByStudent, deleteAttendance, getClassAttendanceByDate } from '@services/business/attendanceServiceUnified.js';
import { createStandupAttendance, getStandupAttendanceByUserAndDate, deleteStandupAttendance, getStandupAttendanceByProgramForDateRange, getStandupAttendanceByProgramAndDate } from '@services/business/standupAttendanceService';
import { getAttendanceRecords } from '@services/business/attendanceService.js';
import { createPenalty, getPenalties, deletePenalty } from '@services/business/penaltyService';
import { createParticipation, getParticipations, deleteParticipation } from '@services/business/participationService';
import { createBehavior, getBehaviors, deleteBehavior } from '@services/business/behaviorService';
import { getPerformedByFields } from '@services/business/userService';
// OLD: import { PENALTY_TYPES } from '@constants/penaltyTypes';
import { ATTENDANCE_METHODS, getAttendanceMethodLabel } from '@constants/attendanceMethods';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_TYPE_CATEGORY, getAttendanceIcon, getAttendanceColor, getAttendanceLabel, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
import { ABSENCE_THRESHOLDS } from '@/constants/absenceTypes';
import { getNoteTypeFromStatus, getLocalizedNoteText } from '@constants/noteTypes';
import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes';
import { exportDailyReport as exportDailyReportExcel, exportSummaryReport as exportSummaryReportExcel, exportAttendanceViolationsReport } from '@services/export/excelExportService.js';
import { useToast } from '@ui/ToastProvider.jsx';
import ConfirmModal from '@ui/Modal/ConfirmModal.jsx';
import { addNotification } from '@services/business/notificationService';
import { sendStudentNotification } from '@services/business/notificationService';
// OLD: import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
// OLD: import { PARTICIPATION_TYPES } from '@constants/participationTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { USER_ROLES } from '@constants/activityTypes';
import { Select, DatePicker, Button, Card, CardBody, ProgramsSelect } from '@ui';
import QRScanner from '@/components/qr-scanner/QRScanner';
import StudentRoster from '@/components/qr-scanner/StudentRoster';
import StudentActionStatsPanel from '@/components/qr-scanner/StudentActionStatsPanel';
import StudentActionZapPanel from '@/components/qr-scanner/StudentActionZapPanel';
import BulkScanDialog from '@components/ui/BulkScanDialog/BulkScanDialog';
import ReportExportModal from '@/components/qr-scanner/ReportExportModal';
import AttendanceViolationsModal from '@/components/qr-scanner/AttendanceViolationsModal';
import { BulkScanProvider } from '@/contexts/BulkScanContext';
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
  const { activityTypeOptions } = useLookupTypes();
  const { hasPermission } = usePermissions();
  const canBulkScan = hasPermission('qr-scanner.canBulkScan');
  const canManualInput = hasPermission('qr-scanner.canManualInput');
  const canClearToday = hasPermission('qr-scanner.canClearToday');
  const canDeleteAttendance = hasPermission('qr-scanner.canDeleteAttendance');
  const canEditAttendance = hasPermission('qr-scanner.canEditAttendance');
  const canExport = hasPermission('qr-scanner.canExport');
  const canExportSummary = hasPermission('qr-scanner.canExportSummary');
  const canSeeStandupMode = hasPermission('qr-scanner.canSeeStandupMode');
  const canSeeQuickButtons = hasPermission('qr-scanner.canSeeQuickButtons');
  const canUseStatsPanel = hasPermission('qr-scanner.canUseStatsPanel');
  const canUseZapPanel = hasPermission('qr-scanner.canUseZapPanel');
  const showSuccess = useMemo(() => (msg) => toast?.showSuccess?.(msg), [toast]);
  const showError = useMemo(() => (msg) => toast?.showError?.(msg), [toast]);
  const showInfo = useMemo(() => (msg) => toast?.showInfo?.(msg), [toast]);
  const { startLoading } = useGlobalLoading();

  const saveSelectedProgramId = useCallback((programId) => {
    try {
      localStorage.setItem('qrScanner_selectedProgramId', programId);
    } catch (error) {
      console.warn(t('instructor_qr_failed_to_save_program_id'), error);
    }
    setSelectedProgramId(programId);
  }, [t]);

  const saveSelectedSubjectId = useCallback((subjectId) => {
    try {
      localStorage.setItem('qrScanner_selectedSubjectId', subjectId);
    } catch (error) {
      console.warn(t('instructor_qr_failed_to_save_subject_id'), error);
    }
    setSelectedSubjectId(subjectId);
  }, [t]);

  const saveSelectedClassId = useCallback((classId) => {
    try {
      localStorage.setItem('qrScanner_selectedClassId', classId);
    } catch (error) {
      console.warn(t('instructor_qr_failed_to_save_class_id'), error);
    }
    setSelectedClassId(classId);
  }, [t]);

  // Helper function to validate if a selection still exists in available data
  const validateSelection = useCallback((selectionId, availableItems, itemType) => {
    if (selectionId === 'all') return true;
    return availableItems.some(item => 
      (item.id === selectionId)
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
  const [attendanceMode, setAttendanceMode] = useState(ATTENDANCE_TYPE_CATEGORY.REGULAR); // 'regular' or 'standup'

  // DEBUG: Track attendanceMode changes
  useEffect(() => {
    info('🔍 [DEBUG] attendanceMode changed:', {
      attendanceMode,
      constants: ATTENDANCE_TYPE_CATEGORY
    });

    // Reset subject selection to 'all' when switching to standup mode
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      setSelectedSubjectId('all');
      setSelectedClassId('all');
    }
  }, [attendanceMode]);

  // Fetch performed by fields when user is available
  useEffect(() => {
    console.log('🔍 QRScannerPage - useEffect for performedByFields running, user:', !!user);
    const fetchPerformedByFields = async () => {
      if (user) {
        console.log('🔍 QRScannerPage - Calling getPerformedByFields...');
        try {
          const fields = await getPerformedByFields(user);
          console.log('🔍 QRScannerPage - Fetched performedByFields:', fields);
          setPerformedByFields(fields);
        } catch (error) {
          console.error('🔍 QRScannerPage - Error fetching performedByFields:', error);
        }
      }
    };
    fetchPerformedByFields();
  }, [user]);

  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showBulkScanDialog, setShowBulkScanDialog] = useState(false);
  const [performedByFields, setPerformedByFields] = useState({
    performedBy: user?.uid || 'unknown',
    performedByName: 'Unknown User',
    performedByEmail: user?.email || 'unknown@example.com'
  });
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
  const [standupRecords, setStandupRecords] = useState([]);
  const [penaltyRecords, setPenaltyRecords] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteBehaviors, setFavoriteBehaviors] = useState([]);
  const [showScanner, setShowScanner] = useState(true); // Show QR scanner by default
  const [sendNotifications, setSendNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [isScannerMinimized, setIsScannerMinimized] = useState(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP); // Minimized by default in standup mode
  
  // Report export modal state (unified for both daily and summary)
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [showSemesterReportConfirm, setShowSemesterReportConfirm] = useState(false);
  const [showNoAttendanceModal, setShowNoAttendanceModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv', 'email'
  const [dailyExportFormat, setDailyExportFormat] = useState('csv'); // For daily report
  const [isExporting, setIsExporting] = useState(false);
  const [selectedSubjectsForReport, setSelectedSubjectsForReport] = useState([]);
  const [selectedProgramsForReport, setSelectedProgramsForReport] = useState([]); // For standup mode
  const [emailRecipients, setEmailRecipients] = useState([]); // For email functionality
  const [dailyEmailRecipients, setDailyEmailRecipients] = useState([]); // For daily report email
  const [showEmailRecipientDialog, setShowEmailRecipientDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]); // Instructors, Admins, HR
  const [usersLoading, setUsersLoading] = useState(false);
  const [isExportingBehavioral, setIsExportingBehavioral] = useState(false);
  const [showAttendanceViolationsModal, setShowAttendanceViolationsModal] = useState(false);
  const [selectedSubjectsForViolations, setSelectedSubjectsForViolations] = useState([]);
  const [selectedViolationTypes, setSelectedViolationTypes] = useState({
    absentNoExcuse: true,
    absentWithExcuse: true,
    excusedLeave: true,
    late: true,
    humanCase: true
  });
  
  
  // Computed values for selected names
  const selectedClassName = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return null;
    const selectedClass = classes.find(c => c.id == selectedClassId);
    return selectedClass?.nameEn || selectedClass?.name || selectedClass?.code || 'Unknown Class';
  }, [selectedClassId, classes]);

  const selectedProgramName = useMemo(() => {
    if (!selectedProgramId || selectedProgramId === 'all') return null;
    const selectedProgram = programs.find(p => p.id == selectedProgramId);
    return selectedProgram?.nameEn || selectedProgram?.name || selectedProgram?.code || 'Unknown Program';
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
    info(t('instructor_qr_qr_scanner_minimization_changed'), isMinimized); // Debug
    setIsScannerMinimized(isMinimized);
  }, []);

  // Redirect to login if session expired (no user)
  useEffect(() => {
    if (!user && !authLoading) {
      debug(t('instructor_qr_no_user_found_redirecting'));
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

  // Handle bulk scan success - stable callback to prevent hook re-initialization
  const handleBulkScanSuccess = useCallback((result) => {
    info('🔍 [DEBUG] BulkScanDialog onSuccess called:', {
      selectedClassId,
      selectedDate,
      attendanceMode,
      selectedProgramId,
      result
    });
    setShowBulkScanDialog(false);
    // Refresh students
    // In standup mode, pass programId to loadStudents
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      loadStudents(selectedClassId === 'all' ? null : selectedClassId, selectedDate, selectedProgramId);
    } else {
      loadStudents(selectedClassId === 'all' ? null : selectedClassId, selectedDate);
    }
    // Refresh activities for today
    triggerActivityRefresh();
  }, [selectedClassId, selectedDate, attendanceMode, selectedProgramId]);

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;

    setDeleteActivityLoading(true);
    try {
      let result;
      if (activityToDelete.type === RECORD_TYPES.ATTENDANCE) {
        // Use standup attendance delete service when in standup mode
        if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
          result = await deleteStandupAttendance(activityToDelete.id);
        } else {
          result = await deleteAttendance(activityToDelete.id);
        }
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
        // In standup mode, pass programId to loadStudents
        if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
          loadStudents(selectedClassId === 'all' ? null : selectedClassId, selectedDate, selectedProgramId);
        } else {
          loadStudents(selectedClassId === 'all' ? null : selectedClassId, selectedDate);
        }
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
      .filter(prog => prog.id)
      .map(prog => {
        const value = prog.id;
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
        // Use == for type coercion (string vs number)
        return subProgramId == selectedProgramId;
      })
      .filter(sub => sub.id)
      .map(sub => {
        const value = sub.id;
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
        // Use == for type coercion (string vs number)
        return clsSubjectId == selectedSubjectId;
      })
      .filter(cls => cls.id)
      .map(cls => {
        const value = cls.id;
        const name = lang === 'ar' ? (cls.nameAr || cls.name) : (cls.name || cls.nameAr || t('unnamed_class'));
        const label = `${name}${cls.code ? ` (${cls.code})` : ''}`;
        return { value, label, icon: getThemedIcon('ui', 'users', 16, theme) };
      });
    return [...opts, ...validClasses];
  }, [classes, selectedSubjectId, t, lang, theme]);

  // Load programs on mount
  useEffect(() => {
    debug('[QR Scanner] Initializing page...');
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
      setSubjects([]);
      setGridLoading(false);
    }
  }, [selectedProgramId]);

  // Load all classes once - ProgramsSelect will handle filtering
  useEffect(() => {
    const loadAllClasses = async () => {
      try {
        const classesResponse = await getClasses();
        const allClasses = classesResponse.success ? classesResponse.data : [];
        
        // Show all classes (like AttendancePage does)
        setClasses(allClasses);
        // debug('[QR Scanner] Loaded classes:', allClasses.length); // Disabled
      } catch (err) {
        error('[QR Scanner] Error loading classes:', err);
        setClasses([]);
      }
    };
    
    loadAllClasses();
  }, []); // Remove user dependency to load once

  // Memoized loadStudents function for performance
  const loadStudents = useCallback(async (classId, date, programId = null) => {
    console.log('🚨🚨🚨 loadStudents FUNCTION CALLED 🚨🚨🚨', { classId, date, programId, attendanceMode });
    info('🔍 [DEBUG] loadStudents called:', {
      classId,
      date,
      programId,
      attendanceMode,
      timestamp: new Date().toISOString()
    });
    try {
      debug('[QR Scanner] Loading students for class:', classId, 'date:', date, 'program:', programId);
      setLoading(true);

      // In standup mode, load students by program instead of class
      const isStandupMode = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;
      const shouldLoadByProgram = isStandupMode && programId && (!classId || classId === 'all');

      info('🔍 [DEBUG] loadStudents mode check:', {
        isStandupMode,
        attendanceMode,
        programId,
        classId,
        shouldLoadByProgram,
        ATTENDANCE_TYPE_CATEGORY_STANDUP: ATTENDANCE_TYPE_CATEGORY.STANDUP,
        isStandupModeBool: !!isStandupMode,
        hasProgramId: !!programId,
        noClassId: !classId,
        classIdIsAll: classId === 'all'
      });

      // Parallel data fetching for better performance
      let enrollmentsResponse, usersResponse, penaltiesResponse, participationsResponse, behaviorsResponse;

      if (shouldLoadByProgram) {
        // In standup mode, use program-based queries
        [enrollmentsResponse, usersResponse] = await Promise.all([
          getEnrollmentsByProgram(programId),
          getUsers()
        ]);
        console.log('🚨🚨🚨 getEnrollmentsByProgram RESPONSE 🚨🚨🚨', {
          success: enrollmentsResponse.success,
          total: enrollmentsResponse.total,
          dataLength: enrollmentsResponse.data?.length,
          programId,
          allUserIds: enrollmentsResponse.data?.map(e => e.userId),
          allProgramIds: enrollmentsResponse.data?.map(e => e.programId)
        });
        info('🔍 [DEBUG] getEnrollmentsByProgram returned:', {
          success: enrollmentsResponse.success,
          total: enrollmentsResponse.total,
          dataLength: enrollmentsResponse.data?.length,
          programId,
          sampleData: enrollmentsResponse.data?.slice(0, 3).map(e => ({
            id: e.id,
            userId: e.userId,
            programId: e.programId,
            classId: e.classId
          }))
        });
        // For penalties, participations, behaviors in standup mode, we don't filter by class
        // Get all and filter client-side, or pass empty params
        [penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
          getPenalties({}), // No class filter for standup mode
          getParticipations({}), // No class filter for standup mode
          getBehaviors({}) // No class filter for standup mode
        ]);
      } else {
        // In regular mode, use class-based queries
        [enrollmentsResponse, usersResponse, penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
          getEnrollments({ classId }),
          getUsers(),
          getPenalties({ classId }),
          getParticipations({ classId }),
          getBehaviors({ classId })
        ]);
      }

      const allEnrollments = enrollmentsResponse.success ? enrollmentsResponse.data : [];
      const allUsers = usersResponse.success ? usersResponse.data : [];
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const allParticipations = participationsResponse.success ? participationsResponse.data : [];
      const allBehaviors = behaviorsResponse.success ? behaviorsResponse.data : [];

      // Create Set for O(1) lookup performance
      info('🔍 [DEBUG] Loading students - mode:', isStandupMode ? 'standup' : 'regular', 'filter:', shouldLoadByProgram ? 'program' : 'class');
      info('🔍 [DEBUG] Total enrollments:', allEnrollments.length);
      info('🔍 [DEBUG] Sample enrollments:', allEnrollments.slice(0, 3).map(e => ({
        id: e.id,
        classId: e.classId,
        classIdType: typeof e.classId,
        userId: e.userId,
        userIdType: typeof e.userId
      })));

      // Filter enrollments based on mode
      let filteredEnrollments;
      if (shouldLoadByProgram) {
        // In standup mode, use all enrollments from the program (already filtered by API)
        filteredEnrollments = allEnrollments;
      } else {
        // In regular mode, filter by classId
        const classIdNum = Number(classId);
        filteredEnrollments = allEnrollments.filter(e => {
          const matches = e.classId === classId || e.classId === classIdNum;
          if (!matches && e.classId !== undefined && e.classId !== null) {
            info('🔍 [DEBUG] Enrollment classId mismatch:', {
              enrollmentClassId: e.classId,
              enrollmentType: typeof e.classId,
              searchClassId: classId,
              searchClassIdNum: classIdNum
            });
          }
          return matches;
        });
      }
      info('🔍 [DEBUG] Filtered enrollments:', filteredEnrollments.length);

      const studentIdSet = new Set(filteredEnrollments.map(e => e.userId));
      const studentUsers = allUsers.filter(u =>
        studentIdSet.has(u.id)
      );

      setEnrollments(filteredEnrollments);

      if (studentUsers.length === 0) {
        warn('[QR Scanner] No students found');
      }

      // Get attendance for selected date
      const dateStr = date;
      let attendance = [];
      if (shouldLoadByProgram) {
        // In standup mode, load attendance for each student individually
        // This is a workaround since there's no program-based attendance endpoint
        const attendancePromises = studentUsers.map(student =>
          getStandupAttendanceByUserAndDate(student.id, dateStr)
            .then(res => {
              console.log('🔍 [DEBUG] getStandupAttendanceByUserAndDate result for student', student.id, ':', res);
              console.log('🔍 [DEBUG] getStandupAttendanceByUserAndDate data for student', student.id, ':', res.data);
              // getStandupAttendanceByUserAndDate returns a single object or null, not an array
              // Convert to array for consistent processing
              if (res.success && res.data) {
                return [res.data];
              }
              return [];
            })
            .catch(err => {
              console.error('🔍 [DEBUG] Error loading standup attendance for student', student.id, ':', err);
              return [];
            })
        );
        const attendanceArrays = await Promise.all(attendancePromises);
        console.log('🔍 [DEBUG] attendanceArrays before flat:', attendanceArrays);
        
        // Map statusId to status string (uppercase to match database)
        const statusIdMap = {
          7: ATTENDANCE_STATUS.STANDUP_PRESENT,
          8: ATTENDANCE_STATUS.STANDUP_LATE,
          9: ATTENDANCE_STATUS.STANDUP_ABSENT,
          10: ATTENDANCE_STATUS.STANDUP_CLINIC
        };
        
        attendance = attendanceArrays.flat().map(a => {
          // If statusId exists, map it to status string
          const status = a.statusId ? statusIdMap[a.statusId] : 
                        (typeof a.status === 'object' ? (a.status?.code ?? null) : 
                        (a.status ?? null));
          
          return {
            ...a,
            status: status,
            studentId: a.studentId ?? a.userId ?? a.userId
          };
        }).filter(a => {
          // Filter by programId to ensure only attendance for selected program is shown
          if (!programId || programId === 'all') return true;
          return a.programId == programId;
        });
        console.log('🔍 [DEBUG] attendance after mapping:', attendance);
      } else {
        // In regular mode, load by class
        const attendanceResponse = await getAttendanceByClass(classId, dateStr);
        attendance = (attendanceResponse.success ? attendanceResponse.data : []).map(a => ({
          ...a,
          status: typeof a.status === 'object' ? (a.status?.code?.toLowerCase() ?? null) : (a.status?.toLowerCase?.() ?? a.status),
          studentId: a.studentId ?? a.userId
        })).filter(a => {
          // Filter by programId and subjectId to ensure only attendance for selected program/subject is shown
          if (!programId || programId === 'all') return true;
          if (a.programId && a.programId != programId) return false;
          if (subjectId && subjectId !== 'all' && a.subjectId && a.subjectId != subjectId) return false;
          return true;
        });
      }
      
      // DEBUG: Log attendance data
// ...
      info('🔍 [DEBUG] Attendance data loaded:', {
        classId,
        dateStr,
        totalRecords: attendance.length,
        records: attendance.map(a => ({
          studentId: a.studentId,
          rawStatus: a.status,
          statusCode: a.status?.code,
          statusLower: typeof a.status === 'string' ? a.status.toLowerCase() : null,
          isStandup: a.status?.startsWith('standup_'),
          date: a.date
        }))
      });
      
      setAttendanceRecords(attendance);

      // Fetch standup attendance for selected date using unified service
      // Only call this when we have a valid classId (regular mode)
      let classAttendanceResponse;
      if (classId && classId !== 'all') {
        classAttendanceResponse = await getClassAttendanceByDate(classId, dateStr);
      } else {
        classAttendanceResponse = { success: true, data: [] };
      }
      const standupResponse = {
        success: classAttendanceResponse.success,
        data: classAttendanceResponse.data?.standup || []
      };
      const standup = (standupResponse.success ? standupResponse.data : []).map(s => ({
        ...s,
        status: typeof s.status === 'object' ? `standup_${s.status?.code?.toLowerCase()}` : (s.status?.startsWith?.('standup_') ? s.status : `standup_${s.status?.toLowerCase()}`),
        studentId: s.userId || s.studentId
      }));

      info('🔍 [DEBUG] Standup attendance data loaded:', {
        classId,
        dateStr,
        attendanceMode,
        totalRecords: standup.length,
        records: standup.map(s => ({ studentId: s.studentId, status: s.status })),
        responseSuccess: standupResponse.success,
        responseData: standupResponse.data
      });

      setStandupRecords(standup);

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
        if (studentIdSet.has(p.studentId)) {
          const existing = participationMap.get(p.studentId) || [];
          existing.push(p);
          participationMap.set(p.studentId, existing);
        }
      });

      const behaviorMap = new Map();
      allBehaviors.forEach(b => {
        if (studentIdSet.has(b.studentId)) {
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
          const studentId = student.id;
          const studentName = student.displayName || student.realName || student.name || student.email;
          
          // Find the primary attendance record
          // In standup mode, attendance records are in the attendance array
          // Check both studentId and userId since API returns userId
          const studentRecords = attendance.filter(a => (a.studentId === studentId || a.userId === studentId));
          // Filter standup records from attendance array in standup mode (case-insensitive)
          const studentStandupRecords = shouldLoadByProgram 
            ? studentRecords.filter(a => a.status?.toLowerCase().startsWith('standup_'))
            : standup.filter(a => (a.studentId === studentId || a.userId === studentId));

          // DEBUG: Log student records
          info('🔍 [DEBUG] Student attendance records:', {
            studentId,
            studentName,
            totalRecords: studentRecords.length,
            standupRecords: studentStandupRecords.length,
            records: studentRecords.map(r => ({
              status: r.status,
              isStandup: r.status?.toLowerCase().startsWith('standup_'),
              date: r.date,
              delta: r.delta
            }))
          });

          // Separate regular and standup attendance records by status prefix (case-insensitive)
          const regularAttendance = studentRecords.filter(a => !a.status?.toLowerCase().startsWith('standup_'));
          // Also include records from standup array that don't have standup_ prefix already
          const standupAttendance = studentStandupRecords;

          // Find today's attendance records
          const todayAttendanceRecord = regularAttendance.find(a => {
            const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date;
            return recordDate === dateStr;
          });
          const todayStandupAttendanceRecord = standupAttendance.find(a => {
            const recordDate = typeof a.date === 'string' ? a.date.split('T')[0] : a.date;
            return recordDate === dateStr;
          });

          // Helper function to map attendance status
          const mapAttendanceStatus = (status) => {
            if (!status) return ATTENDANCE_STATUS.ABSENT_NO_EXCUSE;
            const statusLower = status.toLowerCase();
            if (statusLower === ATTENDANCE_STATUS.PRESENT.toLowerCase()) return ATTENDANCE_STATUS.PRESENT.toLowerCase();
            if (statusLower === ATTENDANCE_STATUS.LATE.toLowerCase()) return ATTENDANCE_STATUS.LATE.toLowerCase();
            if (statusLower === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE.toLowerCase()) return ATTENDANCE_STATUS.ABSENT_NO_EXCUSE.toLowerCase();
            if (statusLower === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE.toLowerCase()) return ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE.toLowerCase();
            if (statusLower === ATTENDANCE_STATUS.EXCUSED_LEAVE.toLowerCase()) return ATTENDANCE_STATUS.EXCUSED_LEAVE.toLowerCase();
            if (statusLower === ATTENDANCE_STATUS.HUMAN_CASE.toLowerCase()) return ATTENDANCE_STATUS.HUMAN_CASE.toLowerCase();
            return statusLower;
          };

          console.log('🔍 [DEBUG] QRScannerPage - Attendance filtering for student:', studentId, {
            dateStr,
            regularAttendanceCount: regularAttendance.length,
            standupAttendanceCount: standupAttendance.length,
            regularAttendanceDates: regularAttendance.map(a => ({ date: a.date, status: a.status })),
            standupAttendanceDates: standupAttendance.map(a => ({ date: a.date, status: a.status })),
            todayAttendanceRecord: todayAttendanceRecord,
            todayStandupAttendanceRecord: todayStandupAttendanceRecord
          });

          const todayAttendanceStatus = todayAttendanceRecord ? mapAttendanceStatus(todayAttendanceRecord.status) : null;
          
          // Map statusId to status string for standup attendance
          const statusIdMap = {
            7: ATTENDANCE_STATUS.STANDUP_PRESENT,
            8: ATTENDANCE_STATUS.STANDUP_LATE,
            9: ATTENDANCE_STATUS.STANDUP_ABSENT,
            10: ATTENDANCE_STATUS.STANDUP_CLINIC
          };
          const todayStandupStatus = todayStandupAttendanceRecord?.statusId 
            ? statusIdMap[todayStandupAttendanceRecord.statusId] || null
            : (todayStandupAttendanceRecord?.status?.toLowerCase() || null);

          // DEBUG: Log status assignment
          console.log('🔍 [DEBUG] Status assignment:', {
            studentId,
            todayStandupAttendanceRecord,
            statusId: todayStandupAttendanceRecord?.statusId,
            todayStandupStatus
          });

          // DEBUG: Log separated records
          info('🔍 [DEBUG] Separated attendance:', {
            regularCount: regularAttendance.length,
            standupCount: standupAttendance.length,
            todayAttendance: todayAttendanceStatus,
            todayStandupAttendance: todayStandupStatus
          });

          // Fetch all attendance records for this student (attendance only)
          const studentAttendanceResponse = await getAttendanceByStudent(studentId);
          const studentAttendanceRecords = (studentAttendanceResponse.success ? studentAttendanceResponse.data : []).map(r => ({
            ...r,
            status: typeof r.status === 'object' ? (r.status?.code?.toLowerCase() ?? null) : (r.status?.toLowerCase?.() ?? r.status),
            studentId: r.studentId ?? r.userId
          }));
          
          // Separate regular and standup attendance for statistics by status prefix
          const regularAttendanceRecords = studentAttendanceRecords.filter(r => !r.status?.startsWith('standup_'));
          // Use the standupAttendance array that's already been populated from standup-specific API calls
          const standupAttendanceRecords = standupAttendance;

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

          const standupStats = {
            present: 0,
            late: 0,
            absent: 0,
            clinic: 0
          };

          // Only count regular attendance for statistics
          regularAttendanceRecords.forEach(record => {
            const mappedStatus = mapAttendanceStatus(record.status);
            if (mappedStatus === ATTENDANCE_STATUS.PRESENT.toLowerCase() || mappedStatus === ATTENDANCE_STATUS.LATE.toLowerCase()) {
              totalAttendanceCount++;
            }
            switch (mappedStatus) {
              case ATTENDANCE_STATUS.PRESENT.toLowerCase():
                attendanceStats.present++;
                break;
              case ATTENDANCE_STATUS.LATE.toLowerCase():
                attendanceStats.late++;
                break;
              case 'absent':
              case ATTENDANCE_STATUS.ABSENT_NO_EXCUSE.toLowerCase():
                attendanceStats.absent++;
                break;
              case ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE.toLowerCase():
                attendanceStats.absentWithExcuse++;
                break;
              case ATTENDANCE_STATUS.EXCUSED_LEAVE.toLowerCase():
                attendanceStats.excusedLeave++;
                break;
              case ATTENDANCE_STATUS.HUMAN_CASE.toLowerCase():
                attendanceStats.humanitarianCase++;
                break;
            }
          });

          // Count standup attendance for standup statistics
          standupAttendanceRecords.forEach(record => {
            // Handle both uppercase (from database) and lowercase status strings
            const status = record.status || '';
            const statusUpper = status.toUpperCase();
            const statusLower = status.toLowerCase();
            
            switch (statusUpper) {
              case ATTENDANCE_STATUS.STANDUP_PRESENT:
                standupStats.present++;
                break;
              case ATTENDANCE_STATUS.STANDUP_LATE:
                standupStats.late++;
                break;
              case ATTENDANCE_STATUS.STANDUP_ABSENT:
                standupStats.absent++;
                break;
              case ATTENDANCE_STATUS.STANDUP_CLINIC:
                standupStats.clinic++;
                break;
            }
          });

          // Participation/Behavior totals + history from dedicated collections
          const participations = participationMap.get(studentId) || [];
          const behaviors = behaviorMap.get(studentId) || [];

          const participationTotal = participations.reduce((sum, p) => sum + (Number(p.points) || 0), 0);
          const behaviorTotal = behaviors.reduce((sum, b) => sum + (Number(b.points) || 0), 0);

          const studentParticipationHistory = participations.map(p => ({
            id: p.id,
            date: p.date,
            time: p.createdAt,
            points: p.points,
            reason: p.description || '',
            markedBy: p.createdBy,
            category: RECORD_TYPES.PARTICIPATION
          }));

          const studentBehaviorHistory = behaviors.map(b => ({
            id: b.id,
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

          // Calculate penalty count (number of penalty records)
          const penaltyCount = penalties.length;

          // DEBUG: Log final student object creation
          const studentObject = {
            id: studentId,
            userId: studentId, // Use the actual user ID from users table
            studentId: student.studentId || studentId,
            studentNumber: student.studentNumber,
            name: studentName,
            email: student.email,
            studentOrder: student.studentOrder, // Add student order field
            attendance: todayAttendanceStatus, // Regular attendance
            standupStatus: todayStandupStatus, // Standup attendance (null if none)
            participation: participationTotal,
            behavior: behaviorTotal,
            penalty: penaltyTotal,
            penaltyCount: penaltyCount, // Add penalty count for display
            totalAttendance: totalAttendanceCount,
            attendanceStats, // Add detailed attendance statistics
            standupStats, // Add standup statistics
            isPinned: student.isPinned || false,
            behaviorHistory: studentBehaviorHistory,
            participationHistory: studentParticipationHistory,
            penaltyHistory: penalties
          };

          // Log 2: Log data object in StudentRoster after totals are calculated
          console.log('🔍 [LOG 2] QRScannerPage - Student object with calculated totals:', {
            studentId,
            studentName,
            attendance: studentObject.attendance,
            standupStatus: studentObject.standupStatus,
            participationTotal: studentObject.participation,
            behaviorTotal: studentObject.behavior,
            penaltyTotal: studentObject.penalty,
            penaltyCount: studentObject.penaltyCount,
            attendanceStats: studentObject.attendanceStats,
            dateStr
          });

          info('🔍 [DEBUG] Student object created:', {
            studentId,
            studentName,
            attendance: studentObject.attendance,
            standupStatus: studentObject.standupStatus,
            attendanceIsStandup: studentObject.attendance?.startsWith('standup_'),
            standupIsStandup: studentObject.standupStatus?.startsWith('standup_'),
            attendanceMode,
            hasStandupRecords: standupRecords.length > 0
          });

          return studentObject;
        }));
        
        studentsWithData.push(...batchResults);
      }

      setStudents(studentsWithData);

      info('🔍 [DEBUG] Students state updated:', {
        totalStudents: studentsWithData.length,
        studentsWithStandupStatus: studentsWithData.filter(s => s.standupStatus).length,
        studentsWithAttendance: studentsWithData.filter(s => s.attendance).length,
        attendanceMode,
        standupRecordsCount: standupRecords.length
      });

      debug('[LoadStudents] Loaded', studentsWithData.length, 'students');
    } catch (err) {
      error('[QR Scanner] Error loading students:', err.message);
      setStudents([]);
      setErrorMessage('Failed to load students: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [attendanceMode]);

  // Load students when class or date changes, or when in standup mode with program selected
  useEffect(() => {
    console.log('🚨🚨🚨 useEffect for loadStudents RUNNING 🚨🚨🚨', { selectedClassId, selectedDate, attendanceMode, selectedProgramId });
    const isStandupMode = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;
    console.log('🚨🚨🚨 useEffect condition check 🚨🚨🚨', {
      isStandupMode,
      attendanceMode,
      selectedProgramId,
      selectedProgramIdNotAll: selectedProgramId !== 'all',
      selectedClassId,
      selectedClassIdNotAll: selectedClassId !== 'all'
    });
    if (isStandupMode && selectedProgramId && selectedProgramId !== 'all') {
      console.log('🚨🚨🚨 TAKING STANDUP BRANCH - calling loadStudents 🚨🚨🚨');
      // In standup mode, load students by program (no class required)
      loadStudents(null, selectedDate, selectedProgramId);
    } else if (selectedClassId && selectedClassId !== 'all') {
      console.log('🚨🚨🚨 TAKING CLASS BRANCH - calling loadStudents 🚨🚨🚨');
      // In regular mode, load students by class
      loadStudents(selectedClassId, selectedDate);
    } else {
      console.log('🚨🚨🚨 TAKING ELSE BRANCH - setting students to empty 🚨🚨🚨');
      setStudents([]);
    }
  }, [selectedClassId, selectedDate, attendanceMode, selectedProgramId, loadStudents]);
  
  console.log('🚨🚨🚨 QRScannerPage RENDERED 🚨🚨🚨', { selectedClassId, selectedDate, attendanceMode, selectedProgramId, studentsCount: students.length });

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
      // In standup mode, refresh by program; in regular mode, refresh by class
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        debug('🔄 Attendance marked event received in standup mode, refreshing students for program:', selectedProgramId);
        loadStudents(selectedClassId, selectedDate, selectedProgramId);
      } else if (data.classId === selectedClassId) {
        debug('🔄 Attendance marked event received, refreshing students for class:', selectedClassId);
        loadStudents(selectedClassId, selectedDate);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedClassId, selectedDate, selectedProgramId, attendanceMode, loadStudents]);

  const loadPrograms = async () => {
    try {
      const programsResponse = await getPrograms();
      let programsData = programsResponse.success ? programsResponse.data : [];

      if (programsData.length === 0) {
        warn('[QR Scanner] No programs found in database');
        setPrograms(programsData);
        setInitialLoading(false);
        return;
      }

      setPrograms(programsData);
      
      // Validate saved selection — if stale, reset to 'all' (no auto-select)
      const currentSelection = selectedProgramId;
      const isValidSelection = validateSelection(currentSelection, programsData, 'program');
      
      if (!isValidSelection) {
        saveSelectedProgramId('all');
        debug('[QR Scanner] Saved program selection invalid, resetting to all');
      } else {
        debug('[QR Scanner] Using saved program selection:', currentSelection);
      }
      
      setInitialLoading(false);
    } catch (err) {
      error('[QR Scanner] Error loading programs:', err);
      setPrograms([]);
      setErrorMessage('Failed to load programs: ' + err.message);
      setInitialLoading(false);
    }
  };

  const loadSubjects = useCallback(async (programId) => {
    try {
      const resolvedProgramId = programId && typeof programId === 'object' ? (programId.id ?? programId.value ?? null) : programId;
      const subjectsResponse = await getSubjects(resolvedProgramId ? { programId: resolvedProgramId } : {});
      let subjectsData = subjectsResponse.success ? subjectsResponse.data : [];
      
      // Sort client-side when filtering by program to avoid index requirement
      if (programId) {
        subjectsData.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      }

      setSubjects(subjectsData);

      // Validate saved selection - don't auto-select first subject
      // This gives users more control over their selection
      const currentSelection = selectedSubjectId;
      const isValidSelection = validateSelection(currentSelection, subjectsData, 'subject');

      if (!isValidSelection) {
        // Reset to 'all' if saved selection is invalid, but don't auto-select
        setSelectedSubjectId('all');
        debug('[QR Scanner] Reset subject selection to "all" (invalid saved selection)');
      } else {
        debug('[QR Scanner] Using saved subject selection:', currentSelection);
      }

      setGridLoading(false);
    } catch (err) {
      error('[QR Scanner] Error loading subjects:', err);
      setSubjects([]);
      setGridLoading(false);
      setErrorMessage('Failed to load subjects: ' + err.message);
    }
  }, [selectedSubjectId, saveSelectedSubjectId, validateSelection]);

  const loadClasses = async (subjectId) => {
    try {
      const classesResponse = await getClasses(subjectId ? { subjectId } : {});
      const allClasses = classesResponse.success ? classesResponse.data : [];
      
      let filteredClasses = allClasses;
      
      // If user is admin or super admin, show all classes
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        if (subjectId && subjectId !== 'all') {
          // Use == for type coercion (string vs number)
          filteredClasses = allClasses.filter(c => c.subjectId == subjectId);
        }
      } else {
        // Regular instructor - only show their classes
        filteredClasses = allClasses.filter(c => 
          c.instructorId === user?.uid || c.ownerEmail === user?.email
        );
        if (subjectId && subjectId !== 'all') {
          // Use == for type coercion (string vs number)
          filteredClasses = filteredClasses.filter(c => c.subjectId == subjectId);
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
          const classId = firstClass.id;
          saveSelectedClassId(classId);
          debug('[QR Scanner] Auto-selected first class:', firstClass.name || firstClass.code);
        }
      } else {
        debug('[QR Scanner] Using saved class selection:', currentSelection);
      }
    } catch (err) {
      error('[QR Scanner] Error loading classes:', err);
      setClasses([]);
      setErrorMessage('Failed to load classes: ' + err.message);
    }
  };

  const handleMarkAttendance = useCallback(async (studentId, status, passedProgramId = null, passedSubjectId = null, notes = '', method = ATTENDANCE_METHODS.MANUAL_INSTRUCTOR) => {
    try {
      // DEBUG: Log attendance marking attempt
      info('🔍 [DEBUG] handleMarkAttendance called:', {
        studentId,
        status,
        attendanceMode,
        isStandup: status?.startsWith('standup_'),
        passedProgramId,
        passedSubjectId,
        notes,
        method,
        timestamp: new Date().toISOString()
      });

      // Log mode-specific behavior
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        info('🔍 [STANDUP MODE] Marking standup attendance:', {
          studentId,
          status,
          expectedStatus: status?.startsWith('standup_') ? status : `standup_${status}`
        });
      } else {
        info('🔍 [REGULAR MODE] Marking regular attendance:', {
          studentId,
          status,
          isStandupStatus: status?.startsWith('standup_')
        });
      }

      // Get performedBy fields using shared service
      const performedByFields = await getPerformedByFields(user);

      // Ensure selectedDate is a string in yyyy-MM-dd format
      const dateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0];

      // Get class data to extract programId and subjectId
      const currentClass = classes.find(c => c.id == selectedClassId); // Use == for type coercion

      // Extract programId and subjectId with better fallback logic
      let programId = passedProgramId || currentClass?.programId || currentClass?.program;
      let subjectId = passedSubjectId || currentClass?.subjectId || currentClass?.subject;

      // If still null, try the selected values (but not 'all')
      if (!programId && selectedProgramId && selectedProgramId !== 'all') {
        programId = selectedProgramId;
      }
      if (!subjectId && selectedSubjectId && selectedSubjectId !== 'all') {
        subjectId = selectedSubjectId;
      }

      // Use unified attendance service for both regular and standup attendance
      await markAttendance({
        userId: studentId,
        classId: attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? selectedClassId : undefined,
        date: dateStr,
        status: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? status.toUpperCase() : status,
        notes: notes || getNoteTypeFromStatus(status, 'quick'),
        user: user,
        programId: programId,
        subjectId: subjectId
      }, user, attendanceMode);

      // Reload students to reflect changes
      // In standup mode, we load by program, not class
      console.log('🔍 [DEBUG] Reloading students after marking attendance:', { attendanceMode, classId: selectedClassId, date: selectedDate, programId: selectedProgramId });
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        await loadStudents(null, selectedDate, selectedProgramId); // Pass programId for standup mode
      } else {
        await loadStudents(selectedClassId, selectedDate);
      }
      console.log('🔍 [DEBUG] Reload completed');
      
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
        const currentClass = classes.find(c => c.id == selectedClassId); // Use == for type coercion
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
    } catch (err) {
      error('Error marking attendance:', err);
    }
  }, [selectedClassId, selectedDate, user, students, classes, sendNotifications, t, lang, loadStudents, triggerActivityRefresh]);

  const handleScan = useCallback((studentId) => {
    // studentId here is the reference ID (like STU-JLHXQ2)
    const student = students.find(s => s.studentId === studentId || s.id === studentId || `STU-${s.studentNumber}` === studentId);
    if (student) {
      setSelectedStudentForAction(student); // Use new panel instead of old
      // Always use the user ID (student.id) for attendance marking, not reference ID
      debug('handleScan: Found student', {
        referenceId: studentId,
        userId: student.id,
        studentName: student.displayName || student.name
      });
      handleMarkAttendance(student.id, 'present', 'QR scan', 'qr_camera');
    } else {
      error('handleScan: Student not found', { studentId });
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
        (activityTypeOptions['participation-types'] || []).some(pt => pt.id === a.type)
      );

      // Handle behavior
      const behaviorActions = actions.filter(a =>
        (activityTypeOptions['behavior-types'] || []).some(bt => bt.id === a.type)
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
            className: classes.find(c => c.id == selectedClassId)?.name || '' // Use == for type coercion
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
              className: classes.find(c => c.id == selectedClassId)?.name || '' // Use == for type coercion
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
              className: classes.find(c => c.id == selectedClassId)?.name || '' // Use == for type coercion
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
        const currentClass = classes.find(c => c.id == selectedClassId); // Use == for type coercion
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
            } else if ((activityTypeOptions['participation-types'] || []).some(pt => pt.id === action.type)) {
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
    } catch (err) {
      error('Error submitting behavior:', err);
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
      const currentClass = classes.find(c => c.id == selectedClassId); // Use == for type coercion
      const currentSubject = subjects.find(s => s.id == selectedSubjectId); // Use == for type coercion
      
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
          student.studentNumber || student.id || '',
          `"${student.name || 'Unknown'}"`,
          student.email || '',
          student.attendance || '',
          student.participation || 0,
          student.behavior || 0,
          student.penalty || 0,
          student.totalAttendance || 0
        ].join(','))
      ].join('\r\n');
      
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
      
      debug('CSV downloaded successfully');
    } catch (err) {
      error('Error downloading CSV:', err);
      alert(t('failed_to_download_csv') || 'Failed to download CSV. Please try again.');
    }
  }, [students, classes, subjects, selectedClassId, selectedSubjectId, selectedDate, t]);

  const handleRefresh = useCallback(() => {
    // Reload students data
    if (selectedClassId && selectedClassId !== 'all') {
      loadStudents(selectedClassId, selectedDate);
    } else if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && selectedProgramId) {
      // In standup mode with program selection, reload using null classId and programId to trigger program-based loading
      loadStudents(null, selectedDate, selectedProgramId);
    } else {
      // Fallback to current classId or null
      loadStudents(selectedClassId || null, selectedDate);
    }
    // Trigger activity refresh
    triggerActivityRefresh();
  }, [selectedClassId, selectedDate, loadStudents, triggerActivityRefresh, attendanceMode, selectedProgramId]);

  const handleSort = useCallback((field) => {
    console.log('🔄 Sort clicked:', field, 'current sortField:', sortField, 'current direction:', sortDirection);
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
    // Validate based on attendance mode
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      if (!selectedProgramId || selectedProgramId === 'all') {
        showError(t('please_select_program') || 'Please select a program first');
        return;
      }
    } else {
      if (!selectedClassId || selectedClassId === 'all') {
        showError(t('please_select_class') || 'Please select a class first');
        return;
      }
    }

    try {
      const formattedDate = formatQatarDateOnly(selectedDate);
      console.log('🔍 Export Debug - Fetching attendance with:', {
        attendanceMode,
        selectedClassId,
        selectedProgramId,
        selectedDate,
        formattedDate,
        selectedDateType: typeof selectedDate,
        formattedDateType: typeof formattedDate
      });
      
      let attendanceResponse;
      let attendanceData = [];
      
      // Fetch attendance based on mode
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Standup mode: fetch by program
        attendanceResponse = await getStandupAttendanceByProgramAndDate(selectedProgramId, selectedDate);
        attendanceData = (attendanceResponse.success ? attendanceResponse.data : []).map(a => ({
          ...a,
          status: typeof a.status === 'object' ? (a.status?.code ?? null) : a.status,
          studentId: a.userId ?? a.studentId
        }));
      } else {
        // Regular mode: fetch by class
        // Use ISO date format for proper date filtering
        attendanceResponse = await getAttendanceByClass(selectedClassId, { date: selectedDate });
        attendanceData = (attendanceResponse.success ? attendanceResponse.data : []).map(a => ({
          ...a,
          status: typeof a.status === 'object' ? (a.status?.code ?? null) : a.status,
          studentId: a.studentId ?? a.userId
        }));

        console.log('🔍 Export Debug - Attendance result:', {
          attendanceDataLength: attendanceData.length,
          attendanceResponse,
          selectedDate,
          dateParam: selectedDate
        });

        // Filter attendance data to ensure only selected date is included
        attendanceData = attendanceData.filter(record => {
          const recordDate = record.date || record.createdAt;
          if (!recordDate) return false;
          const recordDateStr = typeof recordDate === 'string' ? recordDate.split('T')[0] : new Date(recordDate).toISOString().split('T')[0];
          return recordDateStr === selectedDate;
        });

        console.log('🔍 Export Debug - After date filter:', {
          filteredDataLength: attendanceData.length,
          selectedDate
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
        const message = t('no_attendance_records_found') || 
          (lang === 'ar' 
            ? 'لا توجد سجلات حضور لهذا التاريخ. يرجى تسجيل الحضور أولاً.'
            : 'No attendance records found for this date. Please mark attendance first.');
        showError(message);
        
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
        // Find student by studentId (not studentNumber) - use type-safe comparison
        const student = allUsers.find(u => String(u.id) === String(record.studentId));

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
          studentId: record.studentId,
          studentNumber: student?.studentNumber || '',
          studentName: student?.displayName || student?.realName || '',
          status: record.status || 'present',
          date: record.date || formatQatarDateOnly(selectedDate),
          time: safeFormatDate(record.timestamp, (date) => date.toLocaleTimeString(lang === 'ar' ? 'ar-QA' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Qatar'
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

      // Create Excel export with localized headers using constants
      let headers;
      let excelData;
      
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Standup mode: use standup-specific columns (no timestamp)
        headers = lang === 'ar' ? [
          '#',
          t('student_id') || 'معرف الطالب',
          t('student_number') || 'رقم الطالب',
          t('student_name') || 'اسم الطالب',
          t('present') || 'حاضر',
          t('late') || 'متأخر',
          t('absent') || 'غائب',
          t('clinic') || 'عيادة',
          t('date_time') || 'التاريخ والوقت',
          t('method') || 'الطريقة',
          t('notes') || 'ملاحظات'
        ] : [
          '#',
          t('student_id') || 'Student ID',
          t('student_number') || 'Student Number',
          t('student_name') || 'Student Name',
          t('present') || 'Present',
          t('late') || 'Late',
          t('absent') || 'Absent',
          t('clinic') || 'Clinic',
          t('date_time') || 'Date Time',
          t('method') || 'Method',
          t('notes') || 'Notes'
        ];
        
        excelData = enrichedData.map((row, index) => {
          const status = (typeof row.status === 'string' ? row.status : row.status?.code || 'present').toUpperCase();
          const dateStr = row.date ? row.date.split('T')[0] : '';
          let timeStr = row.time || '';
          if (!timeStr && row.timestamp) {
            try {
              const timestampDate = new Date(row.timestamp);
              if (!isNaN(timestampDate.getTime())) {
                timeStr = timestampDate.toLocaleTimeString(lang === 'ar' ? 'ar-QA' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'Asia/Qatar'
                });
              }
            } catch (e) {
              console.warn('Failed to parse timestamp for time:', e);
            }
          }
          const dateTimeStr = dateStr && timeStr ? `${dateStr} ${timeStr}` : (dateStr || timeStr || '');
          return [
            index + 1,
            row.studentId,
            row.studentNumber,
            row.studentName,
            status === ATTENDANCE_STATUS.STANDUP_PRESENT ? 'X' : '',
            status === ATTENDANCE_STATUS.STANDUP_LATE ? 'X' : '',
            status === ATTENDANCE_STATUS.STANDUP_ABSENT ? 'X' : '',
            status === ATTENDANCE_STATUS.STANDUP_CLINIC ? 'X' : '',
            dateTimeStr,
            getAttendanceMethodLabel(row.method, t, lang),
            row.notes
          ];
        });
      } else {
        // Regular mode: use all attendance type columns (excluding standup types)
        const attendanceTypesArray = Object.entries(ATTENDANCE_STATUS)
          .filter(([key, value]) => !key.startsWith('STANDUP_'))
          .map(([key, value]) => ({
          id: value,
          label_en: ATTENDANCE_STATUS_LABELS[value] || value,
          label_ar: ATTENDANCE_STATUS_LABELS[value] || value
        }));
        
        headers = lang === 'ar' ? [
          '#',
          t('student_number'),
          t('student_name'),
          ...attendanceTypesArray.map(type => type.label_ar),
          t('date_time') || 'التاريخ والوقت',
          t('method'),
          t('notes')
        ] : [
          '#',
          t('student_number'),
          t('student_name'),
          ...attendanceTypesArray.map(type => type.label_en),
          t('date_time') || 'Date Time',
          t('method'),
          t('notes')
        ];
        
        excelData = enrichedData.map((row, index) => {
          const dateStr = row.date ? row.date.split('T')[0] : '';
          let timeStr = row.time || '';
          if (!timeStr && row.timestamp) {
            try {
              const timestampDate = new Date(row.timestamp);
              if (!isNaN(timestampDate.getTime())) {
                timeStr = timestampDate.toLocaleTimeString(lang === 'ar' ? 'ar-QA' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'Asia/Qatar'
                });
              }
            } catch (e) {
              console.warn('Failed to parse timestamp for time:', e);
            }
          }
          const dateTimeStr = dateStr && timeStr ? `${dateStr} ${timeStr}` : (dateStr || timeStr || '');
          return [
            index + 1,
            row.studentNumber,
            row.studentName,
            ...attendanceTypesArray.map(type => row.status === type.id ? 'X' : ''),
            dateTimeStr,
            getAttendanceMethodLabel(row.method, t, lang),
            row.notes
          ];
        });
      }

      console.log('🔍 Export Debug - Excel Data:', {
        excelDataLength: excelData.length,
        excelDataPreview: excelData.slice(0, 3)
      });

      // Get program, subject, and class names for filename
      console.log('🔍 Export Debug - Selected IDs:', {
        selectedProgramId,
        selectedSubjectId,
        selectedClassId,
        programsState: programs.map(p => ({ id: p.id, name: p.name || p.code })),
        subjectsState: subjects.map(s => ({ id: s.id, name: s.name || s.code })),
        classesState: classes.map(c => ({ id: c.id, name: c.name || c.code }))
      });
      
      // Always fetch fresh data to ensure we have the latest
      console.log('🔍 Export Debug - Fetching fresh data for filename...');
      
      const programsResponse = await getPrograms();
      const allPrograms = programsResponse.success ? programsResponse.data : [];
      const currentProgram = allPrograms.find(p => p.id == selectedProgramId); // Use == for type coercion
      
      const subjectsResponse = await getSubjects(selectedProgramId ? { programId: selectedProgramId } : {});
      const allSubjects = subjectsResponse.success ? subjectsResponse.data : [];
      const currentSubject = allSubjects.find(s => s.id == selectedSubjectId); // Use == for type coercion
      
      const classesResponse = await getClasses(selectedSubjectId ? { subjectId: selectedSubjectId } : {});
      const allClasses = classesResponse.success ? classesResponse.data : [];
      const currentClass = allClasses.find(c => c.id == selectedClassId); // Use == for type coercion
      
      console.log('🔍 Export Debug - Fresh Data Results:', {
        allPrograms: allPrograms.map(p => ({ id: p.id, name: p.name || p.code })),
        allSubjects: allSubjects.map(s => ({ id: s.id, name: s.name || s.code })),
        allClasses: allClasses.map(c => ({ id: c.id, name: c.name || c.code })),
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
        ? `تقرير_الحضور_الرسمي_${safeProgramName}_${safeSubjectName}_${safeClassName}_${dateFormatted}.xlsx`
        : `attendance_official_report_${safeProgramName}_${safeSubjectName}_${safeClassName}_${dateFormatted}.xlsx`;
      
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

      // Generate Excel file
      const excelBlob = await exportDailyReportExcel(excelData, {
        fileName: filename,
        headers: headers,
        format: 'xlsx',
        freezeHeader: true,
        autoFilter: true,
        autoWidth: true,
        boldHeaders: true,
        borders: true,
        conditionalFormatting: false, // Daily report doesn't need absence formatting
        rtl: lang === 'ar' // Enable RTL for Arabic
      });

      // Handle export based on format
      if (dailyExportFormat === 'email') {
        console.log('📧 Sending daily report via email...');
        
        // Set loading state
        setIsExporting(true);
        console.log('✅ Daily report loading state set, starting export...');
        
        try {
          // Upload Excel to Firebase Storage
          const uploadResult = await uploadReport({
            file: excelBlob,
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
        // Excel export (default)
        console.log('📊 Generating Excel export...');
        
        const url = URL.createObjectURL(excelBlob);
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
  }, [selectedClassId, selectedDate, selectedProgramId, selectedSubjectId, programs, subjects, classes, lang, t, dailyExportFormat, dailyEmailRecipients, user, availableUsers, showError, showSuccess, attendanceMode]);

  
  const toggleUserSelection = useCallback((user) => {
    const userKey = `${user.role}_${user.id}`;
    if (emailRecipients.includes(userKey)) {
      setEmailRecipients(emailRecipients.filter(r => r !== userKey));
    } else {
      setEmailRecipients([...emailRecipients, userKey]);
    }
  }, [emailRecipients]);

  // Toggle function for role selection in summary report
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

  // Separate toggle function for daily report email recipients
  const toggleDailyUserSelection = useCallback((user) => {
    const userKey = `${user.role}_${user.id}`;
    if (dailyEmailRecipients.includes(userKey)) {
      setDailyEmailRecipients(dailyEmailRecipients.filter(r => r !== userKey));
    } else {
      setDailyEmailRecipients([...dailyEmailRecipients, userKey]);
    }
  }, [dailyEmailRecipients]);

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

  // Export Attendance Violations Report function
  const handleExportAttendanceViolations = useCallback(async (subjectsToExport, violationTypesToExport) => {
    // Prevent multiple simultaneous exports
    if (isExportingBehavioral) {
      console.log('⚠️ Export already in progress, skipping');
      return;
    }

    // Use passed parameters or fall back to state
    const exportSubjects = subjectsToExport || selectedSubjectsForViolations;
    const exportViolationTypes = violationTypesToExport || selectedViolationTypes;

    // Validate subject selection
    if (exportSubjects.length === 0) {
      showError(t('select_at_least_one_subject') || 'Please select at least one subject for the report');
      return;
    }

    // Validate violation type selection
    const hasSelectedViolationType = Object.values(exportViolationTypes).some(v => v);
    if (!hasSelectedViolationType) {
      showError(t('select_at_least_one_violation_type') || 'Please select at least one violation type');
      return;
    }

    try {
      setIsExportingBehavioral(true);
      console.log('🔍 Exporting Attendance Violations Report:', { 
        selectedProgramId, 
        exportSubjects, 
        exportViolationTypes 
      });

      // Fetch attendance records for all selected subjects
      console.log('🔍 Fetching attendance for subjects:', exportSubjects);
      const attendancePromises = exportSubjects.map(subjectId =>
        getAttendanceRecords({ subjectId: Number(subjectId) })
      );
      
      const attendanceResults = await Promise.all(attendancePromises);
      
      console.log('🔍 Attendance results per subject:', attendanceResults.map((r, i) => ({
        subjectId: exportSubjects[i],
        success: r.success,
        count: r.data?.length || 0,
        sampleIds: r.data?.slice(0, 2).map(d => d.id)
      })));
      
      const allAttendanceData = attendanceResults
        .filter(result => result.success)
        .flatMap(result => result.data);

      console.log('🔍 Total attendance records before deduplication:', allAttendanceData.length);

      // Deduplicate by ID (backend may still return duplicates until server restart)
      const deduplicatedData = Array.from(
        new Map(allAttendanceData.map(record => [record.id, record])).values()
      );
      console.log('🔍 Total attendance records after deduplication:', deduplicatedData.length);

      // Log sample records to see actual status values
      console.log('🔍 Sample attendance records:', deduplicatedData.slice(0, 5).map(r => ({
        id: r.id,
        status: r.status,
        statusType: typeof r.status,
        statusLower: String(r.status || '').toLowerCase()
      })));

      // Log all unique status values
      const uniqueStatuses = [...new Set(deduplicatedData.map(r => r.status))];
      console.log('🔍 All unique status values in dataset:', uniqueStatuses);

      if (deduplicatedData.length === 0) {
        console.log('⚠️ No attendance records found');
        showError(t('no_attendance_records_found') || 'No attendance records found');
        return;
      }

      // Filter by selected violation types
      const filteredData = deduplicatedData.filter(record => {
        const statusCode = record.status?.code || '';
        
        if (exportViolationTypes.absentNoExcuse && statusCode === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) return true;
        if (exportViolationTypes.absentWithExcuse && statusCode === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) return true;
        if (exportViolationTypes.excusedLeave && statusCode === ATTENDANCE_STATUS.EXCUSED_LEAVE) return true;
        if (exportViolationTypes.late && statusCode === ATTENDANCE_STATUS.LATE) return true;
        if (exportViolationTypes.humanCase && statusCode === ATTENDANCE_STATUS.HUMAN_CASE) return true;
        
        return false;
      });

      console.log('📊 Filtered attendance records:', filteredData.length);
      console.log('🔍 Sample attendance record fields:', Object.keys(filteredData[0] || {}));
      console.log('🔍 First attendance record:', filteredData[0]);

      if (filteredData.length === 0) {
        console.log('⚠️ No records match selected violation types');
        showError(t('no_records_match_filters') || 'No records match the selected violation types');
        return;
      }

      // Enrich data with student names, numbers, class names, subject names
      // Note: Attendance records already have user object with student info
      const enrichedData = filteredData.map(record => {
        const recordClass = classes.find(c => c.id === record.classId);
        const recordSubject = subjects.find(s => s.id == record.subjectId);
        
        // Use user object from attendance record for student info
        const studentName = record.user?.displayName || record.user?.firstName + ' ' + record.user?.lastName || '';
        const studentNumber = record.user?.studentNumber || '';
        
        console.log('🔍 Enriching record:', {
          recordId: record.id,
          userId: record.userId,
          subjectId: record.subjectId,
          studentName: studentName,
          studentNumber: studentNumber,
          subjectName: recordSubject?.nameEn || recordSubject?.name || '',
          userObject: record.user,
          userHasStudentNumber: !!record.user?.studentNumber,
          userStudentNumberValue: record.user?.studentNumber
        });
        
        return {
          ...record,
          studentName: studentName,
          studentNumber: studentNumber,
          className: lang === 'ar' 
            ? (recordClass?.nameAr || recordClass?.name || recordClass?.nameEn || '')
            : (recordClass?.nameEn || recordClass?.name || ''),
          subjectName: lang === 'ar'
            ? (recordSubject?.nameAr || recordSubject?.name || recordSubject?.nameEn || '')
            : (recordSubject?.nameEn || recordSubject?.name || ''),
          subject: recordSubject, // Include full subject object for Arabic name
          class: recordClass // Include full class object for Arabic name
        };
      });

      // Generate Excel file
      const excelBlob = await exportAttendanceViolationsReport(enrichedData, {
        lang: lang,
        t: t
      });

      // Download the file
      const url = URL.createObjectURL(excelBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename: attendance_program_subjects
      const selectedProgram = programs.find(p => p.id == selectedProgramId);
      const firstSubject = subjects.find(s => s.id == exportSubjects[0]);
      
      const programName = selectedProgram?.nameEn || selectedProgram?.name || 'Unknown';
      const subjectsLabel = exportSubjects.length === 1 
        ? (firstSubject?.nameEn || firstSubject?.name || 'Unknown')
        : `${exportSubjects.length}Subjects`;
      
      const filename = lang === 'ar' 
        ? `الحضور_${programName}_${subjectsLabel}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `attendance_${programName}_${subjectsLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Attendance Violations Report exported successfully');
      showSuccess(t('attendance_violations_report_exported_successfully') || 'Attendance Violations Report exported successfully');

    } catch (error) {
      console.error('❌ Attendance Violations Report export failed:', error);
      showError((t('export_failed') || 'Export failed: ') + error.message);
    } finally {
      setIsExportingBehavioral(false);
    }
  }, [selectedProgramId, selectedSubjectId, selectedClassId, enrollments, classes, subjects, programs, lang, t, showError, showSuccess, isExportingBehavioral]);

  // Export Summary Report function
  const exportSemesterReport = useCallback(async () => {
    console.log('📊 Export function called', { selectedClassId, selectedProgramId, attendanceMode });
    
    // Validate selection based on attendance mode
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      // Standup mode: requires program selection and program report selection
      if (!selectedProgramId || selectedProgramId === 'all') {
        console.error('❌ No program selected for standup mode');
        showError(t('please_select_program') || 'Please select a program first');
        return;
      }
      
      // Validate program selection for report
      if (selectedProgramsForReport.length === 0) {
        console.error('❌ No programs selected for standup report');
        showError(t('select_at_least_one_program') || 'Please select at least one program for the report');
        return;
      }
    } else {
      // Regular mode: requires class or program selection
      if (!selectedClassId && !selectedProgramId) {
        console.error('❌ No class or program selected');
        showError(t('please_select_class_or_program') || 'Please select a class or program first');
        return;
      }

      // Validate subject selection (only for regular mode)
      if (selectedSubjectsForReport.length === 0) {
        console.error('❌ No subjects selected for report');
        showError(t('select_at_least_one_subject') || 'Please select at least one subject for the report');
        return;
      }
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
      let attendanceData = [];
      
      // Fetch attendance based on mode
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Standup mode: fetch by program for date range (semester)
        // For now, use a reasonable date range - this could be parameterized
        const startDate = '2024-01-01'; // TODO: Make this configurable
        const endDate = new Date().toISOString().split('T')[0];
        
        console.log('📊 Standup mode - fetching attendance for program:', selectedProgramId, 'from', startDate, 'to', endDate);
        
        const attendanceResponse = await getStandupAttendanceByProgramForDateRange(selectedProgramId, startDate, endDate);
        attendanceData = (attendanceResponse.success ? attendanceResponse.data : []).map(a => ({
          ...a,
          status: typeof a.status === 'object' ? (a.status?.code ?? null) : a.status,
          studentId: a.userId ?? a.studentId
        }));
      } else {
        // Regular mode: existing logic
        const scope = selectedClassId ? 'class' : 'program';
        const scopeId = selectedClassId || selectedProgramId;
        console.log('📊 Regular mode - Export scope:', { scope, scopeId });

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
        
        attendanceData = (attendanceResponse.success ? attendanceResponse.data : []).map(a => ({
          ...a,
          status: typeof a.status === 'object' ? (a.status?.code ?? null) : a.status,
          studentId: a.studentId ?? a.userId
        }));
      }
      
      console.log('📊 Semester Report - Attendance Data:', {
        totalRecords: attendanceData.length,
        sampleRecord: attendanceData[0]
      });

      // Get all students
      const usersResponse = await getUsers();
      const allUsers = usersResponse.success ? usersResponse.data : [];

      // Aggregate attendance data by student and subject
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
            total: 0,
            subjects: {} // Track attendance per subject
          };
        }

        // Get subject ID from the class, fallback to selected subject if not available
        const recordClassId = record.classId;
        let subjectId = 'unknown';
        
        if (recordClassId) {
          const recordClass = classes.find(c => c.id == recordClassId);
          subjectId = recordClass?.subjectId || recordClass?.subject || selectedSubjectId || 'unknown';
        } else {
          // If no classId, use the selected subject
          subjectId = selectedSubjectId || 'unknown';
        }

        if (!studentAttendanceMap[studentId].subjects[subjectId]) {
          studentAttendanceMap[studentId].subjects[subjectId] = {
            present: 0,
            late: 0,
            absentNoExcuse: 0,
            absentWithExcuse: 0,
            excusedLeave: 0,
            humanCase: 0,
            total: 0
          };
        }
        
        const status = (typeof record.status === 'string' ? record.status : record.status?.code || 'present').toLowerCase();
        studentAttendanceMap[studentId].total++;
        studentAttendanceMap[studentId].subjects[subjectId].total++;
        
        // Map status to counters - handle all 6 attendance types
        if (status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.STANDUP_PRESENT) {
          studentAttendanceMap[studentId].present++;
          studentAttendanceMap[studentId].subjects[subjectId].present++;
        } else if (status === ATTENDANCE_STATUS.LATE || status === ATTENDANCE_STATUS.STANDUP_LATE) {
          studentAttendanceMap[studentId].late++;
          studentAttendanceMap[studentId].subjects[subjectId].late++;
        } else if (status === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE || status === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE.toLowerCase() || status === ATTENDANCE_STATUS.STANDUP_ABSENT) {
          studentAttendanceMap[studentId].absentNoExcuse++;
          studentAttendanceMap[studentId].subjects[subjectId].absentNoExcuse++;
        } else if (status === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE || status === 'absence_excused' || status === 'absenceexcused' || status === ATTENDANCE_STATUS.STANDUP_ABSENT || status === ATTENDANCE_STATUS.STANDUP_CLINIC) {
          studentAttendanceMap[studentId].absentWithExcuse++;
          studentAttendanceMap[studentId].subjects[subjectId].absentWithExcuse++;
        } else if (status === ATTENDANCE_STATUS.EXCUSED_LEAVE || status === ATTENDANCE_STATUS.EXCUSED_LEAVE.toLowerCase()) {
          studentAttendanceMap[studentId].excusedLeave++;
          studentAttendanceMap[studentId].subjects[subjectId].excusedLeave++;
        } else if (status === ATTENDANCE_STATUS.HUMAN_CASE || status === ATTENDANCE_STATUS.HUMAN_CASE.toLowerCase()) {
          studentAttendanceMap[studentId].humanCase++;
          studentAttendanceMap[studentId].subjects[subjectId].humanCase++;
        }
      });


      // Create enriched data with calculations
      const enrichedData = Object.entries(studentAttendanceMap).map(([studentId, stats]) => {
        const student = allUsers.find(u => String(u.id) === String(studentId));

        // Calculate attendance percentage (present + late count as present)
        const attendancePercentage = stats.total > 0
          ? (((stats.present + stats.late) / stats.total) * 100).toFixed(2)
          : '0.00';

        // Calculate total absences (excused + unexcused, excluding excused leave)
        const totalAbsencesForFB = stats.absentNoExcuse + stats.absentWithExcuse + stats.humanCase;
        const totalAbsences = stats.absentNoExcuse + stats.absentWithExcuse + stats.excusedLeave + stats.humanCase;
        const absencePercentage = stats.total > 0
          ? ((totalAbsences / stats.total) * 100).toFixed(2)
          : '0.00';

        // Calculate attendance failure based on new rule:
        // Absent with excuse + absent without excuse + human case (excluding excused leave) must be >= 8 classes
        const attendanceFailure = totalAbsencesForFB >= 8 ? ABSENCE_THRESHOLDS.FAILURE_GRADE : '';

        // Get grade from enrollment data
        const enrollment = enrollments.find(e => e.userId == studentId);
        const grade = enrollment?.grade || '';

        const baseData = {
          studentId: studentId,
          studentNumber: student?.studentNumber || '',
          studentName: student?.displayName || student?.realName || '',
          present: stats.present,
          late: stats.late,
          absentNoExcuse: stats.absentNoExcuse,
          absentWithExcuse: stats.absentWithExcuse,
          excusedLeave: stats.excusedLeave,
          humanCase: stats.humanCase,
          totalSessions: stats.total,
          grade: grade,
          attendanceFailure: attendanceFailure
        };
        
        // Only add mark deductions for regular mode (not standup)
        if (attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP) {
          const absentNoExcuseDeduction = stats.absentNoExcuse * 0.5;
          const lateDeduction = stats.late * 0.25;
          const absentWithExcuseDeduction = stats.absentWithExcuse * 0.25;
          const excusedLeaveDeduction = stats.excusedLeave * 0.25;
          const humanCaseDeduction = stats.humanCase * 0.25;
          const totalDeduction = absentNoExcuseDeduction + lateDeduction + absentWithExcuseDeduction + excusedLeaveDeduction + humanCaseDeduction;
          
          return {
            ...baseData,
            absentNoExcuseDeduction: absentNoExcuseDeduction.toFixed(2),
            lateDeduction: lateDeduction.toFixed(2),
            absentWithExcuseDeduction: absentWithExcuseDeduction.toFixed(2),
            excusedLeaveDeduction: excusedLeaveDeduction.toFixed(2),
            humanCaseDeduction: humanCaseDeduction.toFixed(2),
            totalMarkDeduction: totalDeduction.toFixed(2)
          };
        }
        
        // Standup mode: return without mark calculations
        return baseData;
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
      // For standup mode, use standup-specific columns
      let headers;
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        headers = lang === 'ar' ? [
          '#',
          t('student_id') || 'معرف الطالب',
          t('student_number') || 'رقم الطالب',
          t('student_name') || 'اسم الطالب',
          t('present') || 'حاضر',
          t('late') || 'متأخر',
          t('absent') || 'غائب',
          t('clinic') || 'عيادة',
          t('total_sessions') || 'إجمالي الجلسات'
        ] : [
          '#',
          t('student_id') || 'Student ID',
          t('student_number') || 'Student Number',
          t('student_name') || 'Student Name',
          t('present') || 'Present',
          t('late') || 'Late',
          t('absent') || 'Absent',
          t('clinic') || 'Clinic',
          t('total_sessions') || 'Total Sessions'
        ];
      } else {
        headers = lang === 'ar' ? [
          '#',
          t('student_number') || 'رقم الطالب',
          t('student_name') || 'اسم الطالب',
          t('present') || 'حاضر',
          t('late') || 'متأخر',
          t('absent_no_excuse') || 'غائب بدون عذر',
          t('absent_with_excuse') || 'غائب مع عذر',
          t('excused_leave') || 'استئذان',
          t('human_case') || 'حالة إنسانية',
          t('total_sessions') || 'إجمالي الجلسات'
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
          t('total_sessions') || 'Total Sessions'
        ];
      }

      // Add mark deduction columns only for regular mode
      if (attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        if (lang === 'ar') {
          headers.push(
            t('absent_no_excuse_deduction') || 'خصم الغياب بدون عذر (×0.5)',
            t('late_deduction') || 'خصم التأخر (×0.5)',
            t('absent_with_excuse_deduction') || 'خصم الغياب مع عذر (×0.25)',
            t('excused_leave_deduction') || 'خصم الاستئذان (×0.25)',
            t('human_case_deduction') || 'خصم الحالة (×0.25)',
            t('total_mark_deduction') || 'إجمالي الخصم',
            t('grade') || 'الدرجة',
            t('attendance_failure') || 'فشل الحضور'
          );
        } else {
          headers.push(
            t('absent_no_excuse_deduction') || 'Absent No Excuse Deduction (×0.5)',
            t('late_deduction') || 'Late Deduction (×0.5)',
            t('absent_with_excuse_deduction') || 'Absent With Excuse Deduction (×0.25)',
            t('excused_leave_deduction') || 'Excused Leave Deduction (×0.25)',
            t('human_case_deduction') || 'Human Case Deduction (×0.25)',
            t('total_mark_deduction') || 'Total Mark Deduction',
            t('grade') || 'Grade',
            t('attendance_failure') || 'Attendance Failure'
          );
        }
      }

      // Add per-subject columns for regular mode
      if (attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Get all subjects in the program
        const programSubjects = subjects.filter(s => !selectedProgramId || selectedProgramId === 'all' || s.programId == selectedProgramId);
        
        programSubjects.forEach(subject => {
          const subjectName = subject.nameEn || subject.name || 'Unknown Subject';
          headers.push(`${subjectName} - ${t('present') || 'Present'}`);
          headers.push(`${subjectName} - ${t('absent') || 'Absent'}`);
          headers.push(`${subjectName} - ${t('percentage') || 'Percentage'}`);
          headers.push(`${subjectName} - ${t('deduction') || 'Deduction'}`);
          headers.push(`${subjectName} - ${t('attendance_failure') || ABSENCE_THRESHOLDS.FAILURE_GRADE}`);
          headers.push(`${subjectName} - ${t('grade') || 'Grade'}`);
        });
      }

      // Calculate per-subject attendance data using studentAttendanceMap directly
      const perSubjectAttendance = {};
      if (attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        const programSubjects = subjects.filter(s => !selectedProgramId || selectedProgramId === 'all' || s.programId == selectedProgramId);
        
        Object.keys(studentAttendanceMap).forEach(studentId => {
          if (!perSubjectAttendance[studentId]) {
            perSubjectAttendance[studentId] = {};
          }
          
          // Get the student's subject data directly from studentAttendanceMap
          const studentSubjectData = studentAttendanceMap[studentId]?.subjects || {};
          
          programSubjects.forEach(subject => {
            // Use type coercion to match subject IDs (string vs number)
            const subjectData = studentSubjectData[String(subject.id)] || studentSubjectData[subject.id] || {
              present: 0,
              late: 0,
              absentNoExcuse: 0,
              absentWithExcuse: 0,
              excusedLeave: 0,
              humanCase: 0,
              total: 0
            };
            
            const absent = subjectData.absentNoExcuse + subjectData.absentWithExcuse + subjectData.humanCase;
            const deduction = (
              (subjectData.absentNoExcuse * 0.5) +
              (subjectData.late * 0.25) +
              (subjectData.absentWithExcuse * 0.25) +
              (subjectData.humanCase * 0.25) +
              (subjectData.excusedLeave * 0.25)
            ).toFixed(2);

            // Calculate per-subject attendance percentage (present + late count as present)
            const subjectAttendancePercentage = subjectData.total > 0
              ? (((subjectData.present + subjectData.late) / subjectData.total) * 100).toFixed(2)
              : '0.00';

            // Calculate per-subject FB status (>= 8 classes rule, excluding excused leave)
            const subjectAbsencesForFB = subjectData.absentNoExcuse + subjectData.absentWithExcuse + subjectData.humanCase;
            const subjectAttendanceFailure = subjectAbsencesForFB >= 8 ? ABSENCE_THRESHOLDS.FAILURE_GRADE : '';

            // Get per-subject grade (for now, use overall grade - could be enhanced to have subject-specific grades)
            const enrollment = enrollments.find(e => e.userId == studentId);
            const subjectGrade = enrollment?.grade || '';

            perSubjectAttendance[studentId][subject.id] = {
              present: subjectData.present,
              absent: absent,
              percentage: subjectAttendancePercentage + '%',
              deduction: deduction,
              attendanceFailure: subjectAttendanceFailure,
              grade: subjectGrade
            };
          });
        });
      }

      // Create Excel data with per-subject data if detailed
      let excelData;
      
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Standup mode: use standup-specific columns (Present, Late, Absent, Clinic)
        excelData = enrichedData.map((row, index) => {
          const totalAbsent = parseInt(row.absentNoExcuse) + parseInt(row.absentWithExcuse) + parseInt(row.excusedLeave);
          return [
            index + 1,
            row.studentId,
            row.studentNumber,
            row.studentName,
            row.present,
            row.late,
            totalAbsent,
            row.humanCase,
            row.totalSessions
          ];
        });
      } else {
        // Regular mode: use all attendance columns
        excelData = enrichedData.map((row, index) => {
          let rowData = [
            index + 1,
            row.studentNumber,
            row.studentName,
            row.present,
            row.late,
            row.absentNoExcuse,
            row.absentWithExcuse,
            row.excusedLeave,
            row.humanCase,
            row.totalSessions
          ];
          
          // Add mark deduction columns only for regular mode
          rowData.push(
            row.absentNoExcuseDeduction,
            row.lateDeduction,
            row.absentWithExcuseDeduction,
            row.excusedLeaveDeduction,
            row.humanCaseDeduction,
            row.totalMarkDeduction
          );

          // Add grade and attendance failure columns
          rowData.push(
            row.grade,
            row.attendanceFailure
          );

          // Add per-subject columns
          const programSubjects = subjects.filter(s => !selectedProgramId || selectedProgramId === 'all' || s.programId == selectedProgramId);
          programSubjects.forEach(subject => {
            const subjectData = perSubjectAttendance[row.studentId]?.[subject.id];
            if (subjectData) {
              rowData.push(
                subjectData.present,
                subjectData.absent,
                subjectData.percentage,
                subjectData.deduction,
                subjectData.attendanceFailure,
                subjectData.grade
              );
            } else {
              rowData.push('', '', '', '', '', '');
            }
          });
          
          return rowData;
        });
      }

      // Calculate grand totals row
      const totalsRow = ['TOTALS'];
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        totalsRow.push(''); // student_id
        totalsRow.push(''); // student_number
        totalsRow.push(''); // student_name
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (row.status === ATTENDANCE_STATUS.STANDUP_PRESENT ? 1 : 0), 0)); // present
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (row.status === ATTENDANCE_STATUS.STANDUP_LATE ? 1 : 0), 0)); // late
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (row.status === ATTENDANCE_STATUS.STANDUP_ABSENT ? 1 : 0), 0)); // absent
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (row.status === ATTENDANCE_STATUS.STANDUP_CLINIC ? 1 : 0), 0)); // clinic
        totalsRow.push(''); // total_sessions
      } else {
        totalsRow.push(''); // student_number
        totalsRow.push(''); // student_name
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseInt(row.present || 0), 0)); // present
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseInt(row.late || 0), 0)); // late
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseInt(row.absentNoExcuse || 0), 0)); // absent_no_excuse
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseInt(row.absentWithExcuse || 0), 0)); // absent_with_excuse
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseInt(row.excusedLeave || 0), 0)); // excused_leave
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseInt(row.humanCase || 0), 0)); // human_case
        totalsRow.push(''); // total_sessions

        // Deduction totals
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseFloat(row.absentNoExcuseDeduction || 0), 0).toFixed(2)); // absent_no_excuse_deduction
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseFloat(row.lateDeduction || 0), 0).toFixed(2)); // late_deduction
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseFloat(row.absentWithExcuseDeduction || 0), 0).toFixed(2)); // absent_with_excuse_deduction
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseFloat(row.excusedLeaveDeduction || 0), 0).toFixed(2)); // excused_leave_deduction
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseFloat(row.humanCaseDeduction || 0), 0).toFixed(2)); // human_case_deduction
        totalsRow.push(enrichedData.reduce((sum, row) => sum + parseFloat(row.totalMarkDeduction || 0), 0).toFixed(2)); // total_mark_deduction

        // Grade and attendance failure totals
        totalsRow.push(''); // grade (no total)
        const fbCount = enrichedData.filter(row => row.attendanceFailure === ABSENCE_THRESHOLDS.FAILURE_GRADE).length;
        totalsRow.push(fbCount > 0 ? fbCount : ''); // attendance_failure (count of FB students)

        // Per-subject totals
        const programSubjects = subjects.filter(s => !selectedProgramId || selectedProgramId === 'all' || s.programId == selectedProgramId);
        programSubjects.forEach(subject => {
          let subjectPresent = 0;
          let subjectAbsent = 0;
          let subjectDeduction = 0;
          let subjectTotalSessions = 0;
          let subjectFbCount = 0;
          
          Object.keys(studentAttendanceMap).forEach(studentId => {
            const studentSubjectData = studentAttendanceMap[studentId]?.subjects || {};
            const subjectData = studentSubjectData[String(subject.id)] || studentSubjectData[subject.id];
            if (subjectData && subjectData.present > 0) {
              subjectPresent += subjectData.present;
              subjectAbsent += (subjectData.absentNoExcuse + subjectData.absentWithExcuse + subjectData.humanCase);
              subjectDeduction += (
                (subjectData.absentNoExcuse * 0.5) +
                (subjectData.late * 0.25) +
                (subjectData.absentWithExcuse * 0.25) +
                (subjectData.humanCase * 0.25) +
                (subjectData.excusedLeave * 0.25)
              );
              subjectTotalSessions += subjectData.total;

              // Calculate FB for this subject (>= 8 classes rule, excluding excused leave)
              const subjectAbsencesForFB = subjectData.absentNoExcuse + subjectData.absentWithExcuse + subjectData.humanCase;
              if (subjectAbsencesForFB >= 8) {
                subjectFbCount++;
              }
            }
          });
          
          // Calculate overall subject attendance percentage
          const subjectOverallPercentage = subjectTotalSessions > 0
            ? (((subjectPresent + Object.keys(studentAttendanceMap).reduce((sum, studentId) => {
                const studentSubjectData = studentAttendanceMap[studentId]?.subjects || {};
                const subjectData = studentSubjectData[String(subject.id)] || studentSubjectData[subject.id];
                return sum + (subjectData?.late || 0);
              }, 0)) / subjectTotalSessions) * 100).toFixed(2)
            : '0.00';

          totalsRow.push(subjectPresent > 0 ? subjectPresent : '');
          totalsRow.push(subjectAbsent > 0 ? subjectAbsent : '');
          totalsRow.push(subjectTotalSessions > 0 ? subjectOverallPercentage + '%' : '');
          totalsRow.push(subjectDeduction > 0 ? subjectDeduction.toFixed(2) : '');
          totalsRow.push(subjectFbCount > 0 ? subjectFbCount : '');
          totalsRow.push(''); // grade (no total)
        });
      }

      // Add totals row to Excel data
      excelData.push(totalsRow);

      const currentProgram = programs.find(p => p.id == selectedProgramId);
      const currentSubject = subjects.find(s => s.id == selectedSubjectId);
      const currentClass = classes.find(c => c.id == selectedClassId);
      
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
      
      // Use .xlsx format for ExcelJS export
      const fileExtension = '.xlsx';
      
      // Create filename with proper structure
      let filename;
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Standup mode: use program name only, no subjects/classes
        filename = lang === 'ar'
          ? `تقرير_الوقوف_${programName}_${formattedDate}${fileExtension}`
          : `standup_${programName}_${formattedDate}${fileExtension}`;
      } else if (selectedSubjectsForReport.length > 0) {
        // For subject export
        const subjectCount = selectedSubjectsForReport.length;
        if (subjectCount === 1) {
          // Single subject: use the subject name
          const selectedSubject = subjects.find(s => s.id === selectedSubjectsForReport[0]);
          const singleSubjectName = sanitize(selectedSubject?.nameEn || selectedSubject?.name || 'UnknownSubject');
          filename = lang === 'ar'
            ? `تقرير_ملخص_${programName}_${singleSubjectName}_${formattedDate}${fileExtension}`
            : `summary_report_${programName}_${singleSubjectName}_${formattedDate}${fileExtension}`;
        } else {
          // Multiple subjects: use count
          filename = lang === 'ar'
            ? `تقرير_ملخص_${programName}_${subjectCount}_مواد_${formattedDate}${fileExtension}`
            : `summary_report_${programName}_${subjectCount}_subjects_${formattedDate}${fileExtension}`;
        }
      } else if (selectedClassId) {
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
      console.log('📊 Export Mode:', attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'standup' : 'regular');

      // Generate Excel file
      const programSubjects = subjects.filter(s => !selectedProgramId || selectedProgramId === 'all' || s.programId == selectedProgramId);
      const excelBlob = await exportSummaryReportExcel(excelData, programSubjects, {
        fileName: filename,
        format: 'xlsx',
        freezeHeader: true,
        autoFilter: true,
        autoWidth: true,
        boldHeaders: true,
        borders: true,
        conditionalFormatting: true, // Enable conditional formatting for absence counts
        rtl: lang === 'ar' // Enable RTL for Arabic
      });

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
            // Step 1: Upload Excel to Firebase Storage for audit trail and sharing
            console.log('📤 Uploading Excel report to Firebase Storage...');
            let uploadResult;
            
            try {
              uploadResult = await uploadReport({
                file: excelBlob,
                filename: filename,
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
              
              console.log('✅ Excel uploaded to Firebase Storage:', {
                fileId: uploadResult.fileId,
                downloadURL: uploadResult.downloadURL
              });
            } catch (storageError) {
              console.error('❌ Firebase Storage upload failed:', storageError);
              console.log('🔄 Continuing without storage upload - sending email with Excel content...');
              
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
                    message: `A summary report has been generated for ${currentProgram?.nameEn || currentProgram?.name || 'N/A'} with ${enrichedData.length} students. Download the Excel report using the link below.`,
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
                      storageFailed: uploadResult.storageFailed || false
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
        // Excel export (default and only option)
        console.log('📊 Generating Excel export...');
        
        const url = URL.createObjectURL(excelBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('📊 Excel file downloaded:', filename);
        showSuccess(t('summary_report_exported_successfully') || 'Summary report exported successfully');
      }

    } catch (error) {
      console.error('Semester Report Export failed:', error);
      showError((t('export_failed') || 'Export failed: ') + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [selectedClassId, selectedSubjectId, selectedProgramId, programs, subjects, classes, lang, t, showError, showSuccess, showInfo, exportFormat, selectedSubjectsForReport, selectedProgramsForReport, emailRecipients, user, availableUsers, getUserFromKey, attendanceMode]);

  // Fetch users for email recipient selection
  const fetchUsersForEmail = useCallback(async () => {
    if (usersLoading) return;
    
    setUsersLoading(true);
    try {
      const usersResult = await getUsers();
      const allUsers = (usersResult.success ? (usersResult.data || []) : [])
        .filter((userData) => userData.email && (userData.displayName || userData.realName))
        .map((userData) => ({
          id: userData.id,
          name: userData.displayName || userData.realName,
          email: userData.email,
          role: userData.role || 'user',
          isAdmin: userData.isAdmin,
          isSuperAdmin: userData.isSuperAdmin,
          isInstructor: userData.isInstructor,
          isHR: userData.isHR,
          isStudent: userData.isStudent,
        }));
      
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
          // Use profile data for other users
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
        console.log('⚠️ No users found for recipient selection');
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

  // Memoized filtered and sorted students for performance
  const filteredAndSortedStudents = useMemo(() => {
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
      debug('[Filter] Applying attendance filter:', attendanceFilter);
      
      // More flexible filtering - check multiple possible attendance fields
      filtered = filtered.filter(student => {
        const attendanceStatus = student.attendance || student.status || 'absent_no_excuse';
        const matches = attendanceStatus === attendanceFilter;
        
        if (!matches && attendanceFilter === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE.toLowerCase()) {
          // Also check for null/undefined attendance as absent no excuse
          return !student.attendance || student.attendance === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE.toLowerCase();
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
      // Primary sort: use the selected sort field
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle attendance field specifically
      if (sortField === 'attendance') {
        aValue = a.attendance || a.status || 'absent_no_excuse';
        bValue = b.attendance || b.status || 'absent_no_excuse';
      }

      // Handle attendance statistics fields
      const attendanceStatsFields = ['present', 'late', 'absent', 'absentExcused', 'excusedLeave', 'human'];
      const standupStatsFields = ['standupPresent', 'standupLate', 'standupAbsent', 'standupClinic'];
      
      if (attendanceStatsFields.includes(sortField)) {
        const stats = a.attendanceStats || {};
        const statsB = b.attendanceStats || {};
        
        // Map field names to attendance stats property names
        const fieldMapping = {
          'present': 'present',
          'late': 'late',
          'absent': 'absent',
          'absentExcused': 'absentWithExcuse',
          'excusedLeave': 'excusedLeave',
          'human': 'humanitarianCase'
        };
        
        const statProperty = fieldMapping[sortField];
        aValue = stats[statProperty] || 0;
        bValue = statsB[statProperty] || 0;
      } else if (standupStatsFields.includes(sortField)) {
        const stats = a.standupStats || {};
        const statsB = b.standupStats || {};
        
        // Map field names to standup stats property names
        const fieldMapping = {
          'standupPresent': 'present',
          'standupLate': 'late',
          'standupAbsent': 'absent',
          'standupClinic': 'clinic'
        };
        
        const statProperty = fieldMapping[sortField];
        aValue = stats[statProperty] || 0;
        bValue = statsB[statProperty] || 0;
      }

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

      const primarySort = sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);

      // If primary sort results in a tie, use studentOrder as secondary sort
      if (primarySort !== 0) {
        return primarySort;
      }

      // Secondary sort: by studentOrder
      const aOrder = a.studentOrder !== null && a.studentOrder !== undefined && a.studentOrder !== '' ? Number(a.studentOrder) : (Number(a.studentNumber) || 999999);
      const bOrder = b.studentOrder !== null && b.studentOrder !== undefined && b.studentOrder !== '' ? Number(b.studentOrder) : (Number(b.studentNumber) || 999999);
      
      return aOrder - bOrder;
    });

    return sorted;
  }, [students, debouncedSearchQuery, attendanceFilter, participationMin, participationMax, penaltyFilter, sortField, sortDirection]);

  // Calculate pagination
  const total = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginatedStudents = filteredAndSortedStudents.slice(
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

  if (errorMessage) {
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
          <p style={{ color: 'var(--text-muted, #6b7280)', margin: '0 0 1rem 0' }}>{errorMessage}</p>
          <button
            onClick={() => {
              setErrorMessage(null);
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
          flexWrap: 'nowrap'
        }}>
          {/* Program/Subject/Class Selection */}
          <div style={{ flex: '0 0 auto', minWidth: '250px', maxWidth: '350px' }}>
            <ProgramsSelect
              programs={programs}
              subjects={subjects}
              classes={classes}
              selectedProgram={String(selectedProgramId || '')}
              selectedSubject={String(selectedSubjectId || '')}
              selectedClass={String(selectedClassId || '')}
              showSubjects={attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP}
              showClasses={attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP}
              onProgramChange={(val) => {
                const programId = val && typeof val === 'object' ? (val.value ?? val.id ?? 'all') : (val || 'all');
                saveSelectedProgramId(programId);
                setSelectedSubjectId('all');
                setSelectedClassId('all');
                setSubjects([]);
              }}
              onSubjectChange={(val) => {
                setSelectedSubjectId(val);
                setSelectedClassId('');
              }}
              onClassChange={(val) => {
                debug('🔍 [DEBUG] onClassChange called with:', val, 'type:', typeof val);
                setSelectedClassId(val);
              }}
              showLabels={false}
              style={{ width: '100%' }}
            />
          </div>

          {/* Spacer to push controls to the right */}
          <div style={{ flex: '1', minWidth: '1rem' }} />

          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'var(--background-secondary, #f3f4f6)',
            padding: '0.25rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border, #e5e7eb)',
            flex: '0 0 auto'
          }}>
                <button
                  onClick={() => {
                  info('🔍 [DEBUG] Regular mode clicked', {
                    currentMode: attendanceMode,
                    newMode: ATTENDANCE_TYPE_CATEGORY.REGULAR,
                    constants: ATTENDANCE_TYPE_CATEGORY
                  });
                  setAttendanceMode(ATTENDANCE_TYPE_CATEGORY.REGULAR);
                }}
                  style={{
                    padding: '0.625rem',
                    background: attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? 'var(--color-primary, #3b82f6)' : 'transparent',
                    color: attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? 'white' : 'var(--text-muted, #6b7280)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px'
                  }}
                  title={t('attendance_mode') || 'Attendance'}
                >
                  {getThemedIcon('ui', 'check_circle', 16, attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? 'white' : theme)}
                </button>
                {canSeeStandupMode && (
                  <button
                    onClick={() => {
                    info('🔍 [DEBUG] Standup mode clicked', {
                      currentMode: attendanceMode,
                      newMode: ATTENDANCE_TYPE_CATEGORY.STANDUP,
                      constants: ATTENDANCE_TYPE_CATEGORY
                    });
                    setAttendanceMode(ATTENDANCE_TYPE_CATEGORY.STANDUP);
                    }}
                    style={{
                      padding: '0.625rem',
                      background: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'var(--color-primary, #3b82f6)' : 'transparent',
                      color: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'white' : 'var(--text-muted, #6b7280)',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px'
                    }}
                    title={t('standup_mode') || 'Standup'}
                  >
                    {getThemedIcon('ui', 'users', 16, attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'white' : theme)}
                  </button>
                )}
              </div>

              {/* Date picker */}
              <div style={{ width: '180px' }}>
                {!gridLoading && (selectedClassId || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && selectedProgramId)) && (
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    format="yyyy-MM-dd"
                    theme={theme}
                  />
                )}
                {gridLoading && (
                  <div style={{
                    height: '42px',
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

              {canExport && (
                <button
                    onClick={() => {
                      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
                        if (!selectedProgramId || selectedProgramId === 'all') {
                          showError(t('please_select_program') || 'Please select a program first');
                          return;
                        }
                      } else {
                        if (!selectedClassId || selectedClassId === 'all') {
                          showError(t('please_select_class') || 'Please select a class first');
                          return;
                        }
                      }
                      
                      // Check if there's any attendance for today's date before opening dialog
                      const hasAttendanceToday = students.some(student => student.attendance !== null && student.attendance !== undefined);
                      if (!hasAttendanceToday) {
                        setShowNoAttendanceModal(true);
                        return;
                      }
                      
                      setShowDailyReportModal(true);
                    }}
                    style={{
                      padding: '1rem 1.5rem',
                      background: isExporting ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
                      minWidth: '100px',
                      justifyContent: 'center',
                      opacity: isExporting ? 0.6 : 1
                    }}
                    disabled={gridLoading || isExporting || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all'))}
                  >
                    {getThemedIcon('ui', 'file', 16, 'white')}
                    {t('daily_report') || 'Daily'}
                  </button>
              )}

              {canExportSummary && (
                  <button
                    onClick={() => {
                      console.log('🔍 Summary Report button clicked');
                      
                      // Check if there's any attendance for today's date before opening dialog
                      const hasAttendanceToday = students.some(student => student.attendance !== null && student.attendance !== undefined);
                      if (!hasAttendanceToday) {
                        setShowNoAttendanceModal(true);
                        return;
                      }
                      
                      setShowSemesterReportConfirm(true);
                    }}
                    style={{
                      padding: '1rem 1.5rem',
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
                      minWidth: '100px',
                      justifyContent: 'center',
                      opacity: isExporting ? 0.6 : 1
                    }}
                    disabled={gridLoading || isExporting || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all'))}
                    title={t('export_summary_report') || 'Export comprehensive summary report'}
                  >
                    {getThemedIcon('ui', 'send', 16, 'white')}
                    {t('summary_report') || 'Summary'}
                  </button>
              )}

              {(isHR || isSuperAdmin) && (
                  <button
                    onClick={() => {
                      console.log('🔍 Attendance Violations button clicked');
                      
                      // Check if there's any attendance for today's date before opening dialog
                      const hasAttendanceToday = students.some(student => student.attendance !== null && student.attendance !== undefined);
                      if (!hasAttendanceToday) {
                        setShowNoAttendanceModal(true);
                        return;
                      }
                      
                      setShowAttendanceViolationsModal(true);
                    }}
                    style={{
                      padding: '1rem 1.5rem',
                      background: isExportingBehavioral ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: isExportingBehavioral ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)',
                      minWidth: '100px',
                      justifyContent: 'center',
                      opacity: isExportingBehavioral ? 0.6 : 1
                    }}
                    disabled={isExportingBehavioral || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all'))}
                  >
                    {getThemedIcon('ui', 'alert_triangle', 16, 'white')}
                    {t('attendance') || 'Attendance'}
                  </button>
              )}

              {canBulkScan && (
                <button
                  onClick={() => {
                    // In standup mode, allow bulk operations without class selection
                    if (attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (!selectedClassId || selectedClassId === 'all')) {
                      showError(t('please_select_class') || 'Please select a class first');
                      return;
                    }
                    setShowBulkScanDialog(true);
                  }}
                  disabled={attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all')}
                  style={{
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)',
                    minWidth: '100px',
                    justifyContent: 'center',
                    opacity: (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedClassId || selectedClassId === 'all')) ? 0.5 : 1
                  }}
                  title={t('bulk_scan_attendance') || 'Bulk scan attendance for multiple students'}
                >
                  {getThemedIcon('ui', 'users', 16, 'white')}
                  {t('bulk_scan') || 'Bulk Scan'}
                </button>
              )}
          </div>
      </header>

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
          width: isMobile ? '100%' : (isScannerMinimized || !showScanner ? '60px' : '20%'), // Fixed 25% width for QR scanner
          flexShrink: 0,
          transition: 'width 0.3s ease',
          overflow: 'hidden'
        }}>
          {(showScanner || (!showScanner && (selectedClassId || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && selectedProgramId)))) && (selectedClassId || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && selectedProgramId)) && selectedProgramId && selectedProgramId !== 'all' && (
            <QRScanner
              onScan={handleScan}
              classId={selectedClassId}
              onActivityUpdate={handleActivityUpdate}
              onDeleteActivity={handleDeleteActivity}
              selectedProgramId={selectedProgramId}
              selectedSubjectId={selectedSubjectId}
              selectedClassId={selectedClassId}
              attendanceMode={attendanceMode}
              selectedProgramName={(() => {
                const program = programs.find(p => p.id == selectedProgramId);
                // debug('Program lookup:', {
                //   selectedProgramId,
                //   totalPrograms: programs.length,
                //   found: !!program,
                //   programName: program?.nameEn || program?.name || program?.code || 'NOT_FOUND'
                // });
                return program?.nameEn || program?.name || program?.code || '';
              })()}
              selectedProgramNameAr={(() => {
                const program = programs.find(p => p.id == selectedProgramId);
                return program?.nameAr || program?.nameEn || program?.name || program?.code || '';
              })()}
              selectedSubjectName={(() => {
                const subject = subjects.find(s => s.id == selectedSubjectId);
                // debug('Subject lookup:', {
                //   selectedSubjectId,
                //   totalSubjects: subjects.length,
                //   found: !!subject,
                //   subjectName: subject?.nameEn || subject?.name || subject?.code || 'NOT_FOUND'
                // });
                return subject?.nameEn || subject?.name || subject?.code || '';
              })()}
              selectedSubjectNameAr={(() => {
                const subject = subjects.find(s => s.id == selectedSubjectId);
                return subject?.nameAr || subject?.nameEn || subject?.name || subject?.code || '';
              })()}
              selectedClassName={(() => {
                const cls = classes.find(c => c.id == selectedClassId);
                // debug('Class lookup:', {
                //   selectedClassId,
                //   totalClasses: classes.length,
                //   found: !!cls,
                //   className: cls?.nameEn || cls?.name || cls?.code || 'NOT_FOUND'
                // });
                return cls?.nameEn || cls?.name || cls?.code || '';
              })()}
              selectedClassNameAr={(() => {
                const cls = classes.find(c => c.id == selectedClassId);
                return cls?.nameAr || cls?.nameEn || cls?.name || cls?.code || '';
              })()}
              loading={false}
              students={students}
              onMinimizeChange={handleScannerMinimizeChange}
              forceMinimized={attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? isScannerMinimized : !showScanner} // Use isScannerMinimized in standup mode
            />
          )}
        </div>

        {/* Main Content */}
        <div style={{ 
          width: isMobile ? '100%' : (isScannerMinimized || !showScanner ? 'calc(100% - 60px)' : '75%'), // Fixed 75% width for roster
          transition: 'width 0.3s ease' // Smooth transition
        }}>
          {loading && <GlobalLoadingFallback />}
          
          {(!selectedClassId || selectedClassId === 'all') && attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP ? (
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
            <div style={{ width: '100%', overflowX: 'auto' }}>
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
              attendanceMode={attendanceMode}
              autoExpand={isScannerMinimized}
              showSuccess={showSuccess}
            />
            </div>
          )}
        </div>

        {/* Student Action Panel */}
        {selectedStudent && (
          <>
            {gridLoading && <GlobalLoadingFallback />}
            {/* 🔍 DEBUG: Log student data from roster before passing to panel */}
            {(() => {
              console.log('🔍 QRScannerPage - Student Data from Roster:', {
                source: 'student_roster',
                student: selectedStudent,
                keys: Object.keys(selectedStudent),
                hasAttendance: !!selectedStudent.attendance,
                hasParticipation: !!selectedStudent.participation,
                hasBehavior: !!selectedStudent.behavior,
                hasPenalty: !!selectedStudent.penalty,
                attendanceValue: selectedStudent.attendance,
                participationValue: selectedStudent.participation,
                behaviorValue: selectedStudent.behavior,
                penaltyValue: selectedStudent.penalty,
                hasBehaviorHistory: !!selectedStudent.behaviorHistory,
                hasParticipationHistory: !!selectedStudent.participationHistory,
                hasPenaltyHistory: !!selectedStudent.penaltyHistory,
                behaviorHistoryLength: selectedStudent.behaviorHistory?.length || 0,
                participationHistoryLength: selectedStudent.participationHistory?.length || 0,
                penaltyHistoryLength: selectedStudent.penaltyHistory?.length || 0
              });
              return null;
            })()}
            {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && canUseStatsPanel && (
              <StudentActionStatsPanel
                student={selectedStudent}
                onClose={handleClosePanel}
                onBehaviorSubmit={handleBehaviorSubmit}
                onMarkAttendance={handleMarkAttendance}
                behaviorTypes={showFavoritesOnly ? (activityTypeOptions['behavior-types'] || []).filter(b => favoriteBehaviors.includes(b.id)) : (activityTypeOptions['behavior-types'] || [])}
                participationTypes={showFavoritesOnly ? (activityTypeOptions['participation-types'] || []).filter(p => favoriteBehaviors.includes(p.id)) : (activityTypeOptions['participation-types'] || [])}
                showFavoritesOnly={showFavoritesOnly}
                onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
                attendanceMode={attendanceMode}
                favoriteBehaviors={favoriteBehaviors}
                programId={selectedProgramId}
                subjectId={selectedSubjectId}
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
            )}
          </>
        )}

        {/* Student Action Panel New */}
        {selectedStudentForAction && attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && canUseZapPanel && (
          <>
            <StudentActionZapPanel
              student={selectedStudentForAction}
              onClose={handleCloseActionPanel}
              onBehaviorSubmit={handleBehaviorSubmit}
              onParticipationSubmit={handleBehaviorSubmit}
              onPenaltySubmit={handleBehaviorSubmit}
              onMarkAttendance={handleMarkAttendance}
              attendanceMode={attendanceMode}
              classId={selectedClassId}
              programId={selectedProgramId}
              subjectId={selectedSubjectId}
              options={activityTypeOptions}
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
              onUpdate={() => {
                // Refresh students after marking attendance
                if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
                  loadStudents(null, selectedDate, selectedProgramId);
                } else {
                  loadStudents(selectedClassId, selectedDate);
                }
                triggerActivityRefresh();
              }}
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
          reportType={REPORT_TYPE_IDS.SUMMARY}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          selectedSubjectsForReport={selectedSubjectsForReport}
          setSelectedSubjectsForReport={setSelectedSubjectsForReport}
          subjects={subjects}
          selectedProgramId={selectedProgramId}
          programs={programs}
          attendanceMode={attendanceMode}
          selectedProgramsForReport={selectedProgramsForReport}
          setSelectedProgramsForReport={setSelectedProgramsForReport}
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
          showError={showError}
        />

        {/* Daily Report Export Modal */}
        <ReportExportModal
          isOpen={showDailyReportModal}
          onClose={() => setShowDailyReportModal(false)}
          reportType={REPORT_TYPE_IDS.DAILY}
          exportFormat={dailyExportFormat}
          setExportFormat={setDailyExportFormat}
          selectedSubjectsForReport={[]}
          setSelectedSubjectsForReport={() => {}}
          subjects={subjects}
          selectedProgramId={selectedProgramId}
          programs={programs}
          attendanceMode={attendanceMode}
          selectedProgramsForReport={[selectedProgramId]}
          setSelectedProgramsForReport={() => {}}
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
          showError={showError}
        />

        {/* Attendance Violations Export Modal */}
        <AttendanceViolationsModal
          isOpen={showAttendanceViolationsModal}
          onClose={() => setShowAttendanceViolationsModal(false)}
          subjects={subjects}
          selectedSubjects={selectedSubjectsForViolations}
          setSelectedSubjects={setSelectedSubjectsForViolations}
          selectedViolationTypes={selectedViolationTypes}
          setSelectedViolationTypes={setSelectedViolationTypes}
          onExport={handleExportAttendanceViolations}
          isExporting={isExportingBehavioral}
          t={t}
          theme={theme}
          lang={lang}
        />

        {/* No Attendance Warning Modal */}
        <ConfirmModal
          isOpen={showNoAttendanceModal}
          onClose={() => setShowNoAttendanceModal(false)}
          onConfirm={() => setShowNoAttendanceModal(false)}
          title={t('note') || 'Note'}
          message={lang === 'ar' 
            ? 'لا توجد سجلات حضور لهذا التاريخ. يرجى تسجيل الحضور أولاً.'
            : 'No attendance records found for this date. Please mark attendance first.'}
          confirmText={t('ok') || 'OK'}
          variant="primary"
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

        {/* BulkScanDialog */}
        <BulkScanProvider
          programId={selectedProgramId}
          subjectId={selectedSubjectId}
          classId={selectedClassId}
          markedBy={performedByFields.performedBy}
          performedBy={performedByFields.performedBy}
          performedByName={performedByFields.performedByName}
          performedByEmail={performedByFields.performedByEmail}
          attendanceMode={attendanceMode}
          onSuccess={handleBulkScanSuccess}
        >
          <BulkScanDialog
            key="bulk-scan-dialog-page"
            isOpen={showBulkScanDialog}
            onClose={() => setShowBulkScanDialog(false)}
            onModeChange={setAttendanceMode}
            programId={selectedProgramId}
            subjectId={selectedSubjectId}
            classId={selectedClassId}
            markedBy={performedByFields.performedBy}
            performedBy={performedByFields.performedBy}
            performedByName={performedByFields.performedByName}
            performedByEmail={performedByFields.performedByEmail}
            attendanceMode={attendanceMode}
            canEditAttendance={canEditAttendance}
            isSuperAdmin={isSuperAdmin}
            t={t}
            lang={lang}
            showSuccess={showSuccess}
            showError={showError}
          />
        </BulkScanProvider>
      </div>
    </div>
  );
}

export default () => (
  <ErrorBoundary>
    <QRScannerPage />
  </ErrorBoundary>
);
