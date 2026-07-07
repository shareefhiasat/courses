import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';

export default function AppTooltip({
  title,
  placement,
  arrow = true,
  children,
  enterDelay = 100,
  leaveDelay = 0,
  disableHoverListener = false,
  sx,
  ...props
}) {
  const theme = useTheme();
  const resolvedPlacement = placement || (theme.direction === 'rtl' ? 'left' : 'right');

  return (
    <Tooltip
      title={title}
      arrow={arrow}
      placement={resolvedPlacement}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      disableHoverListener={disableHoverListener}
      slotProps={{
        tooltip: { sx },
      }}
      {...props}
    >
      {children}
    </Tooltip>
  );
}
