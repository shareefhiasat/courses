import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import { error as logError } from '@services/utils/logger.js';
import { Button } from '@/components/kibo/ui/button';
import { Card, CardContent } from '@/components/kibo/ui/card';
import { Separator } from '@/components/kibo/ui/separator';
import { ScrollArea } from '@/components/kibo/ui/scroll-area';
import { ArrowLeft, KanbanSquare, List, Table2, Maximize2, Minimize2 } from 'lucide-react';
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
import BoardDetailDrawer from '@components/operations-board/BoardDetailDrawer.jsx';

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

/**
 * @param {object} props
 * @param {boolean} [props.embedded] - Render inside welcome tab (keeps app navbar)
 * @param {boolean} [props.expanded] - Full viewport below navbar
 * @param {() => void} [props.onToggleExpand]
 * @param {{ programId?: number, termId?: number, date?: Date|string, classIds?: number[] }} [props.welcomeContext]
 */
export default function OperationsBoardPage({
  embedded = false,
  expanded = false,
  onToggleExpand,
  welcomeContext = null,
}) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const lane = searchParams.get('lane') || (searchParams.get('mode') === 'attendance' ? LANES.ATTENDANCE : LANES.STATUS);
  const view = searchParams.get('view') || VIEWS.KANBAN;
  const workflowId = searchParams.get('workflowId');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);

  const updateParams = useCallback((updater) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (embedded) {
        next.set('tab', 'operations');
      }
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
      if (!next.get('lane')) next.set('lane', LANES.STATUS);
      if (!next.get('view')) next.set('view', VIEWS.KANBAN);
    });
  }, [welcomeContext, updateParams]);

  useEffect(() => {
    if (!welcomeContext?.date) return;
    const syncedDate = toIsoDate(welcomeContext.date);
    updateParams((next) => {
      if (next.get('date') !== syncedDate) {
        next.set('date', syncedDate);
      }
    });
  }, [welcomeContext?.date, updateParams]);

  const filters = useMemo(() => {
    const f = {};
    const date = searchParams.get('date') || toIsoDate(welcomeContext?.date) || todayIso();
    f.date = date;
    if (searchParams.get('classId')) f.classId = searchParams.get('classId');
    if (searchParams.get('programId')) f.programId = searchParams.get('programId');
    else if (welcomeContext?.programId) f.programId = String(welcomeContext.programId);
    if (searchParams.get('subjectId')) f.subjectId = searchParams.get('subjectId');
    if (searchParams.get('termId')) f.termId = searchParams.get('termId');
    else if (welcomeContext?.termId) f.termId = String(welcomeContext.termId);
    if (searchParams.get('status')) f.status = searchParams.get('status');
    if (searchParams.get('workflowType')) f.workflowType = searchParams.get('workflowType');
    if (searchParams.get('search')) f.search = searchParams.get('search');
    if (workflowId) f.workflowId = workflowId;
    if (welcomeContext?.classIds?.length) {
      f.classIds = welcomeContext.classIds.map((id) => parseInt(id, 10)).filter(Boolean);
    }
    return f;
  }, [searchParams, workflowId, welcomeContext]);

  const setFilters = useCallback((newFilters) => {
    updateParams((next) => {
      const keys = ['date', 'classId', 'programId', 'subjectId', 'termId', 'status', 'workflowType', 'search'];
      keys.forEach((k) => {
        if (newFilters[k]) next.set(k, newFilters[k]);
        else next.delete(k);
      });
    });
  }, [updateParams]);

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
        if (lane === LANES.STATUS && result.data.length === 0) {
          setBannerMessage(t('operations_board_no_workflows_banner'));
        } else {
          setBannerMessage(null);
        }
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

  const handleDataChange = useCallback((newData) => {
    setData(newData);
  }, []);

  const handleDragEnd = useCallback(async (activeId, fromColumn, toColumn) => {
    const item = data.find((d) => d.id === activeId);
    if (!item || fromColumn === toColumn) return;

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
        setError(t('operations_board_drag_error'));
        loadData();
      } else {
        loadData();
      }
    }
  }, [data, t, loadData]);

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

  const handleBackToWorkflow = useCallback(() => {
    updateParams((next) => {
      next.set('lane', LANES.STATUS);
      next.delete('workflowId');
    });
  }, [updateParams]);

  const handleMarkTaken = useCallback(async (card) => {
    const result = await markWorkflowAsTaken(card.rawId);
    if (result.success) loadData();
    else setError(t('operations_board_drag_error'));
  }, [loadData, t]);

  const columns = lane === LANES.ATTENDANCE ? ATTENDANCE_COLUMNS : WORKFLOW_COLUMNS;
  const activeFilterCount = Object.keys(filters).filter((k) => !['date', 'classIds'].includes(k) && filters[k]).length;

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

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {lane === LANES.ATTENDANCE && (
            <Button variant="ghost" size="sm" onClick={handleBackToWorkflow} data-testid="operations-board-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <KanbanSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground">{t('operations_board_title')}</h1>
            <p className="text-sm text-muted-foreground">
              {lane === LANES.ATTENDANCE ? t('operations_board_attendance') : t('operations_board_workflow')}
              {' · '}
              {data.length} {data.length === 1 ? 'item' : 'items'}
              {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: VIEWS.KANBAN, icon: KanbanSquare, label: t('operations_board_workflow') },
            { key: VIEWS.LIST, icon: List, label: t('operations_board_list') },
            { key: VIEWS.TABLE, icon: Table2, label: t('operations_board_table') || 'Table' },
          ].map((btn) => (
            <Button
              key={btn.key}
              variant={view === btn.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView(btn.key)}
              className="gap-2"
              data-testid={`operations-board-view-${btn.key}`}
            >
              <btn.icon className="h-4 w-4" />
              {btn.label}
            </Button>
          ))}
          {embedded && onToggleExpand && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExpand}
              className="gap-2"
              data-testid="operations-board-expand"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          {!embedded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/welcome?tab=operations')}
              data-testid="operations-board-exit"
            >
              {t('operations_board_exit') || 'Exit'}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <BoardFilterBar filters={filters} onFilterChange={setFilters} lane={lane} />

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="flex-1 min-h-0">
        {loading ? (
          <div className="flex h-full items-center justify-center" data-testid="operations-board-loading">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm">{t('operations_board_loading')}</p>
            </div>
          </div>
        ) : view === VIEWS.LIST ? (
          <BoardListView data={data} columns={columns} onCardClick={handleCardClick} />
        ) : view === VIEWS.TABLE ? (
          <BoardTableView data={data} columns={columns} onCardClick={handleCardClick} t={t} />
        ) : lane === LANES.ATTENDANCE ? (
          <AttendanceBoard
            data={data}
            columns={ATTENDANCE_COLUMNS}
            onDataChange={handleDataChange}
            onDragEnd={handleDragEnd}
            onCardClick={handleCardClick}
            t={t}
          />
        ) : (
          <WorkflowBoard
            data={data}
            columns={WORKFLOW_COLUMNS}
            onDataChange={handleDataChange}
            onDragEnd={handleDragEnd}
            onCardClick={handleCardClick}
            onMarkTaken={handleMarkTaken}
            t={t}
          />
        )}
      </ScrollArea>

      <BoardDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        card={selectedCard}
        lane={lane}
        onRefresh={loadData}
      />
    </div>
  );
}
