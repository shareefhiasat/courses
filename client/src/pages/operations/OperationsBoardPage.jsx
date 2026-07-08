import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { info, error as logError } from '@services/utils/logger.js';
import { Button } from '@/components/kibo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/kibo/ui/card';
import { Badge } from '@/components/kibo/ui/badge';
import { Separator } from '@/components/kibo/ui/separator';
import { ScrollArea } from '@/components/kibo/ui/scroll-area';
import { Search, Filter, LayoutGrid, List, KanbanSquare } from 'lucide-react';
import './OperationsBoardPage.css';
import {
  fetchWorkflowBoardData,
  fetchAttendanceBoardData,
  moveWorkflowCard,
  moveAttendanceCard,
  WORKFLOW_COLUMNS,
  ATTENDANCE_COLUMNS,
} from '@services/business/operationsBoardService.js';
import WorkflowBoard from '@components/operations-board/WorkflowBoard.jsx';
import AttendanceBoard from '@components/operations-board/AttendanceBoard.jsx';
import BoardListView from '@components/operations-board/BoardListView.jsx';
import BoardFilterBar from '@components/operations-board/BoardFilterBar.jsx';
import BoardDetailDrawer from '@components/operations-board/BoardDetailDrawer.jsx';

const MODES = {
  WORKFLOW: 'workflow',
  ATTENDANCE: 'attendance',
  LIST: 'list',
};

export default function OperationsBoardPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const mode = searchParams.get('mode') || MODES.WORKFLOW;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({});

  const setMode = useCallback((newMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('mode', newMode);
      return next;
    });
  }, [setSearchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (mode === MODES.ATTENDANCE) {
        result = await fetchAttendanceBoardData(filters);
      } else {
        result = await fetchWorkflowBoardData(filters);
      }
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || t('operations_board_error'));
      }
    } catch (err) {
      logError('OperationsBoardPage:loadData:error', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, filters, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDataChange = useCallback((newData) => {
    setData(newData);
  }, []);

  const handleDragEnd = useCallback(async (activeId, fromColumn, toColumn) => {
    const item = data.find((d) => d.id === activeId);
    if (!item) return;

    if (fromColumn === toColumn) return;

    if (item.type === 'workflow') {
      const result = await moveWorkflowCard(item.rawId, fromColumn, toColumn);
      if (!result.success) {
        setError(t('operations_board_drag_error'));
        loadData();
      }
    } else if (item.type === 'attendance') {
      const result = await moveAttendanceCard(item.rawId, toColumn);
      if (!result.success) {
        setError(t('operations_board_drag_error'));
        loadData();
      }
    }
  }, [data, t, loadData]);

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
    setDrawerOpen(true);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const columns = useMemo(() => {
    if (mode === MODES.ATTENDANCE) return ATTENDANCE_COLUMNS;
    return WORKFLOW_COLUMNS;
  }, [mode]);

  const modeButtons = [
    { key: MODES.WORKFLOW, label: t('operations_board_workflow'), icon: KanbanSquare },
    { key: MODES.ATTENDANCE, label: t('operations_board_attendance'), icon: LayoutGrid },
    { key: MODES.LIST, label: t('operations_board_list'), icon: List },
  ];

  const itemCount = data.length;
  const activeFilterCount = Object.keys(filters).filter((k) => filters[k]).length;

  return (
    <div
      className="operations-board-page"
      style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <KanbanSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {t('operations_board_title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
              {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {modeButtons.map((btn) => (
            <Button
              key={btn.key}
              variant={mode === btn.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode(btn.key)}
              className="gap-2"
            >
              <btn.icon className="h-4 w-4" />
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Filter Bar */}
      <BoardFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        mode={mode}
      />

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm">{t('operations_board_loading')}</p>
            </div>
          </div>
        ) : mode === MODES.LIST ? (
          <BoardListView
            data={data}
            columns={columns}
            onCardClick={handleCardClick}
          />
        ) : mode === MODES.ATTENDANCE ? (
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
            t={t}
          />
        )}
      </ScrollArea>

      {/* Detail Drawer */}
      <BoardDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        card={selectedCard}
        mode={mode}
      />
    </div>
  );
}
