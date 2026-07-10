import React, { useState, useCallback, useEffect } from 'react';
import {
  ListProvider,
  ListGroup,
  ListHeader,
  ListItem,
  ListItems,
} from '@/components/kibo-ui/list';
import { Status, StatusIndicator, StatusLabel } from '@/components/kibo-ui/status';
import { Star } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  resolveBoardClassName,
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';
import { getParticipationsByClassAndDate } from '@services/business/participationService.js';

const ATTENDANCE_STATUS_CLASS = {
  PRESENT: 'online',
  LATE: 'degraded',
  ABSENT: 'offline',
  EXCUSED: 'maintenance',
  HUMAN_CASE: 'degraded',
  NOT_TAKEN: 'pending',
};

export default function BoardListView({ data, columns, onCardClick, onDragEnd }) {
  const { t, lang } = useLang();
  const [features, setFeatures] = useState(data);
  const [participationMap, setParticipationMap] = useState({});
  const dragOriginRef = React.useRef(null);

  React.useEffect(() => {
    setFeatures(data);
  }, [data]);

  const classId = data[0]?.classId;
  const date = data[0]?.date;

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
  }, [classId, date]);

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
                    {(item.notes || participationMap[String(item.userId)]?.length > 0) && (
                      <div className="absolute right-0 top-0 flex gap-0.5 z-10">
                        {item.notes && (
                          <ColoredTooltip title={t('operations_board_has_note') || 'Has a note'} color="#ef4444" placement="top">
                            <Star size={12} fill="#ef4444" color="#ef4444" data-testid={`list-card-notes-star-${item.id}`} />
                          </ColoredTooltip>
                        )}
                        {participationMap[String(item.userId)]?.length > 0 && (
                          <ColoredTooltip title={t('operations_board_has_participation') || 'Has participation'} color="#3b82f6" placement="top">
                            <Star size={12} fill="#3b82f6" color="#3b82f6" data-testid={`list-card-participation-star-${item.id}`} />
                          </ColoredTooltip>
                        )}
                      </div>
                    )}
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
                    <Status status={ATTENDANCE_STATUS_CLASS[column.id] || 'offline'} className="shrink-0">
                      <StatusIndicator />
                      <StatusLabel>{t(column.i18nKey) || column.name}</StatusLabel>
                    </Status>
                  </ListItem>
                );
              })}
          </ListItems>
        </ListGroup>
      ))}
    </ListProvider>
  );
}
