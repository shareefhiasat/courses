import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';

/**
 * Drawer Component
 * 
 * Side panel that slides in from the edge.
 */
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
}) => {
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
      <div className={drawerClasses}>
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.body}>
          {children}
        </div>

        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default Drawer;
