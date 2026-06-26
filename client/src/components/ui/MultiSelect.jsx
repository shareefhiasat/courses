import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import selectStyles from './Select/Select.module.css';

/**
 * MultiSelect Component - Professional multi-select dropdown
 *
 * Features:
 * - Searchable dropdown
 * - Checkbox selection
 * - Pill display for selected items
 * - Keyboard navigation
 * - Theme-aware styling
 * - Optional label (matches Select component)
 */
const MultiSelect = ({
  label,
  required = false,
  helperText,
  error,
  fullWidth = true,
  options = [],
  value = [],
  onChange,
  placeholder,
  searchPlaceholder,
  searchable = true,
  disabled = false,
  maxVisibleItems = 6,
  className = '',
  style = {}
}) => {
  const { theme } = useTheme();
  const { t } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const isDark = theme === 'dark';
  const localizedPlaceholder = placeholder || t('select_options') || 'Select options...';
  const localizedSearchPlaceholder = searchPlaceholder || t('search') || 'Search...';

  const wrapperClasses = [
    selectStyles.selectWrapper,
    fullWidth && selectStyles.fullWidth,
    className,
  ].filter(Boolean).join(' ');

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen || disabled) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            const optionValue = filteredOptions[highlightedIndex].value;
            const isSelected = value.includes(optionValue);
            const newValue = isSelected
              ? value.filter(v => v !== optionValue)
              : [...value, optionValue];
            onChange(newValue);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, disabled, value, onChange]);

  const toggleOption = (optionValue) => {
    const isSelected = value.includes(optionValue);
    const newValue = isSelected
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onChange(newValue);
  };

  const removeOption = (optionValue, event) => {
    event.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const getSelectedLabels = () => {
    return value.map(val => {
      const option = options.find(opt => opt.value === val);
      return option ? option : { value: val, label: val, icon: null };
    });
  };

  return (
    <div className={wrapperClasses} style={style}>
      {label && (
        <label className={selectStyles.label}>
          {label}
          {required && <span className={selectStyles.required}>*</span>}
        </label>
      )}

      <div
        ref={dropdownRef}
        className="multi-select"
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
      {/* Selected items display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          minHeight: '42px',
          padding: '8px 12px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isOpen ? (isDark ? '#60a5fa' : '#3b82f6') : (isDark ? '#374151' : '#d1d5db'),
          borderRadius: '6px',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          position: 'relative',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
          ...(isOpen && {
            boxShadow: `0 0 0 1px ${isDark ? '#60a5fa' : '#3b82f6'}`
          })
        }}
      >
        {value.length === 0 ? (
          <span style={{
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '14px'
          }}>
            {localizedPlaceholder}
          </span>
        ) : (
          getSelectedLabels().map((item, index) => (
            <span
              key={item.value}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                borderRadius: '4px',
                fontSize: '13px',
                color: isDark ? '#e5e7eb' : '#374151'
              }}
            >
              {item.icon && (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {!disabled && (
                <button
                  onClick={(e) => removeOption(item.value, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    cursor: 'pointer',
                    padding: '0',
                    fontSize: '16px',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isDark ? '#4b5563' : '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
        
        {/* Dropdown arrow */}
        <span style={{
          marginLeft: 'auto',
          color: isDark ? '#9ca3af' : '#6b7280',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
          borderRadius: '6px',
          boxShadow: `0 4px 6px -1px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
          zIndex: 1000,
          maxHeight: '300px',
          overflow: 'hidden'
        }}>
          {/* Search input */}
          {searchable && (
            <div style={{ padding: '8px', borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={localizedSearchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
                  borderRadius: '4px',
                  backgroundColor: isDark ? '#111827' : '#ffffff',
                  color: isDark ? '#e5e7eb' : '#374151',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Options list */}
          <div style={{ maxHeight: maxVisibleItems * 40, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                color: isDark ? '#9ca3af' : '#6b7280',
                fontSize: '14px'
              }}>
                {t('no_options_found') || 'No options found'}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = value.includes(option.value);
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected 
                        ? (isDark ? '#374151' : '#f3f4f6')
                        : (isHighlighted 
                          ? (isDark ? '#374151' : '#f9fafb')
                          : 'transparent'),
                      color: isDark ? '#e5e7eb' : '#374151',
                      fontSize: '14px',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: `1px solid ${isSelected ? (option.color || (isDark ? '#60a5fa' : '#3b82f6')) : (isDark ? '#4b5563' : '#d1d5db')}`,
                      borderRadius: '3px',
                      backgroundColor: isSelected ? (option.color || (isDark ? '#60a5fa' : '#3b82f6')) : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && (
                        <span style={{ color: '#ffffff', fontSize: '12px' }}>✓</span>
                      )}
                    </div>
                    
                    {/* Icon */}
                    {option.icon && (
                      <span style={{ color: option.color || (isDark ? '#9ca3af' : '#6b7280') }}>
                        {option.icon}
                      </span>
                    )}
                    
                    {/* Label */}
                    <span style={{ flex: 1 }}>{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      </div>

      {(error || helperText) && (
        <span className={error ? selectStyles.errorText : selectStyles.helperText}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};

export default MultiSelect;
