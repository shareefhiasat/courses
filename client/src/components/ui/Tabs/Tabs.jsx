import React from 'react';
import styles from './Tabs.module.css';

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
  return (
    <div className={`${styles.tabsContainer} ${styles[variant]} ${styles[size]} ${className}`}>
      <div className={styles.tabsWrapper}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value || index}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              onClick={() => onTabChange?.(tab.value)}
              type="button"
            >
              {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
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
