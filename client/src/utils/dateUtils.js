/**
 * Date utility functions for consistent date/time formatting across the application
 * All dates are displayed in Qatar timezone (UTC+3)
 */

/**
 * Coerce DB/API date values (ISO string, ms, or Unix seconds) for display.
 */
export function coerceDateValue(dateValue) {
  if (dateValue == null || dateValue === '') return null;
  if (typeof dateValue === 'number' && Number.isFinite(dateValue)) {
    // Values below ~year 2001 in ms are treated as Unix seconds
    return dateValue < 1e12 ? new Date(dateValue * 1000) : new Date(dateValue);
  }
  return dateValue;
}

/**
 * Format date with time in Qatar timezone
 * @param {Date|string|number} dateValue - Date to format
 * @param {string} lang - Language code ('en' or 'ar')
 * @param {string} [emptyLabel='—'] - Label when value is missing
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (dateValue, lang = 'en', emptyLabel = '—') => {
  const coerced = coerceDateValue(dateValue);
  if (!coerced) return emptyLabel;
  
  try {
    const date = coerced instanceof Date ? coerced : new Date(coerced);
    if (isNaN(date.getTime())) {
      return emptyLabel;
    }
    
    const locale = lang === 'ar' ? 'ar-QA' : 'en-GB';
    const datePart = date.toLocaleDateString(locale, {
      timeZone: 'Asia/Qatar',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      numberingSystem: 'latn',
    });
    const timePart = date.toLocaleTimeString(locale, {
      timeZone: 'Asia/Qatar',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      numberingSystem: 'latn',
    });
    return `${datePart}, ${timePart}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return emptyLabel;
  }
};

/**
 * Format date only (without time) in Qatar timezone
 * @param {Date|string} dateValue - Date to format
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {string} Formatted date
 */
export const formatDateOnly = (dateValue, lang = 'en') => {
  if (!dateValue) return '—';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return dateValue;
    }
    
    const options = {
      timeZone: 'Asia/Qatar',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      numberingSystem: 'latn'
    };
    
    return date.toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-GB', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateValue;
  }
};

/**
 * Format time only in Qatar timezone
 * @param {Date|string} dateValue - Date to format
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {string} Formatted time
 */
export const formatTimeOnly = (dateValue, lang = 'en') => {
  if (!dateValue) return '—';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return dateValue;
    }
    
    const options = {
      timeZone: 'Asia/Qatar',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      numberingSystem: 'latn'
    };
    
    return date.toLocaleTimeString(lang === 'ar' ? 'ar-QA' : 'en-US', options);
  } catch (error) {
    console.error('Error formatting time:', error);
    return dateValue;
  }
};

/**
 * Get relative time in Qatar timezone (e.g., "2 hours ago")
 * @param {Date|string} dateValue - Date to format
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {string} Relative time
 */
export const getRelativeTime = (dateValue, lang = 'en') => {
  if (!dateValue) return '—';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return dateValue;
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (lang === 'ar') {
      if (diffSeconds < 60) return 'الآن';
      if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
    } else {
      if (diffSeconds < 60) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    // If older than 7 days, show formatted date
    return formatDateTime(dateValue, lang);
  } catch (error) {
    console.error('Error getting relative time:', error);
    return formatDateTime(dateValue, lang);
  }
};
