import React, { useState, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import DatePicker from '../DatePicker/DatePicker';
import styles from './DateRangeSlider.module.css';

/**
 * DateRangeSlider Component
 * 
 * A date range picker with from/to dates, similar to BI tools.
 * Supports showing either one or both date inputs.
 */
const DateRangeSlider = ({
  fromDate,
  toDate,
  onChange,
  label,
  showFrom = true,
  showTo = true,
  placeholderFrom = 'From Date',
  placeholderTo = 'To Date',
  error,
  helperText,
  disabled = false,
  required = false,
  min,
  max,
  fullWidth = false,
  className = '',
  clearable = true,
}) => {
  const handleFromChange = (value) => {
    if (onChange) {
      onChange({
        fromDate: value || '',
        toDate: toDate || ''
      });
    }
  };

  const handleToChange = (value) => {
    if (onChange) {
      onChange({
        fromDate: fromDate || '',
        toDate: value || ''
      });
    }
  };

  const handleClear = (type) => {
    if (onChange) {
      if (type === 'from') {
        onChange({
          fromDate: '',
          toDate: toDate || ''
        });
      } else {
        onChange({
          fromDate: fromDate || '',
          toDate: ''
        });
      }
    }
  };

  const handleClearAll = () => {
    if (onChange) {
      onChange({
        fromDate: '',
        toDate: ''
      });
    }
  };

  const wrapperClasses = [
    styles.wrapper,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const hasValue = (showFrom && fromDate) || (showTo && toDate);

  return (
    <div className={wrapperClasses} data-empty={!hasValue ? 'true' : 'false'}>
      {label && (
        <div className={styles.labelRow}>
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
          {clearable && hasValue && (
            <button
              type="button"
              className={styles.clearAllButton}
              onClick={handleClearAll}
              disabled={disabled}
              aria-label="Clear all dates"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      )}
      
      <div className={styles.inputsContainer}>
        {showFrom && (
          <div className={styles.dateInputWrapper}>
            <DatePicker
              type="date"
              value={fromDate}
              onChange={handleFromChange}
              placeholder={placeholderFrom}
              error={error}
              disabled={disabled}
              required={required && showFrom}
              min={min}
              max={toDate || max}
              fullWidth
            />
            {clearable && fromDate && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => handleClear('from')}
                disabled={disabled}
                aria-label="Clear from date"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {showFrom && showTo && (
          <div className={styles.separator}>
            <span className={styles.separatorText}>to</span>
          </div>
        )}

        {showTo && (
          <div className={styles.dateInputWrapper}>
            <DatePicker
              type="date"
              value={toDate}
              onChange={handleToChange}
              placeholder={placeholderTo}
              error={error}
              disabled={disabled}
              required={required && showTo}
              min={fromDate || min}
              max={max}
              fullWidth
            />
            {clearable && toDate && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => handleClear('to')}
                disabled={disabled}
                aria-label="Clear to date"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};

export default DateRangeSlider;

