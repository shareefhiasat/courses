import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Minimize2, Maximize2, Search } from 'lucide-react';
import { Input } from './ui';
import styles from './CollapsibleSideWindow.module.css';

const CollapsibleSideWindow = ({ 
  isOpen, 
  onClose, 
  title = 'Student Details',
  children,
  studentName = 'Student',
  searchable = false,
  onSearch = null,
  initialFilters = {}
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef(null);
  const headerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Reset position when window opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
      setSearchQuery('');
    }
  }, [isOpen]);

  // Auto-apply initial filters if provided (only once when window opens)
  const hasAppliedInitialFilters = useRef(false);
  useEffect(() => {
    if (isOpen && !hasAppliedInitialFilters.current && initialFilters && Object.keys(initialFilters).length > 0 && onSearch) {
      // Pass initial filters to parent component for filtering
      onSearch('', initialFilters);
      hasAppliedInitialFilters.current = true;
    }
    if (!isOpen) {
      hasAppliedInitialFilters.current = false;
    }
  }, [isOpen]); // Only depend on isOpen to avoid infinite loops

  // Drag handlers
  useEffect(() => {
    if (!isOpen || !headerRef.current) return;

    const header = headerRef.current;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const handleMouseDown = (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return;
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
  }, [isOpen, isDragging, position]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query, initialFilters);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized Taskbar Item */}
      {isMinimized && (
        <div className={styles.taskbarItem} onClick={() => setIsMinimized(false)}>
          <span className={styles.taskbarName}>{studentName}</span>
          <button
            className={styles.taskbarClose}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Window */}
      {!isMinimized && (
        <div 
          ref={windowRef}
          className={styles.window}
          style={position.x !== 0 || position.y !== 0 ? {
            transform: `translate(${position.x}px, ${position.y}px)`,
            right: 'auto',
            left: position.x !== 0 ? 'auto' : undefined,
          } : {}}
        >
          <div 
            ref={headerRef}
            className={styles.header}
          >
            <div className={styles.headerLeft}>
              <span className={styles.title}>{title}</span>
              {studentName && <span className={styles.subtitle}>{studentName}</span>}
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.headerButton}
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
              <button
                className={styles.headerButton}
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                <Minimize2 size={18} />
              </button>
              <button
                className={styles.headerButton}
                onClick={onClose}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {!isCollapsed && (
            <div className={styles.content}>
              {searchable && (
                <div style={{ marginBottom: '1rem' }}>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    icon={<Search size={16} />}
                    fullWidth
                  />
                </div>
              )}
              {children}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CollapsibleSideWindow;

