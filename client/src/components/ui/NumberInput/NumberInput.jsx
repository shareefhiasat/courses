import React, { forwardRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import styles from './NumberInput.module.css';

/**
 * NumberInput Component (Spinner/Counter)
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
 * @param {number} props.step - Step increment
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {boolean} props.required - Whether input is required
 * @param {'small'|'medium'|'large'} props.size - Input size
 * @param {boolean} props.fullWidth - Whether input takes full width
 * @param {string} props.className - Additional CSS classes
 */
const NumberInput = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  min,
  max,
  step = 1,
  error,
  helperText,
  disabled = false,
  required = false,
  size = 'medium',
  fullWidth = false,
  className = '',
  name,
  id,
  ...rest
}, ref) => {
  const wrapperClasses = [
    styles.wrapper,
    fullWidth && styles.fullWidth,
    size && styles[size],
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    error && styles.error
  ].filter(Boolean).join(' ');

  const handleIncrement = () => {
    if (disabled) return;
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue + step;
    if (max !== undefined && newValue > max) return;
    onChange?.({ target: { value: newValue.toString(), name } });
  };

  const handleDecrement = () => {
    if (disabled) return;
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue - step;
    if (min !== undefined && newValue < min) return;
    onChange?.({ target: { value: newValue.toString(), name } });
  };

  const canIncrement = !disabled && (max === undefined || (parseFloat(value) || 0) < max);
  const canDecrement = !disabled && (min === undefined || (parseFloat(value) || 0) > min);

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className={styles.label} htmlFor={id || name}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.container}>
        <input
          ref={ref}
          type="number"
          id={id}
          name={name}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          required={required}
          {...rest}
        />
        
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleIncrement}
            disabled={!canIncrement}
            tabIndex={-1}
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleDecrement}
            disabled={!canDecrement}
            tabIndex={-1}
          >
            <ChevronDown size={12} />
          </button>
        </div>
      </div>
      
      {(error || helperText) && (
        <span className={error ? styles.errorText : styles.helperText}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

export default NumberInput;
