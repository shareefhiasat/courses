import React from 'react';
import styles from './Badge.module.css';

/**
 * Badge Component
 * 
 * A small label component for displaying status, counts, or categories.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {'success'|'warning'|'danger'|'info'|'default'|'primary'} props.color - Badge color
 * @param {'solid'|'outline'|'subtle'} props.variant - Visual style
 * @param {'small'|'medium'|'large'} props.size - Badge size
 * @param {boolean} props.dot - Show as a dot indicator
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({
  children,
  color = 'default',
  variant = 'solid',
  size = 'medium',
  dot = false,
  className = '',
  ...rest
}) => {
  const badgeClasses = [
    styles.badge,
    styles[color],
    styles[variant],
    styles[size],
    dot && styles.dot,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses} {...rest}>
      {children}
    </span>
  );
};

export default Badge;
