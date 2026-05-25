import React, { forwardRef } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './Checkbox.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Checkbox Component
 * 
 * @param {Object} props
 * @param {string} props.label - Checkbox label
 * @param {boolean} props.checked - Whether checkbox is checked
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Whether checkbox is disabled
 * @param {boolean} props.required - Whether checkbox is required
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {boolean} props.fullWidth - Whether checkbox takes full width
 * @param {string} props.className - Additional CSS classes
 */
const Checkbox = forwardRef(({
  label,
  checked = false,
  onChange,
  disabled = false,
  required = false,
  error,
  helperText,
  fullWidth = false,
  className = '',
  name,
  id,
  ...rest
}, ref) => {
  const { theme } = useTheme();
  
  const wrapperClasses = [
    styles.wrapper,
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const checkmarkClasses = [
    styles.checkmark,
    error && styles.error
  ].filter(Boolean).join(' ');

  return (
    <div>
      <label className={wrapperClasses}>
        <div className={styles.checkboxContainer}>
          <input
            ref={ref}
            type="checkbox"
            id={id}
            name={name}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={styles.input}
            {...rest}
          />
          <span className={checkmarkClasses}>
            <span className={styles.checkIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            </span>
          </span>
        </div>
        {label && <span className={styles.label}>{label}</span>}
      </label>
      {error && <div className={styles.errorText}>{error}</div>}
      {helperText && !error && <div className={styles.helperText}>{helperText}</div>}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
