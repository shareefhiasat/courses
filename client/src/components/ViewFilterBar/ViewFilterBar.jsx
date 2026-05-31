import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Tabs, Tab, Box } from '@mui/material';
import { useLang } from '@contexts/LangContext';

/**
 * ViewFilterBar component - tabs for switching between different views
 * Reusable component for filtering views (classroom, instructor, workload)
 */
const ViewFilterBar = ({
  views = [],
  activeView = '',
  onViewChange = null,
  t = (key) => key,
  theme: customTheme,
  'data-testid': dataTestId = 'view-filter-bar'
}) => {
  const muiTheme = useTheme();
  const { isRTL } = useLang();
  const effectiveTheme = customTheme || muiTheme;

  const handleTabChange = (event, newValue) => {
    onViewChange && onViewChange(newValue);
  };

  return (
    <Box
      data-testid={dataTestId}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        mb: 2,
        // Responsive adjustments
        '@media (max-width: 768px)': {
          mb: 1.5,
        },
      }}
    >
      <Tabs
        value={activeView}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            minWidth: { xs: 100, sm: 120 },
            // RTL support
            ...(isRTL && {
              direction: 'rtl',
            }),
          },
          '& .Mui-selected': {
            fontWeight: 600,
          },
        }}
      >
        {views.map((view) => (
          <Tab
            key={view.id}
            label={t(view.label) || view.label}
            value={view.id}
            icon={view.icon}
            iconPosition="start"
            data-testid={`${dataTestId}-tab-${view.id}`}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default ViewFilterBar;
