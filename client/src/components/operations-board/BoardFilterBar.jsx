import React, { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, ToggleButton, ToggleButtonGroup, IconButton } from '@mui/material';
import { ArrowUpDown, ArrowDownAZ, Calendar, KanbanSquare, Workflow, Users, ChevronLeft, ChevronRight, User, UserX, Maximize2, LayoutTemplate } from 'lucide-react';
import DatePicker from '@components/ui/DatePicker/DatePicker';
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
  onAutoFitContent,
  onAutoFitScreen,
  showLaneReset = false,
  roleContext = {},
  embedded = false,
  expanded = false,
  onToggleExpand,
  viewMode = 'day',
  showAvatars = true,
  onToggleShowAvatars,
}) {
  const { t, lang } = useLang();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hideNotesParticipation = shouldHideNotesParticipation(roleContext);
  const isInstructor = roleContext?.isInstructor && !roleContext?.isAdmin && !roleContext?.isHR && !roleContext?.isSuperAdmin;

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 0.75, py: 0.15 }}>
        {onLaneChange && !isInstructor && (
          <Tabs
            value={lane}
            onChange={(_, value) => onLaneChange?.(value)}
            data-tour="operations-board-lane-tabs"
            data-filter-tabs="true"
            sx={{
              minHeight: 24,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-flexContainer': { gap: '2px' },
              '& .MuiTab-root': {
                minHeight: 24,
                textTransform: 'none',
                fontSize: '0.7rem',
                py: 0.15,
                px: 0.75,
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
              label={(
                <ColoredTooltip title={viewMode === 'week' ? (t('operations_board_attendance_week_disabled') || 'Attendance board is not available in week mode') : (t('operations_board_tab_attendance') || 'Attendance')} placement="top">
                  <span>{t('operations_board_tab_attendance') || 'Attendance'}</span>
                </ColoredTooltip>
              )}
              data-testid="operations-board-tab-attendance"
              disabled={viewMode === 'week'}
            />
            {!isInstructor && (
            <Tab
              value="status"
              icon={<Workflow size={14} />}
              iconPosition="start"
              label={(
                <ColoredTooltip title={t('operations_board_tab_workflow') || 'Workflow'} placement="top">
                  <span>{t('operations_board_tab_workflow') || 'Workflow'}</span>
                </ColoredTooltip>
              )}
              data-testid="operations-board-tab-workflow"
            />
            )}
          </Tabs>
        )}
        {onLaneChange && !isInstructor && (
          <Tabs
            value={panelTab}
            onChange={(_, value) => onPanelTabChange?.(value)}
            data-tour="operations-board-panel-tabs"
            data-filter-tabs="true"
            sx={{
              minHeight: 24,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-flexContainer': { gap: '2px' },
              '& .MuiTab-root': {
                minHeight: 24,
                textTransform: 'none',
                fontSize: '0.7rem',
                py: 0.15,
                px: 0.75,
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
              label={(
                <ColoredTooltip title={t('operations_board_tab_board')} placement="top">
                  <span>{t('operations_board_tab_board')}</span>
                </ColoredTooltip>
              )}
              data-testid="operations-board-tab-board"
            />
            <Tab
              value="calendar"
              icon={<Calendar size={14} />}
              iconPosition="start"
              label={(
                <ColoredTooltip title={t('operations_board_tab_calendar')} placement="top">
                  <span>{t('operations_board_tab_calendar')}</span>
                </ColoredTooltip>
              )}
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
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  '&::placeholder': {
                    color: isDark ? '#94a3b8' : '#64748b',
                    opacity: 1,
                  },
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
          {showLaneReset && onAutoFitContent && (
            <ColoredTooltip
              title={t('operations_board_auto_fit_content') || 'Auto-fit content'}
              color="#3b82f6"
              placement="bottom"
            >
              <IconButton
                size="small"
                onClick={onAutoFitContent}
                data-testid="operations-board-auto-fit-content"
                sx={{ width: 32, height: 32, flexShrink: 0 }}
              >
                <LayoutTemplate size={16} />
              </IconButton>
            </ColoredTooltip>
          )}
          {showLaneReset && onAutoFitScreen && (
            <ColoredTooltip
              title={t('operations_board_auto_fit_screen') || 'Auto-fit screen'}
              color="#3b82f6"
              placement="bottom"
            >
              <IconButton
                size="small"
                onClick={onAutoFitScreen}
                data-testid="operations-board-auto-fit-screen"
                sx={{ width: 32, height: 32, flexShrink: 0 }}
              >
                <Maximize2 size={16} />
              </IconButton>
            </ColoredTooltip>
          )}
          {panelTab === 'board' && lane === 'attendance' && onToggleShowAvatars && !isInstructor && (
            <ColoredTooltip
              title={showAvatars ? (t('operations_board_hide_avatars') || 'Hide avatars') : (t('operations_board_show_avatars') || 'Show avatars')}
              color="#3b82f6"
              placement="bottom"
            >
              <IconButton
                size="small"
                onClick={onToggleShowAvatars}
                data-testid="operations-board-toggle-avatars"
                sx={{ width: 32, height: 32, flexShrink: 0, color: showAvatars ? 'primary.main' : 'text.secondary' }}
              >
                {showAvatars ? <User size={18} /> : <UserX size={18} />}
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
