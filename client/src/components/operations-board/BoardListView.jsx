import React, { useState, useCallback } from 'react';
import {
  ListProvider,
  ListGroup,
  ListHeader,
  ListItem,
  ListItems,
} from '@/components/kibo-ui/list';
import { Avatar, AvatarFallback } from '@/components/kibo/ui/avatar';
import { useLang } from '@contexts/LangContext';

export default function BoardListView({ data, columns, onCardClick }) {
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

      setFeatures((prev) =>
        prev.map((item) => {
          if (item.id === active.id) {
            return { ...item, column: col.id };
          }
          return item;
        })
      );
    },
    [columns]
  );

  return (
    <ListProvider onDragEnd={handleDragEnd}>
      {columns.map((column) => (
        <ListGroup id={column.id} key={column.id}>
          <ListHeader color={column.color} name={`${t(column.i18nKey) || column.name} (${features.filter((f) => f.column === column.id).length})`} />
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
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <p className="m-0 flex-1 font-medium text-sm">
                    {item.name}
                  </p>
                  {item.assignee && (
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {item.assignee.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </ListItem>
              ))}
          </ListItems>
        </ListGroup>
      ))}
    </ListProvider>
  );
}
