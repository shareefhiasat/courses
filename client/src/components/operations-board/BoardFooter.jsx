import React from 'react';
import { IconButton, Tabs, Tab } from '@mui/material';
import { KanbanSquare, Table2, Maximize2, Minimize2, History, Star } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';

const VIEW_ICONS = {
  kanban: KanbanSquare,
  table: Table2,
};

export default function BoardFooter({
  columns = [],
  view,
  onViewChange,
  embedded = false,
  expanded = false,
  onToggleExpand,
  showLegend = true,
  onOpenHistory = null,
  classInfo = null,
  date = null,
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const viewOptions = [
    { key: 'kanban', label: t('operations_board_view_board'), icon: VIEW_ICONS.kanban },
    { key: 'table', label: t('operations_board_view_table'), icon: VIEW_ICONS.table },
  ];

  return (
    <footer
      className={`${gridStyles.statusLegend} ${gridStyles.statusLegendBottom} operations-board-footer`}
      data-testid="operations-board-footer"
      style={{
        marginTop: 'auto',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5em', flex: 1 }}>
        {showLegend && columns.map((col) => (
          <div key={col.id} className={gridStyles.legendItem} data-testid={`operations-board-legend-${col.id}`}>
            <span
              className={`${gridStyles.legendDot} ${col.id === 'NOT_TAKEN' ? gridStyles.legendDotPulse : ''}`}
              style={{ background: col.color }}
            />
            <span className={gridStyles.legendLabel} style={{ color: col.color }}>{t(col.i18nKey) || col.name}</span>
          </div>
        ))}
        {showLegend && (
          <>
            <div className={gridStyles.legendItem} data-testid="operations-board-legend-note-star">
              <Star size={12} fill="#ef4444" color="#ef4444" />
              <span className={gridStyles.legendLabel} style={{ color: '#ef4444' }}>{t('operations_board_legend_note')}</span>
            </div>
            <div className={gridStyles.legendItem} data-testid="operations-board-legend-participation-star">
              <Star size={12} fill="#3b82f6" color="#3b82f6" />
              <span className={gridStyles.legendLabel} style={{ color: '#3b82f6' }}>{t('operations_board_legend_participation')}</span>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Tabs
          value={view}
          onChange={(_, next) => next && onViewChange(next)}
          aria-label={t('operations_board_view_mode')}
          sx={{
            minHeight: 30,
            '& .MuiTab-root': {
              minHeight: 30,
              textTransform: 'none',
              fontSize: '0.78rem',
              px: 1,
              py: 0.25,
              minWidth: 'auto',
              gap: 0.5,
              color: isDark ? '#94a3b8' : '#64748b',
            },
            '& .MuiTab-root.Mui-selected': {
              color: '#3b82f6',
            },
            '& .MuiTabs-indicator': {
              height: 2,
            },
          }}
        >
          {viewOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <Tab
                key={opt.key}
                value={opt.key}
                data-testid={`operations-board-view-${opt.key}`}
                icon={<Icon size={18} />}
                title={opt.label}
                aria-label={opt.label}
              />
            );
          })}
        </Tabs>

        {onOpenHistory && classInfo?.id && date && (
          <ColoredTooltip
            title={t('operations_board_class_logs') || 'Class logs'}
            color="#3b82f6"
            placement="top"
          >
            <IconButton
              size="small"
              onClick={() => onOpenHistory(classInfo, date, 'lecture')}
              data-testid="operations-board-open-logs"
              aria-label={t('operations_board_class_logs') || 'Class logs'}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 0,
                bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#94a3b8' : '#64748b',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
                },
              }}
            >
              <History size={14} />
            </IconButton>
          </ColoredTooltip>
        )}

        {embedded && onToggleExpand && (
          <ColoredTooltip
            title={expanded ? t('operations_board_collapse') : t('operations_board_expand')}
            color="#8b5cf6"
            placement="top"
          >
            <IconButton
              size="small"
              onClick={onToggleExpand}
              className={gridStyles.legendExpandBtn}
              data-testid="operations-board-expand"
              aria-label={expanded ? t('operations_board_collapse') : t('operations_board_expand')}
              sx={{
                width: 24,
                height: 24,
                borderRadius: 0,
                bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#94a3b8' : '#64748b',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
                },
              }}
            >
              {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </IconButton>
          </ColoredTooltip>
        )}
      </div>
    </footer>
  );
}
