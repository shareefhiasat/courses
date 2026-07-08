import React, { useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useLang } from '@contexts/LangContext';
import { formatBoardDate, summarizeBoardByColumn } from './operationsBoardDisplayUtils.js';

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function BoardDateCalendar({
  selectedDate,
  onDateSelect,
  boardData = [],
  columns = [],
}) {
  const { t, lang } = useLang();
  const theme = useTheme();
  const parsedSelected = useMemo(
    () => (selectedDate ? new Date(selectedDate) : new Date()),
    [selectedDate]
  );
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parsedSelected));

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const isSelectedDateLoaded = useMemo(() => {
    if (!boardData.length) return false;
    const first = boardData[0]?.date;
    if (!first) return false;
    return isSameDay(new Date(first), parsedSelected);
  }, [boardData, parsedSelected]);

  const statusSummary = useMemo(
    () => (isSelectedDateLoaded ? summarizeBoardByColumn(boardData) : {}),
    [boardData, isSelectedDateLoaded]
  );

  const monthLabel = format(viewMonth, 'MMMM yyyy');

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      data-testid="operations-board-date-calendar"
    >
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          p: 1.5,
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.5)' : '#fff',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <IconButton size="small" onClick={() => setViewMonth((m) => addMonths(m, -1))} aria-label={t('calendar_previous')}>
            <ChevronLeft size={18} />
          </IconButton>
          <Typography variant="subtitle2" fontWeight={700}>
            {monthLabel}
          </Typography>
          <IconButton size="small" onClick={() => setViewMonth((m) => addMonths(m, 1))} aria-label={t('calendar_next')}>
            <ChevronRight size={18} />
          </IconButton>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
            mb: 0.5,
          }}
        >
          {WEEKDAY_KEYS.map((key) => (
            <Typography
              key={key}
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ fontWeight: 600, py: 0.5 }}
            >
              {t(`operations_board_weekday_${key}`)}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
          }}
        >
          {monthDays.map((day) => {
            const inMonth = isSameMonth(day, viewMonth);
            const selected = isSameDay(day, parsedSelected);
            const isToday = isSameDay(day, new Date());
            return (
              <Box
                key={day.toISOString()}
                component="button"
                type="button"
                onClick={() => onDateSelect(day)}
                data-testid={`operations-board-calendar-day-${format(day, 'yyyy-MM-dd')}`}
                sx={{
                  border: '1px solid',
                  borderColor: selected
                    ? 'primary.main'
                    : isToday
                      ? 'info.main'
                      : 'divider',
                  borderRadius: 1.5,
                  bgcolor: selected
                    ? 'primary.main'
                    : inMonth
                      ? theme.palette.mode === 'dark' ? 'rgba(30,41,59,0.5)' : '#f8fafc'
                      : 'transparent',
                  color: selected ? 'primary.contrastText' : inMonth ? 'text.primary' : 'text.disabled',
                  minHeight: 52,
                  p: 0.5,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.15s, background-color 0.15s',
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: selected ? 'primary.main' : 'action.hover',
                  },
                }}
              >
                <Typography variant="body2" fontWeight={selected || isToday ? 700 : 500}>
                  {format(day, 'd')}
                </Typography>
                {selected && (
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                    {t('operations_board_calendar_selected')}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          width: { xs: '100%', md: 280 },
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.5)' : '#fff',
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          {t('operations_board_calendar_details')}
        </Typography>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          {formatBoardDate(parsedSelected, lang)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {format(parsedSelected, 'EEEE')}
        </Typography>

        {isSelectedDateLoaded ? (
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {t('operations_board_calendar_summary', { count: boardData.length })}
            </Typography>
            {columns.map((col) => (
              <Stack key={col.id} direction="row" alignItems="center" justifyContent="space-between">
                <Chip
                  size="small"
                  variant="outlined"
                  label={t(col.i18nKey) || col.name}
                  icon={(
                    <Box
                      component="span"
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: col.color }}
                    />
                  )}
                  sx={{ borderColor: `${col.color}55` }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {statusSummary[col.id] || 0}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('operations_board_calendar_pick_hint')}
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}
