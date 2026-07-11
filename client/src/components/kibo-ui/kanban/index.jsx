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
  className
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const isOpsLane = className?.includes?.('operations-board-lane');

  return (
    <div
      className={cn(
        "flex size-full min-h-40 flex-col divide-y rounded-md border bg-transparent text-xs shadow-sm ring-2 transition-all",
        isOpsLane ? "overflow-visible" : "overflow-hidden",
        isOver ? "ring-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]" : "ring-transparent",
        className
      )}
      ref={setNodeRef}>
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
    dragColor
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
  });
  const { activeCardId } = useContext(KanbanContext);

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const ringColor = dragColor || '#a855f7';
  const glowColor = dragColor || 'rgba(139,92,246,0.4)';

  const dragStyle = isDragging ? {
    '--tw-ring-color': `${ringColor}66`,
  } : undefined;

  const overlayStyle = {
    '--tw-ring-color': ringColor,
    boxShadow: `0 0 18px ${glowColor}`,
  };

  return (
    <>
      <div style={style} {...listeners} {...attributes} ref={setNodeRef}>
        <Card
          className={cn(
            "cursor-grab gap-4 rounded-md p-3 shadow-sm transition-shadow transition-[box-shadow,border-color]",
            isDragging && "pointer-events-none cursor-grabbing opacity-30 ring-2",
            className
          )}
          style={dragStyle}>
          {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
        </Card>
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              "cursor-grab gap-4 rounded-md p-3 shadow-sm ring-2 animate-pulse",
              isDragging && "cursor-grabbing",
              className
            )}
            style={overlayStyle}>
            {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
          </Card>
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
          className={cn("grid size-full auto-cols-fr grid-flow-col gap-3", className)}>
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
