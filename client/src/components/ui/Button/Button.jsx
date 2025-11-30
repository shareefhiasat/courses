import React from 'react';
import styles from './Button.module.css';

/**
 * Button Component
 * 
 * A reusable button component with multiple variants, sizes, and states.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} props.variant - Button style variant
 * @param {'small'|'medium'|'large'} props.size - Button size
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.loading - Whether the button is in loading state
 * @param {boolean} props.fullWidth - Whether the button should take full width
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.type - Button type (button, submit, reset)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  type = 'button',
  ...rest
}) => {
  const normalizedSize = size === 'sm' ? 'small' : size;

  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[normalizedSize],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className={styles.spinner}>
          <span className={styles.spinnerCircle}></span>
        </span>
      )}
      <span className={loading ? styles.loadingText : ''}>{children}</span>
    </button>
  );
};

export default Button;
