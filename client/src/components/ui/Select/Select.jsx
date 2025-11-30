import React, { forwardRef, useState, useRef, useEffect } from 'react';
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens (position handled via CSS for better alignment)
  useEffect(() => {
    if (isOpen) {
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [isOpen, searchable]);

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { value: '' } });
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
          <span className={!value ? styles.placeholder : ''}>
            {displayValue}
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

        {isOpen && (
          <div 
            className={styles.dropdown}
            style={{
              top: 'calc(100% + 4px)',
              left: 0,
              width: '100%'
            }}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <div className={styles.noOptions}>No options found</div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`${styles.option} ${value === option.value ? styles.selected : ''}`}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    {option.label}
                  </div>
                ))
              )}
            </div>
          </div>
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
