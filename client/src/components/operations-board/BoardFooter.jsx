import React from 'react';
import { IconButton, Tabs, Tab } from '@mui/material';
import { KanbanSquare, Table2, Maximize2, Minimize2, History } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import BoardLegend from './BoardLegend.jsx';

const VIEW_ICONS = {
  kanban: KanbanSquare,
  table: Table2,
};

function FooterControls({
  activeView,
  onViewChange,
  viewOptions,
  isDark,
  t,
  onOpenHistory,
  classInfo,
  date,
  embedded,
  expanded,
  onToggleExpand,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <Tabs
        value={activeView}
        onChange={(_, next) => next && onViewChange(next)}
        aria-label={t('operations_board_view_mode')}
        data-tour="operations-board-view-mode"
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
              icon={(
                <ColoredTooltip title={opt.label} color={isDark ? '#94a3b8' : '#64748b'} placement="top">
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} />
                  </span>
                </ColoredTooltip>
              )}
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
  );
}

export default function BoardFooter({
  columns = [],
  lane = 'attendance',
  view,
  onViewChange,
  embedded = false,
  expanded = false,
  onToggleExpand,
  showLegend = true,
  onOpenHistory = null,
  classInfo = null,
  date = null,
  roleContext = {},
  panelTab = 'board',
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isCalendarTab = panelTab === 'calendar';

  const viewOptions = [
    { key: 'kanban', label: t('operations_board_view_board'), icon: VIEW_ICONS.kanban },
    { key: 'table', label: t('operations_board_view_table'), icon: VIEW_ICONS.table },
  ];
  const activeView = viewOptions.some((opt) => opt.key === view) ? view : 'kanban';

  const legendRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.25rem',
    width: '100%',
    padding: '4px 12px',
    borderTop: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : '#e2e8f0'}`,
  };

  const controls = (
    <FooterControls
      activeView={activeView}
      onViewChange={onViewChange}
      viewOptions={viewOptions}
      isDark={isDark}
      t={t}
      onOpenHistory={onOpenHistory}
      classInfo={classInfo}
      date={date}
      embedded={embedded}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
    />
  );

  if (isCalendarTab && showLegend) {
    return (
      <div
        className="operations-board-footer-stack"
        data-testid="operations-board-footer-stack"
        style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        <div
          className={`${gridStyles.statusLegend} operations-board-footer-legends`}
          style={legendRowStyle}
          data-testid="operations-board-calendar-extras-legend"
        >
          <BoardLegend
            bare
            showAttendance={false}
            showWorkflow={false}
            showScheduleExtras
            roleContext={roleContext}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem', width: '100%' }}
          />
        </div>
        <div
          className={`${gridStyles.statusLegend} operations-board-footer-legends`}
          style={legendRowStyle}
          data-testid="operations-board-calendar-lane-legend"
        >
          <BoardLegend
            bare
            showAttendance={lane === 'attendance'}
            showWorkflow={lane === 'status'}
            includeNotTaken={lane === 'status'}
            roleContext={roleContext}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem', width: '100%' }}
            data-tour="operations-board-legend"
          />
        </div>
        <footer
          className={`${gridStyles.statusLegend} ${gridStyles.statusLegendBottom} operations-board-footer operations-board-footer-controls`}
          data-testid="operations-board-footer"
          style={{
            justifyContent: 'flex-end',
            gap: '0.75rem',
            borderTop: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : '#e2e8f0'}`,
          }}
        >
          {controls}
        </footer>
      </div>
    );
  }

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
      {showLegend && (
        <BoardLegend
          bare
          showAttendance={lane === 'attendance'}
          showWorkflow={lane === 'status'}
          roleContext={roleContext}
          className="legend-items-row"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: 0 }}
          data-tour="operations-board-legend"
        />
      )}
      {controls}
    </footer>
  );
}
