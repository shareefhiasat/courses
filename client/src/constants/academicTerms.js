/**
 * Academic Terms Configuration
 * Centralized configuration for academic terms with localization support
 */

export const ACADEMIC_TERMS = {
  FALL: {
    value: 'fall',
    label: { en: 'Fall', ar: 'خريف' },
    labelKey: 'term_fall',
    order: 1
  },
  SPRING: {
    value: 'spring', 
    label: { en: 'Spring', ar: 'ربيع' },
    labelKey: 'term_spring',
    order: 2
  },
  WINTER: {
    value: 'winter',
    label: { en: 'Winter', ar: 'شتاء' },
    labelKey: 'term_winter',
    order: 3
  },
  SUMMER: {
    value: 'summer',
    label: { en: 'Summer', ar: 'صيف' },
    labelKey: 'term_summer',
    order: 4
  }
};

/**
 * Get all academic terms as array for dropdown options
 * @param {string} lang - Language code ('en' | 'ar')
 * @param {Function} t - Translation function
 * @returns {Array} Array of term options with value and label
 */
export const getAcademicTermOptions = (lang = 'en', t = (key) => key) => {
  return Object.values(ACADEMIC_TERMS)
    .sort((a, b) => a.order - b.order)
    .map(term => ({
      value: term.value,
      label: t(term.labelKey) || term.label[lang] || term.label.en
    }));
};

/**
 * Get localized term label by value
 * @param {string} termValue - Term value (e.g., 'fall', 'spring')
 * @param {string} lang - Language code ('en' | 'ar')
 * @param {Function} t - Translation function
 * @returns {string} Localized term label
 */
export const getAcademicTermLabel = (termValue, lang = 'en', t = (key) => key) => {
  const term = Object.values(ACADEMIC_TERMS).find(term => term.value === termValue);
  if (!term) return termValue;
  
  return t(term.labelKey) || term.label[lang] || term.label.en;
};

/**
 * Get all term values for filtering
 * @returns {Array} Array of term values
 */
export const getAcademicTermValues = () => {
  return Object.values(ACADEMIC_TERMS).map(term => term.value);
};

/**
 * Default term options for components that don't need localization
 */
export const DEFAULT_TERM_OPTIONS = [
  { value: 'fall', label: 'Fall' },
  { value: 'spring', label: 'Spring' },
  { value: 'winter', label: 'Winter' },
  { value: 'summer', label: 'Summer' }
];
