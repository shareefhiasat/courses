import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { error as logError, info as logInfo } from '@services/utils/logger.js';
import chatSocket from '@services/realtime/chatSocket.js';
import { Card, CardContent } from '@/components/kibo/ui/card';
import { ScrollArea } from '@/components/kibo/ui/scroll-area';
import { Banner, BannerTitle } from '@/components/kibo-ui/banner';
import { Announcement, AnnouncementTitle } from '@/components/kibo-ui/announcement';
import { Button } from '@/components/kibo/ui/button';
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
import { resolveBoardStudentName } from '@components/operations-board/operationsBoardDisplayUtils.js';

const VIEWS = { KANBAN: 'kanban', LIST: 'list', TABLE: 'table' };
const LANES = { STATUS: 'status', ATTENDANCE: 'attendance' };
const SORT_MODES = { SYSTEM: 'system', ALPHA: 'alpha', MILITARY_ID: 'military_id' };

const DEFAULT_LANE_WIDTH = 240;
const MIN_LANE_WIDTH = 140;
const MAX_LANE_WIDTH = 560;
const LANE_GAP = 16;

function loadStoredLaneWidths() {
  try {
    const raw = localStorage.getItem('operations_board_lane_widths');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function computeEqualLaneWidths(columnIds, containerWidth) {
  if (!columnIds?.length) return {};
  const n = columnIds.length;
  const totalGap = LANE_GAP * Math.max(0, n - 1);
  const available = Math.max(0, (containerWidth || 0) - totalGap);
  if (!available) {
    return Object.fromEntries(columnIds.map((id) => [id, DEFAULT_LANE_WIDTH]));
  }
  const each = Math.max(
    MIN_LANE_WIDTH,
    Math.min(MAX_LANE_WIDTH, Math.floor(available / n)),
  );
  return Object.fromEntries(columnIds.map((id) => [id, each]));
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
  const { isInstructor, isAdmin, isHR, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleContext = useMemo(() => ({
    isInstructor, isAdmin, isHR, isSuperAdmin,
  }), [isInstructor, isAdmin, isHR, isSuperAdmin]);

  const lane = searchParams.get('lane') || (searchParams.get('mode') === 'attendance' ? LANES.ATTENDANCE : LANES.STATUS);
  const view = searchParams.get('view') || VIEWS.KANBAN;
  const workflowId = searchParams.get('workflowId');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastLocalChangeRef = useRef(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);
  const [actionBanner, setActionBanner] = useState(null);
  const actionBannerTimerRef = useRef(null);
  const [panelTab, setPanelTab] = useState('board');
  const [laneWidths, setLaneWidths] = useState(loadStoredLaneWidths);
  const resizingLaneRef = useRef(null);
  const boardViewportRef = useRef(null);
  const [boardViewportWidth, setBoardViewportWidth] = useState(0);

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

  const resetLaneWidths = useCallback((columnIds) => {
    if (!columnIds?.length) return;
    const width = boardViewportWidth || measureBoardViewport();
    const defaults = computeEqualLaneWidths(columnIds, width);
    setLaneWidths(defaults);
    try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(defaults)); } catch {}
  }, [boardViewportWidth, measureBoardViewport]);

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
        setBannerMessage(lane === LANES.STATUS && result.data.length === 0
          ? t('operations_board_no_workflows_banner')
          : null);
      } else {
        setError(result.error || t('operations_board_error'));
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

  const handleDragEnd = useCallback(async (activeId, fromColumn, toColumn) => {
    const item = data.find((d) => d.id === activeId);
    if (!item || fromColumn === toColumn) return;

    if (item.type === 'attendance' && !canMoveAttendanceToColumn(toColumn, roleContext)) {
      setError(t('operations_board_drag_invalid'));
      loadData();
      return;
    }

    if (item.type === 'workflow') {
      const result = await moveWorkflowCard(item.rawId, fromColumn, toColumn);
      if (!result.success) {
        setError(t('operations_board_drag_error'));
        loadData();
      } else {
        lastLocalChangeRef.current = { id: item.rawId, time: Date.now() };
        setData((prev) => prev.map((d) => (d.id === activeId ? { ...d, column: toColumn, status: toColumn } : d)));
        const studentName = resolveBoardStudentName(item, lang);
        const statusLabel = t(`operations_board_lane_${toColumn.toLowerCase()}`) || toColumn;
        showActionBanner({
          message: t('operations_board_action_banner', { name: studentName, status: statusLabel }),
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
      }
    } else if (item.type === 'attendance') {
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
  }, [data, t, loadData, roleContext, lang, showActionBanner, clearActionBanner]);

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
    setDrawerOpen(true);
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
  const columns = lane === LANES.ATTENDANCE ? attendanceColumns : WORKFLOW_COLUMNS;

  // On first mount, if no lane widths are stored, compute equal distribution from the
  // actual container width and persist it so equal widths are the default.
  useEffect(() => {
    const columnIds = columns.map((c) => c.id);
    if (!columnIds.length || Object.keys(laneWidths).length > 0) return;
    const width = measureBoardViewport();
    if (!width) return;
    const defaults = computeEqualLaneWidths(columnIds, width);
    setLaneWidths(defaults);
    try { localStorage.setItem('operations_board_lane_widths', JSON.stringify(defaults)); } catch {}
  }, [columns, laneWidths, measureBoardViewport]);

  const resolvedLaneWidths = useMemo(() => {
    const widths = { ...laneWidths };
    const columnIds = columns.map((c) => c.id);
    const hasMissing = columns.some((col) => !widths[col.id]);
    if (hasMissing) {
      const equal = computeEqualLaneWidths(columnIds, measureBoardViewport());
      columns.forEach((col) => {
        if (!widths[col.id]) widths[col.id] = equal[col.id] || DEFAULT_LANE_WIDTH;
      });
    }
    return widths;
  }, [columns, laneWidths, measureBoardViewport]);

  const opsGridColumns = useMemo(
    () => columns.map((col) => `${resolvedLaneWidths[col.id]}px`).join(' '),
    [columns, resolvedLaneWidths],
  );

  const displayData = useMemo(
    () => sortBoardData(filterBoardData(data, filters.search, lang), sortBy, lang),
    [data, filters.search, lang, sortBy]
  );

  const workflowOrderKey = useMemo(() => {
    const parts = [filters.programId, filters.termId, workflowId].filter(Boolean);
    return parts.length ? parts.join('_') : 'default';
  }, [filters.programId, filters.termId, workflowId]);

  const pageClassName = [
    'operations-board-page',
    embedded ? 'operations-board-embedded' : '',
    expanded ? 'operations-board-expanded' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={pageClassName}
      style={{
        direction: lang === 'ar' ? 'rtl' : 'ltr',
        '--ops-font-scale': String(fontScale / 100),
        '--ops-grid-columns': opsGridColumns,
      }}
      data-testid="operations-board-page"
    >
      {bannerMessage && (
        <Banner className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" data-testid="operations-board-banner">
          <BannerTitle className="text-amber-600 dark:text-amber-400 font-medium text-sm px-2">{bannerMessage}</BannerTitle>
        </Banner>
      )}

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
        onResetLaneWidths={() => resetLaneWidths(columns.map((c) => c.id))}
        showLaneReset={panelTab === 'board' && view === VIEWS.KANBAN}
      />

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {panelTab !== 'calendar' && (
      <div ref={boardViewportRef} className="operations-board-viewport flex-1 min-h-0 min-w-0 w-full">
      <ScrollArea className="operations-board-content h-full">
        <div className="h-full min-h-0">
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
            onLaneWidthsReset={() => resetLaneWidths(columns.map((c) => c.id))}
          />
        ) : (
          <WorkflowBoard
            data={displayData}
            columns={WORKFLOW_COLUMNS}
            onDragEnd={handleDragEnd}
            onCardClick={handleCardClick}
            orderKey={workflowOrderKey}
            onLaneResize={startLaneResize}
            onLaneWidthsReset={() => resetLaneWidths(columns.map((c) => c.id))}
            t={t}
          />
        )}
        </div>
      </ScrollArea>
      </div>
      )}

      <BoardFooter
        columns={columns}
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

      {actionBanner && (
        <div className="operations-board-action-announcement" data-testid="operations-board-action-banner">
          <Announcement themed variant="outline" className="operations-board-action-announcement-pill">
            <AnnouncementTitle className="text-sm font-medium gap-2">
              {actionBanner.message}
              {actionBanner.onUndo && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-primary hover:bg-primary/10"
                  onClick={actionBanner.onUndo}
                  data-testid="operations-board-action-undo"
                >
                  {t('operations_board_undo')}
                </Button>
              )}
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
        roleContext={roleContext}
      />
    </div>
  );
}
