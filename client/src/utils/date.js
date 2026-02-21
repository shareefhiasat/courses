export const getTimeFormatPreference = () => {
  try {
    return localStorage.getItem('timeFormat') || '24h';
  } catch {
    return '24h';
  }
};

import logger from './logger';

export const formatDate = (value) => {
  if (!value) return '';
  const d = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  try {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    const pad = (n) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
};

export const setTimeFormatPreference = (fmt) => {
  try { localStorage.setItem('timeFormat', fmt); } catch {}
};

export const formatDateTime = (value, fmt) => {
  if (!value) return '';
  const d = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  const hour12 = (fmt || getTimeFormatPreference()) === '12h';
  try {
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12
    });
  } catch {
    // Fallback
    const pad = (n) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const mins = pad(d.getMinutes());
    if (hour12) {
      const suffix = hh >= 12 ? 'PM' : 'AM';
      hh = hh % 12 || 12;
      return `${dd}/${mm}/${yyyy} ${pad(hh)}:${mins} ${suffix}`;
    }
    return `${dd}/${mm}/${yyyy} ${pad(hh)}:${mins}`;
  }
};

/**
 * Get localized month names
 * @param {Function} t - Translation function
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {Array} Array of localized month names
 */
export const getMonthNames = (t, lang = 'en') => {
  const monthNames = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };
  
  return monthNames[lang] || monthNames.en;
};

/**
 * Get localized day names
 * @param {Function} t - Translation function
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {Array} Array of localized day names
 */
export const getDayNames = (t, lang = 'en') => {
  const dayNames = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  };
  
  return dayNames[lang] || dayNames.en;
};

/**
 * Get current language from translation function
 * @param {Function} t - Translation function
 * @returns {string} Current language ('en' or 'ar')
 */
export const getCurrentLanguage = (t) => {
  if (!t || typeof t !== 'function') return 'en';
  
  // Check if any Arabic translation is present
  const arabicIndicators = ['الإثنين', 'يناير', 'فبراير', 'مارس', 'أبريل'];
  const sampleText = t('mon') || '';
  
  return arabicIndicators.some(indicator => sampleText.includes(indicator)) ? 'ar' : 'en';
};

/**
 * Format localized date string
 * @param {Date|string} date - Date object or date string
 * @param {Function} t - Translation function
 * @param {string} lang - Current language (optional, will be detected if not provided)
 * @returns {string} Formatted date string with localized month and day names
 */
export const formatLocalizedDate = (date, t, lang) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const currentLang = lang || getCurrentLanguage(t);
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    return typeof date === 'string' ? date : (currentLang === 'ar' ? 'تاريخ غير صالح' : 'Invalid Date');
  }
  
  // Only use Arabic month/day names if the entire language is Arabic
  // Not just based on individual words like 'الإثنين'
  const isArabicLanguage = currentLang === 'ar';
  
  const monthNames = getMonthNames(t, currentLang);
  const dayNames = getDayNames(t, currentLang);
  
  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();
  const dayName = dayNames[dateObj.getDay()];
  
  return `${month} ${day}, ${dayName} ${dateObj.getFullYear()}`;
};

/**
 * Format localized date with time
 * @param {Date|string} date - Date object or date string
 * @param {Function} t - Translation function
 * @param {string} lang - Current language (optional)
 * @returns {Object} Object with formatted date string and time
 */
export const formatLocalizedDateTime = (date, t, lang) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const currentLang = lang || getCurrentLanguage(t);
  
  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    const invalidText = typeof date === 'string' ? date : (currentLang === 'ar' ? 'تاريخ غير صالح' : 'Invalid Date');
    return {
      date: invalidText,
      time: '--:--',
      fullDateTime: invalidText
    };
  }
  
  const monthNames = getMonthNames(t, currentLang);
  const dayNames = getDayNames(t, currentLang);
  
  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();
  const dayName = dayNames[dateObj.getDay()];
  
  // Format time
  const time = dateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return {
    date: `${month} ${day}, ${dayName} ${dateObj.getFullYear()}`,
    time: time,
    fullDateTime: `${month} ${day}, ${dayName} ${dateObj.getFullYear()} ${time}`
  };
};

// ============================================================================
// FIRESTORE DATE UTILITIES - Centralized date management for Firebase services
// ============================================================================

/**
 * Validates if a date is within Firestore's acceptable range
 * Firestore timestamps must be between year 1970 and 3000
 * @param {Date} date - The date to validate
 * @returns {boolean} - True if date is valid for Firestore
 */
export const isValidFirestoreDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  const year = date.getFullYear();
  const timestamp = date.getTime();
  
  // Basic validation - just ensure it's a reasonable date
  // Firestore can handle a wide range, so we just exclude obviously wrong dates
  return (
    year >= 1900 && 
    year <= 2050 && 
    timestamp > 0
  );
};

/**
 * Converts various date formats to a valid Date object
 * @param {string|Date|Object} dateInput - The date input to convert
 * @returns {Date|null} - Valid Date object or null if invalid
 */
export const normalizeDate = (dateInput) => {
  if (!dateInput) return null;
  
  let date;
  
  if (typeof dateInput === 'string') {
    // Handle ISO string from datetime-local input
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'object' && dateInput.toDate) {
    // Handle Firestore Timestamp
    date = dateInput.toDate();
  } else if (typeof dateInput === 'number') {
    // Handle timestamp numbers
    date = new Date(dateInput);
  } else {
    // Fallback: try to convert whatever we received
    date = new Date(dateInput);
  }
  
  return isValidFirestoreDate(date) ? date : null;
};

/**
 * Converts date fields in an object to Firestore Timestamps
 * Extremely simple - no validation, just try to convert
 * @param {Object} data - The data object containing date fields
 * @param {string[]} dateFields - Array of field names that contain dates
 * @param {Function} TimestampConstructor - Firestore Timestamp constructor
 * @returns {Object} - The data object with dates converted to Timestamps
 */
export const convertDatesToTimestamps = (data, dateFields = ['dueDate', 'startDate', 'endDate'], TimestampConstructor) => {
  if (!data || typeof data !== 'object' || !TimestampConstructor) {
    return data;
  }
  
  const converted = { ...data };
  
  dateFields.forEach(fieldName => {
    if (data[fieldName]) {
      try {
        // Just try to convert - no validation, no complexity
        converted[fieldName] = new TimestampConstructor(new Date(data[fieldName]));
      } catch (error) {
        // If it fails, keep the original value
        logger.log(`Keeping original date for ${fieldName}:`, data[fieldName]);
      }
    }
  });
  
  return converted;
};

/**
 * Safely converts a single date field to Firestore Timestamp
 * @param {string|Date|Object} dateInput - The date input to convert
 * @returns {Timestamp|null} - Firestore Timestamp or null if invalid
 */
export const convertSingleDateToTimestamp = (dateInput) => {
  const normalizedDate = normalizeDate(dateInput);
  
  if (!normalizedDate) {
    return null;
  }
  
  try {
    // Import Timestamp dynamically to avoid circular dependencies
    const { Timestamp } = require('firebase/firestore');
    return new Timestamp(normalizedDate);
  } catch (error) {
    console.warn('Failed to convert single date to timestamp:', {
      input: dateInput,
      normalized: normalizedDate,
      error: error.message
    });
    return null;
  }
};

/**
 * Converts Firestore timestamps to ISO strings for form inputs
 * @param {Object} data - The data object containing timestamp fields
 * @param {string[]} dateFields - Array of field names that contain timestamps
 * @returns {Object} - The data object with timestamps converted to ISO strings
 */
export const convertTimestampsToISOStrings = (data, dateFields = ['dueDate', 'startDate', 'endDate']) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const converted = { ...data };
  
  dateFields.forEach(fieldName => {
    if (data[fieldName]) {
      try {
        if (typeof data[fieldName] === 'object' && data[fieldName].toDate) {
          // Handle Firestore Timestamp
          converted[fieldName] = data[fieldName].toDate().toISOString();
        } else if (data[fieldName] instanceof Date) {
          // Handle Date object
          converted[fieldName] = data[fieldName].toISOString();
        } else if (typeof data[fieldName] === 'string') {
          // Keep ISO strings as-is
          converted[fieldName] = data[fieldName];
        } else {
          // Try to convert whatever we received
          const date = new Date(data[fieldName]);
          if (!isNaN(date.getTime())) {
            converted[fieldName] = date.toISOString();
          } else {
            console.warn(`Could not convert ${fieldName} to ISO string:`, data[fieldName]);
            converted[fieldName] = undefined;
          }
        }
      } catch (error) {
        console.warn(`Error converting ${fieldName} to ISO string:`, {
          input: data[fieldName],
          error: error.message
        });
        converted[fieldName] = undefined;
      }
    }
  });
  
  return converted;
};

/**
 * Checks if an object has any valid date fields
 * @param {Object} data - The data object to check
 * @param {string[]} dateFields - Array of field names that contain dates
 * @returns {boolean} - True if any valid date fields exist
 */
export const hasValidDates = (data, dateFields = ['dueDate', 'startDate', 'endDate']) => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  return dateFields.some(fieldName => {
    return data[fieldName] && normalizeDate(data[fieldName]) !== null;
  });
};

/**
 * Gets a human-readable error message for date validation failures
 * @param {string} fieldName - The name of the field that failed
 * @param {*} inputValue - The invalid input value
 * @returns {string} - Human-readable error message
 */
export const getDateErrorMessage = (fieldName, inputValue) => {
  return `Invalid ${fieldName}: "${inputValue}". Please use a valid date between 1970 and 3000.`;
};

// Export configuration for common date fields
export const COMMON_DATE_FIELDS = {
  ACTIVITY: ['dueDate', 'startDate', 'endDate'],
  QUIZ: ['startDate', 'endDate', 'dueDate'],
  ENROLLMENT: ['enrollmentDate', 'completionDate'],
  ATTENDANCE: ['date', 'checkInTime', 'checkOutTime'],
  resources: ['dueDate']
};
