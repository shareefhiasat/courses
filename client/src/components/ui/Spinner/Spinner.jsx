import React from 'react';
import styles from './Spinner.module.css';

/**
 * Spinner Component
 * 
 * A loading spinner with multiple variants and sizes.
 * 
 * @param {Object} props
 * @param {'small'|'medium'|'large'} props.size - Spinner size
 * @param {'primary'|'white'|'secondary'} props.color - Spinner color
 * @param {'circle'|'dots'|'pulse'} props.variant - Spinner style
 * @param {boolean} props.fullScreen - Show as full-screen overlay
 * @param {string} props.label - Accessible label
 * @param {string} props.className - Additional CSS classes
 */
const Spinner = ({
  size = 'medium',
  color = 'primary',
  variant = 'circle',
  fullScreen = false,
  label = 'Loading...',
  className = '',
}) => {
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    styles[color],
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={spinnerClasses}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        );
      case 'pulse':
        return <div className={spinnerClasses}></div>;
      case 'circle':
      default:
        return <div className={spinnerClasses}></div>;
    }
  };

  if (fullScreen) {
    return (
      <div className={styles.fullScreenOverlay}>
        <div className={styles.fullScreenContent}>
          {renderSpinner()}
          {label && <p className={styles.label}>{label}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} role="status" aria-label={label}>
      {renderSpinner()}
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
};

export default Spinner;
