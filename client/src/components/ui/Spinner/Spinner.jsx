import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
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
  const { userAccentColor } = useAuth();
  const primaryColor = userAccentColor || '#800020';
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    styles[color],
    styles[variant],
    className
  ].filter(Boolean).join(' ');
  
  const spinnerStyle = color === 'primary' ? { color: primaryColor, borderTopColor: primaryColor } : {};

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={spinnerClasses} style={spinnerStyle}>
            <div className={styles.dot} style={{ backgroundColor: primaryColor }}></div>
            <div className={styles.dot} style={{ backgroundColor: primaryColor }}></div>
            <div className={styles.dot} style={{ backgroundColor: primaryColor }}></div>
          </div>
        );
      case 'pulse':
        return <div className={spinnerClasses} style={{ ...spinnerStyle, backgroundColor: primaryColor }}></div>;
      case 'circle':
      default:
        return <div className={spinnerClasses} style={spinnerStyle}></div>;
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
