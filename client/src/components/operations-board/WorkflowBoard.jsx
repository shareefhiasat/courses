import React, { useCallback, useEffect, useRef, useState } from 'react';
import { pointerWithin } from '@dnd-kit/core';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/kibo/ui/avatar';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { Workflow as WorkflowIcon, FilePenLine, GitBranch, GraduationCap, Lock } from 'lucide-react';
import { getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { format, parseISO } from 'date-fns';
import BoardLaneHeader from './BoardLaneHeader.jsx';
import { parseWorkflowCardName, resolveBoardClassName } from './operationsBoardDisplayUtils.js';
import { isInstructorWorkflowLane, isInstructorOnly } from './workflowBoardRules.js';
import { ATTENDANCE_BOARD_COLORS } from '@constants/workspaceStatusColors.js';
import AttendanceStatusDots from './AttendanceStatusDots.jsx';

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


function WorkflowCardTitle({ name, context, isAttendanceWorkflow, summaryItems, dotSize }) {
  const parts = parseWorkflowCardName(name).filter((part) => !isDateLike(part));
  const dateLabel = context?.date || null;

  const titleParts = isAttendanceWorkflow ? parts.slice(1) : parts;
  const showCircles = isAttendanceWorkflow && summaryItems?.length > 0;

  if (titleParts.length <= 1 && !dateLabel && !showCircles) {
    return <span className="truncate text-xs font-medium">{name}</span>;
  }
  return (
    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
      <div className="flex items-center gap-1 min-w-0">
        {showCircles && (
          <div className="flex items-center shrink-0">
            {summaryItems.map((s, i) => (
              <span
                key={i}
                className="inline-block rounded-full"
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: s.color,
                  marginLeft: i > 0 ? '-3px' : '0',
                }}
              />
            ))}
          </div>
        )}
        <span className="truncate text-[0.7rem] font-semibold leading-tight">{titleParts[0] || name}</span>
      </div>
      {titleParts[1] && (
        <span className="truncate text-[0.65rem] font-medium leading-tight text-muted-foreground">{titleParts[1]}</span>
      )}
      {dateLabel && !isAttendanceWorkflow && (
        <span className="truncate text-[0.55rem] leading-tight text-muted-foreground/70">
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

function WorkflowAssigneeAvatar({ assignee, assigneeLabel, role, image, size = 'sm', fontScale = 100 }) {
  if (!assignee) return null;
  const dim = scalePx(size === 'sm' ? 28 : 24, fontScale);
  const initials = getInitials(assignee);
  const roleIcon = role ? getUserRoleIcon(role) : null;
  const roleColor = role ? getUserRoleColor(role) : null;
  const title = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {roleIcon && (
        <span style={{ color: roleColor, display: 'inline-flex', alignItems: 'center' }}>
          {React.cloneElement(roleIcon, { size: 14, color: roleColor })}
        </span>
      )}
      <span>{assigneeLabel || assignee}</span>
    </span>
  );
  return (
    <ColoredTooltip title={title} color="#64748b" placement="top">
      <div
        className="shrink-0"
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Avatar
          style={{ width: dim, height: dim, boxShadow: '0 0 0 2px var(--card-status-color)' }}
        >
          {image && <AvatarImage src={image} alt={assignee} />}
          <AvatarFallback
            className="font-semibold"
            style={{ fontSize: scalePx(10, fontScale) }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {roleIcon && (
          <div
            aria-label={role}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: roleColor,
              color: '#fff',
              boxShadow: '0 0 0 1px #fff',
            }}
          >
            {React.cloneElement(roleIcon, { size: 10, color: '#fff', fill: roleColor })}
          </div>
        )}
      </div>
    </ColoredTooltip>
  );
}

function AttendanceCountsTooltip({ summary, t, textColor = '#111827' }) {
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <AttendanceStatusDots items={[item]} dotSize={10} className="shrink-0" />
            <span style={{ fontSize: '0.7rem', color: textColor }}>{item.count} {item.label}</span>
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

export function WorkflowCardHoverTooltip({ item, column, summary, t, lang = 'en' }) {
  const labelColor = '#111827';
  const isWeeklySummary = item.workflowType === 'ATTENDANCE_WEEKLY' || item.attendanceSubtype === 'WEEKLY_SUMMARY';
  const responsible = resolveDisplayLabel(item, t);
  const showInstructorIcon = Boolean(item.classInstructorName);
  const dateLabel = isWeeklySummary && item.dateFrom && item.dateTo
    ? `${format(parseISO(item.dateFrom), 'dd/MM/yyyy')} - ${format(parseISO(item.dateTo), 'dd/MM/yyyy')}`
    : item.date
    ? format(parseISO(item.date.slice(0, 10)), 'dd/MM/yyyy')
    : null;
  const courseName = resolveBoardClassName(item, lang);

  const sectionStyle = { paddingTop: 6, marginTop: 6, borderTop: '1px solid rgba(148,163,184,0.35)' };

  return (
    <div style={{ maxWidth: 220, fontSize: '0.75rem', lineHeight: 1.45, color: labelColor }}>
      <div style={{ fontWeight: 700, color: labelColor }}>{courseName}</div>
      {dateLabel && (
        <div style={{ marginBottom: 2, color: labelColor }}>{dateLabel}</div>
      )}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <WorkflowIcon size={12} style={{ color: column.color, flexShrink: 0 }} />
          <span style={{ color: column.color, fontWeight: 600 }}>{t(column.i18nKey) || column.name}</span>
        </div>
      </div>
      {responsible && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: labelColor }}>
            {showInstructorIcon ? (
              <GraduationCap size={12} style={{ color: '#0ea5e9' }} />
            ) : (
              getUserRoleIcon(item.assigneeRole) || <WorkflowIcon size={12} style={{ color: '#8b5cf6' }} />
            )}
            <span>{responsible}</span>
          </div>
        </div>
      )}
      {hasAttendanceCounts(summary) && (
        <div style={sectionStyle}>
          <AttendanceCountsTooltip summary={summary} t={t} textColor={labelColor} />
        </div>
      )}
    </div>
  );
}

function scalePx(base, fontScale = 100) {
  return Math.max(6, Math.round(base * fontScale / 100));
}

function resolveDisplayLabel(item, t) {
  if (item.classInstructorName) return item.classInstructorName;
  if (item.assigneeRole) {
    return (
      t(`role_label_${item.assigneeRole}`)
      || t(`roles.${item.assigneeRole}`)
      || t(`operations_board_role_${item.assigneeRole}`)
      || (item.assigneeRole.charAt(0).toUpperCase() + item.assigneeRole.slice(1))
    );
  }
  return item.assignee || null;
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
  onLaneAutoFit,
  disableLaneReset = false,
  collapsedLanes = new Set(),
  onToggleLaneCollapse,
  canMoveToColumn,
  onBulkMove,
  roleContext = {},
  isWorkflowLocked,
  t,
  lang = 'en',
  fontScale = 100,
  style,
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
      style={style}
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
            style={{ '--lane-color': column.color || '#8b5cf6', ...(collapsed ? { alignSelf: 'start', height: 'fit-content', minHeight: 0 } : {}) }}
          >
            {!collapsed && onLaneResize && (
              <ColoredTooltip
                title={disableLaneReset
                  ? (t('operations_board_resize_lane_drag_only') || 'Drag to resize lane.')
                  : (t('operations_board_resize_lane') || 'Drag to resize lane. Double-click to fit lane to content.')}
                placement="top"
                color={column.color || '#8b5cf6'}
              >
                <div
                  className="operations-board-lane-resize-handle"
                  role="separator"
                  aria-orientation="vertical"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onLaneResize(column.id, e);
                  }}
                  onDoubleClick={disableLaneReset ? undefined : (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onLaneAutoFit) {
                      onLaneAutoFit(column.id);
                    } else {
                      onLaneWidthsReset?.();
                    }
                  }}
                  data-testid={`operations-board-lane-resize-${column.id}`}
                />
              </ColoredTooltip>
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
            <KanbanCards id={column.id} className={collapsed ? 'operations-board-lane-cards-collapsed !p-1' : undefined}>
              {(item) => {
                const cardAssignee = resolveDisplayLabel(item, t);
                const isLocked = isWorkflowLocked?.(item) || false;
                const samePerson = item.submitterId && (item.classInstructorId || item.assigneeId)
                  && String(item.submitterId) === String(item.classInstructorId || item.assigneeId);
                const showSubmitter = Boolean(item.submitter) && !samePerson;
                if (collapsed) {
                  return (
                    <KanbanCard
                      column={column.id}
                      id={item.id}
                      key={item.id}
                      name={item.name}
                      className="operations-board-card-collapsed operations-workflow-card"
                      dragColor={dragOriginColor}
                      disabled={isLocked}
                      style={{ padding: '4px 14px' }}
                    >
                      <div
                        className="flex flex-col items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardClick(item);
                        }}
                      >
                        {showSubmitter && (
                          <WorkflowAssigneeAvatar assignee={item.submitter} role={item.submitterRole} image={item.submitterImage} size="sm" fontScale={fontScale} />
                        )}
                        {cardAssignee && (
                          <WorkflowAssigneeAvatar
                            assignee={cardAssignee}
                            role={item.assigneeRole}
                            image={item.assigneeImage}
                            size="sm"
                            fontScale={fontScale}
                          />
                        )}
                      </div>
                    </KanbanCard>
                  );
                }
                const dotSize = scalePx(11, fontScale);
                const wfIconSize = scalePx(18, fontScale);
                const summary = item.attendanceSummary;
                const isAttendanceWorkflow = item.workflowType === 'ATTENDANCE_DAILY'
                  || item.workflowType === 'ATTENDANCE_WEEKLY'
                  || item.attendanceSubtype === 'DAILY'
                  || item.attendanceSubtype === 'WEEKLY_SUMMARY';

                const titleText = isAttendanceWorkflow
                  ? resolveBoardClassName(item, lang)
                  : (parseWorkflowCardName(item.name).filter((part) => !isDateLike(part))[0] || item.name);

                return (
                  <KanbanCard
                    column={column.id}
                    id={item.id}
                    key={item.id}
                    name={item.name}
                    dragColor={dragOriginColor}
                    className="operations-workflow-card py-3 px-2"
                    style={{ '--card-status-color': column.color, marginBottom: '-4px', padding: '12px 14px' }}
                    disabled={isLocked}
                  >
                    <ColoredTooltip
                      title={<WorkflowCardHoverTooltip item={item} column={column} summary={summary} t={t} lang={lang} />}
                      color={column.color}
                    >
                    <div
                      className="flex flex-col gap-1 min-w-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick(item);
                      }}
                    >
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-white whitespace-nowrap border border-solid"
                            style={{ backgroundColor: column.color, borderColor: column.color }}
                          >
                            {column.label}
                          </span>
                          {(item.workflowType === 'ATTENDANCE_DAILY' || item.attendanceSubtype === 'DAILY') && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <FilePenLine size={scalePx(14, fontScale)} style={{ color: column.color }} />
                            </div>
                          )}
                          {isLocked && (
                            <ColoredTooltip title={t('operations_board_attendance_locked_weekly') || 'Attendance locked — weekly workflow in progress for this week.'} color="#dc2626" placement="top">
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Lock size={scalePx(14, fontScale)} color="#dc2626" />
                              </div>
                            </ColoredTooltip>
                          )}
                          {(item.workflowType === 'ATTENDANCE_WEEKLY' || item.attendanceSubtype === 'WEEKLY_SUMMARY') && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <GitBranch size={scalePx(14, fontScale)} style={{ color: column.color }} />
                            </div>
                          )}
                          {isAttendanceWorkflow && summary && (
                            <AttendanceStatusDots
                              summary={summary}
                              dotSize={dotSize}
                              className="shrink-0"
                              ariaLabel={t('attendance_summary') || 'Attendance summary'}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {showSubmitter && (
                            <WorkflowAssigneeAvatar
                              assignee={item.submitter}
                              role={item.submitterRole}
                              image={item.submitterImage}
                              fontScale={fontScale}
                            />
                          )}
                          {cardAssignee && (
                            <WorkflowAssigneeAvatar
                              assignee={cardAssignee}
                              role={item.assigneeRole}
                              image={item.assigneeImage}
                              fontScale={fontScale}
                            />
                          )}
                        </div>
                      </div>
                      <span className="truncate font-semibold leading-tight" style={{ fontSize: scalePx(11, fontScale) }}>
                        {titleText}
                      </span>
                    </div>
                    </ColoredTooltip>
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
