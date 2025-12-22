import React, { forwardRef } from 'react';
import styles from './Input.module.css';

/**
 * Input Component
 * 
 * A flexible input field with support for labels, errors, icons, and various states.
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below input
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.required - Whether input is required
 * @param {React.ReactNode} props.prefix - Icon or text before input
 * @param {React.ReactNode} props.suffix - Icon or text after input
 * @param {'small'|'medium'|'large'} props.size - Input size
 * @param {boolean} props.fullWidth - Whether input takes full width
 * @param {string} props.className - Additional CSS classes
 */
const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  prefix,
  suffix,
  icon,
  size = 'medium',
  fullWidth = false,
  className = '',
  ...rest
}, ref) => {
  const computedPrefix = prefix || icon;
  const wrapperClasses = [
    styles.inputWrapper,
    fullWidth && styles.fullWidth,
    disabled && styles.disabledWrapper,
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    styles[size],
    error && styles.error,
    computedPrefix && styles.hasPrefix,
    suffix && styles.hasSuffix,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputContainer}>
        {computedPrefix && <span className={styles.prefix}>{computedPrefix}</span>}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...rest}
        />
        
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      
      {(error || helperText) && (
        <span className={error ? styles.errorText : styles.helperText}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
