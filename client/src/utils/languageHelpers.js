/**
 * Language Helper Utilities
 * 
 * Purpose: Helper functions for language-aware display of lookup data
 */

export { getEntityDisplayName } from './entityDisplayName.js';

/**
 * Get localized name from lookup object based on current language
 * @param {Object} item - Lookup item with nameEn, nameAr properties
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {string} Localized name
 */
export const getLocalizedName = (item, lang = 'en') => {
  if (!item) return '';
  
  // Prefer the current language, fallback to English, then to code
  if (lang === 'ar' && item.nameAr) {
    return item.nameAr;
  } else if (item.nameEn) {
    return item.nameEn;
  } else {
    return item.code || '';
  }
};

/**
 * Get localized description from lookup object based on current language
 * @param {Object} item - Lookup item with descriptionEn, descriptionAr properties
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {string} Localized description
 */
export const getLocalizedDescription = (item, lang = 'en') => {
  if (!item) return '';
  
  if (lang === 'ar' && item.descriptionAr) {
    return item.descriptionAr;
  } else if (item.descriptionEn) {
    return item.descriptionEn;
  } else {
    return item.description || '';
  }
};

/**
 * Get localized title from lookup object based on current language
 * @param {Object} item - Lookup item with titleEn, titleAr properties
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {string} Localized title
 */
export const getLocalizedTitle = (item, lang = 'en') => {
  if (!item) return '';
  
  if (lang === 'ar' && item.titleAr) {
    return item.titleAr;
  } else if (item.titleEn) {
    return item.titleEn;
  } else {
    return '';
  }
};

/**
 * Get localized content from lookup object based on current language
 * @param {Object} item - Lookup item with contentEn, contentAr properties
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {string} Localized content
 */
export const getLocalizedContent = (item, lang = 'en') => {
  if (!item) return '';
  
  if (lang === 'ar' && item.contentAr) {
    return item.contentAr;
  } else if (item.contentEn) {
    return item.contentEn;
  } else {
    return '';
  }
};

/**
 * Create dropdown options array with localized labels
 * @param {Array} items - Array of lookup items
 * @param {string} lang - Current language ('en' or 'ar')
 * @param {Function} valueField - Function to get value from item (default: item => item.id)
 * @param {Function} labelField - Function to get label from item (default: uses getLocalizedName)
 * @returns {Array} Array of {value, label} objects
 */
export const createDropdownOptions = (
  items, 
  lang = 'en', 
  valueField = (item) => item.id,
  labelField = null
) => {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => ({
    value: valueField(item),
    label: labelField ? labelField(item, lang) : getLocalizedName(item, lang)
  }));
};

/**
 * Create AG-Grid column value getter for localized display
 * @param {string} lang - Current language ('en' or 'ar')
 * @param {string} field - Field name to get from data
 * @param {Array} lookupData - Array of lookup items
 * @returns {Function} Value getter function
 */
export const createLocalizedValueGetter = (lang, field, lookupData) => {
  return (params) => {
    const value = params?.data?.[field];
    if (!value || !Array.isArray(lookupData)) return value;
    
    const lookupItem = lookupData.find(item => item.id === value);
    return lookupItem ? getLocalizedName(lookupItem, lang) : value;
  };
};

/**
 * Common lookup field configurations for different field types
 */
export const LOOKUP_FIELDS = {
  NAME: { en: 'nameEn', ar: 'nameAr' },
  DESCRIPTION: { en: 'descriptionEn', ar: 'descriptionAr' },
  TITLE: { en: 'titleEn', ar: 'titleAr' },
  CONTENT: { en: 'contentEn', ar: 'contentAr' }
};

/**
 * Get localized field value based on field type
 * @param {Object} item - Lookup item
 * @param {string} fieldType - Field type from LOOKUP_FIELDS
 * @param {string} lang - Current language
 * @returns {string} Localized value
 */
export const getLocalizedFieldValue = (item, fieldType, lang = 'en') => {
  if (!item || !fieldType) return '';
  
  const fieldConfig = LOOKUP_FIELDS[fieldType];
  if (!fieldConfig) return '';
  
  const arField = fieldConfig.ar;
  const enField = fieldConfig.en;
  
  if (lang === 'ar' && item[arField]) {
    return item[arField];
  } else if (item[enField]) {
    return item[enField];
  }
  
  return '';
};
