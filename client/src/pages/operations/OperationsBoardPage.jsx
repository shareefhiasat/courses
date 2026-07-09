import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { error as logError } from '@services/utils/logger.js';
import { Card, CardContent } from '@/components/kibo/ui/card';
import { ScrollArea } from '@/components/kibo/ui/scroll-area';
import { Banner, BannerTitle } from '@/components/kibo-ui/banner';
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
import WorkflowBoard from '@components/operations-board/WorkflowBoard.jsx';
import AttendanceBoard from '@components/operations-board/AttendanceBoard.jsx';
import BoardListView from '@components/operations-board/BoardListView.jsx';
import BoardTableView from '@components/operations-board/BoardTableView.jsx';
import BoardFilterBar from '@components/operations-board/BoardFilterBar.jsx';
import BoardStudentDrawer from '@components/operations-board/BoardStudentDrawer.jsx';
import BoardFooter from '@components/operations-board/BoardFooter.jsx';
import { getAttendanceColumnsForRole, canMoveAttendanceToColumn } from '@components/operations-board/attendanceBoardRules.js';

const VIEWS = { KANBAN: 'kanban', LIST: 'list', TABLE: 'table' };
const LANES = { STATUS: 'status', ATTENDANCE: 'attendance' };

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

export default function OperationsBoardPage({
  embedded = false,
  expanded = false,
  onToggleExpand,
  welcomeContext = null,
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
  const [selectedCard, setSelectedCard] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);
  const [panelTab, setPanelTab] = useState('board');

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
  }, [updateParams]);

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
        setData((prev) => prev.map((d) => (d.id === activeId ? { ...d, column: toColumn, status: toColumn } : d)));
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
        await loadData();
      }
    }
  }, [data, t, loadData, roleContext]);

  const handleCardClick = useCallback((card) => {
    if (card.type === 'workflow' && lane === LANES.STATUS) {
      updateParams((next) => {
        next.set('lane', LANES.ATTENDANCE);
        next.set('workflowId', String(card.rawId));
        if (card.classId) next.set('classId', String(card.classId));
        if (card.date) next.set('date', new Date(card.date).toISOString().slice(0, 10));
      });
      return;
    }
    setSelectedCard(card);
    setDrawerOpen(true);
  }, [lane, updateParams]);

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

  const displayData = useMemo(
    () => filterBoardData(data, filters.search, lang),
    [data, filters.search, lang]
  );

  const pageClassName = [
    'operations-board-page',
    embedded ? 'operations-board-embedded' : '',
    expanded ? 'operations-board-expanded' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={pageClassName}
      style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
      data-testid="operations-board-page"
    >
      {bannerMessage && (
        <Banner className="rounded-lg bg-amber-600 text-white" data-testid="operations-board-banner">
          <BannerTitle>{bannerMessage}</BannerTitle>
        </Banner>
      )}

      <BoardFilterBar
        filters={filters}
        onFilterChange={setFilters}
        welcomeContext={welcomeContext}
        panelTab={panelTab}
        onPanelTabChange={setPanelTab}
        onClassSessionClick={handleClassSessionClick}
      />

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {panelTab !== 'calendar' && (
      <ScrollArea className="operations-board-content flex-1 min-h-0">
        {loading ? (
          <div className="flex h-full min-h-[240px] items-center justify-center" data-testid="operations-board-loading">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm">{t('operations_board_loading')}</p>
            </div>
          </div>
        ) : view === VIEWS.LIST ? (
          <BoardListView
            data={displayData}
            columns={columns}
            onCardClick={handleCardClick}
            onDragEnd={handleDragEnd}
          />
        ) : view === VIEWS.TABLE ? (
          <BoardTableView data={displayData} columns={columns} onCardClick={handleCardClick} t={t} lang={lang} />
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
          />
        ) : (
          <WorkflowBoard
            data={displayData}
            columns={WORKFLOW_COLUMNS}
            onDataChange={setData}
            onDragEnd={handleDragEnd}
            onCardClick={handleCardClick}
            onMarkTaken={handleMarkTaken}
            t={t}
          />
        )}
      </ScrollArea>
      )}

      <BoardFooter
        columns={columns}
        view={view}
        onViewChange={setView}
        embedded={embedded}
        expanded={expanded}
        onToggleExpand={onToggleExpand}
        showLegend={panelTab === 'board'}
      />

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
