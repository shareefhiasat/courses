import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { Avatar, AvatarFallback } from '@/components/kibo/ui/avatar';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { FileText, Workflow as WorkflowIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import BoardLaneHeader from './BoardLaneHeader.jsx';
import { parseWorkflowCardName } from './operationsBoardDisplayUtils.js';
import { ATTENDANCE_BOARD_COLORS } from '@constants/workspaceStatusColors.js';

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

function isDateLike(value) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}\/\d{2}\/\d{4}$/.test(value);
}

function WorkflowCardTitle({ name, context }) {
  const parts = parseWorkflowCardName(name).filter((part) => !isDateLike(part));
  const dateLabel = context?.date || null;

  if (parts.length <= 1 && !dateLabel) {
    return <span className="truncate text-xs font-medium">{name}</span>;
  }
  return (
    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
      <span className="truncate text-[0.7rem] font-semibold leading-tight">{parts[0] || name}</span>
      {parts[1] && (
        <span className="truncate text-[0.65rem] font-medium leading-tight text-muted-foreground">{parts[1]}</span>
      )}
      {dateLabel && (
        <span className="truncate text-[0.6rem] leading-tight text-muted-foreground/70">
          {dateLabel}
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

function WorkflowAssigneeAvatar({ assignee, assigneeLabel, size = 'sm', fontScale = 100 }) {
  if (!assignee) return null;
  const dim = scalePx(size === 'sm' ? 28 : 24, fontScale);
  const initials = getInitials(assignee);
  return (
    <ColoredTooltip title={assigneeLabel || assignee} color="#64748b" placement="top">
      <Avatar
        className="shrink-0"
        style={{ width: dim, height: dim }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <AvatarFallback
          className="font-semibold"
          style={{ fontSize: scalePx(10, fontScale) }}
          title={assignee}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    </ColoredTooltip>
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
    { label: t('operations_board_lane_not_taken') || 'Not Taken', count: summary.notTaken, color: ATTENDANCE_BOARD_COLORS.NOT_TAKEN },
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

function hasAttendanceCounts(summary) {
  if (!summary) return false;
  return (summary.present + summary.late + summary.absent + summary.excused + summary.humanCase + summary.notTaken) > 0;
}

function WorkflowCardHoverTooltip({ item, column, summary, t }) {
  const parts = parseWorkflowCardName(item.name).filter((part) => !isDateLike(part));
  const statusLabel = t(column.i18nKey) || column.name;
  const dateLabel = item.date
    ? format(parseISO(item.date.slice(0, 10)), 'dd/MM/yyyy')
    : null;
  const instructor = item.classInstructorName || item.assignee;

  return (
    <div style={{ maxWidth: 220, fontSize: '0.75rem', lineHeight: 1.45 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{parts[0] || item.name}</div>
      {parts[1] && <div style={{ opacity: 0.9, marginBottom: 2 }}>{parts[1]}</div>}
      {dateLabel && (
        <div style={{ opacity: 0.85, marginBottom: 2 }}>
          {t('date') || 'Date'}: {dateLabel}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <WorkflowIcon size={12} style={{ color: column.color, flexShrink: 0 }} />
        <span style={{ color: column.color, fontWeight: 600 }}>{statusLabel}</span>
      </div>
      {instructor && (
        <div style={{ opacity: 0.85, marginBottom: 2 }}>
          {t('operations_board_class_instructor') || 'Class instructor'}: {instructor}
        </div>
      )}
      {hasAttendanceCounts(summary) && (
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.35)' }}>
          <AttendanceCountsTooltip summary={summary} t={t} />
        </div>
      )}
    </div>
  );
}

function scalePx(base, fontScale = 100) {
  return Math.max(6, Math.round(base * fontScale / 100));
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
  fontScale = 100,
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
        const isPermitted = columns.some((c) => c.id !== column.id && canMoveToColumn?.(c.id, column.id));
        const laneClass = isPermitted ? 'operations-board-lane-permitted' : 'operations-board-lane-readonly';
        return (
          <KanbanBoard
            id={column.id}
            key={column.id}
            data-testid={`operations-board-column-${column.id}`}
            className={`operations-board-lane ${laneClass}${collapsed ? ' operations-board-lane-collapsed' : ''}`}
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
              laneType="workflow"
              onBulkMove={onBulkMove}
              columns={columns}
              canMoveTo={canMoveToColumn}
              fontScale={fontScale}
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
                        <WorkflowAssigneeAvatar assignee={item.assignee || item.name} size="sm" fontScale={fontScale} />
                        {item.fileId && (
                          <FileText size={scalePx(12, fontScale)} className="text-blue-500" aria-hidden />
                        )}
                      </div>
                    </KanbanCard>
                  );
                }
                const dotSize = scalePx(6, fontScale);
                const wfIconSize = scalePx(18, fontScale);
                const pdfIconSize = scalePx(16, fontScale);
                const summary = item.attendanceSummary;
                const summaryItems = summary ? [
                  { count: summary.present, color: '#10b981' },
                  { count: summary.late, color: '#f59e0b' },
                  { count: summary.absent, color: '#ef4444' },
                  { count: summary.excused, color: '#ec4899' },
                ].filter((s) => s.count > 0) : [];

                const cardBody = (
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <WorkflowIcon size={wfIconSize} className="shrink-0" style={{ color: column.color }} aria-hidden />
                    {summaryItems.length > 0 && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {summaryItems.map((s, i) => (
                          <span
                            key={i}
                            className="inline-block rounded-full"
                            style={{ width: dotSize, height: dotSize, backgroundColor: s.color }}
                          />
                        ))}
                      </div>
                    )}
                    <WorkflowCardTitle name={item.name} context={{
                      date: item.date ? format(parseISO(item.date.slice(0, 10)), 'dd/MM/yyyy') : null,
                    }} />
                    {item.fileId && (
                      <ColoredTooltip
                        title={t('operations_board_preview_pdf') || 'Preview PDF'}
                        color="#3b82f6"
                        placement="top"
                      >
                        <FileText
                          size={pdfIconSize}
                          className="shrink-0 text-blue-500"
                          data-testid={`workflow-card-pdf-${item.id}`}
                        />
                      </ColoredTooltip>
                    )}
                  </div>
                );

                const assigneeTooltip = item.classInstructorName
                  ? `${t('operations_board_class_instructor') || 'Class instructor'}: ${item.classInstructorName}`
                  : item.assignee;

                return (
                  <KanbanCard
                    column={column.id}
                    id={item.id}
                    key={item.id}
                    name={item.name}
                    dragColor={dragOriginColor}
                    className="p-2"
                  >
                    <div
                      className="flex items-center justify-between gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick(item);
                      }}
                    >
                      <ColoredTooltip
                        title={<WorkflowCardHoverTooltip item={item} column={column} summary={summary} t={t} />}
                        color={column.color}
                        placement="top"
                      >
                        {cardBody}
                      </ColoredTooltip>
                      <WorkflowAssigneeAvatar
                        assignee={item.assignee}
                        assigneeLabel={assigneeTooltip}
                        fontScale={fontScale}
                      />
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
