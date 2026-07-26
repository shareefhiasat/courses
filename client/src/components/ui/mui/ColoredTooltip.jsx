import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@contexts/ThemeContext';

/**
 * MUI tooltip with text color matching the hovered element (status dot, icon, etc.).
 * Optional `borderColor` lets the border/arrow differ from the text color.
 */
export default function ColoredTooltip({
  title,
  color = '#8b5cf6',
  borderColor,
  children,
  placement = 'top',
  arrow = true,
  cursor = null,
  slotProps: slotPropsProp = {},
  ...rest
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)';

  if (!title) return children;

  const child = cursor && React.isValidElement(children)
    ? React.cloneElement(children, {
      style: { ...(children.props?.style || {}), cursor },
    })
    : children;

  const tooltipSx = {
    bgcolor: bg,
    color,
    fontWeight: 600,
    fontSize: '11px',
    border: `1px solid ${(borderColor || color)}44`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    maxWidth: 280,
  };

  const arrowSx = {
    color: bg,
    '&::before': {
      border: `1px solid ${(borderColor || color)}44`,
    },
  };

  const slotProps = {
    ...(slotPropsProp || {}),
    tooltip: {
      ...(slotPropsProp?.tooltip || {}),
      sx: { ...tooltipSx, ...(slotPropsProp?.tooltip?.sx || {}) },
    },
    arrow: {
      ...(slotPropsProp?.arrow || {}),
      sx: { ...arrowSx, ...(slotPropsProp?.arrow?.sx || {}) },
    },
  };

  return (
    <Tooltip
      title={title}
      placement={placement}
      arrow={arrow}
      slotProps={slotProps}
      {...rest}
    >
      {child}
    </Tooltip>
  );
}
