import React, { useCallback, useEffect, useRef, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { pointerWithin } from '@dnd-kit/core';
import { useTheme } from '@contexts/ThemeContext';
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
import { isInstructorWorkflowLane, isInstructorOnly } from './workflowBoardRules.js';
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
      <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: 4, color: '#374151' }}>
        {t('attendance_summary') || 'Attendance Summary'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.color }} />
            <span style={{ fontSize: '0.7rem', color: '#374151' }}>{item.count} {item.label}</span>
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
  const labelColor = '#374151';
  const parts = parseWorkflowCardName(item.name).filter((part) => !isDateLike(part));
  const statusLabel = t(column.i18nKey) || column.name;
  const dateLabel = item.date
    ? format(parseISO(item.date.slice(0, 10)), 'dd/MM/yyyy')
    : null;
  const instructor = item.classInstructorName || item.assignee;

  return (
    <div style={{ maxWidth: 220, fontSize: '0.75rem', lineHeight: 1.45, color: labelColor }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: labelColor }}>{parts[0] || item.name}</div>
      {parts[1] && <div style={{ marginBottom: 2, color: labelColor }}>{parts[1]}</div>}
      {dateLabel && (
        <div style={{ marginBottom: 2, color: labelColor }}>
          {t('date') || 'Date'}: {dateLabel}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <WorkflowIcon size={12} style={{ color: column.color, flexShrink: 0 }} />
        <span style={{ color: column.color, fontWeight: 600 }}>{statusLabel}</span>
      </div>
      {instructor && (
        <div style={{ marginBottom: 2, color: labelColor }}>
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

const TOOLTIP_LABEL_COLOR = '#374151';

function WorkflowHoverTooltip({ title, children }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)';

  if (!title) return children;

  return (
    <Tooltip
      title={title}
      placement="top"
      arrow
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: bg,
            color: TOOLTIP_LABEL_COLOR,
            fontWeight: 500,
            fontSize: '11px',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            maxWidth: 280,
            p: 1,
          },
        },
        arrow: {
          sx: {
            color: bg,
            '&::before': {
              border: '1px solid rgba(148, 163, 184, 0.35)',
            },
          },
        },
      }}
    >
      {children}
    </Tooltip>
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
  roleContext = {},
  t,
  fontScale = 100,
}) {
  const [boardData, setBoardData] = useState(() => applyStoredOrder(data, orderKey));
  const dragOriginRef = useRef(null);
  const dragOriginColorRef = useRef(null);
  const [dragOriginColor, setDragOriginColor] = useState(null);
  const [draggingFromColumn, setDraggingFromColumn] = useState(null);
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
    setDraggingFromColumn(item?.column || null);
    const originCol = columns.find((c) => c.id === item?.column);
    const color = originCol?.color || null;
    dragOriginColorRef.current = color;
    setDragOriginColor(color);
    console.warn('[WorkflowBoard][drag START]', {
      cardId: item?.id,
      fromColumn: item?.column,
      title: item?.title || item?.name,
      validTargets: columns
        .filter((c) => c.id !== item?.column && canMoveToColumn?.(item?.column, c.id))
        .map((c) => c.id),
      roleContext: {
        isAdmin: !!roleContext?.isAdmin,
        isInstructor: !!roleContext?.isInstructor,
        isHR: !!roleContext?.isHR,
        isSuperAdmin: !!roleContext?.isSuperAdmin,
      },
    });
  }, [boardData, columns, roleContext, canMoveToColumn]);

  const handleDragEnd = useCallback(
    (event) => {
      draggingRef.current = false;
      const fromColumn = dragOriginRef.current;
      dragOriginRef.current = null;
      dragOriginColorRef.current = null;
      setDragOriginColor(null);
      setDraggingFromColumn(null);

      const { active, over } = event;
      if (!over || !active) {
        console.warn('[WorkflowBoard][drag END] no over/active — cancelled', { fromColumn });
        setBoardData(applyStoredOrder(data, orderKey));
        return;
      }

      // Prefer explicit drop target; if over is the card itself (empty lane / closestCenter),
      // use the optimistic column from drag-over so DRAFT→TAKEN still completes.
      let toColumn = resolveDropColumn(over, columns, boardData);
      if ((!toColumn || toColumn === fromColumn) && active.id === over.id) {
        const optimisticColumn = boardData.find((i) => i.id === active.id)?.column;
        if (optimisticColumn && optimisticColumn !== fromColumn) {
          toColumn = optimisticColumn;
        }
      }

      if (!fromColumn || !toColumn) {
        console.warn('[WorkflowBoard][drag END] unresolved column', { fromColumn, toColumn, overId: over.id });
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
        console.warn('[WorkflowBoard][drag REJECTED]', {
          fromColumn,
          toColumn,
          allowed: false,
        });
        onDragRejected?.(toColumn);
        setBoardData(applyStoredOrder(data, orderKey));
        return;
      }

      console.warn('[WorkflowBoard][drag DROP]', {
        fromColumn,
        toColumn,
        allowed: true,
        cardId: active.id,
      });

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
    console.warn('[WorkflowBoard][drag CANCELLED]', { fromColumn: draggingFromColumn });
    draggingRef.current = false;
    dragOriginRef.current = null;
    dragOriginColorRef.current = null;
    setDragOriginColor(null);
    setDraggingFromColumn(null);
    setBoardData(applyStoredOrder(data, orderKey));
  }, [data, orderKey, draggingFromColumn]);

  return (
    <KanbanProvider
      columns={columns}
      data={boardData}
      onDataChange={setBoardData}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
      className="operations-board-kanban"
    >
      {(column) => {
        const collapsed = collapsedLanes.has(column.id);
        const laneCount = boardData.filter((d) => d.column === column.id).length;
        const isAdminActingOnInstructorArea = roleContext.isAdmin
          && !roleContext.isSuperAdmin
          && !isInstructorOnly(roleContext);
        let laneClass;
        if (draggingFromColumn && isAdminActingOnInstructorArea && isInstructorWorkflowLane(draggingFromColumn)) {
          const canDrop = draggingFromColumn !== column.id && canMoveToColumn?.(draggingFromColumn, column.id);
          laneClass = canDrop ? 'operations-board-lane-override' : 'operations-board-lane-readonly';
        } else if (isAdminActingOnInstructorArea && isInstructorWorkflowLane(column.id) && !draggingFromColumn) {
          laneClass = 'operations-board-lane-readonly';
        } else if (draggingFromColumn) {
          const canDrop = draggingFromColumn !== column.id && canMoveToColumn?.(draggingFromColumn, column.id);
          laneClass = canDrop ? 'operations-board-lane-override' : 'operations-board-lane-readonly';
        } else {
          const isPermitted = columns.some((c) => c.id !== column.id && canMoveToColumn?.(c.id, column.id));
          laneClass = isPermitted ? 'operations-board-lane-permitted' : 'operations-board-lane-readonly';
        }
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
                      className="operations-board-card-collapsed operations-workflow-card"
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
                    className="operations-workflow-card p-2"
                  >
                    <div
                      className="flex items-center justify-between gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick(item);
                      }}
                    >
                      <WorkflowHoverTooltip
                        title={<WorkflowCardHoverTooltip item={item} column={column} summary={summary} t={t} />}
                      >
                        {cardBody}
                      </WorkflowHoverTooltip>
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
