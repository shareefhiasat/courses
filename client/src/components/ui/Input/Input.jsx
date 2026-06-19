import React, { forwardRef, useRef, useEffect } from 'react';
import InfoTooltip from '../InfoTooltip/InfoTooltip';
import styles from './Input.module.css';
import { getComponentStyles, generateCSSVariables } from '@constants/uiTheme';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
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
 * @param {'light'|'dark'} props.theme - Theme variant
 */
const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  helperTextStyle,
  helperTextInfo,
  disabled = false,
  required = false,
  prefix,
  suffix,
  icon,
  prefixIcon,
  size = 'medium',
  fullWidth = false,
  className = '',
  theme = 'light',
  ...rest
}, ref) => {
  const computedPrefix = prefix || icon || prefixIcon;
  const inputRef = useRef(null);

  // Preserve selection when value changes
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleSelect = () => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (start !== end) {
        input.setSelectionRange(start, end);
      }
    };

    input.addEventListener('select', handleSelect);
    return () => input.removeEventListener('select', handleSelect);
  }, [value]);

  // Get theme-aware styles
  const inputVariant = error ? 'error' : 'default';
  const themeStyles = getComponentStyles(theme, 'input', inputVariant, size);

  const wrapperClasses = [
    styles.inputWrapper,
    styles[theme],
    fullWidth && styles.fullWidth,
    disabled && styles.disabledWrapper,
    className
  ].filter(Boolean).join(' ');

  // Generate CSS variables for theme
  const cssVariables = generateCSSVariables(theme);

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
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          type={type}
          className={inputClasses}
          placeholder={required ? `${placeholder}*` : placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...rest}
        />
        
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      
      {(error || helperText) && (
        <div className={styles.helperContainer}>
          {error && <span className={styles.errorText}>{error}</span>}
          {helperText && !helperTextInfo && <span className={styles.helperText} style={helperTextStyle}>{helperText}</span>}
          {helperTextInfo && (
            <InfoTooltip contentKey={helperTextInfo} />
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
