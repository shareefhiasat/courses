import React from 'react';
import { Inbox } from 'lucide-react';
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
      return <Inbox size={64} className={styles.icon} />;
    }
    
    if (typeof icon === 'function') {
      try {
        return <icon size={64} className={styles.icon} />;
      } catch (e) {
        return <Inbox size={64} className={styles.icon} />;
      }
    }
    
    if (React.isValidElement(icon)) {
      return <div className={styles.icon}>{icon}</div>;
    }
    
    // Fallback for any other type
    return <Inbox size={64} className={styles.icon} />;
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
