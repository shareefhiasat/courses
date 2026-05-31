import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { useLang } from '@contexts/LangContext';

/**
 * ClassroomCalendar component - displays classroom availability in a calendar grid
 * Reusable component that can be used in different views (classroom, instructor, workload)
 */
const ClassroomCalendar = ({
  rows = [], // Classrooms or instructors
  columns = [], // Days or time slots
  cellData = {}, // Data for each cell { [rowId_colId]: { status, ... } }
  onCellClick = null,
  onCellRightClick = null,
  t = (key) => key,
  theme: customTheme,
  'data-testid': dataTestId = 'classroom-calendar'
}) => {
  const muiTheme = useTheme();
  const { isRTL } = useLang();
  const effectiveTheme = customTheme || muiTheme;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCellStatus = (rowId, colId) => {
    const key = `${rowId}_${colId}`;
    return cellData[key] || { status: 'available' };
  };

  const getCellColor = (status) => {
    switch (status) {
      case 'available':
        return effectiveTheme.palette.success.main;
      case 'unavailable':
        return effectiveTheme.palette.error.main;
      case 'partial':
        return effectiveTheme.palette.warning.main;
      default:
        return effectiveTheme.palette.grey[300];
    }
  };

  return (
    <Box data-testid={dataTestId} sx={{ width: '100%', overflowX: 'auto' }}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          backgroundColor: effectiveTheme.palette.background.paper,
          // Responsive padding
          '@media (max-width: 768px)': {
            p: 1,
          },
        }}
      >
        {/* Header row - day columns */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={{ xs: 2, sm: 2, md: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: effectiveTheme.palette.text.primary,
                textAlign: isRTL ? 'right' : 'left',
                // Responsive font size
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              {t('classroom') || 'Classroom'}
            </Typography>
          </Grid>
          {daysOfWeek.map((day) => (
            <Grid key={day} size={{ xs: 1.4, sm: 1.4, md: 1.4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: effectiveTheme.palette.text.primary,
                  textAlign: 'center',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                }}
              >
                {t(day.toLowerCase()) || day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Data rows */}
        {rows.map((row) => (
          <Grid
            container
            key={row.id}
            spacing={1}
            sx={{
              mb: 1,
              '&:hover': {
                backgroundColor: effectiveTheme.palette.action.hover,
                borderRadius: 1,
              },
            }}
          >
            {/* Row label */}
            <Grid
              size={{ xs: 2, sm: 2, md: 2 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isRTL ? 'flex-end' : 'flex-start',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: effectiveTheme.palette.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                }}
              >
                {row.nameEn || row.name || row.displayName || row.code}
              </Typography>
            </Grid>

            {/* Day cells */}
            {daysOfWeek.map((day) => {
              const cellStatus = getCellStatus(row.id, day);
              const cellColor = getCellColor(cellStatus.status);

              return (
                <Grid key={`${row.id}-${day}`} size={{ xs: 1.4, sm: 1.4, md: 1.4 }}>
                  <Box
                    data-testid={`${dataTestId}-cell-${row.id}-${day}`}
                    onClick={() => onCellClick && onCellClick(row, day, cellStatus)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onCellRightClick && onCellRightClick(e, row, day, cellStatus);
                    }}
                    sx={{
                      height: { xs: 32, sm: 40, md: 48 },
                      backgroundColor: cellColor,
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                      },
                      // Responsive adjustments
                      '@media (max-width: 768px)': {
                        height: 28,
                      },
                    }}
                  >
                    {cellStatus.count && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: effectiveTheme.palette.getContrastText(cellColor),
                          fontWeight: 600,
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        }}
                      >
                        {cellStatus.count}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        ))}

        {/* Empty state */}
        {rows.length === 0 && (
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
              color: effectiveTheme.palette.text.secondary,
            }}
          >
            <Typography variant="body1">
              {t('no_classrooms') || 'No classrooms configured'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClassroomCalendar;
