import React, { useCallback } from 'react';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban';
import { Avatar, AvatarFallback } from '@/components/kibo/ui/avatar';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function AttendanceBoard({
  data,
  columns,
  onDataChange,
  onDragEnd,
  onCardClick,
  t,
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
        <KanbanBoard id={column.id} key={column.id}>
          <KanbanHeader>
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <span>{t(column.i18nKey) || column.name}</span>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {data.filter((d) => d.column === column.id).length}
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
                    {item.className && (
                      <p className="m-0 text-xs text-muted-foreground">
                        {item.className}
                      </p>
                    )}
                  </div>
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {item.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {item.date && (
                  <p className="m-0 text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(item.date))}
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
