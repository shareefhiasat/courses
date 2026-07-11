import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { Star } from 'lucide-react';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import BoardLaneHeader from './BoardLaneHeader.jsx';
import {
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';
import { canMoveAttendanceToColumn } from './attendanceBoardRules.js';
import { fetchAttendanceStats } from '@services/business/operationsBoardService.js';
import { getParticipationsByClassAndDate } from '@services/business/participationService.js';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import { ATTENDANCE_BOARD_COLORS } from '@constants/workspaceStatusColors';

const CARD_ORDER_KEY = 'operations_board_card_order';

function BoardStatusDot({ column }) {
  const color = ATTENDANCE_BOARD_COLORS[column] || '#6b7280';
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${column === 'NOT_TAKEN' ? gridStyles.legendDotPulse : ''}`}
      style={{ backgroundColor: color, '--dot-color': color }}
      aria-hidden
    />
  );
}

function getCardOrderKey(classId, date) {
  return `${CARD_ORDER_KEY}_${classId}_${date}`;
}

function loadCardOrder(classId, date) {
  try {
    const raw = localStorage.getItem(getCardOrderKey(classId, date));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCardOrder(classId, date, orderMap) {
  try {
    localStorage.setItem(getCardOrderKey(classId, date), JSON.stringify(orderMap));
  } catch {}
}

function sortDataForBoard(data, sortBy, classId, date, lang) {
  if (sortBy === 'alpha') {
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
  return applyStoredOrder(data, classId, date);
}

function applyStoredOrder(data, classId, date) {
  const stored = loadCardOrder(classId, date);
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

export default function AttendanceBoard({
  data,
  columns,
  onDragEnd,
  onCardClick,
  onDragRejected,
  t,
  lang = 'en',
  roleContext = {},
  sortBy = 'system',
  onLaneResize,
  onLaneWidthsReset,
  collapsedLanes = new Set(),
  onToggleLaneCollapse,
  onBulkMove,
}) {
  const [boardData, setBoardData] = useState(() => {
    const classId = data[0]?.classId;
    const date = data[0]?.date;
    return sortDataForBoard(data, sortBy, classId, date, lang);
  });
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [participationMap, setParticipationMap] = useState({});
  const dragOriginRef = useRef(null);
  const draggingRef = useRef(false);

  const classId = data[0]?.classId;
  const date = data[0]?.date;

  useEffect(() => {
    if (!draggingRef.current) {
      setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
    }
  }, [data, classId, date, sortBy, lang]);

  useEffect(() => {
    if (!classId || !date) {
      setParticipationMap({});
      return;
    }
    let cancelled = false;
    getParticipationsByClassAndDate(classId, date).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        const map = {};
        for (const p of result.data) {
          const uid = String(p.userId);
          if (!map[uid]) map[uid] = [];
          map[uid].push(p);
        }
        setParticipationMap(map);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [classId, date]);

  useEffect(() => {
    if (!classId) { setAttendanceStats(null); return; }
    let cancelled = false;
    fetchAttendanceStats(classId).then((result) => {
      if (!cancelled && result.success) setAttendanceStats(result.data);
    });
    return () => { cancelled = true; };
  }, [classId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = useCallback((event) => {
    draggingRef.current = true;
    const item = boardData.find((d) => d.id === event.active.id);
    dragOriginRef.current = item?.column || null;
  }, [boardData]);

  const persistCardOrder = useCallback((items) => {
    const orderMap = {};
    for (const col of columns) {
      orderMap[col.id] = items.filter((d) => d.column === col.id).map((d) => d.id);
    }
    saveCardOrder(classId, date, orderMap);
  }, [columns, classId, date]);

  const handleDragEnd = useCallback((event) => {
    draggingRef.current = false;
    const fromColumn = dragOriginRef.current;
    dragOriginRef.current = null;

    const { active, over } = event;
    if (!over || !active) {
      setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
      return;
    }

    const toColumn = resolveDropColumn(over, columns, boardData);
    if (!fromColumn || !toColumn) {
      setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
      return;
    }

    if (fromColumn === toColumn) {
      if (sortBy === 'system') {
        setBoardData((prev) => {
          persistCardOrder(prev);
          return prev;
        });
      }
      return;
    }

    if (!canMoveAttendanceToColumn(toColumn, roleContext)) {
      onDragRejected?.(toColumn);
      setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
      return;
    }

    setBoardData((prev) => {
      const next = prev.map((item) => (item.id === active.id ? { ...item, column: toColumn } : item));
      if (sortBy === 'system') persistCardOrder(next);
      return next;
    });
    onDragEnd?.(active.id, fromColumn, toColumn);
  }, [boardData, columns, data, classId, date, lang, sortBy, onDragEnd, onDragRejected, roleContext, persistCardOrder]);

  const handleDragCancel = useCallback(() => {
    draggingRef.current = false;
    dragOriginRef.current = null;
    setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
  }, [data, sortBy, classId, date, lang]);

  return (
    <KanbanProvider
      columns={columns}
      data={boardData}
      onDataChange={setBoardData}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      sensors={sensors}
      collisionDetection={pointerWithin}
      className="operations-board-kanban operations-attendance-kanban"
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
            pulse={column.id === 'NOT_TAKEN'}
            onBulkMove={onBulkMove}
            columns={columns}
            canMoveTo={(from, to) => canMoveAttendanceToColumn(to, roleContext)}
          />
          <KanbanCards id={column.id} className={collapsed ? 'operations-board-lane-cards-collapsed' : undefined}>
            {(item) => {
              const studentName = resolveBoardStudentName(item, lang);
              if (collapsed) {
                return (
                  <KanbanCard
                    column={column.id}
                    id={item.id}
                    key={item.id}
                    name={studentName}
                    className="operations-attendance-card operations-board-card-collapsed"
                  >
                    <div
                      className="flex justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick(item);
                      }}
                    >
                      <BoardStudentAvatar
                        name={studentName}
                        profileImageUrl={item.profileImageUrl}
                        size="sm"
                      />
                    </div>
                  </KanbanCard>
                );
              }
              return (
                <KanbanCard
                  column={column.id}
                  id={item.id}
                  key={item.id}
                  name={studentName}
                  className="operations-attendance-card"
                >
                  <div
                    className="relative flex items-center gap-2.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick(item);
                    }}
                  >
                    {(item.notes || participationMap[String(item.userId)]?.length > 0) && (
                      <div className="absolute -top-1 -right-1 flex gap-0.5 z-10">
                        {item.notes && (
                          <ColoredTooltip title={t('operations_board_has_note') || 'Has a note'} color="#ef4444" placement="top">
                            <Star size={12} fill="#ef4444" color="#ef4444" data-testid={`card-notes-star-${item.id}`} />
                          </ColoredTooltip>
                        )}
                        {participationMap[String(item.userId)]?.length > 0 && (
                          <ColoredTooltip title={t('operations_board_has_participation') || 'Has participation'} color="#3b82f6" placement="top">
                            <Star size={12} fill="#3b82f6" color="#3b82f6" data-testid={`card-participation-star-${item.id}`} />
                          </ColoredTooltip>
                        )}
                      </div>
                    )}
                    <BoardStudentAvatar
                      name={studentName}
                      profileImageUrl={item.profileImageUrl}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BoardStatusDot column={item.column} />
                        <p className="m-0 truncate text-sm font-medium leading-tight">{studentName}</p>
                      </div>
                      {(() => {
                        const stats = attendanceStats?.students?.[String(item.userId)];
                        if (!stats || stats.total === 0) return null;
                        return (
                          <div className="mt-1 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground" data-testid={`attendance-summary-${item.id}`}>
                            <span className="inline-flex items-center gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                              {stats.present}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                              {stats.late}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                              {stats.absent}
                            </span>
                            <span>/ {stats.total}</span>
                          </div>
                        );
                      })()}
                    </div>
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
