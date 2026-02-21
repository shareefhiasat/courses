import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './EmptyState.module.css';

/**
 * EmptyState Component
 * 
 * Display when no data is available.
 */
const EmptyState = ({
  icon,
  title = 'No data found',
  description,
  action,
  className = '',
}) => {
  // Safely render the icon
  const renderIcon = () => {
    if (!icon) {
      return <div className={styles.icon}>{getThemedIcon('ui', 'inbox', 64)}</div>;
    }
    
    if (typeof icon === 'function') {
      try {
        return <div className={styles.icon}>{icon({ size: 64 })}</div>;
      } catch (e) {
        return <div className={styles.icon}>{getThemedIcon('ui', 'inbox', 64)}</div>;
      }
    }
    
    if (React.isValidElement(icon)) {
      return <div className={styles.icon}>{icon}</div>;
    }
    
    // Fallback for any other type
    return <div className={styles.icon}>{getThemedIcon('ui', 'inbox', 64)}</div>;
  };

  return (
    <div className={`${styles.emptyState} ${className}`}>
      <div className={styles.iconWrapper}>
        {renderIcon()}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default EmptyState;
