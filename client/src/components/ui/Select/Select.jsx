import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import styles from './Select.module.css';

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
  ...rest
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((event) => {
    console.log('🔵 [Select] handleClickOutside triggered');
    console.log('🔵 [Select] Event target:', event.target);
    
    // Don't close if clicking on the select itself or its children
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      // Check if the click is on a dropdown option or inside the dropdown portal
      const isOptionClick = event.target.closest(`.${styles.option}`) || 
                           (dropdownRef.current && dropdownRef.current.contains(event.target));
      
      if (!isOptionClick) {
        console.log('🔵 [Select] Click outside detected, closing dropdown');
        setIsOpen(false);
        setSearchTerm('');
      } else {
        console.log('🔵 [Select] Click on option/dropdown, keeping dropdown open');
      }
    }
  }, []);

  // Add/remove click outside listener
  useEffect(() => {
    if (isOpen) {
      console.log('🔵 [Select] Adding click outside listener');
      // Use a small delay to avoid immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true); // Use capture phase
      }, 10);
      return () => {
        console.log('🔵 [Select] Removing click outside listener');
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }
  }, [isOpen, handleClickOutside]);

  // Calculate dropdown position when it opens and update on scroll/resize (for portal/fixed positioning)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const scrollX = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
        setDropdownPosition({
          top: rect.bottom + scrollY + 4,
          left: rect.left + scrollX,
          width: rect.width
        });
      };
      
      // Initial position
      updatePosition();
      
      // Update on scroll and resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
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

  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        getOptionSearchText(option).includes(searchTerm.toLowerCase())
      )
    : options;

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption
    ? (selectedOption.displayLabel ??
        (typeof selectedOption.label === 'string'
          ? selectedOption.label
          : (selectedOption.text || selectedOption.value || placeholder)))
    : placeholder;

  const handleSelect = (optionValue) => {
    console.log('🔵 [Select] handleSelect called with:', optionValue);
    console.log('🔵 [Select] Current value before update:', value);
    
    try {
      // Normalize the value to ensure it's a string
      const normalizedValue = optionValue !== null && optionValue !== undefined 
        ? String(optionValue) 
        : '';
      
      console.log('🔵 [Select] Normalized value:', normalizedValue);
      
      // Create the event object
      const event = { 
        target: { 
          value: normalizedValue,
          name: rest.name || ''
        },
        currentTarget: {
          value: normalizedValue,
          name: rest.name || ''
        },
        // Add preventDefault and stopPropagation to match DOM event interface
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      
      console.log('🔵 [Select] Calling onChange with event:', event);
      
      // Call the onChange handler if it's a function
      if (typeof onChange === 'function') {
        console.log('🔵 [Select] Calling onChange handler');
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
        console.error('❌ [Select] onChange is not a function:', onChange);
      }
      
      // Close the dropdown and clear search
      setIsOpen(false);
      setSearchTerm('');
      
      console.log('✅ [Select] handleSelect completed for value:', normalizedValue);
    } catch (error) {
      console.error('❌ [Select] Error in handleSelect:', error);
    }
  };

  const handleClear = (e) => {
    console.log('🔄 [Select] handleClear called');
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
    
    console.log('🔄 [Select] Calling onChange with clear event:', event);
    
    if (typeof onChange === 'function') {
      onChange(event);
    } else {
      console.error('❌ [Select] onChange is not a function in handleClear:', onChange);
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
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className={styles.arrow} size={16} />
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
          <span className={!value ? styles.placeholder : ''} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
            {selectedOption?.icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{selectedOption.icon}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayValue}</span>
          </span>
          <div className={styles.icons}>
            {value && !disabled && (
              <X
                className={styles.clearIcon}
                size={16}
                onClick={handleClear}
              />
            )}
            <ChevronDown
              className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}
              size={16}
            />
          </div>
        </div>

        {isOpen && createPortal(
          <div 
            ref={dropdownRef}
            className={styles.dropdown}
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {searchable && (
              <div className={styles.searchContainer}>
                <Search className={styles.searchIcon} size={16} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="      Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value || '')}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <div className={styles.noOptions}>No options found</div>
              ) : (
                filteredOptions.map((option, index) => {
                  const optionClasses = [
                    styles.option,
                    option.value === value && styles.selected,
                    option.disabled && styles.disabled
                  ].filter(Boolean).join(' ');

                  const handleOptionClick = (e) => {
                    console.log('🟢 [Select] Option clicked:', option.value);
                    console.log('🟢 [Select] Event:', e);
                    console.log('🟢 [Select] Current target:', e.currentTarget);
                    
                    // Prevent the event from bubbling up to document
                    e.stopPropagation();
                    if (e.nativeEvent) {
                      e.nativeEvent.stopImmediatePropagation();
                    }
                    
                    // Manually handle the selection
                    handleSelect(option.value);
                  };

                  return (
                    <div
                      key={`${option.value}-${index}`}
                      className={optionClasses}
                      onClick={handleOptionClick}
                      data-testid={`option-${option.value}`}
                      style={{ 
                        cursor: 'pointer',
                        padding: '8px 12px',
                        backgroundColor: option.value === value ? '#f0f0f0' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {option.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{option.icon}</span>}
                      {option.label}
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
