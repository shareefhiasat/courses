import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '@contexts/LangContext';
import { getIcon } from '@constants/iconTypes';
import styles from './Select.module.css';
import { getComponentStyles, generateCSSVariables } from '@constants/uiTheme';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Select Component
 *
 * Enhanced select dropdown with autocomplete/search capability.
 *
 * @param {Object} props
 * @param {string} props.label - Select label
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below select
 * @param {boolean} props.disabled - Whether select is disabled
 * @param {boolean} props.required - Whether select is required
 * @param {'small'|'medium'|'large'} props.size - Select size
 * @param {boolean} props.fullWidth - Whether select takes full width
 * @param {boolean} props.searchable - Enable search/autocomplete
 * @param {string} props.className - Additional CSS classes
 * @param {'light'|'dark'} props.theme - Theme variant
 */
const Select = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  helperText,
  disabled = false,
  required = false,
  size = 'medium',
  fullWidth = false,
  searchable = true,
  className = '',
  theme = 'light',
  onSearchChange,
  searchPlaceholder,
  ...rest
}, ref) => {
  const { t } = useLang();

  // Localize placeholder inside component body
  const localizedPlaceholder = placeholder === 'Select an option' ? (t('select_an_option') || 'Select an option') : (placeholder || t('select_an_option') || 'Select an option');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const positionUpdateRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Get theme-aware styles
  const themeStyles = getComponentStyles(theme, 'select', 'default', size);
  
  // Generate CSS variables for theme
  const cssVariables = generateCSSVariables(theme);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((event) => {
    // console.log('🔵 [Select] handleClickOutside triggered');
    // console.log('🔵 [Select] Event target:', event.target);

    // Don't close if clicking on the select itself or its children
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      // Check if the click is on a dropdown option or inside the dropdown portal
      const isOptionClick = event.target.closest(`.${styles.option}`) ||
                           (dropdownRef.current && dropdownRef.current.contains(event.target));

      if (!isOptionClick) {
        // console.log('🔵 [Select] Click outside detected, closing dropdown');
        setIsOpen(false);
        setSearchTerm('');
        setIsPositioned(false);
      } else {
        // console.log('🔵 [Select] Click on option/dropdown, keeping dropdown open');
      }
    }
  }, []);

  // Debounced search handler to prevent focus loss
  const handleSearchChange = useCallback((e) => {
    const v = e.target.value || '';
    setSearchTerm(v);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the onSearchChange call
    if (onSearchChange) {
      searchTimeoutRef.current = setTimeout(() => {
        onSearchChange(v);
      }, 300);
    }
  }, [onSearchChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Add/remove click outside listener
  useEffect(() => {
    if (isOpen) {
      // console.log('🔵 [Select] Adding click outside listener');
      // Use a small delay to avoid immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true); // Use capture phase
      }, 10);
      return () => {
        // console.log('🔵 [Select] Removing click outside listener');
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [isOpen, handleClickOutside]);

  // Calculate dropdown position when it opens and update on scroll/resize (for portal/fixed positioning)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        // Cancel any pending position update
        if (positionUpdateRef.current) {
          cancelAnimationFrame(positionUpdateRef.current);
        }

        positionUpdateRef.current = requestAnimationFrame(() => {
          if (!containerRef.current) return;
          
          const rect = containerRef.current.getBoundingClientRect();
          
          // position:fixed uses viewport coords — no scroll offset needed
          setDropdownPosition({
            top: rect.bottom,
            left: rect.left,
            width: rect.width
          });
          
          setIsPositioned(true);
        });
      };
      
      // Initial position calculation
      updatePosition();
      
      // Update on scroll and resize with passive listeners
      const scrollHandler = () => updatePosition();
      const resizeHandler = () => updatePosition();
      
      window.addEventListener('scroll', scrollHandler, { passive: true });
      window.addEventListener('resize', resizeHandler, { passive: true });
      
      return () => {
        if (positionUpdateRef.current) {
          cancelAnimationFrame(positionUpdateRef.current);
        }
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('resize', resizeHandler);
      };
    } else {
      setIsPositioned(false);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      if (searchable && searchInputRef.current) {
        // Small delay to ensure the dropdown is rendered
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 50);
      }
    }
  }, [isOpen, searchable]);

  // Filter options based on search term
  const getOptionSearchText = (option) => {
    if (!option) return '';
    if (option.searchText) return String(option.searchText).toLowerCase();
    if (option.displayLabel) return String(option.displayLabel).toLowerCase();
    if (option.text) return String(option.text).toLowerCase();
    if (typeof option.label === 'string') return option.label.toLowerCase();
    if (typeof option.value === 'string') return option.value.toLowerCase();
    return '';
  };

  const filteredOptions = onSearchChange
    ? options
    : (searchable && searchTerm
      ? options.filter(option =>
          getOptionSearchText(option).includes(searchTerm.toLowerCase())
        )
      : options);

  // Get selected option label
  // Use loose equality (==) to handle string/number type mismatches
  // e.g., when value is "1" (string) and opt.value is 1 (number)
  const selectedOption = options.find(opt => opt.value == value);
  const displayValue = selectedOption
    ? (selectedOption.displayLabel ??
        (typeof selectedOption.label === 'string'
          ? selectedOption.label
          : (selectedOption.text || selectedOption.value || localizedPlaceholder)))
    : (onSearchChange && searchTerm ? searchTerm : localizedPlaceholder);

  const handleSelect = (optionValue) => {
    try {
      // Normalize the value to ensure it's a string
      const normalizedValue = optionValue !== null && optionValue !== undefined 
        ? String(optionValue) 
        : '';
      
      // Create the event object
      const event = { 
        target: { value: normalizedValue },
        currentTarget: { value: normalizedValue },
        value: normalizedValue,
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      
      // Call the onChange handler if it's a function
      if (typeof onChange === 'function') {
        // Call with the event object that has both target.value and a direct value property
        const enhancedEvent = {
          ...event,
          value: normalizedValue, // Add direct value property for convenience
          target: {
            ...event.target,
            value: normalizedValue
          }
        };
        onChange(enhancedEvent);
      } else {
        error('❌ [Select] onChange is not a function:', onChange);
      }
      
      // Close the dropdown and clear search
      setIsOpen(false);
      setSearchTerm('');
      setIsPositioned(false);
    } catch (err) {
      console.error('❌ [Select] Error in handleSelect:', err);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    
    const event = {
      target: { 
        value: '',
        name: rest.name || ''
      },
      currentTarget: {
        value: '',
        name: rest.name || ''
      }
    };
    
    if (typeof onChange === 'function') {
      onChange(event);
    } else {
      error('❌ [Select] onChange is not a function in handleClear:', onChange);
    }
  };
  const wrapperClasses = [
    styles.selectWrapper,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const selectClasses = [
    styles.select,
    styles[size],
    error && styles.error,
    disabled && styles.disabled,
    isOpen && styles.open
  ].filter(Boolean).join(' ');

  // If not searchable, use native select
  if (!searchable) {
    return (
      <div className={wrapperClasses}>
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <div className={styles.selectContainer}>
          <select
            ref={ref}
            className={selectClasses}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            {...rest}
          >
            {localizedPlaceholder && (
              <option value="" disabled>
                {localizedPlaceholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {getIcon('ui', 'chevron_down', 16)}
        </div>
        
        {(error || helperText) && (
          <span className={error ? styles.errorText : styles.helperText}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }

  // Searchable/Custom dropdown
  return (
    <div className={wrapperClasses} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.customSelectContainer}>
        <div
          className={selectClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              !disabled && setIsOpen(!isOpen);
            }
          }}
        >
          <div className={styles.selectContent}>
            <span className={!value ? styles.placeholder : ''} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
              {selectedOption?.icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{selectedOption.icon}</span>}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayValue}</span>
            </span>
          </div>
          <div className={styles.icons}>
            {value && !disabled && (
              <button
                className={styles.clearIcon}
                onClick={handleClear}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {getIcon('ui', 'close', 16)}
              </button>
            )}
            {getIcon('ui', 'chevron_down', 16)}
          </div>
        </div>

        {isOpen && isPositioned && createPortal(
          <div 
            ref={dropdownRef}
            className={styles.dropdown}
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${Math.max(dropdownPosition.width, 200)}px`,
              zIndex: 99999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {searchable && (
              <div className={styles.searchContainer}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder={searchPlaceholder || t('search') || 'Search...'}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>
            )}
            
            <div className={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <div className={styles.noOptions}>{t('no_options_found') || 'No options found'}</div>
              ) : (
                filteredOptions.map((option, index) => {
                  const optionClasses = [
                    styles.option,
                    option.value === value && styles.selected,
                    option.disabled && styles.disabled
                  ].filter(Boolean).join(' ');

                  const handleOptionClick = (e) => {
                    // Prevent the event from bubbling up to document
                    e.stopPropagation();
                    if (e.nativeEvent) {
                      e.nativeEvent.stopImmediatePropagation();
                    }
                    
                    // Manually handle the selection
                    handleSelect(option.value);
                  };

                  const isDarkMode = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
                  
                  return (
                    <div
                      key={`${option.value}-${index}`}
                      className={optionClasses}
                      onClick={handleOptionClick}
                      data-testid={`option-${option.value}`}
                      style={{ 
                        cursor: 'pointer',
                        padding: '8px 12px',
                        backgroundColor: option.value === value ? 'var(--primary-light, #eef2ff)' : 'transparent',
                        color: option.value === value ? 'var(--primary, #800020)' : 'inherit',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        {option.icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{option.icon}</span>}
                        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.label}</span>
                          {option.subtext && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.subtext}</span>}
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
      
      {(error || helperText) && (
        <span className={error ? styles.errorText : styles.helperText}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
