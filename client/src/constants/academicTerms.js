import { info, error, warn, debug } from '../services/utils/logger.js';

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
  SUMMER: {
    value: 'summer',
    label: { en: 'Summer', ar: 'صيف' },
    labelKey: 'term_summer',
    order: 3
  },
  WINTER: {
    value: 'winter',
    label: { en: 'Winter', ar: 'شتاء' },
    labelKey: 'term_winter',
    order: 4
  }
};

// Helper functions
export const getAcademicTermLabel = (term, lang = 'en') => {
  if (!term) return term;
  const termStr = String(term);
  
  // Try exact match first
  let termConfig = Object.values(ACADEMIC_TERMS).find(t => t.value === termStr);
  
  // Try case-insensitive match (e.g., "Fall" -> "fall")
  if (!termConfig) {
    termConfig = Object.values(ACADEMIC_TERMS).find(t => t.value === termStr.toLowerCase());
  }
  
  // Try extracting term from compound format like "2025-SPRING" or "2024-FALL"
  if (!termConfig) {
    const match = termStr.match(/^(\d{4})-([a-zA-Z]+)$/);
    if (match) {
      const year = match[1];
      const termPart = match[2].toLowerCase();
      termConfig = Object.values(ACADEMIC_TERMS).find(t => t.value === termPart);
      if (termConfig) {
        const localizedTerm = termConfig.label[lang] || termConfig.label.en || termPart;
        return `${year}-${localizedTerm}`;
      }
    }
  }
  
  if (!termConfig) return term;
  return termConfig.label[lang] || termConfig.label.en || term;
};

export const getAcademicTerms = () => {
  return Object.values(ACADEMIC_TERMS).sort((a, b) => a.order - b.order);
};

export const getAcademicTermByValue = (value) => {
  return Object.values(ACADEMIC_TERMS).find(term => term.value === value);
};

export const isValidAcademicTerm = (term) => {
  return Object.values(ACADEMIC_TERMS).some(t => t.value === term);
};

export const getAcademicTermOptions = (lang = 'en') => {
  return getAcademicTerms().map(term => ({
    value: term.value,
    label: term.label[lang] || term.label.en,
    labelKey: term.labelKey
  }));
};

export default {
  ACADEMIC_TERMS,
  getAcademicTermLabel,
  getAcademicTerms,
  getAcademicTermByValue,
  isValidAcademicTerm,
  getAcademicTermOptions
};
