import React, { useState, useRef, useEffect } from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import PortalTooltip from '@ui/PortalTooltip';
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
  smartCollapse = false, // Auto-collapse based on user behavior
  onRefresh = null, // Refresh callback function
  refreshing = false // Refresh state for visual feedback
}) => {
  const { t } = useLang();
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
      case 'full': return getThemedIcon('ui', 'layout_grid', 14);
      case 'minimize': return getThemedIcon('ui', 'minimize', 14);
      default: return getThemedIcon('ui', 'layout_grid', 14);
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
        <PortalTooltip content={t('restore_section').replace('{title}', title)} position="top">
        <button
          className={styles.restoreButton}
          onClick={() => handleModeChange('full')}
          style={{ '--color': color }}
        >
          {icon}
          <span>{title}</span>
          {getThemedIcon('ui', 'maximize', 12)}
        </button>
        </PortalTooltip>
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
            <PortalTooltip content={t('view_options')} position="top">
            <button
              className={styles.modeToggle}
              onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
            >
              {getThemedIcon('ui', 'more_vertical', 14)}
            </button>
            </PortalTooltip>
          )}
        </div>

        {isModeMenuOpen && (
          <div ref={menuRef} className={styles.modeMenu}>
            <button
              onClick={() => handleModeChange('minimize')}
              className={mode === 'minimize' ? styles.active : ''}
            >
              {getThemedIcon('ui', 'minimize', 14)}
              Minimize
            </button>
            <button
              onClick={() => handleModeChange('full')}
              className={mode === 'full' ? styles.active : ''}
            >
              {getThemedIcon('ui', 'layout_grid', 14)}
              Full View
            </button>
            {onRefresh && (
              <PortalTooltip content={refreshing ? t('refreshing_data') : t('refresh_data')} position="top">
              <button
                onClick={() => {
                  onRefresh();
                  setIsModeMenuOpen(false);
                }}
                className={`${styles.refreshButton} ${refreshing ? styles.refreshing : ''}`}
                disabled={refreshing}
              >
                {getThemedIcon('ui', 'refresh', 14)}
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              </PortalTooltip>
            )}
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
