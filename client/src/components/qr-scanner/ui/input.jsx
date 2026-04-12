import React from 'react';

import { info, error, warn, debug } from '@services/utils/logger.js';import './qr-scanner-ui.css';

const Input = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <input
      className={`qr-input ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
