/**
 * Timezone Utilities for Qatar (UTC+3)
 * Default system timezone for all date/time operations
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

import { info, error, warn, debug } from '@services/utils/logger.js';
import {
  QATAR_TIMEZONE,
  formatDate as fmtDate,
  formatTime as fmtTime,
  formatRelative as fmtRelative,
  getQatarNow as fmtQatarNow,
} from './date-formatter.js';

export { QATAR_TIMEZONE };
export const QATAR_UTC_OFFSET = '+03:00';

/**
 * Get current date/time in Qatar timezone
 * @returns {Date} Date object in Qatar timezone
 */
export function getQatarNow() {
  return fmtQatarNow();
}

/**
 * Convert UTC timestamp to Qatar timezone for display
 * @param {Date|Timestamp|string|number} date - Date to convert
 * @returns {Date} Date in Qatar timezone
 */
export function toQatarTime(date) {
  if (!date) return null;
  
  // Handle mock timestamp (removed Firebase)
  if (date?.toDate && typeof date.toDate === 'function') {
    return toZonedTime(date.toDate(), QATAR_TIMEZONE);
  }
  
  // Handle Date object
  if (date instanceof Date) {
    return toZonedTime(date, QATAR_TIMEZONE);
  }
  
  // Handle timestamp (seconds or milliseconds)
  if (typeof date === 'number') {
    const timestamp = date < 10000000000 ? date * 1000 : date; // Convert seconds to milliseconds if needed
    return toZonedTime(new Date(timestamp), QATAR_TIMEZONE);
  }
  
  // Handle string
  if (typeof date === 'string') {
    return toZonedTime(new Date(date), QATAR_TIMEZONE);
  }
  
  return null;
}

/**
 * Replace AM/PM with Arabic letters ص/م.
 * @param {string} formatted
 * @returns {string}
 */
function applyArabicAmPm(formatted) {
  return formatted
    .replace(/\bAM\b/g, 'ص')
    .replace(/\bPM\b/g, 'م');
}

/**
 * Format date in Qatar timezone for display
 * @param {Date|Timestamp|string|number} date - Date to format
 * @param {string} formatString - date-fns format string (default: 'dd/MM/yyyy, h:mm a')
 * @param {'en'|'ar'} [lang] - Language override; falls back to localStorage then 'en'
 * @returns {string} Formatted date string
 */
export function formatQatarDate(date, formatString = 'dd/MM/yyyy, h:mm a', lang) {
  if (!date) return 'N/A';
  const qatarDate = toQatarTime(date);
  if (!qatarDate) return 'N/A';
  const formatted = format(qatarDate, formatString);
  const useLang = lang || (typeof window !== 'undefined' ? localStorage.getItem('lang') : '') || 'en';
  return useLang === 'ar' ? applyArabicAmPm(formatted) : formatted;
}

/**
 * Format date in Qatar timezone (date only)
 * @param {Date|Timestamp|string|number} date - Date to format
 * @returns {string} Formatted date string (dd/MM/yyyy)
 */
export function formatQatarDateOnly(date) {
  return fmtDate(date, 'en');
}

/**
 * Format date in Qatar timezone (time only)
 * @param {Date|Timestamp|string|number} date - Date to format
 * @returns {string} Formatted time string (HH:mm)
 */
export function formatQatarTimeOnly(date) {
  return fmtTime(date, 'en');
}

/**
 * Format date as relative time in Qatar timezone (e.g., "2 minutes ago")
 * @param {Date|Timestamp|string|number} date - Date to format
 * @returns {string} Relative time string
 */
export function getQatarTimeAgo(date) {
  return fmtRelative(date, 'en');
}

/**
 * Get mock server timestamp
 * Replaced Firebase serverTimestamp with current UTC timestamp
 */
export function serverTimestamp() {
  return new Date().toISOString();
}

/**
 * Create a timestamp from Qatar timezone (converts to UTC for storage)
 * @param {Date} qatarDate - Date in Qatar timezone
 * @returns {string} ISO timestamp (UTC)
 */
export function qatarDateToTimestamp(qatarDate) {
  if (!qatarDate) return null;
  
  // Convert Qatar time to UTC
  const utcDate = fromZonedTime(qatarDate, QATAR_TIMEZONE);
  return utcDate.toISOString();
}


