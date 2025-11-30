import React, { useState } from 'react';
import styles from './Tooltip.module.css';

/**
 * Tooltip Component
 * 
 * Display helpful text on hover.
 */
const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeout;

  const showTooltip = () => {
    timeout = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  return (
    <div
      className={`${styles.tooltipWrapper} ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div className={`${styles.tooltip} ${styles[position]}`}>
          {content}
          <div className={styles.arrow}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
