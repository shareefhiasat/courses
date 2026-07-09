import React, { useState, useCallback } from 'react';
import {
  ListProvider,
  ListGroup,
  ListHeader,
  ListItem,
  ListItems,
} from '@/components/kibo-ui/list';
import { useLang } from '@contexts/LangContext';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  resolveBoardClassName,
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';

export default function BoardListView({ data, columns, onCardClick, onDragEnd }) {
  const { t, lang } = useLang();
  const [features, setFeatures] = useState(data);
  const dragOriginRef = React.useRef(null);

  React.useEffect(() => {
    setFeatures(data);
  }, [data]);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;

      const fromColumn = dragOriginRef.current;
      dragOriginRef.current = null;

      const col = columns.find((c) => c.id === over.id || c.name === over.id);
      if (!col) return;

      const activeItem = data.find((item) => item.id === active.id);
      if (!activeItem || !fromColumn || fromColumn === col.id) return;

      setFeatures((prev) =>
        prev.map((item) => (item.id === active.id ? { ...item, column: col.id } : item))
      );
      onDragEnd?.(active.id, fromColumn, col.id);
    },
    [columns, data, onDragEnd]
  );

  const handleDragStart = useCallback((event) => {
    const item = data.find((d) => d.id === event.active?.id);
    dragOriginRef.current = item?.column || null;
  }, [data]);

  return (
    <ListProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {columns.map((column) => (
        <ListGroup id={column.id} key={column.id}>
          <ListHeader
            color={column.color}
            name={`${t(column.i18nKey) || column.name} (${features.filter((f) => f.column === column.id).length})`}
          />
          <ListItems>
            {features
              .filter((item) => item.column === column.id)
              .map((item, index) => {
                const studentName = resolveBoardStudentName(item, lang);
                const className = resolveBoardClassName(item, lang);
                return (
                  <ListItem
                    id={item.id}
                    index={index}
                    key={item.id}
                    name={studentName}
                    parent={column.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick?.(item);
                    }}
                  >
                    <BoardStudentAvatar
                      name={studentName}
                      profileImageUrl={item.profileImageUrl}
                      size="sm"
                    />
                    <div className="m-0 flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="m-0 truncate font-medium text-sm">{studentName}</p>
                      {className && (
                        <p className="m-0 truncate text-xs text-muted-foreground">{className}</p>
                      )}
                    </div>
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                  </ListItem>
                );
              })}
          </ListItems>
        </ListGroup>
      ))}
    </ListProvider>
  );
}
