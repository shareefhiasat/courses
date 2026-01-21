import React from 'react';
import './qr-scanner-ui.css';

const Button = React.forwardRef(({ 
  className = '', 
  variant = 'default', 
  size = 'default',
  children,
  ...props 
}, ref) => {
  const baseClass = 'qr-btn';
  const variantClass = `qr-btn-${variant}`;
  const sizeClass = `qr-btn-${size}`;
  
  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
