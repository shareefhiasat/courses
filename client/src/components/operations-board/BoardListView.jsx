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

export default function BoardListView({ data, columns, onCardClick, onDragEnd }) {
  const { t } = useLang();
  const [features, setFeatures] = useState(data);

  React.useEffect(() => {
    setFeatures(data);
  }, [data]);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;

      const col = columns.find((c) => c.id === over.id || c.name === over.id);
      if (!col) return;

      const activeItem = features.find((item) => item.id === active.id);
      if (!activeItem || activeItem.column === col.id) return;

      setFeatures((prev) =>
        prev.map((item) => (item.id === active.id ? { ...item, column: col.id } : item))
      );
      onDragEnd?.(active.id, activeItem.column, col.id);
    },
    [columns, features, onDragEnd]
  );

  return (
    <ListProvider onDragEnd={handleDragEnd}>
      {columns.map((column) => (
        <ListGroup id={column.id} key={column.id}>
          <ListHeader
            color={column.color}
            name={`${t(column.i18nKey) || column.name} (${features.filter((f) => f.column === column.id).length})`}
          />
          <ListItems>
            {features
              .filter((item) => item.column === column.id)
              .map((item, index) => (
                <ListItem
                  id={item.id}
                  index={index}
                  key={item.id}
                  name={item.name}
                  parent={column.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardClick?.(item);
                  }}
                >
                  <BoardStudentAvatar
                    name={item.name}
                    profileImageUrl={item.profileImageUrl}
                    size="sm"
                  />
                  <div className="m-0 flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="m-0 truncate font-medium text-sm">{item.name}</p>
                    {item.className && (
                      <p className="m-0 truncate text-xs text-muted-foreground">{item.className}</p>
                    )}
                  </div>
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                </ListItem>
              ))}
          </ListItems>
        </ListGroup>
      ))}
    </ListProvider>
  );
}
