import React from 'react';
import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

/**
 * EmptyState Component
 * 
 * Display when no data is available.
 */
const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`${styles.emptyState} ${className}`}>
      <div className={styles.iconWrapper}>
        <Icon size={64} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default EmptyState;
