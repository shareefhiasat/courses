import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * Modal Component
 * 
 * A dialog overlay component for displaying content above the page.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} props.footer - Modal footer content
 * @param {'small'|'medium'|'large'|'full'} props.size - Modal size
 * @param {boolean} props.closeOnOverlayClick - Whether clicking overlay closes modal
 * @param {boolean} props.closeOnEscape - Whether pressing Escape closes modal
 * @param {boolean} props.showCloseButton - Whether to show close button
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.draggable - Whether the modal is draggable
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  draggable = true,
}) => {
  const modalRef = useRef(null);
  const headerRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset position when modal opens
      setPosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Drag handlers
  useEffect(() => {
    if (!draggable || !isOpen || !headerRef.current) return;

    const header = headerRef.current;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const handleMouseDown = (e) => {
      if (e.target.closest('button')) return; // Don't drag if clicking a button
      startX = e.clientX;
      startY = e.clientY;
      initialX = position.x;
      initialY = position.y;
      setIsDragging(true);
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      setPosition({
        x: initialX + deltaX,
        y: initialY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    header.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      header.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggable, isOpen, isDragging, position]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && !isDragging) {
      onClose();
    }
  };

  const modalClasses = [
    styles.modal,
    styles[size],
    className
  ].filter(Boolean).join(' ');

  const modalStyle = draggable && (position.x !== 0 || position.y !== 0) ? {
    transform: `translate(${position.x}px, ${position.y}px)`,
    margin: 0,
  } : {};

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div 
        ref={modalRef}
        className={modalClasses} 
        role="dialog" 
        aria-modal="true"
        style={modalStyle}
      >
        {(title || showCloseButton) && (
          <div 
            ref={headerRef}
            className={styles.header}
            style={{ cursor: draggable ? 'move' : 'default' }}
          >
            {title && <h2 className={styles.title}>{title}</h2>}
            {showCloseButton && (
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
