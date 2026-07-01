import React, { useState, useRef, useEffect } from 'react';
import styles from './DatePicker.module.css';
import { getThemedIcon } from '@constants/iconTypes';

/**
 * DatePicker Component
 *
 * Date and time picker with native input fallback.
 */

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_FLEX_REGEX = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
const DATE_DMY_REGEX = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function isoToDisplay(iso) {
  if (!iso || !ISO_DATE_REGEX.test(iso)) return iso || '';
  const [, y, mo, d] = iso.match(ISO_DATE_REGEX);
  return `${d}/${mo}/${y}`;
}

function isValidCalendarDate(iso) {
  if (!ISO_DATE_REGEX.test(iso)) return false;
  const [, y, mo, d] = iso.match(ISO_DATE_REGEX);
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

function normalizeDate(str) {
  if (!str) return null;
  const trimmed = String(str).trim();
  if (ISO_DATE_REGEX.test(trimmed)) {
    return isValidCalendarDate(trimmed) ? trimmed : null;
  }

  const dmy = trimmed.match(DATE_DMY_REGEX);
  if (dmy) {
    const [, d, mo, y] = dmy;
    const iso = `${y}-${pad2(mo)}-${pad2(d)}`;
    return isValidCalendarDate(iso) ? iso : null;
  }

  const m = trimmed.match(DATE_FLEX_REGEX);
  if (!m) return null;
  const [, y, mo, d] = m;
  const iso = `${y}-${pad2(mo)}-${pad2(d)}`;
  return isValidCalendarDate(iso) ? iso : null;
}

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
  theme = 'light',
  showIcon = true,
}) => {
  const [focused, setFocused] = useState(false);
  const [textValue, setTextValue] = useState(value || '');
  const inputRef = useRef(null);
  const hiddenDateRef = useRef(null);

  const useTextInput = !showTime && type === 'date';
  const nativeInputType = showTime ? 'datetime-local' : (type === 'datetime' ? 'datetime-local' : type);

  useEffect(() => {
    if (useTextInput && !focused) {
      setTextValue(isoToDisplay(value || ''));
    }
  }, [value, useTextInput, focused]);

  const commitDate = (raw, { revertOnFail = false } = {}) => {
    const normalized = normalizeDate(raw);
    if (normalized) {
      setTextValue(isoToDisplay(normalized));
      onChange(normalized);
      return true;
    }
    if (revertOnFail && value) {
      setTextValue(isoToDisplay(value));
    }
    return false;
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setTextValue(val);
    commitDate(val);
  };

  const handleTextBlur = (e) => {
    setFocused(false);
    if (!commitDate(e.target.value, { revertOnFail: true })) {
      if (value) setTextValue(isoToDisplay(value));
    }
  };

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitDate(e.target.value, { revertOnFail: true });
      e.currentTarget.blur();
      return;
    }
    if (e.key === '/') {
      requestAnimationFrame(() => {
        commitDate(inputRef.current?.value || '');
      });
    }
  };

  const handlePickerChange = (e) => {
    const val = e.target.value;
    setTextValue(isoToDisplay(val));
    onChange(val);
  };

  const openPicker = () => {
    const el = hiddenDateRef.current;
    if (!el) return;
    el.focus();
    try { el.showPicker(); } catch (_) { /* native picker */ }
  };

  const wrapperClasses = [
    styles.wrapper,
    useTextInput && styles.dateInputLtr,
    fullWidth && styles.fullWidth,
    className,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    error && styles.error,
    disabled && styles.disabled,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={wrapperClasses}
      data-theme={theme}
      data-empty={!value ? 'true' : 'false'}
      dir={useTextInput ? 'ltr' : undefined}
    >
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {useTextInput ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={textValue}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            onFocus={() => setFocused(true)}
            placeholder={placeholder || 'DD/MM/YYYY'}
            disabled={disabled}
            required={required}
            className={inputClasses}
            autoComplete="off"
          />
        ) : (
          <input
            ref={inputRef}
            type={nativeInputType}
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
        )}
        {showIcon && (
          <div
            className={styles.iconWrapper}
            onClick={useTextInput ? openPicker : () => {
              if (!inputRef.current) return;
              inputRef.current.focus();
              try { inputRef.current.showPicker(); } catch (_) { /* native indicator handles it */ }
            }}
          >
            {useTextInput && (
              <input
                ref={hiddenDateRef}
                type="date"
                value={value || ''}
                onChange={handlePickerChange}
                min={min}
                max={max}
                className={styles.hiddenDateInput}
                tabIndex={-1}
                aria-label="Open date picker"
                disabled={disabled}
              />
            )}
            {getThemedIcon('ui', 'calendar', 14, theme)}
          </div>
        )}
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};

export default DatePicker;
