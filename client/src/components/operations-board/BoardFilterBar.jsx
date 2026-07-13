import React, { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, ToggleButton, ToggleButtonGroup, IconButton } from '@mui/material';
import { ArrowUpDown, ArrowDownAZ, Columns3, Calendar, KanbanSquare, Workflow, Users } from 'lucide-react';
import { Input } from '@/components/kibo/ui/input';
import { useLang } from '@contexts/LangContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import BoardScheduleCalendar from './BoardScheduleCalendar.jsx';
import { shouldHideNotesParticipation } from './hrAttendancePrivacy.js';

export default function BoardFilterBar({
  filters,
  onFilterChange,
  welcomeContext = null,
  panelTab,
  onPanelTabChange,
  onClassSessionClick,
  sortBy = 'system',
  onSortChange,
  lane = 'attendance',
  onLaneChange,
  onResetLaneWidths,
  showLaneReset = false,
  roleContext = {},
  embedded = false,
  expanded = false,
  onToggleExpand,
  viewMode = 'day',
}) {
  const { t } = useLang();
  const theme = useTheme();
  const hideNotesParticipation = shouldHideNotesParticipation(roleContext);

  const selectedDate = filters.date || new Date().toISOString().slice(0, 10);

  const handleFilterUpdate = useCallback(
    (key, value) => {
      const newFilters = { ...filters };
      if (value) newFilters[key] = value;
      else delete newFilters[key];
      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  const handleDateSelect = useCallback(
    (isoDate) => {
      if (!isoDate) return;
      handleFilterUpdate('date', isoDate);
    },
    [handleFilterUpdate]
  );

  const handleClassSessionClick = useCallback(
    (session) => {
      onClassSessionClick?.(session);
      onPanelTabChange?.('board');
    },
    [onClassSessionClick, onPanelTabChange]
  );

  return (
    <Box
      className="operations-board-filters"
      data-testid="operations-board-filters"
      sx={{
        flexShrink: panelTab === 'calendar' ? undefined : 0,
        flex: panelTab === 'calendar' ? 1 : undefined,
        display: panelTab === 'calendar' ? 'flex' : undefined,
        flexDirection: panelTab === 'calendar' ? 'column' : undefined,
        minHeight: panelTab === 'calendar' ? 0 : undefined,
        borderRadius: 2,
        border: 0,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.95)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.25 }}>
        {onLaneChange && (
          <Tabs
            value={lane}
            onChange={(_, value) => onLaneChange?.(value)}
            data-tour="operations-board-lane-tabs"
            data-filter-tabs="true"
            sx={{
              minHeight: 30,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-flexContainer': { gap: '2px' },
              '& .MuiTab-root': {
                minHeight: 30,
                textTransform: 'none',
                fontSize: '0.8125rem',
                py: 0.25,
                px: 1.25,
                borderRadius: '999px',
                fontWeight: 500,
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.15s',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff !important',
                  fontWeight: 600,
                  borderColor: 'primary.main',
                },
                '&.Mui-selected.MuiTab-textColorPrimary': {
                  color: '#fff !important',
                },
                '&.Mui-selected.MuiTab-textColorInherit': {
                  color: '#fff !important',
                },
                '&.Mui-selected .MuiTab-icon': {
                  color: '#fff !important',
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: 'action.hover',
                },
              },
            }}
            data-testid="operations-board-lane-tabs"
          >
            <Tab
              value="attendance"
              icon={<Users size={14} />}
              iconPosition="start"
              label={t('operations_board_tab_attendance') || 'Attendance'}
              title={viewMode === 'week' ? (t('operations_board_attendance_week_disabled') || 'Attendance board is not available in week mode') : (t('operations_board_tab_attendance') || 'Attendance')}
              data-testid="operations-board-tab-attendance"
              disabled={viewMode === 'week'}
            />
            <Tab
              value="status"
              icon={<Workflow size={14} />}
              iconPosition="start"
              label={t('operations_board_tab_workflow') || 'Workflow'}
              title={t('operations_board_tab_workflow') || 'Workflow'}
              data-testid="operations-board-tab-workflow"
            />
          </Tabs>
        )}
        {onLaneChange && (
          <Tabs
            value={panelTab}
            onChange={(_, value) => onPanelTabChange?.(value)}
            data-tour="operations-board-panel-tabs"
            data-filter-tabs="true"
            sx={{
              minHeight: 28,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-flexContainer': { gap: '2px' },
              '& .MuiTab-root': {
                minHeight: 28,
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.25,
                px: 1.25,
                borderRadius: '999px',
                fontWeight: 500,
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.15s',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff !important',
                  fontWeight: 600,
                  borderColor: 'primary.main',
                },
                '&.Mui-selected.MuiTab-textColorPrimary': {
                  color: '#fff !important',
                },
                '&.Mui-selected.MuiTab-textColorInherit': {
                  color: '#fff !important',
                },
                '&.Mui-selected .MuiTab-icon': {
                  color: '#fff !important',
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: 'action.hover',
                },
              },
            }}
          >
            <Tab
              value="board"
              icon={<KanbanSquare size={14} />}
              iconPosition="start"
              label={t('operations_board_tab_board')}
              title={t('operations_board_tab_board')}
              data-testid="operations-board-tab-board"
            />
            <Tab
              value="calendar"
              icon={<Calendar size={14} />}
              iconPosition="start"
              label={t('operations_board_tab_calendar')}
              title={t('operations_board_tab_calendar')}
              data-testid="operations-board-tab-calendar"
            />
          </Tabs>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
          {panelTab === 'board' && (
            <Box
              data-tour="operations-board-search"
              sx={{
                position: 'relative',
                flex: 1,
                maxWidth: 220,
                '& input': {
                  '&:focus-visible': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 1px #3b82f6',
                    outline: 'none',
                  },
                },
              }}
            >
              <Input
                type="text"
                placeholder={t('operations_board_search')}
                value={filters.search || ''}
                onChange={(e) => handleFilterUpdate('search', e.target.value)}
                data-testid="operations-board-search"
              />
            </Box>
          )}
          {showLaneReset && onResetLaneWidths && (
            <ColoredTooltip
              title={t('operations_board_reset_lanes') || 'Reset lane widths'}
              color="#3b82f6"
              placement="bottom"
            >
              <IconButton
                size="small"
                onClick={onResetLaneWidths}
                data-testid="operations-board-reset-lanes"
                data-tour="operations-board-reset-lanes"
                sx={{ width: 32, height: 32, flexShrink: 0 }}
              >
                <Columns3 size={16} />
              </IconButton>
            </ColoredTooltip>
          )}
          {(panelTab === 'board' || panelTab === 'table') && onSortChange && (
            <ToggleButtonGroup
              size="small"
              value={sortBy}
              exclusive
              onChange={(_, value) => value && onSortChange(value)}
              sx={{ flexShrink: 0, height: 32 }}
              data-testid="operations-board-sort"
              data-tour="operations-board-sort"
            >
              <ColoredTooltip
                title={t('operations_board_sort_system') || 'System Default'}
                color="#3b82f6"
                placement="bottom"
              >
                <ToggleButton value="system" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                  <ArrowUpDown size={16} />
                </ToggleButton>
              </ColoredTooltip>
              <ColoredTooltip
                title={t('operations_board_sort_alpha') || 'Alphabetical'}
                color="#3b82f6"
                placement="bottom"
              >
                <ToggleButton value="alpha" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                  <ArrowDownAZ size={16} />
                </ToggleButton>
              </ColoredTooltip>
            </ToggleButtonGroup>
          )}
        </Box>
      </Box>

      {panelTab === 'calendar' && (
        <Box sx={{ p: 1, flex: 1, minHeight: 0, overflow: 'auto' }} data-tour="operations-board-calendar">
          <BoardScheduleCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            welcomeContext={welcomeContext}
            onClassSessionClick={handleClassSessionClick}
            lane={lane}
            hideNotesParticipation={hideNotesParticipation}
            embedded={embedded}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
          />
        </Box>
      )}
    </Box>
  );
}
