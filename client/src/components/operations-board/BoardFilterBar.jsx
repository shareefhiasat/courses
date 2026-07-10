import React, { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, ToggleButton, ToggleButtonGroup, IconButton } from '@mui/material';
import { ArrowUpDown, ArrowDownAZ, Columns3 } from 'lucide-react';
import { Input } from '@/components/kibo/ui/input';
import { useLang } from '@contexts/LangContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import BoardScheduleCalendar from './BoardScheduleCalendar.jsx';

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
}) {
  const { t } = useLang();
  const theme = useTheme();

  const selectedDate = filters.date ? new Date(`${filters.date}T12:00:00`) : new Date();

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
    (date) => {
      if (!date) return;
      const value = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
      handleFilterUpdate('date', value);
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
        flexShrink: 0,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.95)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.25 }}>
        {onLaneChange && (
          <Tabs
            value={lane}
            onChange={(_, value) => onLaneChange?.(value)}
            sx={{
              minHeight: 30,
              '& .MuiTab-root': { minHeight: 30, textTransform: 'none', fontSize: '0.8125rem', py: 0.25, fontWeight: 600 },
            }}
            data-testid="operations-board-lane-tabs"
          >
            <Tab
              value="attendance"
              label={t('operations_board_tab_attendance') || 'Attendance'}
              title={t('operations_board_tab_attendance') || 'Attendance'}
              data-testid="operations-board-tab-attendance"
            />
            <Tab
              value="status"
              label={t('operations_board_tab_workflow') || 'Workflow'}
              title={t('operations_board_tab_workflow') || 'Workflow'}
              data-testid="operations-board-tab-workflow"
            />
          </Tabs>
        )}
        {lane === 'attendance' && (
          <Tabs
            value={panelTab}
            onChange={(_, value) => onPanelTabChange?.(value)}
            sx={{
              minHeight: 30,
              '& .MuiTab-root': { minHeight: 30, textTransform: 'none', fontSize: '0.8125rem', py: 0.25 },
            }}
          >
            <Tab value="board" label={t('operations_board_tab_board')} title={t('operations_board_tab_board')} data-testid="operations-board-tab-board" />
            <Tab
              value="calendar"
              label={t('operations_board_tab_calendar')}
              title={t('operations_board_tab_calendar')}
              data-testid="operations-board-tab-calendar"
            />
          </Tabs>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-end' }}>
          {panelTab === 'board' && (
            <Box
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
        <Box sx={{ p: 1 }}>
          <BoardScheduleCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            welcomeContext={welcomeContext}
            onClassSessionClick={handleClassSessionClick}
          />
        </Box>
      )}
    </Box>
  );
}
