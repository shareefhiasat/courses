import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Simple FilterSelect component - Native HTML select with proper styling
 * Bypasses complex configuration for direct, reliable functionality
 */
const SimpleFilterSelect = ({ 
  filterKey, 
  value, 
  onChange, 
  data = [], 
  fullWidth = false,
  disabled = false,
  className = '',
  placeholder = 'Select...',
  ...props 
}) => {
  const { t } = useLang();
  const { theme } = useTheme();
  
  info('🔍 [SimpleFilterSelect] Component render:', {
    filterKey,
    value,
    dataLength: data?.length || 0,
    fullWidth,
    disabled,
    className,
    sampleData: data?.[0]
  });

  // Generate options directly from data
  const options = [
    { value: 'all', label: t(`all_${filterKey}`) || `All ${filterKey}` },
    ...data.map(item => {
      const itemValue = item.id || item.docId || item.value;
      const itemLabel = item.nameEn || item.name || item.label || item.code || itemValue;
      return {
        value: itemValue,
        label: itemLabel
      };
    })
  ];

  info('🔍 [SimpleFilterSelect] Generated options:', {
    optionsCount: options.length,
    placeholder,
    firstOption: options[0],
    theme
  });

  return (
    <div className={className}>
      <select
        value={value}
        onChange={(e) => {
          info('🔄 [SimpleFilterSelect] onChange triggered:', {
            oldValue: value,
            newValue: e.target.value,
            filterKey
          });
          onChange(e.target.value);
        }}
        disabled={disabled}
        className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${fullWidth ? 'w-full' : 'min-w-[120px] max-w-[180px]'}`}
        style={{
          appearance: 'menulist',
          WebkitAppearance: 'menulist',
          MozAppearance: 'menulist'
        }}
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

export default SimpleFilterSelect;
