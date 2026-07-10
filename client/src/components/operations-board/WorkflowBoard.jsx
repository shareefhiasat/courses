import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { Avatar, AvatarFallback } from '@/components/kibo/ui/avatar';

const CARD_ORDER_KEY = 'operations_board_workflow_card_order';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

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

export default function WorkflowBoard({
  data,
  columns,
  onDragEnd,
  onCardClick,
  orderKey = 'default',
  onLaneResize,
  onLaneWidthsReset,
  t,
}) {
  const [boardData, setBoardData] = useState(() => applyStoredOrder(data, orderKey));
  const dragOriginRef = useRef(null);
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
  }, [boardData]);

  const handleDragEnd = useCallback(
    (event) => {
      draggingRef.current = false;
      const fromColumn = dragOriginRef.current;
      dragOriginRef.current = null;

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

      setBoardData((prev) => {
        const next = prev.map((item) => (item.id === active.id ? { ...item, column: toColumn } : item));
        persistCardOrder(next);
        return next;
      });
      onDragEnd(active.id, fromColumn, toColumn);
    },
    [boardData, columns, data, onDragEnd, orderKey, persistCardOrder],
  );

  const handleDragCancel = useCallback(() => {
    draggingRef.current = false;
    dragOriginRef.current = null;
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
      {(column) => (
        <KanbanBoard id={column.id} key={column.id} data-testid={`operations-board-column-${column.id}`} className="operations-board-lane">
          {onLaneResize && (
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
          <KanbanHeader className="operations-board-lane-header">
            <div className="relative flex items-center justify-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <span className="text-center font-semibold text-base" style={{ color: column.color }}>
                {t(column.i18nKey) || column.name}
              </span>
              <span className="absolute end-1 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: column.color }}>
                {boardData.filter((d) => d.column === column.id).length}
              </span>
            </div>
          </KanbanHeader>
          <KanbanCards id={column.id}>
            {(item) => (
              <KanbanCard
                column={column.id}
                id={item.id}
                key={item.id}
                name={item.name}
              >
                <div
                  className="flex items-start justify-between gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardClick(item);
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <p className="m-0 flex-1 font-medium text-sm">
                      {item.name}
                    </p>
                    {item.date && (
                      <p className="m-0 text-xs text-muted-foreground">
                        {t('operations_board_card_date') || 'Date'}: {dateFormatter.format(new Date(item.date))}
                      </p>
                    )}
                    {item.workflowType && (
                      <p className="m-0 text-xs text-muted-foreground">
                        {item.workflowType}
                      </p>
                    )}
                  </div>
                  {item.assignee && (
                    <Avatar
                      className="h-5 w-5 shrink-0"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <AvatarFallback className="text-[10px]">
                        {item.assignee.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {item.createdAt && (
                  <p className="m-0 text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(item.createdAt))}
                  </p>
                )}
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
}
