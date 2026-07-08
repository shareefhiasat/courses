import React, { useCallback } from 'react';
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
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';

const ATTENDANCE_STATUS_CLASS = {
  PRESENT: 'online',
  LATE: 'degraded',
  ABSENT: 'offline',
  EXCUSED: 'maintenance',
  HUMAN_CASE: 'degraded',
  NOT_TAKEN: 'offline',
};

export default function AttendanceBoard({
  data,
  columns,
  onDataChange,
  onDragEnd,
  onCardClick,
  t,
  lang = 'en',
}) {
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || !active) return;

      const activeItem = data.find((d) => d.id === active.id);
      if (!activeItem) return;

      const overColumn =
        columns.find((col) => col.id === over.id)?.id ||
        data.find((d) => d.id === over.id)?.column ||
        activeItem.column;

      if (activeItem.column !== overColumn) {
        onDragEnd(active.id, activeItem.column, overColumn);
      }
    },
    [data, columns, onDragEnd]
  );

  return (
    <KanbanProvider
      columns={columns}
      data={data}
      onDataChange={onDataChange}
      onDragEnd={handleDragEnd}
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
                {data.filter((d) => d.column === column.id).length}
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
                >
                  <div
                    className="flex items-start gap-3"
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
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <p className="m-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {t('operations_board_label_name')}
                      </p>
                      <p className="m-0 truncate font-medium text-sm leading-tight">{studentName}</p>
                      {className && (
                        <>
                          <p className="m-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {t('operations_board_label_class')}
                          </p>
                          <p className="m-0 truncate text-xs text-muted-foreground">{className}</p>
                        </>
                      )}
                      <Status status={ATTENDANCE_STATUS_CLASS[item.column] || 'offline'} className="w-fit">
                        <StatusIndicator />
                        <StatusLabel>{t(`operations_board_lane_${item.column.toLowerCase()}`) || item.column}</StatusLabel>
                      </Status>
                      {item.date && (
                        <p className="m-0 text-xs text-muted-foreground">
                          {formatBoardDate(item.date, lang)}
                        </p>
                      )}
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
