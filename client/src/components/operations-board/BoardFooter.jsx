import React from 'react';
import { IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { KanbanSquare, List, Table2, Maximize2, Minimize2 } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';

const VIEW_ICONS = {
  kanban: KanbanSquare,
  list: List,
  table: Table2,
};

export default function BoardFooter({
  columns = [],
  view,
  onViewChange,
  embedded = false,
  expanded = false,
  onToggleExpand,
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const viewOptions = [
    { key: 'kanban', label: t('operations_board_view_board'), icon: VIEW_ICONS.kanban },
    { key: 'list', label: t('operations_board_view_list'), icon: VIEW_ICONS.list },
    { key: 'table', label: t('operations_board_view_table'), icon: VIEW_ICONS.table },
  ];

  return (
    <footer
      className={`${gridStyles.statusLegend} ${gridStyles.statusLegendBottom} operations-board-footer`}
      data-testid="operations-board-footer"
      style={{
        marginTop: 'auto',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65em', flex: 1 }}>
        {columns.map((col) => (
          <div key={col.id} className={gridStyles.legendItem} data-testid={`operations-board-legend-${col.id}`}>
            <span
              className={gridStyles.legendDot}
              style={{ background: col.color }}
            />
            <span>{t(col.i18nKey) || col.name}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, next) => next && onViewChange(next)}
          aria-label={t('operations_board_view_mode')}
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              gap: 0.5,
              px: 1,
              py: 0.35,
              fontSize: '0.78rem',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#94a3b8' : '#64748b',
            },
            '& .MuiToggleButton-root.Mui-selected': {
              bgcolor: isDark ? 'rgba(51,65,85,0.9)' : '#1e293b',
              color: '#f8fafc',
            },
          }}
        >
          {viewOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <ToggleButton key={opt.key} value={opt.key} data-testid={`operations-board-view-${opt.key}`}>
                <Icon size={14} />
                <span className="hidden sm:inline">{opt.label}</span>
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>

        {embedded && onToggleExpand && (
          <Tooltip title={expanded ? t('operations_board_collapse') : t('operations_board_expand')}>
            <IconButton
              size="small"
              onClick={onToggleExpand}
              className={gridStyles.legendExpandBtn}
              data-testid="operations-board-expand"
              aria-label={expanded ? t('operations_board_collapse') : t('operations_board_expand')}
              sx={{
                width: 24,
                height: 24,
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#94a3b8' : '#64748b',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
                },
              }}
            >
              {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </IconButton>
          </Tooltip>
        )}
      </div>
    </footer>
  );
}
