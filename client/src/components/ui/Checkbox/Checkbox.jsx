import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

/**
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
            <Check size={14} className={styles.checkIcon} />
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
