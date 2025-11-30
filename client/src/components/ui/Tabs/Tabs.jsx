import React, { useState } from 'react';
import styles from './Tabs.module.css';

/**
 * Tabs Component
 * 
 * A tabbed interface for organizing content.
 */
const Tabs = ({ tabs, defaultTab = 0, onChange, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabClick = (index) => {
    setActiveTab(index);
    if (onChange) onChange(index);
  };

  return (
    <div className={`${styles.tabsContainer} ${className}`}>
      <div className={styles.tabList} role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`${styles.tab} ${activeTab === index ? styles.active : ''}`}
            onClick={() => handleTabClick(index)}
            role="tab"
            aria-selected={activeTab === index}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.tabPanel} role="tabpanel">
        <div key={activeTab} className={styles.tabPanelInner}>
          {tabs[activeTab]?.content}
        </div>
      </div>
    </div>
  );
};

export default Tabs;
