import React from 'react';
import styles from './Tabs.module.css';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Modern Tabs Component
 * Inspired by Dribbble designs - sleek, animated, professional
 */
const Tabs = ({ 
  tabs = [], 
  activeTab, 
  onTabChange,
  variant = 'default', // 'default', 'pills', 'underline'
  size = 'md', // 'sm', 'md', 'lg'
  className = ''
}) => {
  // Debug: Log tab props and interactions
  React.useEffect(() => {
    info('[Tabs] Tabs props:', { tabs, activeTab, variant, size, className });
  }, [tabs, activeTab, variant, size, className]);

  const handleTabClick = (tabValue) => {
    info('[Tabs] Tab clicked:', { tabValue, currentActiveTab: activeTab });
    if (onTabChange && tabValue !== activeTab) {
      onTabChange(tabValue);
    }
  };

  return (
    <div className={`${styles.tabsContainer} ${styles[variant]} ${styles[size]} ${className}`}>
      <div className={styles.tabsWrapper}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value || index}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              onClick={() => handleTabClick(tab.value)}
              type="button"
            >
              {tab.icon && (
                <span className={styles.tabIcon}>
                  {React.cloneElement(tab.icon, {
                    color: isActive ? '#ffffff' : 'currentColor',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round'
                  })}
                </span>
              )}
              <span className={styles.tabLabel}>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`${styles.tabBadge} ${isActive ? styles.activeBadge : ''}`}>
                  {tab.badge}
                </span>
              )}
              {isActive && <span className={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
