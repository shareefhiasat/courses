import React, { useState, useRef, useEffect } from 'react';

import { info, error, warn, debug } from '@services/utils/logger.js';import './qr-scanner-ui.css';

const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="qr-dropdown">
      {React.Children.map(children, child =>
        React.cloneElement(child, { isOpen, setIsOpen })
      )}
    </div>
  );
};

const DropdownMenuTrigger = React.forwardRef(({ 
  children, 
  asChild, 
  isOpen, 
  setIsOpen,
  ...props 
}, ref) => {
  const handleClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ref
    });
  }

  return (
    <button onClick={handleClick} ref={ref} {...props}>
      {children}
    </button>
  );
});

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = ({ 
  children, 
  align = 'start', 
  isOpen, 
  setIsOpen 
}) => {
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div 
      ref={contentRef}
      className={`qr-dropdown-content qr-dropdown-${align}`}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { setIsOpen })
      )}
    </div>
  );
};

const DropdownMenuItem = ({ children, setIsOpen, onClick, ...props }) => {
  const handleClick = (e) => {
    if (onClick) onClick(e);
    setIsOpen(false);
  };

  return (
    <div className="qr-dropdown-item" onClick={handleClick} {...props}>
      {children}
    </div>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
