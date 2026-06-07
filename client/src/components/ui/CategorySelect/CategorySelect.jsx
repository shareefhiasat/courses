import React from 'react';
import { Select } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';

/**
 * CategorySelect Component
 * 
 * A reusable category selection dropdown with icons
 * 
 * @param {Object} props
 * @param {Array} props.categories - Array of category objects
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.placeholder - Placeholder text
 * @param {Object} props.theme - Theme object
 */
const CategorySelect = ({ categories, value, onChange, disabled = false, placeholder = 'Select category', theme = 'light' }) => {
  // Generate category options with icons
  const generateCategoryOptions = () => {
    if (!categories || categories.length === 0) {
      return [{ value: '', label: placeholder }];
    }

    return [
      { value: '', label: placeholder },
      ...categories.map(category => {
        const IconComponent = getThemedIcon('ui', category.icon || 'folder', 16, theme);
        const categoryLabel = category.nameEn || category.name || 'Category';
        const displayContent = (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{categoryLabel}</span>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              ({category.categoryType || 'General'})
            </span>
          </div>
        );
        return {
          value: category.id.toString(),
          label: categoryLabel,
          icon: IconComponent,
          displayLabel: displayContent,
          searchText: categoryLabel
        };
      })
    ];
  };

  // Get icon based on category type
  const getCategoryIcon = (categoryType, theme) => {
    const iconMap = {
      'academic': getThemedIcon('ui', 'book_open', 16, theme),
      'training': getThemedIcon('ui', 'award', 16, theme),
      'general': getThemedIcon('ui', 'folder', 16, theme),
      'military': getThemedIcon('ui', 'shield', 16, theme),
      'technical': getThemedIcon('ui', 'code', 16, theme),
      'default': getThemedIcon('ui', 'folder', 16, theme)
    };

    const type = (categoryType || '').toLowerCase();
    return iconMap[type] || iconMap.default;
  };

  const options = generateCategoryOptions();

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e)}
      options={options}
      disabled={disabled}
    />
  );
};

export default CategorySelect;
