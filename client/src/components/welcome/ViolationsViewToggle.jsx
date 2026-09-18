import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Table2, CalendarDays } from 'lucide-react';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { useLang } from '@contexts/LangContext';

export default function ViolationsViewToggle({
  isAr,
  isDark,
  viewMode,
  onTable,
  onCalendar,
  testId,
}) {
  const { t } = useLang();
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, height: 32 }}
      data-testid={testId}
    >
      <ColoredTooltip title={t('violations.calendar')} color="#3b82f6" placement="bottom">
        <IconButton
          size="small"
          aria-label={t('violations.calendar')}
          onClick={onCalendar}
          sx={{
            width: 32,
            height: 32,
            borderRadius: '6px',
            color: viewMode === 'calendar' ? '#3b82f6' : 'text.secondary',
            bgcolor: viewMode === 'calendar' ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : 'transparent',
            '&:hover': {
              bgcolor: viewMode === 'calendar' ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)') : (isDark ? 'rgba(51,65,85,0.6)' : 'rgba(241,245,249,1)'),
            },
          }}
        >
          <CalendarDays size={18} />
        </IconButton>
      </ColoredTooltip>
      <ColoredTooltip title={t('violations.table')} color="#3b82f6" placement="bottom">
        <IconButton
          size="small"
          aria-label={t('violations.table')}
          onClick={onTable}
          sx={{
            width: 32,
            height: 32,
            borderRadius: '6px',
            color: viewMode === 'table' ? '#3b82f6' : 'text.secondary',
            bgcolor: viewMode === 'table' ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)') : 'transparent',
            '&:hover': {
              bgcolor: viewMode === 'table' ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)') : (isDark ? 'rgba(51,65,85,0.6)' : 'rgba(241,245,249,1)'),
            },
          }}
        >
          <Table2 size={18} />
        </IconButton>
      </ColoredTooltip>
    </Box>
  );
}
