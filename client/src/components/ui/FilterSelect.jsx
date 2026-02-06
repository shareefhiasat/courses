import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getFilterConfig, generateFilterOptions, getFilterPlaceholder } from '@constants/filterConfig';

/**
 * Reusable FilterSelect component with centralized configuration
 * Eliminates code duplication across all pages
 */
const FilterSelect = ({ 
  filterKey, 
  value, 
  onChange, 
  data = [], 
  fullWidth = true,
  disabled = false,
  additionalPlaceholderText = '',
  className = '',
  ...props 
}) => {
  const { t } = useLang();
  const { theme } = useTheme();
  
  const config = getFilterConfig(filterKey);
  
  if (!config) {
    console.warn(`Filter config not found for key: ${filterKey}`);
    return null;
  }

  const options = generateFilterOptions(config, data, theme, t);
  const placeholder = getFilterPlaceholder(config, t, additionalPlaceholderText);

  return (
    <div className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fullWidth ? '' : 'inline-block'}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelect;
