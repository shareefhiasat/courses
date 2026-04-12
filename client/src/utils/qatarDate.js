import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Qatar Date Standardization
 * 
 * SINGLE SOURCE OF TRUTH for all date operations in the system.
 * Uses Qatar timezone (UTC+3) and consistent format: "February 7, 2026 at 5:01:45 PM UTC+3"
 * 
 * NO MORE CONVERSIONS - Store everything in Qatar time, display in Qatar time.
 */

// Qatar timezone constant
export const QATAR_TIMEZONE = 'Asia/Qatar'; // UTC+3
export const QATAR_UTC_OFFSET = '+03:00';

/**
 * Get current date/time in Qatar timezone
 * @returns {Date} Date object representing current Qatar time
 */
export function getQatarNow() {
  const now = new Date();
  // Qatar is UTC+3, so we add 3 hours to get local Qatar time
  return new Date(now.getTime() + (3 * 60 * 60 * 1000));
}

/**
 * Format date in STANDARD Qatar format: "FEB 7, 2026 at 5:01:45 PM"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatQatarStandard(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    // Handle Firestore timestamps (seconds) or milliseconds
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else if (date?.toDate) {
    // Handle Firestore Timestamp object
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  // Convert to Qatar time (UTC+3)
  const qatarTime = new Date(dateObj.getTime() + (3 * 60 * 60 * 1000));
  
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  const month = months[qatarTime.getMonth()];
  const day = qatarTime.getDate();
  const year = qatarTime.getFullYear();
  
  let hours = qatarTime.getHours();
  const minutes = qatarTime.getMinutes();
  const seconds = qatarTime.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12; // 0 should be 12
  
  const pad = (n) => String(n).padStart(2, '0');
  
  return `${month} ${day}, ${year} at ${hours}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
}

/**
 * Format date in FULL Qatar format with UTC offset: "February 7, 2026 at 5:01:45 PM UTC+3"
 * This is used for storing dates in Firebase as formatted strings
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string with UTC offset
 */
export function formatQatarFull(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    // Handle Firestore timestamps (seconds) or milliseconds
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else if (date?.toDate) {
    // Handle Firestore Timestamp object
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  // Convert to Qatar time (UTC+3)
  const qatarTime = new Date(dateObj.getTime() + (3 * 60 * 60 * 1000));
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = months[qatarTime.getMonth()];
  const day = qatarTime.getDate();
  const year = qatarTime.getFullYear();
  
  let hours = qatarTime.getHours();
  const minutes = qatarTime.getMinutes();
  const seconds = qatarTime.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12; // 0 should be 12
  
  const pad = (n) => String(n).padStart(2, '0');
  
  return `${month} ${day}, ${year} at ${hours}:${pad(minutes)}:${pad(seconds)} ${ampm} UTC+3`;
}

/**
 * Get current Qatari timestamp as formatted string for storage
 * @returns {string} Current date/time in format: "February 7, 2026 at 5:01:45 PM UTC+3"
 */
export function getQatarTimestampString() {
  return formatQatarFull(getQatarNow());
}

/**
 * Format date for form inputs (datetime-local)
 * Returns format: "2026-02-11T15:30"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Date string for form input
 */
export function formatQatarForInput(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else if (date?.toDate) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  // Convert to Qatar time
  const qatarTime = new Date(dateObj.getTime() + (3 * 60 * 60 * 1000));
  
  const year = qatarTime.getFullYear();
  const month = String(qatarTime.getMonth() + 1).padStart(2, '0');
  const day = String(qatarTime.getDate()).padStart(2, '0');
  const hours = String(qatarTime.getHours()).padStart(2, '0');
  const minutes = String(qatarTime.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse date from form input (datetime-local)
 * Creates a Date object in Qatar timezone
 * @param {string} dateString - Date string from form input
 * @returns {Date} Date object in Qatar timezone
 */
export function parseQatarFromInput(dateString) {
  if (!dateString) return null;
  
  // Parse the input as if it's Qatar time
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  // Adjust for Qatar timezone (subtract 3 hours to get proper UTC representation)
  return new Date(date.getTime() - (3 * 60 * 60 * 1000));
}

/**
 * Create Firestore Timestamp from Qatar date
 * @param {Date|string|number} date - Date in Qatar timezone
 * @returns {Timestamp} Firestore Timestamp
 */
export function qatarDateToTimestamp(date) {
  if (!date) return null;
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return null;
  
  // Import dynamically to avoid circular dependencies
  const { Timestamp } = require('firebase/firestore');
  return new Timestamp(dateObj);
}

/**
 * Convert Firestore Timestamp to Qatar standard format
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {string} Formatted date string
 */
export function timestampToQatarStandard(timestamp) {
  if (!timestamp) return '';
  return formatQatarStandard(timestamp);
}

/**
 * Get relative time in Qatar timezone (e.g., "2 minutes ago")
 * @param {Date|string|number} date - Date to compare
 * @returns {string} Relative time string
 */
export function getQatarTimeAgo(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else if (date?.toDate) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  const now = getQatarNow();
  const diffMs = now - dateObj;
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) return 'just now';
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(diffSeconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return 'just now';
}

/**
 * Legacy compatibility functions - DEPRECATED
 * These exist only to prevent breaking changes during migration
 */
export function formatQatarDate(date) {
  warn('formatQatarDate is deprecated. Use formatQatarStandard instead.');
  return formatQatarStandard(date);
}

export function toQatarTime(date) {
  console.warn('toQatarTime is deprecated. Dates should already be in Qatar time.');
  return date;
}

/**
 * Format date in short format: "Feb 7, 2026"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Short date string
 */
export function formatQatarShort(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else if (date?.toDate) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  // Convert to Qatar time
  const qatarTime = new Date(dateObj.getTime() + (3 * 60 * 60 * 1000));
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[qatarTime.getMonth()]} ${qatarTime.getDate()}, ${qatarTime.getFullYear()}`;
}

/**
 * Format date only: "February 7, 2026"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Date only string
 */
export function formatQatarDateOnly(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else if (date?.toDate) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  // Convert to Qatar time
  const qatarTime = new Date(dateObj.getTime() + (3 * 60 * 60 * 1000));
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return `${months[qatarTime.getMonth()]} ${qatarTime.getDate()}, ${qatarTime.getFullYear()}`;
}

/**
 * Format time only: "5:01:45 PM"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Time only string
 */
export function formatQatarTimeOnly(date) {
  if (!date) return '';
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else if (date?.toDate) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return '';
  
  // Convert to Qatar time
  const qatarTime = new Date(dateObj.getTime() + (3 * 60 * 60 * 1000));
  
  let hours = qatarTime.getHours();
  const minutes = qatarTime.getMinutes();
  const seconds = qatarTime.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12;
  
  const pad = (n) => String(n).padStart(2, '0');
  
  return `${hours}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
}

// Export the main function as default for easy importing
export default formatQatarStandard;
