import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, ArrowUp, ArrowDown, ArrowUpDown, Filter as FilterIcon, Star, GripVertical, MessageSquare } from 'lucide-react';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/kibo/ui/table';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardStudentName,
  parseWorkflowCardName,
} from './operationsBoardDisplayUtils.js';
import { getParticipationsByClassAndDate } from '@services/business/participationService.js';
import { ATTENDANCE_BOARD_COLORS, BOARD_PARTICIPATION_COLOR } from '@constants/workspaceStatusColors.js';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';

const SORT_KEYS = {
  NAME: 'name',
  STATUS: 'status',
  DATE: 'date',
  CLASS: 'class',
  ASSIGNEE: 'assignee',
  NOTES: 'notes',
  PARTICIPATION: 'participation',
  COMMENTS: 'comments',
};

const COL_STORAGE_KEY = 'operations_board_table_columns';
const DEFAULT_COL_WIDTH = 160;
const MIN_COL_WIDTH = 80;
const MAX_COL_WIDTH = 400;

const COLUMN_DEFS = [
  { id: 'avatar', labelKey: null, sortable: false, width: 56, className: 'text-center', fixed: true },
  { id: 'name', labelKey: 'operations_board_table_name', sortable: true, width: 140 },
  { id: 'status', labelKey: 'operations_board_status', sortable: true, width: 60, className: 'w-10 text-center' },
  { id: 'date', labelKey: 'operations_board_card_date', sortable: true, width: 110 },
  { id: 'class', labelKey: 'operations_board_table_class', sortable: true, width: 160 },
  { id: 'assignee', labelKey: 'operations_board_card_assignee', sortable: true, width: 120 },
  { id: 'notes', labelKey: 'operations_board_tab_notes', sortable: true, width: 140 },
  { id: 'comments', labelKey: 'operations_board_tab_comments', sortable: true, width: 140 },
  { id: 'participation', labelKey: 'operations_board_participation', sortable: true, width: 90, className: 'text-center' },
];

function loadStoredColConfig() {
  try {
    const raw = localStorage.getItem(COL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch { return null; }
}

function saveColConfig(config) {
  try { localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(config)); } catch {}
}

function getInitialColOrder() {
  const stored = loadStoredColConfig();
  if (stored?.order) {
    const validIds = new Set(COLUMN_DEFS.map((c) => c.id));
    const filtered = stored.order.filter((id) => validIds.has(id));
    const missing = COLUMN_DEFS.map((c) => c.id).filter((id) => !filtered.includes(id));
    return [...filtered, ...missing];
  }
  return COLUMN_DEFS.map((c) => c.id);
}

function getInitialColWidths() {
  const stored = loadStoredColConfig();
  const widths = {};
  COLUMN_DEFS.forEach((c) => { widths[c.id] = c.width || DEFAULT_COL_WIDTH; });
  if (stored?.widths) {
    Object.entries(stored.widths).forEach(([id, w]) => {
      if (widths[id] != null) widths[id] = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, w));
    });
  }
  return widths;
}

function BoardStatusDot({ column, color: overrideColor, pulse = false }) {
  const color = overrideColor || ATTENDANCE_BOARD_COLORS[column] || '#6b7280';
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${pulse && column === 'NOT_TAKEN' ? gridStyles.legendDotPulse : ''}`}
      style={{ backgroundColor: color, '--dot-color': color }}
      aria-hidden
    />
  );
}

function getWorkflowNotesText(item) {
  const comments = item.raw?.comments || item.comments || [];
  const notes = comments
    .filter((c) => c.action === 'NOTE')
    .map((c) => c.comment || c.text)
    .filter(Boolean);
  return notes.join(' · ') || item.notes || '';
}

function getWorkflowCommentsText(item) {
  const comments = item.raw?.comments || item.comments || [];
  const texts = comments
    .filter((c) => !c.action || c.action === 'COMMENT')
    .map((c) => c.comment || c.text)
    .filter(Boolean);
  return texts.join(' · ') || '';
}

function getItemNotesText(item) {
  if (item.type === 'workflow') return getWorkflowNotesText(item);
  return item.notes || '';
}

function getItemCommentsText(item) {
  if (item.type === 'workflow') return getWorkflowCommentsText(item);
  return '';
}

function getSortValue(item, key, lang) {
  switch (key) {
    case SORT_KEYS.NAME:
      return resolveBoardStudentName(item, lang).toLowerCase();
    case SORT_KEYS.STATUS:
      return item.column || '';
    case SORT_KEYS.DATE:
      return item.date || '';
    case SORT_KEYS.CLASS: {
      const parts = parseWorkflowCardName(item.name || '');
      return (parts[1] || item.className || '').toLowerCase();
    }
    case SORT_KEYS.ASSIGNEE:
      return item.assignee?.toLowerCase() || '';
    case SORT_KEYS.NOTES:
      return getItemNotesText(item).toLowerCase();
    case SORT_KEYS.COMMENTS:
      return getItemCommentsText(item).toLowerCase();
    case SORT_KEYS.PARTICIPATION:
      return item._participationCount || 0;
    default:
      return '';
  }
}

export default function BoardTableView({ data, columns, onCardClick, t, lang = 'en', sortBy }) {
  const columnMap = Object.fromEntries(columns.map((c) => [c.id, c]));
  const isAttendance = data.some((item) => item.type === 'attendance');
  const activeColumnDefs = useMemo(() => {
    if (isAttendance) {
      return COLUMN_DEFS.filter((c) => c.id !== 'assignee' && c.id !== 'class' && c.id !== 'comments');
    }
    return COLUMN_DEFS.filter((c) => c.id !== 'assignee');
  }, [isAttendance]);
  const colDefMap = useMemo(() => Object.fromEntries(activeColumnDefs.map((c) => [c.id, c])), [activeColumnDefs]);
  const [sortKey, setSortKey] = useState(SORT_KEYS.NAME);
  const [sortDir, setSortDir] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [metaFilter, setMetaFilter] = useState('all');
  const [participationMap, setParticipationMap] = useState({});
  const [colOrder, setColOrder] = useState(() => {
    const order = getInitialColOrder();
    if (isAttendance) return order.filter((id) => id !== 'assignee' && id !== 'class');
    return order;
  });
  const [colWidths, setColWidths] = useState(getInitialColWidths);
  const dragColRef = useRef(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const resizingColRef = useRef(null);

  const classId = data[0]?.classId;
  const date = data[0]?.date;

  useEffect(() => {
    if (sortBy === 'alpha') {
      setSortKey(SORT_KEYS.NAME);
      setSortDir('asc');
    } else if (sortBy === 'system') {
      setSortKey(null);
      setSortDir('asc');
    }
  }, [sortBy]);

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
        const classTotal = Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
        map._classTotal = classTotal;
        setParticipationMap(map);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [classId, date]);

  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const persistColConfig = useCallback((nextOrder, nextWidths) => {
    saveColConfig({ order: nextOrder, widths: nextWidths });
  }, []);

  const handleColReorder = useCallback((fromId, toId) => {
    if (fromId === toId) return;
    setColOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(fromId);
      const toIdx = next.indexOf(toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId);
      persistColConfig(next, colWidths);
      return next;
    });
  }, [colWidths, persistColConfig]);

  const startColResize = useCallback((colId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colId] || DEFAULT_COL_WIDTH;
    const widthRef = { current: startWidth };
    resizingColRef.current = { colId, startX, startWidth };

    const onMove = (ev) => {
      if (!resizingColRef.current) return;
      const delta = lang === 'ar' ? -(ev.clientX - resizingColRef.current.startX) : (ev.clientX - resizingColRef.current.startX);
      const newWidth = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, resizingColRef.current.startWidth + delta));
      widthRef.current = newWidth;
      setColWidths((prev) => ({ ...prev, [colId]: newWidth }));
    };
    const onUp = () => {
      setColWidths((prev) => {
        const next = { ...prev, [colId]: widthRef.current };
        persistColConfig(colOrder, next);
        return next;
      });
      resizingColRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [colWidths, lang, colOrder, persistColConfig]);

  const enrichedData = useMemo(() => {
    return data.map((item) => {
      const notesText = getItemNotesText(item);
      const commentsText = getItemCommentsText(item);
      const partCount = item.type === 'workflow'
        ? (participationMap._classTotal || 0)
        : (participationMap[String(item.userId)]?.length || 0);
      return {
        ...item,
        _participationCount: partCount,
        _notesText: notesText,
        _commentsText: commentsText,
      };
    });
  }, [data, participationMap]);

  const filteredData = useMemo(() => {
    let rows = enrichedData;
    if (statusFilter !== 'all') {
      rows = rows.filter((item) => item.column === statusFilter);
    }
    if (metaFilter === 'notes') {
      rows = rows.filter((item) => Boolean(item._notesText));
    } else if (metaFilter === 'participation') {
      rows = rows.filter((item) => (item._participationCount || 0) > 0);
    }
    return rows;
  }, [enrichedData, statusFilter, metaFilter]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = getSortValue(a, sortKey, lang);
      const bVal = getSortValue(b, sortKey, lang);
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir, lang]);

  const statusOptions = useMemo(() => {
    const seen = new Set();
    enrichedData.forEach((item) => { if (item.column) seen.add(item.column); });
    return Array.from(seen);
  }, [enrichedData]);

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown size={12} className="inline-block opacity-40 ml-1" />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="inline-block ml-1" />
      : <ArrowDown size={12} className="inline-block ml-1" />;
  };

  const renderCell = useCallback((colId, item, studentName, partCount, notesText, commentsText) => {
    const workflowParts = item.type === 'workflow' ? parseWorkflowCardName(item.name || '') : [];
    const workflowTitle = workflowParts[0] || studentName;
    const workflowClass = workflowParts[1] || item.className || '';
    switch (colId) {
      case 'avatar':
        return (
          <div className="flex justify-center">
            <BoardStudentAvatar
              name={studentName}
              profileImageUrl={item.profileImageUrl}
              size="sm"
              className="operations-board-table-avatar"
            />
          </div>
        );
      case 'name':
        return (
          <div className="relative inline-flex items-center gap-1">
            {(notesText || partCount > 0) && (
              <span className="inline-flex gap-0.5">
                {notesText && (
                  <ColoredTooltip title={t('operations_board_has_note') || 'Has a note'} color="#ef4444" placement="top">
                    <Star size={12} fill="#ef4444" color="#ef4444" data-testid={`table-card-notes-star-${item.id}`} />
                  </ColoredTooltip>
                )}
                {partCount > 0 && (
                  <ColoredTooltip title={t('operations_board_has_participation') || 'Has participation'} color={BOARD_PARTICIPATION_COLOR} placement="top">
                    <Star size={12} fill={BOARD_PARTICIPATION_COLOR} color={BOARD_PARTICIPATION_COLOR} data-testid={`table-card-participation-star-${item.id}`} />
                  </ColoredTooltip>
                )}
                {commentsText && (
                  <ColoredTooltip title={t('operations_board_has_comment') || 'Has comments'} color="#3b82f6" placement="top">
                    <MessageSquare size={12} color="#3b82f6" data-testid={`table-card-comments-icon-${item.id}`} />
                  </ColoredTooltip>
                )}
              </span>
            )}
            <span className="truncate">{item.type === 'workflow' ? workflowTitle : studentName}</span>
          </div>
        );
      case 'class':
        return (
          <span className="truncate text-sm text-muted-foreground" title={workflowClass}>
            {workflowClass || '—'}
          </span>
        );
      case 'status': {
        const col = columnMap[item.column];
        return col && (
          <ColoredTooltip title={t(col.i18nKey) || col.name} color={col.color} placement="top">
            <span className="inline-flex justify-center">
              <BoardStatusDot column={item.column} color={col.color} pulse />
            </span>
          </ColoredTooltip>
        );
      }
      case 'date':
        return item.date ? formatBoardDate(item.date, lang) : '—';
      case 'assignee':
        return item.assignee || t('operations_board_card_no_assignee');
      case 'notes':
        return (
          <span className="max-w-[160px] truncate text-xs text-muted-foreground" title={notesText}>
            {notesText || '—'}
          </span>
        );
      case 'comments':
        return (
          <span className="max-w-[160px] truncate text-xs text-muted-foreground" title={commentsText}>
            {commentsText || '—'}
          </span>
        );
      case 'participation':
        return (
          <button
            className="inline-flex items-center justify-center rounded-md border border-input px-1.5 py-0.5 hover:bg-muted gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onCardClick(item);
            }}
            aria-label={t('operations_board_participation') || 'Participation'}
            data-testid={`operations-board-table-participation-${item.id}`}
          >
            {partCount > 0 && (
              <span className="text-xs font-medium">{partCount}</span>
            )}
            <Plus size={14} />
          </button>
        );
      default:
        return null;
    }
  }, [columnMap, t, lang, onCardClick]);

  return (
    <div className="overflow-hidden rounded-lg border border-border" data-testid="operations-board-table">
      <div className="operations-board-table-filter-bar">
        <FilterIcon size={14} className="text-muted-foreground shrink-0" />
        <div className="operations-board-filter-chips">
          <button
            type="button"
            className={`operations-board-filter-chip ${statusFilter === 'all' ? 'selected' : ''}`}
            onClick={() => setStatusFilter('all')}
            data-testid="operations-board-table-status-filter-all"
          >
            {t('operations_board_filter_all') || 'All'}
          </button>
          {statusOptions.map((status) => {
            const col = columnMap[status];
            const label = col ? t(col.i18nKey) || col.name : status;
            return (
              <button
                key={status}
                type="button"
                className={`operations-board-filter-chip ${statusFilter === status ? 'selected' : ''}`}
                onClick={() => setStatusFilter(status)}
                data-testid={`operations-board-table-status-filter-${status}`}
                style={col ? { '--chip-color': col.color, '--chip-fg': col.color } : undefined}
              >
                {col && <BoardStatusDot column={status} color={col.color} pulse />}
                {label}
              </button>
            );
          })}
          <button
            type="button"
            className={`operations-board-filter-chip ${metaFilter === 'notes' ? 'selected' : ''}`}
            onClick={() => setMetaFilter((prev) => (prev === 'notes' ? 'all' : 'notes'))}
            data-testid="operations-board-table-meta-filter-notes"
          >
            <Star size={11} fill="#ef4444" color="#ef4444" />
            {t('operations_board_tab_notes') || 'Notes'}
          </button>
          <button
            type="button"
            className={`operations-board-filter-chip ${metaFilter === 'participation' ? 'selected' : ''}`}
            onClick={() => setMetaFilter((prev) => (prev === 'participation' ? 'all' : 'participation'))}
            data-testid="operations-board-table-meta-filter-participation"
          >
            <Star size={11} fill={BOARD_PARTICIPATION_COLOR} color={BOARD_PARTICIPATION_COLOR} />
            {t('operations_board_participation') || 'Participation'}
          </button>
        </div>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {sortedData.length} / {enrichedData.length}
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {colOrder.map((colId) => {
              const def = colDefMap[colId];
              if (!def) return null;
              const width = colWidths[colId] || def.width || DEFAULT_COL_WIDTH;
              const isFixed = def.fixed;
              const isDragOver = dragOverCol === colId;
              return (
                <TableHead
                  key={colId}
                  className={`${def.className || ''} ${isDragOver ? 'bg-primary/10' : ''}`}
                  style={{ width: `${width}px`, minWidth: `${width}px`, position: 'relative' }}
                  draggable={!isFixed}
                  onDragStart={(e) => {
                    if (isFixed) return;
                    e.dataTransfer.setData('text/plain', colId);
                    dragColRef.current = colId;
                  }}
                  onDragOver={(e) => {
                    if (isFixed) return;
                    e.preventDefault();
                    setDragOverCol(colId);
                  }}
                  onDrop={(e) => {
                    if (isFixed) return;
                    e.preventDefault();
                    const fromId = dragColRef.current;
                    setDragOverCol(null);
                    if (fromId && fromId !== colId) {
                      handleColReorder(fromId, colId);
                    }
                    dragColRef.current = null;
                  }}
                  onDragEnd={() => {
                    setDragOverCol(null);
                    dragColRef.current = null;
                  }}
                  onClick={def.sortable ? () => handleSort(colId) : undefined}
                  data-testid={`operations-board-table-col-${colId}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {!isFixed && (
                      <GripVertical size={12} className="opacity-30 cursor-grab shrink-0" />
                    )}
                    {def.labelKey ? t(def.labelKey) : ''}
                    {def.sortable && <SortIcon columnKey={colId} />}
                  </span>
                  {!isFixed && (
                    <span
                      className="absolute end-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30"
                      onPointerDown={(e) => startColResize(colId, e)}
                      data-testid={`operations-board-table-resize-${colId}`}
                    />
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colOrder.length} className="py-10 text-center text-sm text-muted-foreground">
                {t('operations_board_empty_table')}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item) => {
              const studentName = resolveBoardStudentName(item, lang);
              const partCount = item._participationCount || 0;
              const notesText = item._notesText || '';
              const commentsText = item._commentsText || '';
              return (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onCardClick(item)}
                  data-testid={`operations-board-table-row-${item.id}`}
                >
                  {colOrder.map((colId) => {
                    const def = colDefMap[colId];
                    if (!def) return null;
                    const width = colWidths[colId] || def.width || DEFAULT_COL_WIDTH;
                    return (
                      <TableCell
                        key={colId}
                        className={def.className || ''}
                        style={{ width: `${width}px`, minWidth: `${width}px` }}
                      >
                        {renderCell(colId, item, studentName, partCount, notesText, commentsText)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
