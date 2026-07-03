import React from 'react';
import { Select } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { getCategoryPurposeLabelKey } from '@constants/categoryPurpose.js';

/**
 * CategorySelect — purpose-aware dropdown for CategoryTypes.
 *
 * @param {'access'|'content'} purpose — access = UCA/programs; content = activity/resource tabs
 */
const CategorySelect = ({
  categories,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select category',
  theme = 'light',
  purpose = 'access',
}) => {
  const { lang, t } = useLang();

  const purposeShortKey = purpose === 'content'
    ? 'category_purpose_content_short'
    : 'category_purpose_access_scope_short';

  const generateCategoryOptions = () => {
    if (!categories || categories.length === 0) {
      return [{ value: '', label: placeholder }];
    }

    return [
      { value: '', label: placeholder },
      ...categories.map((category) => {
        const IconComponent = getThemedIcon('ui', category.icon || 'folder', 16, theme);
        const categoryLabel = lang === 'ar'
          ? (category.nameAr || category.nameEn || category.name || t('category'))
          : (category.nameEn || category.nameAr || category.name || t('category'));
        const purposeBadge = t(getCategoryPurposeLabelKey(category));
        const displayContent = (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{categoryLabel}</span>
            <span style={{
              color: purpose === 'content' ? '#7c3aed' : '#2563eb',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              background: purpose === 'content' ? 'rgba(124,58,237,0.1)' : 'rgba(37,99,235,0.1)',
              padding: '1px 6px',
              borderRadius: 999,
            }}>
              {purposeBadge}
            </span>
          </div>
        );
        return {
          value: category.id.toString(),
          label: categoryLabel,
          icon: IconComponent,
          displayLabel: displayContent,
          searchText: `${categoryLabel} ${purposeBadge}`,
        };
      }),
    ];
  };

  const options = generateCategoryOptions();

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e)}
      options={options}
      disabled={disabled}
      placeholder={placeholder || t(purposeShortKey)}
    />
  );
};

export default CategorySelect;
