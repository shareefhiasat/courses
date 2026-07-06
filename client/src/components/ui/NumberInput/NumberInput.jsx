import React, { forwardRef, useMemo } from 'react';
import { useTheme } from '@contexts/ThemeContext';

/**
 * NumberInput Component
 *
 * A compact number input with +/- step buttons.
 * Works as a controlled component: value + onChange.
 *
 * @param {Object} props
 * @param {number} props.value - Current value
 * @param {Function} props.onChange - Called with the new numeric value
 * @param {number} [props.min=-Infinity] - Minimum allowed value
 * @param {number} [props.max=Infinity] - Maximum allowed value
 * @param {number} [props.step=1] - Increment/decrement step
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.readOnly=false] - If true, value can only be changed via +/- buttons
 * @param {string} [props.width='52px'] - Input width
 * @param {string} [props.ariaLabel] - Accessibility label
 */
const NumberInput = forwardRef(({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  disabled = false,
  readOnly = false,
  width = '52px',
  ariaLabel,
  ...rest
}, ref) => {
  const { isDarkMode } = useTheme();

  const decimalPlaces = useMemo(() => {
    const str = step.toString();
    if (str.includes('e')) return 0;
    const idx = str.indexOf('.');
    return idx === -1 ? 0 : str.length - idx - 1;
  }, [step]);

  const clamp = (val) => {
    let v = Math.round(val / step) * step;
    v = Number(v.toFixed(decimalPlaces));
    if (v < min) v = min;
    if (v > max) v = max;
    return v;
  };

  const handleChange = (e) => {
    const raw = e.target.value === '' ? (Number.isFinite(min) ? min : 0) : Number(e.target.value);
    onChange?.(clamp(raw));
  };

  const decrement = () => onChange?.(clamp((value || 0) - step));
  const increment = () => onChange?.(clamp((value || 0) + step));

  const btnBase = {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    border: '1px solid var(--border)',
    borderRadius: '4px',
    background: isDarkMode ? '#1f2937' : '#f3f4f6',
    color: 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    padding: 0,
  };

  const inputStyle = {
    width,
    height: '20px',
    fontSize: '0.7rem',
    lineHeight: '18px',
    padding: '0 4px',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    textAlign: 'center',
    background: 'transparent',
    color: 'var(--text)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
      <style>{`
        .number-input-spinless::-webkit-outer-spin-button,
        .number-input-spinless::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .number-input-spinless {
          -moz-appearance: textfield;
        }
      `}</style>
      <button
        type="button"
        onClick={decrement}
        disabled={disabled}
        style={btnBase}
        aria-label={`${ariaLabel ? `${ariaLabel} ` : ''}decrease`}
      >
        -
      </button>
      <input
        ref={ref}
        type="number"
        className="number-input-spinless"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        readOnly={readOnly}
        style={inputStyle}
        aria-label={ariaLabel}
        {...rest}
      />
      <button
        type="button"
        onClick={increment}
        disabled={disabled}
        style={btnBase}
        aria-label={`${ariaLabel ? `${ariaLabel} ` : ''}increase`}
      >
        +
      </button>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

export default NumberInput;
