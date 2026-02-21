import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';

const Slider = ({ 
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  mode = 'single', // 'single' or 'range'
  disabled = false,
  showValue = true,
  label = '',
  className = '',
  style = {}
}) => {
  const { t } = useLang();
  const { theme } = useTheme();
  
  // Local state for drag operations
  const [localValue, setLocalValue] = useState(
    mode === 'range' ? (value || [min, min]) : (value || min)
  );
  const [isDragging, setIsDragging] = useState(false);

  // Sync with external value when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(
        mode === 'range' ? (value || [min, min]) : (value || min)
      );
    }
  }, [value, mode, min, isDragging]);

  // Handle value changes during drag (local only)
  const handleLocalChange = (newValue) => {
    setLocalValue(newValue);
  };

  // Handle final value on release
  const handleFinalChange = () => {
    setIsDragging(false);
    if (onChange) {
      onChange(localValue);
    }
  };

  const handleSingleChange = (e) => {
    const newValue = parseInt(e.target.value);
    handleLocalChange(newValue);
  };

  const handleRangeChange = (type, e) => {
    const newValue = parseInt(e.target.value);
    const newRange = [...localValue];
    
    if (type === 'min') {
      newRange[0] = Math.min(newValue, newRange[1]);
    } else {
      newRange[1] = Math.max(newValue, newRange[0]);
    }
    
    handleLocalChange(newRange);
  };

  const getSliderStyles = () => {
    const baseStyles = {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      outline: 'none',
      background: disabled ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#d1d5db'),
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    };

    if (mode === 'range' && localValue && localValue.length === 2) {
      const percentage1 = ((localValue[0] - min) / (max - min)) * 100;
      const percentage2 = ((localValue[1] - min) / (max - min)) * 100;
      
      return {
        ...baseStyles,
        background: `linear-gradient(to right, ${
          theme === 'dark' ? '#3b82f6' : '#2563eb'
        } 0%, ${
          theme === 'dark' ? '#3b82f6' : '#2563eb'
        } ${percentage1}%, ${
          disabled ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#d1d5db')
        } ${percentage1}%, ${
          disabled ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#d1d5db')
        } ${percentage2}%, ${
          theme === 'dark' ? '#3b82f6' : '#2563eb'
        } ${percentage2}%, ${
          theme === 'dark' ? '#3b82f6' : '#2563eb'
        } 100%)`
      };
    }

    return baseStyles;
  };

  const getThumbStyles = (isActive = false) => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: disabled ? '#9ca3af' : (theme === 'dark' ? '#3b82f6' : '#2563eb'),
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '2px solid white',
    boxShadow: isActive ? '0 4px 8px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.2)',
    transform: isActive ? 'scale(1.2)' : 'scale(1)',
    transition: 'all 0.2s ease',
  });

  const renderSingleSlider = () => (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ 
          marginBottom: '12px', 
          fontSize: '14px', 
          fontWeight: '500',
          color: theme === 'dark' ? '#f9fafb' : '#111827',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{label}</span>
          {showValue && (
            <span style={{ 
              color: theme === 'dark' ? '#3b82f6' : '#2563eb',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {isDragging ? localValue : (value || min)}
            </span>
          )}
        </div>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={isDragging ? localValue : (value || min)}
          onChange={handleSingleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleFinalChange}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleFinalChange}
          disabled={disabled}
          style={{
            ...getSliderStyles(),
            flex: 1,
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none'
          }}
        />
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            ${getThumbStyles(isDragging)}
          }
          input[type="range"]::-moz-range-thumb {
            ${getThumbStyles(isDragging)}
          }
        `}</style>
      </div>
    </div>
  );

  const renderRangeSlider = () => (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ 
          marginBottom: '12px', 
          fontSize: '14px', 
          fontWeight: '500',
          color: theme === 'dark' ? '#f9fafb' : '#111827',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{label}</span>
          {showValue && (
            <span style={{ 
              color: theme === 'dark' ? '#3b82f6' : '#2563eb',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {isDragging ? `${localValue[0]} - ${localValue[1]}` : 
                (value && value.length === 2 ? `${value[0]} - ${value[1]}` : `${min} - ${min}`)}
            </span>
          )}
        </div>
      )}
      <div style={{ position: 'relative', padding: '10px 0' }}>
        {/* Background track */}
        <div style={{
          ...getSliderStyles(),
          position: 'absolute',
          top: '50%',
          left: '0',
          right: '0',
          transform: 'translateY(-50%)',
          pointerEvents: 'none'
        }} />
        
        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={isDragging ? localValue[0] : (value && value[0] !== undefined ? value[0] : min)}
          onChange={(e) => handleRangeChange('min', e)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleFinalChange}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleFinalChange}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            right: '0',
            transform: 'translateY(-50%)',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            pointerEvents: disabled ? 'none' : 'auto',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none'
          }}
        />
        
        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={isDragging ? localValue[1] : (value && value[1] !== undefined ? value[1] : min)}
          onChange={(e) => handleRangeChange('max', e)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleFinalChange}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleFinalChange}
          disabled={disabled}
          style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            right: '0',
            transform: 'translateY(-50%)',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            pointerEvents: disabled ? 'none' : 'auto',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none'
          }}
        />
        
        {/* Visual thumbs */}
        <div
          style={{
            ...getThumbStyles(isDragging),
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            left: `${((localValue[0] - min) / (max - min)) * 100}%`,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
        <div
          style={{
            ...getThumbStyles(isDragging),
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            left: `${((localValue[1] - min) / (max - min)) * 100}%`,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
        
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            ${getThumbStyles(isDragging)}
          }
          input[type="range"]::-moz-range-thumb {
            ${getThumbStyles(isDragging)}
          }
        `}</style>
      </div>
    </div>
  );

  return (
    <div className={`slider-component ${className}`}>
      {mode === 'range' ? renderRangeSlider() : renderSingleSlider()}
    </div>
  );
};

export default Slider;
