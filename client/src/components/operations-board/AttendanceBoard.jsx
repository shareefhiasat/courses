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
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { Status, StatusIndicator, StatusLabel } from '@/components/kibo-ui/status';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  resolveBoardClassName,
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';
import { canMoveAttendanceToColumn } from './attendanceBoardRules.js';

const ATTENDANCE_STATUS_CLASS = {
  PRESENT: 'online',
  LATE: 'degraded',
  ABSENT: 'offline',
  EXCUSED: 'maintenance',
  HUMAN_CASE: 'degraded',
  NOT_TAKEN: 'offline',
};

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
}) {
  const [boardData, setBoardData] = useState(data);
  const dragOriginRef = useRef(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) {
      setBoardData(data);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = useCallback((event) => {
    draggingRef.current = true;
    const item = boardData.find((d) => d.id === event.active.id);
    dragOriginRef.current = item?.column || null;
  }, [boardData]);

  const handleDragEnd = useCallback((event) => {
    draggingRef.current = false;
    const fromColumn = dragOriginRef.current;
    dragOriginRef.current = null;

    const { active, over } = event;
    if (!over || !active) {
      setBoardData(data);
      return;
    }

    const toColumn = resolveDropColumn(over, columns, boardData);
    if (!fromColumn || !toColumn || fromColumn === toColumn) {
      setBoardData(data);
      return;
    }

    if (!canMoveAttendanceToColumn(toColumn, roleContext)) {
      onDragRejected?.(toColumn);
      setBoardData(data);
      return;
    }

    setBoardData((prev) =>
      prev.map((item) => (item.id === active.id ? { ...item, column: toColumn } : item))
    );
    onDragEnd?.(active.id, fromColumn, toColumn);
  }, [boardData, columns, data, onDragEnd, onDragRejected, roleContext]);

  const handleDragCancel = useCallback(() => {
    draggingRef.current = false;
    dragOriginRef.current = null;
    setBoardData(data);
  }, [data]);

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
      className="operations-attendance-kanban"
    >
      {(column) => (
        <KanbanBoard id={column.id} key={column.id} data-testid={`operations-board-column-${column.id}`}>
          <KanbanHeader>
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full ring-2 ring-background"
                style={{ backgroundColor: column.color }}
              />
              <span className="font-medium text-sm">{t(column.i18nKey) || column.name}</span>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {boardData.filter((d) => d.column === column.id).length}
              </span>
            </div>
          </KanbanHeader>
          <KanbanCards id={column.id}>
            {(item) => {
              const studentName = resolveBoardStudentName(item, lang);
              const className = resolveBoardClassName(item, lang);
              return (
                <KanbanCard
                  column={column.id}
                  id={item.id}
                  key={item.id}
                  name={studentName}
                  className="operations-attendance-card"
                >
                  <div
                    className="flex items-center gap-2.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick(item);
                    }}
                  >
                    <BoardStudentAvatar
                      name={studentName}
                      profileImageUrl={item.profileImageUrl}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-medium leading-tight">{studentName}</p>
                      {className && (
                        <p className="m-0 truncate text-xs text-muted-foreground">{className}</p>
                      )}
                      <Status status={ATTENDANCE_STATUS_CLASS[item.column] || 'offline'} className="mt-1 w-fit">
                        <StatusIndicator />
                        <StatusLabel>{t(`operations_board_lane_${item.column.toLowerCase()}`) || item.column}</StatusLabel>
                      </Status>
                    </div>
                  </div>
                </KanbanCard>
              );
            }}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
}
