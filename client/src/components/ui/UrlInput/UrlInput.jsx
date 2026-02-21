import React, { forwardRef, useMemo } from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './UrlInput.module.css';

/**
 * UrlInput
 * - Better UX for URLs with prefix icon and quick actions (open, copy, clear)
 * - Validates URL and shows error styling
 */
const isValidUrl = (val) => {
  if (!val) return true; // allow empty if not required
  try {
    // Accept without protocol by testing with https:// fallback first
    const withProto = /^https?:\/\//i.test(val) ? val : `https://${val}`;
     
    new URL(withProto);
    return true;
  } catch {
    return false;
  }
};

const normalizeUrl = (val) => {
  if (!val) return '';
  return /^https?:\/\//i.test(val) ? val : `https://${val}`;
};

const UrlInput = forwardRef(({ 
  label,
  placeholder = 'https://... or domain.com',
  value = '',
  onChange,
  required = false,
  disabled = false,
  fullWidth = false,
  helperText,
  error,
  className = '',
  onOpen,
  onCopy,
  onClear,
  size = 'medium',
  name,
  id,
}, ref) => {
  const valid = useMemo(() => isValidUrl(value), [value]);
  const hasError = !!error || !valid;

  const wrapperClasses = [styles.wrapper, fullWidth && styles.fullWidth, className].filter(Boolean).join(' ');
  const inputClasses = [styles.input, hasError && styles.error].filter(Boolean).join(' ');

  const handleOpen = (e) => {
    e.preventDefault();
    if (!value || !valid) return;
    const href = normalizeUrl(value);
    try { window.open(href, '_blank', 'noopener,noreferrer'); } catch {}
    onOpen?.(href);
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(value || ''); } catch {}
    onCopy?.(value || '');
  };

  const handleClear = (e) => {
    e.preventDefault();
    onChange?.({ target: { value: '' } });
    onClear?.();
  };

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className={styles.label} htmlFor={id || name}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.container}>
        {!value && (
          <span className={styles.prefix} aria-hidden>
            {getThemedIcon('ui', 'link', 16)}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          name={name}
          type="url"
          className={inputClasses}
          placeholder={!value && placeholder ? `      ${placeholder}` : placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          autoComplete="off"
          inputMode="url"
        />
        <span className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={handleOpen} title="Open in new tab" disabled={!value || !valid}> 
            {getThemedIcon('ui', 'external_link', 14)}
          </button>
          <button type="button" className={styles.actionBtn} onClick={handleCopy} title="Copy URL" disabled={!value}>
            {getThemedIcon('ui', 'copy', 14)}
          </button>
          <button type="button" className={styles.actionBtn} onClick={handleClear} title="Clear">
            {getThemedIcon('ui', 'close', 14)}
          </button>
        </span>
      </div>
      {(hasError || helperText) && (
        <span className={hasError ? styles.errorText : styles.helperText}>
          {hasError ? (error || 'Invalid URL') : helperText}
        </span>
      )}
    </div>
  );
});

UrlInput.displayName = 'UrlInput';

export default UrlInput;
