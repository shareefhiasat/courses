import React, { useState } from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
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
  placeholder,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const { t } = useLang();
  const [localValue, setLocalValue] = useState(value || '');

  // Use localized placeholder if none provided
  const localizedPlaceholder = placeholder || t('search') || 'Search...';

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
      {getThemedIcon('ui', 'search', size === 'sm' ? 16 : 20)}
      <input
        type="text"
        className={styles.input}
        value={localValue}
        onChange={handleChange}
        placeholder={localizedPlaceholder}
      />
      {localValue && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
        >
          {getThemedIcon('ui', 'close', 16)}
        </button>
      )}
    </form>
  );
};

export default SearchBar;
