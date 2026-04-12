import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getFilterConfig, generateFilterOptions, getFilterPlaceholder } from '@constants/filterConfig';
import { info, error, warn, debug } from '@services/utils/logger.js';

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
  
  info('🔍 [FilterSelect] Component render:', {
    filterKey,
    value,
    dataLength: data?.length || 0,
    fullWidth,
    disabled,
    className
  });
  
  const config = getFilterConfig(filterKey);
  
  if (!config) {
    error(`❌ [FilterSelect] Filter config not found for key: ${filterKey}`);
    return null;
  }

  info('🔍 [FilterSelect] Config found:', config);

  const options = generateFilterOptions(config, data, theme, t);
  const placeholder = getFilterPlaceholder(config, t, additionalPlaceholderText);

  info('🔍 [FilterSelect] Generated options:', {
    optionsCount: options?.length || 0,
    placeholder,
    firstOption: options?.[0],
    theme
  });

  return (
    <div className={className}>
      <select
        value={value}
        onChange={(e) => {
          info('🔄 [FilterSelect] onChange triggered:', {
            oldValue: value,
            newValue: e.target.value,
            filterKey
          });
          onChange(e.target.value);
        }}
        disabled={disabled}
        className={`px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${fullWidth ? 'w-full' : 'min-w-[100px] max-w-[150px]'}`}
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

