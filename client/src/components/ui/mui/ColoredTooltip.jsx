import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@contexts/ThemeContext';

/**
 * MUI tooltip with text color matching the hovered element (status dot, icon, etc.).
 */
export default function ColoredTooltip({
  title,
  color = '#8b5cf6',
  children,
  placement = 'top',
  arrow = true,
}) {
  if (!title) return children;

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)';

  return (
    <Tooltip
      title={title}
      placement={placement}
      arrow={arrow}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: bg,
            color,
            fontWeight: 600,
            fontSize: '11px',
            border: `1px solid ${color}44`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            maxWidth: 280,
          },
        },
        arrow: {
          sx: {
            color: bg,
            '&::before': {
              border: `1px solid ${color}44`,
            },
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
}
