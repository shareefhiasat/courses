import React, { useEffect } from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import useResizableDrawer from '@hooks/useResizableDrawer';
import styles from './Drawer.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Drawer Component
 * 
 * Side panel that slides in from the edge.
 */
const SIZE_WIDTHS = { sm: 320, md: 480, lg: 640, xl: 800 };

const Drawer = ({
  isOpen = false,
  onClose,
  position = 'right',
  size = 'md',
  title,
  children,
  footer,
  closeOnOverlay = true,
  className = '',
  resizable = false,
  hideCloseButton = false,
}) => {
  const { isRTL } = useLang();
  const isHorizontal = position === 'right' || position === 'left';
  const isRightSide = position === 'right';
  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: `drawer_width_${position}_${size}`,
    defaultWidth: SIZE_WIDTHS[size] || 480,
    minWidth: 280,
    maxWidth: 1000,
    isRTL: isRightSide ? isRTL : !isRTL,
  });
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const drawerClasses = [
    styles.drawer,
    styles[position],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={styles.overlay}
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div className={drawerClasses} style={resizable && isHorizontal ? { width: drawerWidth } : undefined}>
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {!hideCloseButton && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close drawer"
          >
            {getThemedIcon('ui', 'close', 24)}
          </button>
          )}
        </div>

        <div className={styles.body}>
          {children}
        </div>

        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
        {resizable && isHorizontal && <div {...resizeHandleProps} />}
      </div>
    </>
  );
};

export default Drawer;
