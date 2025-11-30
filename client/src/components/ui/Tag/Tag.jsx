import React from 'react';
import { X } from 'lucide-react';
import styles from './Tag.module.css';

/**
 * Tag/Chip Component
 * 
 * Compact elements for labels, categories, or filters.
 */
const Tag = ({
  children,
  color = 'default',
  variant = 'solid',
  size = 'md',
  onRemove,
  icon,
  className = '',
}) => {
  const tagClasses = [
    styles.tag,
    styles[color],
    styles[variant],
    styles[size],
    onRemove && styles.removable,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={tagClasses}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
      {onRemove && (
        <button
          className={styles.removeButton}
          onClick={onRemove}
          aria-label="Remove tag"
        >
          <X size={14} />
        </button>
      )}
    </span>
  );
};

export default Tag;
