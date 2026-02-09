import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { FILTER_CONFIGS } from '@constants/filterConfig.js';
import Select from '../Select/Select';

/**
 * Reusable FilterSelect component that uses centralized filter configuration
 * Eliminates repetitive Select elements across pages
 */
const FilterSelect = ({ 
  filterKey, 
  value, 
  onChange, 
  data = [], 
  additionalPlaceholderText = '',
  placeholder = '',
  style = {},
  ...props 
}) => {
  const { theme } = useTheme();
  const { t } = useLang();
  
  const config = FILTER_CONFIGS[filterKey];
  if (!config) {
    console.warn(`FilterSelect: No configuration found for filterKey "${filterKey}"`);
    return null;
  }

  // Generate options based on data and configuration
  const options = [
    {
      value: config.allOption.value,
      label: t(config.allOption.label) || additionalPlaceholderText || 'All',
      icon: getThemedIcon('ui', config.allOption.icon, 16, theme)
    },
    ...data.map(item => {
      const itemValue = typeof item === 'object' ? (item.value || item.id || item.docId) : item;
      const itemLabel = typeof item === 'object' 
        ? (item.name_en || item.name || item.label || item.title || item.code || itemValue)
        : itemValue;
      
      return {
        value: itemValue,
        label: itemLabel,
        icon: getThemedIcon('ui', config.allOption.icon, 16, theme)
      };
    })
  ];

  // Handle change events
  const handleChange = (e) => {
    const newValue = e?.target?.value !== undefined ? e.target.value : e;
    onChange?.(newValue);
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      options={options}
      placeholder={placeholder || t(config.placeholder) || 'Select...'}
      fullWidth
      searchable
      style={style}
      {...props}
    />
  );
};

export default FilterSelect;
