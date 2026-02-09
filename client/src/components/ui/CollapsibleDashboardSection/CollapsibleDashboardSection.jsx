import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Minimize2, 
  Maximize2, 
  Eye, 
  EyeOff,
  MoreVertical,
  LayoutGrid,
  List,
  Settings
} from 'lucide-react';
import styles from './CollapsibleDashboardSection.module.css';

// Collapse modes:
// - 'full': Show everything
// - 'minimize': Send to bottom right corner (floating restore button)

const CollapsibleDashboardSection = ({
  title,
  icon,
  children,
  count,
  badge,
  color = '#6366f1',
  sectionId,
  defaultMode = 'full',
  onModeChange,
  showModeToggle = true,
  compactContent = null,
  className = '',
  headerRight = null,
  inlineFilters = null,
  animated = true,
  smartCollapse = false // Auto-collapse based on user behavior
}) => {
  const [mode, setMode] = useState(defaultMode);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const menuRef = useRef(null);
  const sectionRef = useRef(null);

  // Load saved mode from localStorage
  useEffect(() => {
    if (sectionId) {
      const savedMode = localStorage.getItem(`dashboard-section-${sectionId}`);
      if (savedMode && ['full', 'minimize'].includes(savedMode)) {
        setMode(savedMode);
      }
    }
  }, [sectionId]);

  // Save mode to localStorage
  useEffect(() => {
    if (sectionId) {
      localStorage.setItem(`dashboard-section-${sectionId}`, mode);
      onModeChange?.(mode);
    }
  }, [mode, sectionId, onModeChange]);

  // Close mode menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsModeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart collapse logic (optional)
  useEffect(() => {
    if (!smartCollapse) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && mode === 'full') {
          // Auto-compact when not visible
          setMode('compact');
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [smartCollapse, mode]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsModeMenuOpen(false);
  };

  // Collapse modes
  const getModeIcon = () => {
    switch (mode) {
      case 'full': return <LayoutGrid size={14} />;
      case 'minimize': return <Minimize2 size={14} />;
      default: return <LayoutGrid size={14} />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'full': return 'Full View';
      case 'minimize': return 'Minimize';
      default: return 'Full View';
    }
  };

  // Minimize mode - show floating restore button
  if (mode === 'minimize') {
    return (
      <div className={`${styles.minimizeSection} ${className}`}>
        <button
          className={styles.restoreButton}
          onClick={() => handleModeChange('full')}
          title={`Restore ${title}`}
          style={{ '--color': color }}
        >
          {icon}
          <span>{title}</span>
          <Maximize2 size={12} />
        </button>
      </div>
    );
  }

  // Full mode - complete section
  return (
    <div 
      ref={sectionRef}
      className={`${styles.fullSection} ${animated ? styles.animated : ''} ${className}`}
      style={{ '--color': color }}
    >
      <div className={styles.fullHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon} style={{ background: `${color}15`, color }}>
            {icon}
          </span>
          <div className={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3 className={styles.headerTitle}>{title}</h3>
              {inlineFilters && (
                <>
                  <span style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '1.1em', lineHeight: 1 }}>─</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {inlineFilters}
                  </div>
                </>
              )}
            </div>
            {count !== undefined && (
              <span className={styles.headerCount}>{count} items</span>
            )}
          </div>
          {badge && (
            <span className={styles.headerBadge} style={{ background: color, color: 'white' }}>
              {badge}
            </span>
          )}
        </div>
        
        <div className={styles.headerRight}>
          {headerRight}
          {showModeToggle && (
            <button
              className={styles.modeToggle}
              onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
              title="View options"
            >
              <MoreVertical size={14} />
            </button>
          )}
        </div>

        {isModeMenuOpen && (
          <div ref={menuRef} className={styles.modeMenu}>
            <button
              onClick={() => handleModeChange('minimize')}
              className={mode === 'minimize' ? styles.active : ''}
            >
              <Minimize2 size={14} />
              Minimize
            </button>
            <button
              onClick={() => handleModeChange('full')}
              className={mode === 'full' ? styles.active : ''}
            >
              <LayoutGrid size={14} />
              Full View
            </button>
          </div>
        )}
      </div>
      
      <div className={styles.fullContent}>
        {children}
      </div>
    </div>
  );
};

export default CollapsibleDashboardSection;
