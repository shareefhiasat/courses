import React, { useState, useRef } from 'react';
import { Calendar, Clock } from 'lucide-react';
import styles from './DatePicker.module.css';

/**
 * DatePicker Component
 * 
 * Date and time picker with native input fallback.
 */
const DatePicker = ({
  value,
  onChange,
  type = 'date',
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  min,
  max,
  showTime = false,
  fullWidth = false,
  className = '',
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const inputType = showTime ? 'datetime-local' : (type === 'datetime' ? 'datetime-local' : type);

  const wrapperClasses = [
    styles.wrapper,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    error && styles.error,
    disabled && styles.disabled,
  ].filter(Boolean).join(' ');

  const handleIconClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.showPicker?.();
    }
  };

  return (
    <div className={wrapperClasses} data-empty={!value ? 'true' : 'false'}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        <div className={styles.iconWrapper} onClick={handleIconClick} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
          {showTime || type === 'time' ? (
            <Clock size={18} className={styles.icon} />
          ) : (
            <Calendar size={18} className={styles.icon} />
          )}
        </div>
        
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={!value && placeholder ? `      ${placeholder}` : placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          className={inputClasses}
        />
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};

export default DatePicker;
