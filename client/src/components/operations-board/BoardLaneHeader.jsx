import React, { useState, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, ArrowRightLeft, Workflow as WorkflowIcon, Lock } from 'lucide-react';
import { KanbanHeader } from '@/components/kibo-ui/kanban';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import { useLang } from '@contexts/LangContext';

/**
 * Shared swim-lane header for attendance + workflow boards.
 * Expanded: color dot + title + count + collapse control.
 * Collapsed: color circle + count only (click expands).
 */
export default function BoardLaneHeader({
  column,
  count,
  collapsed = false,
  onToggleCollapse,
  t,
  pulse = false,
  onBulkMove,
  columns = [],
  canMoveTo,
  laneType = 'attendance',
  fontScale = 100,
}) {
  const { lang } = useLang();
  const icon = (base) => Math.max(12, Math.round(base * fontScale / 100 * 0.75));
  const text = (base) => `${Math.max(8, Math.round(base * 11 * fontScale / 100))}px`;
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const bulkMenuRef = useRef(null);

  useEffect(() => {
    if (!bulkMenuOpen) return;
    const handler = (e) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target)) {
        setBulkMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [bulkMenuOpen]);

  const moveTargets = columns.filter((c) => {
    if (c.id === column.id) return false;
    if (canMoveTo && !canMoveTo(column.id, c.id)) return false;
    return true;
  });
  const title = t(column.i18nKey) || column.name;
  const collapseLabel = collapsed
    ? (t('operations_board_expand_lane') || 'Expand lane')
    : (t('operations_board_collapse_lane') || 'Collapse lane');

  const isTerminalLane = column.id === 'APPROVED' || column.id === 'REJECTED';
  const headerBg = isTerminalLane ? `${column.color}18` : undefined;

  if (collapsed) {
    return (
      <KanbanHeader className="operations-board-lane-header operations-board-lane-header-collapsed">
        <ColoredTooltip title={collapseLabel} color={column.color} placement="top">
          <button
            type="button"
            className="operations-board-lane-collapse-toggle"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCollapse?.(column.id);
            }}
            aria-label={collapseLabel}
            data-testid={`operations-board-lane-expand-${column.id}`}
          >
            {laneType === 'workflow' ? (
              <WorkflowIcon size={icon(16)} style={{ color: column.color }} aria-hidden />
            ) : (
              <span
                className={`operations-board-lane-collapsed-dot ${pulse ? gridStyles.legendDotPulse : ''}`}
                style={{ width: icon(12), height: icon(12), backgroundColor: column.color, '--dot-color': column.color }}
                aria-hidden
              />
            )}
            <span className="operations-board-lane-collapsed-count" style={{ color: column.color, fontSize: text(0.75) }}>
              {count}
            </span>
            {lang === 'ar' ? <PanelRightOpen size={icon(18)} className="operations-board-lane-collapse-icon" style={{ color: column.color }} aria-hidden /> : <PanelLeftOpen size={icon(18)} className="operations-board-lane-collapse-icon" style={{ color: column.color }} aria-hidden />}
          </button>
        </ColoredTooltip>
      </KanbanHeader>
    );
  }

  return (
    <KanbanHeader className="operations-board-lane-header" style={headerBg ? { background: headerBg } : undefined}>
      <div
        className="grid items-center gap-1"
        style={{ gridTemplateColumns: '28px 1fr 28px' }}
      >
        <div className="flex items-center justify-center" style={{ minWidth: 0 }}>
          {onBulkMove && moveTargets.length > 0 && (
            <div ref={bulkMenuRef} className="relative">
              <ColoredTooltip title={t('operations_board_bulk_move') || 'Move all to…'} color={column.color} placement="top">
                <button
                  type="button"
                  className="operations-board-lane-bulk-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBulkMenuOpen((v) => !v);
                  }}
                  aria-label={t('operations_board_bulk_move') || 'Move all to…'}
                  data-testid={`operations-board-lane-bulk-${column.id}`}
                >
                  <ArrowRightLeft size={icon(18)} style={{ color: column.color }} />
                </button>
              </ColoredTooltip>
              {bulkMenuOpen && (
                <div
                  className="operations-board-bulk-menu"
                  data-testid={`operations-board-bulk-menu-${column.id}`}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    ...(lang === 'ar' ? { right: 'auto', left: 0 } : { right: 0, left: 'auto' }),
                    zIndex: 1000,
                    minWidth: '150px',
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  {moveTargets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      className="operations-board-bulk-menu-item"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBulkMenuOpen(false);
                        onBulkMove(column.id, target.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${target.color}1a`;
                        e.currentTarget.style.color = target.color;
                        e.currentTarget.style.boxShadow = `0 2px 8px ${target.color}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.color = '';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 2px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        transition: 'all 0.15s ease',
                      }}
                      data-testid={`operations-board-bulk-move-${column.id}-to-${target.id}`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: target.color }} />
                      {t(target.i18nKey) || target.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 min-w-0 overflow-hidden">
          {laneType === 'workflow' ? (
            <WorkflowIcon size={icon(20)} style={{ color: column.color, flexShrink: 0 }} aria-hidden />
          ) : (
            <div
              className={`h-3 w-3 shrink-0 rounded-full ring-2 ring-background ${pulse ? gridStyles.legendDotPulse : ''}`}
              style={{ backgroundColor: column.color, '--dot-color': column.color }}
            />
          )}
          {laneType === 'workflow' && (
            <span
              className="text-xs font-semibold tabular-nums shrink-0 flex items-center justify-center"
              style={{
                color: column.color,
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                background: `${column.color}22`,
                boxShadow: `0 1px 3px ${column.color}40`,
                padding: '0 4px',
                fontSize: text(0.75),
              }}
            >
              {count}
            </span>
          )}
          <span
            className="text-center font-semibold text-sm truncate min-w-0"
            style={{ color: column.color, fontSize: text(0.875) }}
          >
            {title}
          </span>
          {isTerminalLane && (
            <Lock size={icon(12)} className="shrink-0" style={{ color: column.color, opacity: 0.7 }} aria-hidden />
          )}
          {laneType !== 'workflow' && (
            <span
              className="text-xs font-semibold tabular-nums shrink-0 flex items-center justify-center"
              style={{
                color: column.color,
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                background: `${column.color}22`,
                boxShadow: `0 1px 3px ${column.color}40`,
                padding: '0 4px',
                fontSize: text(0.75),
              }}
            >
              {count}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center" style={{ minWidth: 0 }}>
          <ColoredTooltip title={collapseLabel} color={column.color} placement="top">
            <button
              type="button"
              className="operations-board-lane-collapse-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleCollapse?.(column.id);
              }}
              aria-label={collapseLabel}
              data-testid={`operations-board-lane-collapse-${column.id}`}
            >
              {lang === 'ar' ? <PanelRightClose size={icon(18)} style={{ color: column.color }} /> : <PanelLeftClose size={icon(18)} style={{ color: column.color }} />}
            </button>
          </ColoredTooltip>
        </div>
      </div>
    </KanbanHeader>
  );
}
