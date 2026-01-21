import React from 'react';
import './qr-scanner-ui.css';

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
