import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import './InfoTooltip.css';

// Helper function to check if an element is a button or has an onClick handler
const isClickableElement = (element) => {
  if (!element || !element.tagName) return false;
  
  const tag = element.tagName.toLowerCase();
  const hasOnClick = element.onclick || 
                    element.getAttribute('onclick') ||
                    element.getAttribute('role') === 'button' ||
                    element.closest('button, [role="button"], [onclick]');
                    
  return ['button', 'a', 'input[type="button"]', 'input[type="submit"]'].includes(tag) || hasOnClick;
};

// Helper to find if any parent is clickable
const hasClickableParent = (element) => {
  if (!element) return false;
  
  let parent = element.parentElement;
  while (parent) {
    if (isClickableElement(parent)) return true;
    parent = parent.parentElement;
  }
  return false;
};

const InfoTooltip = ({ contentKey, children, asDiv = false }) => {
  const { t } = useLang();
  const [isVisible, setIsVisible] = useState(false);
  const [useDiv, setUseDiv] = useState(asDiv);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Check if we need to use a div instead of a button
  useEffect(() => {
    if (asDiv) {
      setUseDiv(true);
      return;
    }
    
    // Check if the parent is clickable
    if (triggerRef.current) {
      const parentIsClickable = hasClickableParent(triggerRef.current);
      setUseDiv(parentIsClickable);
    }
  }, [asDiv]);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const toggleTooltip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(!isVisible);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTooltip(e);
    } else if (e.key === 'Escape' && isVisible) {
      e.preventDefault();
      setIsVisible(false);
    }
  };

  const TriggerElement = useDiv ? 'div' : 'button';
  const triggerProps = useDiv 
    ? {
        role: 'button',
        tabIndex: 0,
        onKeyDown: handleKeyDown,
        'aria-haspopup': 'dialog',
        'aria-expanded': isVisible,
      }
    : {
        type: 'button',
        'aria-haspopup': 'dialog',
      };

  return (
    <div className="info-tooltip-container" ref={tooltipRef}>
      <TriggerElement
        ref={triggerRef}
        className={`info-tooltip-trigger ${useDiv ? 'info-tooltip-div' : ''}`}
        onClick={toggleTooltip}
        aria-label={t('info_tooltip.trigger_aria_label') || 'Show information'}
        aria-expanded={isVisible}
        {...triggerProps}
      >
        <span className="info-tooltip-icon">i</span>
      </TriggerElement>
      
      {isVisible && (
        <div 
          className="info-tooltip-content"
          role="tooltip"
          onKeyDown={handleKeyDown}
        >
          {children || t(contentKey)}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
