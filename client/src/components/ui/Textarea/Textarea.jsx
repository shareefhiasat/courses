import React, { forwardRef } from 'react';
import styles from './Textarea.module.css';

/**
 * Textarea Component
 * 
 * @param {Object} props
 * @param {string} props.label - Textarea label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Textarea value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below textarea
 * @param {boolean} props.disabled - Whether textarea is disabled
 * @param {boolean} props.required - Whether textarea is required
 * @param {'small'|'medium'|'large'} props.size - Textarea size
 * @param {boolean} props.fullWidth - Whether textarea takes full width
 * @param {number} props.rows - Number of rows
 * @param {number} props.maxLength - Maximum character length
 * @param {boolean} props.showCharCount - Show character count
 * @param {string} props.className - Additional CSS classes
 */
const Textarea = forwardRef(({
  label,
  placeholder,
  value = '',
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  size = 'medium',
  fullWidth = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  className = '',
  name,
  id,
  ...rest
}, ref) => {
  const wrapperClasses = [
    styles.wrapper,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const textareaClasses = [
    styles.textarea,
    styles[size],
    error && styles.error
  ].filter(Boolean).join(' ');

  const charCount = value?.length || 0;
  const charCountClasses = [
    styles.charCount,
    maxLength && charCount > maxLength * 0.9 && styles.warning,
    maxLength && charCount >= maxLength && styles.danger
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className={styles.label} htmlFor={id || name}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={id}
        name={name}
        className={textareaClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        {...rest}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {(error || helperText) && (
          <span className={error ? styles.errorText : styles.helperText}>
            {error || helperText}
          </span>
        )}
        {showCharCount && maxLength && (
          <span className={charCountClasses}>
            {charCount} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
