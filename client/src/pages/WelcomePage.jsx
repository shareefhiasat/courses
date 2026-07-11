import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import WelcomeHeader from '@components/welcome/WelcomeHeader';
import WelcomeContextSwitcher from '@components/welcome/WelcomeContextSwitcher';
import ProgramTermSelector from '@components/workspace/ProgramTermSelector';
import YearTermSelector from '@components/workspace/YearTermSelector';
import OfficialWeeklyScheduleGrid from '@components/workspace/OfficialWeeklyScheduleGrid';
import ClassHistoryDrawer from '@components/workspace/ClassHistoryDrawer';
import InboxOutboxDrawer from '@components/workspace/InboxOutboxDrawer';
import ScheduleContextMenu from '@components/workspace/ScheduleContextMenu';
import ScheduleSpeedDial from '@components/workspace/ScheduleSpeedDial';
import {
  Tabs, Tab, Box, Paper, Snackbar, Alert, LinearProgress,
  CircularProgress,
} from '@mui/material';
import DatePicker from '@components/ui/DatePicker/DatePicker';
import { getScheduleStatus, getInstructorPrograms, getAllPrograms, getProgramTerms } from '@services/business/attendanceWorkspaceService';
import { loadWeeklyScheduleSources } from '@services/business/weeklyScheduleExportService';
import { prepareWeeklyScheduleData } from '@services/export/official-reports/engine/prepareWeeklyScheduleData';
import { academicTermToYearTerm } from '@utils/academicTermUtils';
import useQRPermissions from '@hooks/useQRPermissions';
import { usePermissions } from '@hooks/usePermissions';
import { getThemedIcon } from '@constants/iconTypes';
import {
  SCHEDULE_FONT_SCALE_DEFAULT,
  SCHEDULE_FONT_SCALE_MIN,
  SCHEDULE_FONT_SCALE_MAX,
  SCHEDULE_FONT_SCALE_STEP,
  clampScheduleFontScale,
} from '@constants/scheduleFontScale';
import '../pages/operations/OperationsBoardPage.css';

const OperationsBoardPage = lazy(() => import('./operations/OperationsBoardPage.jsx'));

const WELCOME_SELECTION_KEY = 'welcome_selection';

function toIsoDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

const SCHEDULE_WORK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

function getWeekDayDates(selectedDate) {
  const anchor = selectedDate instanceof Date ? new Date(selectedDate) : new Date(selectedDate);
  const weekStart = new Date(anchor);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(12, 0, 0, 0);
  return SCHEDULE_WORK_DAYS.map((_, index) => {
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
      if (!isNaN(parsed.getTime())) return parsed;
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
  const { canExport } = useQRPermissions();
  const { canAccessScreen } = usePermissions();
  const showOperationsTab = canAccessScreen('operations') || canExport || isAdmin || isHR;
  const [exportingKey, setExportingKey] = useState(null);
  const [cohortClassIds, setCohortClassIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info', progress: null });
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
    tabs.push('overview');
    return tabs;
  }, [showOperationsTab]);

  const tabParam = searchParams.get('tab') || 'schedule';
  const activeTab = Math.max(0, visibleTabs.indexOf(visibleTabs.includes(tabParam) ? tabParam : 'schedule'));
  const boardExpanded = searchParams.get('expanded') === '1';
  const scheduleExpanded = searchParams.get('scheduleExpanded') === '1';

  const showSchedule = useMemo(() => Boolean(selection?.program && selection?.academicTerm), [selection]);

  // Sync selectedDate when the URL date param changes (e.g., browser back/forward)
  useEffect(() => {
    const urlDate = searchParams.get('date');
    if (!urlDate) return;
    const parsed = new Date(`${urlDate}T12:00:00`);
    if (isNaN(parsed.getTime())) return;
    const currentIso = selectedDate.toISOString().split('T')[0];
    if (urlDate !== currentIso) {
      setSelectedDate(parsed);
    }
  }, [searchParams]);

  const welcomeBoardContext = useMemo(() => {
    if (!selection?.program?.id || !selection?.academicTerm?.id) return null;
    return {
      programId: selection.program.id,
      termId: selection.academicTerm.id,
      date: selectedDate,
      classIds: cohortClassIds,
    };
  }, [selection, selectedDate, cohortClassIds]);

  const handleTabChange = useCallback((_, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', visibleTabs[value] || 'schedule');
      if (visibleTabs[value] !== 'operations') next.delete('expanded');
      return next;
    });
  }, [setSearchParams, visibleTabs]);

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

  useEffect(() => {
    const showFontSlider = (showSchedule && tabParam === 'schedule') || tabParam === 'operations';
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
        if (value != null && value !== '') next.set(key, String(value));
      });
      return next;
    });
  }, [setSearchParams]);

  const handleOpenOperations = useCallback((extraParams = {}) => {
    if (extraParams.date) {
      const parsed = new Date(`${extraParams.date}T12:00:00`);
      if (!isNaN(parsed.getTime())) setSelectedDate(parsed);
    }
    openOperationsTab(extraParams);
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
    { target: '[data-tour="welcome-tabs"]', content: t('tour_welcome_tabs') || 'Switch between the Schedule, Overview, and Operations tabs.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="welcome-week-nav"]', content: t('tour_welcome_week_nav') || 'Use the arrows to move between weeks.', disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="welcome-schedule-grid"]', content: t('tour_schedule_grid') || 'Click or double-click a class cell to open actions.', disableBeacon: true, placement: 'top' },
    ...(showOperationsTab ? [{ target: '[data-tour="welcome-operations-tab"]', content: t('tour_welcome_operations') || 'The Operations tab shows the attendance and workflow board for the selected date.', disableBeacon: true, placement: 'top' }] : []),
  ].filter(s => !!document.querySelector(s.target)), [t, showOperationsTab]);

  const startTour = useCallback(() => {
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
      ? (lang === 'ar' && selection.academicTerm.nameAr ? selection.academicTerm.nameAr : selection.academicTerm.nameEn)
      : null;
    const classId = searchParams.get('classId') || null;
    let className = null;
    if (classId && scheduleData) {
      for (const day of scheduleData.days || []) {
        for (const slot of Object.values(day.slots || {})) {
          if (slot && slot.classId && String(slot.classId) === String(classId)) {
            className = lang === 'ar' ? (slot.class?.nameAr || slot.subjectName) : (slot.class?.nameEn || slot.subjectName);
            break;
          }
        }
        if (className) break;
      }
    }
    window.dispatchEvent(new CustomEvent('welcome-wizard-nav', {
      detail: { programName, termLabel, workingDate: selectedDate, tab: tabParam, classId, className },
    }));
    return () => {
      window.dispatchEvent(new CustomEvent('welcome-wizard-nav', { detail: null }));
    };
  }, [selection, lang, selectedDate, tabParam, searchParams, scheduleData]);

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
        sessions: sources.sessions,
        breakSessions: sources.breakSessions,
        instructorAvailability: sources.instructorAvailability,
        timeSlots: sources.timeSlots,
        attachSessionMeta: true,
      });

      setScheduleData(prepared);

      const classIds = (sources.cohortClasses || []).map((c) => c.id).filter(Boolean);
      setCohortClassIds(classIds);
      if (classIds.length > 0) {
        const weekDates = getWeekDayDates(selectedDate);
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
      }
      setLoading(false);
    };

    loadSchedule();
  }, [selection?.program, selection?.academicTerm, selectedDate, lang]);

  const selectedWeekKey = useMemo(() => {
    const anchor = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    const weekStart = new Date(anchor);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return toIsoDate(weekStart);
  }, [selectedDate]);

  useEffect(() => {
    setSelectedSlot(null);
    setSelectedSession(null);
    setMenuAnchorEl(null);
  }, [selectedWeekKey]);

  const handleCellClick = useCallback((slot, anchor, openMenu = true) => {
    const session = slot?.session || (slot?.class ? {
      id: slot.sessionId,
      classId: slot.classId,
      class: slot.class,
      sessionType: slot.sessionType || 'lecture',
      instructor: slot.instructor,
    } : null);
    if (!session) return;
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
        next.set('date', toIsoDate(cellDate));
        return next;
      });
    }
    if (openMenu && anchor && typeof anchor.x === 'number') {
      const virtualEl = document.createElement('div');
      virtualEl.style.position = 'fixed';
      virtualEl.style.left = `${anchor.x}px`;
      virtualEl.style.top = `${anchor.y}px`;
      virtualEl.style.width = '0';
      virtualEl.style.height = '0';
      document.body.appendChild(virtualEl);
      setMenuAnchorEl(virtualEl);
    }
  }, [setSearchParams, selectedDate]);

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

  const handleOpenInbox = useCallback((tab, classId) => {
    setInboxInitialTab(tab);
    setInboxClassId(classId ?? null);
    setInboxOutboxOpen(true);
  }, []);

  const handleOpenHistory = useCallback((classInfo, date, initialTab = null) => {
    setHistoryState({ open: true, classInfo, date, initialTab });
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
    const key = `weekly-${format}`;
    setExportingKey(key);
    setSnackbar({
      open: true,
      message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — ${t('exporting')}…`,
      severity: 'info',
      progress: 0,
    });
    try {
      const { year, term } = academicTermToYearTerm(selection.academicTerm);
      await exportWeeklyScheduleForProgram({
        program: selection.program,
        academicTerm: selection.academicTerm,
        year,
        term,
        lang,
        t,
        user,
        format,
      });
      setSnackbar({
        open: true,
        message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — ${t('export_success')}`,
        severity: 'success',
        progress: null,
      });
    } catch (err) {
      console.error('[WelcomePage] weekly schedule export failed:', err);
      setSnackbar({
        open: true,
        message: `${t('weekly_schedule')} ${format === EXPORT_FORMAT.PDF ? t('export_pdf') : t('export_excel')} — ${t('export_failed')}`,
        severity: 'error',
        progress: null,
      });
    } finally {
      setExportingKey(null);
    }
  }, [selection?.program, selection?.academicTerm, lang, t, user]);

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
        id: 'operations-board',
        name: t('operations_board_title') || 'Operations Board',
        icon: getThemedIcon('ui', 'layout_grid', 20, 'currentColor'),
        onClick: () => openOperationsTab({ lane: 'status', view: 'kanban' }),
      },
      {
        id: 'attendance-official',
        name: t('official_attendance') || 'Attendance Official',
        icon: getThemedIcon('ui', 'file_signature', 20, 'currentColor'),
        onClick: () => navigate('/qr-scanner'),
      },
      {
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
      },
    ];

    return actions;
  }, [exportingKey, handleExportWeeklySchedule, openOperationsTab, t]);

  const handleCloseInbox = useCallback(() => {
    setInboxOutboxOpen(false);
    setInboxClassId(null);
  }, []);

  const handleFabAction = useCallback((action) => {
    if (!action.id.startsWith('weekly-')) {
      setSnackbar({
        open: true,
        message: `${action.name} — action triggered`,
        severity: 'info',
        progress: null,
      });
    }
  }, []);

  if (isStudent) return null;

  const pageBg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)';

  return (
    <div
      className={`welcome-page${scheduleExpanded ? ' welcome-page--schedule-expanded' : ''}${boardExpanded && tabParam === 'operations' ? ' welcome-page--operations-expanded' : ''}`}
      style={{
        minHeight: showSchedule ? 'calc(100vh - var(--navbar-height, 60px))' : '100vh',
        height: showSchedule ? 'calc(100vh - var(--navbar-height, 60px))' : 'auto',
        background: pageBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: showSchedule ? 'stretch' : 'center',
        padding: showSchedule && !scheduleExpanded && !(boardExpanded && tabParam === 'operations')
          ? '0 4px 4px'
          : (scheduleExpanded || (boardExpanded && tabParam === 'operations'))
            ? 0
            : '0 16px 48px',
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        boxSizing: 'border-box',
        ...(scheduleExpanded ? { '--welcome-schedule-expanded-bg': isDark ? '#0f172a' : '#f8fafc' } : {}),
        ...(boardExpanded && tabParam === 'operations' ? { '--welcome-operations-expanded-bg': isDark ? '#0f172a' : '#f8fafc' } : {}),
      }}
    >
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
          marginTop: 0,
          flex: selection?.program && selection?.academicTerm ? 1 : undefined,
          display: 'flex',
          flexDirection: 'column',
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
                : (boardExpanded && tabParam === 'operations' ? 'operations-panel-expanded' : '')
            }
            style={{
              background: (scheduleExpanded || (boardExpanded && tabParam === 'operations'))
                ? 'transparent'
                : (isDark ? '#0f172a' : '#f8fafc'),
              borderRadius: (scheduleExpanded || (boardExpanded && tabParam === 'operations')) ? 0 : '8px',
              padding: (scheduleExpanded || (boardExpanded && tabParam === 'operations')) ? 0 : '8px',
              border: (scheduleExpanded || (boardExpanded && tabParam === 'operations'))
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
                <Tab label={t('welcome_tab_overview') || 'Overview'} />
              </Tabs>
              {(() => {
                const classId = searchParams.get('classId');
                let className = null;
                if (classId && scheduleData) {
                  for (const day of scheduleData.days || []) {
                    for (const slot of Object.values(day.slots || {})) {
                      if (slot && slot.classId && String(slot.classId) === String(classId)) {
                        className = lang === 'ar' ? (slot.class?.nameAr || slot.subjectName) : (slot.class?.nameEn || slot.subjectName);
                        break;
                      }
                    }
                    if (className) break;
                  }
                }
                if (!className) return null;
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
                    border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#3b82f6',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {className}
                  </div>
                );
              })()}
              {showSchedule && tabParam === 'schedule' && (
                <div data-tour="welcome-week-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginRight: '36px' }}>
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDate);
                      prev.setDate(prev.getDate() - 7);
                      setSelectedDate(prev);
                    }}
                    aria-label={t('calendar_previous') || 'Previous week'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#94a3b8' : '#64748b',
                    }}
                    data-testid="welcome-week-prev"
                  >
                    {lang === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                  </button>
                  {(() => {
                    const ws = new Date(selectedDate);
                    ws.setDate(ws.getDate() - ws.getDay());
                    const we = new Date(ws);
                    we.setDate(we.getDate() + 4);
                    const fmt = (x) => `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`;
                    const jan1 = new Date(ws.getFullYear(), 0, 1);
                    const dayOfYear = Math.floor((ws - jan1) / 86400000) + 1;
                    const weekNum = Math.ceil(dayOfYear / 7);
                    return (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: isDark ? '#e2e8f0' : '#1e293b',
                        whiteSpace: 'nowrap',
                        padding: '0 6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <span style={{ display: 'inline-block', width: 38, textAlign: 'right' }}>W{weekNum}</span>
                        <span style={{ display: 'inline-block', width: 38, textAlign: 'center' }}>{fmt(ws)}</span>
                        <span style={{ opacity: 0.5 }}>-</span>
                        <span style={{ display: 'inline-block', width: 38, textAlign: 'center' }}>{fmt(we)}</span>
                      </span>
                    );
                  })()}
                  <button
                    onClick={() => {
                      const next = new Date(selectedDate);
                      next.setDate(next.getDate() + 7);
                      setSelectedDate(next);
                    }}
                    aria-label={t('calendar_next') || 'Next week'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#94a3b8' : '#64748b',
                    }}
                    data-testid="welcome-week-next"
                  >
                    {lang === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>
              )}
              {showSchedule && tabParam === 'operations' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, justifyContent: 'center', marginRight: '36px' }}>
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDate);
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDate(prev);
                    }}
                    aria-label={t('calendar_previous') || 'Previous day'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#94a3b8' : '#64748b',
                    }}
                    data-testid="welcome-day-prev"
                  >
                    {lang === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  </button>
                  <DatePicker
                    value={selectedDate.toISOString().slice(0, 10)}
                    onChange={(value) => {
                      const iso = typeof value === 'string' ? value : value?.toISOString?.()?.slice(0, 10);
                      if (iso) setSelectedDate(new Date(`${iso}T12:00:00`));
                    }}
                    theme={isDark ? 'dark' : 'light'}
                    showIcon
                    compact
                    className="welcome-working-date-picker"
                    data-testid="welcome-working-date"
                    style={{ width: 100 }}
                  />
                  <button
                    onClick={() => {
                      const next = new Date(selectedDate);
                      next.setDate(next.getDate() + 1);
                      setSelectedDate(next);
                    }}
                    aria-label={t('calendar_next') || 'Next day'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#94a3b8' : '#64748b',
                    }}
                    data-testid="welcome-day-next"
                  >
                    {lang === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
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
                      instructorId={isInstructor ? instructorId : null}
                      interactiveAll={canInteractAll}
                      selectedDate={selectedDate}
                      selectedSlot={selectedSlot}
                      onCellClick={handleCellClick}
                      onDateChange={setSelectedDate}
                      compact
                      fillHeight
                      fillWidth
                      fontScale={scheduleFontScale}
                      expanded={scheduleExpanded}
                      onToggleExpand={handleToggleScheduleExpand}
                    />
                    {selectedSlot && !menuAnchorEl && selectedSession && (
                      <ScheduleSpeedDial
                        session={selectedSession}
                        selectedDate={clickedDate || selectedDate}
                        program={selection?.program}
                        academicTerm={selection?.academicTerm}
                        onClose={handleClearSelection}
                        onOpenInbox={handleOpenInbox}
                        onOpenHistory={handleOpenHistory}
                      />
                    )}
                  </div>
                )}

              </div>
            )}

            {tabParam === 'overview' && (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    maxWidth: 480,
                    bgcolor: 'transparent',
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📊</div>
                  <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
                    {t('welcome_dummy_title') || 'Overview'}
                  </div>
                  <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 14 }}>
                    {t('welcome_dummy_description') || 'This tab will show an overview dashboard. Content coming soon.'}
                  </div>
                </Paper>
              </Box>
            )}

            {tabParam === 'operations' && showOperationsTab && (
              <div
                data-tour="welcome-operations-tab"
                className={boardExpanded ? 'operations-expanded-overlay' : ''}
                style={boardExpanded ? undefined : { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
              >
                <div className="welcome-operations-panel" data-testid="operations-board-shell">
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
                      welcomeContext={welcomeBoardContext}
                      fontScale={scheduleFontScale}
                      onOpenHistory={handleOpenHistory}
                      onDateChange={setSelectedDate}
                    />
                  </Suspense>
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

      <WelcomeContextSwitcher
        open={contextSwitcherOpen}
        onClose={() => setContextSwitcherOpen(false)}
        selection={selection}
        onSelectTerm={handleTermSelect}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.progress !== null ? null : 4000}
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
          {snackbar.progress !== null && (
            <LinearProgress
              color={snackbar.severity}
              sx={{ mt: 1, borderRadius: 1 }}
            />
          )}
        </Alert>
      </Snackbar>

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
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
