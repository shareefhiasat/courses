/**
 * Data Helper Functions
 * Provides utilities for general data type operations and validations
 */

/**
 * Safe JSON parse with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed object or fallback
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};

/**
 * Safe JSON stringify
 * @param {any} data - Data to stringify
 * @param {string} fallback - Fallback string if stringifying fails
 * @returns {string} JSON string or fallback
 */
export const safeJsonStringify = (data, fallback = '{}') => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.warn('Failed to stringify JSON:', error);
    return fallback;
  }
};

/**
 * Check if value is a valid number
 * @param {any} value - Value to check
 * @returns {boolean} True if valid number
 */
export const isValidNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Convert value to number with fallback
 * @param {any} value - Value to convert
 * @param {number} fallback - Fallback value
 * @returns {number} Converted number or fallback
 */
export const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isValidNumber(num) ? num : fallback;
};

/**
 * Check if value is a valid date
 * @param {any} value - Value to check
 * @returns {boolean} True if valid date
 */
export const isValidDate = (value) => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Parse date string with fallback
 * @param {string} dateString - Date string to parse
 * @param {Date} fallback - Fallback date
 * @returns {Date} Parsed date or fallback
 */
export const parseDate = (dateString, fallback = new Date()) => {
  if (!dateString) return fallback;
  
  const date = new Date(dateString);
  return isValidDate(date) ? date : fallback;
};

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

/**
 * Remove null and undefined values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
export const removeNullish = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

/**
 * Generate unique ID
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(null, args);
    }
  };
};

export default {
  safeJsonParse,
  safeJsonStringify,
  isValidNumber,
  toNumber,
  isValidDate,
  parseDate,
  deepClone,
  removeNullish,
  generateId,
  debounce,
  throttle
};
