import React, { forwardRef } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

const AppAlert = forwardRef(function AppAlert(
  {
    severity = 'info',
    variant = 'standard',
    onClose,
    title,
    sx,
    children,
    ...props
  },
  ref,
) {
  return (
    <Alert
      ref={ref}
      severity={severity}
      variant={variant}
      onClose={onClose}
      sx={sx}
      {...props}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      {children}
    </Alert>
  );
});

export default AppAlert;
