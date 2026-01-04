import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../../../contexts/LangContext';
import './InfoTooltip.css';

const InfoTooltip = ({ contentKey, children }) => {
  const { t } = useLang();
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

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
    e.stopPropagation();
    setIsVisible(!isVisible);
  };

  return (
    <div className="info-tooltip-container" ref={tooltipRef}>
      <button 
        type="button" 
        className="info-tooltip-trigger"
        onClick={toggleTooltip}
        aria-label={t('info_tooltip.trigger_aria_label')}
        aria-expanded={isVisible}
      >
        <span className="info-tooltip-icon">i</span>
      </button>
      
      {isVisible && (
        <div className="info-tooltip-content">
          {children || t(contentKey)}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
