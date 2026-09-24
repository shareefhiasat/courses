import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { ChevronLeft, ChevronRight, FileText, FileSpreadsheet, CalendarDays, CalendarX, Coffee, ClipboardList, FileCheck2, FileX2, CalendarPlus, Lock, CheckCircle2, ShieldCheck, X, ExternalLink, DoorOpen, GraduationCap, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import DraggableFloatingPanel from '@components/ui/DraggableFloatingPanel';
import WelcomeDateControls from '@components/welcome/WelcomeDateControls';
import {
  OPS_VIEW_MODES,
  WELCOME_STORAGE_KEYS,
  WELCOME_COLORS,
  WELCOME_SIZES,
} from '@components/welcome/welcomeControls.constants';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import { isFeatureEnabledForUser } from '@constants/featureFlags';
import { Announcement, AnnouncementTag, AnnouncementTitle } from '@/components/kibo-ui/announcement';
import ConfirmModal from '@components/ui/Modal/ConfirmModal.jsx';
import WelcomeHeader from '@components/welcome/WelcomeHeader';
import WelcomeViolationsTab from '@components/welcome/WelcomeViolationsTab';
import WelcomeMarksTab from '@components/welcome/WelcomeMarksTab';
import WelcomeContextSwitcher from '@components/welcome/WelcomeContextSwitcher';
import ProgramTermSelector from '@components/workspace/ProgramTermSelector';
import YearTermSelector from '@components/workspace/YearTermSelector';
import OfficialWeeklyScheduleGrid from '@components/workspace/OfficialWeeklyScheduleGrid';
import ClassHistoryDrawer from '@components/workspace/ClassHistoryDrawer';
import InboxOutboxDrawer from '@components/workspace/InboxOutboxDrawer';
import ScheduleContextMenu from '@components/workspace/ScheduleContextMenu';
import ScheduleSpeedDial from '@components/workspace/ScheduleSpeedDial';
import ScheduleMarksActionsDialog from '@components/welcome/ScheduleMarksActionsDialog';
import WeeklyWorkflowCreatedDialog from '@components/welcome/WeeklyWorkflowCreatedDialog.jsx';
import OfficialReportsExportDialog from '@components/export/OfficialReportsExportDialog.jsx';
import MiniChatBalloon from '@components/ui/MiniChatBalloon/MiniChatBalloon';
import {
  Tabs, Tab, Box, Paper, Snackbar, Alert, LinearProgress,
  CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Slider, ToggleButton, ToggleButtonGroup, Divider, Checkbox, FormControlLabel,
} from '@mui/material';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import DatePicker from '@components/ui/DatePicker/DatePicker';
import {
  getInboxDocuments,
  getOutboxDocuments,
  approveDocument,
  rejectDocument,
  returnDocument,
  withdrawDocument,
} from '@services/business/attendanceWorkflowService';
import { getSubjects } from '@services/business/programService';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService';
import {
  exportDailyOfficialTemplate,
  exportDailyOfficialForDate,
  exportAttendanceOfficialForScope,
  exportWeeklyScheduleForProgram,
  exportWeeklyScheduleForScope,
} from '@services/business/accessScopeExportService.js';
import { getApprovedSnapshotForWeek, getWeekRange, getClosureStatus, closePeriod, reopenPeriod, getInProgressWeeklyWorkflow, getWeeklyWorkflowHistory } from '@services/business/workflowSnapshotService.js';
import { getScheduleStatus } from '@services/business/attendanceWorkspaceService.js';
import { initiateWeeklyWorkflow } from '@services/business/workflowInitiationService.js';
import { deleteWorkflowDocument } from '@services/business/workflowService.js';
import { openExportFile } from '@services/db/exportHistoryService.js';
import { EXPORT_FORMAT, downloadBlob } from '@services/export/official-reports/index.jsx';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData';
import { academicTermToYearTerm, getAcademicTermDisplayName } from '@utils/academicTermUtils';
import { isOnboardingTourEnabled, endManualTour } from '@utils/tourConfig.js';
import useQRPermissions from '@hooks/useQRPermissions';
import useScheduleStatusRealtime from '@hooks/useScheduleStatusRealtime.js';
import { usePermissions } from '@hooks/usePermissions';
import { getThemedIcon } from '@constants/iconTypes';
import { getWorkflowBadgeColor } from '@constants/workspaceStatusColors.js';
import {
  SCHEDULE_FONT_SCALE_DEFAULT,
  SCHEDULE_FONT_SCALE_MIN,
  SCHEDULE_FONT_SCALE_MAX,
  SCHEDULE_FONT_SCALE_STEP,
  clampScheduleFontScale,
} from '@constants/scheduleFontScale';
import AttendanceViolationsModal from '@/components/qr-scanner/AttendanceViolationsModal';
import { getAttendanceCountsFromStatus } from '@components/operations-board/boardClassCalendarUtils.js';
import { canViewParticipation } from '@components/operations-board/hrAttendancePrivacy.js';
import '../pages/operations/OperationsBoardPage.css';

const OperationsBoardPage = lazy(() => import('./operations/OperationsBoardPage.jsx'));

const WELCOME_SELECTION_KEY = 'welcome_selection';

function toIsoDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function formatSnapshotDate(value) {
  if (!value) return '—';
  const iso = typeof value === 'string' ? value.slice(0, 10) : toIsoDate(value);
  const d = new Date(`${iso}T12:00:00`);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const SCHEDULE_WORK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const SCHEDULE_ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDayDates(selectedDate, hideWeekends = true) {
  const anchor = selectedDate instanceof Date ? new Date(selectedDate) : new Date(selectedDate);
  const weekStart = new Date(anchor);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(12, 0, 0, 0);
  const days = hideWeekends ? SCHEDULE_WORK_DAYS : SCHEDULE_ALL_DAYS;
  return days.map((_, index) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + index);
    return d;
  });
}

const WelcomePage = () => {
  const { user, role, isInstructor, isAdmin, isHR, isSuperAdmin, isStudent } = useAuth();
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isRTL = lang === 'ar';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'schedule';

  const [selection, setSelection] = useState(() => {
    try {
      const saved = sessionStorage.getItem(WELCOME_SELECTION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.program?.id) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [scheduleData, setScheduleData] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const urlDate = searchParams.get('date');
    if (urlDate) {
      const parsed = new Date(`${urlDate}T12:00:00`);
      if (!isNaN(parsed.getTime())) {
        if (isInstructor) {
          const today = new Date();
          today.setHours(12, 0, 0, 0);
          if (parsed.getTime() > today.getTime()) return new Date();
        }
        return parsed;
      }
    }
    return new Date();
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clickedDate, setClickedDate] = useState(null);
  const [inboxOutboxOpen, setInboxOutboxOpen] = useState(false);
  const [inboxClassId, setInboxClassId] = useState(null);
  const [inboxInitialTab, setInboxInitialTab] = useState('inbox');
  const [historyState, setHistoryState] = useState({ open: false, classInfo: null, date: null, initialTab: null });

  const instructorId = user?.dbId;
  const canInteractAll = isAdmin || isSuperAdmin || isHR;
  const isInstructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  const hideNotesParticipation = isHR && !isAdmin && !isSuperAdmin;
  const hideNotesComments = (isHR && !isAdmin && !isSuperAdmin) || isInstructorOnly;
  const { canExport } = useQRPermissions();
  const { canAccessScreen } = usePermissions();
  const showOperationsTab = (canAccessScreen('operations') || canExport || isAdmin || isHR || isInstructor);
  const showMarksTab = isFeatureEnabledForUser('MARKS_TAB', user) && (isAdmin || isHR || isSuperAdmin || isInstructor || canExport || canAccessScreen('operations'));
  const showViolationsTab = (isAdmin || isHR || isInstructor || canExport || canAccessScreen('operations'));
  const showAiBalloon = isFeatureEnabledForUser('AI_BALLOON', user);
  const [exportingKey, setExportingKey] = useState(null);
  const [cohortClassIds, setCohortClassIds] = useState([]);
  const [cohortSubjectIds, setCohortSubjectIds] = useState([]);
  const [cohortClasses, setCohortClasses] = useState([]);
  const [weeklySelectedClassIds, setWeeklySelectedClassIds] = useState([]);
  const [weeklySnapshot, setWeeklySnapshot] = useState(null);
  const [weekClosure, setWeekClosure] = useState(null);
  const [weeklyWorkflowLoading, setWeeklyWorkflowLoading] = useState(false);
  const [weeklyInProgressWorkflow, setWeeklyInProgressWorkflow] = useState(null);
  const [weeklyWorkflowHistory, setWeeklyWorkflowHistory] = useState([]);
  const [weeklyWorkflowHistoryLoading, setWeeklyWorkflowHistoryLoading] = useState(false);
  const [opsSelectedWorkflow, setOpsSelectedWorkflow] = useState(null);

  const weeklyWorkflowMap = useMemo(() => {
    const map = {};
    const addDoc = (doc) => {
      if (!doc) return;
      const key = String(
        doc.classId
        || doc.class?.id
        || doc.scope?.classId
        || doc.metadata?.classId
        || doc.instructor?.classId
        || ''
      );
      if (key && key !== 'undefined' && key !== 'null' && !map[key]) map[key] = doc;
    };
    (weeklyWorkflowHistory || []).forEach(addDoc);
    addDoc(weeklyInProgressWorkflow);
    return map;
  }, [weeklyWorkflowHistory, weeklyInProgressWorkflow]);

  const isScheduleLocked = false;
  const isWeekAttendanceLocked = Boolean(weeklyInProgressWorkflow);
  const [closeWeekDialogOpen, setCloseWeekDialogOpen] = useState(false);
  const [initiateWeeklyDialogOpen, setInitiateWeeklyDialogOpen] = useState(false);
  const [weeklyCreatedDialogOpen, setWeeklyCreatedDialogOpen] = useState(false);
  const [weeklyCreatedResults, setWeeklyCreatedResults] = useState({ results: [], errors: [] });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState(null);
  const [marksActionsDialogOpen, setMarksActionsDialogOpen] = useState(false);
  const [cohortSubjects, setCohortSubjects] = useState([]);
  const [scheduleDayFocus, setScheduleDayFocus] = useState(() => {
    try {
      return localStorage.getItem(WELCOME_STORAGE_KEYS.SCHEDULE_DAY_FOCUS) === '1';
    } catch {
      return false;
    }
  });
  const [hideWeekends, setHideWeekends] = useState(() => {
    try {
      const saved = localStorage.getItem(WELCOME_STORAGE_KEYS.SCHEDULE_HIDE_WEEKENDS);
      return saved !== '0'; // default true (weekends hidden)
    } catch {
      return true;
    }
  });
  const [opsViewMode, setOpsViewMode] = useState(() => {
    try {
      if (isInstructor && !isAdmin && !isHR && !isSuperAdmin) return OPS_VIEW_MODES.DAY;
      const urlMode = searchParams.get('viewMode');
      if (urlMode === OPS_VIEW_MODES.WEEK || urlMode === OPS_VIEW_MODES.DAY) return urlMode;
      const stored = localStorage.getItem(WELCOME_STORAGE_KEYS.OPS_VIEW_MODE);
      return stored === OPS_VIEW_MODES.WEEK ? OPS_VIEW_MODES.WEEK : OPS_VIEW_MODES.DAY;
    } catch {
      return OPS_VIEW_MODES.DAY;
    }
  });

  // Keep the URL viewMode in sync with the operations board day/week state.
  useEffect(() => {
    if (tabParam !== 'operations') return;
    const urlMode = searchParams.get('viewMode');
    if (urlMode === opsViewMode) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('viewMode', opsViewMode);
      return next;
    });
  }, [tabParam, opsViewMode, searchParams, setSearchParams]);
  const [violationsViewMode, setViolationsViewMode] = useState(() => {
    try {
      const stored = localStorage.getItem(WELCOME_STORAGE_KEYS.VIOLATIONS_VIEW_MODE);
      return stored === OPS_VIEW_MODES.WEEK ? OPS_VIEW_MODES.WEEK : OPS_VIEW_MODES.DAY;
    } catch {
      return OPS_VIEW_MODES.DAY;
    }
  });

  // Attendance summary dialog state (reuses QR scanner's AttendanceViolationsModal)
  const [showAttSummaryModal, setShowAttSummaryModal] = useState(false);
  const [attSummaryDateFrom, setAttSummaryDateFrom] = useState('');
  const [attSummaryDateTo, setAttSummaryDateTo] = useState('');
  const [attSummarySelectedSubjects, setAttSummarySelectedSubjects] = useState([]);
  const [attSummaryViolationTypes, setAttSummaryViolationTypes] = useState({
    absentNoExcuse: true,
    absentWithExcuse: true,
    excusedLeave: true,
    late: true,
    humanCase: true,
  });
  const [attSummaryExportFormat, setAttSummaryExportFormat] = useState(EXPORT_FORMAT.PDF);
  const [attSummaryExporting, setAttSummaryExporting] = useState(false);
  const [attSummarySuccess, setAttSummarySuccess] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info', progress: null });
  const [exportBanner, setExportBanner] = useState(null);
  const exportBannerTimerRef = useRef(null);

  const clearExportBanner = useCallback(() => {
    if (exportBannerTimerRef.current) {
      clearTimeout(exportBannerTimerRef.current);
      exportBannerTimerRef.current = null;
    }
    setExportBanner(null);
  }, []);

  const showExportBanner = useCallback((banner) => {
    clearExportBanner();
    setExportBanner(banner);
    exportBannerTimerRef.current = setTimeout(() => {
      setExportBanner(null);
      exportBannerTimerRef.current = null;
    }, 10000);
  }, [clearExportBanner]);

  useEffect(() => () => {
    if (exportBannerTimerRef.current) clearTimeout(exportBannerTimerRef.current);
  }, []);
  const [runJoyride, setRunJoyride] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `welcomeTourSeen_${lang}`;
  const [contextSwitcherOpen, setContextSwitcherOpen] = useState(false);
  const [autoSelecting, setAutoSelecting] = useState(false);
  const [noPrograms, setNoPrograms] = useState(false);
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(() => {
    try { return localStorage.getItem('navbarCollapsed') === 'true'; } catch { return false; }
  });

  const visibleTabs = useMemo(() => {
    const tabs = ['schedule'];
    if (showOperationsTab) tabs.push('operations');
    if (showMarksTab) tabs.push('marks');
    if (!isInstructorOnly) tabs.push('violations');
    return tabs;
  }, [showOperationsTab, showMarksTab, isInstructorOnly]);

  const showSchedule = useMemo(() => Boolean(selection?.program && selection?.academicTerm), [selection]);

  const classIdParam = searchParams.get('classId') || null;
  const laneParam = searchParams.get('lane') || 'status';
  const activeTab = Math.max(0, visibleTabs.indexOf(visibleTabs.includes(tabParam) ? tabParam : 'schedule'));
  const boardExpanded = searchParams.get('expanded') === '1';
  const scheduleExpanded = searchParams.get('scheduleExpanded') === '1';
  const violationsExpanded = searchParams.get('violationsExpanded') === '1';
  const marksExpanded = searchParams.get('marksExpanded') === '1';
  const prevTabRef = useRef(tabParam);
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  // Backward compatibility: legacy ?tab=overview now redirects to violations
  useEffect(() => {
    if (tabParam === 'overview') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'violations');
        next.delete('view');
        return next;
      }, { replace: true });
    }
  }, [tabParam, setSearchParams]);

  const weekDayDates = useMemo(() => getWeekDayDates(selectedDate, hideWeekends), [selectedDate, hideWeekends]);

  const { refreshWeek: refreshScheduleStatus } = useScheduleStatusRealtime({
    classIds: cohortClassIds,
    weekDates: weekDayDates,
    setStatusMap,
    active: showSchedule && cohortClassIds.length > 0,
    refreshOnActivate: tabParam === 'schedule' && prevTabRef.current !== 'schedule',
  });

  useEffect(() => {
    prevTabRef.current = tabParam;
  }, [tabParam]);

  // Sync selectedDate when the URL date param changes (e.g., browser back/forward)
  useEffect(() => {
    const urlDate = searchParams.get('date');
    if (!urlDate) return;
    const parsed = new Date(`${urlDate}T12:00:00`);
    if (isNaN(parsed.getTime())) return;
    if (isInstructor) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      if (parsed.getTime() > today.getTime()) return;
    }
    const currentIso = selectedDateRef.current.toISOString().split('T')[0];
    if (urlDate !== currentIso) {
      setSelectedDate(parsed);
    }
  }, [searchParams, isInstructor]);

  const welcomeBoardContext = useMemo(() => {
    if (!selection?.program?.id || !selection?.academicTerm?.id) return null;
    // Operations tab (attendance taking) stays scoped to the instructor's own classes,
    // even though the schedule grid now shows the full program timetable.
    const scopedClasses = isInstructorOnly && instructorId
      ? cohortClasses.filter((c) => Number(c.instructorId) === Number(instructorId))
      : cohortClasses;
    return {
      programId: selection.program.id,
      termId: selection.academicTerm.id,
      date: selectedDate,
      classId: classIdParam || null,
      classIds: scopedClasses.map((c) => c.id).filter(Boolean),
      program: selection.program,
      academicTerm: selection.academicTerm,
      classes: scopedClasses,
      subjects: cohortSubjects,
    };
  }, [selection, selectedDate, cohortClasses, cohortSubjects, isInstructorOnly, instructorId, classIdParam]);

  const handleTabChange = useCallback((_, value) => {
    const targetTab = visibleTabs[value] || 'schedule';
    if (targetTab === 'operations' && isInstructorOnly && !classIdParam) {
      setSnackbar({ open: true, message: t('choose_class_today_ops') || 'Please choose a class from today\'s schedule to open Operations.', severity: 'info' });
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', targetTab);
      next.delete('view');
      if (targetTab !== 'operations') next.delete('expanded');
      if (targetTab !== 'marks') next.delete('marksExpanded');
      if (targetTab !== 'violations') next.delete('violationsExpanded');
      if (targetTab !== 'schedule') next.delete('scheduleExpanded');
      return next;
    });
  }, [setSearchParams, visibleTabs, isInstructorOnly, classIdParam, t]);

  const handleToggleBoardExpand = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'operations');
      if (next.get('expanded') === '1') next.delete('expanded');
      else {
        next.set('expanded', '1');
        next.delete('scheduleExpanded');
      }
      return next;
    });
  }, [setSearchParams]);

  const handleToggleScheduleExpand = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'schedule');
      if (next.get('scheduleExpanded') === '1') next.delete('scheduleExpanded');
      else {
        next.set('scheduleExpanded', '1');
        next.delete('expanded');
        next.delete('violationsExpanded');
      }
      return next;
    });
  }, [setSearchParams]);

  const handleToggleViolationsExpand = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'violations');
      if (next.get('violationsExpanded') === '1') next.delete('violationsExpanded');
      else {
        next.set('violationsExpanded', '1');
        next.delete('expanded');
        next.delete('scheduleExpanded');
        next.delete('marksExpanded');
      }
      return next;
    });
  }, [setSearchParams]);

  const handleToggleMarksExpand = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'marks');
      if (next.get('marksExpanded') === '1') next.delete('marksExpanded');
      else {
        next.set('marksExpanded', '1');
        next.delete('expanded');
        next.delete('scheduleExpanded');
        next.delete('violationsExpanded');
      }
      return next;
    });
  }, [setSearchParams]);

  const [scheduleFontScale, setScheduleFontScale] = useState(() => {
    try {
      const saved = localStorage.getItem('scheduleFontScale');
      return saved ? clampScheduleFontScale(parseInt(saved, 10)) : SCHEDULE_FONT_SCALE_DEFAULT;
    } catch { return SCHEDULE_FONT_SCALE_DEFAULT; }
  });

  const handleScheduleFontScaleChange = useCallback((value) => {
    const clamped = clampScheduleFontScale(value);
    setScheduleFontScale(clamped);
    try { localStorage.setItem('scheduleFontScale', String(clamped)); } catch {}
  }, []);

  const [showScheduleRoom, setShowScheduleRoom] = useState(() => {
    try {
      const saved = localStorage.getItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_ROOM);
      return saved ? saved !== 'false' : true;
    } catch { return true; }
  });

  const [showScheduleInstructor, setShowScheduleInstructor] = useState(() => {
    try {
      const saved = localStorage.getItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_INSTRUCTOR);
      return saved ? saved !== 'false' : true;
    } catch { return true; }
  });

  const [showDayDate, setShowDayDate] = useState(() => {
    try {
      const saved = localStorage.getItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_DAY_DATE);
      return saved ? saved !== 'false' : true;
    } catch { return true; }
  });

  const [showBreakColumns, setShowBreakColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_BREAK_COLUMNS);
      return saved ? saved !== 'false' : true;
    } catch { return true; }
  });

  const handleToggleScheduleRoom = useCallback(() => {
    setShowScheduleRoom((prev) => {
      const next = !prev;
      try { localStorage.setItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_ROOM, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleToggleScheduleInstructor = useCallback(() => {
    setShowScheduleInstructor((prev) => {
      const next = !prev;
      try { localStorage.setItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_INSTRUCTOR, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleToggleDayDate = useCallback(() => {
    setShowDayDate((prev) => {
      const next = !prev;
      try { localStorage.setItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_DAY_DATE, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleToggleBreakColumns = useCallback(() => {
    setShowBreakColumns((prev) => {
      const next = !prev;
      try { localStorage.setItem(WELCOME_STORAGE_KEYS.SCHEDULE_SHOW_BREAK_COLUMNS, String(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(WELCOME_STORAGE_KEYS.SCHEDULE_DAY_FOCUS, scheduleDayFocus ? '1' : '0'); } catch {}
  }, [scheduleDayFocus]);

  useEffect(() => {
    try { localStorage.setItem(WELCOME_STORAGE_KEYS.SCHEDULE_HIDE_WEEKENDS, hideWeekends ? '1' : '0'); } catch {}
  }, [hideWeekends]);

  const actionGroupSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.25,
    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: (theme) => `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : theme.palette.divider}`,
    borderRadius: '10px',
    p: '2px',
  };

  const scheduleToggles = (
    <ToggleButtonGroup
      value={[
        showScheduleRoom && 'room',
        showScheduleInstructor && 'instructor',
        showDayDate && 'dayDate',
        showBreakColumns && 'breakColumns',
        !hideWeekends && 'weekends',
      ].filter(Boolean)}
      onChange={(_, newValue) => {
        const nextRoom = newValue.includes('room');
        const nextInstructor = newValue.includes('instructor');
        const nextDayDate = newValue.includes('dayDate');
        const nextBreakColumns = newValue.includes('breakColumns');
        const nextWeekends = newValue.includes('weekends');
        if (nextRoom !== showScheduleRoom) handleToggleScheduleRoom();
        if (nextInstructor !== showScheduleInstructor) handleToggleScheduleInstructor();
        if (nextDayDate !== showDayDate) handleToggleDayDate();
        if (nextBreakColumns !== showBreakColumns) handleToggleBreakColumns();
        if (nextWeekends === hideWeekends) setHideWeekends(!nextWeekends);
      }}
      size="small"
      aria-label={t('schedule_columns')}
      sx={{
        display: 'flex',
        gap: 0.25,
        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderRadius: '10px',
        p: '2px',
        border: (theme) => `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : theme.palette.divider}`,
        '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: '8px !important', mx: 0 },
      }}
    >
      <ColoredTooltip title={showScheduleRoom ? t('hide_room') : t('show_room')}>
        <ToggleButton
          value="room"
          sx={{
            p: 0.5,
            minWidth: 28,
            color: isDark ? '#94a3b8' : '#64748b',
            '&.Mui-selected': {
              bgcolor: isDark ? 'rgba(255,255,255,0.14)' : '#fff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DoorOpen size={14} />
        </ToggleButton>
      </ColoredTooltip>
      <ColoredTooltip title={showScheduleInstructor ? t('hide_instructor') : t('show_instructor')}>
        <ToggleButton
          value="instructor"
          sx={{
            p: 0.5,
            minWidth: 28,
            color: isDark ? '#94a3b8' : '#64748b',
            '&.Mui-selected': {
              bgcolor: isDark ? 'rgba(255,255,255,0.14)' : '#fff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            },
          }}
        >
          <GraduationCap size={14} />
        </ToggleButton>
      </ColoredTooltip>
      <ColoredTooltip title={showDayDate ? t('hide_day_date') : t('show_day_date')}>
        <ToggleButton
          value="dayDate"
          sx={{
            p: 0.5,
            minWidth: 28,
            color: isDark ? '#94a3b8' : '#64748b',
            '&.Mui-selected': {
              bgcolor: isDark ? 'rgba(255,255,255,0.14)' : '#fff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            },
          }}
        >
          <CalendarX size={14} />
        </ToggleButton>
      </ColoredTooltip>
      <ColoredTooltip title={showBreakColumns ? t('hide_break_columns') : t('show_break_columns')}>
        <ToggleButton
          value="breakColumns"
          sx={{
            p: 0.5,
            minWidth: 28,
            color: isDark ? '#94a3b8' : '#64748b',
            '&.Mui-selected': {
              bgcolor: isDark ? 'rgba(255,255,255,0.14)' : '#fff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            },
          }}
        >
          <Coffee size={14} />
        </ToggleButton>
      </ColoredTooltip>
      <ColoredTooltip title={hideWeekends ? t('show_weekends') : t('hide_weekends')}>
        <ToggleButton
          value="weekends"
          sx={{
            p: 0.5,
            minWidth: 28,
            color: isDark ? '#94a3b8' : '#64748b',
            '&.Mui-selected': {
              bgcolor: isDark ? 'rgba(255,255,255,0.14)' : '#fff',
              color: isDark ? '#f1f5f9' : '#1e293b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            },
          }}
        >
          <CalendarDays size={14} />
        </ToggleButton>
      </ColoredTooltip>
    </ToggleButtonGroup>
  );

  useEffect(() => {
    const showFontSlider = (showSchedule && (tabParam === 'schedule' || tabParam === 'violations')) || tabParam === 'operations';
    window.dispatchEvent(new CustomEvent('welcome-schedule-font', {
      detail: showFontSlider
        ? {
          scale: scheduleFontScale,
          min: SCHEDULE_FONT_SCALE_MIN,
          max: SCHEDULE_FONT_SCALE_MAX,
          step: SCHEDULE_FONT_SCALE_STEP,
        }
        : null,
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('welcome-schedule-font', { detail: null }));
    };
  }, [showSchedule, tabParam, scheduleFontScale]);

  useEffect(() => {
    const onFontChange = (e) => {
      if (e.detail != null) handleScheduleFontScaleChange(e.detail);
    };
    window.addEventListener('welcome-schedule-font-change', onFontChange);
    return () => window.removeEventListener('welcome-schedule-font-change', onFontChange);
  }, [handleScheduleFontScaleChange]);

  const openOperationsTab = useCallback((extraParams = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'operations');
      Object.entries(extraParams).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    });
  }, [setSearchParams]);

  const handleOpenOperations = useCallback((extraParams = {}) => {
    const { viewMode, ...params } = extraParams;
    if (params.date) {
      const parsed = new Date(`${params.date}T12:00:00`);
      if (!isNaN(parsed.getTime())) setSelectedDate(parsed);
    }
    if (viewMode === 'week' || viewMode === 'day') {
      const mode = viewMode === 'week' ? OPS_VIEW_MODES.WEEK : OPS_VIEW_MODES.DAY;
      setOpsViewMode(mode);
      try { localStorage.setItem(WELCOME_STORAGE_KEYS.OPS_VIEW_MODE, mode); } catch {}
      params.viewMode = mode;
    }
    openOperationsTab(params);
  }, [openOperationsTab]);

  const effectiveRole = useMemo(() => {
    if (isSuperAdmin) return ROLE_STRINGS.SUPER_ADMIN;
    if (isAdmin) return ROLE_STRINGS.ADMIN;
    if (isHR) return ROLE_STRINGS.HR;
    if (isInstructor) return ROLE_STRINGS.INSTRUCTOR;
    if (isStudent) return ROLE_STRINGS.STUDENT;
    return role;
  }, [isSuperAdmin, isAdmin, isHR, isInstructor, isStudent, role]);

  useEffect(() => {
    if (isStudent) {
      navigate('/', { replace: true });
    }
  }, [isStudent, navigate]);

  // Auto-select first program + latest active term on mount
  useEffect(() => {
    const autoSelect = async () => {
      // If we already have a selection with both program and term, keep it and sync URL
      if (selection?.program && selection?.academicTerm) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('programId', String(selection.program.id));
          next.set('termId', String(selection.academicTerm.id));
          return next;
        });
        return;
      }
      // If we have a saved program but no term, keep the program and sync URL
      if (selection?.program) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('programId', String(selection.program.id));
          return next;
        });
        return;
      }
      setAutoSelecting(true);
      try {
        const progResult = isInstructor ? await getInstructorPrograms() : await getAllPrograms();
        if (!progResult.success || !progResult.data?.length) { setNoPrograms(true); setAutoSelecting(false); return; }
        const firstProgram = progResult.data[0];
        const termResult = await getProgramTerms(firstProgram.id, { all: isAdmin || isSuperAdmin });
        if (!termResult.success || !termResult.data?.length) {
          persistSelection({ program: firstProgram });
          setSearchParams({ programId: String(firstProgram.id) });
          setAutoSelecting(false);
          return;
        }
        const activeTerm = termResult.data.find((t) => t.isActive) || termResult.data[0];
        persistSelection({ program: firstProgram, academicTerm: activeTerm });
        setSearchParams({ programId: String(firstProgram.id), termId: String(activeTerm.id) });
      } catch {
        // ignore — fall back to wizard
      } finally {
        setAutoSelecting(false);
      }
    };
    autoSelect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistSelection = useCallback((next) => {
    setSelection(next);
    try {
      sessionStorage.setItem(WELCOME_SELECTION_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const handleResetSelection = useCallback(() => {
    sessionStorage.removeItem(WELCOME_SELECTION_KEY);
    setSelection(null);
    setScheduleData(null);
    setStatusMap({});
    setSearchParams({});
  }, [setSearchParams]);

  const handleProgramSelect = useCallback((payload) => {
    const next = { program: payload.program };
    persistSelection(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('programId', String(payload.program.id));
      params.delete('termId');
      return params;
    });
  }, [setSearchParams, persistSelection]);

  const handleTermSelect = useCallback((payload) => {
    const next = { program: payload.program, academicTerm: payload.academicTerm };
    persistSelection(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('programId', String(payload.program.id));
      params.set('termId', String(payload.academicTerm.id));
      return params;
    });
    setContextSwitcherOpen(false);
  }, [setSearchParams, persistSelection]);

  const handleBackToProgram = useCallback(() => {
    const next = selection ? { ...selection, academicTerm: null } : null;
    persistSelection(next);
    setScheduleData(null);
    setStatusMap({});
    if (next?.program?.id) {
      setSearchParams({ programId: String(next.program.id) });
    } else {
      setSearchParams({});
    }
  }, [selection, setSearchParams, persistSelection]);

  const handleBackToTerm = useCallback(() => {
    setScheduleData(null);
    setStatusMap({});
    if (selection?.program?.id) {
      setSearchParams({ programId: String(selection.program.id) });
    } else {
      setSearchParams({});
    }
  }, [selection, setSearchParams]);

  // Sync page height with navbar collapse state
  useEffect(() => {
    const handleNavbarToggle = (e) => {
      setIsNavbarCollapsed(e.detail.collapsed);
      document.documentElement.style.setProperty('--navbar-height', e.detail.collapsed ? '0px' : '60px');
    };
    document.documentElement.style.setProperty('--navbar-height', isNavbarCollapsed ? '0px' : '60px');
    window.addEventListener('navbar:toggle', handleNavbarToggle);
    return () => {
      window.removeEventListener('navbar:toggle', handleNavbarToggle);
      document.documentElement.style.removeProperty('--navbar-height');
    };
  }, [isNavbarCollapsed]);

  // Listen for navbar request to change selection
  useEffect(() => {
    const onReset = () => handleResetSelection();
    const onOpenSwitcher = () => setContextSwitcherOpen(true);
    window.addEventListener('welcome-reset-selection', onReset);
    window.addEventListener('welcome-open-context-switcher', onOpenSwitcher);
    return () => {
      window.removeEventListener('welcome-reset-selection', onReset);
      window.removeEventListener('welcome-open-context-switcher', onOpenSwitcher);
    };
  }, [handleResetSelection]);

  // ── Guided Tour ──────────────────────────────────────────────────────────
  const buildTourSteps = useCallback(() => [
    { target: '#welcome-navbar-title', content: t('tour_change_program_term') || 'Click here any time to change the program or term.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="welcome-tabs"]', content: t('tour_welcome_tabs') || 'Switch between the Schedule, Violations, and Operations tabs.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="welcome-week-nav"]', content: t('tour_welcome_week_nav') || 'Use the arrows to move between weeks.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="welcome-schedule-grid"]', content: t('tour_schedule_grid') || 'Click or double-click a class cell to open actions.', disableBeacon: true, placement: 'top' },
    ...(showOperationsTab ? [{ target: '[data-tour="welcome-operations-tab"]', content: t('tour_welcome_operations') || 'The Operations tab shows the attendance and workflow board for the selected date.', disableBeacon: true, placement: 'top' }] : []),
  ].filter(s => !!document.querySelector(s.target)), [t, showOperationsTab]);

  const startTour = useCallback(() => {
    if (!isOnboardingTourEnabled()) return;
    const steps = buildTourSteps();
    if (!steps.length) return;
    setTourSteps(steps);
    setRunJoyride(true);
  }, [buildTourSteps]);

  useEffect(() => {
    const start = () => startTour();
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, [startTour]);

  useEffect(() => {
    if (!showSchedule) return;
    try {
      if (localStorage.getItem(tourSeenKey)) return;
      const timer = setTimeout(() => startTour(), 600);
      return () => clearTimeout(timer);
    } catch {
      // ignore
    }
  }, [showSchedule, tourSeenKey, startTour]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunJoyride(false);
      window.__joyrideActive = false;
      endManualTour();
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    } else if (status === 'running') {
      window.__joyrideActive = true;
    }
  }, [tourSeenKey]);

  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const programName = selection?.program
      ? (lang === 'ar' && selection.program.nameAr ? selection.program.nameAr : selection.program.nameEn)
      : null;
    const termLabel = selection?.academicTerm
      ? getAcademicTermDisplayName(selection.academicTerm, lang)
      : null;
    const classId = searchParams.get('classId') || null;
    let className = null;
    const classOptions = [];
    if (classId && scheduleData && !isInstructorOnly) {
      const isDayView = opsViewMode === OPS_VIEW_MODES.DAY;
      const seen = new Map();
      for (const day of scheduleData.days || []) {
        if (isDayView && toIsoDate(day.date) !== selectedDate) continue;
        for (const slot of Object.values(day.slots || {})) {
          if (!slot || !slot.classId) continue;
          if (String(slot.classId) === String(classId) && !className) {
            className = lang === 'ar' ? (slot.class?.nameAr || slot.subjectName) : (slot.class?.nameEn || slot.subjectName);
          }
          if (!seen.has(slot.classId)) {
            const label = lang === 'ar' ? (slot.class?.nameAr || slot.subjectName) : (slot.class?.nameEn || slot.subjectName);
            seen.set(slot.classId, { value: String(slot.classId), label });
          }
        }
      }
      classOptions.push(...Array.from(seen.values()));
    }
    window.dispatchEvent(new CustomEvent('welcome-wizard-nav', {
      detail: { programName, termLabel, workingDate: selectedDate, tab: tabParam, classId, className, classOptions, viewMode: opsViewMode },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('welcome-wizard-nav', { detail: null }));
    };
  }, [selection, lang, selectedDate, tabParam, searchParams, scheduleData, isInstructorOnly, opsViewMode, cohortClasses]);

  const selectedWeekKey = useMemo(() => {
    const anchor = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    const weekStart = new Date(anchor);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return toIsoDate(weekStart);
  }, [selectedDate]);

  // Load schedule data when program and term are selected
  useEffect(() => {
    if (!selection?.program?.id || !selection?.academicTerm?.id) return;

    const loadSchedule = async () => {
      setLoading(true);
      const { year, term } = academicTermToYearTerm(selection.academicTerm);

      const sources = await loadWeeklyScheduleSources({
        programId: selection.program.id,
        year,
        term,
        academicTermId: selection.academicTerm.id,
        academicTermCode: selection.academicTerm.code,
      });

      const programName = lang === 'ar' && selection.program.nameAr
        ? selection.program.nameAr
        : selection.program.nameEn;

      const prepared = prepareWeeklyScheduleData({
        metadata: { programId: selection.program.id, programName, year, term },
        lang,
        t,
        sessions: sources.sessions,
        breakSessions: sources.breakSessions,
        instructorAvailability: sources.instructorAvailability,
        timeSlots: sources.timeSlots,
        attachSessionMeta: true,
        hideWeekends,
      });

      setScheduleData(prepared);

      setCohortClasses(sources.cohortClasses || []);
      const classIds = (sources.cohortClasses || []).map((c) => c.id).filter(Boolean);
      setCohortClassIds(classIds);
      setWeeklySelectedClassIds(classIds);
      const subjectIds = [...new Set((sources.cohortClasses || []).map((c) => c.subjectId).filter(Boolean))];
      setCohortSubjectIds(subjectIds);

      // Fetch subject objects for the modal's subject picker
      if (subjectIds.length > 0 && selection?.program?.id) {
        try {
          const subjectsRes = await getSubjects({ programId: selection.program.id });
          const allSubjects = subjectsRes?.success ? (subjectsRes.data || []) : [];
          const filtered = allSubjects.filter((s) => subjectIds.some((id) => String(id) === String(s.id)));
          setCohortSubjects(filtered);
        } catch {
          setCohortSubjects([]);
        }
      } else {
        setCohortSubjects([]);
      }
      if (classIds.length > 0) {
        const weekDates = getWeekDayDates(selectedDate, hideWeekends);
        const results = await Promise.all(weekDates.map((d) => getScheduleStatus(classIds, d)));
        const combined = {};
        results.forEach((result, index) => {
          if (!result.success || !result.data) return;
          const iso = toIsoDate(weekDates[index]);
          Object.entries(result.data).forEach(([classId, status]) => {
            combined[`${iso}:${classId}`] = status;
          });
        });
        setStatusMap(combined);
      } else {
        setStatusMap({});
        setCohortClassIds([]);
        setCohortSubjectIds([]);
      }
      setLoading(false);
    };

    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload per week, not per day
  }, [selection?.program, selection?.academicTerm, selectedWeekKey, lang, t, hideWeekends, tabParam]);

  useEffect(() => {
    setSelectedSlot(null);
    setSelectedSession(null);
    setMenuAnchorEl(null);
  }, [selectedWeekKey]);

  const handleCellClick = useCallback((slot, anchor, openMenu = true) => {
    if (isScheduleLocked) return;
    const session = slot?.session || (slot?.class ? {
      id: slot.sessionId,
      classId: slot.classId,
      class: slot.class,
      sessionType: slot.sessionType || 'lecture',
      instructor: slot.instructor,
    } : null);
    if (!session) return;

    // Instructors can navigate to past weeks to view participation, but cannot act on past/future classes.
    if (isInstructorOnly) {
      const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOffset = DAY_CODES.indexOf(slot?.dayCode);
      let cellDate = selectedDate;
      if (dayOffset >= 0) {
        const weekStart = new Date(selectedDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        cellDate = new Date(weekStart);
        cellDate.setDate(cellDate.getDate() + dayOffset);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cellDay = new Date(cellDate);
      cellDay.setHours(0, 0, 0, 0);
      if (cellDay.getTime() !== today.getTime()) {
        return;
      }
    }

    setSelectedSession(session);
    setSelectedSlot({
      classId: session.classId,
      dayCode: slot?.dayCode,
      colKey: slot?.colKey,
    });

    // Compute the actual calendar date from the clicked cell's dayCode
    const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOffset = DAY_CODES.indexOf(slot?.dayCode);
    let cellDate = selectedDate;
    if (dayOffset >= 0) {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      cellDate = new Date(weekStart);
      cellDate.setDate(cellDate.getDate() + dayOffset);
      setClickedDate(cellDate);
    } else {
      setClickedDate(selectedDate);
    }

    if (session.classId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('classId', String(session.classId));
        if (!isInstructor) next.set('date', toIsoDate(cellDate));
        return next;
      });
    }
    if (openMenu && anchor && typeof anchor.x === 'number' && !isInstructorOnly) {
      const virtualEl = document.createElement('div');
      virtualEl.style.position = 'fixed';
      virtualEl.style.left = `${anchor.x}px`;
      virtualEl.style.top = `${anchor.y}px`;
      virtualEl.style.width = '0';
      virtualEl.style.height = '0';
      document.body.appendChild(virtualEl);
      setMenuAnchorEl(virtualEl);
    }
  }, [setSearchParams, selectedDate, isInstructorOnly, isInstructor, isScheduleLocked]);

  const handleWorkflowIconClick = useCallback((status) => {
    if (!status?.workflowDocumentId) return;
    const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOffset = DAY_CODES.indexOf(status?.dayCode);
    let cellDate = selectedDate;
    if (dayOffset >= 0) {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      cellDate = new Date(weekStart);
      cellDate.setDate(cellDate.getDate() + dayOffset);
    }
    const dateIso = toIsoDate(cellDate);
    setOpsViewMode(OPS_VIEW_MODES.DAY);
    try { localStorage.setItem(WELCOME_STORAGE_KEYS.OPS_VIEW_MODE, OPS_VIEW_MODES.DAY); } catch {}
    openOperationsTab({
      lane: 'status',
      classId: status?.classId,
      date: dateIso,
      workflowId: String(status.workflowDocumentId),
      _t: String(Date.now()),
    });
  }, [openOperationsTab, selectedDate]);

  const handleWeeklyWorkflowIconClick = useCallback((doc, extra = {}) => {
    if (!doc?.id) return;
    const classId = doc.classId || extra?.classId || doc.class?.id || null;
    const { weekFrom } = getWeekRange(selectedDate);
    setOpsViewMode(OPS_VIEW_MODES.WEEK);
    try { localStorage.setItem(WELCOME_STORAGE_KEYS.OPS_VIEW_MODE, OPS_VIEW_MODES.WEEK); } catch {}
    openOperationsTab({
      lane: 'status',
      classId,
      date: weekFrom,
      workflowId: String(doc.id),
      _t: String(Date.now()),
    });
  }, [openOperationsTab, selectedDate]);

  // Allow double-clicking another schedule cell to open its menu even when a menu is already open.
  // The MUI menu backdrop consumes the first click, so the cell's own onDoubleClick may not fire.
  useEffect(() => {
    if (!showSchedule) return undefined;
    const onDblClick = (e) => {
      const button = e.target.closest?.('[data-testid^="schedule-cell-"]');
      if (!button) return;
      const raw = button.getAttribute('data-slot');
      if (!raw) return;
      try {
        const slot = JSON.parse(raw);
        if (!slot) return;
        e.preventDefault();
        e.stopPropagation();
        handleCellClick(slot, { x: e.clientX, y: e.clientY }, true);
      } catch {
        // ignore parse errors
      }
    };
    document.addEventListener('dblclick', onDblClick, true);
    return () => document.removeEventListener('dblclick', onDblClick, true);
  }, [showSchedule, handleCellClick]);

  const handleCloseClassMenu = useCallback(() => {
    setMenuAnchorEl((prev) => {
      if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
      return null;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedSession(null);
    setSelectedSlot(null);
    setClickedDate(null);
  }, []);

  const handleSetSelectedDate = useCallback((date) => {
    const d = date instanceof Date ? new Date(date) : new Date();
    d.setHours(12, 0, 0, 0);
    if (isInstructorOnly) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      if (d.getTime() > today.getTime()) {
        d.setTime(today.getTime());
      }
    }
    setSelectedDate(d);
    if (isInstructorOnly) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('date', toIsoDate(d));
        return next;
      }, { replace: true });
    }
  }, [isInstructorOnly, setSelectedDate, setSearchParams]);

  const handleOpenInbox = useCallback((tab, classId) => {
    setInboxInitialTab(tab);
    setInboxClassId(classId ?? null);
    setInboxOutboxOpen(true);
  }, []);

  const handleOpenHistory = useCallback((classInfo, date, initialTab = 'lecture') => {
    setHistoryState({ open: true, classInfo, date, initialTab });
  }, []);

  const handleOpenNotifications = useCallback((filters = {}) => {
    window.dispatchEvent(new CustomEvent('app:open-notifications', { detail: filters }));
  }, []);

  const handleExportWeeklySchedule = useCallback(async (format) => {
    if (!selection?.program || !selection?.academicTerm) {
      setSnackbar({
        open: true,
        message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — select program and term first`,
        severity: 'warning',
        progress: null,
      });
      return;
    }
    try {
      const { year, term } = academicTermToYearTerm(selection.academicTerm);
      const selectedCls = selectedSession?.class || null;
      const result = selectedCls
        ? await exportWeeklyScheduleForScope({
            cls: selectedCls,
            program: selection.program,
            academicTerm: selection.academicTerm,
            year,
            term,
            lang,
            t,
            user,
            format,
            skipDownload: true,
          })
        : await exportWeeklyScheduleForProgram({
            program: selection.program,
            academicTerm: selection.academicTerm,
            year,
            term,
            lang,
            t,
            user,
            format,
            skipDownload: true,
          });
      const blobUrl = URL.createObjectURL(result.blob);
      showExportBanner({
        pillColor: '#059669',
        icon: <CheckCircle2 size={16} className="shrink-0" />,
        message: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0px', fontSize: '0.75rem' }}>
            {`${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — ${t('export_success')}`}
            <button
              type="button"
              className="inline-flex items-center gap-0.5 rounded-md text-xs font-semibold px-1.5 py-0.5 hover:bg-white/25 transition-colors"
              onClick={() =>
                format === EXPORT_FORMAT.EXCEL
                  ? downloadBlob(result.blob, `${result.filename}.xlsx`)
                  : window.open(blobUrl, '_blank')
              }
              style={{ marginLeft: '8px' }}
              aria-label={
                format === EXPORT_FORMAT.EXCEL
                  ? (t('download_file') || 'Download file')
                  : (t('open_in_new_tab') || 'Open in new tab')
              }
            >
              <ExternalLink size={14} />
            </button>
          </span>
        ),
      });
      // Clean up blob URL after some time
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error('[WelcomePage] weekly schedule export failed:', err);
      setSnackbar({
        open: true,
        message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — ${t('export_failed') || 'Export failed'}`,
        severity: 'error',
        progress: null,
      });
    }
  }, [selection?.program, selection?.academicTerm, selectedSession, lang, t, user, showExportBanner]);

  const handleExportDailyTemplate = useCallback(async (format = EXPORT_FORMAT.PDF, options = {}) => {
    if (!selection?.program || !selection?.academicTerm) {
      setSnackbar({
        open: true,
        message: `${t('daily_template') || 'Daily Template'} — ${t('welcome_select_program_term_first') || 'select program and term first'}`,
        severity: 'warning',
        progress: null,
      });
      return;
    }
    // Use selected class from schedule if available, otherwise blank template
    const selectedCls = selectedSession?.class || null;
    setExportingKey('daily-template-excel');
    try {
      const result = await exportDailyOfficialTemplate({
        cls: selectedCls || { id: null, programId: selection.program.id },
        program: selection.program,
        subject: selectedCls?.subject || null,
        academicTerm: selection.academicTerm,
        lang,
        user,
        format,
        instructorName: selectedSession?.instructor || null,
        skipDownload: true,
        includeNotes: options.includeNotes === true,
        includeParticipation: options.includeParticipation === true,
      });
      // Close the progress snackbar and show the success banner
      setSnackbar({ open: false, message: '', severity: 'info', progress: null });
      const blobUrl = URL.createObjectURL(result.blob);
      // Show bottom announcement banner with link
      showExportBanner({
        pillColor: '#059669',
        icon: <CheckCircle2 size={16} className="shrink-0" />,
        message: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0px', fontSize: '0.75rem' }}>
            {`${t('daily_template') || 'Daily Template'} — ${t('export_success') || 'Export successful'}`}
            <button
              type="button"
              className="inline-flex items-center gap-0.5 rounded-md text-xs font-semibold px-1.5 py-0.5 hover:bg-white/25 transition-colors"
              onClick={() =>
                format === EXPORT_FORMAT.EXCEL
                  ? downloadBlob(result.blob, `${result.filename}.xlsx`)
                  : window.open(blobUrl, '_blank')
              }
              style={{ marginLeft: '8px' }}
              aria-label={
                format === EXPORT_FORMAT.EXCEL
                  ? (t('download_file') || 'Download file')
                  : (t('open_in_new_tab') || 'Open in new tab')
              }
            >
              <ExternalLink size={14} />
            </button>
          </span>
        ),
      });
      // Clean up blob URL after some time
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error('[WelcomePage] export daily template failed:', err);
      setSnackbar({
        open: true,
        message: `${t('daily_template') || 'Daily Template'} — ${t('export_failed') || 'Export failed'}`,
        severity: 'error',
        progress: null,
      });
    } finally {
      setExportingKey(null);
    }
  }, [selection?.program, selection?.academicTerm, selectedSession, lang, user, t, showExportBanner]);

  const handleOpsWorkflowExport = useCallback(async (format) => {
    if (!opsSelectedWorkflow || !welcomeBoardContext?.program) return;
    const selectedClass = welcomeBoardContext.classes?.find(
      (c) => String(c.id) === String(opsSelectedWorkflow.classId),
    );
    const isWeekly = opsSelectedWorkflow.workflowType === 'ATTENDANCE_WEEKLY' || opsSelectedWorkflow.attendanceSubtype === 'WEEKLY_SUMMARY';
    const isDaily = opsSelectedWorkflow.workflowType === 'ATTENDANCE_DAILY' || opsSelectedWorkflow.attendanceSubtype === 'DAILY';
    if (!isWeekly && !isDaily) return;

    try {
      if (isWeekly) {
        const subjectId = opsSelectedWorkflow.subjectId || selectedClass?.subjectId;
        if (!subjectId) return;
        const programName = lang === 'ar'
          ? welcomeBoardContext.program.nameAr || welcomeBoardContext.program.nameEn
          : welcomeBoardContext.program.nameEn || welcomeBoardContext.program.nameAr;
        const result = await exportAttendanceOfficialForScope({
          subjectIds: [subjectId],
          violationTypes: {
            absentNoExcuse: true,
            absentWithExcuse: true,
            excusedLeave: true,
            late: true,
            humanCase: true,
          },
          dateFrom: opsSelectedWorkflow.dateFrom,
          dateTo: opsSelectedWorkflow.dateTo,
          programId: opsSelectedWorkflow.programId || welcomeBoardContext.programId,
          programName,
          lang,
          user,
          format,
          preview: opsSelectedWorkflow.status !== 'APPROVED',
          skipPersist: opsSelectedWorkflow.status !== 'APPROVED',
          download: false,
          classIds: [opsSelectedWorkflow.classId],
          workflowStatus: opsSelectedWorkflow.status || null,
          approvedBy: opsSelectedWorkflow.approvedBy || null,
          approvedAt: opsSelectedWorkflow.approvedAt || null,
        });
        if (format === EXPORT_FORMAT.EXCEL) {
          downloadBlob(result.blob, `${result.filename}.xlsx`);
        } else {
          window.open(result.blobUrl, '_blank');
        }
      } else {
        const cls = selectedClass || {
          id: opsSelectedWorkflow.classId,
          nameEn: opsSelectedWorkflow.className,
          nameAr: opsSelectedWorkflow.classNameAr || opsSelectedWorkflow.className,
          code: opsSelectedWorkflow.classCode || opsSelectedWorkflow.className,
          programId: opsSelectedWorkflow.programId || welcomeBoardContext.programId,
          subjectId: opsSelectedWorkflow.subjectId,
        };
        const subject = selectedClass?.subject || (opsSelectedWorkflow.subjectId ? { id: opsSelectedWorkflow.subjectId, nameEn: opsSelectedWorkflow.subjectName, nameAr: opsSelectedWorkflow.subjectName } : null);
        const date = opsSelectedWorkflow.date
          ? (typeof opsSelectedWorkflow.date === 'string' ? opsSelectedWorkflow.date.slice(0, 10) : new Date(opsSelectedWorkflow.date).toISOString().slice(0, 10))
          : selectedDate.toISOString().slice(0, 10);
        const result = await exportDailyOfficialForDate({
          cls,
          program: welcomeBoardContext.program,
          subject,
          academicTerm: welcomeBoardContext.academicTerm,
          lang,
          user,
          date,
          format,
          skipDownload: true,
          skipPersist: true,
          workflowStatus: opsSelectedWorkflow.status || null,
          approvedBy: opsSelectedWorkflow.approvedBy || null,
          approvedAt: opsSelectedWorkflow.approvedAt || null,
        });
        const blobUrl = URL.createObjectURL(result.blob);
        if (format === EXPORT_FORMAT.EXCEL) {
          downloadBlob(result.blob, `${result.filename}.xlsx`);
        } else {
          window.open(blobUrl, '_blank');
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
    } catch (err) {
      console.error('[WelcomePage] operations workflow export failed:', err);
    }
  }, [opsSelectedWorkflow, welcomeBoardContext, lang, user, selectedDate]);

  // Fetch the latest approved weekly attendance violation snapshot and closure status for the selected week (HR/Admin only)
  useEffect(() => {
    if (!isHR && !isAdmin && !isSuperAdmin) return;
    if (!selectedDate) return;
    const { weekFrom, weekTo } = getWeekRange(selectedDate);
    let cancelled = false;
    Promise.all([
      getApprovedSnapshotForWeek({ weekFrom, weekTo, programId: selection?.program?.id }),
      getClosureStatus({ dateFrom: weekFrom, dateTo: weekTo, scopeType: 'PROGRAM', programId: selection?.program?.id }),
      getInProgressWeeklyWorkflow({ weekFrom, weekTo, programId: selection?.program?.id }),
    ]).then(([snapRes, closureRes, inProgressRes]) => {
      if (!cancelled) {
        setWeeklySnapshot(snapRes?.data || null);
        setWeekClosure(closureRes?.data || null);
        setWeeklyInProgressWorkflow(inProgressRes?.data || null);
      }
    }).catch(() => {
      if (!cancelled) {
        setWeeklySnapshot(null);
        setWeekClosure(null);
        setWeeklyInProgressWorkflow(null);
      }
    });
    return () => { cancelled = true; };
  }, [selectedDate, isHR, isAdmin, isSuperAdmin, selection?.program?.id]);

  const openWeeklySnapshot = useCallback(() => {
    if (weeklySnapshot?.snapshotFile?.id) {
      window.open(`/api/v1/drive/files/${weeklySnapshot.snapshotFile.id}/download`, '_blank');
    } else if (weeklySnapshot?.snapshotFileId) {
      window.open(`/api/v1/drive/files/${weeklySnapshot.snapshotFileId}/download`, '_blank');
    } else if (weeklySnapshot?.file?.id) {
      window.open(`/api/v1/drive/files/${weeklySnapshot.file.id}/download`, '_blank');
    } else if (weeklySnapshot?.fileId) {
      window.open(`/api/v1/drive/files/${weeklySnapshot.fileId}/download`, '_blank');
    } else if (weeklyInProgressWorkflow?.snapshotFileId) {
      window.open(`/api/v1/drive/files/${weeklyInProgressWorkflow.snapshotFileId}/download`, '_blank');
    } else if (weeklyInProgressWorkflow?.file?.id) {
      window.open(`/api/v1/drive/files/${weeklyInProgressWorkflow.file.id}/download`, '_blank');
    }
  }, [weeklySnapshot, weeklyInProgressWorkflow]);

  const getWeeklyWorkflowStatusColor = useCallback((status) => {
    switch (status) {
      case 'DRAFT': return '#9ca3af';
      case 'SUBMITTED': return '#eab308';
      case 'UNDER_ADMIN_REVIEW': return '#f59e0b';
      case 'UNDER_HR_REVIEW': return '#f97316';
      case 'APPROVED': return '#16a34a';
      case 'REJECTED': return '#dc2626';
      default: return '#9ca3af';
    }
  }, []);

  const goToWeeklyWorkflowOnBoard = useCallback(() => {
    console.log('[WelcomePage] goToWeeklyWorkflowOnBoard deleting classId');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'operations');
      next.set('lane', 'status');
      next.set('date', toIsoDate(selectedDate));
      next.set('viewMode', OPS_VIEW_MODES.WEEK);
      next.delete('classId');
      return next;
    });
    setOpsViewMode(OPS_VIEW_MODES.WEEK);
    try { localStorage.setItem(WELCOME_STORAGE_KEYS.OPS_VIEW_MODE, OPS_VIEW_MODES.WEEK); } catch {}
  }, [selectedDate, setSearchParams, setOpsViewMode]);

  const loadWeeklyWorkflowHistory = useCallback(async () => {
    if (!selectedDate || !selection?.program) return;
    const { weekFrom, weekTo } = getWeekRange(selectedDate);
    setWeeklyWorkflowHistoryLoading(true);
    try {
      const res = await getWeeklyWorkflowHistory({ weekFrom, weekTo, programId: selection.program.id });
      if (res?.success) {
        setWeeklyWorkflowHistory(Array.isArray(res.data) ? res.data : []);
      } else {
        setWeeklyWorkflowHistory([]);
      }
    } catch (err) {
      console.error('[WelcomePage] loadWeeklyWorkflowHistory error:', err);
      setWeeklyWorkflowHistory([]);
    } finally {
      setWeeklyWorkflowHistoryLoading(false);
    }
  }, [selectedDate, selection?.program]);

  const refreshWeeklyWorkflowState = useCallback(async () => {
    if (!selectedDate || !selection?.program) return;
    const { weekFrom, weekTo } = getWeekRange(selectedDate);
    try {
      const [snapRes, closureRes, inProgressRes, historyRes] = await Promise.all([
        getApprovedSnapshotForWeek({ weekFrom, weekTo, programId: selection.program.id }),
        getClosureStatus({ dateFrom: weekFrom, dateTo: weekTo, scopeType: 'PROGRAM', programId: selection.program.id }),
        getInProgressWeeklyWorkflow({ weekFrom, weekTo, programId: selection.program.id }),
        getWeeklyWorkflowHistory({ weekFrom, weekTo, programId: selection.program.id }),
      ]);
      setWeeklySnapshot(snapRes?.data || null);
      setWeekClosure(closureRes?.data || null);
      setWeeklyInProgressWorkflow(inProgressRes?.data || null);
      setWeeklyWorkflowHistory(historyRes?.data || []);
    } catch (err) {
      console.error('[WelcomePage] refreshWeeklyWorkflowState error:', err);
    }
  }, [selectedDate, selection?.program]);

  const handleRejectAndReinitiateWeeklyWorkflow = useCallback(async (doc) => {
    if (!doc?.id) return;
    setWeeklyWorkflowLoading(true);
    try {
      const rejectRes = await rejectDocument(doc.id, t('rejected_to_reinitiate_weekly_summary', 'Rejected to re-initiate weekly summary'));
      if (rejectRes?.success) {
        setSnackbar({ open: true, message: t('weekly_workflow_rejected', 'Weekly workflow rejected — attendance is unlocked'), severity: 'success' });
        await refreshWeeklyWorkflowState();
      } else {
        setSnackbar({ open: true, message: rejectRes?.error || t('weekly_workflow_reject_error', 'Failed to reject workflow'), severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || t('weekly_workflow_reject_error', 'Failed to reject workflow'), severity: 'error' });
    } finally {
      setWeeklyWorkflowLoading(false);
    }
  }, [t, refreshWeeklyWorkflowState]);

  const handleDeleteWeeklyWorkflow = useCallback((doc) => {
    if (!doc?.id) return;
    setDeleteTargetDoc(doc);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDeleteWeeklyWorkflow = useCallback(async () => {
    if (!deleteTargetDoc?.id) return;
    setWeeklyWorkflowLoading(true);
    try {
      const deleteRes = await deleteWorkflowDocument(deleteTargetDoc.id);
      if (deleteRes?.success) {
        setSnackbar({ open: true, message: t('weekly_workflow_deleted', 'Weekly workflow deleted'), severity: 'success' });
        setDeleteConfirmOpen(false);
        setInitiateWeeklyDialogOpen(false);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', 'schedule');
          next.delete('lane');
          next.delete('viewMode');
          return next;
        });
        await refreshWeeklyWorkflowState();
      } else {
        setSnackbar({ open: true, message: deleteRes?.error || t('weekly_workflow_delete_error', 'Failed to delete workflow'), severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || t('weekly_workflow_delete_error', 'Failed to delete workflow'), severity: 'error' });
    } finally {
      setWeeklyWorkflowLoading(false);
    }
  }, [deleteTargetDoc, t, refreshWeeklyWorkflowState, setSearchParams]);

  const handleInitiateWeeklyWorkflow = useCallback((singleClassId) => {
    if (!selectedDate || !selection?.program) return;
    if (singleClassId) {
      setWeeklySelectedClassIds([Number(singleClassId)]);
    } else {
      const isClassInCohort = classIdParam && cohortClasses.some((c) => String(c.id) === String(classIdParam));
      setWeeklySelectedClassIds(isClassInCohort ? [Number(classIdParam)] : [...cohortClassIds]);
    }
    setInitiateWeeklyDialogOpen(true);
    refreshWeeklyWorkflowState();
  }, [selectedDate, selection?.program, cohortClassIds, refreshWeeklyWorkflowState, classIdParam, cohortClasses]);

  const handleConfirmInitiateWeeklyWorkflow = useCallback(async () => {
    if (!selectedDate || !selection?.program) return;
    const { weekFrom, weekTo } = getWeekRange(selectedDate);
    setInitiateWeeklyDialogOpen(false);
    setWeeklyWorkflowLoading(true);
    try {
      const result = await initiateWeeklyWorkflow({
        programId: selection.program.id,
        programName: selection.program.name || selection.program.nameEn || '',
        classIds: weeklySelectedClassIds,
        weekFrom,
        weekTo,
        lang,
        user,
      });
      const created = result.results || [];
      const failed = result.errors || [];
      if (!result.success && failed.length === 0 && result.error) {
        failed.push({ classId: null, error: result.error });
      }
      setWeeklyCreatedResults({ results: created, errors: failed });
      setWeeklyCreatedDialogOpen(true);
      await refreshWeeklyWorkflowState();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || t('weekly_workflow_error', 'Failed to create weekly workflow'), severity: 'error' });
    } finally {
      setWeeklyWorkflowLoading(false);
    }
  }, [selectedDate, selection?.program, weeklySelectedClassIds, lang, user, t, refreshWeeklyWorkflowState]);

  const handleCloseWeek = useCallback(async () => {
    if (!selectedDate || !selection?.program) return;
    const { weekFrom, weekTo } = getWeekRange(selectedDate);
    try {
      const result = await closePeriod({
        closureType: 'WEEKLY',
        dateFrom: weekFrom,
        dateTo: weekTo,
        scopeType: 'PROGRAM',
        programId: selection.program.id,
        workflowDocumentId: weeklySnapshot?.id || null,
      });
      if (result.success) {
        setWeekClosure(result.data);
        setCloseWeekDialogOpen(false);
        setSnackbar({ open: true, message: t('week_closed_success', 'Week has been closed successfully'), severity: 'success' });
      } else {
        setSnackbar({ open: true, message: result.error || t('week_closed_error', 'Failed to close week'), severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || t('week_closed_error', 'Failed to close week'), severity: 'error' });
    }
  }, [selectedDate, selection?.program, weeklySnapshot, t]);

  const handleReopenWeek = useCallback(async () => {
    if (!selectedDate || !selection?.program) return;
    const { weekFrom, weekTo } = getWeekRange(selectedDate);
    try {
      const result = await reopenPeriod({
        closureType: 'WEEKLY',
        dateFrom: weekFrom,
        dateTo: weekTo,
        scopeType: 'PROGRAM',
        programId: selection.program.id,
      });
      if (result.success) {
        setWeekClosure(null);
        setSnackbar({ open: true, message: t('week_reopened_success', 'Week has been reopened'), severity: 'success' });
      } else {
        setSnackbar({ open: true, message: result.error || t('week_reopened_error', 'Failed to reopen week'), severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || t('week_reopened_error', 'Failed to reopen week'), severity: 'error' });
    }
  }, [selectedDate, selection?.program, t]);

  const handleOpenMarksActionsDialog = useCallback(() => {
    if (!selection?.program || !selection?.academicTerm) {
      setSnackbar({
        open: true,
        message: `${t('marks.schedule_actions') || 'Marks Reports & Workflows'} — ${t('welcome_select_program_term_first') || 'select program and term first'}`,
        severity: 'warning',
        progress: null,
      });
      return;
    }
    setMarksActionsDialogOpen(true);
  }, [selection, t]);

  const openAttendanceSummaryModal = useCallback((format = EXPORT_FORMAT.PDF) => {
    if (!selection?.program || !selection?.academicTerm) {
      setSnackbar({
        open: true,
        message: `${t('attendance_summary') || 'Attendance Summary'} — ${t('welcome_select_program_term_first') || 'select program and term first'}`,
        severity: 'warning',
        progress: null,
      });
      return;
    }
    if (cohortSubjectIds.length === 0) {
      setSnackbar({
        open: true,
        message: `${t('attendance_summary') || 'Attendance Summary'} — ${t('welcome_no_subjects_for_program') || 'no subjects found for this program'}`,
        severity: 'warning',
        progress: null,
      });
      return;
    }
    const anchor = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    const weekStart = new Date(anchor);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    setAttSummaryDateFrom(toIsoDate(weekStart));
    setAttSummaryDateTo(toIsoDate(weekEnd));
    setAttSummarySelectedSubjects([...cohortSubjectIds]);
    setAttSummaryViolationTypes({
      absentNoExcuse: true,
      absentWithExcuse: true,
      excusedLeave: true,
      late: true,
      humanCase: true,
    });
    setAttSummaryExportFormat(format);
    setAttSummarySuccess(null);
    setShowAttSummaryModal(true);
  }, [selection, cohortSubjectIds, selectedDate, t]);

  const handleAttSummaryExport = useCallback(async (subjectsToExport, violationTypesToExport, options = {}) => {
    const {
      dateFrom = attSummaryDateFrom,
      dateTo = attSummaryDateTo,
      format = attSummaryExportFormat,
      classId,
    } = options;

    if (!subjectsToExport || subjectsToExport.length === 0) return;
    if (!dateFrom || !dateTo || dateFrom > dateTo) return;

    setAttSummaryExporting(true);
    setExportingKey(`att-summary-${format}`);
    setSnackbar({
      open: true,
      message: `${t('attendance_summary') || 'Attendance Summary'} (${dateFrom} → ${dateTo}) — ${t('exporting')}…`,
      severity: 'info',
      progress: 0,
    });
    try {
      const programName = lang === 'ar' && selection.program.nameAr
        ? selection.program.nameAr
        : selection.program.nameEn;
      const result = await exportAttendanceOfficialForScope({
        subjectIds: subjectsToExport,
        violationTypes: violationTypesToExport,
        dateFrom,
        dateTo,
        programId: selection.program.id,
        programName,
        lang,
        user,
        format,
        classIds: classId ? [classId] : cohortClassIds,
      });
      setAttSummarySuccess({
        filename: result?.filename || 'attendance_official',
        fileId: result?.fileId || null,
        folderId: result?.folderId || null,
        blobUrl: result?.blobUrl || null,
        format,
      });
      setSnackbar({
        open: true,
        message: `${t('attendance_summary') || 'Attendance Summary'} — ${t('export_success') || 'Export successful'}`,
        severity: 'success',
        progress: null,
      });
    } catch (err) {
      console.error('[WelcomePage] attendance summary export failed:', err);
      setSnackbar({
        open: true,
        message: `${t('attendance_summary') || 'Attendance Summary'} — ${t('export_failed') || 'Export failed'}`,
        severity: 'error',
        progress: null,
      });
    } finally {
      setAttSummaryExporting(false);
      setExportingKey(null);
    }
  }, [selection, attSummaryDateFrom, attSummaryDateTo, attSummaryExportFormat, lang, t, user, cohortClassIds]);

  const fabActions = useMemo(() => {
    const actions = [
      {
        id: 'weekly-schedule',
        name: t('weekly_schedule'),
        icon: getThemedIcon('ui', 'file_signature', 20, 'currentColor'),
        children: [
          {
            id: 'weekly-pdf',
            name: t('export_pdf'),
            icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'),
            disabled: exportingKey === 'weekly-pdf',
            onClick: () => handleExportWeeklySchedule(EXPORT_FORMAT.PDF),
          },
          {
            id: 'weekly-excel',
            name: t('export_excel'),
            icon: getThemedIcon('ui', 'file_text', 16, 'currentColor'),
            disabled: exportingKey === 'weekly-excel',
            onClick: () => handleExportWeeklySchedule(EXPORT_FORMAT.EXCEL),
          },
        ],
      },
      {
        id: 'daily-template',
        name: t('daily_template') || 'Daily Template',
        icon: getThemedIcon('ui', 'file_text', 20, 'currentColor'),
        children: [
          {
            id: 'daily-template-pdf',
            name: t('export_pdf'),
            icon: getThemedIcon('ui', 'file_text', 16, 'currentColor'),
            disabled: exportingKey === 'daily-template-pdf',
            onClick: () => handleExportDailyTemplate(EXPORT_FORMAT.PDF),
          },
          {
            id: 'daily-template-excel',
            name: t('export_excel'),
            icon: getThemedIcon('ui', 'file_text', 16, 'currentColor'),
            disabled: exportingKey === 'daily-template-excel',
            onClick: () => handleExportDailyTemplate(EXPORT_FORMAT.EXCEL),
          },
        ],
      },
      ...(isHR ? [{
        id: 'attendance-summary',
        name: t('attendance_summary') || 'Attendance Summary',
        icon: getThemedIcon('ui', 'file_signature', 20, 'currentColor'),
        children: [
          {
            id: 'att-summary-pdf',
            name: t('export_pdf'),
            icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'),
            disabled: exportingKey === 'att-summary-pdf',
            onClick: () => openAttendanceSummaryModal(EXPORT_FORMAT.PDF),
          },
          {
            id: 'att-summary-excel',
            name: t('export_excel'),
            icon: getThemedIcon('ui', 'file_text', 16, 'currentColor'),
            disabled: exportingKey === 'att-summary-excel',
            onClick: () => openAttendanceSummaryModal(EXPORT_FORMAT.EXCEL),
          },
        ],
      }] : []),
      {
        id: 'operations-board',
        name: t('operations_board_title') || 'Operations Board',
        icon: getThemedIcon('ui', 'layout_grid', 20, 'currentColor'),
        onClick: () => openOperationsTab({ lane: 'status', view: 'kanban', viewMode: OPS_VIEW_MODES.WEEK, classId: null }),
      },
    ];

    if (!isHR || isAdmin || isSuperAdmin) {
      actions.push({
        id: 'attendance-official',
        name: t('official_attendance') || 'Attendance Official',
        icon: getThemedIcon('ui', 'file_signature', 20, 'currentColor'),
        onClick: () => navigate('/qr-scanner'),
      });
    }

    actions.push({
      id: 'marks-reports',
      name: t('marks_reports') || 'Marks Reports',
      icon: getThemedIcon('ui', 'download', 20, 'currentColor'),
      children: [
        { id: 'semester_certificate', name: t('semester_certificate') || 'Semester Certificate', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
        { id: 'qualitative_card', name: t('qualitative_card') || 'Qualitative Card', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
        { id: 'class_subject_report', name: t('class_subject') || 'Class Subject Report', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
        { id: 'first_warning', name: t('first_warning') || 'First Warning', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
        { id: 'final_warning', name: t('final_warning') || 'Final Warning', icon: getThemedIcon('ui', 'file_signature', 16, 'currentColor'), onClick: () => navigate('/marks-entry') },
      ],
    });

    return actions;
  }, [exportingKey, handleExportWeeklySchedule, handleExportDailyTemplate, openAttendanceSummaryModal, openOperationsTab, t, isHR, isAdmin, isSuperAdmin, navigate]);

  const handleCloseInbox = useCallback(() => {
    setInboxOutboxOpen(false);
    setInboxClassId(null);
  }, []);

  const handleFabAction = useCallback((action) => {
    if (!action.id.startsWith('weekly-') && !action.id.startsWith('daily-template-') && !action.id.startsWith('att-summary-')) {
      setSnackbar({
        open: true,
        message: `${action.name} — action triggered`,
        severity: 'info',
        progress: null,
      });
    }
  }, []);

  const pageBg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)';

  const weeklyWorkflowDialogState = useMemo(() => {
    if (!selectedDate) {
      return { notTakenEntries: [], lateEntries: [], notTakenTotal: 0, lateTotal: 0, canInitiate: false, missingDailyDays: [] };
    }
    const { weekFrom, weekTo } = getWeekRange(selectedDate);
    const weekStart = new Date(`${weekFrom}T12:00:00`);
    const jan1 = new Date(weekStart.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((weekStart - jan1) / 86400000) + 1;
    const weekNum = Math.ceil(dayOfYear / 7);
    const weekDates = getWeekDayDates(selectedDate, hideWeekends);
    const dayCodes = hideWeekends ? SCHEDULE_WORK_DAYS : SCHEDULE_ALL_DAYS;

    // Only flag attendance issues for class/date combinations that actually have a scheduled session.
    const scheduledKeys = new Set();
    const dayCodeToIso = {};
    weekDates.forEach((d, i) => { dayCodeToIso[dayCodes[i]] = toIsoDate(d); });
    if (scheduleData?.days) {
      scheduleData.days.forEach((day) => {
        const iso = dayCodeToIso[day.dayCode];
        if (!iso) return;
        Object.values(day.slots || {}).forEach((slot) => {
          if (slot?.classId) scheduledKeys.add(`${iso}:${slot.classId}`);
        });
      });
    }

    const notTakenEntries = [];
    const lateEntries = [];
    let hasChecked = false;

    (weeklySelectedClassIds || []).forEach((classId) => {
      const cls = cohortClasses.find((c) => String(c.id) === String(classId));
      const className = lang === 'ar'
        ? (cls?.nameAr || cls?.nameEn || cls?.code || classId)
        : (cls?.nameEn || cls?.nameAr || cls?.code || classId);
      weekDates.forEach((d) => {
        const iso = toIsoDate(d);
        if (!scheduledKeys.has(`${iso}:${classId}`)) return;
        const status = statusMap[`${iso}:${classId}`];
        const counts = getAttendanceCountsFromStatus(status);
        hasChecked = true;
        if (!status?.hasAttendance || (counts?.notTaken || 0) > 0) {
          const dateLabel = d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { weekday: 'short', month: 'short', day: 'numeric' });
          const count = (counts?.notTaken || 0) > 0
            ? counts.notTaken
            : (!status?.hasAttendance ? (cls?.totalStudents ?? status?.totalStudents ?? null) : null);
          notTakenEntries.push({ className, dateLabel, count });
        }
        if ((counts?.late || 0) > 0) {
          const dateLabel = d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { weekday: 'short', month: 'short', day: 'numeric' });
          lateEntries.push({ className, dateLabel, count: counts.late });
        }
      });
    });

    const notTakenTotal = notTakenEntries.reduce((sum, { count }) => sum + (count || 0), 0);
    const lateTotal = lateEntries.reduce((sum, { count }) => sum + count, 0);
    const hasIssues = notTakenEntries.length > 0 || lateTotal > 0;

    const missingDailyDays = [];
    weekDates.forEach((d) => {
      const iso = toIsoDate(d);
      const missingClassNames = [];
      (weeklySelectedClassIds || []).forEach((classId) => {
        if (!scheduledKeys.has(`${iso}:${classId}`)) return;
        const status = statusMap[`${iso}:${classId}`];
        const counts = getAttendanceCountsFromStatus(status);
        if (!status?.hasAttendance || (counts?.notTaken || 0) > 0) {
          const cls = cohortClasses.find((c) => String(c.id) === String(classId));
          const className = lang === 'ar'
            ? (cls?.nameAr || cls?.nameEn || cls?.code || classId)
            : (cls?.nameEn || cls?.nameAr || cls?.code || classId);
          missingClassNames.push(className);
        }
      });
      if (missingClassNames.length > 0) {
        missingDailyDays.push({
          date: d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { weekday: 'short', month: 'short', day: 'numeric' }),
          classes: missingClassNames,
        });
      }
    });

    const canInitiate = hasChecked && weeklySelectedClassIds.length > 0 && !hasIssues && missingDailyDays.length === 0;

    return { notTakenEntries, lateEntries, notTakenTotal, lateTotal, canInitiate, missingDailyDays, weekNum };
  }, [selectedDate, weeklySelectedClassIds, statusMap, cohortClasses, lang, hideWeekends, scheduleData]);

  const weeklyWorkflowInitiateButton = null;

  const opsNavSuffix = useMemo(() => {
    if (tabParam !== 'operations' || !opsSelectedWorkflow) return null;
    const status = String(opsSelectedWorkflow.status || '').toUpperCase();
    const cfg = getWorkflowBadgeColor(status);
    const approvedDate = opsSelectedWorkflow.approvedAt
      ? new Date(opsSelectedWorkflow.approvedAt).toISOString().slice(0, 10)
      : '—';
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, paddingLeft: 4 }}>
        <ColoredTooltip
          title={status === 'APPROVED' && opsSelectedWorkflow.approvedByName
            ? t('workflow_approved_by_tooltip', 'Approved by {name} on {date}')
                .replace('{name}', opsSelectedWorkflow.approvedByName)
                .replace('{date}', approvedDate)
            : t(`workflow_status_${status.toLowerCase()}`, status)}
          color={cfg.bg}
          placement="bottom"
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: cfg.bg,
              color: cfg.text,
              border: `1px solid ${cfg.border}`,
              whiteSpace: 'nowrap',
            }}
          >
            {t(`workflow_status_${status.toLowerCase()}`, opsSelectedWorkflow.status || '')}
          </span>
        </ColoredTooltip>
        {opsSelectedWorkflow.snapshotFileId && (
          <ColoredTooltip title={t('open_approved_pdf') || 'Open approved PDF'} color="#16a34a" placement="bottom">
            <IconButton
              size="small"
              onClick={() => {
                openExportFile({
                  fileId: opsSelectedWorkflow.snapshotFileId,
                  filename: opsSelectedWorkflow.snapshotFileName || `workflow-${opsSelectedWorkflow.rawId}`,
                  format: 'pdf',
                }).catch(() => handleOpsWorkflowExport(EXPORT_FORMAT.PDF));
              }}
              sx={{
                width: 28,
                height: 28,
                flexShrink: 0,
                color: '#16a34a',
                border: `1px solid ${isDark ? '#14532d' : '#bbf7d0'}`,
                borderRadius: 1,
              }}
            >
              <ShieldCheck size={16} />
            </IconButton>
          </ColoredTooltip>
        )}
        <ColoredTooltip title={t('real_time_preview_pdf', 'Real-time preview PDF')} color="#e53935" placement="bottom">
          <IconButton
            size="small"
            onClick={() => handleOpsWorkflowExport(EXPORT_FORMAT.PDF)}
            sx={{
              width: 28,
              height: 28,
              flexShrink: 0,
              color: '#e53935',
              border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
              borderRadius: 1,
            }}
          >
            <FileText size={16} />
          </IconButton>
        </ColoredTooltip>
        <ColoredTooltip title={t('real_time_preview_excel', 'Real-time preview Excel')} color="#43a047" placement="bottom">
          <IconButton
            size="small"
            onClick={() => handleOpsWorkflowExport(EXPORT_FORMAT.EXCEL)}
            sx={{
              width: 28,
              height: 28,
              flexShrink: 0,
              color: '#43a047',
              border: `1px solid ${isDark ? '#14532d' : '#bbf7d0'}`,
              borderRadius: 1,
            }}
          >
            <FileSpreadsheet size={16} />
          </IconButton>
        </ColoredTooltip>
      </div>
    );
  }, [tabParam, opsSelectedWorkflow, isDark, t, handleOpsWorkflowExport]);

  const weeklyDialogClasses = useMemo(() => {
    if (!classIdParam) return cohortClasses;
    const filtered = cohortClasses.filter((c) => String(c.id) === String(classIdParam));
    return filtered.length > 0 ? filtered : cohortClasses;
  }, [cohortClasses, classIdParam]);

  if (isStudent) return null;

  return (
    <div
      className={`welcome-page${scheduleExpanded ? ' welcome-page--schedule-expanded' : ''}${boardExpanded && tabParam === 'operations' ? ' welcome-page--operations-expanded' : ''}${violationsExpanded && tabParam === 'violations' ? ' welcome-page--violations-expanded' : ''}${marksExpanded && tabParam === 'marks' ? ' welcome-page--marks-expanded' : ''}`}
      style={{
        minHeight: showSchedule ? 'calc(100vh - var(--navbar-height, 60px))' : '100vh',
        height: showSchedule ? 'calc(100vh - var(--navbar-height, 60px))' : 'auto',
        background: pageBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: showSchedule ? 'stretch' : 'center',
        padding: showSchedule && !scheduleExpanded && !(boardExpanded && tabParam === 'operations') && !(violationsExpanded && tabParam === 'violations') && !(marksExpanded && tabParam === 'marks')
          ? '0 4px 4px'
          : (scheduleExpanded || (boardExpanded && tabParam === 'operations') || (violationsExpanded && tabParam === 'violations') || (marksExpanded && tabParam === 'marks'))
            ? 0
            : '0 16px 48px',
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        boxSizing: 'border-box',
        ...(scheduleExpanded ? { '--welcome-schedule-expanded-bg': isDark ? '#0f172a' : '#f8fafc' } : {}),
        ...(boardExpanded && tabParam === 'operations' ? { '--welcome-operations-expanded-bg': isDark ? '#0f172a' : '#f8fafc' } : {}),
        ...(violationsExpanded && tabParam === 'violations' ? { '--welcome-violations-expanded-bg': isDark ? '#0f172a' : '#f8fafc' } : {}),
        ...(marksExpanded && tabParam === 'marks' ? { '--welcome-marks-expanded-bg': isDark ? '#0f172a' : '#f8fafc' } : {}),
      }}
    >
      {isNavbarCollapsed && showSchedule && (
        <DraggableFloatingPanel
          storageKey={WELCOME_STORAGE_KEYS.FLOATING_TABS_POS}
          defaultPos={{ top: WELCOME_SIZES.floatingTop, left: WELCOME_SIZES.floatingLeft }}
          isDark={isDark}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="standard"
            sx={{
              minHeight: WELCOME_SIZES.tabMinHeight,
              '& .MuiTab-root': { minHeight: WELCOME_SIZES.tabMinHeight, py: 0, px: WELCOME_SIZES.tabPaddingX, textTransform: 'none', fontSize: WELCOME_SIZES.fontSizeTab },
              '& .MuiTab-root.Mui-selected': { color: WELCOME_COLORS.tabBlue },
              '& .MuiTabs-indicator': { backgroundColor: WELCOME_COLORS.tabBlue },
            }}
          >
            <Tab label={t('welcome_tab_schedule') || 'Schedule'} />
            {showOperationsTab && (
              <Tab label={t('welcome_tab_operations') || 'Operations'} />
            )}
            {showMarksTab && (
              <Tab label={t('welcome_tab_marks') || 'Marks'} />
            )}
            {!isInstructorOnly && (
              <Tab label={t('welcome_tab_violations') || 'Violations'} />
            )}
          </Tabs>

          {tabParam === 'schedule' && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', my: 0.5 }}
              />
              {scheduleToggles}
            </>
          )}

          {((showSchedule && tabParam === 'schedule') || tabParam === 'operations') && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', my: 0.5 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                <Slider
                  size="small"
                  value={scheduleFontScale}
                  onChange={(_, value) => handleScheduleFontScaleChange(value)}
                  min={SCHEDULE_FONT_SCALE_MIN}
                  max={SCHEDULE_FONT_SCALE_MAX}
                  step={SCHEDULE_FONT_SCALE_STEP}
                  aria-label={t('schedule_font_size') || 'Schedule font size'}
                  data-testid="welcome-floating-font-slider"
                  sx={{
                    width: WELCOME_SIZES.sliderWidth,
                    color: WELCOME_COLORS.gold,
                    '& .MuiSlider-thumb': { width: 10, height: 10 },
                  }}
                />
                <Box
                  component="span"
                  data-testid="welcome-floating-font-label"
                  sx={{
                    fontSize: WELCOME_SIZES.fontSizeFontLabel,
                    fontWeight: WELCOME_SIZES.fontWeightSemibold,
                    color: WELCOME_COLORS.gold,
                    minWidth: WELCOME_SIZES.fontLabelMinWidth,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {scheduleFontScale}%
                </Box>
              </Box>
            </>
          )}
        </DraggableFloatingPanel>
      )}

      {isNavbarCollapsed && showSchedule && (tabParam === 'schedule' || tabParam === 'operations' || tabParam === 'violations') && (
        <DraggableFloatingPanel
          storageKey={WELCOME_STORAGE_KEYS.FLOATING_DATE_POS}
          defaultPos={{ top: WELCOME_SIZES.floatingDateTop, left: WELCOME_SIZES.floatingLeft }}
          isDark={isDark}
        >
          <WelcomeDateControls
            tabParam={tabParam}
            selectedDate={selectedDate}
            setSelectedDate={handleSetSelectedDate}
            opsViewMode={opsViewMode}
            setOpsViewMode={setOpsViewMode}
            violationsViewMode={violationsViewMode}
            setViolationsViewMode={setViolationsViewMode}
            dayFocus={scheduleDayFocus}
            setDayFocus={setScheduleDayFocus}
            hideWeekends={hideWeekends}
            isInstructorOnly={isInstructorOnly}
            isDark={isDark}
            isRTL={isRTL}
            t={t}
            weekNavPrefix={weeklyWorkflowInitiateButton}
            opsNavSuffix={opsNavSuffix}
          />
        </DraggableFloatingPanel>
      )}

      {showSchedule && (
        <Joyride
          steps={tourSteps}
          run={runJoyride && tourSteps.length > 0}
          continuous
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
            last: t('tour_done') || 'Done',
            next: t('tour_next') || 'Next',
            skip: t('tour_skip') || 'Skip',
          }}
          styles={{
            options: {
              zIndex: 10000,
              arrowColor: isDark ? '#1f2937' : '#fff',
              backgroundColor: isDark ? '#1f2937' : '#fff',
              textColor: isDark ? '#f1f5f9' : '#0f172a',
              overlayColor: 'rgba(0, 0, 0, 0.5)',
              primaryColor: 'var(--color-primary, #800020)',
            },
          }}
        />
      )}

      {!selection?.program && !autoSelecting && !noPrograms && <WelcomeHeader user={user} role={effectiveRole} />}

      {/* Selection flow */}
      <div
        className="selection-section"
        style={{
          width: '100%',
          maxWidth: showSchedule ? 'none' : '1200px',
          margin: '0 auto',
          marginTop: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: selection?.program && selection?.academicTerm ? 'flex-start' : 'center',
          minHeight: 0,
          animation: 'fadeInDown 0.3s ease',
        }}
      >
        {autoSelecting && !selection?.program && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {!autoSelecting && !selection?.program && !noPrograms && (
          <ProgramTermSelector onSelect={handleProgramSelect} />
        )}

        {!autoSelecting && !selection?.program && noPrograms && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 8, gap: 2 }}>
            {isHR ? (
              <>
                <Box sx={{ fontSize: '48px', mb: 1, opacity: 0.3 }}>📋</Box>
                <Box sx={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b', textAlign: 'center' }}>
                  {t('welcome_hr_empty_title') || 'Welcome to HR Workspace'}
                </Box>
                <Box sx={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', maxWidth: '400px' }}>
                  {t('welcome_hr_empty_hint') || 'Your assigned programs and schedules will appear here. Use the navigation menu to access HR management tools.'}
                </Box>
              </>
            ) : isAdmin || isSuperAdmin ? (
              <>
                <Box sx={{ fontSize: '48px', mb: 1, opacity: 0.3 }}>⚙️</Box>
                <Box sx={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b', textAlign: 'center' }}>
                  {t('welcome_admin_empty_title') || 'Welcome to Admin Workspace'}
                </Box>
                <Box sx={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', maxWidth: '400px' }}>
                  {t('welcome_admin_empty_hint') || 'No programs are currently assigned. Use the navigation menu to manage programs, classes, and system settings.'}
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b', textAlign: 'center' }}>
                  {t('workspace_no_classes_assigned')}
                </Box>
                <Box sx={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', maxWidth: '400px' }}>
                  {t('workspace_no_classes_assigned_hint')}
                </Box>
              </>
            )}
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              style={{
                marginTop: '16px',
                padding: '8px 20px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                background: 'transparent',
                color: isDark ? '#94a3b8' : '#64748b',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'none',
              }}
            >
              {t('welcome_go_home')}
            </button>
          </Box>
        )}

        {selection?.program && !selection?.academicTerm && (
          <YearTermSelector
            program={selection.program}
            onSelect={handleTermSelect}
            onBack={handleBackToProgram}
            showBack={false}
          />
        )}

        {selection?.program && selection?.academicTerm && (
          <div
            className={
              scheduleExpanded
                ? 'schedule-panel-expanded'
                : (boardExpanded && tabParam === 'operations' ? 'operations-panel-expanded'
                  : (marksExpanded && tabParam === 'marks' ? 'marks-panel-expanded' : ''))
            }
            style={{
              background: (scheduleExpanded || (boardExpanded && tabParam === 'operations') || (marksExpanded && tabParam === 'marks'))
                ? 'transparent'
                : (isDark ? '#0f172a' : '#f8fafc'),
              borderRadius: (scheduleExpanded || (boardExpanded && tabParam === 'operations') || (marksExpanded && tabParam === 'marks')) ? 0 : '8px',
              padding: (scheduleExpanded || (boardExpanded && tabParam === 'operations') || (marksExpanded && tabParam === 'marks')) ? 0 : '8px',
              border: (scheduleExpanded || (boardExpanded && tabParam === 'operations') || (marksExpanded && tabParam === 'marks'))
                ? 'none'
                : `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              width: '100%',
            }}
          >
            <Box data-tour="welcome-tabs" sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0, mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {!isNavbarCollapsed && (
                <>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="standard"
                    sx={{
                      flex: 1,
                      minHeight: 40,
                      '& .MuiTab-root': { minHeight: 40, textTransform: 'none' },
                      '& .MuiTab-root:focus, & .MuiTab-root:focus-visible': {
                        outline: 'none',
                        boxShadow: 'none',
                      },
                      '& .MuiTab-root.Mui-selected': { color: '#3b82f6' },
                      '& .MuiTabs-indicator': { backgroundColor: '#3b82f6' },
                    }}
                  >
                    <Tab label={t('welcome_tab_schedule') || 'Schedule'} />
                    {showOperationsTab && (
                      <Tab label={t('welcome_tab_operations') || 'Operations'} />
                    )}
                    {showMarksTab && (
                      <Tab label={t('welcome_tab_marks') || 'Marks'} />
                    )}
                    {!isInstructorOnly && (
                      <Tab label={t('welcome_tab_violations') || 'Violations'} />
                    )}
                  </Tabs>
                  {showSchedule && tabParam === 'schedule' && (
                    <>
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', my: 0.5 }}
                      />
                      {scheduleToggles}
                    </>
                  )}
                </>
              )}
              {showSchedule && tabParam === 'schedule' && canExport && !isInstructorOnly && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {isHR && (
                  <ColoredTooltip
                    title={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, padding: '4px 0' }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{t('attendance_summary') || 'Attendance Summary'}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span
                            style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#e53935' }}
                            onClick={(e) => { e.stopPropagation(); openAttendanceSummaryModal(EXPORT_FORMAT.PDF); }}
          >
            <FileText size={14} /> PDF
          </span>
                          <span
                            style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#43a047' }}
                            onClick={(e) => { e.stopPropagation(); openAttendanceSummaryModal(EXPORT_FORMAT.EXCEL); }}
                          >
            <FileSpreadsheet size={14} /> Excel
          </span>
                        </div>
                      </div>
                    }
                    color="#7c3aed"
                    placement="bottom"
                  >
                    <span>
                      <IconButton
                        size="small"
                        disabled={exportingKey?.startsWith('att-summary-')}
                        data-testid="tab-action-attendance-summary"
                        sx={{ padding: '2px' }}
                        onClick={() => openAttendanceSummaryModal(EXPORT_FORMAT.PDF)}
                      >
                        <ClipboardList size={16} style={{ color: '#7c3aed' }} />
                      </IconButton>
                    </span>
                  </ColoredTooltip>
                  )}
                  {(isHR || isAdmin || isSuperAdmin) && (
                    <>
                      {false && (
                      <>
                      {/* Weekly workflow icon group */}
                      <Box sx={actionGroupSx}>
                        {/* Snapshot / View Approved Report icon */}
                        <ColoredTooltip
                          title={(() => {
                            if (weekClosure?.isClosed) {
                              const closeDate = weekClosure.closedAt ? formatSnapshotDate(weekClosure.closedAt) : '—';
                              return t('weekly_snapshot_closed', 'Week Closed - View Official Report') + ` (${formatSnapshotDate(weeklySnapshot?.snapshotWeekFrom)} → ${formatSnapshotDate(weeklySnapshot?.snapshotWeekTo)}, ${t('closed_on', 'closed on')} ${closeDate})`;
                            }
                            if (weeklySnapshot) {
                              const approvedDate = weeklySnapshot.updatedAt ? formatSnapshotDate(weeklySnapshot.updatedAt) : (weeklySnapshot.snapshotDate ? formatSnapshotDate(weeklySnapshot.snapshotDate) : '—');
                              return t('weekly_snapshot_view', 'View Approved Weekly Report') + ` (${formatSnapshotDate(weeklySnapshot.snapshotWeekFrom)} → ${formatSnapshotDate(weeklySnapshot.snapshotWeekTo)}, ${t('approved_on', 'approved on')} ${approvedDate})`;
                            }
                            if (weeklyInProgressWorkflow?.status === 'APPROVED') {
                              const approvedDate = weeklyInProgressWorkflow.updatedAt ? formatSnapshotDate(weeklyInProgressWorkflow.updatedAt) : '—';
                              return t('weekly_snapshot_view', 'View Approved Weekly Report') + ` (${t('approved_on', 'approved on')} ${approvedDate})`;
                            }
                            return t('weekly_snapshot_none', 'No approved weekly report for this week');
                          })()}
                          color={weekClosure?.isClosed ? '#dc2626' : ((weeklySnapshot || weeklyInProgressWorkflow?.status === 'APPROVED') ? '#16a34a' : '#9ca3af')}
                          placement="bottom"
                        >
                          <span>
                            <IconButton
                              size="small"
                              disabled={!weeklySnapshot && weeklyInProgressWorkflow?.status !== 'APPROVED'}
                              data-testid="tab-action-weekly-snapshot"
                              sx={{ padding: '2px' }}
                              onClick={openWeeklySnapshot}
                            >
                              {weekClosure?.isClosed
                                ? <Lock size={16} style={{ color: '#dc2626' }} />
                                : <FileCheck2 size={16} style={{ color: (weeklySnapshot || weeklyInProgressWorkflow?.status === 'APPROVED') ? '#16a34a' : '#9ca3af' }} />
                              }
                            </IconButton>
                          </span>
                        </ColoredTooltip>


                        {/* Approved status icon */}
                        {(isAdmin || isHR || isSuperAdmin) && weeklyInProgressWorkflow?.status === 'APPROVED' && !weekClosure?.isClosed && !weeklySnapshot && (
                          <ColoredTooltip
                            title={(() => {
                              const approvedDate = weeklyInProgressWorkflow.updatedAt ? formatSnapshotDate(weeklyInProgressWorkflow.updatedAt) : '—';
                              return t('workflow_status_approved', 'Weekly report approved') + ` (${t('approved_on', 'approved on')} ${approvedDate})`;
                            })()}
                            color="#16a34a"
                            placement="bottom"
                          >
                            <span>
                              <IconButton
                                size="small"
                                data-testid="tab-action-weekly-approved"
                                sx={{ padding: '2px' }}
                                onClick={handleInitiateWeeklyWorkflow}
                              >
                                <FileCheck2 size={16} style={{ color: '#16a34a' }} />
                              </IconButton>
                            </span>
                          </ColoredTooltip>
                        )}

                        {/* Rejected status icon */}
                        {(isHR || isSuperAdmin) && weeklyInProgressWorkflow?.status === 'REJECTED' && !weekClosure?.isClosed && (
                          <ColoredTooltip
                            title={(() => {
                              const rejectedDate = weeklyInProgressWorkflow.updatedAt ? formatSnapshotDate(weeklyInProgressWorkflow.updatedAt) : '—';
                              return t('workflow_status_rejected', 'Weekly report rejected') + ` (${t('rejected_on', 'rejected on')} ${rejectedDate})`;
                            })()}
                            color="#dc2626"
                            placement="bottom"
                          >
                            <span>
                              <IconButton
                                size="small"
                                data-testid="tab-action-weekly-rejected"
                                sx={{ padding: '2px' }}
                                onClick={handleInitiateWeeklyWorkflow}
                              >
                                <FileX2 size={16} style={{ color: '#dc2626' }} />
                              </IconButton>
                            </span>
                          </ColoredTooltip>
                        )}

                        {/* Close Week icon */}
                        {(isAdmin || isHR || isSuperAdmin) && (weeklySnapshot || weeklyInProgressWorkflow?.status === 'APPROVED') && !weekClosure?.isClosed && (
                          <ColoredTooltip
                            title={t('close_week', 'Close Week')}
                            color="#dc2626"
                            placement="bottom"
                          >
                            <span>
                              <IconButton
                                size="small"
                                data-testid="tab-action-close-week"
                                sx={{ padding: '2px' }}
                                onClick={() => setCloseWeekDialogOpen(true)}
                              >
                                <Lock size={16} style={{ color: '#dc2626' }} />
                              </IconButton>
                            </span>
                          </ColoredTooltip>
                        )}

                        {/* Reopen Week icon */}
                        {(isAdmin || isHR || isSuperAdmin) && weekClosure?.isClosed && (
                          <ColoredTooltip
                            title={(() => {
                              const closeDate = weekClosure.closedAt ? formatSnapshotDate(weekClosure.closedAt) : '—';
                              return t('reopen_week', 'Reopen Week') + ` (${t('closed_on', 'closed on')} ${closeDate})`;
                            })()}
                            color="#f59e0b"
                            placement="bottom"
                          >
                            <span>
                              <IconButton
                                size="small"
                                data-testid="tab-action-reopen-week"
                                sx={{ padding: '2px' }}
                                onClick={handleReopenWeek}
                              >
                                <Lock size={16} style={{ color: '#f59e0b', transform: 'rotate(45deg)' }} />
                              </IconButton>
                            </span>
                          </ColoredTooltip>
                        )}
                      </Box>
                      </>
                      )}

                      {/* Marks reports action group */}
                      {showMarksTab && (
                        <Box sx={actionGroupSx}>
                          <ColoredTooltip
                            title={t('marks.schedule_actions') || 'Marks Reports & Workflows'}
                            color="#14b8a6"
                            placement="bottom"
                          >
                            <span>
                              <IconButton
                                size="small"
                                disabled={!selection?.program || !selection?.academicTerm}
                                data-testid="tab-action-marks-actions"
                                sx={{ padding: '2px' }}
                                onClick={handleOpenMarksActionsDialog}
                              >
                                <GraduationCap size={16} style={{ color: '#14b8a6' }} />
                              </IconButton>
                            </span>
                          </ColoredTooltip>
                        </Box>
                      )}
                    </>
                  )}
                </div>
              )}
              {!isNavbarCollapsed && (
                <WelcomeDateControls
                  tabParam={tabParam}
                  selectedDate={selectedDate}
                  setSelectedDate={handleSetSelectedDate}
                  opsViewMode={opsViewMode}
                  setOpsViewMode={setOpsViewMode}
                  violationsViewMode={violationsViewMode}
                  setViolationsViewMode={setViolationsViewMode}
                  dayFocus={scheduleDayFocus}
                  setDayFocus={setScheduleDayFocus}
                  hideWeekends={hideWeekends}
                  isInstructorOnly={isInstructorOnly}
                  isDark={isDark}
                  isRTL={isRTL}
                  t={t}
                  weekNavPrefix={weeklyWorkflowInitiateButton}
                  opsNavSuffix={opsNavSuffix}
                />
              )}
            </Box>

            {tabParam === 'schedule' && (
              <div className={scheduleExpanded ? 'schedule-expanded-overlay' : ''} style={scheduleExpanded ? undefined : { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {loading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: 1,
                      color: isDark ? '#94a3b8' : '#64748b',
                    }}
                  >
                    {t('loading') || 'Loading...'}
                  </div>
                ) : (
                  <div data-tour="welcome-schedule-grid" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <OfficialWeeklyScheduleGrid
                      scheduleData={scheduleData}
                      statusMap={statusMap}
                      weeklyWorkflowMap={weeklyWorkflowMap}
                      instructorId={isInstructor ? instructorId : null}
                      interactiveAll={canInteractAll && !isScheduleLocked}
                      selectedDate={selectedDate}
                      selectedSlot={selectedSlot}
                      dayFocus={scheduleDayFocus}
                      onCellClick={isScheduleLocked ? undefined : handleCellClick}
                      onDateChange={handleSetSelectedDate}
                      onWorkflowClick={handleWorkflowIconClick}
                      onWeeklyWorkflowClick={handleWeeklyWorkflowIconClick}
                      compact
                      fillHeight
                      fillWidth
                      fontScale={scheduleFontScale}
                      expanded={scheduleExpanded}
                      onToggleExpand={handleToggleScheduleExpand}
                      hideNotesParticipation={hideNotesParticipation}
                      hideNotesComments={hideNotesComments}
                      hideParticipation={!canViewParticipation({ isInstructor, isAdmin, isHR, isSuperAdmin })}
                      hideTooltips={isInstructorOnly}
                      hideLegend={false}
                      isInstructorViewer={isInstructorOnly}
                      showInstructor={showScheduleInstructor}
                      showRoom={showScheduleRoom}
                      showDayDate={showDayDate}
                      showBreakColumns={showBreakColumns}
                      onExportWeeklySchedule={handleExportWeeklySchedule}
                      onExportDailyTemplate={handleExportDailyTemplate}
                    />
                    {selectedSlot && !menuAnchorEl && selectedSession && !isInstructorOnly && !isAdmin && !isSuperAdmin && !isScheduleLocked && (
                      <ScheduleSpeedDial
                        session={selectedSession}
                        selectedDate={clickedDate || selectedDate}
                        program={selection?.program}
                        academicTerm={selection?.academicTerm}
                        onClose={handleClearSelection}
                        onOpenInbox={handleOpenInbox}
                        onOpenHistory={handleOpenHistory}
                        onOpenNotifications={handleOpenNotifications}
                        pdfOnly={tabParam === 'schedule'}
                        onExportSuccess={showExportBanner}
                      />
                    )}
                  </div>
                )}

              </div>
            )}

            {tabParam === 'marks' && showMarksTab && (
              <Box
                className={marksExpanded ? 'marks-expanded-overlay' : ''}
                sx={marksExpanded ? undefined : { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
              >
                <WelcomeMarksTab
                  welcomeContext={welcomeBoardContext}
                  isDark={isDark}
                  expanded={marksExpanded}
                  onToggleExpand={handleToggleMarksExpand}
                />
              </Box>
            )}

            {tabParam === 'violations' && showViolationsTab && (
              <Box
                className={violationsExpanded ? 'violations-expanded-overlay' : ''}
                sx={violationsExpanded ? undefined : { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
              >
                <WelcomeViolationsTab
                  welcomeContext={welcomeBoardContext}
                  isDark={isDark}
                  scheduleFontScale={scheduleFontScale}
                  onScheduleFontScaleChange={handleScheduleFontScaleChange}
                  selectedDate={selectedDate}
                  violationsViewMode={violationsViewMode}
                  expanded={violationsExpanded}
                  onToggleExpand={handleToggleViolationsExpand}
                />
              </Box>
            )}

            {tabParam === 'operations' && showOperationsTab && (
              <div
                data-tour="welcome-operations-tab"
                className={boardExpanded ? 'operations-expanded-overlay' : ''}
                style={boardExpanded ? undefined : { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
              >
                <div className="welcome-operations-panel" data-testid="operations-board-shell">
                  {isInstructorOnly && !classIdParam ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, py: 8, gap: 2 }}>
                      <Alert severity="info" sx={{ maxWidth: 480 }}>
                        {t('choose_class_today_ops') || 'Please choose a class from today\'s schedule to open Operations.'}
                      </Alert>
                    </Box>
                  ) : (
                    <Suspense
                      fallback={(
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, py: 6 }}>
                          <CircularProgress size={28} />
                        </Box>
                      )}
                    >
                      <OperationsBoardPage
                        embedded
                        expanded={boardExpanded}
                        onToggleExpand={handleToggleBoardExpand}
                        isWeekLocked={isWeekAttendanceLocked}
                        weeklyWorkflowMap={weeklyWorkflowMap}
                        welcomeContext={welcomeBoardContext}
                        fontScale={scheduleFontScale}
                        onOpenHistory={handleOpenHistory}
                        onDateChange={setSelectedDate}
                        viewMode={opsViewMode}
                        onViewModeChange={setOpsViewMode}
                        onBoardDataChanged={refreshScheduleStatus}
                        onExportDailyTemplate={handleExportDailyTemplate}
                        onExportWeeklySchedule={handleExportWeeklySchedule}
                        exportingKey={exportingKey}
                        onSelectedWorkflowChange={setOpsSelectedWorkflow}
                      />
                    </Suspense>
                  )}
                </div>
              </div>
            )}


          </div>
        )}
      </div>

      {/* Footer link — only when no selection and not showing noPrograms message */}
      {!selection?.program && !autoSelecting && !noPrograms && (
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          style={{
            marginTop: '36px',
            background: 'none',
            border: 'none',
            color: isDark ? '#64748b' : '#94a3b8',
            fontSize: '13px',
            cursor: 'pointer',
            textDecoration: 'underline',
            display: 'none',
          }}
        >
          {t('welcome_go_home')}
        </button>
      )}

      <ScheduleContextMenu
        session={selectedSession}
        anchorEl={menuAnchorEl}
        open={Boolean(selectedSession && menuAnchorEl)}
        onClose={handleCloseClassMenu}
        selectedDate={clickedDate || selectedDate}
        program={selection?.program}
        academicTerm={selection?.academicTerm}
        onOpenInbox={handleOpenInbox}
        onOpenHistory={handleOpenHistory}
        onOpenOperations={handleOpenOperations}
        onOpenNotifications={handleOpenNotifications}
        onOpenWeeklyWorkflowDialog={handleInitiateWeeklyWorkflow}
        onExportSuccess={showExportBanner}
      />

      <ClassHistoryDrawer
        isOpen={historyState.open}
        onClose={() => setHistoryState({ open: false, classInfo: null, date: null, initialTab: null })}
        classInfo={historyState.classInfo}
        date={historyState.date || selectedDate}
        initialTab={historyState.initialTab}
      />

      <InboxOutboxDrawer
        isOpen={inboxOutboxOpen}
        onClose={handleCloseInbox}
        classId={inboxClassId}
        initialTab={inboxInitialTab}
      />

      <ScheduleMarksActionsDialog
        open={marksActionsDialogOpen}
        onClose={() => setMarksActionsDialogOpen(false)}
        program={selection?.program}
        academicTerm={selection?.academicTerm}
        cls={selectedSession?.class}
        subject={selectedSession?.class?.subject || null}
      />

      <WelcomeContextSwitcher
        open={contextSwitcherOpen}
        onClose={() => setContextSwitcherOpen(false)}
        selection={selection}
        onSelectTerm={handleTermSelect}
      />

      <Dialog
        open={closeWeekDialogOpen}
        onClose={() => setCloseWeekDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock size={20} color="#dc2626" />
          {t('close_week_title', 'Close Week')}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            {t('close_week_warning', 'Closing this week will prevent further attendance changes. An official weekly report will be generated. This action can be reversed by reopening the week.')}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCloseWeekDialogOpen(false)}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleCloseWeek}>
            {t('close_week_confirm', 'Close Week')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteWeeklyWorkflow}
        title={t('delete_workflow', 'Delete Workflow')}
        message={t('confirm_delete_weekly_workflow', 'Delete this weekly workflow? This cannot be undone.')}
        confirmText={t('delete', 'Delete')}
        cancelText={t('cancel', 'Cancel')}
        loading={weeklyWorkflowLoading}
        variant="danger"
      />

      {/* Initiate Weekly Workflow confirmation dialog */}
      <Dialog
        open={initiateWeeklyDialogOpen}
        onClose={() => setInitiateWeeklyDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarPlus size={20} color="#2563eb" />
          {weeklyInProgressWorkflow
            ? t('weekly_workflow_exists_title', 'Weekly Workflow Exists')
            : t('initiate_weekly_workflow_title', 'Initiate Weekly Workflow')}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
          {(() => {
            const renderWorkflowHistoryList = (docs, activeDoc) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {docs.length === 0 ? (
                  <Box sx={{ fontSize: 13, color: 'text.secondary' }}>{t('no_workflow_history', 'No workflow history')}</Box>
                ) : (
                  docs.map((doc) => {
                    const isActive = activeDoc && String(doc.id) === String(activeDoc.id);
                    const docColor = getWeeklyWorkflowStatusColor(doc.status);
                    const docDate = doc.updatedAt
                      ? formatSnapshotDate(doc.updatedAt)
                      : (doc.createdAt ? formatSnapshotDate(doc.createdAt) : '—');
                    const fileId = doc.file?.id || doc.fileId;
                    return (
                      <Box
                        key={doc.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          p: 1,
                          border: '1px solid',
                          borderColor: isActive ? docColor : 'divider',
                          borderRadius: 1,
                          backgroundColor: isActive ? `${docColor}14` : 'transparent',
                        }}
                      >
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: docColor, marginTop: 4, flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: docColor }}>{doc.status}</span>
                            {isActive && (
                              <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 999, backgroundColor: docColor, color: '#fff' }}>
                                {t('active', 'Active')}
                              </span>
                            )}
                            <span style={{ fontSize: 12, color: 'text.secondary' }}>{docDate}</span>
                          </Box>
                          {doc.submitter?.displayName && (
                            <Box sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                              {t('submitter', 'Submitter')}: {doc.submitter.displayName}
                            </Box>
                          )}
                          {doc.class && (
                            <Box sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                              {t('class', 'Class')}: {lang === 'ar'
                                ? (doc.class.nameAr || doc.class.nameEn || doc.class.code || doc.class.id)
                                : (doc.class.nameEn || doc.class.nameAr || doc.class.code || doc.class.id)}
                            </Box>
                          )}
                          {doc.comments?.[0]?.comment && (
                            <Box sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
                              {t('latest_comment', 'Latest comment')}: {doc.comments[0].comment}
                            </Box>
                          )}
                        </Box>
                        {fileId && (
                          <Button
                            size="small"
                            onClick={() => window.open(`/api/v1/drive/files/${fileId}/download`, '_blank')}
                            sx={{ textTransform: 'none', fontSize: 12, minWidth: 0, px: 1 }}
                          >
                            {t('open_file', 'File')}
                          </Button>
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>
            );

            if (weeklyInProgressWorkflow) {
              const color = getWeeklyWorkflowStatusColor(weeklyInProgressWorkflow.status);
              const date = weeklyInProgressWorkflow.updatedAt
                ? formatSnapshotDate(weeklyInProgressWorkflow.updatedAt)
                : (weeklyInProgressWorkflow.createdAt ? formatSnapshotDate(weeklyInProgressWorkflow.createdAt) : '—');
              const isApproved = weeklyInProgressWorkflow.status === 'APPROVED';
              const history = (weeklyWorkflowHistory || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <Alert severity={isApproved ? 'success' : 'info'} icon={<CalendarPlus size={18} color={color} />}>
                    {isApproved
                      ? t('weekly_workflow_approved_locked', 'A weekly workflow is approved for this week. Attendance is locked.')
                      : t('weekly_workflow_exists', 'A weekly workflow already exists for this week.')}
                  </Alert>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 14, color: color, fontWeight: 600 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color }} />
                    {t('workflow_status', 'Status')}: {weeklyInProgressWorkflow.status} · {date}
                    <IconButton
                      size="small"
                      sx={{ ml: 'auto', color }}
                      title={t('view_on_operations_board', 'View on Operations Board')}
                      onClick={() => { goToWeeklyWorkflowOnBoard(); setInitiateWeeklyDialogOpen(false); }}
                    >
                      <ExternalLink size={16} />
                    </IconButton>
                  </Box>

                  {isApproved && (
                    <Alert severity="warning">
                      {t('weekly_workflow_reject_to_amend', 'To change attendance or generate a new weekly summary, reject this approved workflow first. The rejected version will remain in history.')}
                    </Alert>
                  )}

                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Box sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                      {t('weekly_workflow_history', 'Workflow attempts for this week')}
                    </Box>
                    {weeklyWorkflowHistoryLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: 'text.secondary' }}>
                        <CircularProgress size={14} />
                        {t('loading', 'Loading...')}
                      </Box>
                    ) : (
                      renderWorkflowHistoryList(history, weeklyInProgressWorkflow)
                    )}
                  </Box>
                </Box>
              );
            }

            const { weekFrom, weekTo } = getWeekRange(selectedDate);
            const { notTakenEntries, lateEntries, notTakenTotal, lateTotal, canInitiate, missingDailyDays, weekNum } = weeklyWorkflowDialogState;
            const notTakenHasUnknownCount = notTakenEntries.some((e) => e.count == null);

            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {notTakenEntries.length > 0 && (
                  <Alert
                    variant="outlined"
                    icon={<Clock size={18} color="#9e9e9e" />}
                    sx={{
                      borderColor: '#9e9e9e',
                      color: '#616161',
                      backgroundColor: 'transparent',
                      '& .MuiAlert-icon': { color: '#9e9e9e' },
                    }}
                  >
                    <Box sx={{ fontWeight: 600, mb: 0.5 }}>
                      {t('weekly_workflow_warning_not_taken', 'Some attendance records are not yet taken')} ({notTakenHasUnknownCount ? notTakenEntries.length : notTakenTotal})
                    </Box>
                    <Box sx={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                      {(() => {
                        const grouped = notTakenEntries.reduce((acc, { className, dateLabel, count }) => {
                          if (!acc[className]) acc[className] = [];
                          const label = count != null ? `${dateLabel}: ${count} ${t('operations_board_lane_not_taken', 'Not yet')}` : dateLabel;
                          acc[className].push(label);
                          return acc;
                        }, {});
                        return Object.entries(grouped).map(([className, dates]) => (
                          <Box key={className} sx={{ mb: 0.5 }}>
                            <Box sx={{ fontWeight: 600 }}>{className}</Box>
                            {dates.map((dateLabel, i) => (
                              <div key={i} style={{ opacity: 0.85, paddingInlineStart: 12 }}>{dateLabel}</div>
                            ))}
                          </Box>
                        ));
                      })()}
                    </Box>
                  </Alert>
                )}
                {lateEntries.length > 0 && (
                  <Alert severity="warning" variant="outlined">
                    <Box sx={{ fontWeight: 600, mb: 0.5 }}>
                      {t('weekly_workflow_warning_late', 'Late records require review before finalizing')} ({lateTotal})
                    </Box>
                    <Box sx={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                      {(() => {
                        const grouped = lateEntries.reduce((acc, { className, dateLabel, count }) => {
                          if (!acc[className]) acc[className] = [];
                          acc[className].push({ dateLabel, count });
                          return acc;
                        }, {});
                        return Object.entries(grouped).map(([className, items]) => (
                          <Box key={className} sx={{ mb: 0.5 }}>
                            <Box sx={{ fontWeight: 600 }}>{className}</Box>
                            {items.map(({ dateLabel, count }, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  gap: 12,
                                  alignItems: 'center',
                                  opacity: 0.85,
                                  paddingInlineStart: 12,
                                  paddingTop: 2,
                                  paddingBottom: 2,
                                }}
                              >
                                <span>{dateLabel}</span>
                                <span style={{ fontWeight: 600, minWidth: 60 }}>{count} {t('late', 'late')}</span>
                              </div>
                            ))}
                          </Box>
                        ));
                      })()}
                    </Box>
                  </Alert>
                )}
                {missingDailyDays.length > 0 && (
                  <Alert
                    variant="outlined"
                    icon={<Clock size={18} color={isDark ? '#f87171' : '#ef4444'} />}
                    sx={{
                      borderColor: isDark ? '#ef4444' : '#fca5a5',
                      color: isDark ? '#fca5a5' : '#b91c1c',
                      backgroundColor: 'transparent',
                      '& .MuiAlert-icon': { color: isDark ? '#f87171' : '#ef4444' },
                    }}
                  >
                    <Box sx={{ fontWeight: 600, mb: 0.5 }}>
                      {t('weekly_workflow_missing_daily_attendance', 'Missing Daily Attendance')} ({missingDailyDays.length})
                    </Box>
                    <Box sx={{ maxHeight: 120, overflow: 'auto', fontSize: 12, mb: 1 }}>
                      {missingDailyDays.map((entry, i) => (
                        <div key={i} style={{ paddingInlineStart: 12, marginBottom: 4 }}>
                          <div style={{ opacity: 0.85 }}>{entry.date}</div>
                          {entry.classes?.length > 0 && (
                            <div style={{ paddingInlineStart: 12, fontWeight: 600, color: isDark ? '#fca5a5' : '#b91c1c' }}>
                              {entry.classes.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </Box>
                    <Box sx={{ fontSize: 12, mb: 1, color: isDark ? '#f87171' : '#991b1b' }}>
                      {t('weekly_workflow_take_daily_attendance_first', 'Take daily attendance for all selected classes on these days before initiating the weekly workflow.')}
                    </Box>
                  </Alert>
                )}
                {notTakenEntries.length === 0 && lateEntries.length === 0 && canInitiate && (
                  <Alert severity="info">
                    {t('weekly_workflow_ready', 'All selected classes have attendance taken and no late records. The weekly summary will cover')} {t('week')} {weekNum}: {weekFrom} {t('to', 'to')} {weekTo}.
                  </Alert>
                )}

                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  <Box sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                    {t('weekly_workflow_include_classes', 'Include classes in weekly summary')}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {weeklyDialogClasses.length === 0 ? (
                      <Box sx={{ fontSize: 13, color: 'text.secondary' }}>{t('no_classes', 'No classes')}</Box>
                    ) : (
                      weeklyDialogClasses.map((cls) => {
                        const label = lang === 'ar' ? (cls.nameAr || cls.nameEn || cls.code || cls.id) : (cls.nameEn || cls.nameAr || cls.code || cls.id);
                        const checked = weeklySelectedClassIds.some((id) => String(id) === String(cls.id));
                        return (
                          <FormControlLabel
                            key={cls.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={checked}
                                onChange={() => {
                                  setWeeklySelectedClassIds((prev) => {
                                    const set = new Set(prev.map(String));
                                    if (set.has(String(cls.id))) set.delete(String(cls.id));
                                    else set.add(String(cls.id));
                                    return Array.from(set).map((s) => (s.includes('.') ? s : Number(s)));
                                  });
                                }}
                              />
                            }
                            label={label}
                            sx={{ m: 0 }}
                          />
                        );
                      })
                    )}
                  </Box>
                </Box>

                {weeklyWorkflowHistory.length > 0 && (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Box sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                      {t('weekly_workflow_previous_attempts', 'Previous attempts')}
                    </Box>
                    {weeklyWorkflowHistoryLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: 'text.secondary' }}>
                        <CircularProgress size={14} />
                        {t('loading', 'Loading...')}
                      </Box>
                    ) : (
                      renderWorkflowHistoryList(
                        weeklyWorkflowHistory.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
                        null
                      )
                    )}
                  </Box>
                )}
              </Box>
            );
          })()}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {weeklyInProgressWorkflow ? (
            <>
              <Button variant="contained" onClick={() => { goToWeeklyWorkflowOnBoard(); setInitiateWeeklyDialogOpen(false); }}>
                {t('view_on_operations_board', 'View on Operations Board')}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setInitiateWeeklyDialogOpen(false)}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={weeklyWorkflowLoading || weeklySelectedClassIds.length === 0 || !weeklyWorkflowDialogState.canInitiate}
                onClick={handleConfirmInitiateWeeklyWorkflow}
              >
                {weeklyWorkflowLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                {`${t('initiate_weekly_workflow_confirm_button', 'Initiate Workflow')}${weeklySelectedClassIds.length > 0 ? ` (${weeklySelectedClassIds.length})` : ''}`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {false && weekClosure?.isClosed && (isHR || isAdmin || isSuperAdmin) && (
        <Alert
          severity="info"
          icon={<Lock size={18} />}
          sx={{ mx: 2, mb: 1, borderRadius: 1 }}
        >
          {t('week_closed_banner', 'This week is closed. Attendance changes are locked. Official report is available.')}
        </Alert>
      )}

      {exportBanner && (
        <div className="operations-board-action-announcement" data-testid="export-success-banner" style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1300 }}>
          <Announcement
            themed
            className="operations-board-action-announcement-pill text-white"
            style={{ backgroundColor: exportBanner.pillColor || '#059669' }}
          >
            <AnnouncementTag
              className="!bg-transparent !border-0 !p-0 text-white"
            >
              {exportBanner.icon || <CheckCircle2 size={16} className="shrink-0" />}
            </AnnouncementTag>
            <AnnouncementTitle className="text-xs font-medium gap-1.5">
              {exportBanner.message}
              <button
                type="button"
                className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-white/25 transition-colors"
                onClick={clearExportBanner}
                aria-label={t('dismiss') || 'Dismiss'}
              >
                <X size={14} />
              </button>
            </AnnouncementTitle>
          </Announcement>
        </div>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.progress != null ? null : 4000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setSnackbar((s) => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: 320, overflow: 'hidden' }}
        >
          {snackbar.message}
          {snackbar.progress != null && (
            <LinearProgress
              color={snackbar.severity}
              sx={{ mt: 1, borderRadius: 1 }}
            />
          )}
        </Alert>
      </Snackbar>

      <AttendanceViolationsModal
        isOpen={showAttSummaryModal}
        onClose={() => {
          if (attSummarySuccess?.blobUrl) {
            URL.revokeObjectURL(attSummarySuccess.blobUrl);
          }
          setAttSummarySuccess(null);
          setShowAttSummaryModal(false);
        }}
        subjects={cohortSubjects}
        selectedSubjects={attSummarySelectedSubjects}
        setSelectedSubjects={setAttSummarySelectedSubjects}
        selectedViolationTypes={attSummaryViolationTypes}
        setSelectedViolationTypes={setAttSummaryViolationTypes}
        dateFrom={attSummaryDateFrom}
        setDateFrom={setAttSummaryDateFrom}
        dateTo={attSummaryDateTo}
        setDateTo={setAttSummaryDateTo}
        exportFormat={attSummaryExportFormat}
        setExportFormat={setAttSummaryExportFormat}
        mode="official"
        onExport={handleAttSummaryExport}
        isExporting={attSummaryExporting}
        cls={selectedSession?.class || null}
        t={t}
        lang={lang}
        theme={theme}
        successResult={attSummarySuccess}
      />

      <style>{`
        .welcome-working-date-picker input {
          color: #2563eb !important;
          border-color: rgba(59, 130, 246, 0.45) !important;
        }
        .welcome-working-date-picker svg,
        .welcome-working-date-picker svg *,
        .welcome-working-date-picker .icon {
          color: #3b82f6 !important;
          stroke: #3b82f6 !important;
        }
        .violations-expanded-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1300;
          padding: 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          box-sizing: border-box;
          background: var(--welcome-violations-expanded-bg, #f8fafc);
        }
        [data-theme='dark'] .violations-expanded-overlay,
        .welcome-page--violations-expanded[style*='#0f172a'] .violations-expanded-overlay {
          background: #0f172a;
        }
        .welcome-page--violations-expanded {
          padding: 0 !important;
          height: 100vh !important;
          min-height: 0 !important;
        }
        .welcome-page--violations-expanded .selection-section {
          max-width: none !important;
          flex: 1;
          min-height: 0;
        }
        .violations-panel-expanded {
          padding: 24px 0 !important;
          border: none !important;
          border-radius: 12px !important;
          background: transparent !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
          flex: 1 !important;
          min-height: 0 !important;
          height: 100% !important;
        }
        .marks-expanded-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1300;
          padding: 12px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          box-sizing: border-box;
          background: var(--welcome-marks-expanded-bg, #f8fafc);
        }
        [data-theme='dark'] .marks-expanded-overlay,
        .welcome-page--marks-expanded[style*='#0f172a'] .marks-expanded-overlay {
          background: #0f172a;
        }
        .welcome-page--marks-expanded {
          padding: 0 !important;
          height: 100vh !important;
          min-height: 0 !important;
        }
        .welcome-page--marks-expanded .selection-section {
          max-width: none !important;
          flex: 1;
          min-height: 0;
        }
        .marks-panel-expanded {
          padding: 24px 0 !important;
          border: none !important;
          border-radius: 12px !important;
          background: transparent !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
          flex: 1 !important;
          min-height: 0 !important;
          height: 100% !important;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <WeeklyWorkflowCreatedDialog
        open={weeklyCreatedDialogOpen}
        onClose={() => setWeeklyCreatedDialogOpen(false)}
        results={weeklyCreatedResults.results}
        errors={weeklyCreatedResults.errors}
        cohortClasses={cohortClasses}
        selectedDate={selectedDate}
        programId={selection?.program?.id}
        termId={selection?.academicTerm?.id}
        onOpenWeekBoard={goToWeeklyWorkflowOnBoard}
      />

      {showAiBalloon && (
        <MiniChatBalloon groupRole="hr" groupLabel={t('mini_chat_hr_team') || 'HR Team'} />
      )}
    </div>
  );
};

export default WelcomePage;
