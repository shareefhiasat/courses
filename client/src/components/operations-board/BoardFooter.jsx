import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  KanbanSquare,
  List,
  Table2,
  Maximize2,
  Minimize2,
  ArrowLeft,
} from 'lucide-react';
import { useLang } from '@contexts/LangContext';

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
  showBack = false,
  onBack,
}) {
  const { t, isRTL } = useLang();
  const theme = useTheme();

  const viewOptions = [
    { key: 'kanban', label: t('operations_board_view_board'), icon: VIEW_ICONS.kanban },
    { key: 'list', label: t('operations_board_view_list'), icon: VIEW_ICONS.list },
    { key: 'table', label: t('operations_board_view_table'), icon: VIEW_ICONS.table },
  ];

  return (
    <Box
      component="footer"
      className="operations-board-footer"
      data-testid="operations-board-footer"
      sx={{
        mt: 'auto',
        pt: 1.5,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.9)',
        borderRadius: '0 0 calc(var(--radius) - 2px) calc(var(--radius) - 2px)',
        px: { xs: 1, sm: 1.5 },
        py: 1.25,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.75, fontWeight: 600, letterSpacing: 0.3 }}
          >
            {t('operations_board_legend')}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
            {columns.map((col) => (
              <Chip
                key={col.id}
                size="small"
                variant="outlined"
                label={t(col.i18nKey) || col.name}
                icon={(
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: col.color,
                      ml: isRTL ? 0 : 0.5,
                      mr: isRTL ? 0.5 : 0,
                    }}
                  />
                )}
                sx={{
                  borderColor: `${col.color}55`,
                  '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
                }}
                data-testid={`operations-board-legend-${col.id}`}
              />
            ))}
          </Stack>
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5 }}
        />

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent={{ xs: 'space-between', md: 'flex-end' }}
          sx={{ flexShrink: 0 }}
        >
          {showBack && (
            <Tooltip title={t('operations_board_back_workflow')}>
              <IconButton
                size="small"
                onClick={onBack}
                data-testid="operations-board-back"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <ArrowLeft size={16} />
              </IconButton>
            </Tooltip>
          )}

          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, next) => next && onViewChange(next)}
            aria-label={t('operations_board_view_mode')}
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                gap: 0.75,
                px: 1.25,
                py: 0.5,
                fontSize: '0.8125rem',
              },
            }}
          >
            {viewOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <ToggleButton
                  key={opt.key}
                  value={opt.key}
                  data-testid={`operations-board-view-${opt.key}`}
                >
                  <Icon size={15} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    {opt.label}
                  </Box>
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>

          {embedded && onToggleExpand && (
            <Tooltip title={expanded ? t('operations_board_collapse') : t('operations_board_expand')}>
              <IconButton
                size="small"
                onClick={onToggleExpand}
                data-testid="operations-board-expand"
                sx={{ border: 1, borderColor: 'divider' }}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
