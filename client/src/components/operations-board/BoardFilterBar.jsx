import React, { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { Input } from '@/components/kibo/ui/input';
import { Search } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import DatePicker from '@components/ui/DatePicker/DatePicker';
import BoardScheduleCalendar from './BoardScheduleCalendar.jsx';
import { formatBoardDate } from './operationsBoardDisplayUtils.js';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function BoardFilterBar({
  filters,
  onFilterChange,
  welcomeContext = null,
  panelTab,
  onPanelTabChange,
  onClassSessionClick,
}) {
  const { t, lang, isRTL } = useLang();
  const theme = useTheme();

  const selectedDate = filters.date ? new Date(filters.date) : new Date();

  const handleFilterUpdate = useCallback(
    (key, value) => {
      const newFilters = { ...filters, date: filters.date || todayIso() };
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
      <Tabs
        value={panelTab}
        onChange={(_, value) => onPanelTabChange?.(value)}
        variant="fullWidth"
        sx={{
          minHeight: 38,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { minHeight: 38, textTransform: 'none', fontSize: '0.8125rem' },
        }}
      >
        <Tab value="board" label={t('operations_board_tab_board')} data-testid="operations-board-tab-board" />
        <Tab
          value="calendar"
          label={`${t('operations_board_tab_calendar')} · ${formatBoardDate(selectedDate, lang)}`}
          data-testid="operations-board-tab-calendar"
        />
      </Tabs>

      {panelTab === 'board' && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ p: 1.25 }}
        >
          <DatePicker
            value={filters.date || todayIso()}
            onChange={handleDateSelect}
            theme={theme.palette.mode}
            style={{ width: 140, flexShrink: 0 }}
            data-testid="operations-board-date"
          />
          <Box sx={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                [isRTL ? 'right' : 'left']: 12,
                color: theme.palette.text.secondary,
                pointerEvents: 'none',
              }}
            />
            <Input
              type="text"
              placeholder={t('operations_board_search')}
              value={filters.search || ''}
              onChange={(e) => handleFilterUpdate('search', e.target.value)}
              className={isRTL ? 'pr-9' : 'pl-9'}
              data-testid="operations-board-search"
            />
          </Box>
        </Stack>
      )}

      {panelTab === 'calendar' && (
        <Box sx={{ p: 1.25 }}>
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
