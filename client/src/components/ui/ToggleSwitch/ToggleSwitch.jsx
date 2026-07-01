import React from 'react';
import styles from './ToggleSwitch.module.css';

/**
 * Accessible toggle switch. Track dimensions scale with --type-base while
 * preserving pill aspect ratio (immune to global button min-height rules).
 */
const ToggleSwitch = ({
  checked,
  onChange,
  label,
  disabled = false,
  labelPosition = 'right',
  id,
  className = '',
}) => {
  const stacked = labelPosition === 'below';
  const rootClass = [
    stacked ? styles.rootStacked : styles.root,
    disabled ? styles.rootDisabled : '',
    className,
  ].filter(Boolean).join(' ');

  const handleChange = () => {
    if (!disabled) onChange(!checked);
  };

  return (
    <div className={rootClass}>
      <button
        type="button"
        role="switch"
        id={id}
        className={`toggle-switch ${styles.track} ${checked ? styles.trackOn : styles.trackOff}`}
        aria-checked={checked}
        aria-label={label || undefined}
        disabled={disabled}
        onClick={handleChange}
      >
        <span
          className={`${styles.thumb} ${checked ? styles.thumbOn : styles.thumbOff}`}
          aria-hidden="true"
        />
      </button>
      {label && (
        <span className={stacked ? styles.labelStacked : styles.label}>{label}</span>
      )}
    </div>
  );
};

export default ToggleSwitch;
