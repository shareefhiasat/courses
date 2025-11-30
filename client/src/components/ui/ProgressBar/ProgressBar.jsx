import React from 'react';
import styles from './ProgressBar.module.css';

/**
 * ProgressBar Component
 * 
 * Display progress visually.
 */
const ProgressBar = ({
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  striped = false,
  animated = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const progressClasses = [
    styles.progress,
    styles[size],
    className
  ].filter(Boolean).join(' ');

  const barClasses = [
    styles.bar,
    styles[color],
    striped && styles.striped,
    animated && styles.animated,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      {(showLabel || label) && (
        <div className={styles.labelWrapper}>
          <span className={styles.label}>{label}</span>
          {showLabel && <span className={styles.percentage}>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={progressClasses}>
        <div
          className={barClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
