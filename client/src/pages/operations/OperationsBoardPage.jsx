import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Joyride from 'react-joyride';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { error as logError, info as logInfo } from '@services/utils/logger.js';
import chatSocket from '@services/realtime/chatSocket.js';
import { Announcement, AnnouncementTag, AnnouncementTitle } from '@/components/kibo-ui/announcement';
import { Banner, BannerIcon, BannerTitle, BannerClose } from '@/components/kibo-ui/banner';
import { toast } from 'sonner';
import { Undo2, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import './OperationsBoardPage.css';
import {
  fetchWorkflowBoardData,
  fetchAttendanceBoardData,
  moveWorkflowCard,
  moveAttendanceCard,
  markWorkflowAsTaken,
  WORKFLOW_COLUMNS,
  ATTENDANCE_COLUMNS,
} from '@services/business/operationsBoardService.js';
import { getStatusCodeFromRecord } from '../../constants/attendanceTypes.js';
import WorkflowBoard from '@components/operations-board/WorkflowBoard.jsx';
import AttendanceBoard from '@components/operations-board/AttendanceBoard.jsx';
import BoardTableView from '@components/operations-board/BoardTableView.jsx';
import BoardFilterBar from '@components/operations-board/BoardFilterBar.jsx';
import BoardStudentDrawer from '@components/operations-board/BoardStudentDrawer.jsx';
import BoardFooter from '@components/operations-board/BoardFooter.jsx';
import { getAttendanceColumnsForRole, canMoveAttendanceToColumn } from '@components/operations-board/attendanceBoardRules.js';
import {
  getWorkflowColumnsForRole,
  canMoveWorkflowToColumn,
  shouldConfirmWorkflowMove,
} from '@components/operations-board/workflowBoardRules.js';
import { resolveBoardStudentName } from '@components/operations-board/operationsBoardDisplayUtils.js';
import WorkflowMoveConfirmDialog from '@components/operations-board/WorkflowMoveConfirmDialog.jsx';

const VIEWS = { KANBAN: 'kanban', LIST: 'list', TABLE: 'table' };
const LANES = { STATUS: 'status', ATTENDANCE: 'attendance' };
const SORT_MODES = { SYSTEM: 'system', ALPHA: 'alpha', MILITARY_ID: 'military_id' };

const DEFAULT_LANE_WIDTH = 240;
const MIN_LANE_WIDTH = 140;
const MAX_LANE_WIDTH = 560;
const COLLAPSED_LANE_WIDTH = 56;
const LANE_GAP = 16;
const LANE_COLLAPSE_KEY = 'operations_board_collapsed_lanes';

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
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getDefaultCollapsedForRole(roleContext = {}) {
  const { isHR, isAdmin, isSuperAdmin } = roleContext;
  if (isSuperAdmin) return [];
  if (isHR && !isAdmin) return ['DRAFT', 'TAKEN', 'SUBMITTED'];
  if (isAdmin && !isHR) return ['DRAFT'];
  if (isAdmin && isHR) return ['DRAFT', 'TAKEN', 'SUBMITTED'];
  return [];
}

function hasStoredCollapsed(boardKey) {
  try {
    const raw = localStorage.getItem(LANE_COLLAPSE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return Array.isArray(parsed?.[boardKey]);
  } catch {
    return false;
  }
}

/** Equal-distribute expanded lanes across full container width (no max clamp). */
function computeEqualLaneWidths(columnIds, containerWidth, collapsedSet = new Set()) {
  if (!columnIds?.length) return {};
  const expandedIds = columnIds.filter((id) => !collapsedSet.has(id));
  const collapsedIds = columnIds.filter((id) => collapsedSet.has(id));
  const n = columnIds.length;
  const totalGap = LANE_GAP * Math.max(0, n - 1);
  const collapsedTotal = collapsedIds.length * COLLAPSED_LANE_WIDTH;
  const available = Math.max(0, (containerWidth || 0) - totalGap - collapsedTotal);
  const result = {};
  collapsedIds.forEach((id) => { result[id] = COLLAPSED_LANE_WIDTH; });
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
}) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { isInstructor, isAdmin, isHR, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleContext = useMemo(() => ({
    isInstructor, isAdmin, isHR, isSuperAdmin,
  }), [isInstructor, isAdmin, isHR, isSuperAdmin]);

  const lane = searchParams.get('lane') || (searchParams.get('mode') === 'attendance' ? LANES.ATTENDANCE : LANES.STATUS);
  const rawView = searchParams.get('view') || VIEWS.KANBAN;
  const view = rawView === VIEWS.LIST ? VIEWS.TABLE : (rawView === VIEWS.TABLE ? VIEWS.TABLE : VIEWS.KANBAN);
  const workflowId = searchParams.get('workflowId');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastLocalChangeRef = useRef(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionBanner, setActionBanner] = useState(null);
  const actionBannerTimerRef = useRef(null);
  const [panelTab, setPanelTab] = useState('board');
  const [laneWidths, setLaneWidths] = useState(loadStoredLaneWidths);
  const [collapsedLanes, setCollapsedLanes] = useState(loadCollapsedLanes);
  const [pendingWorkflowMove, setPendingWorkflowMove] = useState(null);
  const [workflowMoveLoading, setWorkflowMoveLoading] = useState(false);
  const [participationRefreshKey, setParticipationRefreshKey] = useState(0);
  const resizingLaneRef = useRef(null);
  const boardViewportRef = useRef(null);
  const [boardViewportWidth, setBoardViewportWidth] = useState(0);
  const noWorkflowsToastShownRef = useRef(false);

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
        '.operations-attendance-card, .operations-board-card-collapsed, ' +
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

  const collapsedSetForLane = useCallback((boardKey) => {
    const ids = collapsedLanes[boardKey];
    return new Set(Array.isArray(ids) ? ids : []);
  }, [collapsedLanes]);

  // Initialize workflow collapsed lanes with role-based defaults on first mount
  useEffect(() => {
    if (hasStoredCollapsed('workflow')) return;
    const defaults = getDefaultCollapsedForRole(roleContext);
    if (defaults.length === 0) return;
    setCollapsedLanes((prev) => {
      if (Array.isArray(prev?.workflow)) return prev;
      const next = { ...prev, workflow: defaults };
      try { localStorage.setItem(LANE_COLLAPSE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [roleContext]);

  const toggleLaneCollapse = useCallback((boardKey, columnId) => {
    setCollapsedLanes((prev) => {
      const current = new Set(Array.isArray(prev[boardKey]) ? prev[boardKey] : []);
      if (current.has(columnId)) current.delete(columnId);
      else current.add(columnId);
      const next = { ...prev, [boardKey]: [...current] };
      try { localStorage.setItem(LANE_COLLAPSE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const resetLaneWidths = useCallback((columnIds, boardKey) => {
    if (!columnIds?.length) return;
    const width = boardViewportWidth || measureBoardViewport();
    const collapsed = collapsedSetForLane(boardKey || (lane === LANES.ATTENDANCE ? 'attendance' : 'workflow'));
    const defaults = computeEqualLaneWidths(columnIds, width, collapsed);
    setLaneWidths(defaults);
    try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(defaults)); } catch {}
  }, [boardViewportWidth, measureBoardViewport, collapsedSetForLane, lane]);

  const updateParams = useCallback((updater) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (embedded) next.set('tab', 'operations');
      updater(next);
      return next;
    });
  }, [embedded, setSearchParams]);

  useEffect(() => {
    if (!welcomeContext) return;
    updateParams((next) => {
      if (welcomeContext.programId && !next.get('programId')) {
        next.set('programId', String(welcomeContext.programId));
      }
      if (welcomeContext.termId && !next.get('termId')) {
        next.set('termId', String(welcomeContext.termId));
      }
      if (welcomeContext.date && !next.get('date')) {
        next.set('date', toIsoDate(welcomeContext.date));
      }
      if (!next.get('lane')) next.set('lane', LANES.ATTENDANCE);
      if (!next.get('view')) next.set('view', VIEWS.KANBAN);
    });
  }, [welcomeContext, updateParams]);

  useEffect(() => {
    if (!welcomeContext?.date) return;
    const syncedDate = toIsoDate(welcomeContext.date);
    updateParams((next) => {
      if (next.get('date') !== syncedDate) next.set('date', syncedDate);
    });
  }, [welcomeContext?.date, updateParams]);

  useEffect(() => {
    noWorkflowsToastShownRef.current = false;
  }, [lane]);

  const filters = useMemo(() => {
    const f = {};
    const date = searchParams.get('date') || toIsoDate(welcomeContext?.date) || todayIso();
    f.date = date;
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
    return f;
  }, [searchParams, workflowId, welcomeContext]);

  // Auto-switch to attendance lane only when classId first appears (not on every lane change)
  const autoSwitchedClassIdRef = useRef(null);
  useEffect(() => {
    if (filters.classId && autoSwitchedClassIdRef.current !== filters.classId) {
      autoSwitchedClassIdRef.current = filters.classId;
      if (lane !== LANES.ATTENDANCE) {
        updateParams((next) => {
          next.set('lane', LANES.ATTENDANCE);
          next.delete('workflowId');
        });
      }
    } else if (!filters.classId) {
      autoSwitchedClassIdRef.current = null;
    }
  }, [filters.classId, lane, updateParams]);

  const setFilters = useCallback((newFilters) => {
    updateParams((next) => {
      if (newFilters.date) next.set('date', newFilters.date);
      else next.delete('date');
      if (newFilters.search) next.set('search', newFilters.search);
      else next.delete('search');
      if (newFilters.classId) next.set('classId', String(newFilters.classId));
      else if (Object.prototype.hasOwnProperty.call(newFilters, 'classId')) next.delete('classId');
    });
    if (newFilters.date && onDateChange) {
      onDateChange(new Date(`${newFilters.date}T12:00:00`));
    }
  }, [updateParams, onDateChange]);

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

  const dbCodeToBoardLane = useCallback((code) => {
    if (!code) return 'NOT_TAKEN';
    const upper = code.toUpperCase().trim();
    const map = {
      'ATTENDANCE_PRESENT': 'PRESENT',
      'PRESENT': 'PRESENT',
      'ATTENDANCE_LATE': 'LATE',
      'LATE': 'LATE',
      'ATTENDANCE_ABSENT': 'ABSENT',
      'ABSENT_NO_EXCUSE': 'ABSENT',
      'ABSENT': 'ABSENT',
      'ATTENDANCE_LEAVE': 'EXCUSED',
      'EXCUSED_LEAVE': 'EXCUSED',
      'EXCUSED': 'EXCUSED',
      'ABSENT_WITH_EXCUSE': 'EXCUSED',
      'ATTENDANCE_HUMAN_CASE': 'HUMAN_CASE',
      'HUMAN_CASE': 'HUMAN_CASE',
    };
    return map[upper] || 'NOT_TAKEN';
  }, []);

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
      const newColumn = dbCodeToBoardLane(payload.status?.code);
      setData((prev) => prev.map((item) => {
        if (item.type !== 'attendance') return item;
        if (String(item.userId) !== String(payload.userId)) return item;
        if (newColumn === 'NOT_TAKEN') {
          return {
            ...item,
            column: 'NOT_TAKEN',
            status: 'NOT_TAKEN',
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

    const handleWorkflowUpdate = (payload) => {
      if (lastLocalChangeRef.current &&
          lastLocalChangeRef.current.id === payload.documentId &&
          Date.now() - lastLocalChangeRef.current.time < 3000) {
        return;
      }
      setData((prev) => prev.map((item) => {
        if (item.type !== 'workflow') return item;
        if (String(item.rawId) !== String(payload.documentId)) return item;
        return {
          ...item,
          column: payload.status || item.column,
          status: payload.status || item.status,
        };
      }));
    };

    chatSocket.on('board:attendance_updated', handleAttendanceUpdate);
    chatSocket.on('board:workflow_updated', handleWorkflowUpdate);

    return () => {
      chatSocket.off('board:attendance_updated', handleAttendanceUpdate);
      chatSocket.off('board:workflow_updated', handleWorkflowUpdate);
    };
  }, [filters.classId, filters.date, dbCodeToBoardLane]);

  const applyWorkflowMove = useCallback(async (activeId, fromColumn, toColumn, item) => {
    const result = await moveWorkflowCard(item.rawId, fromColumn, toColumn);
    if (!result.success) {
      setError(t('operations_board_drag_error'));
      loadData();
      return false;
    }
    lastLocalChangeRef.current = { id: item.rawId, time: Date.now() };
    setData((prev) => prev.map((d) => (d.id === activeId ? { ...d, column: toColumn, status: toColumn } : d)));
    const studentName = resolveBoardStudentName(item, lang);
    const toCol = WORKFLOW_COLUMNS.find((c) => c.id === toColumn);
    const statusLabel = toCol ? (t(toCol.i18nKey) || toCol.name) : toColumn;
    showActionBanner({
      message: t('operations_board_action_banner', { name: studentName || item.name, status: statusLabel }),
      onUndo: async () => {
        clearActionBanner();
        const undoResult = await moveWorkflowCard(item.rawId, toColumn, fromColumn);
        if (undoResult.success) {
          lastLocalChangeRef.current = { id: item.rawId, time: Date.now() };
          setData((prev) => prev.map((d) => (d.id === activeId ? { ...d, column: fromColumn, status: fromColumn } : d)));
        } else {
          setError(t('operations_board_drag_error'));
          loadData();
        }
      },
    });
    return true;
  }, [t, loadData, lang, showActionBanner, clearActionBanner]);

  const handleDragEnd = useCallback(async (activeId, fromColumn, toColumn) => {
    const item = data.find((d) => d.id === activeId);
    if (!item || fromColumn === toColumn) return;

    if (item.type === 'attendance' && !canMoveAttendanceToColumn(toColumn, roleContext)) {
      setError(t('operations_board_drag_invalid'));
      loadData();
      return;
    }

    if (item.type === 'workflow') {
      if (!canMoveWorkflowToColumn(fromColumn, toColumn, roleContext)) {
        setError(t('operations_board_drag_invalid'));
        loadData();
        return;
      }
      // Revert optimistic board move until user confirms
      setData((prev) => prev.map((d) => (d.id === activeId ? { ...d, column: fromColumn, status: fromColumn } : d)));
      if (shouldConfirmWorkflowMove(fromColumn, toColumn)) {
        setPendingWorkflowMove({ activeId, fromColumn, toColumn, item });
        return;
      }
      await applyWorkflowMove(activeId, fromColumn, toColumn, item);
      return;
    }

    if (item.type === 'attendance') {
      const result = await moveAttendanceCard(item.rawId, toColumn, null, item.rawId ? null : {
        userId: item.userId,
        classId: item.classId,
        date: item.date,
      });
      if (!result.success) {
        setError(result.error || t('operations_board_drag_error'));
        loadData();
      } else {
        lastLocalChangeRef.current = { id: result.data?.id || item.rawId, time: Date.now() };
        setData((prev) => prev.map((d) => {
          if (d.id !== activeId) return d;
          if (toColumn === 'NOT_TAKEN') {
            return { ...d, column: 'NOT_TAKEN', status: 'NOT_TAKEN', rawId: null, notes: null, id: `att-pending-${d.userId}` };
          }
          return { ...d, column: toColumn, status: toColumn, rawId: result.data?.id || d.rawId, id: result.data?.id ? `att-${result.data.id}` : d.id };
        }));
        const studentName = resolveBoardStudentName(item, lang);
        const statusLabel = t(`operations_board_lane_${toColumn.toLowerCase()}`) || toColumn;
        showActionBanner({
          message: t('operations_board_action_banner', { name: studentName, status: statusLabel }),
          onUndo: async () => {
            clearActionBanner();
            let undoId = result.data?.id || item.rawId;
            let undoCreate = null;
            if (toColumn === 'NOT_TAKEN') {
              undoId = null;
              undoCreate = { userId: item.userId, classId: item.classId, date: item.date };
            } else if (fromColumn === 'NOT_TAKEN') {
              undoId = result.data?.id;
            }
            const undoResult = await moveAttendanceCard(undoId, fromColumn, null, undoCreate);
            if (undoResult.success) {
              lastLocalChangeRef.current = { id: undoResult.data?.id || undoId, time: Date.now() };
              setData((prev) => prev.map((d) => {
                if (d.userId !== item.userId) return d;
                if (fromColumn === 'NOT_TAKEN') {
                  return { ...d, column: 'NOT_TAKEN', status: 'NOT_TAKEN', rawId: null, notes: null, id: `att-pending-${d.userId}` };
                }
                return {
                  ...d,
                  column: fromColumn,
                  status: fromColumn,
                  rawId: undoResult.data?.id || d.rawId,
                  id: undoResult.data?.id ? `att-${undoResult.data.id}` : d.id,
                };
              }));
            } else {
              setError(t('operations_board_drag_error'));
              loadData();
            }
          },
        });
      }
    }
  }, [data, t, loadData, roleContext, lang, showActionBanner, clearActionBanner, applyWorkflowMove]);

  const handleBulkMove = useCallback(async (fromColumn, toColumn) => {
    if (fromColumn === toColumn) return;
    const itemsToMove = data.filter((d) => d.column === fromColumn);
    if (!itemsToMove.length) return;

    const movedIds = [];
    const undoSnapshots = [];

    for (const item of itemsToMove) {
      if (item.type === 'attendance') {
        if (!canMoveAttendanceToColumn(toColumn, roleContext)) continue;
        const result = await moveAttendanceCard(item.rawId, toColumn, null, item.rawId ? null : {
          userId: item.userId,
          classId: item.classId,
          date: item.date,
        });
        if (result.success) {
          movedIds.push(item.id);
          undoSnapshots.push({ item, prevColumn: fromColumn, prevRawId: item.rawId, resultId: result.data?.id });
          lastLocalChangeRef.current = { id: result.data?.id || item.rawId, time: Date.now() };
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
      setError(t('operations_board_drag_invalid'));
      loadData();
      return;
    }

    setData((prev) => prev.map((d) => {
      if (!movedIds.includes(d.id)) return d;
      if (d.type === 'attendance') {
        if (toColumn === 'NOT_TAKEN') {
          return { ...d, column: 'NOT_TAKEN', status: 'NOT_TAKEN', rawId: null, notes: null, id: `att-pending-${d.userId}` };
        }
        return { ...d, column: toColumn, status: toColumn, id: d.id };
      }
      return { ...d, column: toColumn, status: toColumn };
    }));

    const fromLabel = t(`operations_board_lane_${fromColumn.toLowerCase()}`) || fromColumn;
    const toLabel = t(`operations_board_lane_${toColumn.toLowerCase()}`) || toColumn;
    showActionBanner({
      message: t('operations_board_bulk_moved', { count: movedIds.length, from: fromLabel, to: toLabel }),
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
      },
    });
  }, [data, t, roleContext, showActionBanner, clearActionBanner, loadData]);

  const handleConfirmWorkflowMove = useCallback(async () => {
    if (!pendingWorkflowMove) return;
    const { activeId, fromColumn, toColumn, item } = pendingWorkflowMove;
    setWorkflowMoveLoading(true);
    try {
      await applyWorkflowMove(activeId, fromColumn, toColumn, item);
    } finally {
      setWorkflowMoveLoading(false);
      setPendingWorkflowMove(null);
    }
  }, [pendingWorkflowMove, applyWorkflowMove]);

  const handleCancelWorkflowMove = useCallback(() => {
    setPendingWorkflowMove(null);
    loadData();
  }, [loadData]);

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
    setDrawerOpen(true);
  }, []);

  const handleCardUpdated = useCallback((cardId, patch) => {
    setData((prev) => prev.map((item) => (item.id === cardId ? { ...item, ...patch } : item)));
    setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, ...patch } : prev));
  }, []);

  const handleParticipationRefresh = useCallback(() => {
    setParticipationRefreshKey((k) => k + 1);
  }, []);

  const handleMarkTaken = useCallback(async (card) => {
    const result = await markWorkflowAsTaken(card.rawId);
    if (result.success) loadData();
    else setError(t('operations_board_drag_error'));
  }, [loadData, t]);

  const attendanceColumns = useMemo(
    () => getAttendanceColumnsForRole(roleContext),
    [roleContext]
  );
  const workflowColumns = useMemo(
    () => getWorkflowColumnsForRole(WORKFLOW_COLUMNS, roleContext),
    [roleContext]
  );
  const columns = lane === LANES.ATTENDANCE ? attendanceColumns : workflowColumns;
  const boardCollapseKey = lane === LANES.ATTENDANCE ? 'attendance' : 'workflow';
  const baseCollapsedSet = useMemo(
    () => collapsedSetForLane(boardCollapseKey),
    [collapsedSetForLane, boardCollapseKey],
  );
  const collapsedSet = baseCollapsedSet;

  // When collapse set changes, pin collapsed lanes and redistribute ALL expanded ones.
  const prevCollapsedSetRef = useRef(null);
  useEffect(() => {
    const columnIds = columns.map((c) => c.id);
    if (!columnIds.length) return;
    const width = measureBoardViewport();
    if (!width) return;
    const collapseChanged = prevCollapsedSetRef.current !== collapsedSet;
    prevCollapsedSetRef.current = collapsedSet;
    setLaneWidths((prev) => {
      const equal = computeEqualLaneWidths(columnIds, width, collapsedSet);
      const next = { ...prev };
      let changed = false;
      columnIds.forEach((id) => {
        if (collapsedSet.has(id)) {
          if (next[id] !== COLLAPSED_LANE_WIDTH) {
            next[id] = COLLAPSED_LANE_WIDTH;
            changed = true;
          }
        } else if (collapseChanged || prev[id] === COLLAPSED_LANE_WIDTH || !prev[id]) {
          if (next[id] !== equal[id]) {
            next[id] = equal[id];
            changed = true;
          }
        }
      });
      if (!changed) return prev;
      try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [collapsedSet, columns, measureBoardViewport]);

  // On first mount, if no lane widths are stored, compute equal distribution from the
  // actual container width and persist it so equal widths are the default.
  useEffect(() => {
    const columnIds = columns.map((c) => c.id);
    if (!columnIds.length || Object.keys(laneWidths).length > 0) return;
    const width = measureBoardViewport();
    if (!width) return;
    const defaults = computeEqualLaneWidths(columnIds, width, collapsedSet);
    setLaneWidths(defaults);
    try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(defaults)); } catch {}
  }, [columns, laneWidths, measureBoardViewport, collapsedSet]);

  const resolvedLaneWidths = useMemo(() => {
    const widths = { ...laneWidths };
    const columnIds = columns.map((c) => c.id);
    const hasMissing = columns.some((col) => !widths[col.id]);
    if (hasMissing) {
      const equal = computeEqualLaneWidths(columnIds, measureBoardViewport(), collapsedSet);
      columns.forEach((col) => {
        if (!widths[col.id]) widths[col.id] = equal[col.id] || DEFAULT_LANE_WIDTH;
      });
    }
    columnIds.forEach((id) => {
      if (collapsedSet.has(id)) widths[id] = COLLAPSED_LANE_WIDTH;
    });
    return widths;
  }, [columns, laneWidths, measureBoardViewport, collapsedSet]);

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

  const displayData = useMemo(
    () => sortBoardData(filterBoardData(data, filters.search, lang), sortBy, lang),
    [data, filters.search, lang, sortBy]
  );

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
    if (showLaneReset && view === VIEWS.KANBAN) {
      steps.push({ target: '[data-tour="operations-board-reset-lanes"]', content: t('tour.operations_board_reset_lanes'), disableBeacon: true, placement: 'bottom' });
    }
    setTourSteps(steps);
  }, [lang, t, panelTab, view, showLaneReset]);

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
      window.__joyrideActive = false;
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

      <div data-tour="operations-board-filter-bar">
        <BoardFilterBar
          filters={filters}
          onFilterChange={setFilters}
          welcomeContext={welcomeContext}
          panelTab={panelTab}
          onPanelTabChange={setPanelTab}
          onClassSessionClick={handleClassSessionClick}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          lane={lane}
          onLaneChange={(newLane) => {
            if (newLane !== LANES.ATTENDANCE) setPanelTab('board');
            updateParams((next) => {
              next.set('lane', newLane);
              if (newLane === LANES.ATTENDANCE) next.delete('workflowId');
            });
          }}
          onResetLaneWidths={() => resetLaneWidths(columns.map((c) => c.id), boardCollapseKey)}
          showLaneReset={panelTab === 'board' && view === VIEWS.KANBAN}
        />
      </div>

      {panelTab !== 'calendar' && (
      <div ref={boardViewportRef} className="operations-board-viewport flex-1 min-h-0 min-w-0 w-full" data-tour="operations-board-viewport">
        <div className="operations-board-content h-full">
        {loading ? (
          <div className="flex h-full min-h-[240px] items-center justify-center" data-testid="operations-board-loading">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm">{t('operations_board_loading')}</p>
            </div>
          </div>
        ) : view === VIEWS.TABLE ? (
          <BoardTableView data={displayData} columns={columns} onCardClick={handleCardClick} t={t} lang={lang} sortBy={sortBy} />
        ) : lane === LANES.ATTENDANCE ? (
          <AttendanceBoard
            data={displayData}
            columns={attendanceColumns}
            onDragEnd={handleDragEnd}
            onCardClick={handleCardClick}
            onDragRejected={() => setError(t('operations_board_drag_invalid'))}
            t={t}
            lang={lang}
            roleContext={roleContext}
            sortBy={sortBy}
            onLaneResize={startLaneResize}
            onLaneWidthsReset={() => resetLaneWidths(columns.map((c) => c.id), boardCollapseKey)}
            collapsedLanes={collapsedSet}
            onToggleLaneCollapse={(columnId) => toggleLaneCollapse(boardCollapseKey, columnId)}
            onBulkMove={handleBulkMove}
            participationRefreshKey={participationRefreshKey}
          />
        ) : (
          <WorkflowBoard
            data={displayData}
            columns={workflowColumns}
            onDragEnd={handleDragEnd}
            onCardClick={handleCardClick}
            onDragRejected={() => setError(t('operations_board_drag_invalid'))}
            canMoveToColumn={(from, to) => canMoveWorkflowToColumn(from, to, roleContext)}
            orderKey={workflowOrderKey}
            onLaneResize={startLaneResize}
            onLaneWidthsReset={() => resetLaneWidths(columns.map((c) => c.id), boardCollapseKey)}
            collapsedLanes={collapsedSet}
            onToggleLaneCollapse={(columnId) => toggleLaneCollapse(boardCollapseKey, columnId)}
            onBulkMove={handleBulkMove}
            t={t}
            fontScale={fontScale}
          />
        )}
        </div>
      </div>
      )}

      <BoardFooter
        columns={columns}
        lane={lane}
        view={view}
        onViewChange={setView}
        embedded={embedded}
        expanded={expanded}
        onToggleExpand={onToggleExpand}
        onOpenHistory={onOpenHistory}
        classInfo={data?.[0] ? {
          id: data[0].classId,
          nameEn: data[0].classNameEn || data[0].className,
          nameAr: data[0].classNameAr,
        } : null}
        date={filters.date}
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
        t={t}
      />

      {actionBanner && (
        <div className="operations-board-action-announcement" data-testid="operations-board-action-banner">
          <Announcement
            themed
            className="operations-board-action-announcement-pill bg-emerald-100 text-emerald-700 dark:bg-emerald-700 dark:text-emerald-100"
          >
            <AnnouncementTag className="bg-emerald-200/60 dark:bg-emerald-800/60">
              <CheckCircle2 size={16} className="shrink-0" />
            </AnnouncementTag>
            <AnnouncementTitle className="text-sm font-medium gap-1.5">
              {actionBanner.message}
              {actionBanner.onUndo && (
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 rounded-md text-xs font-semibold px-1.5 py-0.5 hover:bg-emerald-300/40 dark:hover:bg-emerald-900/40 transition-colors"
                  onClick={actionBanner.onUndo}
                  data-testid="operations-board-action-undo"
                >
                  <Undo2 size={14} />
                  {t('operations_board_undo') || 'Undo'}
                </button>
              )}
              <button
                type="button"
                className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-emerald-300/40 dark:hover:bg-emerald-900/40 transition-colors"
                onClick={clearActionBanner}
                aria-label={t('operations_board_dismiss') || 'Dismiss'}
              >
                <X size={14} />
              </button>
            </AnnouncementTitle>
          </Announcement>
        </div>
      )}

      <BoardStudentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        card={selectedCard}
        lane={lane}
        onRefresh={loadData}
        onCardUpdated={handleCardUpdated}
        onParticipationRefresh={handleParticipationRefresh}
        roleContext={roleContext}
      />
    </div>
  );
}
