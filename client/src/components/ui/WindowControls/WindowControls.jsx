import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import styles from './WindowControls.module.css';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';const WindowControls = ({ 
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
  const { t } = useLang();
  
  return (
    <div className={`${styles.windowControls} ${className}`}>
      <div className={styles.windowHeader}>
        <div className={styles.windowTitle}>
          {title}
        </div>
        
        <div className={styles.windowButtons}>
          {showPin && (
            <PortalTooltip content={isPinned ? t('unpin') : t('pin')} position="top">
            <button
              className={`${styles.windowButton} ${isPinned ? styles.pinned : ''}`}
              onClick={onPin}
            >
              📌
            </button>
            </PortalTooltip>
          )}
          
          {showMinimize && (
            <PortalTooltip content={t('minimize')} position="top">
            <button
              className={styles.windowButton}
              onClick={onMinimize}
            >
              {getThemedIcon('ui', 'minus', 14)}
            </button>
            </PortalTooltip>
          )}
          
          {showMaximize && (
            <PortalTooltip content={t('maximize')} position="top">
            <button
              className={styles.windowButton}
              onClick={onMaximize}
            >
              {getThemedIcon('ui', 'maximize', 14)}
            </button>
            </PortalTooltip>
          )}
          
          {showClose && (
            <PortalTooltip content={t('close')} position="top">
            <button
              className={`${styles.windowButton} ${styles.closeButton}`}
              onClick={onClose}
            >
              {getThemedIcon('ui', 'close', 14)}
            </button>
            </PortalTooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default WindowControls;
