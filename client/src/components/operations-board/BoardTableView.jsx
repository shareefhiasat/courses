import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, ArrowUp, ArrowDown, ArrowUpDown, Star, GripVertical, MessageSquare } from 'lucide-react';
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
import { ATTENDANCE_BOARD_COLORS, BOARD_PARTICIPATION_COLOR, BOARD_COMMENT_COLOR } from '@constants/workspaceStatusColors.js';
import { shouldHideNotesParticipation, canViewParticipation } from './hrAttendancePrivacy.js';
import { ATTENDANCE_BOARD_LANES } from '@services/business/operationsBoardService.js';
import { COMMENT_ACTION, CARD_TYPE, DRAWER_TAB } from './operationsBoardConstants.js';
import GridQuickFilterChips from '@components/ui/GridQuickFilterChips';
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
const ROW_ORDER_STORAGE_KEY = 'operations_board_table_row_order';
const DEFAULT_COL_WIDTH = 160;
const MIN_COL_WIDTH = 60;
const MAX_COL_WIDTH = 400;

const COLUMN_DEFS = [
  { id: 'avatar', labelKey: null, sortable: false, width: 56, className: 'text-center', fixed: true },
  { id: 'name', labelKey: 'operations_board_table_name', sortable: true, width: 220 },
  { id: 'status', labelKey: 'operations_board_status', sortable: true, width: 70, className: 'w-10 text-center' },
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

function loadStoredRowOrder(classId, date) {
  try {
    const raw = localStorage.getItem(ROW_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    const key = [classId, date].filter(Boolean).join('|');
    if (!key) return [];
    return Array.isArray(parsed[key]) ? parsed[key] : [];
  } catch { return []; }
}

function saveStoredRowOrder(classId, date, order) {
  try {
    const key = [classId, date].filter(Boolean).join('|');
    if (!key) return;
    const raw = localStorage.getItem(ROW_ORDER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[key] = order;
    localStorage.setItem(ROW_ORDER_STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
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
  // Always keep the name column as the largest default, regardless of stale stored values.
  widths.name = Math.max(widths.name, COLUMN_DEFS.find((c) => c.id === 'name')?.width || 220);
  return widths;
}

function BoardStatusDot({ column, color: overrideColor, pulse = false }) {
  const color = overrideColor || ATTENDANCE_BOARD_COLORS[column] || '#6b7280';
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${pulse && column === ATTENDANCE_BOARD_LANES.NOT_TAKEN ? gridStyles.legendDotPulse : ''}`}
      style={{ backgroundColor: color, '--dot-color': color }}
      aria-hidden
    />
  );
}

function getWorkflowNotesText(item) {
  const comments = item.raw?.comments || item.comments || [];
  const notes = comments
    .filter((c) => c.action === COMMENT_ACTION.NOTE)
    .map((c) => c.comment || c.text)
    .filter(Boolean);
  return notes.join(' · ') || item.notes || '';
}

function getWorkflowCommentsText(item) {
  const comments = item.raw?.comments || item.comments || [];
  const texts = comments
    .filter((c) => !c.action || c.action === COMMENT_ACTION.COMMENT)
    .map((c) => c.comment || c.text)
    .filter(Boolean);
  return texts.join(' · ') || '';
}

function getItemNotesText(item) {
  if (item.type === CARD_TYPE.WORKFLOW) {
    const attendanceNotes = item.attendanceNotes?.filter(Boolean).join(' · ');
    return attendanceNotes || getWorkflowNotesText(item);
  }
  return item.notes || '';
}

function TableAddButton({ label, count, onClick, testId, iconOnly = false }) {
  return (
    <button
      type="button"
      className={`operations-board-table-add-btn inline-flex items-center justify-center rounded-full border border-input px-2.5 py-1 hover:bg-primary/10 hover:text-primary hover:border-primary/50${count !== undefined ? ' gap-1' : ''}`}
      onClick={onClick}
      aria-label={label}
      data-testid={testId}
    >
      {count !== undefined && count > 0 && <span className="text-xs font-medium">{count}</span>}
      <Plus size={14} />
      {!iconOnly && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}

function getItemCommentsText(item) {
  if (item.type === CARD_TYPE.WORKFLOW) return getWorkflowCommentsText(item);
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

export default function BoardTableView({
  data,
  columns,
  onCardClick,
  t,
  lang = 'en',
  sortBy,
  roleContext = {},
  showAvatars = true,
  participationRefreshKey = 0,
}) {
  const hideNotesParticipation = shouldHideNotesParticipation(roleContext);
  const participationViewer = canViewParticipation(roleContext);
  const isAdmin = Boolean(roleContext.isAdmin || roleContext.isSuperAdmin);
  const isHR = Boolean(roleContext.isHR);
  const canViewComments = isAdmin || isHR;
  const canViewNotes = isAdmin;
  const columnMap = Object.fromEntries(columns.map((c) => [c.id, c]));
  const isAttendance = data.some((item) => item.type === CARD_TYPE.ATTENDANCE);
  const activeColumnDefs = useMemo(() => {
    let defs = COLUMN_DEFS.filter((c) => c.id !== 'date' && (showAvatars || c.id !== 'avatar'));
    if (isAttendance) {
      defs = defs.filter((c) => c.id !== 'assignee' && c.id !== 'class' && c.id !== 'comments');
    } else {
      defs = defs.filter((c) => c.id !== 'assignee');
    }
    if (hideNotesParticipation) {
      defs = defs.filter((c) => c.id !== DRAWER_TAB.NOTES);
    }
    if (!participationViewer) {
      defs = defs.filter((c) => c.id !== DRAWER_TAB.PARTICIPATION);
    }
    return defs;
  }, [isAttendance, hideNotesParticipation, participationViewer, showAvatars]);
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
  const visibleColOrder = useMemo(() => colOrder.filter((id) => colDefMap[id]), [colOrder, colDefMap]);
  const [colWidths, setColWidths] = useState(getInitialColWidths);
  const dragColRef = useRef(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const resizingColRef = useRef(null);

  const rowOrderKey = useMemo(() => {
    const classId = data[0]?.classId;
    const date = data[0]?.date;
    return [classId, date].filter(Boolean).join('|') || null;
  }, [data]);
  const [rowOrder, setRowOrder] = useState(() => loadStoredRowOrder(data[0]?.classId, data[0]?.date));
  const dragRowRef = useRef(null);
  const [dragOverRow, setDragOverRow] = useState(null);
  const rowDraggingRef = useRef(false);

  useEffect(() => {
    if (rowOrderKey) setRowOrder(loadStoredRowOrder(data[0]?.classId, data[0]?.date));
  }, [rowOrderKey, data]);

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
    if (!classId || !date || !participationViewer) {
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
  }, [classId, date, participationRefreshKey, participationViewer]);

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
      const partCount = item.type === CARD_TYPE.WORKFLOW
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
    if (metaFilter === DRAWER_TAB.NOTES) {
      rows = rows.filter((item) => Boolean(item._notesText));
    } else if (metaFilter === DRAWER_TAB.COMMENTS) {
      rows = rows.filter((item) => Boolean(item._commentsText));
    } else if (metaFilter === DRAWER_TAB.PARTICIPATION) {
      rows = rows.filter((item) => (item._participationCount || 0) > 0);
    }
    return rows;
  }, [enrichedData, statusFilter, metaFilter]);

  const sortedData = useMemo(() => {
    if (sortBy === 'system' && rowOrder.length > 0) {
      const orderMap = new Map(rowOrder.map((id, i) => [String(id), i]));
      return [...filteredData].sort((a, b) => {
        const aIdx = orderMap.has(String(a.id)) ? orderMap.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
        const bIdx = orderMap.has(String(b.id)) ? orderMap.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return 0;
      });
    }
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
  }, [filteredData, sortKey, sortDir, lang, sortBy, rowOrder]);

  const statusOptions = useMemo(() => {
    const seen = new Set();
    enrichedData.forEach((item) => { if (item.column) seen.add(item.column); });
    return Array.from(seen);
  }, [enrichedData]);

  const filterCounts = useMemo(() => {
    const counts = {
      all: enrichedData.length,
      notes: 0,
      comments: 0,
      participation: 0,
    };
    const statusCounts = {};
    enrichedData.forEach((item) => {
      if (item.column) {
        statusCounts[item.column] = (statusCounts[item.column] || 0) + 1;
      }
      if (item._notesText) counts.notes += 1;
      if (item._commentsText) counts.comments += 1;
      if ((item._participationCount || 0) > 0) counts.participation += 1;
    });
    return { ...counts, ...statusCounts };
  }, [enrichedData]);

  const filterChips = useMemo(() => {
    const chips = [
      { id: 'all', label: t('operations_board_filter_all') || 'All', count: filterCounts.all, color: '#800020' },
    ];
    statusOptions.forEach((status) => {
      const col = columnMap[status];
      const label = col ? t(col.i18nKey) || col.name : status;
      const color = col?.color || '#64748b';
      chips.push({
        id: status,
        label,
        count: filterCounts[status] || 0,
        color,
        icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />,
      });
    });
    if (canViewComments) {
      chips.push({
        id: DRAWER_TAB.COMMENTS,
        label: t('operations_board_tab_comments') || 'Comments',
        count: filterCounts.comments,
        color: BOARD_COMMENT_COLOR,
        icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: BOARD_COMMENT_COLOR, flexShrink: 0 }} />,
      });
    }
    if (canViewNotes) {
      chips.push({
        id: DRAWER_TAB.NOTES,
        label: t('operations_board_tab_notes') || 'Notes',
        count: filterCounts.notes,
        color: '#ef4444',
        icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />,
      });
    }
    if (participationViewer) {
      chips.push({
        id: DRAWER_TAB.PARTICIPATION,
        label: t('operations_board_participation') || 'Participation',
        count: filterCounts.participation,
        color: BOARD_PARTICIPATION_COLOR,
        icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: BOARD_PARTICIPATION_COLOR, flexShrink: 0 }} />,
      });
    }
    return chips.filter((chip) => (chip.count || 0) > 0);
  }, [t, filterCounts, statusOptions, columnMap, participationViewer, canViewComments, canViewNotes]);

  const filterActiveIds = useMemo(() => {
    const ids = [];
    if (statusFilter !== 'all') ids.push(statusFilter);
    if (metaFilter !== 'all') ids.push(metaFilter);
    if (ids.length === 0) ids.push('all');
    return ids;
  }, [statusFilter, metaFilter]);

  const handleFilterChipChange = useCallback((id, nextIds) => {
    if (id === 'all') {
      setStatusFilter('all');
      setMetaFilter('all');
      return;
    }
    const statuses = nextIds.filter((x) => x !== 'all' && x !== DRAWER_TAB.NOTES && x !== DRAWER_TAB.PARTICIPATION && x !== DRAWER_TAB.COMMENTS);
    const metas = nextIds.filter((x) => x === DRAWER_TAB.NOTES || x === DRAWER_TAB.PARTICIPATION || x === DRAWER_TAB.COMMENTS);
    setStatusFilter(statuses.length ? statuses[0] : 'all');
    setMetaFilter(metas.length ? metas[0] : 'all');
  }, []);

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <ArrowUpDown size={12} className="inline-block opacity-40 ml-1" />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="inline-block ml-1" />
      : <ArrowDown size={12} className="inline-block ml-1" />;
  };

  const handleRowReorder = useCallback((fromId, toId) => {
    const baseIds = sortedData.map((d) => String(d.id));
    const currentIds = rowOrder.length > 0 ? baseIds : baseIds;
    const fromIdx = currentIds.indexOf(String(fromId));
    const toIdx = currentIds.indexOf(String(toId));
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...currentIds];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setRowOrder(next);
    saveStoredRowOrder(data[0]?.classId, data[0]?.date, next);
  }, [sortedData, rowOrder, data]);

  const renderCell = useCallback((colId, item, studentName, partCount, notesText, commentsText) => {
    const workflowParts = item.type === CARD_TYPE.WORKFLOW ? parseWorkflowCardName(item.name || '') : [];
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
          <div className="relative flex w-full min-w-0 items-center gap-1">
            {(notesText || partCount > 0 || commentsText) && (
              <span className="inline-flex gap-0.5 shrink-0">
                {!hideNotesParticipation && notesText && (
                  <ColoredTooltip
                    title={<div style={{ whiteSpace: 'pre-wrap', textAlign: 'start' }}>{notesText}</div>}
                    color="#ef4444"
                    placement="top"
                  >
                    <Star size={12} fill="#ef4444" color="#ef4444" data-testid={`table-card-notes-star-${item.id}`} />
                  </ColoredTooltip>
                )}
                {!hideNotesParticipation && partCount > 0 && (
                  <ColoredTooltip title={t('operations_board_has_participation') || 'Has participation'} color={BOARD_PARTICIPATION_COLOR} placement="top">
                    <Star size={12} fill={BOARD_PARTICIPATION_COLOR} color={BOARD_PARTICIPATION_COLOR} data-testid={`table-card-participation-star-${item.id}`} />
                  </ColoredTooltip>
                )}
                {commentsText && (
                  <ColoredTooltip title={t('operations_board_has_comment') || 'Has comments'} color={BOARD_COMMENT_COLOR} placement="top">
                    <MessageSquare size={12} color={BOARD_COMMENT_COLOR} data-testid={`table-card-comments-icon-${item.id}`} />
                  </ColoredTooltip>
                )}
              </span>
            )}
            <span className="flex-1 min-w-0 truncate">{item.type === CARD_TYPE.WORKFLOW ? workflowTitle : studentName}</span>
          </div>
        );
      case 'class':
        return (
          <ColoredTooltip title={workflowClass || '—'} placement="top">
            <span className="truncate text-sm text-muted-foreground">
              {workflowClass || '—'}
            </span>
          </ColoredTooltip>
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
      case 'assignee': {
        const roleLabel = item.assigneeRole
          ? (t(`role_label_${item.assigneeRole}`)
             || t(`roles.${item.assigneeRole}`)
             || t(`operations_board_role_${item.assigneeRole}`)
             || item.assigneeRole)
          : item.assignee;
        return item.classInstructorName || roleLabel || t('operations_board_card_no_assignee');
      }
      case 'notes':
        return (
          <div className="flex items-center justify-between gap-2 w-full">
            <ColoredTooltip title={notesText || '—'} placement="top">
              <span className="max-w-[120px] truncate text-xs text-muted-foreground">
                {notesText || '—'}
              </span>
            </ColoredTooltip>
            {item.type === CARD_TYPE.ATTENDANCE ? (
              <TableAddButton
                label={notesText ? (t('operations_board_note_edit') || 'Edit note') : (t('operations_board_add_note_short') || 'Add note')}
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick(item, 'notes');
                }}
                testId={`operations-board-table-notes-${item.id}`}
              />
            ) : null}
          </div>
        );
      case 'comments':
        return (
          <ColoredTooltip title={commentsText || '—'} placement="top">
            <span className="max-w-[160px] truncate text-xs text-muted-foreground">
              {commentsText || '—'}
            </span>
          </ColoredTooltip>
        );
      case 'participation':
        return (
          <TableAddButton
            label={t('operations_board_participation') || 'Participation'}
            count={partCount}
            iconOnly
            onClick={(e) => {
              e.stopPropagation();
              onCardClick(item, 'participation');
            }}
            testId={`operations-board-table-participation-${item.id}`}
          />
        );
      default:
        return null;
    }
  }, [columnMap, t, lang, onCardClick, hideNotesParticipation]);

  return (
    <div className="overflow-hidden rounded-lg border border-border" data-testid="operations-board-table">
      <div className="operations-board-table-filter-bar">
        <GridQuickFilterChips
          chips={filterChips}
          activeIds={filterActiveIds}
          onChange={handleFilterChipChange}
        />
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {sortedData.length} / {enrichedData.length}
        </span>
      </div>
      <Table style={{ tableLayout: 'fixed' }}>
        <TableHeader>
          <TableRow>
            {visibleColOrder.map((colId, idx) => {
              const def = colDefMap[colId];
              if (!def) return null;
              const width = colWidths[colId] || def.width || DEFAULT_COL_WIDTH;
              const isFixed = def.fixed;
              const isDragOver = dragOverCol === colId;
              return (
                <TableHead
                  key={colId}
                  className={`${def.className || ''} ${isDragOver ? 'bg-primary/10' : ''}`}
                  style={{
                    width: `${width}px`,
                    position: 'relative',
                    paddingInlineStart: (idx === 0 && colId !== 'avatar') ? '1rem' : undefined,
                  }}
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
              <TableCell colSpan={visibleColOrder.length} className="py-10 text-center text-sm text-muted-foreground">
                {t('operations_board_empty_table')}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item) => {
              const studentName = resolveBoardStudentName(item, lang);
              const partCount = item._participationCount || 0;
              const notesText = item._notesText || '';
              const commentsText = item._commentsText || '';
              const rowDraggable = sortBy === 'system';
              return (
                <TableRow
                  key={item.id}
                  className={`operations-board-table-row cursor-pointer hover:bg-primary/[0.04] ${dragOverRow === item.id ? 'bg-primary/10' : ''}`}
                  draggable={rowDraggable}
                  onDragStart={(e) => {
                    if (!rowDraggable) return;
                    e.dataTransfer.setData('text/plain', String(item.id));
                    dragRowRef.current = String(item.id);
                    rowDraggingRef.current = true;
                    setDragOverRow(null);
                  }}
                  onDragOver={(e) => {
                    if (!rowDraggable || dragRowRef.current === String(item.id)) return;
                    e.preventDefault();
                    setDragOverRow(item.id);
                  }}
                  onDragLeave={() => setDragOverRow(null)}
                  onDrop={(e) => {
                    if (!rowDraggable) return;
                    e.preventDefault();
                    const fromId = dragRowRef.current;
                    setDragOverRow(null);
                    if (fromId && fromId !== String(item.id)) {
                      handleRowReorder(fromId, String(item.id));
                    }
                    dragRowRef.current = null;
                  }}
                  onDragEnd={() => {
                    setDragOverRow(null);
                    dragRowRef.current = null;
                    setTimeout(() => { rowDraggingRef.current = false; }, 50);
                  }}
                  onClick={() => {
                    if (rowDraggingRef.current) return;
                    onCardClick(item);
                  }}
                  data-testid={`operations-board-table-row-${item.id}`}
                >
                  {visibleColOrder.map((colId, idx) => {
                    const def = colDefMap[colId];
                    if (!def) return null;
                    const width = colWidths[colId] || def.width || DEFAULT_COL_WIDTH;
                    return (
                      <TableCell
                        key={colId}
                        className={`operations-board-table-cell ${def.className || ''}`}
                        style={{
                          width: `${width}px`,
                          paddingInlineStart: (idx === 0 && colId !== 'avatar') ? '1rem' : undefined,
                        }}
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
