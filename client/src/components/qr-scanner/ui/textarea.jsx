import React from 'react';

import { info, error, warn, debug } from '@services/utils/logger.js';import './qr-scanner-ui.css';

const Textarea = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <textarea
      className={`qr-textarea ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };
