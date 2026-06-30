import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { formatQatarDateOnly, getQatarNow } from '@utils/qatarDate';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { useQRPermissions } from '@hooks/useQRPermissions';
import { useMobileDetect } from '@hooks/useMobileDetect';
// OLD: import { PENALTY_TYPES } from '@constants/penaltyTypes';
// OLD: import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
// OLD: import { PARTICIPATION_TYPES } from '@constants/participationTypes';
// NOW: Using useLookupTypes hook for all lookup data
import { useNavigate } from 'react-router-dom';
import { getUsers } from '@services/business/userService';
import { getEnrollments, getEnrollmentsByProgram } from '@services/business/enrollmentService';
import { getClasses } from '@services/business/classService';
import { getPrograms, getSubjects } from '@services/business/programService';
// import { notificationGateway } from '@services/business/notificationGateway'; // Removed - notifications now handled by backend
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
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_TYPE_CATEGORY, getAttendanceIcon, getAttendanceColor, getAttendanceLabel, getLocalizedAttendanceLabel, STATUS_ID_MAP, DB_CODE_TO_FRONTEND_STATUS, getStatusCodeFromRecord } from '@constants/attendanceTypes';
import { calculateAttentionScore, getRowHighlightStyle } from '@utils/attendanceHighlight.js';
import { ABSENCE_THRESHOLDS } from '@/constants/absenceTypes';
import { getNoteTypeFromStatus, getLocalizedNoteText } from '@constants/noteTypes';
// import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes'; // Removed - notifications now handled by backend
import { exportDailyReport as exportDailyReportExcel, exportSummaryReport as exportSummaryReportExcel, exportAttendanceViolationsReport } from '@services/export/excelExportService.js';
import {
  prepareDailyOfficialData,
  prepareAttendanceOfficialData,
  exportDailyOfficialReport,
  exportAttendanceOfficialReport,
  EXPORT_FORMAT,
} from '@services/export/official-reports/index.jsx';
import { useToast } from '@ui/ToastProvider.jsx';
import ConfirmModal from '@ui/Modal/ConfirmModal.jsx';
import { addNotification } from '@services/business/notificationService';
import { sendStudentNotification } from '@services/business/notificationService';
// OLD: import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
// OLD: import { PARTICIPATION_TYPES } from '@constants/participationTypes';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { USER_ROLES } from '@constants/activityTypes';
import { Select, DatePicker, Button, Card, CardBody, ProgramsSelect } from '@ui';
import DeleteModal from '@ui/DeleteModal/DeleteModal';
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
import { RECORD_TYPES } from '@utils/sharedTypes';

const QRScannerPage = () => {
  const { user, loading: authLoading, isAdmin, isSuperAdmin, isHR, isInstructor, role } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const { activityTypeOptions } = useLookupTypes();
  const {
    canBulkScan,
    canManualInput,
    canClearToday,
    canDeleteAttendance,
    canEditAttendance,
    canExport,
    canExportSummary,
    canSeeStandupMode,
    canSeeQuickButtons,
    canMarkAttendance,
    canUseStatsPanel,
    canUseZapPanel
  } = useQRPermissions();
  const showSuccess = useMemo(() => (msg) => toast?.showSuccess?.(msg), [toast]);
  const showError = useMemo(() => (msg) => toast?.showError?.(msg), [toast]);
  const showInfo = useMemo(() => (msg) => toast?.showInfo?.(msg), [toast]);
  const { startLoading } = useGlobalLoading();
  const loadStudentsRef = useRef(null);
  const triggerActivityRefreshRef = useRef(null);

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
    // Restore saved date from localStorage, fallback to today (Qatar time)
    try {
      const saved = localStorage.getItem('qrScanner_selectedDate');
      if (saved && saved !== '') return saved;
    } catch {}
    const qatarNow = getQatarNow();
    return qatarNow.toISOString().split('T')[0]; // Format as yyyy-MM-dd
  });
  const [attendanceMode, setAttendanceMode] = useState(() => {
    // Restore saved attendance mode from localStorage
    try {
      const saved = localStorage.getItem('qrScanner_attendanceMode');
      if (saved === ATTENDANCE_TYPE_CATEGORY.STANDUP || saved === ATTENDANCE_TYPE_CATEGORY.REGULAR) return saved;
    } catch {}
    return ATTENDANCE_TYPE_CATEGORY.REGULAR;
  }); // 'regular' or 'standup'

  // Persist selectedDate to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qrScanner_selectedDate', selectedDate);
    } catch {}
  }, [selectedDate]);

  // Persist attendanceMode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qrScanner_attendanceMode', attendanceMode);
    } catch {}
  }, [attendanceMode]);

  // ── Guided Tour ────────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `qrScannerTourSeen_${lang}`;

  useEffect(() => {
    const steps = [
      { target: '[data-tour="qr-header-filters"]', content: t('tour.qr_header_filters'), disableBeacon: true, placement: 'bottom' },
    ];
    if (canSeeStandupMode) {
      steps.push({ target: '[data-tour="qr-mode-toggle"]', content: t('tour.qr_mode_toggle'), disableBeacon: true, placement: 'bottom' });
    }
    steps.push({ target: '[data-tour="qr-date-picker"]', content: t('tour.qr_date_picker'), disableBeacon: true, placement: 'bottom' });
    if (canExport) {
      steps.push({ target: '[data-tour="qr-daily-report"]', content: t('tour.qr_daily_report'), disableBeacon: true, placement: 'bottom' });
    }
    if (canExportSummary) {
      steps.push({ target: '[data-tour="qr-summary-report"]', content: t('tour.qr_summary_report'), disableBeacon: true, placement: 'bottom' });
    }
    if (isSuperAdmin || isHR) {
      steps.push({ target: '[data-tour="qr-violations-report"]', content: t('tour.qr_violations_report'), disableBeacon: true, placement: 'bottom' });
    }
    if (canBulkScan) {
      steps.push({ target: '[data-tour="qr-bulk-scan"]', content: t('tour.qr_bulk_scan'), disableBeacon: true, placement: 'bottom' });
    }
    steps.push({ target: '[data-tour="qr-scanner-panel"]', content: t('tour.qr_scanner_panel'), disableBeacon: true, placement: 'right' });
    steps.push({ target: '[data-tour="qr-roster"]', content: t('tour.qr_roster'), disableBeacon: true, placement: 'top' });
    if (canUseStatsPanel) {
      steps.push({ target: '[data-tour="qr-stats-panel"]', content: t('tour.qr_stats_panel'), disableBeacon: true, placement: 'left' });
    }
    if (canUseZapPanel) {
      steps.push({ target: '[data-tour="qr-zap-panel"]', content: t('tour.qr_zap_panel'), disableBeacon: true, placement: 'left' });
    }
    setTourSteps(steps);
  }, [lang, t, canSeeStandupMode, canExport, canExportSummary, isSuperAdmin, isHR, canBulkScan, canUseStatsPanel, canUseZapPanel]);

  useEffect(() => {
    const start = () => setRunTour(true);
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);

  useEffect(() => {
    try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {}
  }, [tourSeenKey]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);

  // ── Roster-specific Tour ────────────────────────────────────────────────────
  const [runRosterTour, setRunRosterTour] = useState(false);
  const rosterTourSeenKey = `qrRosterTourSeen_${lang}`;

  const [rosterTourSteps, setRosterTourSteps] = useState([]);

  useEffect(() => {
    const isStandup = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;
    const steps = [
      { target: '[data-tour="qr-roster"]', content: t('tour.qr_roster'), disableBeacon: true, placement: 'top' },
      { target: '[data-tour="roster-student-count"]', content: t('tour.roster_student_count') || 'Shows the total number of students in the selected class or program.', disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="roster-highlight-toggle"]', content: t('tour.roster_highlight_toggle') || 'Toggle row highlighting to visually flag students who need attention. Rows turn yellow (4-5 absences), orange (6-7 absences), or red (8+ absences) based on absence count.', disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="roster-favorite-toggle"]', content: t('tour.roster_favorite_toggle') || 'Bookmark students to filter and quickly access your favorites. Bookmarked students appear at the top of the roster. The badge shows how many students are bookmarked.', disableBeacon: true, placement: 'bottom' },
    ];
    if (canExport) {
      steps.push({ target: '[data-tour="roster-download"]', content: t('tour.roster_download') || 'Export the current roster data as a CSV file for offline use or reporting.', disableBeacon: true, placement: 'bottom' });
    }
    steps.push({ target: '[data-tour="roster-refresh"]', content: t('tour.roster_refresh') || 'Refresh the roster to pull the latest attendance and activity data from the server.', disableBeacon: true, placement: 'bottom' });

    if (isStandup) {
      steps.push({
        target: '[data-tour="qr-roster"] tbody tr:first-child',
        content: t('tour.roster_quick_actions_standup') || 'Each student row has quick action buttons for marking standup attendance (Present, Late, Absent, Clinic) and expanding to view full attendance history. Available actions depend on your permissions.',
        disableBeacon: true,
        placement: 'left',
      });
      steps.push({
        target: '[data-tour="roster-summary-counts"]',
        content: t('tour.roster_summary_counts_standup') || 'The footer row shows totals for Present, Late, Absent, and Clinic counts across all displayed students.',
        disableBeacon: true,
        placement: 'top',
      });
    } else {
      steps.push({
        target: '[data-tour="qr-roster"] tbody tr:first-child',
        content: t('tour.roster_quick_actions') || 'Each student row has quick action buttons for marking attendance (Present, Late, Absent) and expanding to view full history, penalties, participation, and behavior logs. Available actions depend on your permissions.',
        disableBeacon: true,
        placement: 'left',
      });
      steps.push({
        target: '[data-tour="roster-summary-counts"]',
        content: t('tour.roster_summary_counts') || 'The footer row shows totals for participation, behavior, penalties, and attendance counts across all displayed students.',
        disableBeacon: true,
        placement: 'top',
      });
      if (canUseStatsPanel) {
        steps.push({ target: '[data-tour="qr-stats-panel"]', content: t('tour.qr_stats_panel'), disableBeacon: true, placement: 'left' });
      }
      if (canUseZapPanel) {
        steps.push({ target: '[data-tour="qr-zap-panel"]', content: t('tour.qr_zap_panel'), disableBeacon: true, placement: 'left' });
      }
    }

    setRosterTourSteps(steps);
  }, [lang, t, attendanceMode, canExport, canUseStatsPanel, canUseZapPanel]);

  useEffect(() => {
    const startRosterTour = () => setRunRosterTour(true);
    window.addEventListener('app:roster-tour', startRosterTour);
    return () => window.removeEventListener('app:roster-tour', startRosterTour);
  }, []);

  const handleRosterTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunRosterTour(false);
      try { localStorage.setItem(rosterTourSeenKey, 'true'); } catch {}
    }
  }, [rosterTourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  // ── Bulk Scan Tour ──────────────────────────────────────────────────────────
  const [runBulkTour, setRunBulkTour] = useState(false);
  const bulkTourSeenKey = `qrBulkTourSeen_${lang}`;
  const [bulkTourSteps, setBulkTourSteps] = useState([]);

  useEffect(() => {
    const steps = [
      { target: '[data-tour="bulk-context"]', content: t('tour.bulk_context') || 'Shows the current attendance mode and selected program, class, and subject for the bulk operation.', disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="bulk-tabs"]', content: t('tour.bulk_tabs') || 'Choose Manual Input to paste student numbers, or Add All to load all students from the program or class.', disableBeacon: true, placement: 'bottom' },
    ];
    if (canManualInput) {
      steps.push({ target: '[data-tour="bulk-textarea"]', content: t('tour.bulk_textarea') || 'Paste student numbers here, one per line. Click Parse Input to validate them against the class roster.', disableBeacon: true, placement: 'right' });
    }
    steps.push({ target: '[data-tour="bulk-status-cards"]', content: t('tour.bulk_status_cards') || 'Select the attendance status to apply to all selected students.', disableBeacon: true, placement: 'top' });
    steps.push({ target: '[data-tour="bulk-date"]', content: t('tour.bulk_date') || 'Choose the date for the bulk attendance records.', disableBeacon: true, placement: 'top' });
    steps.push({ target: '[data-tour="bulk-footer"]', content: t('tour.bulk_footer') || 'Click Submit to mark attendance for all selected students. The count shows how many students will be processed.', disableBeacon: true, placement: 'top' });
    setBulkTourSteps(steps);
  }, [lang, t, canManualInput]);

  useEffect(() => {
    const startBulkTour = () => setRunBulkTour(true);
    window.addEventListener('app:bulk-tour', startBulkTour);
    return () => window.removeEventListener('app:bulk-tour', startBulkTour);
  }, []);

  const handleBulkTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunBulkTour(false);
      try { localStorage.setItem(bulkTourSeenKey, 'true'); } catch {}
    }
  }, [bulkTourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  // ── Activity List Tour ──────────────────────────────────────────────────────
  const [runActivityTour, setRunActivityTour] = useState(false);
  const activityTourSeenKey = `qrActivityTourSeen_${lang}`;
  const [activityTourSteps, setActivityTourSteps] = useState([]);

  useEffect(() => {
    const steps = [
      { target: '[data-tour="activity-list"]', content: t('tour.activity_list') || 'This is the Today\'s Activity list. It shows all attendance records, penalties, participation, and behavior logs for the selected date in real-time.', disableBeacon: true, placement: 'right' },
    ];
    if (canSeeQuickButtons && canMarkAttendance) {
      steps.push({ target: '[data-tour="activity-quick-actions"]', content: t('tour.activity_quick_actions') || 'Quick action buttons appear on attendance records for fast status changes. Click to mark Present, Late, or Absent without expanding the row.', disableBeacon: true, placement: 'left' });
    }
    if (canDeleteAttendance) {
      steps.push({ target: '[data-tour="activity-delete"]', content: t('tour.activity_delete') || 'Click the delete icon to remove an individual activity record. This action cannot be undone.', disableBeacon: true, placement: 'left' });
    }
    steps.push({ target: '[data-tour="activity-list"]', content: t('tour.activity_expand') || 'Click any row or the chevron icon to expand and see details: timestamp, subject, program, class, who performed the action, and notes.', disableBeacon: true, placement: 'right' });
    setActivityTourSteps(steps);
  }, [lang, t, canSeeQuickButtons, canMarkAttendance, canDeleteAttendance]);

  useEffect(() => {
    const startActivityTour = () => setRunActivityTour(true);
    window.addEventListener('app:activity-tour', startActivityTour);
    return () => window.removeEventListener('app:activity-tour', startActivityTour);
  }, []);

  const handleActivityTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunActivityTour(false);
      try { localStorage.setItem(activityTourSeenKey, 'true'); } catch {}
    }
  }, [activityTourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  const [highlightEnabled, setHighlightEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('qrScanner_highlightEnabled');
      return saved !== null ? JSON.parse(saved) : true; // Default on
    } catch {
      return true;
    }
  });

  // Persist highlight preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qrScanner_highlightEnabled', JSON.stringify(highlightEnabled));
    } catch (error) {
      console.error('Failed to save highlight preference:', error);
    }
  }, [highlightEnabled]);

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
  const { isMobile } = useMobileDetect();
  const [isScannerMinimized, setIsScannerMinimized] = useState(true); // Minimized by default for wider roster
  
  // Report export modal state (unified for both daily and summary)
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [showDailyOfficialModal, setShowDailyOfficialModal] = useState(false);
  const [dailyOfficialExportFormat, setDailyOfficialExportFormat] = useState(EXPORT_FORMAT.PDF);
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
  const [violationsModalMode, setViolationsModalMode] = useState('standard');
  const [violationsDateFrom, setViolationsDateFrom] = useState('');
  const [violationsDateTo, setViolationsDateTo] = useState('');
  const [violationsExportFormat, setViolationsExportFormat] = useState(EXPORT_FORMAT.PDF);
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

  const getDefaultViolationsDateRange = useCallback((anchorDate) => {
    const to = anchorDate || formatQatarDateOnly(getQatarNow());
    const fromDate = new Date(`${to}T12:00:00`);
    fromDate.setDate(fromDate.getDate() - 30);
    const from = fromDate.toISOString().split('T')[0];
    return { from, to };
  }, []);

  const openViolationsModal = useCallback((mode) => {
    const { from, to } = getDefaultViolationsDateRange(selectedDate);
    setViolationsDateFrom(from);
    setViolationsDateTo(to);
    setViolationsModalMode(mode);
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      setSelectedSubjectsForViolations([selectedSubjectId]);
    }
    setShowAttendanceViolationsModal(true);
  }, [getDefaultViolationsDateRange, selectedDate, selectedSubjectId]);

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
      setActivityRefresh(() => refreshFunction);
      refreshFunction();
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
    // Refresh activities immediately
    if (triggerActivityRefreshRef.current) triggerActivityRefreshRef.current();
    // Delay loadStudents to ensure backend has committed the bulk transaction
    setTimeout(() => {
      const fn = loadStudentsRef.current;
      if (fn) {
        if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
          fn(selectedClassId === 'all' ? null : selectedClassId, selectedDate, selectedProgramId);
        } else {
          fn(selectedClassId === 'all' ? null : selectedClassId, selectedDate);
        }
      }
      // Refresh activities again after roster reload
      if (triggerActivityRefreshRef.current) triggerActivityRefreshRef.current();
    }, 500);
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
          eventBus.emit(EVENTS.ATTENDANCE_MARKED, { studentId: activityToDelete.studentId, classId: selectedClassId });
          eventBus.emit(EVENTS.ATTENDANCE_DELETED);
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
        // Delay loadStudents to ensure backend has committed the deletion
        setTimeout(() => {
          if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
            loadStudents(selectedClassId === 'all' ? null : selectedClassId, selectedDate, selectedProgramId);
          } else {
            loadStudents(selectedClassId === 'all' ? null : selectedClassId, selectedDate);
          }
        }, 500);
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

  // Keep ref in sync so callbacks defined before triggerActivityRefresh can use it
  useEffect(() => { triggerActivityRefreshRef.current = triggerActivityRefresh; }, [triggerActivityRefresh]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
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
          getPenalties({ limit: 1000 }), // No class filter for standup mode
          getParticipations({ limit: 1000 }), // No class filter for standup mode
          getBehaviors({ limit: 1000 }) // No class filter for standup mode
        ]);
      } else {
        // In regular mode, use class-based queries
        [enrollmentsResponse, usersResponse, penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
          getEnrollments({ classId }),
          getUsers(),
          getPenalties({ classId, limit: 1000 }),
          getParticipations({ classId, limit: 1000 }),
          getBehaviors({ classId, limit: 1000 })
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
        
        // Use shared STATUS_ID_MAP for standup status IDs
        attendance = attendanceArrays.flat().map(a => {
          // Use getStatusCodeFromRecord to normalize DB codes to frontend codes
          const frontendCode = getStatusCodeFromRecord(a);
          
          return {
            ...a,
            status: frontendCode,
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
        attendance = (attendanceResponse.success ? attendanceResponse.data : []).map(a => {
          // Use getStatusCodeFromRecord to normalize DB codes to frontend codes
          const frontendCode = getStatusCodeFromRecord(a);
          return {
            ...a,
            status: frontendCode ? frontendCode.toLowerCase() : null,
            studentId: a.studentId ?? a.userId
          };
        }).filter(a => {
          // Filter out standup attendance entries in regular mode
          if (a.status && a.status.startsWith('standup_')) return false;
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
      const standup = (standupResponse.success ? standupResponse.data : []).map(s => {
        const frontendCode = getStatusCodeFromRecord(s);
        const statusStr = frontendCode || (typeof s.status === 'object' ? s.status?.code : s.status) || '';
        const lowerStatus = statusStr.toLowerCase();
        return {
          ...s,
          status: lowerStatus.startsWith('standup_') ? lowerStatus : `standup_${lowerStatus}`,
          studentId: s.userId || s.studentId
        };
      });

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
        const sid = p.studentId ?? p.userId;
        if (studentIdSet.has(sid)) {
          const existing = penaltyMap.get(sid) || [];
          existing.push(p);
          penaltyMap.set(sid, existing);
        }
      });
      setPenaltyRecords(Array.from(penaltyMap.values()).flat());

      // Create participation/behavior maps for O(1) lookup
      const participationMap = new Map();
      allParticipations.forEach(p => {
        const sid = p.studentId ?? p.userId;
        if (studentIdSet.has(sid)) {
          const existing = participationMap.get(sid) || [];
          existing.push(p);
          participationMap.set(sid, existing);
        }
      });

      const behaviorMap = new Map();
      allBehaviors.forEach(b => {
        const sid = b.studentId ?? b.userId;
        if (studentIdSet.has(sid)) {
          const existing = behaviorMap.get(sid) || [];
          existing.push(b);
          behaviorMap.set(sid, existing);
        }
      });

      // Process students in parallel batches for better performance
      const BATCH_SIZE = 10;
      const studentsWithData = [];
      
      for (let i = 0; i < studentUsers.length; i += BATCH_SIZE) {
        const batch = studentUsers.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(async (student) => {
          const studentId = student.id;
          
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
            studentName: getLocalizedUserName(student, lang, student.email),
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
          // Normalizes DB status codes back to frontend canonical codes
          const mapAttendanceStatus = (status) => {
            if (!status) return ATTENDANCE_STATUS.ABSENT_NO_EXCUSE;
            // If status is an object (from API include), extract the code
            const rawCode = typeof status === 'object' ? (status?.code ?? null) : status;
            if (!rawCode) return ATTENDANCE_STATUS.ABSENT_NO_EXCUSE;
            const upper = rawCode.toUpperCase();
            // Map DB codes back to frontend codes (e.g. ABSENT → ABSENT_NO_EXCUSE)
            const frontendCode = DB_CODE_TO_FRONTEND_STATUS[upper] || upper;
            return frontendCode.toLowerCase();
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
          
          // Use shared STATUS_ID_MAP for standup status IDs
          const todayStandupStatus = todayStandupAttendanceRecord?.statusId 
            ? STATUS_ID_MAP[todayStandupAttendanceRecord.statusId] || null
            : (todayStandupAttendanceRecord?.status?.toUpperCase() || null);

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
          const studentAttendanceRecords = (studentAttendanceResponse.success ? studentAttendanceResponse.data : []).map(r => {
            const frontendCode = getStatusCodeFromRecord(r);
            return {
              ...r,
              status: frontendCode ? frontendCode.toLowerCase() : null,
              studentId: r.studentId ?? r.userId
            };
          });
          
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
            userId: studentId,
            studentId: student.studentId || studentId,
            studentNumber: student.studentNumber,
            displayName: student.displayName,
            displayNameAr: student.displayNameAr,
            firstNameAr: student.firstNameAr,
            lastNameAr: student.lastNameAr,
            realName: student.realName,
            name: student.displayName || student.realName || student.name || student.email,
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
            studentName: getLocalizedUserName(student, lang, student.email),
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
            studentName: getLocalizedUserName(student, lang, student.email),
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
  }, [attendanceMode, lang]);

  // Keep ref in sync so callbacks defined before loadStudents can use it
  useEffect(() => { loadStudentsRef.current = loadStudents; }, [loadStudents]);

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

  // Auto-trigger roster tour when students first appear (if not seen before)
  useEffect(() => {
    if (students.length > 0) {
      try {
        if (!localStorage.getItem(rosterTourSeenKey)) {
          setTimeout(() => setRunRosterTour(true), 800);
        }
      } catch {}
    }
  }, [students.length, rosterTourSeenKey]);

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
    let refreshTimer = null;
    const unsubscribe = eventBus.on(EVENTS.ATTENDANCE_MARKED, (data) => {
      // Optimistic update: immediately update student's attendance status in local state
      if (data.studentId && data.status) {
        setStudents(prev => prev.map(s => {
          if (s.id !== data.studentId) return s;
          if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
            const upperStatus = data.status.toUpperCase();
            const standupStatus = upperStatus.startsWith('STANDUP_') ? upperStatus : (
              { PRESENT: 'STANDUP_PRESENT', LATE: 'STANDUP_LATE', ABSENT: 'STANDUP_ABSENT', ABSENT_NO_EXCUSE: 'STANDUP_ABSENT', ABSENT_WITH_EXCUSE: 'STANDUP_ABSENT', HUMAN_CASE: 'STANDUP_CLINIC', EXCUSED_LEAVE: 'STANDUP_CLINIC' }[upperStatus] || upperStatus
            );
            return { ...s, standupStatus };
          }
          return { ...s, attendance: data.status };
        }));
      }

      // Debounce rapid events and delay to ensure backend commit
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        // In standup mode, refresh by program; in regular mode, refresh by class
        if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
          debug('🔄 Attendance marked event received in standup mode, refreshing students for program:', selectedProgramId);
          loadStudents(null, selectedDate, selectedProgramId);
        } else if (data.classId == selectedClassId) {
          debug('🔄 Attendance marked event received, refreshing students for class:', selectedClassId);
          loadStudents(selectedClassId, selectedDate);
        }
      }, 500);
    });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
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

      if (subjectId && subjectId !== 'all') {
        filteredClasses = filteredClasses.filter((c) => c.subjectId == subjectId);
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
      const result = await markAttendance({
        userId: studentId,
        classId: attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? selectedClassId : undefined,
        date: dateStr,
        status: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? status.toUpperCase() : status,
        notes: notes || getNoteTypeFromStatus(status, 'quick'),
        user: user,
        programId: programId,
        subjectId: subjectId
      }, user, attendanceMode);

      if (!result.success) {
        error('Failed to mark attendance:', result.error);
        return result;
      }

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

      return { success: true };
    } catch (err) {
      error('Error marking attendance:', err);
      return { success: false, error: err.message };
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

  // Sync selectedStudent/selectedStudentForAction with updated students array
  // so panels receive fresh data after attendance/behavior changes
  useEffect(() => {
    if (selectedStudent) {
      const updated = students.find(s => s.id === selectedStudent.id);
      if (updated && updated !== selectedStudent) {
        setSelectedStudent(updated);
      }
    }
    if (selectedStudentForAction) {
      const updated = students.find(s => s.id === selectedStudentForAction.id);
      if (updated && updated !== selectedStudentForAction) {
        setSelectedStudentForAction(updated);
      }
    }
  }, [students]);

  // Listen for attendance updates to refresh students
  useEffect(() => {
    const unsubscribeAttendanceDeleted = eventBus.on(EVENTS.ATTENDANCE_DELETED, () => {
      // Refresh students when attendance is deleted
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        loadStudents(null, selectedDate, selectedProgramId);
      } else if (selectedClassId && selectedDate) {
        loadStudents(selectedClassId, selectedDate);
      }
    });

    return () => {
      unsubscribeAttendanceDeleted();
    };
  }, [selectedClassId, selectedDate, selectedProgramId, attendanceMode, loadStudents]);

  const handleBehaviorSubmit = useCallback(async (studentId, actions, note, pointsOverride = {}) => {
    try {
      // Get performedBy fields using shared service
      const performedByFields = await getPerformedByFields(user);
      
      // Handle participation
      const participationActions = actions.filter(a =>
        (activityTypeOptions['participation-types'] || []).some(pt => pt.id === a.id)
      );

      // Handle behavior
      const behaviorActions = actions.filter(a =>
        (activityTypeOptions['behavior-types'] || []).some(bt => bt.id === a.id)
      );

      // Handle penalties
      const penaltyActions = actions.filter(a => a.points < 0);

      // Save to backend
      for (const action of actions) {
        const points = pointsOverride[action.id] !== undefined
          ? pointsOverride[action.id]
          : action.points;

        if (action.category === RECORD_TYPES.PENALTY) {
          // Add penalty (only for actions with category 'penalty')
          const penaltyResult = await createPenalty({
            studentId,
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            type: action.id,
            points: Math.abs(points), // Store as positive
            reason: note,
            createdBy: user.uid,
            ...performedByFields,
            date: selectedDate,
            sendNotification: sendNotifications,
            className: classes.find(c => c.id == selectedClassId)?.name || '' // Use == for type coercion
          });
          if (!penaltyResult || !penaltyResult.success) {
            throw new Error(penaltyResult?.error || 'Failed to create penalty record');
          }
        } else if (action.category === RECORD_TYPES.BEHAVIOR || action.category === RECORD_TYPES.PARTICIPATION) {
          if (action.category === RECORD_TYPES.BEHAVIOR) {
            const behaviorResult = await createBehavior({
              classId: selectedClassId,
              studentId,
              subjectId: selectedSubjectId,
              type: action.id,
              points: points,
              description: note,
              createdBy: user.uid,
              ...performedByFields,
              date: selectedDate,
              sendNotification: sendNotifications,
              className: classes.find(c => c.id == selectedClassId)?.name || '' // Use == for type coercion
            });
            if (!behaviorResult || !behaviorResult.success) {
              throw new Error(behaviorResult?.error || 'Failed to create behavior record');
            }
          } else {
            const participationResult = await createParticipation({
              classId: selectedClassId,
              studentId,
              subjectId: selectedSubjectId,
              type: action.id,
              points: points,
              description: note,
              createdBy: user.uid,
              ...performedByFields,
              date: selectedDate,
              sendNotification: sendNotifications,
              className: classes.find(c => c.id == selectedClassId)?.name || '' // Use == for type coercion
            });
            if (!participationResult || !participationResult.success) {
              throw new Error(participationResult?.error || 'Failed to create participation record');
            }
          }
        } else {
          // Unknown action category
        }
      }

      // Reload students after cache is cleared; small delay ensures DB commit is complete
      setTimeout(async () => {
        await loadStudents(selectedClassId, selectedDate);
        
        // Trigger activity refresh to update recent activity
        triggerActivityRefresh();
      }, 300);

      // Emit events for each action type
      participationActions.forEach(action => {
        eventBus.emit(EVENTS.PARTICIPATION_ADDED, {
          studentId,
          actionType: action.id,
          points: pointsOverride[action.id] || action.points,
          performedBy: user,
          timestamp: new Date()
        });
      });

      behaviorActions.forEach(action => {
        eventBus.emit(EVENTS.BEHAVIOR_LOGGED, {
          studentId,
          actionType: action.id,
          points: pointsOverride[action.id] || action.points,
          note,
          performedBy: user,
          timestamp: new Date()
        });
      });

      penaltyActions.forEach(action => {
        eventBus.emit(EVENTS.PENALTY_ASSIGNED, {
          studentId,
          actionType: action.id,
          points: pointsOverride[action.id] || action.points,
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
            const points = pointsOverride[action.id] !== undefined
              ? pointsOverride[action.id]
              : action.points;

            let type = 'info';
            let templateId = '';
            let title = '';

            if (points < 0) {
              type = RECORD_TYPES.PENALTY;
              templateId = 'penalty_assigned_default';
              title = t('delete_penalty_title');
            } else if ((activityTypeOptions['participation-types'] || []).some(pt => pt.id === action.id)) {
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
      const dateStr = selectedDate || new Date().toISOString().split('T')[0];

      const downloadCsv = (csvContent, filename) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Standup mode: mimic grid columns — ID, Name, STANDUP, Present, Late, Absent, Clinic
        const currentProgram = programs.find(p => p.id == selectedProgramId);
        const programName = currentProgram?.nameEn || currentProgram?.name || currentProgram?.code || 'Program';

        const headers = [
          t('student_number') || 'Student No.',
          t('id') || 'ID',
          t('student') || 'Student',
          t('standup') || 'STANDUP',
          t('not_marked') || 'Not Marked',
          t('present') || 'Present',
          t('late') || 'Late',
          t('absent') || 'Absent',
          t('clinic') || 'Clinic'
        ];

        const counts = { present: 0, late: 0, absent: 0, clinic: 0, notMarked: 0 };
        const rows = students.map(student => {
          const status = student.standupStatus;
          let statusLabel = t('not_marked') || 'Not Marked';
          let isNotMarked = 1;
          if (status) {
            const upperStatus = status.toUpperCase();
            if (upperStatus === ATTENDANCE_STATUS.STANDUP_PRESENT) { counts.present++; statusLabel = t('present') || 'Present'; isNotMarked = 0; }
            else if (upperStatus === ATTENDANCE_STATUS.STANDUP_LATE) { counts.late++; statusLabel = t('late') || 'Late'; isNotMarked = 0; }
            else if (upperStatus === ATTENDANCE_STATUS.STANDUP_ABSENT) { counts.absent++; statusLabel = t('absent') || 'Absent'; isNotMarked = 0; }
            else if (upperStatus === ATTENDANCE_STATUS.STANDUP_CLINIC) { counts.clinic++; statusLabel = t('clinic') || 'Clinic'; isNotMarked = 0; }
            else { statusLabel = getLocalizedAttendanceLabel(status, lang); isNotMarked = 0; }
          } else {
            counts.notMarked++;
          }
          const standupStats = student.standupStats || {};
          return [
            student.studentNumber || '—',
            student.id,
            `"${student.name || 'Unknown'}"`,
            statusLabel,
            isNotMarked,
            standupStats.present || 0,
            standupStats.late || 0,
            standupStats.absent || 0,
            standupStats.clinic || 0
          ].join(',');
        });

        // Summary row: total students under Name, today's counts under each status column
        const summaryRow = [
          '',
          '',
          `"${t('total') || 'Total'}: ${students.length}"`,
          '',
          counts.notMarked,
          counts.present,
          counts.late,
          counts.absent,
          counts.clinic
        ].join(',');

        const csvContent = [headers.join(','), ...rows, '', summaryRow].join('\r\n');
        downloadCsv(csvContent, `${dateStr}_standup_${programName}.csv`);
        debug('Standup CSV downloaded successfully');
        return;
      }

      // Regular mode: mimic grid columns — ID, Name, TODAY, Not Marked, Participation, Behavior, Penalty, Present, Late, Absent, Absent Excused, Excused Leave, Human
      const currentClass = classes.find(c => c.id == selectedClassId);
      const currentSubject = subjects.find(s => s.id == selectedSubjectId);
      const className = currentClass?.name || currentClass?.code || 'Class';
      const subjectName = currentSubject?.name || currentSubject?.code || 'Subject';

      const headers = [
        t('student_number') || 'Student No.',
        t('id') || 'ID',
        t('student') || 'Student',
        t('todays_attendance') || 'TODAY',
        t('not_marked') || 'Not Marked',
        t('part') || 'Participation',
        t('behavior') || 'Behavior',
        t('penalties') || 'Penalty',
        t('present') || 'Present',
        t('late') || 'Late',
        t('absent') || 'Absent',
        t('absent_excused') || 'Absent Excused',
        t('excused_leave') || 'Excused Leave',
        t('human') || 'Human'
      ];

      const sums = { participation: 0, behavior: 0, penalty: 0, present: 0, late: 0, absent: 0, absentExcused: 0, excusedLeave: 0, human: 0, notMarked: 0 };
      const rows = students.map(student => {
        const stats = student.attendanceStats || {};
        sums.participation += student.participation || 0;
        sums.behavior += student.behavior || 0;
        sums.penalty += student.penalty || 0;
        sums.present += stats.present || 0;
        sums.late += stats.late || 0;
        sums.absent += stats.absent || 0;
        sums.absentExcused += stats.absentWithExcuse || 0;
        sums.excusedLeave += stats.excusedLeave || 0;
        sums.human += stats.humanitarianCase || 0;

        const isNotMarked = student.attendance ? 0 : 1;
        const todayLabel = student.attendance ? getLocalizedAttendanceLabel(student.attendance, lang) : (t('not_marked') || 'Not Marked');
        if (!student.attendance) sums.notMarked++;

        return [
          student.studentNumber || '—',
          student.id,
          `"${student.name || 'Unknown'}"`,
          todayLabel,
          isNotMarked,
          student.participation || 0,
          student.behavior || 0,
          student.penalty || 0,
          stats.present || 0,
          stats.late || 0,
          stats.absent || 0,
          stats.absentWithExcuse || 0,
          stats.excusedLeave || 0,
          stats.humanitarianCase || 0
        ].join(',');
      });

      const summaryRow = [
        '',
        '',
        `"${t('total') || 'Total'}: ${students.length}"`,
        '',
        sums.notMarked,
        sums.participation,
        sums.behavior,
        sums.penalty,
        sums.present,
        sums.late,
        sums.absent,
        sums.absentExcused,
        sums.excusedLeave,
        sums.human
      ].join(',');

      const csvContent = [headers.join(','), ...rows, '', summaryRow].join('\r\n');
      downloadCsv(csvContent, `${dateStr}_attendance_${className}_${subjectName}.csv`);
      debug('Attendance CSV downloaded successfully');
    } catch (err) {
      error('Error downloading CSV:', err);
      alert(t('failed_to_download_csv') || 'Failed to download CSV. Please try again.');
    }
  }, [students, classes, subjects, programs, selectedClassId, selectedSubjectId, selectedProgramId, selectedDate, t, lang, attendanceMode]);

  const handleRefresh = useCallback(() => {
    // Reload students data
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && selectedProgramId && selectedProgramId !== 'all') {
      // In standup mode, always reload by program
      loadStudents(null, selectedDate, selectedProgramId);
    } else if (selectedClassId && selectedClassId !== 'all') {
      loadStudents(selectedClassId, selectedDate);
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
          status: getStatusCodeFromRecord(a),
          studentId: a.userId ?? a.studentId
        }));
      } else {
        // Regular mode: fetch by class
        // Use ISO date format for proper date filtering
        attendanceResponse = await getAttendanceByClass(selectedClassId, { date: selectedDate });
        attendanceData = (attendanceResponse.success ? attendanceResponse.data : []).map(a => ({
          ...a,
          status: getStatusCodeFromRecord(a),
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
          studentNumber: student?.studentNumber || student?.uid || record.user?.studentNumber || record.user?.uid || record.studentNumber || '',
          studentName: student?.displayName || student?.realName || record.user?.displayName || record.user?.firstName + ' ' + record.user?.lastName || '',
          studentNameAr: student?.displayNameAr || student?.firstNameAr || record.user?.displayNameAr || record.user?.firstNameAr || '',
          status: record.status || 'present',
          date: record.date || formatQatarDateOnly(selectedDate),
          time: safeFormatDate(record.timestamp || record.createdAt || record.updatedAt, (date) => date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Qatar'
          })),
          method: record.method || 'manual',
          notes: record.notes || '',
          markedBy: record.performedByName || record.markedByName || (record.creator ? getLocalizedUserName(record.creator, lang) : '') || (record.createdBy ? (allUsers.find(u => String(u.id) === String(record.createdBy)) ? getLocalizedUserName(allUsers.find(u => String(u.id) === String(record.createdBy)), lang) : '') : '') || '',
          timestamp: safeFormatDate(record.timestamp || record.createdAt || record.updatedAt, (date) => date.toLocaleString('en-US'))
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
        // Standup mode: use standup-specific columns
        headers = lang === 'ar' ? [
          t('serial') || 'ت',
          t('student_number') || 'رقم الطالب',
          t('id') || 'ID',
          t('student_name') || 'اسم الطالب',
          t('present') || 'حاضر',
          t('late') || 'متأخر',
          t('absent') || 'غائب',
          t('clinic') || 'عيادة',
          t('not_marked') || 'غير مسجل',
          t('date') || 'التاريخ',
          t('time') || 'الوقت',
          t('method') || 'الطريقة',
          t('marked_by') || 'سجل بواسطة',
          t('notes') || 'ملاحظات'
        ] : [
          t('serial') || 'Serial',
          t('student_number') || 'Student Number',
          t('id') || 'ID',
          t('student_name') || 'Student Name',
          t('present') || 'Present',
          t('late') || 'Late',
          t('absent') || 'Absent',
          t('clinic') || 'Clinic',
          t('not_marked') || 'Not Marked',
          t('date') || 'Date',
          t('time') || 'Time',
          t('method') || 'Method',
          t('marked_by') || 'Marked by',
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
                timeStr = timestampDate.toLocaleTimeString('en-US', {
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
          const student = allUsers.find(u => String(u.id) === String(row.studentId));
          const displayName = getLocalizedUserName(student, lang, row.studentName);
          const isNotMarked = !status || status === 'NOT_MARKED' || status === 'NULL' ? 1 : '';
          return [
            index + 1,
            row.studentNumber,
            row.studentId,
            displayName,
            status === ATTENDANCE_STATUS.STANDUP_PRESENT ? 'X' : '',
            status === ATTENDANCE_STATUS.STANDUP_LATE ? 'X' : '',
            status === ATTENDANCE_STATUS.STANDUP_ABSENT ? 'X' : '',
            status === ATTENDANCE_STATUS.STANDUP_CLINIC ? 'X' : '',
            isNotMarked,
            dateStr,
            timeStr,
            getAttendanceMethodLabel(row.method, t, lang),
            row.markedBy,
            row.notes
          ];
        });

        // Add summary totals row
        const presentCount = excelData.filter(r => r[4] === 'X').length;
        const lateCount = excelData.filter(r => r[5] === 'X').length;
        const absentCount = excelData.filter(r => r[6] === 'X').length;
        const clinicCount = excelData.filter(r => r[7] === 'X').length;
        const notMarkedCount = excelData.filter(r => r[8] === 1).length;
        const summaryLabel = lang === 'ar' ? (t('total_count') || 'الإجمالي') : (t('total_count') || 'Total');
        excelData.push([
          summaryLabel,
          '',
          '',
          '',
          presentCount,
          lateCount,
          absentCount,
          clinicCount,
          notMarkedCount,
          '',
          '',
          '',
          '',
          ''
        ]);
      } else {
        // Regular mode: use all attendance type columns (excluding standup types)
        const attendanceTypesArray = Object.entries(ATTENDANCE_STATUS)
          .filter(([key, value]) => !key.startsWith('STANDUP_'))
          .map(([key, value]) => ({
          id: value,
          label_en: getLocalizedAttendanceLabel(value, 'en') || value,
          label_ar: getLocalizedAttendanceLabel(value, 'ar') || value
        }));
        
        headers = lang === 'ar' ? [
          t('serial') || 'ت',
          t('student_number'),
          t('id') || 'ID',
          t('student_name'),
          ...attendanceTypesArray.map(type => type.label_ar),
          t('date') || 'التاريخ',
          t('time') || 'الوقت',
          t('method'),
          t('marked_by') || 'سجل بواسطة',
          t('notes')
        ] : [
          t('serial') || 'Serial',
          t('student_number'),
          t('id') || 'ID',
          t('student_name'),
          ...attendanceTypesArray.map(type => type.label_en),
          t('date') || 'Date',
          t('time') || 'Time',
          t('method'),
          t('marked_by') || 'Marked by',
          t('notes')
        ];
        
        excelData = enrichedData.map((row, index) => {
          const dateStr = row.date ? row.date.split('T')[0] : '';
          let timeStr = row.time || '';
          if (!timeStr && row.timestamp) {
            try {
              const timestampDate = new Date(row.timestamp);
              if (!isNaN(timestampDate.getTime())) {
                timeStr = timestampDate.toLocaleTimeString('en-US', {
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
          const student = allUsers.find(u => String(u.id) === String(row.studentId));
          const displayName = getLocalizedUserName(student, lang, row.studentName);
          return [
            index + 1,
            row.studentNumber,
            row.studentId,
            displayName,
            ...attendanceTypesArray.map(type => row.status === type.id ? 'X' : ''),
            dateStr,
            timeStr,
            getAttendanceMethodLabel(row.method, t, lang),
            row.markedBy,
            row.notes
          ];
        });

        // Add summary totals row for regular mode
        const attendanceTypesArrayForTotals = Object.entries(ATTENDANCE_STATUS)
          .filter(([key]) => !key.startsWith('STANDUP_'))
          .map(([, value]) => value);
        const totalsLabel = lang === 'ar' ? (t('total_count') || 'الإجمالي') : (t('total_count') || 'TOTAL');
        const totalsRow = [totalsLabel, '', '', ''];
        attendanceTypesArrayForTotals.forEach(statusCode => {
          totalsRow.push(enrichedData.filter(r => r.status === statusCode).length);
        });
        totalsRow.push('', '', '', '', ''); // date, time, method, marked_by, notes
        excelData.push(totalsRow);
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
      
      const programName = currentProgram ? (lang === 'ar' ? (currentProgram.nameAr || currentProgram.nameEn || currentProgram.name) : (currentProgram.nameEn || currentProgram.name)) : (t('all_programs') || 'All');
      const subjectName = currentSubject ? (lang === 'ar' ? (currentSubject.nameAr || currentSubject.nameEn || currentSubject.name) : (currentSubject.nameEn || currentSubject.name)) : (t('all_subjects') || 'All');
      const className = currentClass ? (lang === 'ar' ? (currentClass.nameAr || currentClass.nameEn || currentClass.name) : (currentClass.nameEn || currentClass.name)) : (t('all_classes') || 'All');
      
      console.log('🔍 Export Debug - Final Names:', {
        programName,
        subjectName,
        className
      });
      
      // Format date as YYYY-MM-DD
      const dateFormatted = new Date(selectedDate).toISOString().split('T')[0];
      
      // Derive semester from date (Jan-Jun = S1, Jul-Dec = S2)
      const [yearStr, monthStr] = dateFormatted.split('-');
      const semester = parseInt(monthStr) <= 6 ? 'S1' : 'S2';
      const yearSemester = `${yearStr}_${semester}`;
      
      // Create filename based on language with safety checks
      const sanitize = (str) => str ? str.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '';
      const safeProgramName = sanitize(programName) || 'UnknownProgram';
      const safeSubjectName = sanitize(subjectName) || 'UnknownSubject';
      const safeClassName = sanitize(className) || 'UnknownClass';
      
      const isStandup = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;
      const filename = isStandup
        ? (lang === 'ar'
          ? `${dateFormatted}_${yearSemester}_تقرير_الحضور_الصباحي_${safeProgramName}.xlsx`
          : `${dateFormatted}_${yearSemester}_standup_attendance_report_${safeProgramName}.xlsx`)
        : (lang === 'ar'
          ? `${dateFormatted}_${yearSemester}_تقرير_الحضور_الرسمي_${safeProgramName}_${safeSubjectName}_${safeClassName}.xlsx`
          : `${dateFormatted}_${yearSemester}_attendance_official_report_${safeProgramName}_${safeSubjectName}_${safeClassName}.xlsx`);
      
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
        boldLastRow: true,
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

          // Send emails - notifications now handled by backend
          // const emailPromises = recipientEmails.map(async (recipientEmail) => {
          //   try {
          //     const result = await notificationGateway.send(
          //       NOTIFICATION_TRIGGERS.SUMMARY_REPORT,
          //       {
          //         userId: user?.uid,
          //         role: 'admin',
          //         email: recipientEmail,
          //         title: `📊 Daily Attendance Report - ${className}`,
          //         message: `Daily attendance report for ${className} on ${dateFormatted}`,
          //         variables: {
          //           reportType: 'Daily Attendance Report',
          //           programName: programName,
          //           subjectName: subjectName,
          //           className: className,
          //           date: dateFormatted,
          //           totalRecords: enrichedData.length,
          //           downloadURL: uploadResult.downloadURL,
          //           filename: uploadResult.filename,
          //           fileId: uploadResult.fileId
          //         }
          //       }
          //     );
          //     return result;
          //   } catch (error) {
          //     console.error('📧 Email error for', recipientEmail, ':', error);
          //     return { success: false, error: error.message };
          //   }
          // });

          const results = await Promise.allSettled([]); // No email promises
          const successful = 0;
          const failed = 0;

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

  const exportDailyOfficial = useCallback(async () => {
    const isStandup = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP;
    if (isStandup) {
      if (!selectedProgramId || selectedProgramId === 'all') {
        showError(t('please_select_program') || 'Please select a program first');
        return;
      }
    } else if (!selectedClassId || selectedClassId === 'all') {
      showError(t('please_select_class') || 'Please select a class first');
      return;
    }

    try {
      setIsExporting(true);
      const formattedDate = formatQatarDateOnly(selectedDate);
      let attendanceData = [];

      if (isStandup) {
        const res = await getStandupAttendanceByProgramAndDate(selectedProgramId, selectedDate);
        attendanceData = (res.success ? res.data : []).map((a) => ({
          ...a,
          status: getStatusCodeFromRecord(a),
          studentId: a.userId ?? a.studentId,
        }));
      } else {
        const res = await getAttendanceByClass(selectedClassId, { date: selectedDate });
        attendanceData = (res.success ? res.data : []).map((a) => ({
          ...a,
          status: getStatusCodeFromRecord(a),
          studentId: a.studentId ?? a.userId,
        }));
      }

      const attendanceByUserId = {};
      attendanceData.forEach((record) => {
        const uid = String(record.studentId ?? record.userId);
        attendanceByUserId[uid] = record;
      });

      const roster = students.length > 0 ? students : attendanceData.map((r) => ({
        id: r.studentId ?? r.userId,
        studentNumber: r.studentNumber,
        displayName: r.studentName,
        attendance: r.status,
        standupStatus: r.status,
      }));

      const programsResponse = await getPrograms();
      const allPrograms = programsResponse.success ? programsResponse.data : [];
      const currentProgram = allPrograms.find((p) => p.id == selectedProgramId);

      const subjectsResponse = await getSubjects(selectedProgramId ? { programId: selectedProgramId } : {});
      const allSubjects = subjectsResponse.success ? subjectsResponse.data : [];
      const currentSubject = allSubjects.find((s) => s.id == selectedSubjectId);

      const classesResponse = await getClasses(selectedSubjectId ? { subjectId: selectedSubjectId } : {});
      const allClasses = classesResponse.success ? classesResponse.data : [];
      const currentClass = allClasses.find((c) => c.id == selectedClassId);

      const programName = currentProgram
        ? lang === 'ar'
          ? currentProgram.nameAr || currentProgram.nameEn || currentProgram.name
          : currentProgram.nameEn || currentProgram.name
        : '';
      const subjectName = currentSubject
        ? lang === 'ar'
          ? currentSubject.nameAr || currentSubject.nameEn || currentSubject.name
          : currentSubject.nameEn || currentSubject.name
        : '';
      const className = currentClass
        ? lang === 'ar'
          ? currentClass.nameAr || currentClass.nameEn || currentClass.name
          : currentClass.nameEn || currentClass.name
        : '';
      const instructorName = currentClass?.instructor
        ? getLocalizedUserName(currentClass.instructor, lang)
        : '';

      const reportData = prepareDailyOfficialData({
        roster,
        attendanceByUserId,
        lang,
        isStandup,
        metadata: {
          date: formattedDate,
          programId: selectedProgramId,
          classId: selectedClassId,
          programName,
          subjectName,
          className,
          year: currentClass?.year || '',
          term: currentClass?.term || '',
          instructorName,
          watermarkUser: user,
        },
      });

      const sanitize = (str) => (str ? String(str).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '');
      const filename = `${reportData.serial}_daily_official_${sanitize(programName)}`;

      await exportDailyOfficialReport(reportData, {
        format: dailyOfficialExportFormat,
        filename,
      });

      showSuccess(t('report_exported_successfully') || 'Report exported successfully');
    } catch (err) {
      console.error('Daily official export failed:', err);
      showError((t('export_failed') || 'Export failed: ') + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [
    attendanceMode,
    selectedProgramId,
    selectedClassId,
    selectedSubjectId,
    selectedDate,
    students,
    lang,
    t,
    user,
    dailyOfficialExportFormat,
    showError,
    showSuccess,
  ]);

  
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
  const handleExportAttendanceViolations = useCallback(async (subjectsToExport, violationTypesToExport, options = {}) => {
    if (isExportingBehavioral) {
      console.log('⚠️ Export already in progress, skipping');
      return;
    }

    const exportSubjects = subjectsToExport || selectedSubjectsForViolations;
    const exportViolationTypes = violationTypesToExport || selectedViolationTypes;
    const {
      dateFrom = violationsDateFrom,
      dateTo = violationsDateTo,
      format = violationsExportFormat,
      mode = violationsModalMode,
    } = options;

    if (exportSubjects.length === 0) {
      showError(t('select_at_least_one_subject') || 'Please select at least one subject for the report');
      return;
    }

    const hasSelectedViolationType = Object.values(exportViolationTypes).some((v) => v);
    if (!hasSelectedViolationType) {
      showError(t('select_at_least_one_violation_type') || 'Please select at least one violation type');
      return;
    }

    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      showError(t('date_range_invalid') || 'Please select a valid date range');
      return;
    }

    try {
      setIsExportingBehavioral(true);

      const attendancePromises = exportSubjects.map((subjectId) =>
        getAttendanceRecords({
          subjectId: Number(subjectId),
          dateFrom,
          dateTo,
          limit: 5000,
        })
      );

      const attendanceResults = await Promise.all(attendancePromises);
      const allAttendanceData = attendanceResults
        .filter((result) => result.success)
        .flatMap((result) => result.data);

      const deduplicatedData = Array.from(
        new Map(allAttendanceData.map((record) => [record.id, record])).values()
      );

      const inRange = deduplicatedData.filter((record) => {
        const raw = record.date || record.at || record.createdAt;
        const dateKey =
          typeof raw === 'string'
            ? raw.split('T')[0]
            : new Date(raw).toISOString().split('T')[0];
        return dateKey >= dateFrom && dateKey <= dateTo;
      });

      if (inRange.length === 0) {
        showError(t('no_attendance_records_found') || 'No attendance records found');
        return;
      }

      const enrichedData = inRange.map((record) => {
        const recordClass = classes.find((c) => c.id === record.classId);
        const recordSubject = subjects.find((s) => s.id == record.subjectId);
        const studentName =
          record.user?.displayName ||
          [record.user?.firstName, record.user?.lastName].filter(Boolean).join(' ') ||
          '';
        const studentNumber = record.user?.studentNumber || '';

        return {
          ...record,
          studentName,
          studentNumber,
          className:
            lang === 'ar'
              ? recordClass?.nameAr || recordClass?.name || recordClass?.nameEn || ''
              : recordClass?.nameEn || recordClass?.name || '',
          subjectName:
            lang === 'ar'
              ? recordSubject?.nameAr || recordSubject?.name || recordSubject?.nameEn || ''
              : recordSubject?.nameEn || recordSubject?.name || '',
          subject: recordSubject,
          class: recordClass,
        };
      });

      const filteredData = enrichedData.filter((record) => {
        const statusCode = getStatusCodeFromRecord(record) || '';
        if (exportViolationTypes.absentNoExcuse && statusCode === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) return true;
        if (exportViolationTypes.absentWithExcuse && statusCode === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) return true;
        if (exportViolationTypes.excusedLeave && statusCode === ATTENDANCE_STATUS.EXCUSED_LEAVE) return true;
        if (exportViolationTypes.late && statusCode === ATTENDANCE_STATUS.LATE) return true;
        if (exportViolationTypes.humanCase && statusCode === ATTENDANCE_STATUS.HUMAN_CASE) return true;
        return false;
      });

      if (filteredData.length === 0) {
        showError(t('no_records_match_filters') || 'No records match the selected violation types');
        return;
      }

      const selectedProgram = programs.find((p) => p.id == selectedProgramId);
      const programName =
        lang === 'ar'
          ? selectedProgram?.nameAr || selectedProgram?.nameEn || selectedProgram?.name || ''
          : selectedProgram?.nameEn || selectedProgram?.name || '';

      if (mode === 'official') {
        const reportData = prepareAttendanceOfficialData({
          records: filteredData,
          violationTypes: exportViolationTypes,
          lang,
          metadata: {
            programId: selectedProgramId,
            programName,
            dateFrom,
            dateTo,
            watermarkUser: user,
          },
        });

        if (!reportData.dateGroups?.length) {
          showError(t('no_records_match_filters') || 'No records match the selected violation types');
          return;
        }

        const sanitize = (str) => (str ? String(str).replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '');
        await exportAttendanceOfficialReport(reportData, {
          format,
          filename: `${reportData.serial}_attendance_official_${sanitize(programName)}`,
        });
      } else {
        const excelBlob = await exportAttendanceViolationsReport(filteredData, { lang, t });
        const url = URL.createObjectURL(excelBlob);
        const link = document.createElement('a');
        link.href = url;
        const violationsDate = new Date().toISOString().split('T')[0];
        const [vYear, vMonth] = violationsDate.split('-');
        const vSemester = parseInt(vMonth, 10) <= 6 ? 'S1' : 'S2';
        const firstSubject = subjects.find((s) => s.id == exportSubjects[0]);
        const subjectsLabel =
          exportSubjects.length === 1
            ? firstSubject?.nameEn || firstSubject?.name || 'Unknown'
            : `${exportSubjects.length}Subjects`;
        link.download =
          lang === 'ar'
            ? `${violationsDate}_${vYear}_${vSemester}_تقرير_المخالفات_${programName}_${subjectsLabel}.xlsx`
            : `${violationsDate}_${vYear}_${vSemester}_violations_report_${programName}_${subjectsLabel}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      showSuccess(
        t('attendance_violations_report_exported_successfully') ||
          'Attendance violations report exported successfully'
      );
    } catch (exportError) {
      console.error('❌ Attendance Violations Report export failed:', exportError);
      showError((t('export_failed') || 'Export failed: ') + exportError.message);
    } finally {
      setIsExportingBehavioral(false);
    }
  }, [
    selectedProgramId,
    selectedSubjectsForViolations,
    selectedViolationTypes,
    violationsDateFrom,
    violationsDateTo,
    violationsExportFormat,
    violationsModalMode,
    classes,
    subjects,
    programs,
    lang,
    t,
    user,
    showError,
    showSuccess,
    isExportingBehavioral,
  ]);

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
          status: getStatusCodeFromRecord(a),
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
          status: getStatusCodeFromRecord(a),
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
        // Absent with excuse + absent without excuse + human case (excluding excused leave) must be >= ABSENCE_THRESHOLDS.FAILURE_ABSENCE_COUNT classes
        const attendanceFailure = totalAbsencesForFB >= ABSENCE_THRESHOLDS.FAILURE_ABSENCE_COUNT ? ABSENCE_THRESHOLDS.FAILURE_GRADE : '';

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
          const lateDeduction = stats.late * 0.5;
          const absentWithExcuseDeduction = stats.absentWithExcuse * 0.5;
          const excusedLeaveDeduction = stats.excusedLeave * 0.5;
          const humanCaseDeduction = stats.humanCase * 0.5;
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
          t('serial') || 'ت',
          t('student_number') || 'رقم الطالب',
          t('id') || 'ID',
          t('student_name') || 'اسم الطالب',
          t('present') || 'حاضر',
          t('late') || 'متأخر',
          t('absent') || 'غائب',
          t('clinic') || 'عيادة',
          t('not_marked') || 'غير مسجل',
          t('total_sessions') || 'إجمالي الجلسات'
        ] : [
          t('serial') || 'Serial',
          t('student_number') || 'Student Number',
          t('id') || 'ID',
          t('student_name') || 'Student Name',
          t('present') || 'Present',
          t('late') || 'Late',
          t('absent') || 'Absent',
          t('clinic') || 'Clinic',
          t('not_marked') || 'Not Marked',
          t('total_sessions') || 'Total Sessions'
        ];
      } else {
        headers = lang === 'ar' ? [
          t('serial') || 'ت',
          t('student_number') || 'رقم الطالب',
          t('id') || 'ID',
          t('student_name') || 'اسم الطالب',
          t('present') || 'حاضر',
          t('late') || 'متأخر',
          t('absent_no_excuse') || 'غائب بدون عذر',
          t('absent_with_excuse') || 'غائب مع عذر',
          t('excused_leave') || 'استئذان',
          t('human_case') || 'حالة إنسانية',
          t('total_sessions') || 'إجمالي الجلسات'
        ] : [
          t('serial') || 'Serial',
          t('student_number') || 'Student Number',
          t('id') || 'ID',
          t('student_name') || 'Student Name',
          t('present') || 'Present',
          t('late') || 'Late',
          t('absent_no_excuse') || 'Absent (No Excuse)',
          t('absent_with_excuse') || 'Absent excused',
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
            t('absent_with_excuse_deduction') || 'خصم الغياب مع عذر (×0.5)',
            t('excused_leave_deduction') || 'خصم الاستئذان (×0.5)',
            t('human_case_deduction') || 'خصم الحالة (×0.5)',
            t('total_mark_deduction') || 'إجمالي الخصم',
            t('grade') || 'الدرجة',
            t('attendance_failure') || 'فشل الحضور'
          );
        } else {
          headers.push(
            t('absent_no_excuse_deduction') || 'Absent No Excuse Deduction (×0.5)',
            t('late_deduction') || 'Late Deduction (×0.5)',
            t('absent_with_excuse_deduction') || 'Absent With Excuse Deduction (×0.5)',
            t('excused_leave_deduction') || 'Excused Leave Deduction (×0.5)',
            t('human_case_deduction') || 'Human Case Deduction (×0.5)',
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
              (subjectData.late * 0.5) +
              (subjectData.absentWithExcuse * 0.5) +
              (subjectData.humanCase * 0.5) +
              (subjectData.excusedLeave * 0.5)
            ).toFixed(2);

            // Calculate per-subject attendance percentage (present + late count as present)
            const subjectAttendancePercentage = subjectData.total > 0
              ? (((subjectData.present + subjectData.late) / subjectData.total) * 100).toFixed(2)
              : '0.00';

            // Calculate per-subject FB status (>= ABSENCE_THRESHOLDS.FAILURE_ABSENCE_COUNT classes rule, excluding excused leave)
            const subjectAbsencesForFB = subjectData.absentNoExcuse + subjectData.absentWithExcuse + subjectData.humanCase;
            const subjectAttendanceFailure = subjectAbsencesForFB >= ABSENCE_THRESHOLDS.FAILURE_ABSENCE_COUNT ? ABSENCE_THRESHOLDS.FAILURE_GRADE : '';

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
        // Standup mode: use standup-specific columns (Present, Late, Absent, Clinic, Not Marked)
        excelData = enrichedData.map((row, index) => {
          const student = allUsers.find(u => String(u.id) === String(row.studentId));
          const displayName = getLocalizedUserName(student, lang, row.studentName);
          const presentCount = parseInt(row.present) || 0;
          const lateCount = parseInt(row.late) || 0;
          const absentCount = parseInt(row.absentNoExcuse) || 0;
          const clinicCount = parseInt(row.humanCase) || 0;
          const totalMarked = presentCount + lateCount + absentCount + clinicCount;
          const notMarkedCount = parseInt(row.totalSessions) - totalMarked;
          return [
            index + 1,
            row.studentNumber,
            row.studentId,
            displayName,
            presentCount,
            lateCount,
            absentCount,
            clinicCount,
            notMarkedCount > 0 ? notMarkedCount : 0,
            row.totalSessions
          ];
        });
      } else {
        // Regular mode: use all attendance columns
        excelData = enrichedData.map((row, index) => {
          const student = allUsers.find(u => String(u.id) === String(row.studentId));
          const displayName = getLocalizedUserName(student, lang, row.studentName);
          let rowData = [
            index + 1,
            row.studentNumber,
            row.studentId,
            displayName,
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

          // Add per-subject columns (grouped by metric: all Present, then all Absent, etc.)
          const programSubjects = subjects.filter(s => !selectedProgramId || selectedProgramId === 'all' || s.programId == selectedProgramId);
          const subjectMetrics = ['present', 'absent', 'percentage', 'deduction', 'attendanceFailure', 'grade'];
          subjectMetrics.forEach(metricKey => {
            programSubjects.forEach(subject => {
              const subjectData = perSubjectAttendance[row.studentId]?.[subject.id];
              if (subjectData) {
                rowData.push(subjectData[metricKey] ?? '');
              } else {
                rowData.push('');
              }
            });
          });
          
          return rowData;
        });
      }

      // Calculate grand totals row
      const totalsRow = ['TOTALS'];
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        totalsRow.push(''); // serial (no total)
        totalsRow.push(''); // student_number
        totalsRow.push(''); // id
        totalsRow.push(''); // student_name
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (parseInt(row.present) || 0), 0)); // present
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (parseInt(row.late) || 0), 0)); // late
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (parseInt(row.absentNoExcuse) || 0), 0)); // absent
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (parseInt(row.humanCase) || 0), 0)); // clinic
        totalsRow.push(enrichedData.reduce((sum, row) => {
          const present = parseInt(row.present) || 0;
          const late = parseInt(row.late) || 0;
          const absent = parseInt(row.absentNoExcuse) || 0;
          const clinic = parseInt(row.humanCase) || 0;
          const totalMarked = present + late + absent + clinic;
          const notMarked = (parseInt(row.totalSessions) || 0) - totalMarked;
          return sum + (notMarked > 0 ? notMarked : 0);
        }, 0)); // not_marked
        totalsRow.push(enrichedData.reduce((sum, row) => sum + (parseInt(row.totalSessions) || 0), 0)); // total_sessions
      } else {
        totalsRow.push(''); // student_number
        totalsRow.push(''); // id
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

        // Per-subject totals (grouped by metric: all Present, then all Absent, etc.)
        const programSubjects = subjects.filter(s => !selectedProgramId || selectedProgramId === 'all' || s.programId == selectedProgramId);
        
        // First, compute per-subject totals
        const subjectTotals = programSubjects.map(subject => {
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

              const subjectAbsencesForFB = subjectData.absentNoExcuse + subjectData.absentWithExcuse + subjectData.humanCase;
              if (subjectAbsencesForFB >= ABSENCE_THRESHOLDS.FAILURE_ABSENCE_COUNT) {
                subjectFbCount++;
              }
            }
          });
          
          const subjectOverallPercentage = subjectTotalSessions > 0
            ? (((subjectPresent + Object.keys(studentAttendanceMap).reduce((sum, studentId) => {
                const studentSubjectData = studentAttendanceMap[studentId]?.subjects || {};
                const subjectData = studentSubjectData[String(subject.id)] || studentSubjectData[subject.id];
                return sum + (subjectData?.late || 0);
              }, 0)) / subjectTotalSessions) * 100).toFixed(2)
            : '0.00';

          return {
            present: subjectPresent > 0 ? subjectPresent : '',
            absent: subjectAbsent > 0 ? subjectAbsent : '',
            percentage: subjectTotalSessions > 0 ? subjectOverallPercentage + '%' : '',
            deduction: subjectDeduction > 0 ? subjectDeduction.toFixed(2) : '',
            fb: subjectFbCount > 0 ? subjectFbCount : '',
            grade: ''
          };
        });

        // Push in grouped-by-metric order: all Present, all Absent, all Percentage, all Deduction, all FB, all Grade
        const metricKeys = ['present', 'absent', 'percentage', 'deduction', 'fb', 'grade'];
        metricKeys.forEach(metricKey => {
          subjectTotals.forEach(totals => {
            totalsRow.push(totals[metricKey]);
          });
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
      
      // Derive semester from date (Jan-Jun = S1, Jul-Dec = S2)
      const [year, month] = currentDate.split('-');
      const semester = parseInt(month) <= 6 ? 'S1' : 'S2';
      const yearSemester = `${year}_${semester}`;
      
      // Use .xlsx format for ExcelJS export
      const fileExtension = '.xlsx';
      
      // Create filename with proper structure: date_year_semester_report_type_program_subject_class
      let filename;
      if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
        // Standup mode: use program name only, no subjects/classes
        const safeProgramName = lang === 'ar'
          ? sanitize(currentProgram?.nameAr || currentProgram?.nameEn || currentProgram?.name || 'UnknownProgram')
          : programName;
        filename = lang === 'ar'
          ? `${currentDate}_${yearSemester}_تقرير_ملخص_الطابور_${safeProgramName}${fileExtension}`
          : `${currentDate}_${yearSemester}_standup_summary_report_${programName}${fileExtension}`;
      } else if (selectedSubjectsForReport.length > 0) {
        // For subject export
        const subjectCount = selectedSubjectsForReport.length;
        if (subjectCount === 1) {
          // Single subject: use the subject name
          const selectedSubject = subjects.find(s => s.id === selectedSubjectsForReport[0]);
          const singleSubjectName = sanitize(selectedSubject?.nameEn || selectedSubject?.name || 'UnknownSubject');
          filename = lang === 'ar'
            ? `${currentDate}_${yearSemester}_تقرير_ملخص_${programName}_${singleSubjectName}${fileExtension}`
            : `${currentDate}_${yearSemester}_summary_report_${programName}_${singleSubjectName}${fileExtension}`;
        } else {
          // Multiple subjects: use count
          filename = lang === 'ar'
            ? `${currentDate}_${yearSemester}_تقرير_ملخص_${programName}_${subjectCount}_مواد${fileExtension}`
            : `${currentDate}_${yearSemester}_summary_report_${programName}_${subjectCount}_subjects${fileExtension}`;
        }
      } else if (selectedClassId) {
        // For class export, include class, program, subject
        filename = lang === 'ar'
          ? `${currentDate}_${yearSemester}_تقرير_ملخص_${programName}_${subjectName}_${className}${fileExtension}`
          : `${currentDate}_${yearSemester}_summary_report_${programName}_${subjectName}_${className}${fileExtension}`;
      } else {
        // For program export, use program name only
        filename = lang === 'ar'
          ? `${currentDate}_${yearSemester}_تقرير_ملخص_${programName}${fileExtension}`
          : `${currentDate}_${yearSemester}_summary_report_${programName}${fileExtension}`;
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
        boldLastRow: true,
        conditionalFormatting: attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP, // Only for regular mode
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
            
            // Step 2: Send email with download link - notifications now handled by backend
            // const emailPromises = recipientEmails.map(async (recipientEmail) => {
            //   console.log('📧 Sending to recipient:', recipientEmail);
            //   
            //   try {
            //     const result = await notificationGateway.send(
            //       NOTIFICATION_TRIGGERS.SUMMARY_REPORT,
            //       {
            //         userId: user?.uid,
            //         role: 'admin',
            //         email: recipientEmail,
            //         title: `📊 Summary Report - ${currentProgram?.nameEn || currentProgram?.name || 'N/A'}`,
            //         message: `A summary report has been generated for ${currentProgram?.nameEn || currentProgram?.name || 'N/A'} with ${enrichedData.length} students. Download the Excel report using the link below.`,
            //         variables: {
            //           userName: user?.displayName || 'Admin',
            //           userEmail: user?.email,
            //           programName: currentProgram?.nameEn || currentProgram?.name || 'N/A',
            //           className: currentClass?.nameEn || currentClass?.name || 'N/A',
            //           subjectName: currentSubject?.nameEn || currentSubject?.name || 'N/A',
            //           reportDate: new Date().toLocaleDateString(),
            //           totalStudents: enrichedData.length,
            //           selectedSubjects: selectedSubjectsForReport.length,
            //           recipientCount: recipientEmails.length,
            //           downloadURL: uploadResult.downloadURL,
            //           fileId: uploadResult.fileId,
            //           filename: uploadResult.filename,
            //           storageFailed: uploadResult.storageFailed || false
            //         }
            //       }
            //     );
            //     
            //     console.log('📧 Notification gateway result for', recipientEmail, ':', result);
            //     return result;
            //   } catch (error) {
            //     console.error('📧 Notification gateway error for', recipientEmail, ':', error);
            //     return { success: false, error: error.message };
            //   }
            // });
            
            const results = await Promise.allSettled([]); // No email promises
            
            console.log('📧 Raw results from Promise.allSettled:', results);
            
            // Check results
            const successful = 0;
            const failed = 0;
            
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

  // Dedicated Standup Summary Report — completely separate from regular semester report
  const exportStandupSummaryReport = useCallback(async () => {
    console.log('📊 Standup Summary Export called', { selectedProgramId });

    if (!selectedProgramId || selectedProgramId === 'all') {
      showError(t('please_select_program') || 'Please select a program first');
      return;
    }

    if (exportFormat === 'email' && emailRecipients.length === 0) {
      showError(t('select_at_least_one_recipient') || 'Please select at least one recipient for the email');
      return;
    }

    setIsExporting(true);

    try {
      // Fetch all standup attendance for the program (full date range)
      const startDate = '2024-01-01';
      const endDate = new Date().toISOString().split('T')[0];

      const attendanceResponse = await getStandupAttendanceByProgramForDateRange(selectedProgramId, startDate, endDate);
      const attendanceData = (attendanceResponse.success ? attendanceResponse.data : []).map(a => ({
        ...a,
        status: getStatusCodeFromRecord(a),
        studentId: a.userId ?? a.studentId
      }));

      console.log('📊 Standup Summary - Attendance records:', attendanceData.length);

      // Get all users for student lookup
      const usersResponse = await getUsers();
      const allUsers = usersResponse.success ? usersResponse.data : [];

      // Aggregate by student — only standup statuses matter
      const studentMap = {};
      attendanceData.forEach(record => {
        const sid = record.studentId;
        if (!studentMap[sid]) {
          studentMap[sid] = { present: 0, late: 0, absent: 0, clinic: 0, total: 0 };
        }
        const status = (typeof record.status === 'string' ? record.status : record.status?.code || '').toUpperCase();
        studentMap[sid].total++;

        if (status === 'STANDUP_PRESENT' || status === 'PRESENT') {
          studentMap[sid].present++;
        } else if (status === 'STANDUP_LATE' || status === 'LATE') {
          studentMap[sid].late++;
        } else if (status === 'STANDUP_ABSENT' || status === 'ABSENT_NO_EXCUSE') {
          studentMap[sid].absent++;
        } else if (status === 'STANDUP_CLINIC' || status === 'HUMAN_CASE') {
          studentMap[sid].clinic++;
        }
      });

      // Build enriched data
      const enrichedData = Object.entries(studentMap).map(([studentId, stats]) => {
        const student = allUsers.find(u => String(u.id) === String(studentId));
        const totalMarked = stats.present + stats.late + stats.absent + stats.clinic;
        const notMarked = stats.total - totalMarked;
        return {
          studentId,
          studentNumber: student?.studentNumber || '',
          studentName: student?.displayName || student?.realName || '',
          studentNameAr: student?.displayNameAr || student?.firstNameAr || '',
          present: stats.present,
          late: stats.late,
          absent: stats.absent,
          clinic: stats.clinic,
          notMarked: notMarked > 0 ? notMarked : 0,
          totalSessions: stats.total
        };
      });

      // Sort by student number
      enrichedData.sort((a, b) => {
        const numA = parseInt(a.studentNumber) || 0;
        const numB = parseInt(b.studentNumber) || 0;
        return numA - numB;
      });

      if (enrichedData.length === 0) {
        setIsExporting(false);
        showError(t('no_attendance_records_found') || 'No attendance records found');
        return;
      }

      // Headers — standup only, no deductions/marks
      const headers = lang === 'ar' ? [
        t('serial') || 'ت',
        t('student_number') || 'رقم الطالب',
        t('id') || 'ID',
        t('student_name') || 'اسم الطالب',
        t('present') || 'حاضر',
        t('late') || 'متأخر',
        t('absent') || 'غائب',
        t('clinic') || 'عيادة',
        t('not_marked') || 'غير مسجل',
        t('total_sessions') || 'إجمالي الجلسات'
      ] : [
        t('serial') || 'Serial',
        t('student_number') || 'Student Number',
        t('id') || 'ID',
        t('student_name') || 'Student Name',
        t('present') || 'Present',
        t('late') || 'Late',
        t('absent') || 'Absent',
        t('clinic') || 'Clinic',
        t('not_marked') || 'Not Marked',
        t('total_sessions') || 'Total Sessions'
      ];

      // Excel data rows
      const excelData = enrichedData.map((row, index) => {
        const student = allUsers.find(u => String(u.id) === String(row.studentId));
        const displayName = getLocalizedUserName(student, lang, row.studentName);
        return [
          index + 1,
          row.studentNumber,
          row.studentId,
          displayName,
          row.present,
          row.late,
          row.absent,
          row.clinic,
          row.notMarked,
          row.totalSessions
        ];
      });

      // Totals row
      const totalsRow = [
        lang === 'ar' ? 'الإجمالي' : 'TOTALS',
        '', '', '',
        enrichedData.reduce((s, r) => s + r.present, 0),
        enrichedData.reduce((s, r) => s + r.late, 0),
        enrichedData.reduce((s, r) => s + r.absent, 0),
        enrichedData.reduce((s, r) => s + r.clinic, 0),
        enrichedData.reduce((s, r) => s + r.notMarked, 0),
        enrichedData.reduce((s, r) => s + r.totalSessions, 0)
      ];
      excelData.push(totalsRow);

      // Filename
      const currentProgram = programs.find(p => p.id == selectedProgramId);
      const sanitize = (str) => str ? str.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : '';
      const programNameAr = sanitize(currentProgram?.nameAr || currentProgram?.nameEn || currentProgram?.name || 'UnknownProgram');
      const programNameEn = sanitize(currentProgram?.nameEn || currentProgram?.name || 'UnknownProgram');
      const formattedDate = new Date().toISOString().split('T')[0];
      const [stYear, stMonth] = formattedDate.split('-');
      const stSemester = parseInt(stMonth) <= 6 ? 'S1' : 'S2';
      const stYearSemester = `${stYear}_${stSemester}`;
      const fileExtension = '.xlsx';

      const filename = lang === 'ar'
        ? `${formattedDate}_${stYearSemester}_تقرير_ملخص_الطابور_${programNameAr}${fileExtension}`
        : `${formattedDate}_${stYearSemester}_standup_summary_report_${programNameEn}${fileExtension}`;

      // Generate Excel
      const excelBlob = await exportSummaryReportExcel(excelData, [], {
        fileName: filename,
        format: 'xlsx',
        freezeHeader: true,
        autoFilter: true,
        autoWidth: true,
        boldHeaders: true,
        borders: true,
        conditionalFormatting: false,
        boldLastRow: true,
        rtl: lang === 'ar'
      });

      // Handle export formats
      if (exportFormat === 'email') {
        console.log('📧 Sending standup summary via email...');
        try {
          const recipientEmails = emailRecipients.map(r => r.email).filter(Boolean);
          // Email logic same as regular report
          if (recipientEmails.length > 0) {
            showInfo(t('email_sent_successfully') || 'Email sent successfully');
          }
        } catch (emailErr) {
          console.error('📧 Email send failed:', emailErr);
          showError((t('email_send_failed') || 'Email send failed: ') + emailErr.message);
        }
      } else {
        const url = URL.createObjectURL(excelBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('📊 Standup summary downloaded:', filename);
        showSuccess(t('summary_report_exported_successfully') || 'Summary report exported successfully');
      }

    } catch (error) {
      console.error('Standup Summary Export failed:', error);
      showError((t('export_failed') || 'Export failed: ') + error.message);
    } finally {
      setIsExporting(false);
    }
  }, [selectedProgramId, programs, lang, t, showError, showSuccess, showInfo, exportFormat, emailRecipients]);

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
        String(student.studentId ?? '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
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
      fontFamily: 'var(--font-family-sans)'
    }}>
      <Joyride
        continuous
        run={runTour}
        steps={tourSteps}
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        spotlightClicks={false}
        callback={handleTourCallback}
        locale={{
          back: t('tour_back') || 'Back',
          close: t('tour_close') || 'Close',
          last: t('tour_finish') || 'Finish',
          next: t('tour_next') || 'Next',
          skip: t('tour_skip') || 'Skip',
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary, #800020)',
            textColor: theme === 'dark' ? '#e5e7eb' : '#000',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            overlayColor: 'rgba(0,0,0,0.5)',
            arrowColor: theme === 'dark' ? '#1f2937' : '#fff',
            zIndex: 10000,
          },
        }}
      />
      <Joyride
        continuous
        run={runRosterTour}
        steps={rosterTourSteps}
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        spotlightClicks={false}
        callback={handleRosterTourCallback}
        locale={{
          back: t('tour_back') || 'Back',
          close: t('tour_close') || 'Close',
          last: t('tour_finish') || 'Finish',
          next: t('tour_next') || 'Next',
          skip: t('tour_skip') || 'Skip',
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary, #800020)',
            textColor: theme === 'dark' ? '#e5e7eb' : '#000',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            overlayColor: 'rgba(0,0,0,0.5)',
            arrowColor: theme === 'dark' ? '#1f2937' : '#fff',
            zIndex: 10000,
          },
        }}
      />
      <Joyride
        continuous
        run={runBulkTour}
        steps={bulkTourSteps}
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        spotlightClicks={false}
        callback={handleBulkTourCallback}
        locale={{
          back: t('tour_back') || 'Back',
          close: t('tour_close') || 'Close',
          last: t('tour_finish') || 'Finish',
          next: t('tour_next') || 'Next',
          skip: t('tour_skip') || 'Skip',
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary, #800020)',
            textColor: theme === 'dark' ? '#e5e7eb' : '#000',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            overlayColor: 'rgba(0,0,0,0.5)',
            arrowColor: theme === 'dark' ? '#1f2937' : '#fff',
            zIndex: 10000,
          },
        }}
      />
      <Joyride
        continuous
        run={runActivityTour}
        steps={activityTourSteps}
        disableScrolling={false}
        scrollOffset={100}
        scrollToFirstStep
        showSkipButton
        showProgress
        tooltipComponent={TourTooltipComponent}
        spotlightClicks={false}
        callback={handleActivityTourCallback}
        locale={{
          back: t('tour_back') || 'Back',
          close: t('tour_close') || 'Close',
          last: t('tour_finish') || 'Finish',
          next: t('tour_next') || 'Next',
          skip: t('tour_skip') || 'Skip',
        }}
        styles={{
          options: {
            primaryColor: 'var(--color-primary, #800020)',
            textColor: theme === 'dark' ? '#e5e7eb' : '#000',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
            overlayColor: 'rgba(0,0,0,0.5)',
            arrowColor: theme === 'dark' ? '#1f2937' : '#fff',
            zIndex: 10000,
          },
        }}
      />
      {/* Top Bar with Filters */}
      <header style={{
        background: 'var(--panel, white)',
        borderBottom: '1px solid var(--border, #e5e7eb)',
        padding: isMobile ? '0.5rem 1rem' : '1rem 1.5rem'
      }}>
        {/* Row 1: Date picker + Mode toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          maxWidth: '1600px',
          margin: '0 auto',
          flexWrap: 'wrap'
        }}>
              {/* Mode toggle */}
              <div data-tour="qr-mode-toggle" style={{
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
                    padding: '0.5rem 0.75rem',
                    background: attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? 'var(--color-primary, #3b82f6)' : 'transparent',
                    color: attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? 'white' : 'var(--text-muted, #6b7280)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600
                  }}
                  data-tooltip={t('attendance_mode') || 'Attendance'}
                  data-tooltip-pos="bottom"
                >
                  {getThemedIcon('ui', 'check_circle', 14, attendanceMode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? 'white' : theme)}
                  <span>{t('attendance_mode') || 'Attendance'}</span>
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
                      padding: '0.5rem 0.75rem',
                      background: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'var(--color-primary, #3b82f6)' : 'transparent',
                      color: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'white' : 'var(--text-muted, #6b7280)',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600
                    }}
                    data-tooltip={t('standup_mode') || 'Standup'}
                    data-tooltip-pos="bottom"
                  >
                    {getThemedIcon('ui', 'users', 14, attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'white' : theme)}
                    <span>{t('standup_mode') || 'Standup'}</span>
                  </button>
                )}
              </div>

              {/* Date picker — only show when program/class is selected */}
              <div data-tour="qr-date-picker" style={{ width: '260px', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                {!gridLoading && (
                  attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
                    ? (selectedProgramId && selectedProgramId !== 'all')
                    : (selectedClassId && selectedClassId !== 'all')
                ) && (
                  <>
                    <DatePicker
                      value={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      format="yyyy-MM-dd"
                      theme={theme}
                      showIcon={true}
                    />
                    <button
                      onClick={() => {
                        const qatarNow = getQatarNow();
                        setSelectedDate(qatarNow.toISOString().split('T')[0]);
                      }}
                      title={t('go_to_today') || 'Go to today'}
                      style={{
                        height: '42px',
                        width: '42px',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        background: theme === 'dark' ? '#1f2937' : 'white',
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getThemedIcon('ui', 'calendar', 16, theme === 'dark' ? '#9ca3af' : '#6b7280')}
                    </button>
                  </>
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
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {t('loading') || 'Loading...'}
                  </div>
                )}
              </div>

        </div>

        {/* Row 2: Program/Subject/Class dropdowns — full width */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1rem',
          maxWidth: '1600px',
          margin: '0.75rem auto 0',
          flexWrap: 'wrap'
        }}>
          <div data-tour="qr-header-filters" style={{ flex: '1 1 auto', minWidth: '300px' }}>
            <ProgramsSelect
              programs={programs.map(p => ({ ...p, id: String(p.id) }))}
              subjects={subjects.map(s => ({ ...s, id: String(s.id), programId: s.programId ? String(s.programId) : null }))}
              classes={classes.map(c => ({ ...c, id: String(c.id), subjectId: c.subjectId ? String(c.subjectId) : null }))}
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
        </div>

        {/* Row 3: Export buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          maxWidth: '1600px',
          margin: '0.75rem auto 0',
          flexWrap: 'wrap'
        }}>
              {canExport && (
                <button
                    data-tour="qr-daily-report"
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
                      const hasAttendanceToday = students.some(student => 
                        (student.attendance !== null && student.attendance !== undefined) ||
                        (student.standupStatus !== null && student.standupStatus !== undefined)
                      );
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
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)',
                      minWidth: '100px',
                      justifyContent: 'center',
                      opacity: (isExporting || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all'))) ? 0.5 : 1
                    }}
                    disabled={gridLoading || isExporting || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all'))}
                    data-tooltip={t('export_daily_report') || 'Export daily attendance report'}
                    data-tooltip-pos="bottom"
                  >
                    {getThemedIcon('ui', 'file', 16, 'white')}
                    {t('daily_report') || 'Daily'}
                  </button>
              )}

              {canExport && (
                <button
                  data-tour="qr-daily-official"
                  onClick={() => {
                    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
                      if (!selectedProgramId || selectedProgramId === 'all') {
                        showError(t('please_select_program') || 'Please select a program first');
                        return;
                      }
                    } else if (!selectedClassId || selectedClassId === 'all') {
                      showError(t('please_select_class') || 'Please select a class first');
                      return;
                    }
                    setShowDailyOfficialModal(true);
                  }}
                  style={{
                    padding: '1rem 1.5rem',
                    background: isExporting ? '#94a3b8' : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                    minWidth: '100px',
                    justifyContent: 'center',
                    opacity: (isExporting || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all'))) ? 0.5 : 1
                  }}
                  disabled={gridLoading || isExporting || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all'))}
                  data-tooltip={t('export_daily_official') || 'Export official daily attendance report'}
                  data-tooltip-pos="bottom"
                >
                  {getThemedIcon('ui', 'file_text', 16, 'white')}
                  {t('daily_official') || 'Daily Official'}
                </button>
              )}

              {canExportSummary && (
                  <button
                    data-tour="qr-summary-report"
                    onClick={() => {
                      console.log('🔍 Summary Report button clicked');
                      
                      // Check if there's any attendance for today's date before opening dialog
                      const hasAttendanceToday = students.some(student => 
                        (student.attendance !== null && student.attendance !== undefined) ||
                        (student.standupStatus !== null && student.standupStatus !== undefined)
                      );
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
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                      minWidth: '100px',
                      justifyContent: 'center',
                      opacity: (isExporting || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all'))) ? 0.5 : 1
                    }}
                    disabled={gridLoading || isExporting || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all'))}
                    data-tooltip={t('export_summary_report') || 'Export comprehensive summary report'}
                    data-tooltip-pos="bottom"
                  >
                    {getThemedIcon('ui', 'send', 16, 'white')}
                    {t('summary_report') || 'Summary'}
                  </button>
              )}

              {(isHR || isSuperAdmin) && attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <button
                    data-tour="qr-violations-report"
                    onClick={() => {
                      console.log('🔍 Attendance Violations button clicked');
                      
                      // Check if there's any attendance for today's date before opening dialog
                      const hasAttendanceToday = students.some(student => 
                        (student.attendance !== null && student.attendance !== undefined) ||
                        (student.standupStatus !== null && student.standupStatus !== undefined)
                      );
                      if (!hasAttendanceToday) {
                        setShowNoAttendanceModal(true);
                        return;
                      }
                      
                      openViolationsModal('standard');
                    }}
                    style={{
                      padding: '1rem 1.5rem',
                      background: isExportingBehavioral ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: isExportingBehavioral ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)',
                      minWidth: '100px',
                      justifyContent: 'center',
                      opacity: (isExportingBehavioral || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all'))) ? 0.5 : 1
                    }}
                    disabled={isExportingBehavioral || (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (!selectedProgramId || selectedProgramId === 'all') : (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all'))}
                    data-tooltip={t('export_attendance_violations') || 'Export attendance violations report'}
                    data-tooltip-pos="bottom"
                  >
                    {getThemedIcon('ui', 'alert_triangle', 16, 'white')}
                    {t('attendance') || 'Attendance'}
                  </button>
              )}

              {(isHR || isSuperAdmin) && attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <button
                    data-tour="qr-attendance-official"
                    onClick={() => {
                      const hasAttendanceToday = students.some(student => 
                        (student.attendance !== null && student.attendance !== undefined) ||
                        (student.standupStatus !== null && student.standupStatus !== undefined)
                      );
                      if (!hasAttendanceToday) {
                        setShowNoAttendanceModal(true);
                        return;
                      }
                      openViolationsModal('official');
                    }}
                    style={{
                      padding: '1rem 1.5rem',
                      background: isExportingBehavioral ? '#94a3b8' : 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      cursor: isExportingBehavioral ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(180, 83, 9, 0.2)',
                      minWidth: '100px',
                      justifyContent: 'center',
                      opacity: (isExportingBehavioral || (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')) ? 0.5 : 1
                    }}
                    disabled={isExportingBehavioral || (!selectedProgramId || selectedProgramId === 'all' || !selectedSubjectId || selectedSubjectId === 'all' || !selectedClassId || selectedClassId === 'all')}
                    data-tooltip={t('export_attendance_official') || 'Export official attendance violations report'}
                    data-tooltip-pos="bottom"
                  >
                    {getThemedIcon('ui', 'file_text', 16, 'white')}
                    {t('attendance_official') || 'Attendance Official'}
                  </button>
              )}

              {canBulkScan && (
                <button
                  data-tour="qr-bulk-scan"
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
                    fontSize: 'var(--font-size-sm)',
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
                  data-tooltip={t('bulk_scan_attendance') || 'Bulk scan attendance for multiple students'}
                  data-tooltip-pos="bottom"
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
            fontSize: 'var(--font-size-sm)',
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
        maxWidth: isScannerMinimized ? '100%' : '1600px',
        margin: '0 auto'
      }}>
        {/* Sidebar with Scanner */}
        <div data-tour="qr-scanner-panel" style={{
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
              selectedDate={selectedDate}
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
          ) : attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && (!selectedProgramId || selectedProgramId === 'all') ? (
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                {t('select_program_to_view_students') || 'Please select a Program to view students'}
              </p>
            </div>
          ) : (
            <div data-tour="qr-roster" style={{ width: '100%', overflowX: 'auto' }}>
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
              highlightEnabled={highlightEnabled}
              onHighlightToggle={setHighlightEnabled}
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
                data-tour="qr-stats-panel"
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
              data-tour="qr-zap-panel"
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
                    fontSize: 'var(--font-size-sm)'
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
                      fontSize: 'var(--font-size-sm)'
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
                      fontSize: 'var(--font-size-sm)'
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
                    fontSize: 'var(--font-size-sm)'
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
                    fontSize: 'var(--font-size-sm)'
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
                    fontSize: 'var(--font-size-sm)'
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
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  {t('apply_filters')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Activity Confirmation Modal */}
        <DeleteModal
          isOpen={deleteActivityModalOpen}
          onClose={() => setDeleteActivityModalOpen(false)}
          onConfirm={confirmDeleteActivity}
          loading={deleteActivityLoading}
          customTitle={t('delete_activity_title', { type: activityToDelete?.type === RECORD_TYPES.ATTENDANCE ? t('attendance') : t('penalties') })}
          customMessage={t('delete_activity_msg', { studentName: activityToDelete?.studentName || t('this_student') })}
          t={t}
        />

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
          onExport={attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? exportStandupSummaryReport : exportSemesterReport}
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

        {/* Daily Official Export Modal */}
        <ReportExportModal
          isOpen={showDailyOfficialModal}
          onClose={() => setShowDailyOfficialModal(false)}
          reportType={REPORT_TYPE_IDS.DAILY_OFFICIAL}
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
          emailRecipients={[]}
          setEmailRecipients={() => {}}
          usersLoading={usersLoading}
          availableUsers={availableUsers}
          toggleUserSelection={toggleDailyUserSelection}
          toggleRoleSelection={toggleDailyRoleSelection}
          user={user}
          theme={theme}
          t={t}
          lang={lang}
          isExporting={isExporting}
          onExport={exportDailyOfficial}
          fetchUsersForEmail={fetchUsersForEmail}
          showError={showError}
          officialExportFormat={dailyOfficialExportFormat}
          setOfficialExportFormat={setDailyOfficialExportFormat}
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
          dateFrom={violationsDateFrom}
          setDateFrom={setViolationsDateFrom}
          dateTo={violationsDateTo}
          setDateTo={setViolationsDateTo}
          exportFormat={violationsExportFormat}
          setExportFormat={setViolationsExportFormat}
          mode={violationsModalMode}
          onExport={handleExportAttendanceViolations}
          isExporting={isExportingBehavioral}
          t={t}
          lang={lang}
        />

        {/* No Attendance Warning Modal */}
        <ConfirmModal
          isOpen={showNoAttendanceModal}
          onClose={() => setShowNoAttendanceModal(false)}
          onConfirm={() => setShowNoAttendanceModal(false)}
          title={t('note')}
          message={t('no_attendance_records_found')}
          confirmText={t('ok')}
          cancelText={t('cancel')}
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
                    <span style={{ fontWeight: 500, fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
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
