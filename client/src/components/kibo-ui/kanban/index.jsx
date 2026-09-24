"use client";;
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import tunnel from "tunnel-rat";
import { Card } from "@/components/kibo/ui/card";
import { ScrollArea, ScrollBar } from "@/components/kibo/ui/scroll-area";
import { cn } from "@/lib/utils";

const t = tunnel();

const KanbanContext = createContext({
  columns: [],
  data: [],
  activeCardId: null,
});

export const KanbanBoard = ({
  id,
  children,
  className,
  style,
  ...props
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const isOpsLane = className?.includes?.('operations-board-lane');
  const laneColor = style?.['--lane-color'];

  return (
    <div
      className={cn(
        "flex size-full min-h-40 flex-col divide-y rounded-md border bg-transparent text-xs shadow-sm ring-2 transition-all",
        isOpsLane ? "overflow-visible" : "overflow-hidden",
        isOver ? "shadow-[0_0_12px_rgba(0,0,0,0.15)]" : "ring-transparent",
        className
      )}
      style={{
        ...style,
        ...(isOver && laneColor ? { '--tw-ring-color': laneColor } : {}),
        ...(isOpsLane && laneColor ? { '--tw-divide-color': `${laneColor}40` } : {}),
      }}
      ref={setNodeRef}
      {...props}>
      {children}
    </div>
  );
};

export const KanbanCard = (
  {
    id,
    name,
    children,
    className,
    dragColor,
    style: cardStyle,
    disabled = false,
    overlayStack = false,
    overlayBadge = null,
    ...cardProps
  }
) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });
  const { activeCardId } = useContext(KanbanContext);

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    marginRight: 3,
    marginLeft: 3,
  };

  const ringColor = dragColor || cardStyle?.['--card-status-color'] || '#6b7280';
  const glowColor = dragColor || cardStyle?.['--card-status-color'] || '#6b7280';

  const cardBorderStyle = {
    borderColor: ringColor,
    borderWidth: '2px',
  };

  const dragStyle = isDragging ? {
    '--tw-ring-color': `${ringColor}66`,
  } : undefined;

  const overlayStyle = {
    '--tw-ring-color': ringColor,
    borderColor: ringColor,
    borderWidth: '2px',
    padding: '0.75rem',
    boxShadow: `0 0 18px ${glowColor}99, 0 4px 12px rgba(0,0,0,0.15)`,
  };

  return (
    <>
      <div style={style} {...listeners} {...attributes} ref={setNodeRef}>
        <Card
          className={cn(
            "cursor-grab gap-4 rounded-md p-2 shadow-sm transition-shadow transition-[box-shadow,border-color]",
            isDragging && "pointer-events-none cursor-grabbing opacity-30",
            className
          )}
          style={{ ...cardBorderStyle, ...dragStyle, ...cardStyle }}
          {...cardProps}>
          {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
        </Card>
      </div>
      {activeCardId === id && (
        <t.In>
          <div style={{ position: 'relative' }}>
            {overlayStack && [22, 11].map((offset) => (
              <Card
                key={offset}
                aria-hidden
                className={cn("gap-4 rounded-md p-1 shadow-sm ring-2", className)}
                style={{
                  ...overlayStyle,
                  position: 'absolute',
                  inset: 0,
                  transform: `translateY(${-offset}px)`,
                  opacity: offset === 22 ? 0.55 : 0.8,
                  boxShadow: 'none',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
              </Card>
            ))}
            <Card
              className={cn(
                "cursor-grab gap-4 rounded-md p-1 shadow-sm animate-pulse ring-2",
                isDragging && "cursor-grabbing",
                className
              )}
              style={{ ...overlayStyle, position: 'relative' }}>
              {overlayBadge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -10,
                    insetInlineEnd: -10,
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                    padding: '0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: ringColor,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    zIndex: 1,
                  }}
                >
                  {overlayBadge}
                </span>
              )}
              {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
            </Card>
          </div>
        </t.In>
      )}
    </>
  );
};

export const KanbanCards = (
  {
    children,
    className,
    ...props
  }
) => {
  const { data } = useContext(KanbanContext);
  const filteredData = data.filter((item) => item.column === props.id);
  const items = filteredData.map((item) => item.id);

  return (
    <ScrollArea className="overflow-hidden">
      <SortableContext items={items}>
        <div className={cn("flex flex-grow flex-col gap-1.5 p-2", className)} {...props}>
          {filteredData.map(children)}
        </div>
      </SortableContext>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
};

export const KanbanHeader = ({
  className,
  ...props
}) => (
  <div className={cn("m-0 p-2 font-semibold text-sm", className)} {...props} />
);

export const KanbanProvider = (
  {
    children,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragCancel,
    className,
    style,
    columns,
    data,
    onDataChange,
    sensors: customSensors,
    collisionDetection,
    ...props
  }
) => {
  const [activeCardId, setActiveCardId] = useState(null);

  const defaultSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  );
  const sensors = customSensors ?? defaultSensors;

  const handleDragStart = (event) => {
    const card = data.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCardId(event.active.id);
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeItem = data.find((item) => item.id === active.id);
    const overItem = data.find((item) => item.id === over.id);

    if (!activeItem) {
      return;
    }

    const activeColumn = activeItem.column;
    const overColumn =
      overItem?.column ||
      columns.find((col) => col.id === over.id)?.id ||
      columns[0]?.id;

    if (activeColumn !== overColumn) {
      const newData = data.map((item) =>
        item.id === active.id ? { ...item, column: overColumn } : item
      );
      const activeIndex = newData.findIndex((item) => item.id === active.id);
      const overIndex = newData.findIndex((item) => item.id === over.id);
      // Empty target column: over.id is the column id, so overIndex is -1 — keep card at end
      if (overIndex === -1) {
        onDataChange?.(newData);
      } else {
        onDataChange?.(arrayMove(newData, activeIndex, overIndex));
      }
    } else if (overItem && active.id !== over.id) {
      // Same-column reorder: preserve user's freestyle ordering
      const activeIndex = data.findIndex((item) => item.id === active.id);
      const overIndex = data.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(data, activeIndex, overIndex);
      onDataChange?.(reordered);
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event) => {
    setActiveCardId(null);

    onDragEnd?.(event);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Only do default data manipulation if no custom onDragEnd handler
    if (!onDragEnd) {
      let newData = [...data];
      const oldIndex = newData.findIndex((item) => item.id === active.id);
      const newIndex = newData.findIndex((item) => item.id === over.id);
      newData = arrayMove(newData, oldIndex, newIndex);
      onDataChange?.(newData);
    }
  };

  const announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === active.id) ?? {};

      return `Picked up the card "${name}" from the "${column}" column`;
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dragged the card "${name}" over the "${newColumn}" column`;
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dropped the card "${name}" into the "${newColumn}" column`;
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};

      return `Cancelled dragging the card "${name}"`;
    },
  };

  const handleDragCancel = (event) => {
    setActiveCardId(null);
    onDragCancel?.(event);
  };

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={collisionDetection ?? closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        sensors={sensors}
        {...props}>
        <div
          className={cn("grid size-full auto-cols-fr grid-flow-col gap-3", className)}
          style={style}>
          {columns.map((column) => children(column))}
        </div>
        {typeof window !== "undefined" &&
          createPortal(<DragOverlay style={{ zIndex: 1400 }}>
            <t.Out />
          </DragOverlay>, document.body)}
      </DndContext>
    </KanbanContext.Provider>
  );
};
