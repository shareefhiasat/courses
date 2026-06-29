import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '@contexts/LangContext';


import { info, error, warn, debug } from '@services/utils/logger.js';

const resolveColor = (color) => {
  if (!color) return null;
  if (color.startsWith('var(')) {
    const match = color.match(/var\(\s*([^,\s]+)\s*(?:,\s*([^)]+))?\)/);
    if (match) {
      const cssVar = match[1];
      const fallback = match[2] ? match[2].trim() : null;
      if (typeof window !== 'undefined') {
        const computed = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        if (computed) return computed;
      }
      if (fallback) return resolveColor(fallback);
      return null;
    }
  }
  return color;
};

const hexToRgba = (hex, alpha) => {
  const resolved = resolveColor(hex);
  if (!resolved) return hex;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(resolved);
  if (!result) return resolved;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
};

/**
 * PortalTooltip Component
 * 
 * Renders tooltips outside the component hierarchy to prevent overflow issues.
 * Uses React Portal to render the tooltip directly under document.body.
 */
const PortalTooltip = ({ 
  children, 
  content, 
  position = 'top',
  delay = 200,
  className = '',
  disabled = false,
  textColor = 'white',
  backgroundColor = 'var(--color-primary, #3b82f6)',
  backgroundOpacity = 0.95
}) => {
  const { isRTL } = useLang();
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  let timeout;

  const showTooltip = (e) => {
    if (disabled) return;
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setCoords({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  // Position calculation based on position prop
  const getTooltipStyle = () => {
    if (!isVisible) return { display: 'none' };

    const tooltipHeight = 40; // Approximate height
    const tooltipWidth = 200; // Approximate max width
    const offset = 4; // Distance from trigger

    let x = coords.x;
    let y = coords.y;

    switch (position) {
      case 'top':
        y = coords.y - tooltipHeight - offset;
        x = coords.x - tooltipWidth / 2;
        break;
      case 'bottom':
        y = coords.y + offset;
        x = coords.x - tooltipWidth / 2;
        break;
      case 'left':
        y = coords.y - tooltipHeight / 2;
        x = coords.x - tooltipWidth - offset;
        break;
      case 'right':
        y = coords.y - tooltipHeight / 2;
        x = coords.x + offset;
        break;
    }

    // Keep tooltip within viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x < 10) x = 10;
    if (x + tooltipWidth > viewportWidth - 10) x = viewportWidth - tooltipWidth - 10;
    if (y < 10) y = 10;
    if (y + tooltipHeight > viewportHeight - 10) y = viewportHeight - tooltipHeight - 10;

    return {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 9999,
      opacity: isVisible ? 1 : 0,
      transform: 'translateZ(0)',
      transition: 'opacity 0.2s ease',
      pointerEvents: 'none'
    };
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeout);
  }, []);

  const tooltipContent = isVisible && content ? (
    <div
      ref={tooltipRef}
      style={{
        ...getTooltipStyle(),
        padding: '0.5rem 0.75rem',
        background: hexToRgba(backgroundColor, backgroundOpacity),
        color: textColor,
        fontSize: '0.875rem',
        borderRadius: '8px',
        whiteSpace: 'nowrap',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--color-gray-700, #374151)'
      }}
      className={`portal-tooltip ${className}`}
    >
      {content}
      <div
        css={{
          position: 'absolute',
          width: '8px',
          height: '8px',
          background: hexToRgba(backgroundColor, backgroundOpacity),
          transform: 'rotate(45deg)',
          // Arrow positioning based on position
          ...(position === 'top' && {
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)'
          }),
          ...(position === 'bottom' && {
            top: '-4px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)'
          }),
          ...(position === 'left' && {
            right: '-4px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)'
          }),
          ...(position === 'right' && {
            left: '-4px',
            top: '50%',
            transform: 'translateY(-50%) rotate(45deg)'
          })
        }}
      />
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && 
        document.body && 
        createPortal(tooltipContent, document.body)
      }
    </>
  );
};

export default PortalTooltip;
