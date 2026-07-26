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
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import BoardLaneHeader from './BoardLaneHeader.jsx';
import {
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';
import { canMoveAttendanceToColumn } from './attendanceBoardRules.js';
import {
  isHROnlyViewer,
  mapAttendanceBoardDataForHR,
  maskAttendanceColumnForHR,
  maskAttendanceStatsForHR,
} from './hrAttendancePrivacy.js';
import { fetchAttendanceStats, ATTENDANCE_COLUMNS, ATTENDANCE_BOARD_LANES } from '@services/business/operationsBoardService.js';
import { getParticipationsByClassAndDate } from '@services/business/participationService.js';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import { ATTENDANCE_BOARD_COLORS, BOARD_PARTICIPATION_COLOR } from '@constants/workspaceStatusColors';

const CARD_ORDER_KEY = 'operations_board_card_order';

function scalePx(base, fontScale = 100) {
  return Math.max(6, Math.round(base * (fontScale / 100)));
}

function BoardStatusDot({ column, fontScale = 100 }) {
  const color = ATTENDANCE_BOARD_COLORS[column] || '#6b7280';
  const dotSize = scalePx(8, fontScale);
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${column === ATTENDANCE_BOARD_LANES.NOT_TAKEN ? gridStyles.legendDotPulse : ''}`}
      style={{ backgroundColor: color, '--dot-color': color, width: dotSize, height: dotSize }}
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

function getItemOrderId(item) {
  return item.userId || item.id;
}

function getStoredIndex(stored, column, item) {
  const colOrder = stored?.[column];
  if (!Array.isArray(colOrder)) return -1;
  const stableId = getItemOrderId(item);
  let idx = colOrder.indexOf(stableId);
  if (idx === -1) idx = colOrder.indexOf(item.id);
  return idx;
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
    const aOrder = getStoredIndex(stored, a.column, a);
    const bOrder = getStoredIndex(stored, b.column, b);
    const aKnown = aOrder !== -1;
    const bKnown = bOrder !== -1;
    if (!aKnown && !bKnown) return 0;
    if (!aKnown) return 1;
    if (!bKnown) return -1;
    return aOrder - bOrder;
  });
}

function resolveDropColumn(over, columns, data) {
  if (!over) return null;
  const overItem = data.find((item) => item.id === over.id);
  if (overItem) return overItem.column;
  return columns.find((col) => col.id === over.id)?.id || null;
}

function AttendanceCardHoverTooltip({ item, stats, participationCount, t, lang, roleContext = {} }) {
  const studentName = resolveBoardStudentName(item, lang);
  const displayColumn = maskAttendanceColumnForHR(item.column, roleContext);
  const statusCol = ATTENDANCE_COLUMNS.find((c) => c.id === displayColumn);
  const statusLabel = statusCol ? (t(statusCol.i18nKey) || statusCol.name) : displayColumn;
  const statusColor = statusCol?.color || ATTENDANCE_BOARD_COLORS.NOT_TAKEN;
  const maskedStats = maskAttendanceStatsForHR(stats, roleContext);
  const hidePrivacy = isHROnlyViewer(roleContext);
  const isInstructorOnly = roleContext?.isInstructor && !roleContext?.isAdmin && !roleContext?.isHR && !roleContext?.isSuperAdmin;
  const labelColor = '#64748b';
  const nameColor = '#1e293b';

  return (
    <div style={{ maxWidth: 220, fontSize: '0.75rem', lineHeight: 1.45, color: labelColor }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <BoardStudentAvatar
          name={studentName}
          profileImageUrl={item.profileImageUrl}
          size="md"
          borderColor={statusColor}
        />
        <div style={{ fontWeight: 700, color: nameColor }}>{studentName}</div>
      </div>
      {item.studentNumber && (
        <div style={{ marginBottom: 2 }}>
          <span>{t('operations_board_profile_student_number') || 'Student Number'}: </span>
          <span style={{ color: nameColor, fontWeight: 500 }}>{item.studentNumber}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
        />
        <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
      </div>
      {maskedStats && maskedStats.total > 0 && !isInstructorOnly && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 600, fontSize: '0.7rem', marginBottom: 3 }}>
            {t('attendance_summary') || 'Attendance Summary'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {[
              { label: t('present') || 'Present', count: maskedStats.present, color: ATTENDANCE_BOARD_COLORS.PRESENT },
              ...(!hidePrivacy ? [{ label: t('late') || 'Late', count: maskedStats.late, color: ATTENDANCE_BOARD_COLORS.LATE }] : []),
              { label: t('absent') || 'Absent', count: maskedStats.absent, color: ATTENDANCE_BOARD_COLORS.ABSENT },
            ].filter((row) => row.count > 0).map((row) => (
              <span key={row.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: row.color, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: row.color }} />
                {row.count} {row.label}
              </span>
            ))}
            <span style={{ color: '#000000', fontWeight: 500 }}>/ {maskedStats.total}</span>
          </div>
        </div>
      )}
      {!hidePrivacy && (item.notes || participationCount > 0) && (
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(148,163,184,0.35)' }}>
          {item.notes && (
            <div style={{ marginBottom: 2 }}>
              {t('operations_board_has_note') || 'Has a note'}
            </div>
          )}
          {participationCount > 0 && (
            <div style={{ color: BOARD_PARTICIPATION_COLOR, fontWeight: 600 }}>
              {participationCount} {t('operations_board_participation') || 'Participation'}
              {participationCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  participationRefreshKey = 0,
  fontScale = 100,
  showAvatars = true,
}) {
  const isRTL = lang === 'ar';
  const hrViewer = isHROnlyViewer(roleContext);
  const isInstructorOnly = roleContext?.isInstructor && !roleContext?.isAdmin && !roleContext?.isHR && !roleContext?.isSuperAdmin;
  const sourceData = hrViewer ? mapAttendanceBoardDataForHR(data, roleContext) : data;

  const [boardData, setBoardData] = useState(() => {
    const classId = sourceData[0]?.classId;
    const date = sourceData[0]?.date;
    return sortDataForBoard(sourceData, sortBy, classId, date, lang);
  });
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [participationMap, setParticipationMap] = useState({});
  const dragOriginRef = useRef(null);
  const draggingRef = useRef(false);

  const classId = sourceData[0]?.classId;
  const date = sourceData[0]?.date;

  useEffect(() => {
    if (!draggingRef.current) {
      const next = sortDataForBoard(sourceData, sortBy, classId, date, lang);
      setBoardData(next);
    }
  }, [sourceData, classId, date, sortBy, lang]);

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
  }, [classId, date, participationRefreshKey]);

  useEffect(() => {
    if (!classId || isInstructorOnly) { setAttendanceStats(null); return; }
    let cancelled = false;
    fetchAttendanceStats(classId).then((result) => {
      if (!cancelled && result.success) {
        setAttendanceStats(result.data);
      }
    });
    return () => { cancelled = true; };
  }, [classId, isInstructorOnly]);

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
      orderMap[col.id] = items.filter((d) => d.column === col.id).map((d) => getItemOrderId(d));
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
      setBoardData((prev) => {
        if (sortBy === 'system') persistCardOrder(prev);
        return sortDataForBoard(prev, sortBy, classId, date, lang);
      });
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
      return sortDataForBoard(next, sortBy, classId, date, lang);
    });
    onDragEnd?.(active.id, fromColumn, toColumn);
  }, [boardData, columns, data, classId, date, lang, sortBy, onDragEnd, onDragRejected, roleContext, persistCardOrder]);

  const handleDragCancel = useCallback(() => {
    draggingRef.current = false;
    dragOriginRef.current = null;
    setBoardData(sortDataForBoard(data, sortBy, classId, date, lang));
  }, [data, sortBy, classId, date, lang]);

  const handleQuickAdvance = useCallback((item, e) => {
    e.stopPropagation();
    const colIds = columns.map((c) => c.id);
    const currentIdx = colIds.indexOf(item.column);
    const nextIdx = currentIdx + 1;
    if (nextIdx >= colIds.length) return;
    const toColumn = colIds[nextIdx];
    if (!canMoveAttendanceToColumn(toColumn, roleContext)) return;
    setBoardData((prev) => {
      const next = prev.map((d) => (d.id === item.id ? { ...d, column: toColumn } : d));
      if (sortBy === 'system') persistCardOrder(next);
      return sortDataForBoard(next, sortBy, classId, date, lang);
    });
    onDragEnd?.(item.id, item.column, toColumn);
  }, [columns, roleContext, sortBy, persistCardOrder, onDragEnd, classId, date, lang]);

  const handleQuickRevert = useCallback((item, e) => {
    e.stopPropagation();
    const colIds = columns.map((c) => c.id);
    const currentIdx = colIds.indexOf(item.column);
    const prevIdx = currentIdx - 1;
    if (prevIdx < 0) return;
    const toColumn = colIds[prevIdx];
    if (!canMoveAttendanceToColumn(toColumn, roleContext)) return;
    setBoardData((prev) => {
      const next = prev.map((d) => (d.id === item.id ? { ...d, column: toColumn } : d));
      if (sortBy === 'system') persistCardOrder(next);
      return sortDataForBoard(next, sortBy, classId, date, lang);
    });
    onDragEnd?.(item.id, item.column, toColumn);
  }, [columns, roleContext, sortBy, persistCardOrder, onDragEnd, classId, date, lang]);

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
        const isPermitted = canMoveAttendanceToColumn(column.id, roleContext);
        const laneClass = isPermitted ? 'operations-board-lane-permitted' : 'operations-board-lane-readonly';
        return (
        <KanbanBoard
          id={column.id}
          key={column.id}
          data-testid={`operations-board-column-${column.id}`}
          className={`operations-board-lane ${laneClass}${collapsed ? ' operations-board-lane-collapsed' : ''}`}
          style={{
            '--lane-color': column.color || ATTENDANCE_BOARD_COLORS.NOT_TAKEN,
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {!collapsed && onLaneResize && (
            <ColoredTooltip title={t('operations_board_resize_lane') || 'Drag to resize lane'} placement="top" color={column.color || ATTENDANCE_BOARD_COLORS.NOT_TAKEN}>
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
            pulse
            onBulkMove={onBulkMove}
            columns={columns}
            canMoveTo={(from, to) => canMoveAttendanceToColumn(to, roleContext)}
            fontScale={fontScale}
          />
          <KanbanCards id={column.id} className={collapsed ? 'operations-board-lane-cards-collapsed' : undefined}>
            {(item) => {
              const studentName = resolveBoardStudentName(item, lang);
              const stats = maskAttendanceStatsForHR(attendanceStats?.students?.[String(item.userId)], roleContext);
              const participationCount = hrViewer ? 0 : (participationMap[String(item.userId)]?.length || 0);
              const displayColumn = maskAttendanceColumnForHR(item.column, roleContext);
              const statusColor = ATTENDANCE_BOARD_COLORS[displayColumn] || ATTENDANCE_BOARD_COLORS.NOT_TAKEN;
              if (collapsed) {
                const colIds = columns.map((c) => c.id);
                const currentIdx = colIds.indexOf(item.column);
                const canAdvance = currentIdx >= 0 && currentIdx < colIds.length - 1 && canMoveAttendanceToColumn(colIds[currentIdx + 1], roleContext);
                const canRevert = currentIdx > 0 && canMoveAttendanceToColumn(colIds[currentIdx - 1], roleContext);
                const quickBtnStyle = {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: scalePx(18, fontScale),
                  height: scalePx(18, fontScale),
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: statusColor,
                  borderRadius: 4,
                  padding: 0,
                };
                return (
                  <KanbanCard
                    column={column.id}
                    id={item.id}
                    key={item.id}
                    name={studentName}
                    className="operations-attendance-card operations-board-card-collapsed"
                    style={{ '--card-status-color': statusColor, direction: isRTL ? 'rtl' : 'ltr' }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="flex justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardClick(item);
                        }}
                      >
                        {showAvatars ? (
                          <BoardStudentAvatar
                            name={studentName}
                            profileImageUrl={item.profileImageUrl}
                            size="sm"
                            fontScale={fontScale}
                            borderColor={statusColor}
                          />
                        ) : (
                          <div
                            className="flex items-center justify-center rounded-full font-medium text-white"
                            style={{
                              width: scalePx(28, fontScale),
                              height: scalePx(28, fontScale),
                              fontSize: scalePx(10, fontScale),
                              backgroundColor: statusColor,
                            }}
                            aria-label={studentName}
                          >
                            {studentName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      {(canRevert || canAdvance) && (
                        <div className="flex items-center justify-center gap-0.5">
                          {canRevert && (
                            <button
                              type="button"
                              aria-label={t('operations_board_quick_revert') || 'Move to previous status'}
                              onClick={(e) => handleQuickRevert(item, e)}
                              style={quickBtnStyle}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              {isRTL ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
                            </button>
                          )}
                          {canAdvance && (
                            <button
                              type="button"
                              aria-label={t('operations_board_quick_advance') || 'Move to next status'}
                              onClick={(e) => handleQuickAdvance(item, e)}
                              style={quickBtnStyle}
                              onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              {isRTL ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </KanbanCard>
                );
              }
              const colIds = columns.map((c) => c.id);
              const currentIdx = colIds.indexOf(item.column);
              const canAdvance = currentIdx >= 0 && currentIdx < colIds.length - 1 && canMoveAttendanceToColumn(colIds[currentIdx + 1], roleContext);
              const canRevert = currentIdx > 0 && canMoveAttendanceToColumn(colIds[currentIdx - 1], roleContext);
              const quickMoveButtonStyle = {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: scalePx(22, fontScale),
                alignSelf: 'stretch',
                minHeight: scalePx(40, fontScale),
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: statusColor,
                flexShrink: 0,
                transition: 'background 0.15s',
              };
              return (
                <KanbanCard
                  column={column.id}
                  id={item.id}
                  key={item.id}
                  name={studentName}
                  className="operations-attendance-card cursor-default"
                  style={{ '--card-status-color': statusColor, direction: isRTL ? 'rtl' : 'ltr' }}
                >
                  <ColoredTooltip
                    title={(
                      <AttendanceCardHoverTooltip
                        item={{ ...item, column: displayColumn }}
                        stats={stats}
                        participationCount={participationCount}
                        t={t}
                        lang={lang}
                        roleContext={roleContext}
                      />
                    )}
                    color={statusColor}
                    placement="top"
                  >
                    <div
                      className="relative flex items-center gap-2.5 select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onCardClick(item);
                      }}
                    >
                      {(item.notes || participationCount > 0) && (
                        <div className="absolute -top-1 -right-1 flex gap-0.5 z-10">
                          {item.notes && (
                            <Star size={scalePx(8, fontScale)} fill="#ef4444" color="#ef4444" data-testid={`card-notes-star-${item.id}`} />
                          )}
                          {participationCount > 0 && (
                            <Star size={scalePx(8, fontScale)} fill={BOARD_PARTICIPATION_COLOR} color={BOARD_PARTICIPATION_COLOR} data-testid={`card-participation-star-${item.id}`} />
                          )}
                        </div>
                      )}
                      {canRevert && (
                        <button
                          aria-label={t('operations_board_quick_revert') || 'Move to previous status'}
                          onClick={(e) => handleQuickRevert(item, e)}
                          data-testid={`card-quick-revert-${item.id}`}
                          style={quickMoveButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>
                      )}
                      {showAvatars && (
                        <BoardStudentAvatar
                          name={studentName}
                          profileImageUrl={item.profileImageUrl}
                          size="md"
                          fontScale={fontScale}
                          borderColor={statusColor}
                        />
                      )}
                      <div className="min-w-0 flex-1" style={{ paddingLeft: (showAvatars || canRevert) ? 0 : '0.75rem' }}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <BoardStatusDot column={displayColumn} fontScale={fontScale} />
                          <p className="m-0 truncate text-sm font-medium leading-tight" style={{ fontSize: scalePx(14, fontScale) }}>{studentName}</p>
                        </div>
                        {stats && !isInstructorOnly && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: scalePx(11, fontScale) }} data-testid={`attendance-summary-${item.id}`}>
                            {stats.total > 0 ? (
                              <>
                                <span className="inline-flex items-center gap-0.5">
                                  <span className="rounded-full shrink-0" style={{ backgroundColor: ATTENDANCE_BOARD_COLORS.PRESENT, width: scalePx(8, fontScale), height: scalePx(8, fontScale) }} />
                                  {stats.present}
                                </span>
                                {!hrViewer && stats.late > 0 && (
                                <span className="inline-flex items-center gap-0.5">
                                  <span className="rounded-full shrink-0" style={{ backgroundColor: ATTENDANCE_BOARD_COLORS.LATE, width: scalePx(8, fontScale), height: scalePx(8, fontScale) }} />
                                  {stats.late}
                                </span>
                                )}
                                <span className="inline-flex items-center gap-0.5">
                                  <span className="rounded-full shrink-0" style={{ backgroundColor: ATTENDANCE_BOARD_COLORS.ABSENT, width: scalePx(8, fontScale), height: scalePx(8, fontScale) }} />
                                  {stats.absent}
                                </span>
                                <span>/ {stats.total}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground/70 py-0.5" style={{ fontSize: scalePx(10, fontScale) }}>{t('operations_board_no_stats_yet') || 'No stats yet'}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {canAdvance && (
                        <button
                          aria-label={t('operations_board_quick_advance') || 'Move to next status'}
                          onClick={(e) => handleQuickAdvance(item, e)}
                          data-testid={`card-quick-advance-${item.id}`}
                          style={quickMoveButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${statusColor}1a`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
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
