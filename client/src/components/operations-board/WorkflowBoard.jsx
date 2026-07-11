import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { Avatar, AvatarFallback } from '@/components/kibo/ui/avatar';
import { FileText } from 'lucide-react';
import { Tooltip } from '@mui/material';
import BoardLaneHeader from './BoardLaneHeader.jsx';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { parseWorkflowCardName } from './operationsBoardDisplayUtils.js';

const CARD_ORDER_KEY = 'operations_board_workflow_card_order';

function getCardOrderKey(orderKey) {
  return `${CARD_ORDER_KEY}_${orderKey || 'default'}`;
}

function loadCardOrder(orderKey) {
  try {
    const raw = localStorage.getItem(getCardOrderKey(orderKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCardOrder(orderKey, orderMap) {
  try {
    localStorage.setItem(getCardOrderKey(orderKey), JSON.stringify(orderMap));
  } catch {}
}

function applyStoredOrder(data, orderKey) {
  const stored = loadCardOrder(orderKey);
  if (!stored) return data;
  return [...data].sort((a, b) => {
    const aOrder = stored[a.column]?.indexOf(a.id);
    const bOrder = stored[b.column]?.indexOf(b.id);
    if (aOrder == null && bOrder == null) return 0;
    if (aOrder == null) return 1;
    if (bOrder == null) return -1;
    return aOrder - bOrder;
  });
}

function resolveDropColumn(over, columns, data) {
  if (!over) return null;
  const overItem = data.find((item) => item.id === over.id);
  if (overItem) return overItem.column;
  return columns.find((col) => col.id === over.id)?.id || null;
}

function WorkflowCardTitle({ name }) {
  const parts = parseWorkflowCardName(name);
  if (parts.length <= 1) {
    return <span className="truncate text-xs font-medium">{name}</span>;
  }
  return (
    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
      <span className="truncate text-xs font-semibold leading-tight">{parts[0]}</span>
      {parts[1] && (
        <span className="truncate text-[0.7rem] font-medium leading-tight text-muted-foreground">{parts[1]}</span>
      )}
      {parts.slice(2).length > 0 && (
        <span className="truncate text-[0.65rem] leading-tight text-muted-foreground/80">
          {parts.slice(2).join(' - ')}
        </span>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function WorkflowAssigneeAvatar({ assignee, size = 'sm' }) {
  if (!assignee) return null;
  const sizeClass = size === 'sm' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <Avatar className={`${sizeClass} shrink-0`} onPointerDown={(e) => e.stopPropagation()}>
      <AvatarFallback className="text-[9px] font-medium">
        {getInitials(assignee)}
      </AvatarFallback>
    </Avatar>
  );
}

function AttendanceCountsTooltip({ summary, t }) {
  if (!summary) return null;
  const items = [
    { label: t('present') || 'Present', count: summary.present, color: '#10b981' },
    { label: t('late') || 'Late', count: summary.late, color: '#f59e0b' },
    { label: t('absent') || 'Absent', count: summary.absent, color: '#ef4444' },
    { label: t('excused') || 'Excused', count: summary.excused, color: '#ec4899' },
    { label: t('operations_board_lane_human_case') || 'Human Case', count: summary.humanCase, color: '#8b5cf6' },
    { label: t('operations_board_lane_not_taken') || 'Not Taken', count: summary.notTaken, color: '#f97316' },
  ].filter((item) => item.count > 0);
  if (items.length === 0) return null;
  return (
    <div style={{ maxWidth: 200 }}>
      <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: 4 }}>
        {t('attendance_summary') || 'Attendance Summary'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.color }} />
            <span style={{ fontSize: '0.7rem' }}>{item.count} {item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkflowBoard({
  data,
  columns,
  onDragEnd,
  onCardClick,
  onDragRejected,
  orderKey = 'default',
  onLaneResize,
  onLaneWidthsReset,
  collapsedLanes = new Set(),
  onToggleLaneCollapse,
  canMoveToColumn,
  onBulkMove,
  t,
}) {
  const [boardData, setBoardData] = useState(() => applyStoredOrder(data, orderKey));
  const dragOriginRef = useRef(null);
  const dragOriginColorRef = useRef(null);
  const [dragOriginColor, setDragOriginColor] = useState(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) {
      setBoardData(applyStoredOrder(data, orderKey));
    }
  }, [data, orderKey]);

  const persistCardOrder = useCallback((items) => {
    const orderMap = {};
    for (const col of columns) {
      orderMap[col.id] = items.filter((d) => d.column === col.id).map((d) => d.id);
    }
    saveCardOrder(orderKey, orderMap);
  }, [columns, orderKey]);

  const handleDragStart = useCallback((event) => {
    draggingRef.current = true;
    const item = boardData.find((d) => d.id === event.active.id);
    dragOriginRef.current = item?.column || null;
    const originCol = columns.find((c) => c.id === item?.column);
    const color = originCol?.color || null;
    dragOriginColorRef.current = color;
    setDragOriginColor(color);
  }, [boardData, columns]);

  const handleDragEnd = useCallback(
    (event) => {
      draggingRef.current = false;
      const fromColumn = dragOriginRef.current;
      dragOriginRef.current = null;
      dragOriginColorRef.current = null;
      setDragOriginColor(null);

      const { active, over } = event;
      if (!over || !active) {
        setBoardData(applyStoredOrder(data, orderKey));
        return;
      }

      const toColumn = resolveDropColumn(over, columns, boardData);
      if (!fromColumn || !toColumn) {
        setBoardData(applyStoredOrder(data, orderKey));
        return;
      }

      if (fromColumn === toColumn) {
        setBoardData((prev) => {
          persistCardOrder(prev);
          return prev;
        });
        return;
      }

      if (canMoveToColumn && !canMoveToColumn(fromColumn, toColumn)) {
        onDragRejected?.(toColumn);
        setBoardData(applyStoredOrder(data, orderKey));
        return;
      }

      setBoardData((prev) => {
        const next = prev.map((item) => (item.id === active.id ? { ...item, column: toColumn } : item));
        persistCardOrder(next);
        return next;
      });
      onDragEnd(active.id, fromColumn, toColumn);
    },
    [boardData, columns, data, onDragEnd, onDragRejected, canMoveToColumn, orderKey, persistCardOrder],
  );

  const handleDragCancel = useCallback(() => {
    draggingRef.current = false;
    dragOriginRef.current = null;
    dragOriginColorRef.current = null;
    setDragOriginColor(null);
    setBoardData(applyStoredOrder(data, orderKey));
  }, [data, orderKey]);

  return (
    <KanbanProvider
      columns={columns}
      data={boardData}
      onDataChange={setBoardData}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      className="operations-board-kanban"
    >
      {(column) => {
        const collapsed = collapsedLanes.has(column.id);
        const laneCount = boardData.filter((d) => d.column === column.id).length;
        return (
          <KanbanBoard
            id={column.id}
            key={column.id}
            data-testid={`operations-board-column-${column.id}`}
            className={`operations-board-lane${collapsed ? ' operations-board-lane-collapsed' : ''}`}
          >
            {!collapsed && onLaneResize && (
              <div
                className="operations-board-lane-resize-handle"
                role="separator"
                aria-orientation="vertical"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLaneResize(column.id, e);
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLaneWidthsReset?.();
                }}
                title={t('operations_board_resize_lane') || 'Drag to resize lane'}
                data-testid={`operations-board-lane-resize-${column.id}`}
              />
            )}
            <BoardLaneHeader
              column={column}
              count={laneCount}
              collapsed={collapsed}
              onToggleCollapse={onToggleLaneCollapse}
              t={t}
              onBulkMove={onBulkMove}
              columns={columns}
              canMoveTo={canMoveToColumn}
            />
            <KanbanCards id={column.id} className={collapsed ? 'operations-board-lane-cards-collapsed' : undefined}>
              {(item) => {
                if (collapsed) {
                  return (
                    <KanbanCard
                      column={column.id}
                      id={item.id}
                      key={item.id}
                      name={item.name}
                      className="operations-board-card-collapsed"
                      dragColor={dragOriginColor}
                    >
                      <div
                        className="flex flex-col items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardClick(item);
                        }}
                      >
                        <WorkflowAssigneeAvatar assignee={item.assignee || item.name} size="sm" />
                        {item.fileId && (
                          <FileText size={12} className="text-blue-500" aria-hidden />
                        )}
                      </div>
                    </KanbanCard>
                  );
                }
                const summary = item.attendanceSummary;
                const summaryItems = summary ? [
                  { count: summary.present, color: '#10b981' },
                  { count: summary.late, color: '#f59e0b' },
                  { count: summary.absent, color: '#ef4444' },
                  { count: summary.excused, color: '#ec4899' },
                ].filter((s) => s.count > 0) : [];

                return (
                  <KanbanCard
                    column={column.id}
                    id={item.id}
                    key={item.id}
                    name={item.name}
                    dragColor={dragOriginColor}
                  >
                    <div
                      className="flex items-center justify-between gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick(item);
                      }}
                    >
                      <Tooltip
                        title={summary ? <AttendanceCountsTooltip summary={summary} t={t} /> : ''}
                        placement="top"
                        arrow
                        disableInteractive
                        componentsProps={{
                          tooltip: { sx: { bgcolor: 'rgba(15,23,42,0.95)', fontSize: '0.75rem' } },
                          arrow: { sx: { color: 'rgba(15,23,42,0.95)' } },
                        }}
                      >
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {summaryItems.length > 0 && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              {summaryItems.map((s, i) => (
                                <span
                                  key={i}
                                  className="inline-block rounded-full"
                                  style={{ width: 6, height: 6, backgroundColor: s.color }}
                                />
                              ))}
                            </div>
                          )}
                          <WorkflowCardTitle name={item.name} />
                          {item.fileId && (
                            <ColoredTooltip
                              title={t('operations_board_preview_pdf') || 'Preview PDF'}
                              color="#3b82f6"
                              placement="top"
                            >
                              <FileText
                                size={12}
                                className="shrink-0 text-blue-500"
                                data-testid={`workflow-card-pdf-${item.id}`}
                              />
                            </ColoredTooltip>
                          )}
                        </div>
                      </Tooltip>
                      <WorkflowAssigneeAvatar assignee={item.assignee} />
                    </div>
                  </KanbanCard>
                );
              }}
            </KanbanCards>
          </KanbanBoard>
        );
      }}
    </KanbanProvider>
  );
}
