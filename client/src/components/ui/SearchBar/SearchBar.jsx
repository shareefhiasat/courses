import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

/**
 * SearchBar Component
 * 
 * A search input with clear button.
 */
const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) onChange('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(localValue);
  };

  const searchBarClasses = [
    styles.searchBar,
    styles[size],
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  return (
    <form className={searchBarClasses} onSubmit={handleSubmit}>
      <Search className={styles.searchIcon} size={size === 'sm' ? 16 : 20} />
      <input
        type="text"
        className={styles.input}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {localValue && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
};

export default SearchBar;
