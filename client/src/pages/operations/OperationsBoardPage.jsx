import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Joyride from 'react-joyride';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { SimpleLoading } from '@ui';
import { error as logError, info as logInfo } from '@services/utils/logger.js';
import chatSocket from '@services/realtime/chatSocket.js';
import { Announcement, AnnouncementTag, AnnouncementTitle } from '@/components/kibo-ui/announcement';
import { Banner, BannerIcon, BannerTitle, BannerClose } from '@/components/kibo-ui/banner';
import { toast } from 'sonner';
import { Undo2, Info, AlertTriangle, CheckCircle2, AlertCircle, X, Lock } from 'lucide-react';
import { isOnboardingTourEnabled, endManualTour } from '@utils/tourConfig.js';
import './OperationsBoardPage.css';
import {
  fetchWorkflowBoardData,
  fetchAttendanceBoardData,
  moveWorkflowCard,
  moveAttendanceCard,
  WORKFLOW_COLUMNS,
  ATTENDANCE_COLUMNS,
  ATTENDANCE_BOARD_LANES,
  normalizeAttendanceStatus,
} from '@services/business/operationsBoardService.js';
import { getStatusCodeFromRecord, getAttendanceColor } from '../../constants/attendanceTypes.js';
import { getWorkflowStatusColor } from '@constants/workspaceStatusColors.js';
import WorkflowBoard from '@components/operations-board/WorkflowBoard.jsx';
import AttendanceBoard from '@components/operations-board/AttendanceBoard.jsx';
import BoardTableView from '@components/operations-board/BoardTableView.jsx';
import BoardFilterBar from '@components/operations-board/BoardFilterBar.jsx';
import ClassHistoryDrawer from '@components/workspace/ClassHistoryDrawer.jsx';
import BoardFooter from '@components/operations-board/BoardFooter.jsx';
import { getAttendanceColumnsForRole, canMoveAttendanceToColumn, canEditAttendanceForWorkflow } from '@components/operations-board/attendanceBoardRules.js';
import {
  getWorkflowColumnsForRole,
  canMoveWorkflowToColumn,
  shouldConfirmWorkflowMove,
  requiresAdminInstructorOverride,
  resolveWorkflowNotifyMeta,
} from '@components/operations-board/workflowBoardRules.js';
import { resolveBoardStudentName, resolveBoardClassName, formatBoardDate } from '@components/operations-board/operationsBoardDisplayUtils.js';
import WorkflowMoveConfirmDialog from '@components/operations-board/WorkflowMoveConfirmDialog.jsx';
import AttendanceStatusChangeDialog from '@components/operations-board/AttendanceStatusChangeDialog.jsx';
import ApprovalSuccessDialog from '@components/workflow/ApprovalSuccessDialog.jsx';
import { generateWeeklyViolationSnapshot, generateDailyViolationSnapshot, getWeekRange } from '@services/business/workflowSnapshotService.js';
import { exportDailyOfficialForDate } from '@services/business/accessScopeExportService.js';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';

const VIEWS = { KANBAN: 'kanban', LIST: 'list', TABLE: 'table' };
const LANES = { STATUS: 'status', ATTENDANCE: 'attendance' };
const SORT_MODES = { SYSTEM: 'system', ALPHA: 'alpha', MILITARY_ID: 'military_id' };
const { NOT_TAKEN } = ATTENDANCE_BOARD_LANES;

const DEFAULT_LANE_WIDTH = 240;
const MIN_LANE_WIDTH = 140;
const MAX_LANE_WIDTH = 560;
const MAX_LANE_NAME_CHARS = 30;
const BASE_COLLAPSED_LANE_WIDTH = 84;
const MIN_COLLAPSED_LANE_WIDTH = 72;
const MAX_COLLAPSED_LANE_WIDTH = 120;
const LANE_GAP = 16;
const LANE_COLLAPSE_KEY = 'operations_board_collapsed_lanes';
const LANE_COLLAPSE_VERSION = 2; // bump when default collapse logic changes to invalidate stale localStorage

function loadStoredLaneWidths() {
  try {
    const raw = localStorage.getItem('operations_board_lane_widths');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadCollapsedLanes() {
  try {
    const raw = localStorage.getItem(LANE_COLLAPSE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && parsed._v !== LANE_COLLAPSE_VERSION) {
      localStorage.removeItem(LANE_COLLAPSE_KEY);
      return {};
    }
    const { _v, ...lanes } = parsed || {};
    return lanes && typeof lanes === 'object' ? lanes : {};
  } catch {
    return {};
  }
}

function getDefaultCollapsedForRole(roleContext = {}) {
  const { isHR, isAdmin, isSuperAdmin } = roleContext;
  if (isSuperAdmin) return [];
  if (isAdmin) return ['DRAFT', 'REJECTED'];
  if (isHR) return ['DRAFT'];
  return [];
}

function hasStoredCollapsed(boardKey) {
  try {
    const raw = localStorage.getItem(LANE_COLLAPSE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed?._v !== LANE_COLLAPSE_VERSION) return false;
    return Array.isArray(parsed?.[boardKey]);
  } catch {
    return false;
  }
}

/** Equal-distribute expanded lanes across full container width (no max clamp). */
function computeEqualLaneWidths(
  columnIds,
  containerWidth,
  collapsedSet = new Set(),
  collapsedLaneWidth = BASE_COLLAPSED_LANE_WIDTH,
) {
  console.log('[computeEqualLaneWidths] input:', { columnIds, containerWidth, collapsedSet: [...collapsedSet], collapsedLaneWidth });
  if (!columnIds?.length) return {};
  const expandedIds = columnIds.filter((id) => !collapsedSet.has(id));
  const collapsedIds = columnIds.filter((id) => collapsedSet.has(id));
  const n = columnIds.length;
  const totalGap = LANE_GAP * Math.max(0, n - 1);
  const collapsedTotal = collapsedIds.length * collapsedLaneWidth;
  const available = Math.max(0, (containerWidth || 0) - totalGap - collapsedTotal);
  const result = {};
  collapsedIds.forEach((id) => { result[id] = collapsedLaneWidth; });
  if (!expandedIds.length) return result;
  if (!available) {
    expandedIds.forEach((id) => { result[id] = DEFAULT_LANE_WIDTH; });
    return result;
  }
  const base = Math.max(MIN_LANE_WIDTH, Math.floor(available / expandedIds.length));
  let remainder = available - base * expandedIds.length;
  expandedIds.forEach((id, index) => {
    result[id] = base + (index < remainder ? 1 : 0);
  });
  console.log('[computeEqualLaneWidths] result:', result);
  return result;
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value) {
  if (!value) return todayIso();
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function filterBoardData(data, search, lang) {
  if (!search?.trim()) return data;
  const q = search.trim().toLowerCase();
  return data.filter((item) => {
    const names = [item.name, item.nameEn, item.nameAr, item.className, item.classNameEn, item.classNameAr]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());
    return names.some((v) => v.includes(q))
      || item.assignee?.toLowerCase().includes(q)
      || item.workflowType?.toLowerCase().includes(q);
  });
}

function sortBoardData(data, sortBy, lang) {
  if (sortBy === SORT_MODES.ALPHA) {
    const byColumn = {};
    for (const item of data) {
      const col = item.column || '_';
      if (!byColumn[col]) byColumn[col] = [];
      byColumn[col].push(item);
    }
    const sorted = [];
    for (const items of Object.values(byColumn)) {
      items.sort((a, b) =>
        resolveBoardStudentName(a, lang).localeCompare(
          resolveBoardStudentName(b, lang),
          undefined,
          { sensitivity: 'base', numeric: true },
        ),
      );
      sorted.push(...items);
    }
    return sorted;
  }
  return data;
}

export default function OperationsBoardPage({
  embedded = false,
  expanded = false,
  onToggleExpand,
  welcomeContext = null,
  fontScale = 100,
  onOpenHistory = null,
  onDateChange = null,
  viewMode = 'day',
  onBoardDataChanged = null,
  onExportDailyTemplate = null,
  onExportWeeklySchedule = null,
  exportingKey = null,
  isWeekLocked = false,
  weeklyWorkflowMap = {},
  onSelectedWorkflowChange = null,
}) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user, isInstructor, isAdmin, isHR, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleContext = useMemo(() => ({
    isInstructor, isAdmin, isHR, isSuperAdmin,
  }), [isInstructor, isAdmin, isHR, isSuperAdmin]);

  const isInstructorOnly = isInstructor && !isAdmin && !isHR && !isSuperAdmin;
  const lane = isInstructorOnly ? LANES.ATTENDANCE : (searchParams.get('lane') || (searchParams.get('mode') === 'attendance' ? LANES.ATTENDANCE : LANES.STATUS));
  const rawView = searchParams.get('view') || VIEWS.KANBAN;
  const view = rawView === VIEWS.LIST ? VIEWS.TABLE : (rawView === VIEWS.TABLE ? VIEWS.TABLE : VIEWS.KANBAN);
  const workflowId = searchParams.get('workflowId');
  const calendarView = searchParams.get('calendarView');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastLocalChangeRef = useRef(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionBanner, setActionBanner] = useState(null);
  const actionBannerTimerRef = useRef(null);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [panelTab, setPanelTab] = useState(() => {
    const urlPanel = searchParams.get('panelTab');
    return urlPanel === 'calendar' || urlPanel === 'board' ? urlPanel : 'board';
  });
  const [laneWidths, setLaneWidths] = useState(loadStoredLaneWidths);
  const [laneSizingMode, setLaneSizingMode] = useState('manual');
  const [collapsedLanes, setCollapsedLanes] = useState(loadCollapsedLanes);
  const [pendingWorkflowMove, setPendingWorkflowMove] = useState(null);
  const [pendingAttendanceMove, setPendingAttendanceMove] = useState(null);
  const [workflowMoveLoading, setWorkflowMoveLoading] = useState(false);
  const [approvalSnapshot, setApprovalSnapshot] = useState(null);
  const [drawerTab, setDrawerTab] = useState(null);
  const [participationRefreshKey, setParticipationRefreshKey] = useState(0);
  const resizingLaneRef = useRef(null);
  const boardViewportRef = useRef(null);
  const [boardViewportWidth, setBoardViewportWidth] = useState(0);
  const collapsedLaneWidth = useMemo(() => {
    const raw = Math.round(BASE_COLLAPSED_LANE_WIDTH * (fontScale / 100));
    return Math.max(MIN_COLLAPSED_LANE_WIDTH, Math.min(MAX_COLLAPSED_LANE_WIDTH, raw));
  }, [fontScale]);
  const noWorkflowsToastShownRef = useRef(false);
  const skipCollapseRedistributeRef = useRef(false);
  const autoFitAppliedRef = useRef(false);
  const prevViewportWidthRef = useRef(0);
  const prevExpandedRef = useRef(expanded);

  const measureBoardViewport = useCallback(() => {
    return boardViewportRef.current?.clientWidth || boardViewportWidth || 0;
  }, [boardViewportWidth]);

  useEffect(() => {
    const el = boardViewportRef.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setBoardViewportWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [panelTab, view, lane]);

  // Drag-to-scroll horizontally on the board viewport
  useEffect(() => {
    const el = boardViewportRef.current;
    if (!el) return undefined;

    let isDragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const isInteractiveTarget = (target) => {
      return target.closest(
        '.operations-attendance-card, .operations-workflow-card, .operations-board-card-collapsed, ' +
        'button, [role="button"], [role="separator"], ' +
        '.operations-board-lane-resize-handle, input, a, [data-dnd-draggable]'
      );
    };

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      if (isInteractiveTarget(e.target)) return;
      const hasOverflow = el.scrollWidth > el.clientWidth;
      if (!hasOverflow) return;
      isDragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      if (Math.abs(delta) > 3) moved = true;
      el.scrollLeft = startScroll - delta;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      el.style.cursor = '';
      el.style.userSelect = '';
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [panelTab, view, lane]);

  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem('operations_board_sort') || SORT_MODES.SYSTEM;
    } catch {
      return SORT_MODES.SYSTEM;
    }
  });

  const [showAvatars, setShowAvatars] = useState(() => {
    try {
      if (isInstructorOnly) return true;
      return localStorage.getItem('operations_board_show_avatars') !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleShowAvatars = useCallback(() => {
    setShowAvatars((prev) => {
      const next = !prev;
      try { localStorage.setItem('operations_board_show_avatars', String(next)); } catch {}
      return next;
    });
  }, []);

  const clearActionBanner = useCallback(() => {
    if (actionBannerTimerRef.current) {
      clearTimeout(actionBannerTimerRef.current);
      actionBannerTimerRef.current = null;
    }
    setActionBanner(null);
  }, []);

  const showActionBanner = useCallback((banner) => {
    clearActionBanner();
    setActionBanner(banner);
    actionBannerTimerRef.current = setTimeout(() => {
      setActionBanner(null);
      actionBannerTimerRef.current = null;
    }, 8000);
  }, [clearActionBanner]);

  const showDragInvalidBanner = useCallback((toColumn) => {
    const laneLabel = toColumn ? (t(`operations_board_lane_${toColumn.toLowerCase()}`) || toColumn) : '';
    const message = laneLabel
      ? t('operations_board_drop_not_allowed_lane', { lane: laneLabel })
      : t('operations_board_drag_invalid');
    showActionBanner({
      pillColor: '#f97316',
      icon: <AlertTriangle size={16} className="shrink-0" />,
      message,
    });
  }, [t, showActionBanner]);

  const showAttendanceLockBanner = useCallback((message) => {
    showActionBanner({
      pillColor: '#dc2626',
      icon: <Lock size={16} className="shrink-0" />,
      message,
    });
  }, [showActionBanner]);

  const handleAttendanceDragRejected = useCallback((arg) => {
    if (arg && typeof arg === 'object' && arg.type === 'locked') {
      showAttendanceLockBanner(arg.message);
      return;
    }
    showDragInvalidBanner(arg);
  }, [showDragInvalidBanner, showAttendanceLockBanner]);

  useEffect(() => () => {
    if (actionBannerTimerRef.current) clearTimeout(actionBannerTimerRef.current);
  }, []);

  const handleSortChange = useCallback((mode) => {
    setSortBy(mode);
    try { localStorage.setItem('operations_board_sort', mode); } catch {}
  }, []);

  const startLaneResize = useCallback((columnId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setLaneSizingMode('manual');
    console.log('[startLaneResize] start:', { columnId, startWidth: laneWidths[columnId] || DEFAULT_LANE_WIDTH });
    const startX = e.clientX;
    const startWidth = laneWidths[columnId] || DEFAULT_LANE_WIDTH;
    const widthRef = { current: startWidth };
    resizingLaneRef.current = { columnId, startX, startWidth };

    const onMove = (ev) => {
      if (!resizingLaneRef.current) return;
      const rawDelta = ev.clientX - resizingLaneRef.current.startX;
      const delta = lang === 'ar' ? -rawDelta : rawDelta;
      const newWidth = Math.max(MIN_LANE_WIDTH, Math.min(MAX_LANE_WIDTH, resizingLaneRef.current.startWidth + delta));
      widthRef.current = newWidth;
      setLaneWidths((prev) => ({ ...prev, [columnId]: newWidth }));
    };
    const onUp = () => {
      console.log('[startLaneResize] end:', { columnId, finalWidth: widthRef.current });
      setLaneWidths((prev) => {
        const next = { ...prev, [columnId]: widthRef.current };
        try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(next)); } catch {}
        return next;
      });
      resizingLaneRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [laneWidths, lang]);

  const autoFitLane = useCallback((columnId) => {
    const root = boardViewportRef.current || document;
    const laneEl = root.querySelector(`[data-testid="operations-board-column-${columnId}"]`);
    if (!laneEl) {
      console.log('[autoFitLane] lane element not found for column:', columnId);
      return;
    }
    const cards = laneEl.querySelectorAll('.operations-attendance-card, .operations-workflow-card');
    console.log('[autoFitLane] column:', columnId, '| lane offsetWidth:', laneEl.offsetWidth, '| cards found:', cards.length);
    let maxContent = 0;
    cards.forEach((card, idx) => {
      const prevWidth = card.style.width;
      const prevMaxWidth = card.style.maxWidth;
      card.style.width = 'max-content';
      card.style.maxWidth = 'none';
      const measured = card.offsetWidth;
      maxContent = Math.max(maxContent, measured);
      // Find the widest descendants to identify what is driving the width
      const widest = [...card.querySelectorAll('*')]
        .map((el) => ({ el, w: el.scrollWidth }))
        .sort((a, b) => b.w - a.w)
        .slice(0, 5)
        .map(({ el, w }) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')}=${w}px`);
      console.log(`[autoFitLane] card[${idx}] id=${card.id || card.getAttribute('column') || '?'} measured=${measured}px scrollWidth=${card.scrollWidth}px | widest children:`, widest);
      card.style.width = prevWidth;
      card.style.maxWidth = prevMaxWidth;
    });
    if (!maxContent) {
      console.log('[autoFitLane] no measurable card content, aborting');
      return;
    }
    const laneStyles = getComputedStyle(laneEl);
    const lanePadding = (parseFloat(laneStyles.paddingLeft) || 0) + (parseFloat(laneStyles.paddingRight) || 0);
    const fitted = Math.max(MIN_LANE_WIDTH, Math.min(MAX_LANE_WIDTH, Math.ceil(maxContent + lanePadding + 4)));
    console.log('[autoFitLane] result:', { columnId, maxContent, lanePadding, fitted, clamped: { min: MIN_LANE_WIDTH, max: MAX_LANE_WIDTH } });
    setLaneSizingMode('manual');
    setLaneWidths((prev) => {
      const next = { ...prev, [columnId]: fitted };
      try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const collapsedSetForLane = useCallback((boardKey) => {
    const ids = collapsedLanes[boardKey];
    return new Set(Array.isArray(ids) ? ids : []);
  }, [collapsedLanes]);

  // Initialize workflow collapsed lanes with role-based defaults on first mount
  useEffect(() => {
    if (hasStoredCollapsed('workflow')) return;
    const defaults = getDefaultCollapsedForRole(roleContext);
    // In week mode, don't collapse DRAFT — weekly workflows start as DRAFT and need to be visible
    const filteredDefaults = viewMode === 'week' ? defaults.filter((d) => d !== 'DRAFT') : defaults;
    if (filteredDefaults.length === 0) return;
    setCollapsedLanes((prev) => {
      if (Array.isArray(prev?.workflow)) return prev;
      const next = { ...prev, workflow: filteredDefaults };
      try { localStorage.setItem(LANE_COLLAPSE_KEY, JSON.stringify({ ...next, _v: LANE_COLLAPSE_VERSION })); } catch {}
      return next;
    });
  }, [roleContext, viewMode]);

  // When switching to week mode, un-collapse DRAFT if it was collapsed
  useEffect(() => {
    if (viewMode !== 'week') return;
    setCollapsedLanes((prev) => {
      const current = Array.isArray(prev?.workflow) ? prev.workflow : [];
      if (!current.includes('DRAFT')) return prev;
      const next = { ...prev, workflow: current.filter((d) => d !== 'DRAFT') };
      try { localStorage.setItem(LANE_COLLAPSE_KEY, JSON.stringify({ ...next, _v: LANE_COLLAPSE_VERSION })); } catch {}
      return next;
    });
  }, [viewMode]);

  const toggleLaneCollapse = useCallback((boardKey, columnId) => {
    setCollapsedLanes((prev) => {
      const current = new Set(Array.isArray(prev[boardKey]) ? prev[boardKey] : []);
      if (current.has(columnId)) current.delete(columnId);
      else current.add(columnId);
      const next = { ...prev, [boardKey]: [...current] };
      try { localStorage.setItem(LANE_COLLAPSE_KEY, JSON.stringify({ ...next, _v: LANE_COLLAPSE_VERSION })); } catch {}
      return next;
    });
  }, []);

  const expandCollapsedLanesIfAllCollapsed = useCallback((boardKey, columnIds) => {
    const key = boardKey || (lane === LANES.ATTENDANCE ? 'attendance' : 'workflow');
    const current = collapsedSetForLane(key);
    if (current.size !== columnIds.length) return current;
    setCollapsedLanes((prev) => {
      const next = { ...prev, [key]: [] };
      try { localStorage.setItem(LANE_COLLAPSE_KEY, JSON.stringify({ ...next, _v: LANE_COLLAPSE_VERSION })); } catch {}
      return next;
    });
    return new Set();
  }, [collapsedSetForLane, lane]);

  const resetLaneWidths = useCallback((columnIds, boardKey) => {
    console.log('[resetLaneWidths] start:', { columnIds, boardKey });
    setLaneSizingMode('manual');
    if (!columnIds?.length) return;
    // Force remeasure viewport width to ensure it's current
    const measuredWidth = measureBoardViewport();
    const width = measuredWidth || boardViewportWidth || window.innerWidth;
    const key = boardKey || (lane === LANES.ATTENDANCE ? 'attendance' : 'workflow');
    const collapsed = expandCollapsedLanesIfAllCollapsed(key, columnIds);
    const defaults = computeEqualLaneWidths(columnIds, width, collapsed, collapsedLaneWidth);
    console.log('[resetLaneWidths] defaults:', { width, collapsed: [...collapsed], defaults });
    setLaneWidths(defaults);
    try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(defaults)); } catch {}
    try { localStorage.setItem('operations_board_last_autofit_mode', 'reset'); } catch {}
  }, [boardViewportWidth, measureBoardViewport, lane, expandCollapsedLanesIfAllCollapsed, collapsedLaneWidth]);

  const attendanceColumns = useMemo(
    () => getAttendanceColumnsForRole(roleContext),
    [roleContext]
  );
  const workflowColumns = useMemo(
    () => getWorkflowColumnsForRole(WORKFLOW_COLUMNS, roleContext, viewMode),
    [roleContext, viewMode]
  );
  const columns = lane === LANES.ATTENDANCE ? attendanceColumns : workflowColumns;

  const updateParams = useCallback((updater) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (embedded) next.set('tab', 'operations');
      const before = next.toString();
      updater(next);
      console.log('[OperationsBoardPage] updateParams classId after updater:', next.get('classId'));
      return next.toString() !== before ? next : prev;
    });
  }, [embedded, setSearchParams]);

  useEffect(() => {
    if (!welcomeContext) return;
    const next = new URLSearchParams(window.location.search);
    let needsUpdate = false;
    if (welcomeContext.programId && !next.get('programId')) {
      next.set('programId', String(welcomeContext.programId));
      needsUpdate = true;
    }
    if (welcomeContext.termId && !next.get('termId')) {
      next.set('termId', String(welcomeContext.termId));
      needsUpdate = true;
    }
    if (welcomeContext.date && !next.get('date')) {
      next.set('date', toIsoDate(welcomeContext.date));
      needsUpdate = true;
    }
    if (!next.get('lane')) {
      next.set('lane', LANES.ATTENDANCE);
      needsUpdate = true;
    }
    if (!next.get('view')) {
      next.set('view', VIEWS.KANBAN);
      needsUpdate = true;
    }
    if (!next.get('panelTab')) {
      next.set('panelTab', 'board');
      needsUpdate = true;
    }
    if (!needsUpdate) return;
    updateParams((updaterNext) => {
      if (welcomeContext.programId && !updaterNext.get('programId')) updaterNext.set('programId', String(welcomeContext.programId));
      if (welcomeContext.termId && !updaterNext.get('termId')) updaterNext.set('termId', String(welcomeContext.termId));
      if (welcomeContext.date && !updaterNext.get('date')) updaterNext.set('date', toIsoDate(welcomeContext.date));
      if (!updaterNext.get('lane')) updaterNext.set('lane', LANES.ATTENDANCE);
      if (!updaterNext.get('view')) updaterNext.set('view', VIEWS.KANBAN);
      if (!updaterNext.get('panelTab')) updaterNext.set('panelTab', 'board');
    });
  }, [welcomeContext, updateParams]);

  useEffect(() => {
    if (!welcomeContext?.date) return;
    const syncedDate = toIsoDate(welcomeContext.date);
    const urlDate = searchParams.get('date');
    if (urlDate === syncedDate) return;
    updateParams((next) => {
      if (next.get('date') !== syncedDate) next.set('date', syncedDate);
    });
  }, [welcomeContext?.date, searchParams, updateParams]);

  useEffect(() => {
    noWorkflowsToastShownRef.current = false;
  }, [lane]);

  console.log('[OperationsBoardPage] viewMode:', viewMode);
  const filters = useMemo(() => {
    const f = {};
    const date = searchParams.get('date') || toIsoDate(welcomeContext?.date) || todayIso();
    if (viewMode === 'week') {
      const anchor = new Date(`${date}T12:00:00`);
      const weekStart = new Date(anchor);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 4);
      f.date = date;
      f.dateFrom = toIsoDate(weekStart);
      f.dateTo = toIsoDate(weekEnd);
      f.attendanceSubtype = 'WEEKLY_SUMMARY';
    } else {
      f.date = date;
      f.attendanceSubtype = 'DAILY';
    }
    if (searchParams.get('classId')) f.classId = searchParams.get('classId');
    if (searchParams.get('programId')) f.programId = searchParams.get('programId');
    else if (welcomeContext?.programId) f.programId = String(welcomeContext.programId);
    if (searchParams.get('termId')) f.termId = searchParams.get('termId');
    else if (welcomeContext?.termId) f.termId = String(welcomeContext.termId);
    if (searchParams.get('search')) f.search = searchParams.get('search');
    if (workflowId) f.workflowId = workflowId;
    if (searchParams.get('_t')) f._t = searchParams.get('_t');
    if (welcomeContext?.classIds?.length) {
      f.classIds = welcomeContext.classIds.map((id) => parseInt(id, 10)).filter(Boolean);
    }
    f.lang = lang;
    console.log('[OperationsBoardPage] filters:', JSON.stringify(f));
    return f;
  }, [searchParams, workflowId, welcomeContext, viewMode, lang]);

  // Auto-switch to attendance lane only when classId first appears and no workflowId is requested
  // Skip in week mode — week mode only supports the workflow/status lane
  // Skip in status lane day view because it now uses a class dropdown for the daily workflow board.
  const autoSwitchedClassIdRef = useRef(null);
  useEffect(() => {
    if (viewMode === 'week') return;
    if (lane === LANES.STATUS && viewMode !== 'week') return;
    if (filters.classId && autoSwitchedClassIdRef.current !== filters.classId) {
      autoSwitchedClassIdRef.current = filters.classId;
      if (lane !== LANES.ATTENDANCE && !workflowId) {
        console.log('[OperationsBoardPage] autoSwitchClassId switching lane to attendance', { classId: filters.classId, lane, workflowId });
        updateParams((next) => {
          next.set('lane', LANES.ATTENDANCE);
          next.delete('workflowId');
        });
      }
    } else if (!filters.classId) {
      autoSwitchedClassIdRef.current = null;
    }
  }, [filters.classId, lane, workflowId, updateParams, viewMode]);

  // Auto-select a classId for the status lane day view when none is selected.
  // This mirrors the attendance lane auto-select but keeps the user on the status (daily workflow) lane.
  useEffect(() => {
    if (lane !== LANES.STATUS || viewMode === 'week' || filters.classId || !filters.date) return;
    if (!welcomeContext?.classIds?.length) return;
    console.log('[OperationsBoardPage] autoSelectStatusClassId setting first classId', { classId: welcomeContext.classIds[0] });
    updateParams((next) => {
      next.set('classId', String(welcomeContext.classIds[0]));
    });
  }, [lane, viewMode, filters.classId, filters.date, welcomeContext?.classIds, updateParams]);

  // Week mode only supports workflow lane, not attendance
  useEffect(() => {
    if (viewMode === 'week' && lane === LANES.ATTENDANCE) {
      updateParams((next) => {
        next.set('lane', LANES.STATUS);
      });
    }
  }, [viewMode, lane, updateParams]);

  // Auto-select a classId when attendance lane is active but none is selected.
  // Fetches workflow board data for the current date and picks the first workflow's classId
  // so the admin/instructor sees attendance data immediately without manually selecting a class.
  const autoClassSelectRef = useRef(null);
  useEffect(() => {
    console.log('[OperationsBoardPage] autoClassSelect effect check', { lane, classId: filters.classId, viewMode, date: filters.date });
    if (lane !== LANES.ATTENDANCE || filters.classId || viewMode === 'week' || !filters.date) return;
    const dateStr = typeof filters.date === 'string' ? filters.date.slice(0, 10) : '';
    if (!dateStr) return;
    let cancelled = false;
    (async () => {
      try {
        const wfResult = await fetchWorkflowBoardData({
          date: dateStr,
          programId: filters.programId,
          workflowCategory: 'ATTENDANCE',
          attendanceSubtype: 'DAILY',
          lang,
        });
        if (cancelled) return;
        if (wfResult.success && wfResult.data?.length) {
          const first = wfResult.data[0];
          if (first?.classId) {
            autoClassSelectRef.current = String(first.classId);
            updateParams((next) => {
              next.set('classId', String(first.classId));
            });
          }
        } else if (welcomeContext?.classIds?.length) {
          autoClassSelectRef.current = String(welcomeContext.classIds[0]);
          updateParams((next) => {
            next.set('classId', String(welcomeContext.classIds[0]));
          });
        }
      } catch (err) {
        logError('OperationsBoardPage:autoClassSelect:error', { error: err.message });
      }
    })();
    return () => { cancelled = true; };
  }, [lane, filters.classId, filters.date, filters.programId, viewMode, lang, updateParams, welcomeContext]);

  const setFilters = useCallback((newFilters) => {
    console.log('[OperationsBoardPage] setFilters called', newFilters);
    updateParams((next) => {
      if (newFilters.date) next.set('date', newFilters.date);
      else next.delete('date');
      if (newFilters.search) next.set('search', newFilters.search);
      else next.delete('search');
      if (newFilters.classId) next.set('classId', String(newFilters.classId));
      else if (Object.prototype.hasOwnProperty.call(newFilters, 'classId')) next.delete('classId');
    });
    const urlDate = searchParams.get('date');
    if (newFilters.date && onDateChange && newFilters.date !== urlDate) {
      onDateChange(new Date(`${newFilters.date}T12:00:00`));
    }
  }, [updateParams, onDateChange, searchParams]);

  const handleClassSessionClick = useCallback(({ classId, date }) => {
    setFilters({
      date: toIsoDate(date),
      classId,
      search: filters.search,
    });
    if (lane !== LANES.ATTENDANCE) {
      updateParams((next) => {
        next.set('lane', LANES.ATTENDANCE);
        next.delete('workflowId');
      });
    }
  }, [setFilters, filters.search, lane, updateParams]);

  const setView = useCallback((newView) => {
    updateParams((next) => {
      next.set('view', newView);
    });
  }, [updateParams]);

  const handlePanelTabChange = useCallback((newPanelTab) => {
    setPanelTab(newPanelTab);
    updateParams((next) => {
      next.set('panelTab', newPanelTab);
    });
  }, [updateParams]);

  const handleCalendarViewChange = useCallback((newCalendarView) => {
    updateParams((next) => {
      next.set('calendarView', newCalendarView);
    });
  }, [updateParams]);

  const handleBoardViewChange = useCallback((newView) => {
    handlePanelTabChange('board');
    setView(newView);
  }, [setView, handlePanelTabChange]);

  useEffect(() => {
    const urlView = searchParams.get('view');
    if (urlView === VIEWS.LIST || (urlView && urlView !== VIEWS.KANBAN && urlView !== VIEWS.TABLE)) {
      updateParams((next) => {
        next.set('view', urlView === VIEWS.LIST ? VIEWS.TABLE : VIEWS.KANBAN);
      });
    }
  }, [searchParams, updateParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (lane === LANES.ATTENDANCE) {
        result = await fetchAttendanceBoardData(filters);
      } else {
        result = await fetchWorkflowBoardData(filters);
      }
      if (result.success) {
        console.log('[OperationsBoardPage] loaded data:', result.data.length, result.data.map((d) => ({ id: d.id, column: d.column, title: d.title })));
        setData(result.data);
        if (lane === LANES.STATUS && result.data.length === 0 && !noWorkflowsToastShownRef.current) {
          noWorkflowsToastShownRef.current = true;
          toast.info(t('operations_board_no_workflows_banner'), {
            duration: 6000,
            icon: <Info size={16} />,
          });
        }
      } else {
        const isMissingClassDate = lane === LANES.ATTENDANCE && result.error === 'classId and date are required for attendance board';
        if (isMissingClassDate) {
          toast.info(t('operations_board_class_date_required') || 'Choose a class and date to display the attendance board.', {
            duration: 6000,
            icon: <Info size={16} />,
          });
        } else {
          setError(result.error || t('operations_board_error'));
        }
      }
    } catch (err) {
      logError('OperationsBoardPage:loadData:error', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lane, filters, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load the attendance workflow document for the selected class/date so we can
  // enforce ownership before allowing attendance edits.
  useEffect(() => {
    if (lane !== LANES.ATTENDANCE || !filters.classId || !filters.date) {
      setCurrentWorkflow(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const wfResult = await fetchWorkflowBoardData({
        classId: filters.classId,
        date: filters.date,
        programId: filters.programId,
        workflowCategory: 'ATTENDANCE',
        attendanceSubtype: 'DAILY',
        lang,
      });
      if (cancelled) return;
      if (wfResult.success) {
        const docs = wfResult.data || [];
        const dateStr = typeof filters.date === 'string' ? filters.date.slice(0, 10) : '';
        const matching = docs.find((d) => {
          if (String(d.classId) !== String(filters.classId)) return false;
          if (!d.date || !dateStr) return false;
          const docDate = typeof d.date === 'string' ? d.date.slice(0, 10) : new Date(d.date).toISOString().slice(0, 10);
          return docDate === dateStr;
        });
        setCurrentWorkflow(matching || docs[0] || null);
      } else {
        setCurrentWorkflow(null);
      }
    })();
    return () => { cancelled = true; };
  }, [lane, filters.classId, filters.date, filters.programId, lang]);

  const { attendanceLocked, attendanceLockReason, attendanceLockType } = useMemo(() => {
    const classIdStr = filters.classId ? String(filters.classId) : null;
    const weeklyWorkflowForClass = classIdStr ? (weeklyWorkflowMap?.[classIdStr] || null) : null;

    if (weeklyWorkflowForClass && weeklyWorkflowForClass.status !== 'REJECTED') {
      const weeklyStatus = weeklyWorkflowForClass.status || 'in progress';
      const translated = t('operations_board_attendance_locked_weekly_class', { status: weeklyStatus });
      return {
        attendanceLocked: true,
        attendanceLockReason: translated.includes('operations_board_')
          ? `Attendance locked — weekly workflow is ${weeklyStatus.toLowerCase()} for this class.`
          : translated,
        attendanceLockType: 'weekly',
      };
    }

    if (isWeekLocked) {
      const translated = t('operations_board_attendance_locked_weekly');
      return {
        attendanceLocked: true,
        attendanceLockReason: translated.includes('operations_board_')
          ? 'Attendance locked — weekly workflow in progress for this week.'
          : translated,
        attendanceLockType: 'weekly',
      };
    }

    const dailyStatus = currentWorkflow?.status;
    if (dailyStatus && !canEditAttendanceForWorkflow(dailyStatus, roleContext)) {
      const translated = t('operations_board_attendance_locked_daily', { status: dailyStatus });
      return {
        attendanceLocked: true,
        attendanceLockReason: translated.includes('operations_board_')
          ? `Attendance locked — daily workflow is ${dailyStatus.toLowerCase()} for this class/day.`
          : translated,
        attendanceLockType: 'daily',
      };
    }

    return { attendanceLocked: false, attendanceLockReason: '', attendanceLockType: '' };
  }, [filters.classId, weeklyWorkflowMap, isWeekLocked, currentWorkflow, roleContext, t]);

  const isWorkflowLocked = useCallback((item) => {
    if (!item) return false;
    const isDaily = item.workflowType === 'ATTENDANCE_DAILY' || item.attendanceSubtype === 'DAILY';
    if (!isDaily) return false;
    const classId = item.classId ? String(item.classId) : null;
    const weekly = classId ? weeklyWorkflowMap?.[classId] : null;
    if (weekly && weekly.status !== 'REJECTED') {
      if (item.date && weekly.dateFrom && weekly.dateTo) {
        const dateStr = typeof item.date === 'string' ? item.date.slice(0, 10) : new Date(item.date).toISOString().slice(0, 10);
        const fromStr = typeof weekly.dateFrom === 'string' ? weekly.dateFrom.slice(0, 10) : new Date(weekly.dateFrom).toISOString().slice(0, 10);
        const toStr = typeof weekly.dateTo === 'string' ? weekly.dateTo.slice(0, 10) : new Date(weekly.dateTo).toISOString().slice(0, 10);
        return dateStr >= fromStr && dateStr <= toStr;
      }
      return true;
    }
    if (isWeekLocked) return true;
    return false;
  }, [weeklyWorkflowMap, isWeekLocked]);

  useEffect(() => {
    const handleAttendanceUpdate = (payload) => {
      if (lastLocalChangeRef.current &&
          lastLocalChangeRef.current.id === payload.attendanceId &&
          Date.now() - lastLocalChangeRef.current.time < 3000) {
        return;
      }
      const eventDate = payload.date ? new Date(payload.date).toISOString().slice(0, 10) : null;
      const currentDate = filters.date ? filters.date.slice(0, 10) : null;
      if (String(payload.classId) !== String(filters.classId) || eventDate !== currentDate) return;
      const newColumn = normalizeAttendanceStatus(payload.status?.code);
      setData((prev) => prev.map((item) => {
        if (item.type !== 'attendance') return item;
        if (String(item.userId) !== String(payload.userId)) return item;
        if (newColumn === NOT_TAKEN) {
          return {
            ...item,
            column: NOT_TAKEN,
            status: NOT_TAKEN,
            rawId: null,
            notes: null,
            id: `att-pending-${item.userId}`,
          };
        }
        return {
          ...item,
          column: newColumn,
          status: newColumn,
          rawId: payload.attendanceId || item.rawId,
          notes: payload.notes ?? item.notes,
          id: payload.attendanceId ? `att-${payload.attendanceId}` : item.id,
        };
      }));
    };

    // Track recently processed workflow updates to prevent duplicates
    const processedWorkflowUpdates = new Map();

    const handleWorkflowUpdate = (payload) => {
      const updateKey = `${payload.documentId}-${payload.status}`;
      const now = Date.now();
      
      // Check if we've processed this exact update recently (within 1 second)
      if (processedWorkflowUpdates.has(updateKey)) {
        const lastProcessed = processedWorkflowUpdates.get(updateKey);
        if (now - lastProcessed < 1000) {
          console.log('[OperationsBoardPage] Ignoring duplicate workflow update:', updateKey);
          return;
        }
      }
      
      processedWorkflowUpdates.set(updateKey, now);
      
      // Clean up old entries (older than 2 seconds)
      for (const [key, time] of processedWorkflowUpdates.entries()) {
        if (now - time > 2000) {
          processedWorkflowUpdates.delete(key);
        }
      }

      console.log('[OperationsBoardPage] Workflow update received:', payload);
      if (lastLocalChangeRef.current &&
          lastLocalChangeRef.current.id === payload.documentId &&
          Date.now() - lastLocalChangeRef.current.time < 2000) {
        console.log('[OperationsBoardPage] Ignoring local change:', payload.documentId);
        return;
      }
      setData((prev) => prev.map((item) => {
        if (item.type !== 'workflow') return item;
        if (String(item.rawId) !== String(payload.documentId)) return item;
        console.log('[OperationsBoardPage] Updating workflow item:', item.rawId, 'from', item.column, 'to', payload.status);
        return {
          ...item,
          column: payload.status || item.column,
          status: payload.status || item.status,
        };
      }));
      setCurrentWorkflow((prev) => {
        if (!prev || String(prev.rawId) !== String(payload.documentId)) return prev;
        return { ...prev, status: payload.status || prev.status, column: payload.status || prev.column };
      });
    };

    chatSocket.on('board:attendance_updated', handleAttendanceUpdate);
    chatSocket.on('board:workflow_updated', handleWorkflowUpdate);

    return () => {
      chatSocket.off('board:attendance_updated', handleAttendanceUpdate);
      chatSocket.off('board:workflow_updated', handleWorkflowUpdate);
    };
  }, [filters.classId, filters.date]);

  const applyWorkflowMove = useCallback(async (activeId, fromColumn, toColumn, item, snapshotData = null, comment = null) => {
    let filedFileId = null;

    // When moving to UNDER_HR_REVIEW, generate and upload the PDF snapshot for the workflow.
    // Daily workflows use the daily report, weekly workflows use the weekly report.
    if (toColumn === 'UNDER_HR_REVIEW' && item.classId) {
      try {
        const isWeekly = item.workflowType === 'ATTENDANCE_WEEKLY' || item.attendanceSubtype === 'WEEKLY_SUMMARY';
        let exportResult = null;
        if (isWeekly) {
          exportResult = await generateWeeklyViolationSnapshot({
            document: item,
            user,
            lang,
            programId: item.programId || welcomeContext?.programId,
            programName: item.programName || welcomeContext?.program?.nameEn || '',
            classIds: [item.classId],
            classId: item.classId,
          });
        } else if (item.date) {
          const cls = {
            id: item.classId,
            nameEn: item.className,
            nameAr: item.className,
            code: item.className,
            programId: item.programId,
            subjectId: item.subjectId,
          };
          const program = item.programName ? { nameEn: item.programName, code: String(item.programId || '') } : { code: String(item.programId || '') };
          const subject = item.subjectName ? { nameEn: item.subjectName, code: String(item.subjectId || '') } : { code: String(item.subjectId || '') };
          exportResult = await exportDailyOfficialForDate({
            cls,
            program,
            subject,
            lang,
            user: user,
            date: item.date?.slice(0, 10),
            format: EXPORT_FORMAT.PDF,
            skipDownload: true,
          });
        }
        filedFileId = exportResult?.fileId || null;
        if (!filedFileId) {
          console.warn('[applyWorkflowMove] PDF generation succeeded but no fileId returned');
        }
      } catch (pdfErr) {
        console.error('[applyWorkflowMove] Failed to generate filed PDF:', pdfErr);
        setError(t('operations_board_drag_error') + ' (PDF generation failed)');
        loadData();
        return false;
      }
    }

    const result = await moveWorkflowCard(item.rawId, fromColumn, toColumn, comment, snapshotData, filedFileId);
    if (!result.success) {
      if (result.isPermissionError) {
        setError(t('operations_board_permission_error') || result.error);
      } else {
        setError(result.errorKey ? t(result.errorKey, result.error) : (t('operations_board_drag_error') || result.error));
      }
      loadData();
      return false;
    }
    lastLocalChangeRef.current = { id: item.rawId, time: Date.now() };
    setData((prev) => prev.map((d) => (d.id === activeId ? { ...d, column: toColumn, status: toColumn } : d)));
    if (onBoardDataChanged) onBoardDataChanged();
    const toCol = WORKFLOW_COLUMNS.find((c) => c.id === toColumn);
    const statusLabel = toCol ? (t(toCol.i18nKey) || toCol.name) : toColumn;
    const classLabel = resolveBoardClassName(item, lang);
    const dateLabel = item.date ? formatBoardDate(item.date, lang) : '';
    const shortLabel = [classLabel, dateLabel].filter(Boolean).join(' · ');
    const notifyMeta = resolveWorkflowNotifyMeta(fromColumn, toColumn, roleContext);
    const sendsNotification = Boolean(
      notifyMeta?.notifyKey
      || (notifyMeta?.roles?.length > 0 && !notifyMeta.adminOverride),
    );
    const isRejection = toColumn === 'REJECTED';
    const targetColor = getWorkflowStatusColor(toColumn);
    showActionBanner({
      pillColor: isRejection ? targetColor : (targetColor || '#059669'),
      icon: isRejection ? <AlertCircle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />,
      message: shortLabel
        ? t('operations_board_workflow_action_banner', { label: shortLabel, status: statusLabel })
        : t('operations_board_action_banner', { name: resolveBoardClassName(item, lang) || 'Workflow', status: statusLabel }),
      notifySent: sendsNotification,
      onUndo: sendsNotification ? null : async () => {
        clearActionBanner();
        const undoResult = await moveWorkflowCard(item.rawId, toColumn, fromColumn);
        if (undoResult.success) {
          lastLocalChangeRef.current = { id: item.rawId, time: Date.now() };
          setData((prev) => prev.map((d) => (d.id === activeId ? { ...d, column: fromColumn, status: fromColumn } : d)));
          showActionBanner({
            message: t('operations_board_change_reverted'),
          });
        } else {
          setError(t('operations_board_drag_error'));
          loadData();
        }
      },
    });
    return true;
  }, [t, loadData, showActionBanner, clearActionBanner, roleContext, onBoardDataChanged, lang, user, welcomeContext]);

  const applyAttendanceMove = useCallback(async (item, fromColumn, toColumn, notes = null, attachment = null) => {
    const activeId = item.id;
    const createPayload = item.rawId ? null : { userId: item.userId, classId: item.classId, date: item.date };
    const result = await moveAttendanceCard(item.rawId, toColumn, notes, createPayload, attachment);
    if (!result.success) {
      setError(result.error || t('operations_board_drag_error'));
      loadData();
      return false;
    }
    lastLocalChangeRef.current = { id: result.data?.id || item.rawId, time: Date.now() };
    setData((prev) => prev.map((d) => {
      if (d.id !== activeId) return d;
      if (toColumn === NOT_TAKEN) {
        return { ...d, column: NOT_TAKEN, status: NOT_TAKEN, rawId: null, notes: null, id: `att-pending-${d.userId}` };
      }
      return { ...d, column: toColumn, status: toColumn, rawId: result.data?.id || d.rawId, id: result.data?.id ? `att-${result.data.id}` : d.id };
    }));
    if (onBoardDataChanged) onBoardDataChanged();
    const studentName = resolveBoardStudentName(item, lang);
    const attCol = ATTENDANCE_COLUMNS.find((c) => c.id === toColumn);
    const statusLabel = attCol ? (t(attCol.i18nKey) || attCol.name) : toColumn;
    const statusColor = getAttendanceColor(toColumn);
    showActionBanner({
      pillColor: statusColor,
      message: (() => {
        const template = t('operations_board_action_banner', { name: studentName, status: '{status}' });
        const parts = template.split('{status}');
        const statusDot = (
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: '0 0 0 1.5px rgba(255,255,255,0.95)',
              flexShrink: 0,
            }}
          />
        );
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 0, fontSize: '0.75rem' }}>
            {parts[0]}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                border: '1px solid rgba(255,255,255,0.9)',
                borderRadius: 9999,
                padding: '1px 8px',
                marginInlineStart: 4,
                backgroundColor: statusColor,
                fontSize: '0.7rem',
              }}
            >
              {statusDot}
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{statusLabel}</span>
            </span>
            {parts[1]}
          </span>
        );
      })(),
      onUndo: async () => {
        clearActionBanner();
        let undoId = result.data?.id || item.rawId;
        let undoCreate = null;
        if (toColumn === NOT_TAKEN) {
          undoId = null;
          undoCreate = { userId: item.userId, classId: item.classId, date: item.date };
        } else if (fromColumn === NOT_TAKEN) {
          undoId = result.data?.id;
        }
        const undoResult = await moveAttendanceCard(undoId, fromColumn, null, undoCreate);
        if (undoResult.success) {
          lastLocalChangeRef.current = { id: undoResult.data?.id || undoId, time: Date.now() };
          setData((prev) => prev.map((d) => {
            if (d.userId !== item.userId) return d;
            if (fromColumn === NOT_TAKEN) {
              return { ...d, column: NOT_TAKEN, status: NOT_TAKEN, rawId: null, notes: null, id: `att-pending-${d.userId}` };
            }
            return {
              ...d,
              column: fromColumn,
              status: fromColumn,
              rawId: undoResult.data?.id || d.rawId,
              id: undoResult.data?.id ? `att-${undoResult.data.id}` : d.id,
            };
          }));
          showActionBanner({
            message: t('operations_board_change_reverted'),
          });
        } else {
          setError(t('operations_board_drag_error'));
          loadData();
        }
      },
    });
    return true;
  }, [t, loadData, showActionBanner, clearActionBanner, lang, onBoardDataChanged]);

  const handleDragEnd = useCallback(async (activeId, fromColumn, toColumn) => {
    const item = data.find((d) => d.id === activeId);
    if (!item || fromColumn === toColumn) return;

    if (item.type === 'attendance' && !canMoveAttendanceToColumn(toColumn, roleContext)) {
      showDragInvalidBanner(toColumn);
      loadData();
      return;
    }

    if (item.type === 'workflow') {
      const allowed = canMoveWorkflowToColumn(fromColumn, toColumn, roleContext);
      const adminOverride = requiresAdminInstructorOverride(fromColumn, toColumn, roleContext);
      if (roleContext.isAdmin) {
        console.warn('[WorkflowBoard][Admin drag END]', {
          activeId,
          fromColumn,
          toColumn,
          allowed,
          adminOverride,
          itemStatus: item.status || item.column,
          roleContext: {
            isAdmin: roleContext.isAdmin,
            isInstructor: roleContext.isInstructor,
            isHR: roleContext.isHR,
            isSuperAdmin: roleContext.isSuperAdmin,
          },
          hint: !allowed
            ? 'Move not in allowed transition map (e.g. Draft→Rejected requires Taken→Sent→Admin first)'
            : adminOverride
              ? 'Admin instructor-area override — confirm required'
              : 'Move allowed',
        });
      }
      if (!allowed) {
        showDragInvalidBanner(toColumn);
        loadData();
        return;
      }
      // Revert optimistic board move until user confirms
      setData((prev) => prev.map((d) => (d.id === activeId ? { ...d, column: fromColumn, status: fromColumn } : d)));
      if (shouldConfirmWorkflowMove(fromColumn, toColumn)) {
        let dailyApprovedCount = null;
        let dailyRequiredCount = null;
        const isWeeklyApproval = toColumn === 'APPROVED' && (item.workflowType === 'ATTENDANCE_WEEKLY' || item.attendanceSubtype === 'WEEKLY_SUMMARY');
        if (isWeeklyApproval) {
          const { weekFrom, weekTo } = getWeekRange(item.date || item.dateFrom);
          const requiredDays = [];
          let cur = new Date(`${weekFrom}T12:00:00`);
          const end = new Date(`${weekTo}T12:00:00`);
          while (cur <= end) {
            requiredDays.push(cur.toISOString().slice(0, 10));
            cur.setDate(cur.getDate() + 1);
          }
          const dailyFilters = { dateFrom: weekFrom, dateTo: weekTo, classId: item.classId, programId: item.programId || welcomeContext?.programId, attendanceSubtype: 'DAILY', lang };
          const dailyResult = await fetchWorkflowBoardData(dailyFilters);
          const dailyApprovedDays = new Set();
          if (dailyResult.success) {
            for (const d of dailyResult.data) {
              if (d.column !== 'APPROVED' && d.status !== 'APPROVED') continue;
              const dateVal = d.dateFrom || d.date;
              const iso = dateVal ? (typeof dateVal === 'string' ? dateVal.slice(0, 10) : new Date(dateVal).toISOString().slice(0, 10)) : '';
              if (requiredDays.includes(iso)) dailyApprovedDays.add(iso);
            }
          }
          dailyApprovedCount = dailyApprovedDays.size;
          dailyRequiredCount = requiredDays.length;
        }
        setPendingWorkflowMove({
          activeId,
          fromColumn,
          toColumn,
          item,
          adminOverride: requiresAdminInstructorOverride(fromColumn, toColumn, roleContext),
          dailyApprovedCount,
          dailyRequiredCount,
        });
        return;
      }
      await applyWorkflowMove(activeId, fromColumn, toColumn, item);
      return;
    }

    if (item.type === 'attendance') {
      if (attendanceLocked) {
        showAttendanceLockBanner(attendanceLockReason);
        loadData();
        return;
      }
      if (!canEditAttendanceForWorkflow(currentWorkflow?.status, roleContext)) {
        showDragInvalidBanner(toColumn);
        loadData();
        return;
      }
      if (toColumn === ATTENDANCE_BOARD_LANES.EXCUSED || toColumn === ATTENDANCE_BOARD_LANES.HUMAN_CASE) {
        setPendingAttendanceMove({ activeId, fromColumn, toColumn, item });
        loadData();
        return;
      }
      await applyAttendanceMove(item, fromColumn, toColumn, null, null);
    }
  }, [data, loadData, roleContext, lang, applyWorkflowMove, showDragInvalidBanner, currentWorkflow, attendanceLocked, attendanceLockReason, showAttendanceLockBanner, welcomeContext?.programId, applyAttendanceMove]);

  const handleBulkMove = useCallback(async (fromColumn, toColumn, itemIds = null) => {
    if (fromColumn === toColumn) return;
    const itemsToMove = data.filter((d) =>
      d.column === fromColumn && (!Array.isArray(itemIds) || itemIds.includes(d.id)));
    if (!itemsToMove.length) return;

    const movedIds = [];
    const undoSnapshots = [];
    let movedAttendanceCount = 0;

    const canEditAttendance = canEditAttendanceForWorkflow(currentWorkflow?.status, roleContext);

    if (itemsToMove.some((item) => item.type === 'attendance') && attendanceLocked) {
      showAttendanceLockBanner(attendanceLockReason);
      loadData();
      return;
    }

    if (toColumn === ATTENDANCE_BOARD_LANES.EXCUSED || toColumn === ATTENDANCE_BOARD_LANES.HUMAN_CASE) {
      if (itemsToMove.some((item) => item.type === 'attendance')) {
        toast.info(t('operations_board_bulk_requires_individual_move') || 'Bulk move is not supported for Excused Leave or Human Case. Please move students one by one.');
        loadData();
        return;
      }
    }

    for (const item of itemsToMove) {
      if (item.type === 'attendance') {
        if (!canMoveAttendanceToColumn(toColumn, roleContext) || !canEditAttendance) continue;
        const result = await moveAttendanceCard(item.rawId, toColumn, null, item.rawId ? null : {
          userId: item.userId,
          classId: item.classId,
          date: item.date,
        });
        if (result.success) {
          movedIds.push(item.id);
          undoSnapshots.push({ item, prevColumn: fromColumn, prevRawId: item.rawId, resultId: result.data?.id });
          lastLocalChangeRef.current = { id: result.data?.id || item.rawId, time: Date.now() };
          movedAttendanceCount++;
        }
      } else if (item.type === 'workflow') {
        if (!canMoveWorkflowToColumn(fromColumn, toColumn, roleContext)) continue;
        const result = await moveWorkflowCard(item.rawId, fromColumn, toColumn);
        if (result.success) {
          movedIds.push(item.id);
          undoSnapshots.push({ item, prevColumn: fromColumn });
          lastLocalChangeRef.current = { id: item.rawId, time: Date.now() };
        }
      }
    }

    if (movedIds.length === 0) {
      showDragInvalidBanner(toColumn);
      loadData();
      return;
    }

    setData((prev) => prev.map((d) => {
      if (!movedIds.includes(d.id)) return d;
      if (d.type === 'attendance') {
        if (toColumn === NOT_TAKEN) {
          return { ...d, column: NOT_TAKEN, status: NOT_TAKEN, rawId: null, notes: null, id: `att-pending-${d.userId}` };
        }
        return { ...d, column: toColumn, status: toColumn, id: d.id };
      }
      return { ...d, column: toColumn, status: toColumn };
    }));
    if (onBoardDataChanged) onBoardDataChanged();

    const fromCol = [...WORKFLOW_COLUMNS, ...ATTENDANCE_COLUMNS].find((c) => c.id === fromColumn);
    const toCol = [...WORKFLOW_COLUMNS, ...ATTENDANCE_COLUMNS].find((c) => c.id === toColumn);
    const fromLabel = fromCol ? (t(fromCol.i18nKey) || fromCol.name) : fromColumn;
    const toLabel = toCol ? (t(toCol.i18nKey) || toCol.name) : toColumn;
    const isWorkflowBulk = itemsToMove[0]?.type === 'workflow';
    const fromColor = isWorkflowBulk ? getWorkflowStatusColor(fromColumn) : getAttendanceColor(fromColumn);
    const toColor = isWorkflowBulk ? getWorkflowStatusColor(toColumn) : getAttendanceColor(toColumn);
    if (movedAttendanceCount > 0 && (roleContext.isAdmin || roleContext.isSuperAdmin)) {
      toast.info(t('operations_board_attendance_admin_override'));
    }
    showActionBanner({
      pillColor: toColor,
      message: (() => {
        const template = t('operations_board_bulk_moved', { count: movedIds.length, from: '{from}', to: '{to}' });
        const [beforeFrom, afterFrom] = template.split('{from}');
        const [beforeTo, afterTo] = (afterFrom || '').split('{to}');
        const statusBadge = (color, label) => (
          <span
            key={`badge-${color}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: '1px solid rgba(255,255,255,0.9)',
              borderRadius: 9999,
              padding: '1px 8px',
              marginInlineStart: 4,
              backgroundColor: color,
              flexShrink: 0,
              fontSize: '0.7rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: '0 0 0 1.5px rgba(255,255,255,0.95)',
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{label}</span>
          </span>
        );
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap', fontSize: '0.75rem' }}>
            {beforeFrom}
            {statusBadge(fromColor, fromLabel)}
            {beforeTo}
            {statusBadge(toColor, toLabel)}
            {afterTo}
          </span>
        );
      })(),
      onUndo: async () => {
        clearActionBanner();
        for (const snap of undoSnapshots) {
          if (snap.item.type === 'attendance') {
            await moveAttendanceCard(snap.resultId || snap.item.rawId, snap.prevColumn, null, snap.prevRawId ? null : {
              userId: snap.item.userId,
              classId: snap.item.classId,
              date: snap.item.date,
            });
          } else if (snap.item.type === 'workflow') {
            await moveWorkflowCard(snap.item.rawId, toColumn, snap.prevColumn);
          }
        }
        loadData();
        showActionBanner({
          message: t('operations_board_change_reverted'),
        });
      },
    });
  }, [data, t, roleContext, showActionBanner, clearActionBanner, loadData, currentWorkflow, showDragInvalidBanner, onBoardDataChanged, attendanceLocked, attendanceLockReason, showAttendanceLockBanner]);

  const handleConfirmWorkflowMove = useCallback(async (comment = null) => {
    if (!pendingWorkflowMove) return;
    const { activeId, fromColumn, toColumn, item } = pendingWorkflowMove;
    setWorkflowMoveLoading(true);
    try {
      let snapshotData = null;
      let snapResult = null;
      // When HR approves, generate the appropriate snapshot based on workflow type
      if (fromColumn === 'UNDER_HR_REVIEW' && toColumn === 'APPROVED') {
        const wfType = item.workflowType || '';
        const attSubtype = item.attendanceSubtype || '';
        const isWeeklyApproval = wfType === 'ATTENDANCE_WEEKLY' || attSubtype === 'WEEKLY_SUMMARY';
        if (isWeeklyApproval) {
          const weekStart = item.dateFrom || getWeekRange(item.date || item.dateFrom).weekFrom;
          const weekEnd = item.dateTo || getWeekRange(item.date || item.dateFrom).weekTo;
          if ((pendingWorkflowMove.dailyApprovedCount || 0) < 1) {
            toast.error(t('weekly_approval_requires_at_least_one_daily') || 'At least one daily attendance summary for the week must be approved before approving the weekly summary.');
            setWorkflowMoveLoading(false);
            setPendingWorkflowMove(null);
            return;
          }
          snapResult = await generateWeeklyViolationSnapshot({
            document: { date: item.date, dateFrom: item.dateFrom },
            user: user,
            lang,
            programId: item.programId,
            programName: item.programName,
            classIds: item.classId ? [item.classId] : [],
            workflowStatus: 'APPROVED',
            approvedBy: user,
            approvedAt: new Date().toISOString(),
          });
          if (snapResult.success) {
            snapshotData = {
              snapshotFileId: snapResult.fileId,
              snapshotWeekFrom: snapResult.weekFrom,
              snapshotWeekTo: snapResult.weekTo,
            };
          }
        } else if (wfType === 'ATTENDANCE_DAILY' || attSubtype === 'DAILY') {
          // For daily attendance, generate daily official report snapshot
          const cls = {
            id: item.classId,
            programId: item.programId,
            subjectId: item.subjectId,
            code: item.className,
            year: item.year,
            term: item.term,
          };
          const program = { id: item.programId, nameEn: item.programName };
          const subject = { id: item.subjectId };
          const academicTerm = { id: item.academicTermId };
          
          snapResult = await exportDailyOfficialForDate({
            cls,
            program,
            subject,
            academicTerm,
            lang,
            user,
            date: item.date,
            instructorName: item.instructorName || '',
            format: EXPORT_FORMAT.PDF,
            skipDownload: true,
            skipPersist: false,
            workflowStatus: 'APPROVED',
            approvedBy: user,
            approvedAt: new Date().toISOString(),
          });
          if (snapResult?.fileId) {
            snapshotData = {
              snapshotFileId: snapResult.fileId,
              date: item.date,
            };
          }
        }
      }
      const success = await applyWorkflowMove(activeId, fromColumn, toColumn, item, snapshotData, comment);
      // Show success dialog if snapshot was generated
      if (success && snapshotData) {
        setApprovalSnapshot({
          fileId: snapshotData.snapshotFileId,
          filename: snapResult.filename,
          weekFrom: snapshotData.snapshotWeekFrom || null,
          weekTo: snapshotData.snapshotWeekTo || null,
          date: snapshotData.date || null,
        });
      }
    } finally {
      setWorkflowMoveLoading(false);
      setPendingWorkflowMove(null);
    }
  }, [pendingWorkflowMove, applyWorkflowMove, user, lang, t]);

  const handleCancelWorkflowMove = useCallback(() => {
    setPendingWorkflowMove(null);
    loadData();
  }, [loadData]);

  const handleConfirmAttendanceMove = useCallback(async ({ notes, attachment }) => {
    if (!pendingAttendanceMove) return;
    const { fromColumn, toColumn, item } = pendingAttendanceMove;
    setPendingAttendanceMove(null);
    await applyAttendanceMove(item, fromColumn, toColumn, notes, attachment);
  }, [pendingAttendanceMove, applyAttendanceMove]);

  const handleCancelAttendanceMove = useCallback(() => {
    setPendingAttendanceMove(null);
    loadData();
  }, [loadData]);

  const handlePreviewWorkflow = useCallback(async (item) => {
    const isWeekly = item.workflowType === 'ATTENDANCE_WEEKLY' || item.attendanceSubtype === 'WEEKLY_SUMMARY';
    if (!item?.classId && !isWeekly) return;
    const cls = item.classId ? welcomeContext?.classes?.find((c) => String(c.id) === String(item.classId)) : null;
    const programName = item.programName || welcomeContext?.program?.nameEn || '';
    try {
      if (isWeekly) {
        const result = await generateWeeklyViolationSnapshot({
          document: item,
          user,
          lang,
          programId: item.programId || welcomeContext?.programId,
          programName,
          classIds: item.classId ? [item.classId] : [],
          classId: item.classId || null,
          preview: true,
          skipPersist: true,
          download: false,
          workflowStatus: item.status || null,
        });
        if (result?.blobUrl) {
          window.open(result.blobUrl, '_blank');
        } else if (result?.blob) {
          const blobUrl = URL.createObjectURL(result.blob);
          window.open(blobUrl, '_blank');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } else {
          console.warn('[handlePreviewWorkflow] Weekly preview did not return a PDF');
        }
      } else {
        const clsObj = {
          id: item.classId,
          programId: item.programId || welcomeContext?.programId,
          subjectId: item.subjectId || cls?.subjectId,
          code: item.className,
          nameEn: item.className,
          nameAr: item.classNameAr || item.className,
        };
        const program = item.programId
          ? { id: item.programId, nameEn: programName, code: String(item.programId) }
          : { code: '' };
        const subject = item.subjectId
          ? { id: item.subjectId, nameEn: item.subjectName, code: String(item.subjectId) }
          : { code: '' };
        const result = await exportDailyOfficialForDate({
          cls: clsObj,
          program,
          subject,
          lang,
          user,
          date: item.date,
          format: EXPORT_FORMAT.PDF,
          skipDownload: true,
          skipPersist: true,
        });
        const blobUrl = URL.createObjectURL(result.blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
    } catch (err) {
      console.error('[OperationsBoardPage] preview workflow failed:', err);
      setError(t('operations_board_preview_error') || 'Failed to generate preview');
    }
  }, [user, lang, welcomeContext, t]);

  const handleCardClick = useCallback((card, tab = null) => {
    setSelectedCard(card);
    setDrawerTab(tab);
    setDrawerOpen(true);
  }, []);

  const handleCardUpdated = useCallback((cardId, patch) => {
    setData((prev) => prev.map((item) => (item.id === cardId ? { ...item, ...patch } : item)));
    setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, ...patch } : prev));
    if (onBoardDataChanged) onBoardDataChanged();
  }, [onBoardDataChanged]);

  const handleParticipationRefresh = useCallback(() => {
    setParticipationRefreshKey((k) => k + 1);
  }, []);

  const boardCollapseKey = lane === LANES.ATTENDANCE ? 'attendance' : 'workflow';
  const baseCollapsedSet = useMemo(
    () => collapsedSetForLane(boardCollapseKey),
    [collapsedSetForLane, boardCollapseKey],
  );
  const collapsedSet = baseCollapsedSet;

  // When collapse set changes, pin collapsed lanes and scale expanded lanes
  // proportionally so the content ratio is preserved (no extra empty space).
  const prevCollapsedSetRef = useRef(null);
  useEffect(() => {
    const columnIds = columns.map((c) => c.id);
    if (!columnIds.length) return;
    const width = measureBoardViewport();
    if (!width) return;
    if (skipCollapseRedistributeRef.current) {
      skipCollapseRedistributeRef.current = false;
      prevCollapsedSetRef.current = collapsedSet;
      prevViewportWidthRef.current = width;
      return;
    }
    prevCollapsedSetRef.current = collapsedSet;
    prevViewportWidthRef.current = width;
    setLaneWidths((prev) => {
      const next = { ...prev };
      const expandedIds = columnIds.filter((id) => !collapsedSet.has(id));
      const collapsedIds = columnIds.filter((id) => collapsedSet.has(id));
      const totalGap = LANE_GAP * Math.max(0, columnIds.length - 1);
      const collapsedTotal = collapsedIds.length * collapsedLaneWidth;
      const available = Math.max(0, width - totalGap - collapsedTotal);
      let changed = false;

      collapsedIds.forEach((id) => {
        if (next[id] !== collapsedLaneWidth) {
          next[id] = collapsedLaneWidth;
          changed = true;
        }
      });

      if (expandedIds.length === 0) {
        if (!changed) return prev;
        try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(next)); } catch {}
        return next;
      }

      const prevExpandedTotal = expandedIds.reduce(
        (sum, id) => sum + (next[id] && next[id] !== collapsedLaneWidth ? next[id] : DEFAULT_LANE_WIDTH),
        0,
      );
      const scale = prevExpandedTotal > 0 ? available / prevExpandedTotal : 1;

      expandedIds.forEach((id) => {
        const base = next[id] && next[id] !== collapsedLaneWidth ? next[id] : DEFAULT_LANE_WIDTH;
        const desired = Math.max(MIN_LANE_WIDTH, Math.min(MAX_LANE_WIDTH, Math.round(base * scale)));
        if (next[id] !== desired) {
          next[id] = desired;
          changed = true;
        }
      });

      if (!changed) return prev;
      try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [collapsedSet, columns, measureBoardViewport, collapsedLaneWidth]);

  // On first mount, if no lane widths are stored, compute equal distribution from the
  // actual container width and persist it so equal widths are the default.
  useEffect(() => {
    const columnIds = columns.map((c) => c.id);
    if (!columnIds.length || Object.keys(laneWidths).length > 0) return;
    const width = measureBoardViewport();
    if (!width) return;
    const defaults = computeEqualLaneWidths(columnIds, width, collapsedSet, collapsedLaneWidth);
    setLaneWidths(defaults);
    try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(defaults)); } catch {}
  }, [columns, laneWidths, measureBoardViewport, collapsedSet, collapsedLaneWidth]);

  const resolvedLaneWidths = useMemo(() => {
    const widths = { ...laneWidths };
    const columnIds = columns.map((c) => c.id);
    const hasMissing = columns.some((col) => !widths[col.id]);
    if (hasMissing) {
      const equal = computeEqualLaneWidths(columnIds, measureBoardViewport(), collapsedSet, collapsedLaneWidth);
      columns.forEach((col) => {
        if (!widths[col.id]) widths[col.id] = equal[col.id] || DEFAULT_LANE_WIDTH;
      });
    }
    columnIds.forEach((id) => {
      if (collapsedSet.has(id)) widths[id] = collapsedLaneWidth;
    });
    return widths;
  }, [columns, laneWidths, measureBoardViewport, collapsedSet, collapsedLaneWidth]);

  const opsGridColumns = useMemo(
    () => columns.map((col) => `${resolvedLaneWidths[col.id]}px`).join(' '),
    [columns, resolvedLaneWidths],
  );

  const opsGridMinWidth = useMemo(() => {
    const total = columns.reduce(
      (sum, col) => sum + (resolvedLaneWidths[col.id] || DEFAULT_LANE_WIDTH),
      0,
    );
    const gaps = LANE_GAP * Math.max(0, columns.length - 1);
    return total + gaps;
  }, [columns, resolvedLaneWidths]);

  useEffect(() => {
    console.log('[OperationsBoard] resolved widths:', { resolvedLaneWidths, opsGridColumns, opsGridMinWidth });
  }, [resolvedLaneWidths, opsGridColumns, opsGridMinWidth]);

  const displayData = useMemo(
    () => sortBoardData(filterBoardData(data, filters.search, lang), sortBy, lang),
    [data, filters.search, lang, sortBy]
  );
  console.log('[OperationsBoardPage] displayData:', displayData.length, displayData.map((d) => ({ id: d.id, column: d.column })));

  const selectedWorkflow = useMemo(() => {
    if (!data.length || lane !== LANES.STATUS) return null;
    const isWeekly = viewMode === 'week';
    const matchesViewMode = (d) =>
      isWeekly
        ? (d.workflowType === 'ATTENDANCE_WEEKLY' || d.attendanceSubtype === 'WEEKLY_SUMMARY')
        : (d.workflowType === 'ATTENDANCE_DAILY' || d.attendanceSubtype === 'DAILY');
    if (workflowId) {
      const byId = data.find((d) => d.type === 'workflow' && String(d.rawId) === String(workflowId));
      if (byId && matchesViewMode(byId)) return byId;
    }
    if (filters.classId) {
      return data.find(
        (d) =>
          d.type === 'workflow' &&
          String(d.classId) === String(filters.classId) &&
          matchesViewMode(d)
      ) || null;
    }
    return null;
  }, [data, workflowId, filters.classId, lane, viewMode]);

  useEffect(() => {
    onSelectedWorkflowChange?.(selectedWorkflow || null);
  }, [selectedWorkflow, onSelectedWorkflowChange]);

  const handleAutoFitContent = useCallback(() => {
    console.log('[handleAutoFitContent] start');
    const columnIds = columns.map((c) => c.id);
    if (!columnIds.length) return;
    const boardKey = boardCollapseKey;
    const existingCollapsed = collapsedSetForLane(boardKey);
    const width = measureBoardViewport();
    if (!width) return;
    const counts = {};
    columnIds.forEach((id) => {
      counts[id] = displayData.filter((d) => d.column === id).length;
    });
    const nonEmptyIds = columnIds.filter((id) => counts[id] > 0);
    // If nothing is shown, fall back to reset/equal widths instead of collapsing everything
    if (nonEmptyIds.length === 0) {
      const equal = computeEqualLaneWidths(columnIds, width, existingCollapsed, collapsedLaneWidth);
      setLaneWidths(equal);
      setLaneSizingMode('content');
      try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(equal)); } catch {}
      try { localStorage.setItem('operations_board_last_autofit_mode', 'content'); } catch {}
      return;
    }
    // If every lane is currently collapsed, expand first so auto-fit can work on the data.
    const allCollapsed = existingCollapsed.size === columnIds.length;
    const collapsed = new Set(allCollapsed ? [] : [...existingCollapsed]);
    columnIds.forEach((id) => {
      if (counts[id] === 0) collapsed.add(id);
    });

    // Compute a desired width per lane based on the longest name and the number of cards,
    // scaled by the current font size so the layout remains usable at larger sizes.
    const charWidthPx = 8 * (fontScale / 100);
    const basePaddingPx = Math.round(120 * (fontScale / 100));
    const perCardPx = Math.round(10 * (fontScale / 100));
    const scores = {};
    let totalScore = 0;
    columnIds.forEach((id) => {
      if (collapsed.has(id)) {
        scores[id] = 0;
        return;
      }
      const cardsInColumn = displayData.filter((d) => d.column === id);
      const maxNameLength = Math.min(Math.max(...cardsInColumn.map((c) => (c.name || c.studentName || '').length), 8), MAX_LANE_NAME_CHARS);
      const nameWidth = maxNameLength * charWidthPx + basePaddingPx;
      const contentScore = nameWidth + cardsInColumn.length * perCardPx;
      scores[id] = Math.max(MIN_LANE_WIDTH, contentScore);
      totalScore += scores[id];
    });

    const expandedCount = columnIds.length - collapsed.size;
    const gaps = LANE_GAP * Math.max(0, columnIds.length - 1);
    const collapsedTotal = collapsed.size * collapsedLaneWidth;
    const available = Math.max(0, width - gaps - collapsedTotal);

    // If all content fits inside the viewport, scale the widths up proportionally to fill it.
    // Otherwise keep the natural widths and let the board scroll horizontally.
    const shouldFill = totalScore > 0 && expandedCount > 0 && totalScore < available;
    const contentWidths = {};
    columnIds.forEach((id) => {
      if (collapsed.has(id)) {
        contentWidths[id] = collapsedLaneWidth;
        return;
      }
      let desired = scores[id];
      if (shouldFill) {
        desired = (scores[id] / totalScore) * available;
      }
      contentWidths[id] = Math.max(MIN_LANE_WIDTH, Math.min(MAX_LANE_WIDTH, Math.round(desired)));
    });

    // Widths were computed by this action; tell the collapse watcher not to redistribute them.
    skipCollapseRedistributeRef.current = true;
    setCollapsedLanes((prev) => {
      const next = { ...prev, [boardKey]: [...collapsed] };
      try { localStorage.setItem(LANE_COLLAPSE_KEY, JSON.stringify({ ...next, _v: LANE_COLLAPSE_VERSION })); } catch {}
      return next;
    });
    setLaneWidths(contentWidths);
    setLaneSizingMode('content');
    try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(contentWidths)); } catch {}
    try { localStorage.setItem('operations_board_last_autofit_mode', 'content'); } catch {}
    console.log('[handleAutoFitContent] final:', { contentWidths, shouldFill, totalScore, available, nonEmptyIds, scores });
  }, [columns, displayData, boardCollapseKey, collapsedSetForLane, collapsedLaneWidth, measureBoardViewport, fontScale]);

  const handleAutoFitScreen = useCallback(() => {
    console.log('[handleAutoFitScreen] start');
    const columnIds = columns.map((c) => c.id);
    if (!columnIds.length) return;
    const boardKey = boardCollapseKey;
    const width = measureBoardViewport();
    if (!width) return;

    // Expand all lanes so the board can grow beyond the viewport when needed.
    skipCollapseRedistributeRef.current = true;
    setCollapsedLanes((prev) => {
      const next = { ...prev, [boardKey]: [] };
      try { localStorage.setItem(LANE_COLLAPSE_KEY, JSON.stringify({ ...next, _v: LANE_COLLAPSE_VERSION })); } catch {}
      return next;
    });

    // Distribute the viewport width equally across all expanded lanes.
    // Cap each lane at MAX_LANE_WIDTH so a single wide card cannot force a 500+ pixel column.
    const equalWidths = computeEqualLaneWidths(columnIds, width, new Set(), collapsedLaneWidth);
    const contentWidths = {};
    columnIds.forEach((id) => {
      contentWidths[id] = Math.min(MAX_LANE_WIDTH, equalWidths[id] || MIN_LANE_WIDTH);
    });

    // Widths were computed by this action; tell the collapse watcher not to redistribute them.
    skipCollapseRedistributeRef.current = true;
    console.log('[handleAutoFitScreen] final:', { contentWidths, equalWidths, width });
    setLaneWidths(contentWidths);
    setLaneSizingMode('screen');
    try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(contentWidths)); } catch {}
    try { localStorage.setItem('operations_board_last_autofit_mode', 'screen'); } catch {}
  }, [columns, boardCollapseKey, collapsedLaneWidth, measureBoardViewport]);

  // Auto-apply the last used auto-fit mode on mount after data is loaded
  useEffect(() => {
    if (autoFitAppliedRef.current) return;
    const lastMode = (() => {
      try {
        return localStorage.getItem('operations_board_last_autofit_mode') || null;
      } catch {
        return null;
      }
    })();

    if (!lastMode || !displayData.length || !columns.length) return;

    autoFitAppliedRef.current = true;
    if (lastMode === 'content') {
      handleAutoFitContent();
    } else if (lastMode === 'screen') {
      handleAutoFitScreen();
    }
    // 'reset' doesn't need to be auto-applied since it's the default behavior
  }, [displayData, columns, handleAutoFitContent, handleAutoFitScreen]);

  // When the board is expanded to full screen, refit the swimlanes so they
  // actually use the larger viewport instead of keeping the old embedded widths.
  useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    prevExpandedRef.current = expanded;
    if (wasExpanded && !expanded) {
      setLaneSizingMode('manual');
    }
    if (!expanded || wasExpanded) return;
    if (panelTab !== 'board' || view !== VIEWS.KANBAN) return;
    if (!columns.length || !displayData.length) return;

    // Wait a tick for the full-screen overlay to finish laying out.
    const timer = setTimeout(() => {
      handleAutoFitScreen();
    }, 60);
    return () => clearTimeout(timer);
  }, [expanded, panelTab, view, columns, displayData, handleAutoFitScreen]);

  useEffect(() => {
    if (!drawerOpen || !selectedCard?.id) return;
    const updated = displayData.find((d) => d.id === selectedCard.id);
    if (
      updated
      && (updated.column !== selectedCard.column
        || updated.rawId !== selectedCard.rawId
        || updated.notes !== selectedCard.notes)
    ) {
      setSelectedCard(updated);
    }
  }, [displayData, drawerOpen, selectedCard]);

  const workflowOrderKey = useMemo(() => {
    const parts = [filters.programId, filters.termId, workflowId].filter(Boolean);
    return parts.length ? parts.join('_') : 'default';
  }, [filters.programId, filters.termId, workflowId]);

  const pageClassName = [
    'operations-board-page',
    embedded ? 'operations-board-embedded' : '',
    expanded ? 'operations-board-expanded' : '',
  ].filter(Boolean).join(' ');

  const showLaneReset = panelTab === 'board' && view === VIEWS.KANBAN;

  // ── Guided Tour ────────────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const tourSeenKey = `operationsBoardTourSeen_${lang}`;

  useEffect(() => {
    const steps = [
      { target: 'body', content: t('tour.operations_board_intro'), disableBeacon: true, placement: 'center' },
      { target: '[data-tour="operations-board-lane-tabs"]', content: t('tour.operations_board_lane_tabs'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="operations-board-panel-tabs"]', content: t('tour.operations_board_panel_tabs'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="operations-board-search"]', content: t('tour.operations_board_search'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="operations-board-sort"]', content: t('tour.operations_board_sort'), disableBeacon: true, placement: 'bottom' },
      { target: '[data-tour="operations-board-viewport"]', content: t('tour.operations_board_viewport'), disableBeacon: true, placement: 'top' },
    ];
    if (panelTab === 'calendar') {
      steps.push({ target: '[data-tour="operations-board-calendar"]', content: t('tour.operations_board_calendar'), disableBeacon: true, placement: 'top' });
    }
    steps.push(
      { target: '[data-tour="operations-board-legend"]', content: t('tour.operations_board_legend'), disableBeacon: true, placement: 'top' },
      { target: '[data-tour="operations-board-view-mode"]', content: t('tour.operations_board_view_mode'), disableBeacon: true, placement: 'top' },
    );
    setTourSteps(steps);
  }, [lang, t, panelTab, view]);

  useEffect(() => {
    const start = () => { if (isOnboardingTourEnabled()) setRunTour(true); };
    window.addEventListener('app:joyride', start);
    window.addEventListener('app:help', start);
    return () => { window.removeEventListener('app:joyride', start); window.removeEventListener('app:help', start); };
  }, []);

  useEffect(() => {
    if (!isOnboardingTourEnabled()) return;
    try { if (!localStorage.getItem(tourSeenKey)) setRunTour(true); } catch {}
  }, [tourSeenKey]);

  const handleTourCallback = useCallback((data) => {
    const { status, action } = data || {};
    if (status === 'finished' || status === 'skipped' || action === 'close') {
      setRunTour(false);
      window.__joyrideActive = false;
      endManualTour();
      try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
    } else if (status === 'running') {
      window.__joyrideActive = true;
    }
  }, [tourSeenKey]);
  const TourTooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={pageClassName}
      style={{
        direction: lang === 'ar' ? 'rtl' : 'ltr',
        '--ops-font-scale': String(fontScale / 100),
        '--ops-grid-columns': opsGridColumns,
        '--ops-grid-min-width': `${opsGridMinWidth}px`,
      }}
      data-testid="operations-board-page"
    >
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
          back: t('tour_back'),
          close: t('tour_close'),
          last: t('tour_finish'),
          next: t('tour_next'),
          skip: t('tour_skip'),
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

      <div className="operations-board-banner-overlay">
        {error && (
          <Banner
            inset
            className="bg-rose-500/95 text-white shadow-lg backdrop-blur-sm"
            data-testid="operations-board-error"
          >
            <BannerIcon icon={AlertTriangle} className="border-white/20 bg-white/10" />
            <BannerTitle className="text-sm font-medium">
              {error}
            </BannerTitle>
            <BannerClose className="hover:bg-white/10 hover:text-white" />
          </Banner>
        )}
      </div>

      <div
        data-tour="operations-board-filter-bar"
        style={panelTab === 'calendar' ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}
      >
        <BoardFilterBar
          filters={filters}
          onFilterChange={setFilters}
          view={view}
          welcomeContext={welcomeContext}
          panelTab={panelTab}
          onPanelTabChange={handlePanelTabChange}
          onClassSessionClick={handleClassSessionClick}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          lane={lane}
          roleContext={roleContext}
          embedded={embedded}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          viewMode={viewMode}
          calendarView={calendarView}
          onCalendarViewChange={handleCalendarViewChange}
          onLaneChange={(newLane) => {
            updateParams((next) => {
              next.set('lane', newLane);
              if (newLane === LANES.ATTENDANCE) next.delete('workflowId');
            });
          }}
          onAutoFitContent={handleAutoFitContent}
          onAutoFitScreen={handleAutoFitScreen}
          showLaneReset={panelTab === 'board' && view === VIEWS.KANBAN}
          showAvatars={showAvatars}
          onToggleShowAvatars={handleToggleShowAvatars}
        />
      </div>


      {panelTab !== 'calendar' && (
      <div ref={boardViewportRef} className="operations-board-viewport flex-1 min-h-0 min-w-0 w-full" data-tour="operations-board-viewport">
        <div className="operations-board-content h-full">
        {loading ? (
          <div className="flex h-full min-h-[240px] items-center justify-center" data-testid="operations-board-loading">
            <SimpleLoading type="brand" size="lg" />
          </div>
        ) : view === VIEWS.TABLE ? (
          <BoardTableView data={displayData} columns={columns} onCardClick={handleCardClick} t={t} lang={lang} sortBy={sortBy} roleContext={roleContext} showAvatars={showAvatars} participationRefreshKey={participationRefreshKey} />
        ) : lane === LANES.ATTENDANCE ? (
          <AttendanceBoard
            data={displayData}
            columns={attendanceColumns}
            readOnly={attendanceLocked}
            lockReason={attendanceLockReason}
            lockReasonType={attendanceLockType}
            onDragEnd={handleDragEnd}
            onCardClick={handleCardClick}
            onCardUpdated={handleCardUpdated}
            onDragRejected={handleAttendanceDragRejected}
            t={t}
            lang={lang}
            roleContext={roleContext}
            sortBy={sortBy}
            onLaneResize={startLaneResize}
            onLaneWidthsReset={() => resetLaneWidths(columns.map((c) => c.id), boardCollapseKey)}
            onLaneAutoFit={autoFitLane}
            disableLaneReset={laneSizingMode !== 'manual'}
            collapsedLanes={collapsedSet}
            onToggleLaneCollapse={(columnId) => toggleLaneCollapse(boardCollapseKey, columnId)}
            onBulkMove={handleBulkMove}
            participationRefreshKey={participationRefreshKey}
            fontScale={fontScale}
            showAvatars={showAvatars}
            style={{
              gridTemplateColumns: opsGridColumns,
              gap: LANE_GAP,
              '--ops-grid-columns': opsGridColumns,
              '--ops-grid-gap': `${LANE_GAP}px`,
            }}
          />
        ) : (
          <WorkflowBoard
            data={displayData}
            columns={workflowColumns}
            onDragEnd={handleDragEnd}
            onCardClick={handleCardClick}
            onPreviewWorkflow={handlePreviewWorkflow}
            onDragRejected={showDragInvalidBanner}
            canMoveToColumn={(from, to) => canMoveWorkflowToColumn(from, to, roleContext)}
            isWorkflowLocked={isWorkflowLocked}
            orderKey={workflowOrderKey}
            onLaneResize={startLaneResize}
            onLaneWidthsReset={() => resetLaneWidths(columns.map((c) => c.id), boardCollapseKey)}
            onLaneAutoFit={autoFitLane}
            disableLaneReset={laneSizingMode !== 'manual'}
            collapsedLanes={collapsedSet}
            onToggleLaneCollapse={(columnId) => toggleLaneCollapse(boardCollapseKey, columnId)}
            onBulkMove={handleBulkMove}
            roleContext={roleContext}
            t={t}
            lang={lang}
            fontScale={fontScale}
            style={{
              gridTemplateColumns: opsGridColumns,
              gap: LANE_GAP,
              '--ops-grid-columns': opsGridColumns,
              '--ops-grid-gap': `${LANE_GAP}px`,
            }}
          />
        )}
        </div>
      </div>
      )}

      <BoardFooter
        columns={columns}
        lane={lane}
        view={view}
        onViewChange={handleBoardViewChange}
        embedded={embedded}
        expanded={expanded}
        onToggleExpand={onToggleExpand}
        onExportDailyTemplate={onExportDailyTemplate}
        onExportWeeklySchedule={onExportWeeklySchedule}
        exportingKey={exportingKey}
        onOpenHistory={onOpenHistory}
        classInfo={data?.[0] ? {
          id: data[0].classId,
          nameEn: data[0].classNameEn || data[0].className,
          nameAr: data[0].classNameAr,
        } : null}
        date={filters.date}
        roleContext={roleContext}
        panelTab={panelTab}
        showLegend
      />

      <WorkflowMoveConfirmDialog
        open={Boolean(pendingWorkflowMove)}
        onClose={handleCancelWorkflowMove}
        onConfirm={handleConfirmWorkflowMove}
        fromColumn={pendingWorkflowMove?.fromColumn}
        toColumn={pendingWorkflowMove?.toColumn}
        columns={workflowColumns}
        itemName={pendingWorkflowMove?.item?.name}
        loading={workflowMoveLoading}
        adminOverride={pendingWorkflowMove?.adminOverride}
        roleContext={roleContext}
        workflowType={pendingWorkflowMove?.item?.workflowType || ''}
        attendanceSubtype={pendingWorkflowMove?.item?.attendanceSubtype || ''}
        dailyApprovedCount={pendingWorkflowMove?.dailyApprovedCount}
        dailyRequiredCount={pendingWorkflowMove?.dailyRequiredCount}
        t={t}
        lang={lang}
      />

      <AttendanceStatusChangeDialog
        open={Boolean(pendingAttendanceMove)}
        onClose={handleCancelAttendanceMove}
        onConfirm={handleConfirmAttendanceMove}
        item={pendingAttendanceMove?.item}
        fromColumn={pendingAttendanceMove?.fromColumn}
        toColumn={pendingAttendanceMove?.toColumn}
        roleContext={roleContext}
      />

      <ApprovalSuccessDialog
        open={Boolean(approvalSnapshot)}
        onClose={() => setApprovalSnapshot(null)}
        snapshot={approvalSnapshot}
        t={t}
      />

      {actionBanner && (
        <div className="operations-board-action-announcement" data-testid="operations-board-action-banner">
          <Announcement
            themed
            className="operations-board-action-announcement-pill text-white"
            style={{ backgroundColor: actionBanner.pillColor || '#059669' }}
          >
            <AnnouncementTag
              className="!bg-transparent !border-0 !p-0 text-white"
            >
              {actionBanner.icon || <CheckCircle2 size={16} className="shrink-0" />}
            </AnnouncementTag>
            <AnnouncementTitle className="text-xs font-medium gap-1.5">
              {actionBanner.message}
              {actionBanner.notifySent && (
                <span className="text-xs font-medium opacity-85 whitespace-nowrap">
                  · {t('operations_board_notification_sent') || 'Notification sent'}
                </span>
              )}
              {actionBanner.onUndo && (
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 rounded-md text-xs font-semibold px-1.5 py-0.5 hover:bg-white/25 transition-colors"
                  onClick={actionBanner.onUndo}
                  data-testid="operations-board-action-undo"
                >
                  <Undo2 size={14} />
                  {t('operations_board_undo') || 'Undo'}
                </button>
              )}
              <button
                type="button"
                className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-white/25 transition-colors"
                onClick={clearActionBanner}
                aria-label={t('operations_board_dismiss') || 'Dismiss'}
              >
                <X size={14} />
              </button>
            </AnnouncementTitle>
          </Announcement>
        </div>
      )}

      <ClassHistoryDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerTab(null); }}
        card={selectedCard}
        lane={lane}
        onRefresh={loadData}
        onCardUpdated={handleCardUpdated}
        onParticipationRefresh={handleParticipationRefresh}
        onActionBanner={showActionBanner}
        roleContext={roleContext}
        drawerTab={drawerTab}
        view={view}
      />
    </div>
  );
}
