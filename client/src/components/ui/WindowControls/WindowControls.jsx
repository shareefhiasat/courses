import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './WindowControls.module.css';

const WindowControls = ({ 
  title, 
  isPinned, 
  isMinimized, 
  isCollapsed,
  onPin, 
  onMinimize, 
  onMaximize, 
  onClose,
  className = '',
  showPin = true,
  showMinimize = true,
  showMaximize = true,
  showClose = true
}) => {
  return (
    <div className={`${styles.windowControls} ${className}`}>
      <div className={styles.windowHeader}>
        <div className={styles.windowTitle}>
          {title}
        </div>
        
        <div className={styles.windowButtons}>
          {showPin && (
            <button
              className={`${styles.windowButton} ${isPinned ? styles.pinned : ''}`}
              onClick={onPin}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              📌
            </button>
          )}
          
          {showMinimize && (
            <button
              className={styles.windowButton}
              onClick={onMinimize}
              title="Minimize"
            >
              {getThemedIcon('ui', 'minus', 14)}
            </button>
          )}
          
          {showMaximize && (
            <button
              className={styles.windowButton}
              onClick={onMaximize}
              title="Maximize"
            >
              {getThemedIcon('ui', 'maximize', 14)}
            </button>
          )}
          
          {showClose && (
            <button
              className={`${styles.windowButton} ${styles.closeButton}`}
              onClick={onClose}
              title="Close"
            >
              {getThemedIcon('ui', 'close', 14)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WindowControls;
