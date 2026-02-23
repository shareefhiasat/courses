import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Input } from '@ui';

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
  const { theme } = useTheme();
  const { t } = useLang();
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="collapsible-side-window-taskbar-item" onClick={() => setIsMinimized(false)}>
          <span className="collapsible-side-window-taskbar-name">{studentName}</span>
          <button
            className="collapsible-side-window-taskbar-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            {getThemedIcon('ui', 'close', 14, theme)}
          </button>
        </div>
      )}

      {/* Main Window */}
      {!isMinimized && (
        <div 
          ref={windowRef}
          className="collapsible-side-window-window"
          style={position.x !== 0 || position.y !== 0 ? {
            transform: `translate(${position.x}px, ${position.y}px)`,
            right: 'auto',
            left: position.x !== 0 ? 'auto' : undefined,
          } : {}}
        >
          <div 
            ref={headerRef}
            className="collapsible-side-window-header"
          >
            <div className="collapsible-side-window-header-left">
              <span className="collapsible-side-window-title">{title}</span>
              {studentName && <span className="collapsible-side-window-subtitle">{studentName}</span>}
            </div>
            <div className="collapsible-side-window-header-actions">
              <button
                className="collapsible-side-window-header-button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? getThemedIcon('ui', 'chevron_down', 18, theme) : getThemedIcon('ui', 'chevron_up', 18, theme)}
              </button>
              <button
                className="collapsible-side-window-header-button"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                {getThemedIcon('ui', 'minimize', 18, theme)}
              </button>
              <button
                className="collapsible-side-window-header-button"
                onClick={onClose}
                title="Close"
              >
                {getThemedIcon('ui', 'close', 18, theme)}
              </button>
            </div>
          </div>
          {!isCollapsed && (
            <div className="collapsible-side-window-content">
              {searchable && (
                <div style={{ marginBottom: '1rem' }}>
                  <Input
                    type="text"
                    placeholder={t('search') || 'Search...'}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    icon={getThemedIcon('ui', 'search', 16, theme)}
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

